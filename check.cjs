const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes={};const node=()=>({innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},removeAttribute(){},focus(){},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}});
const sandbox={document:{body:node(),documentElement:node(),addEventListener(){},querySelector:s=>nodes[s]??=node(),querySelectorAll:()=>[],createElement:()=>({...node(),click(){}})},localStorage:{getItem:()=>null,setItem(){}},location:{_hash:'',get hash(){return this._hash;},set hash(v){this._hash=v&&!v.startsWith('#')?'#'+v:v;}},history:{replaceState(){}},window:{addEventListener(){},scrollTo(){},matchMedia(){return {matches:false,addEventListener(){}};}},console,Date,Math,JSON,Set,Map,Blob,URL,setTimeout(){},clearTimeout(){},fetch:()=>Promise.reject(Error('not expected'))};
vm.createContext(sandbox);for(const f of ['content','imported','catalog','app','enrichment','design','experience','listening-content','listening','learning'])vm.runInContext(fs.readFileSync(f+'.js','utf8'),sandbox,{timeout:10000});
vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg);}
check(TOPICS.length===148&&BANK.length===11910&&ASSESSMENT.length===2000,'Import counts');
check(new Set([...BANK,...DIAG,...ASSESSMENT].map(q=>q.id)).size===BANK.length+DIAG.length+ASSESSMENT.length,'Duplicate IDs');
for(const q of [...BANK,...DIAG,...ASSESSMENT]){check(typeof q.prompt==='string','Prompt '+q.id);check(isChoice(q)?q.options.length>=2:q.accepted.length>0,'Answer '+q.id);check(!q.topic||topicBy(q.topic),'Topic '+q.id);}
for(let level=0;level<6;level++){const answers=DIAG.map(q=>({id:q.id,correct:LEVELS.indexOf(q.level)<=level}));check(resultLevel(answers).level===LEVELS[level],'Level '+level);}
const ext=extendedDiagnostic();check(ext.length===66&&new Set(ext.map(q=>q.id)).size===66,'Extended diagnosis');
for(const l of LEVELS){const qs=ext.filter(q=>q.level===l);check(qs.length===(l==='C2'?6:12),'Extended level count '+l);}
startPersonal();check(quiz.ids.length===10,'Personal size');
for(let i=0;i<10;i++){const q=questionBy(quiz.ids[quiz.index]);chosen=isChoice(q)?0:q.accepted[0];submit();check(feedback,'Feedback');next();}
check(state.history.length===1&&state.practice===null&&totalAnswers()===10,'Practice finish');
startQuiz('diagnostic',ext,'Extended');for(let i=0;i<66;i++){chosen=0;submit();}check(state.result.level==='C2'&&state.result.correct===66,'Extended finish');
for(const type of ['g','o','r','f','t']){const q=BANK.find(q=>q.type===type);startQuiz('practice',[q],type);chosen=q.accepted[0];submit();check(quiz.answers[0].correct,'Typed '+type);next();}
check(acceptedAnswer({accepted:["I do not know."],type:'g'},"I don't know"),'Contraction');
check(!acceptedAnswer({accepted:['I am here.'],prompt:'i am here.',type:'f'},'i am here.'),'Correction case');
const tr=BANK.find(q=>q.type==='r');startQuiz('practice',[tr],'Self');chosen='Alternative translation';submit();check(!quiz.answers[0].correct,'Nonmatch');selfCredit();check(quiz.answers[0].correct&&quiz.answers[0].selfAssessed,'Self credit');next();
const word={en:'apple',ru:'яблоко',key:'test-apple',level:'A1'};const q=makeVocabQuestions([word],'input')[0];startQuiz('practice',[q],'Vocab');chosen='wrong';submit();next();check(state.mistakes.includes(q.id)&&questionBy(q.id),'Generated question survives finish');
check(state.cards[word.key].repetitions===0,'Incorrect card');updateCard(word.key,true);check(state.cards[word.key].repetitions===1&&state.cards[word.key].due>Date.now(),'Card interval');
startQuiz('practice',[BANK.find(q=>q.type==='g')],'Resume');chosen=quiz.generated[0]?.accepted[0]||questionBy(quiz.ids[0]).accepted[0];submit();quiz=null;quizPage();check(feedback&&quiz.answers.length===1,'Resume answered typed question');
for(const view of [home,diagnosticPage,grammarPage,practicePage,resultPage,mistakesPage,progressPage,aboutPage,coursesPage,listeningPage])check(view().length>0,'View '+view.name);
for(const l of COURSE_LESSONS){check(lessonPage(l.id).length>0,'Lesson view');for(const id of [...l.exerciseIds,...l.translationIds])check(questionBy(id),'Lesson id');}
console.log('PASS: 148 topics; 11,910 training questions; 2,000 assessment questions; all exercise formats; 66-question diagnosis; level thresholds; self-assessment; persistent generated exercises; SRS; resume; 40 lessons.');
`,sandbox,{timeout:20000});
for(const name of ['lexis','corpus','words','gendict','cliches','syn','milterms','reference']){sandbox.testData=JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));const fn={lexis:'vocabularyPageView',corpus:'libraryPageView',words:'dictionaryPageView',gendict:'dictionaryPageView',cliches:'dictionaryPageView',syn:'dictionaryPageView',milterms:'dictionaryPageView',reference:'referencePage'}[name];const mode={words:'words',gendict:'general',cliches:'phrases',syn:'synonyms',milterms:'terms'}[name];vm.runInContext(`${mode?`dictionaryMode='${mode}';dictionarySearch='go';`:''}if(!${fn}(testData).length)throw Error('${name} view');`,sandbox,{timeout:10000});}
sandbox.testCorpus=JSON.parse(fs.readFileSync('data/corpus.json','utf8'));sandbox.testAlts=JSON.parse(fs.readFileSync('data/alts.json','utf8'));vm.runInContext(`for(const t of testCorpus)if(!textPage(String(t.id),[testCorpus,testAlts]).length)throw Error('Text view');console.log('PASS: all data views, 322 text pages, dictionary and reference render.');`,sandbox,{timeout:10000});
vm.runInContext(`
{
state=fresh();quiz=null;feedback=false;
function press(key,target={},extra={}){const e={key,target:{tagName:'BODY',closest(){return null;},...target},preventDefault(){this.defaultPrevented=true;},...extra};handleQuizKeyboard(e);return e;}
const typedQs=BANK.filter(q=>q.type==='g').slice(0,2);startQuiz('practice',typedQs,'Enter test');
press('Enter',{tagName:'INPUT',id:'typed-answer',value:typedQs[0].accepted[0]});check(quiz.answers.length===1&&quiz.index===0&&feedback,'Enter checks typed answer');
const repeat=press('Enter',{}, {repeat:true});check(repeat.defaultPrevented&&quiz.index===0,'Held Enter blocked');
submit();check(quiz.answers.length===1,'Duplicate submission guard');
press('Enter');check(quiz.index===1&&!feedback,'Second Enter advances from feedback after input lost focus');
press('Enter');check(quiz.index===1&&quiz.answers.length===1,'Empty Enter does not skip');
press('Enter',{tagName:'INPUT',id:'typed-answer',value:typedQs[1].accepted[0]},{isComposing:true});check(quiz.answers.length===1,'IME Enter ignored');
press('Enter',{tagName:'INPUT',id:'typed-answer',value:typedQs[1].accepted[0]});press('Enter');check(quiz===null,'Enter finishes final question');
startQuiz('practice',BANK.filter(isChoice).slice(0,2),'Choices');const expected=quiz.orders[quiz.ids[0]][0];press('1');check(chosen===expected,'Number selects visible first choice');press('Enter');check(feedback&&quiz.answers.length===1,'Enter checks choice');press('Enter');check(quiz.index===1,'Enter advances choice');
startQuiz('diagnostic',DIAG.slice(0,2),'Diagnostic');chosen=0;press('Enter');check(quiz.index===1&&!feedback,'Diagnostic Enter advances immediately');press('Enter',{}, {repeat:true});check(quiz.index===1,'Held diagnostic Enter does not skip');
state=fresh();quiz=null;feedback=false;const q=BANK[0];check(awardQuestionXP(q,true)===15,'Correct XP');check(awardQuestionXP(q,true)===0,'No repeat XP');check(rewardState().total===15,'XP total');awardQuestionXP(BANK[1],false);check(rewardState().total===25,'Effort XP');check(!rewardDay().unlocked,'Game locked before daily goal');
for(const rewardQ of BANK.slice(2,7))awardQuestionXP(rewardQ,true);rewardDay();check(rewardDay().unlocked,'Game unlocks at goal');startWordGame();check(game.pairs.length===6&&new Set(game.pairs.map(p=>p.en)).size===6&&new Set(game.pairs.map(p=>p.ru)).size===6,'Unique game pairs');
matchGame('en',0);matchGame('ru',1);check(game.wrong&&game.matched.length===0,'Wrong pair not matched');
for(const p of game.pairs){matchGame('en',p.id);matchGame('ru',p.id);}check(game.done&&rewardDay().gameBonus===30,'Game completion reward');const total=rewardState().total;startWordGame();for(const p of game.pairs){matchGame('en',p.id);matchGame('ru',p.id);}check(rewardState().total===total&&game.bonus===0,'Game bonus once per day');
state.studyLevel='A0';check(targetLevel()==='A0'&&planPage().includes('Основы с нуля'),'A0 plan');state.studyLevel='C2';check(currentLesson()===null&&planPage().includes('Закрепите темы C2'),'C2 plan does not silently choose A1 lesson');
filter='all';search='';state.grammarCategory='all';state.grammarFormat='all';grammarFilterKey='';const firstPage=grammarPage();check((firstPage.match(/<article class="topic-card">/g)||[]).length===12,'Grammar pagination size');grammarPageNumber=1;const secondPage=grammarPage();check(firstPage!==secondPage,'Different catalog pages');search='xyz non-existing topic';check(grammarPage().includes('Темы не найдены'),'Grammar empty state');search='';
location.hash='#lesson/a1-01';startQuiz('practice',BANK.slice(0,2),'Return');check(quiz.returnTo==='lesson/a1-01','Pause return context');
console.log('PASS: Enter input, choices, held key, empty input, IME, final question, duplicate guards, diagnostic behavior; XP dedup; daily unlock; unique pairs; once-daily bonus; A0/C2 plans; catalog pagination; return context.');
}
`,sandbox,{timeout:10000});
(async()=>{await vm.runInContext(`(async()=>{const snapshot=JSON.stringify(state),before=rewardState().total;await importProgressFile({size:snapshot.length,text:async()=>snapshot});check(rewardState().total===before,'Reward backup merge must not duplicate XP');console.log('PASS: XP survives backup merge without double counting.');})()`,sandbox);})().catch(e=>{console.error(e);process.exitCode=1;});
