// Paste this file into a Supabase Edge Function named ekvivalent-send-sms.
// Required secrets: SMS_RU_API_ID, SEND_SMS_HOOK_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied by Supabase on the server.
// This endpoint accepts signed Auth webhooks only. Disable platform JWT verification
// for this function; the Standard Webhooks HMAC below authenticates every request.
export function createSmsHandler({env,fetchImpl=fetch,cryptoImpl=crypto,now=Date.now}) {
 const encoder=new TextEncoder();
 const response=(status,message)=>new Response(JSON.stringify(message?{error:{http_code:status,message}}:{}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 async function rpc(name,body){const key=env('SUPABASE_SERVICE_ROLE_KEY'),url=env('SUPABASE_URL');const r=await fetchImpl(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(900)});if(!r.ok){console.error('SMS_BUDGET_RPC_FAILED',name,r.status);throw Error('SMS budget unavailable');}return r.status===204?null:r.json();}
 return async function(req){
  if(req.method!=='POST')return response(405,'Method not allowed');
  const secret=env('SEND_SMS_HOOK_SECRET'),apiId=env('SMS_RU_API_ID');
  if(!secret||!apiId||!env('SUPABASE_URL')||!env('SUPABASE_SERVICE_ROLE_KEY'))return response(503,'SMS is not configured');
  const id=req.headers.get('webhook-id')||'',stamp=req.headers.get('webhook-timestamp')||'',signatures=req.headers.get('webhook-signature')||'';
  if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id)||!/^\d{10}$/.test(stamp)||Math.abs(now()/1000-Number(stamp))>300||signatures.length>2048)return response(401,'Invalid webhook');
  let raw='';try{const reader=req.body?.getReader();if(!reader)return response(400,'Empty body');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();return response(413,'Payload too large');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}raw=new TextDecoder().decode(bytes);
   const key=await cryptoImpl.subtle.importKey('raw',decode(secret.replace(/^v1,whsec_|^whsec_/,'')),{name:'HMAC',hash:'SHA-256'},false,['verify']);let valid=false;
   for(const signature of signatures.split(/\s+/)){const [version,sig]=signature.split(',');if(version==='v1'&&sig){try{if(await cryptoImpl.subtle.verify('HMAC',key,decode(sig),encoder.encode(id+'.'+stamp+'.'+raw)))valid=true;}catch(e){}}}
   if(!valid)return response(401,'Invalid webhook');
  }catch(e){return response(401,'Invalid webhook');}
  let data;try{data=JSON.parse(raw);}catch(e){return response(400,'Invalid payload');}
  const rawPhone=String(data?.user?.phone||''),phone=rawPhone.startsWith('+')?rawPhone:'+'+rawPhone,otp=String(data?.sms?.otp||'');
  if(!/^\+79\d{9}$/.test(phone)||!/^\d{6,10}$/.test(otp))return response(400,'Only Russian mobile numbers are supported');
  let claim;try{claim=await rpc('ekvivalent_sms_claim',{p_event_id:id,p_phone:phone});}catch(e){return response(503,'SMS budget unavailable');}
  if(claim?.status==='sent')return response(200);
  if(claim?.status==='limited')return response(429,'Daily SMS limit reached');
  if(claim?.status!=='claimed')return response(503,'SMS request is already processing');
  let sent=false;try{
   const digits=phone.slice(1);const body=new URLSearchParams({api_id:apiId,to:digits,msg:'Ekvivalent code: '+otp+'. Do not share.',json:'1'});
   const result=await fetchImpl('https://sms.ru/sms/send',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),redirect:'error',signal:AbortSignal.timeout(2500)});
   const delivery=await result.json();sent=result.ok&&delivery?.status_code===100&&delivery?.sms?.[digits]?.status_code===100;
   if(!sent)console.error('SMS_RU_SEND_FAILED',Number(delivery?.status_code)||0,Number(delivery?.sms?.[digits]?.status_code)||0);
  }catch(e){console.error('SMS_RU_CONNECTION_FAILED');}
  try{await rpc('ekvivalent_sms_finish',{p_event_id:id,p_sent:sent});}catch(e){console.error('SMS_BUDGET_FINALISE_FAILED');return response(503,'SMS status could not be saved');}
  return sent?response(200):response(503,'Could not send SMS');
 };
}
if(typeof Deno!=='undefined')Deno.serve(createSmsHandler({env:name=>Deno.env.get(name)}));
