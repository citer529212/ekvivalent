const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const store=new Map(),nodes={},requests=[],responses=[];
const node=()=>({innerHTML:'',textContent:'',dataset:{},listeners:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},removeAttribute(){},focus(){},addEventListener(k,f){(this.listeners[k]??=[]).push(f);},querySelector(){return null;},querySelectorAll(){return [];}});
const sandbox={document:{body:node(),documentElement:node(),addEventListener(){},querySelector:s=>nodes[s]??=node(),querySelectorAll:()=>[],createElement:()=>({...node(),click(){}})},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},location:{origin:'https://citer529212.github.io',pathname:'/ekvivalent/',search:'',_hash:'',get hash(){return this._hash;},set hash(v){this._hash=v&&!v.startsWith('#')?'#'+v:v;},reload(){}},history:{replaceState(a,b,url){sandbox.location.hash=url.split('#')[1]||'';}},window:{addEventListener(){},scrollTo(){},matchMedia(){return {matches:false,addEventListener(){}};}},console,Date,Math,JSON,Set,Map,Blob,URL,URLSearchParams,AbortController,FormData:class{constructor(f){this.f=f;}get(k){return this.f.values[k]??null;}},setTimeout(){},clearTimeout(){},fetch:async(url,opts)=>{requests.push({url,opts});const next=responses.shift();if(!next)throw Error('Unexpected network call '+url);assert(url.endsWith(next.path),url+' expected '+next.path);if(next.reject)throw next.reject;return {ok:(next.status||200)<400,status:next.status||200,text:async()=>JSON.stringify(next.body??null)};}};
vm.createContext(sandbox);for(const f of ['content','imported','catalog','account-config','account-bootstrap','app','enrichment','design','experience','listening-content','listening','learning','account','beta','welcome'])vm.runInContext(fs.readFileSync(f+'.js','utf8'),sandbox,{timeout:10000});

vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg);}
state=fresh();quiz=null;accountSession=null;
check(!scholarHasProgress(),'New visitor detected');location.hash='';
check(renderEnrichment('home','home')&&app.innerHTML.includes('welcome-page'),'First visit opens welcome');
location.hash='#home';render();check(!app.innerHTML.includes('welcome-page'),'Explicit home remains learning dashboard');
location.hash='';state.daily[today()]=1;check(scholarHasProgress(),'Returning learner detected');render();check(!app.innerHTML.includes('welcome-page'),'Returning learner opens dashboard');
for(let i=0;i<SCHOLAR_RANKS.length;i++){const r=SCHOLAR_RANKS[i],at=scholarRank(r.xp);check(at.index===i&&at.progress===(i===6?100:0),'Threshold '+r.name);if(i>0)check(scholarRank(r.xp-1).index===i-1,'Before threshold '+r.name);check(scholarMonkey(i).includes('rank-'+i),'Character variant '+r.name);}
check(scholarRank(999999).index===6&&scholarRank(999999).progress===100,'Final rank bounded');
check(!scholarMonkey(0).includes('monkey-cap')&&scholarMonkey(4).includes('monkey-cap'),'Academic cap unlock');
check(!scholarMonkey(0).includes('stroke="#3e536b"')&&scholarMonkey(2).includes('stroke="#3e536b"'),'Glasses unlock');
check(scholarMonkey(6).includes('monkey-tail')&&scholarMonkey(6).includes('monkey-eyes'),'Monkey character');
const guest={...fresh(),rewards:{days:{test:{earned:150,gameBonus:0}}}},a={...fresh(),rewards:{days:{test:{earned:3000,gameBonus:0}}}},b=fresh();
state=guest;check(scholarRank().rank.name==='Старший ученик','Guest rank');
state=a;check(scholarRank().rank.name==='Профессор','Own XP used');
state=b;check(scholarRank().rank.name==='Ученик','Other profile does not inherit rank');
state=JSON.parse(JSON.stringify(a));check(scholarRank().rank.name==='Профессор','Backup restores rank from XP');
const before=rewardState().total;const handler=app.listeners.click.find(fn=>fn.toString().includes('welcome-demo-feedback'));
handler({target:{closest(selector){return selector.includes('welcome-demo')?{dataset:{action:'welcome-demo:is'}}:null;}}});
check(document.querySelector('#welcome-demo-feedback').textContent.includes('Верно!'),'Demo correct answer');
handler({target:{closest(selector){return selector.includes('welcome-demo')?{dataset:{action:'welcome-demo:are'}}:null;}}});
check(document.querySelector('#welcome-demo-feedback').textContent.includes('С she используем is'),'Demo wrong answer explanation');check(rewardState().total===before,'Marketing demo cannot award XP');
const html=welcomePage();check(html.includes('11')&&html.includes('322')&&html.includes('148'),'Existing content counts');check(html.includes('без начисления XP'),'Demo clearly marked');
location.hash='#profile';render();check(app.innerHTML.includes('scholar-card')&&app.innerHTML.includes('Профессор'),'Profile route');
accountSession={user:{id:'one',email:'example@example.com',user_metadata:{display_name:'<Teacher>'}}};check(scholarProfilePage().includes('&lt;Teacher&gt;'),'Profile name escaped');check(accountPage().includes('scholar-compact'),'Character in account');
accountSetStatus('Synced');check(document.querySelector('#account-link').innerHTML.includes('Профессор'),'Header survives sync status update');
console.log('PASS: first/return visits, explicit dashboard route, all rank boundaries, accessories, independent profiles, backup, demo feedback without XP, account integration and escaping.');
`,sandbox,{timeout:20000});
