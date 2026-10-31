const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes={};const node=()=>({innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},removeAttribute(){},focus(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}});
const sandbox={document:{body:node(),documentElement:node(),addEventListener(){},querySelector:s=>nodes[s]??=node(),querySelectorAll:()=>[],createElement:()=>({...node(),click(){}})},localStorage:{getItem:()=>null,setItem(){}},location:{_hash:'',get hash(){return this._hash;},set hash(v){this._hash=v&&!v.startsWith('#')?'#'+v:v;}},history:{replaceState(){}},window:{addEventListener(){},scrollTo(){},matchMedia(){return {matches:false,addEventListener(){}};}},console,Date,Math,JSON,Set,Map,Blob,URL,setTimeout(){},clearTimeout(){},fetch:()=>Promise.reject(Error('not expected'))};
vm.createContext(sandbox);for(const f of ['content','imported','catalog','app','enrichment','design','experience','listening-content','listening','learning','beta'])vm.runInContext(fs.readFileSync(f+'.js','utf8'),sandbox,{timeout:10000});

let clockNow=Date.now();
sandbox.Date=class extends Date{constructor(...args){super(...(args.length?args:[clockNow]));}static now(){return clockNow;}};
sandbox.tick=n=>{clockNow+=n;};
vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg);}
function resetLearning(){state=fresh();quiz=null;feedback=false;sessionResult=null;learningErrorFilter='due';learningErrorTopic='all';}
function answerQuestion(q,correct){startQuiz('practice',[q],'Test');chosen=correct?(isChoice(q)?q.answer:q.accepted[0]):'wrong';if(!correct&&isChoice(q))chosen=-1;submit();next();}
resetLearning();
const q=BANK.find(q=>q.level==='A1'&&isChoice(q)),day=86400000;
answerQuestion(q,false);check(state.mistakes.includes(q.id),'Wrong answer recorded');
check(learningDue().some(x=>x.id===q.id),'Wrong answer due now');
answerQuestion(q,true);check(state.mistakes.includes(q.id),'First correct keeps error');
check(learningReviews()[q.id].stage===1&&learningStats().waiting===1,'First interval');
answerQuestion(q,true);check(learningReviews()[q.id].stage===1,'Same-day repetition cannot clear error');
tick(day-1);answerQuestion(q,true);check(learningReviews()[q.id].stage===1,'Too early cannot advance');
tick(1);answerQuestion(q,true);check(learningReviews()[q.id].stage===2,'Second check after a day');
tick(2*day);answerQuestion(q,true);check(learningReviews()[q.id].stage===2,'Third check too early');
tick(day);answerQuestion(q,true);check(learningReviews()[q.id].stage===3&&!state.mistakes.includes(q.id),'Third spaced check archives');
check(learningStats().done===1,'Completed count');
answerQuestion(q,false);check(learningReviews()[q.id].stage===0&&state.mistakes.includes(q.id),'Relapse restarts cycle');
const snapshot=JSON.stringify(state);state=JSON.parse(snapshot);check(learningDue().some(x=>x.id===q.id),'Schedule survives reload');
resetLearning();state.mistakes=[q.id];check(learningReviews()[q.id].stage===0&&learningReviews()[q.id].updated===0,'Legacy mistake migration without invented dates');
check(learningDue().length===1,'Legacy error due now');
// New examples before previously answered ones; no level leak or duplicate IDs/prompts.
resetLearning();
for(const l of STUDY_LEVELS){state.studyLevel=l;const qs=learningPersonalQuestions();check(qs.length===10,'Ten questions '+l);check(qs.every(learningEligible),'Level limit '+l);check(new Set(qs.map(q=>q.id)).size===10,'Unique IDs '+l);check(new Set(qs.map(q=>q.prompt+'|'+(q.type||'c'))).size===10,'Unique examples '+l);}
state.studyLevel='A1';const unseen=learningPick(BANK.filter(x=>x.topic===q.topic),1)[0];learningState().answers[unseen.id]={at:Date.now(),correct:true,answer:'x'};check(!learningPick(BANK.filter(x=>x.topic===q.topic),1).some(x=>x.id===unseen.id),'Prefer unseen examples');
check(learningPick(BANK,0).length===0,'Zero quota');
answerQuestion(q,false);const high=BANK.find(x=>x.level==='C2');answerQuestion(high,false);
const qs=learningPersonalQuestions();check(qs.some(x=>x.id===q.id)&&!qs.some(x=>x.id===high.id),'Due errors included without higher-level leak');
startPersonal();const pending=quiz;chosen=-1;submit();quiz=null;startPersonal();check(quiz===pending&&feedback,'Personal resumes existing answered session');
resetLearning();
// Recent success can overcome a low lifetime average, but needs different examples.
const testTopic=topicBy(q.topic),topicQs=TOPIC_COUNTS.get(testTopic.id).slice(0,6);
state.attempts[testTopic.id]={correct:0,total:100};
for(const x of topicQs)answerQuestion(x,true);
check(learningTopic(testTopic).status==='Получается уверенно'&&mastery(testTopic.id)<10,'Recent improvement overrides lifetime average for plan');
resetLearning();for(let i=0;i<8;i++)answerQuestion(q,true);check(learningTopic(testTopic).n===1&&learningTopic(testTopic).status!=='Получается уверенно','One memorized example cannot master a topic');
// Self-assessment undoes a false translation mismatch, never confirms old errors.
resetLearning();const tr=BANK.find(x=>x.type==='r');startQuiz('practice',[tr],'Translation');chosen='A valid alternative';submit();selfCredit();
check(!state.mistakes.includes(tr.id)&&!learningReviews()[tr.id],'Alternative translation is not a new error');
check(learningTopic(topicBy(tr.topic)).status!=='Получается уверенно','Self assessment not mastery');next();
tick(1000);answerQuestion(tr,false);const before=JSON.stringify(learningReviews()[tr.id]);
tick(1000);startQuiz('practice',[tr],'Translation');chosen='Another valid alternative';submit();
quiz=null;quizPage();selfCredit();check(JSON.stringify(learningReviews()[tr.id])===before,'Self credit restores prior schedule after resume');next();
for(const l of STUDY_LEVELS){state.studyLevel=l;check(planPage().includes('Почему эти темы'),'Plan '+l);}
for(const filter of ['due','waiting','done','all']){learningErrorFilter=filter;check(mistakesPage().includes('ТЕТРАДЬ ОШИБОК'),'Notebook '+filter);}
check(mistakesPage().includes('Разобрать ответ и правило'),'Answers in disclosure');
console.log('PASS: spaced 1/3-day checks, early-repeat guard, relapse, old-progress migration, reload, self-credit with resume, current-level selection, no duplicate examples, recent improvement, sample-size guard, all-level plans and notebook.');
`,sandbox,{timeout:20000});
(async()=>{await vm.runInContext(`(async()=>{
const backup=JSON.stringify(state),before=JSON.stringify(learningCleanImport(state));
state=fresh();quiz=null;await importProgressFile({size:backup.length,text:async()=>backup});
check(JSON.stringify(learningCleanImport(state))===before,'Learning backup round trip');
const count=Object.values(state.learning.topics).reduce((n,t)=>n+t.recent.length,0);
await importProgressFile({size:backup.length,text:async()=>backup});
check(Object.values(state.learning.topics).reduce((n,t)=>n+t.recent.length,0)===count,'Import deduplicated');
const id=Object.keys(state.learning.reviews)[0];
state.learning.reviews[id]={...state.learning.reviews[id],stage:3,updated:Date.now()+1};learningSyncMistakes();
await importProgressFile({size:backup.length,text:async()=>backup});
check(state.learning.reviews[id].stage===3&&!state.mistakes.includes(id),'Old backup cannot reopen newer completed error');
const malformed=JSON.parse(backup);malformed.learning.reviews[id].stage=99;
check(!learningCleanImport(malformed).reviews[id],'Malformed review discarded');
console.log('PASS: learning backup round trip, idempotent merge, newest schedule wins, malformed import rejected.');
})()`,sandbox,{timeout:20000});})().catch(e=>{console.error(e);process.exitCode=1;});
