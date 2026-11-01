const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes={};const node=()=>({innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},removeAttribute(){},focus(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}});
const sandbox={document:{body:node(),documentElement:node(),addEventListener(){},querySelector:s=>nodes[s]??=node(),querySelectorAll:()=>[],createElement:()=>({...node(),click(){}})},localStorage:{getItem:()=>null,setItem(){}},location:{_hash:'',get hash(){return this._hash;},set hash(v){this._hash=v&&!v.startsWith('#')?'#'+v:v;}},history:{replaceState(){}},window:{addEventListener(){},scrollTo(){},matchMedia(){return {matches:false,addEventListener(){}};}},console,Date,Math,JSON,Set,Map,Blob,URL,setTimeout(){},clearTimeout(){},fetch:()=>Promise.reject(Error('not expected'))};
vm.createContext(sandbox);for(const f of ['content','imported','catalog','app','enrichment','design','experience','listening-content','listening','learning','beta','welcome'])vm.runInContext(fs.readFileSync(f+'.js','utf8'),sandbox,{timeout:10000});

sandbox.navigator={clipboard:{writeText:async value=>{sandbox.copied=value;}}};
sandbox.fetch=async url=>{sandbox.fetches??=[];sandbox.fetches.push(url);const path=String(url).split('?')[0];return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))};};
vm.runInContext(`
function check(ok,message){if(!ok)throw Error(message);}
check(betaNormalize('ПРИВЕ́Т')==='привет','Stress normalization');
check(betaNormalize('Ёлка')==='елка','Yo normalization');
check(betaCandidates('running').includes('run'),'Doubled stem');
check(betaCandidates('families').includes('family'),'Plural candidate');
check(betaCandidates('went').includes('go'),'Irregular verb');
check(betaCandidates("doesn’t").includes('do'),'Curly contraction');
const tokenized=betaTokenizeText('Hello, world! <script> Привет.');
check(tokenized.includes('data-word="Hello"')&&tokenized.includes('data-word="Привет"'),'Both languages tokenized');
check(!tokenized.includes('<script>')&&tokenized.includes('&lt;'),'Text escaped');
check(tokenized.includes(', ')&&tokenized.includes('! '),'Punctuation preserved');
const texts=[{id:1,level:1,topic:'Test',genre:'Test',en:'Hello, world.',ru:'Привет, мир.'}];
for(const direction of ['en-ru','ru-en']){state.reading={1:{direction}};const html=textPage('1',[texts,{}]);check(html.includes('translation-source')&&html.includes('translation-reference'),'Copy targets '+direction);check(html.includes('Копировать мой перевод')&&html.includes('Копировать образец перевода'),'Copy controls '+direction);}
const lesson=lessonPage(COURSE_LESSONS[0].id);check(lesson.includes('lesson-original')&&lesson.includes('lesson-translation'),'Lesson copy targets');
state.practice=null;startQuiz('practice',BANK.slice(0,2),'Quiet test');const before=JSON.stringify(quiz);betaSetQuiet(true);check(betaPrefs.quiet&&JSON.stringify(quiz)===before,'Quiet mode preserves session');check(quizPage().includes('Показать графику'),'Quiet toggle in test');betaSetQuiet(false);
state=fresh();quiz=null;const assistedQ=BANK.find(q=>q.level==='A1'&&isChoice(q));startQuiz('practice',[assistedQ],'Wrong');chosen=-1;submit();next();startQuiz('practice',[assistedQ],'With dictionary');quiz.betaHelp=[assistedQ.id];chosen=assistedQ.answer;submit();check(quiz.answers[0].correct&&quiz.answers[0].assisted,'Correctness separate from assistance');check(learningReviews()[assistedQ.id].stage===0,'Dictionary cannot advance recall schedule');check(learningTopic(topicBy(assistedQ.topic)).pct===0,'Dictionary does not count as independent mastery');
console.log('PASS: copy targets in both translation directions and lessons, safe tokenization, punctuation, normalization, word-form candidates, quiet mode does not reset quiz.');
`,sandbox,{timeout:20000});
(async()=>{
 await vm.runInContext(`(async()=>{
 const en=await betaLookup('government');check(en.m.includes('правительство'),'English lookup');
 const ru=await betaLookup('привет');check(ru.m.some(x=>x.includes('hello')),'Russian lookup');
 const inflected=await betaLookup('были');check(inflected.m.includes('be'),'Russian inflected form');
 const old=betaLookup;betaLookup=async()=>({w:'run',m:['бежать'],s:0,approximate:true});
 const show=betaShowPopup;let shown=[];betaShowPopup=(title,html)=>shown.push({title,html});
 quiz=null;location.hash='#text/1';await betaTranslate('running',null);check(shown.at(-1).html.includes('Возможная начальная форма'),'Approximate label');
 betaLookup=async()=>null;await betaTranslate('zzzzunlisted',null);check(shown.at(-1).html.includes('точного перевода нет'),'Honest absent word');
 betaLookup=async()=>{throw Error('offline');};await betaTranslate('word',null);check(shown.at(-1).html.includes('не загрузился'),'Retry on network failure');
 let resolveLookup;betaLookup=()=>new Promise(r=>{resolveLookup=r;});const pending=betaTranslate('late',null);betaWordRequest++;const n=shown.length;resolveLookup({w:'late',m:['поздний'],s:0});await pending;check(shown.length===n,'Late result cannot reopen closed popup');
 betaLookup=old;betaShowPopup=show;
})()`,sandbox,{timeout:20000});
 const query=sandbox.document.querySelector;sandbox.document.querySelector=selector=>selector==='#copy-test'?{value:'Мой перевод\nSecond line.'}:query(selector);
 await vm.runInContext(`betaCopy('#copy-test',null)`,sandbox);assert.equal(sandbox.copied,'Мой перевод\nSecond line.');
 sandbox.navigator.clipboard.writeText=async()=>{throw Error('denied');};
 vm.runInContext(`betaShowPopup=(title,html)=>{betaPopup={querySelector:()=>({select(){}})};window.copyFallback=html;};`,sandbox);
 await vm.runInContext(`betaCopy('#copy-test',null)`,sandbox);assert(sandbox.window.copyFallback.includes('Мой перевод'));
 console.log('PASS: real shard lookups EN/RU and inflections, honest missing words, network failure, stale-request guard, exact clipboard text, clipboard-denied fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
