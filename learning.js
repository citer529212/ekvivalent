'use strict';

// Kept inside the existing progress payload so guest, account and JSON storage agree.
let learningErrorFilter='due',learningErrorTopic='all',learningErrorPage=0;
const LEARNING_DAY=86400000;
function learningState(){
 state.learning??={version:1,topics:{},answers:{},reviews:{}};
 return state.learning;
}
function learningReviews(){
 const data=learningState();
 // Old mistakes have no dates: make them available now, without inventing history.
 for(const id of state.mistakes)if(questionBy(id)&&!Object.hasOwn(data.reviews,id))data.reviews[id]={stage:0,due:0,lastSuccess:0,updated:0,misses:1};
 return data.reviews;
}
function learningSyncMistakes(){state.mistakes=Object.entries(learningReviews()).filter(([id,r])=>r.stage<3&&questionBy(id)).map(([id])=>id);}
function learningEligible(q){return q&&STUDY_LEVELS.indexOf(q.level)>=0&&STUDY_LEVELS.indexOf(q.level)<=STUDY_LEVELS.indexOf(targetLevel());}
function learningDue(now=Date.now(),eligible=false){return Object.entries(learningReviews()).filter(([id,r])=>r.stage<3&&r.due<=now&&questionBy(id)&&(!eligible||learningEligible(questionBy(id)))).sort((a,b)=>a[1].due-b[1].due).map(([id])=>questionBy(id));}
function learningDate(ms){return ms?new Date(ms).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'сейчас';}
function learningTopic(t,openCounts){
 const recent=learningState().topics[t.id]?.recent||[];
 const distinct=new Map(recent.map(a=>[a.id,a]));
 const rows=[...distinct.values()],n=rows.length;
 const pct=n?Math.round(rows.filter(a=>a.correct&&!a.selfAssessed&&!a.assisted).length/n*100):null;
 const open=openCounts?openCounts.get(t.id)||0:Object.entries(learningReviews()).filter(([id,r])=>r.stage<3&&questionBy(id)?.topic===t.id).length;
 const legacy=state.attempts[t.id];
 const status=open?'Нужно закрепить':n>=5&&pct>=80?'Получается уверенно':n?'В работе':legacy?'Нужна свежая проверка':'Ещё не проверяли';
 return {n,pct,open,status,legacy};
}
weakTopics=function(){
 const order=new Map(TOPICS.map((t,i)=>[t.id,i]));
 const openCounts=new Map();
 for(const[id,r]of Object.entries(learningReviews())){const topic=questionBy(id)?.topic;if(topic&&r.stage<3)openCounts.set(topic,(openCounts.get(topic)||0)+1);}
 const scores=new Map(TOPICS.map(t=>{
  const s=learningTopic(t,openCounts);
  const score=s.open?100+Math.min(s.open,10)*3+(100-(s.pct??50))/10:s.n&&s.pct<80?80-s.pct/10:!s.n?(t.level===targetLevel()?55:25):0;
  return [t.id,score];
 }));
 return TOPICS.filter(t=>learningEligible(t)).sort((a,b)=>scores.get(b.id)-scores.get(a.id)||order.get(a.id)-order.get(b.id));
};
function learningReason(t){
 const s=learningTopic(t);
 if(s.open)return `Ошибок на закреплении: ${s.open}. ${s.n?'Последние разные задания: '+s.pct+'% из '+s.n+'.':'Начните с правила и новых примеров.'}`;
 if(s.n)return `Последние разные задания: ${s.pct}% из ${s.n}. ${s.n<5?'Пока мало ответов для уверенного вывода.':'Учитываем до 20 последних ответов по теме.'}`;
 return s.legacy?'Есть прежняя статистика; проверим тему на свежих примерах.':'По этой теме ещё нет ответов. Начнём с короткой проверки.';
}

const learningRecord=record;
record=function(q,correct){
 const data=learningState(),reviews=learningReviews(),now=Date.now();
 const previous=reviews[q.id]?{...reviews[q.id]}:null;
 const a=quiz?.answers.findLast(a=>a.id===q.id);
 if(a)a.learningPreviousReview=previous;
 learningRecord(q,correct);
 data.answers[q.id]={at:now,correct,answer:a?String(a.typed??(a.selected===null?'Не знаю':q.options?.[a.selected]??'Не знаю')).slice(0,1000):''};
 if(q.topic){
  const t=data.topics[q.topic]??={recent:[]};
  t.recent=[...t.recent,{id:q.id,correct,at:now}].slice(-20);
 }
 if(!correct){reviews[q.id]={stage:0,due:now,lastSuccess:0,updated:now,misses:(previous?.misses||0)+1};}
 else if(previous&&previous.stage<3){
  // Early repetitions do not shorten intervals or count as spaced retrieval.
  if(previous.due<=now&&(!previous.lastSuccess||now-previous.lastSuccess>=LEARNING_DAY)){
   const stage=previous.stage+1;
   reviews[q.id]={...previous,stage,lastSuccess:now,updated:now,due:stage===3?0:now+[0,1,3][stage]*LEARNING_DAY};
  }
 }
 learningSyncMistakes();
};

const learningSelfCredit=selfCredit;
selfCredit=function(){
 const a=quiz?.answers[quiz.index];
 if(!a||a.correct)return learningSelfCredit();
 const q=questionBy(a.id);if(q?.type!=='r')return;
 // A valid alternative translation is not an error and not independent mastery.
 learningSelfCredit();
 const data=learningState();
 if(a.learningPreviousReview)data.reviews[q.id]={...a.learningPreviousReview};else delete data.reviews[q.id];
 const row=data.topics[q.topic]?.recent?.findLast(x=>x.id===q.id);
 if(row){row.correct=true;row.selfAssessed=true;}
 if(data.answers[q.id]){data.answers[q.id].correct=true;data.answers[q.id].selfAssessed=true;}
 learningSyncMistakes();persist();render();
};

function learningPick(pool,n,used=new Set()){
 if(n<=0)return [];
 const data=learningState();
 const sorted=shuffle(pool).filter(q=>!used.has(q.id)).sort((a,b)=>(data.answers[a.id]?.at||0)-(data.answers[b.id]?.at||0));
 const out=[];
 // Identical examples in the imported bank should not fill the same session.
 const seen=new Set([...used].map(id=>{const q=questionBy(id);return q&&q.prompt+'|'+(q.type||'c');}));
 for(const q of sorted){const key=q.prompt+'|'+(q.type||'c');if(seen.has(key))continue;out.push(q);seen.add(key);used.add(q.id);if(out.length>=n)break;}
 return out;
}
function learningPersonalQuestions(){
 const picked=[],used=new Set();
 const take=(qs,n)=>picked.push(...learningPick(qs,n,used));
 take(learningDue(Date.now(),true),3);
 const focus=weakTopics().filter(t=>{const s=learningTopic(t);return s.open||s.n&&s.pct<80;}).slice(0,2);
 for(const t of focus)take(TOPIC_COUNTS.get(t.id)||[],2);
 take(BANK.filter(q=>q.level===targetLevel()),10-picked.length);
 if(picked.length<10)take(BANK.filter(learningEligible),10-picked.length);
 return picked;
}
function learningResume(){
 quiz=state.practice;if(!quiz)return;chosen=null;feedback=false;
 const a=quiz.answers[quiz.index];if(a){chosen=a.typed??a.selected??-1;feedback=true;}
 go('session');
}
startPersonal=function(){
 if(state.practice){learningResume();return;}
 const qs=learningPersonalQuestions();
 startQuiz('practice',qs,'Мой план · '+targetLevel());
 if(quiz){quiz.learningMode='personal';persist();}
};
function learningStartReview(){
 if(state.practice){learningResume();return;}
 let qs=learningDue();if(learningErrorTopic!=='all')qs=qs.filter(q=>(q.topic||q.skill)===learningErrorTopic);
 if(!qs.length){toast('На выбранные ошибки ещё не наступил срок. Можно решить новые примеры по теме.');return;}
 startQuiz('review',qs.slice(0,10),'Ошибки · проверка по памяти');
 if(quiz){quiz.learningMode='review';persist();}
}
function learningTrainTopic(id){
 if(state.practice){learningResume();return;}
 const t=topicBy(id);if(!t)return;
 const qs=learningPick(TOPIC_COUNTS.get(id)||[],5);
 startQuiz('practice',qs,'Закрепление · '+t.name);
 if(quiz){quiz.learningMode='focus';persist();}
}
function learningStats(){
 const rows=Object.values(learningReviews()),due=learningDue().length;
 return {due,waiting:rows.filter(r=>r.stage<3&&r.due>Date.now()).length,done:rows.filter(r=>r.stage===3).length};
}
function learningSummary(){
 const s=learningStats();return `<div class="learning-summary" aria-label="Повторение ошибок"><div><strong>${s.due}</strong><span>пора повторить</span></div><div><strong>${s.waiting}</strong><span>на закреплении</span></div><div><strong>${s.done}</strong><span>закреплено</span></div></div>`;
}
planPage=function(){
 const level=targetLevel(),focus=weakTopics()[0],s=learningStats(),lesson=currentLesson(),preview=learningPersonalQuestions();
 const reviewCount=preview.filter(q=>learningReviews()[q.id]?.stage<3&&learningReviews()[q.id].due<=Date.now()).length;
 return intro('МОЙ УЧЕБНЫЙ ПЛАН','Ваш следующий шаг — по вашим ответам.',`${state.studyLevel?'Вы выбрали уровень':state.result?'Ориентир по диагностике':'Старт без диагностики'} · ${level}`)+
 `<section class="panel plan-settings"><label>Учебный уровень ${levelSelect('plan-level')}</label><span class="note">Меняет подборку, сохраняя результат диагностики.</span>${state.studyLevel&&state.result?button('Вернуться к результату теста','use-assessed-level','light'):''}</section>`+
 (!state.result?'<div class="notice">Пока данных мало: начинаем с выбранного уровня. <a href="#diagnostic">Пройти диагностику →</a></div>':'')+
 (state.practice?`<section class="panel resume-banner"><div><span class="badge">ПРОДОЛЖИТЬ</span><h2>${escape(state.practice.title)}</h2><p>Ответов сохранено: ${state.practice.answers.length} из ${state.practice.ids.length}.</p></div>${button('Продолжить занятие →','resume-practice')}</section>`:'')+
 learningSummary()+`<div class="plan-steps">
 <article class="panel plan-step learning-primary"><span class="step-counter">01</span><div><p class="eyebrow">${s.due?'ПРОВЕРИТЬ ПО ПАМЯТИ':'ЕЖЕДНЕВНАЯ ПРАКТИКА'}</p><h2>${s.due?'Вернитесь к ошибкам, срок которых наступил':'Короткая подборка на сегодня'}</h2><p class="muted">${s.due?'До 10 заданий без открытого ответа. После проверки получите объяснение.':'До 10 вопросов вашего и предыдущих уровней. Сначала — задания, на которые вы ещё не отвечали.'}</p>${button(s.due?'Повторить ошибки →':'Начать мою подборку →',s.due?'learning-review':'personal')}<p class="note">${s.due?'Если уже есть незавершённое занятие, сначала продолжим его.':`В текущей подборке ${reviewCount} повторений по сроку; остальные — новые примеры и практика уровня.`}</p></div></article>
 <article class="panel plan-step"><span class="step-counter">02</span><div><p class="eyebrow">РАЗОБРАТЬ И ПРИМЕНИТЬ</p><h2>${focus?escape(focus.name):'Выберите тему'}</h2><p class="muted">${focus?escape(learningReason(focus)):'Все темы открыты в каталоге.'}</p><div class="button-row">${focus?`<a class="btn light" href="#topic/${focus.id}">Понять правило →</a>${button('5 примеров по теме','learning-focus:'+focus.id,'light')}`:'<a href="#grammar" class="btn">К грамматике →</a>'}</div></div></article>
 <article class="panel plan-step"><span class="step-counter">03</span><div><p class="eyebrow">ПРОДВИГАТЬСЯ ДАЛЬШЕ</p><h2>${lesson?escape(lesson.title):level==='A0'?'Основы с нуля':'Закрепите темы '+level}</h2><p class="muted">${lesson?escape(lesson.grammar.title)+' · слова, текст, практика и перевод.':'Выбирайте темы уровня и проверяйте знания на разных примерах.'}</p><a class="btn light" href="#${lesson?'lesson/'+lesson.id:'grammar/'+level}">Открыть обучение →</a></div></article></div>
 <section class="panel"><div class="section-top"><h2>Почему эти темы в плане</h2><a class="text-link" href="#mistakes">Тетрадь ошибок →</a></div>${weakTopics().slice(0,3).map(t=>`<div class="weak-row"><div><span class="badge">${t.level} · ${learningTopic(t).status}</span><h3>${escape(t.name)}</h3><p>${escape(learningReason(t))}</p></div><a class="btn light" href="#topic/${t.id}">Разобрать →</a></div>`).join('')}<p class="note">Уверенный результат по теме: не менее 5 разных заданий, от 80% верных без подсказок и самооценки и нет ошибок на закреплении. Это учебный ориентир, не оценка всего уровня. Старые общие проценты остаются в разделе «Прогресс».</p></section>
 <section class="panel"><h2>Когда возвращаться к ошибкам</h2><p class="muted">После ошибки — разбор и первая проверка. После верного ответа — повтор через сутки, затем через 3 дня. Три успешные проверки с нужными интервалами закрепляют задание. Новая ошибка начинает цикл заново.</p><p class="note">Раннее повторение полезно, но не заменяет проверку после перерыва. Самооценка перевода не подтверждает закрепление.</p><div class="button-row"><a href="#vocabulary" class="btn light">Слова · ${dueCards().length} к повторению</a><a href="#listen" class="btn light">Аудирование</a><a href="#library" class="btn light">Чтение и перевод</a></div></section>`+dailyRewardPanel();
};

mistakesPage=function(){
 const reviews=learningReviews(),now=Date.now();
 const entries=Object.entries(reviews).filter(([id])=>questionBy(id));
 const topics=[...new Set(entries.map(([id])=>{const q=questionBy(id);return q.topic||q.skill;}))];
 if(learningErrorTopic!=='all'&&!topics.includes(learningErrorTopic))learningErrorTopic='all';
 const rows=entries.filter(([id,r])=>(learningErrorTopic==='all'||(questionBy(id).topic||questionBy(id).skill)===learningErrorTopic)&&(learningErrorFilter==='all'||learningErrorFilter==='done'&&r.stage===3||learningErrorFilter==='waiting'&&r.stage<3&&r.due>now||learningErrorFilter==='due'&&r.stage<3&&r.due<=now)).sort((a,b)=>a[1].due-b[1].due);
 learningErrorPage=Math.min(learningErrorPage,Math.max(0,Math.ceil(rows.length/12)-1));
 return intro('ТЕТРАДЬ ОШИБОК','Понять. Проверить. Закрепить.','Ошибка остаётся в работе до трёх успешных проверок с перерывами.')+learningSummary()+
 `<section class="panel"><div class="tabs" role="group" aria-label="Состояние ошибок">${[['due','Пора повторить'],['waiting','На закреплении'],['done','Закреплено'],['all','Все']].map(([key,label])=>`<button class="tab ${learningErrorFilter===key?'active':''}" data-action="learning-errors:${key}" aria-pressed="${learningErrorFilter===key}">${label}</button>`).join('')}</div><div class="filter-grid"><label>Тема <select id="learning-error-topic"><option value="all">Все темы и навыки</option>${topics.map(id=>`<option value="${escape(id)}" ${learningErrorTopic===id?'selected':''}>${escape(topicBy(id)?.name||({vocabulary:'Словарь',reading:'Чтение',listening:'Аудирование',translation:'Перевод'})[id]||id)}</option>`).join('')}</select></label>${button(state.practice?'Продолжить занятие →':'Повторить по сроку →','learning-review')}</div><p class="note">Ответы скрыты, чтобы сначала вспомнить самостоятельно. В тренировке объяснение появится после вашего ответа. Кнопка повторения берёт только задания, срок которых наступил, с учётом выбранной темы.</p></section>`+
 (rows.length?rows.slice(learningErrorPage*12,(learningErrorPage+1)*12).map(([id,r])=>{
  const q=questionBy(id),last=learningState().answers[id],label=r.stage===3?'Закреплено':r.due<=now?'Пора повторить':'Повторить '+learningDate(r.due);
  return `<article class="panel learning-error"><div class="section-top"><span class="badge">${q.level} · ${label}</span><span class="note">Проверки: ${r.stage} / 3</span></div><h2>${escape(q.prompt)}</h2>${last?`<p class="note">Последний ответ: ${escape(last.answer)}${last.selfAssessed?' · самооценка':''}</p>`:'<p class="note">Ошибка перенесена из прежней версии; ваш ответ не был сохранён.</p>'}<details class="learning-explanation"><summary>Разобрать ответ и правило</summary>${reviewCard(q,null,false)}</details>${q.topic?`<div class="button-row"><a class="btn light" href="#topic/${q.topic}">Открыть правило →</a>${button('5 примеров по теме','learning-focus:'+q.topic,'light')}</div>`:''}</article>`;
 }).join(''):`<section class="panel empty"><h2>${learningErrorFilter==='due'?'На сейчас повторений нет':'В этом разделе пока нет заданий'}</h2><p class="muted">${learningStats().waiting?'Часть ошибок ждёт следующей проверки. До неё можно решить новые примеры по теме.':'Ошибки из диагностики и практики появятся здесь автоматически.'}</p><a class="btn" href="#plan">К моему плану →</a></section>`)+
 (rows.length>12?`<div class="button-row learning-pagination">${learningErrorPage?button('← Назад','learning-error-page:'+(learningErrorPage-1),'light'):''}<span>${learningErrorPage+1} / ${Math.ceil(rows.length/12)}</span>${(learningErrorPage+1)*12<rows.length?button('Дальше →','learning-error-page:'+(learningErrorPage+1),'light'):''}</div>`:'');
};

// Capture the legacy action before the old bubble listener starts a random review.
app.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const [action,arg]=el.dataset.action.split(':');
 if(action==='repeat'){e.stopImmediatePropagation();learningStartReview();return;}
 if(action==='learning-review')learningStartReview();
 if(action==='learning-focus')learningTrainTopic(arg);
 if(action==='learning-errors'){learningErrorFilter=['due','waiting','done','all'].includes(arg)?arg:'due';learningErrorPage=0;render();}
 if(action==='learning-error-page'){learningErrorPage=Math.max(0,Number(arg)||0);render();}
},true);
app.addEventListener('change',e=>{if(e.target.id==='learning-error-topic'){learningErrorTopic=e.target.value;learningErrorPage=0;render();}});

const learningQuizPage=quizPage;
quizPage=function(){
 const html=learningQuizPage();if(!quiz||quiz.kind==='diagnostic')return html;
 const q=questionBy(quiz.ids[quiz.index]),r=q&&learningReviews()[q.id];
 if(!feedback||!r)return html;
 const a=quiz.answers[quiz.index];
 const note=a?.selfAssessed?'Перевод отмечен вами как верный. Самооценка не засчитывается как проверка по памяти.':r.stage===3?'Закреплено: три успешные проверки с перерывами.':a?.correct?`Проверки: ${r.stage} / 3. Следующий срок — ${learningDate(r.due)}. Ранний повтор не ускоряет расписание.`:'Ошибка сохранена. Прочитайте объяснение; затем попробуйте вспомнить ответ без подсказки.';
 return html.replace('<div class="quiz-actions">',`<p class="learning-feedback" role="status">${note}</p><div class="quiz-actions">`);
};
const learningTopicPage=topicPage;
topicPage=function(id){const html=learningTopicPage(id);if(!topicBy(id))return html;return html+`<section class="panel"><span class="badge">ВАШ ПРОГРЕСС · ${learningTopic(topicBy(id)).status}</span><p>${escape(learningReason(topicBy(id)))}</p><div class="button-row">${button('Закрепить · 5 примеров →','learning-focus:'+id)}<a class="btn light" href="#plan">К моему плану</a></div></section>`;};
const learningHome=home;
home=function(){return learningHome().replace('Заданий для повторения: '+state.mistakes.length+'. Разберите причину и попробуйте снова.',`Пора повторить: ${learningStats().due}. Ошибок на закреплении: ${state.mistakes.length}.`);};
const learningPracticePage=practicePage;
practicePage=function(){return learningPracticePage().replace('Попробуйте снова и уберите верно решённые из списка.','Закрепляйте ответы тремя проверками с перерывами.');};
const learningResultPage=resultPage;
resultPage=function(){return learningResultPage().replace('После правильного ответа задание уйдёт из списка ошибок.','Ошибка закрепляется после трёх успешных проверок с перерывами.').replace('правило + 5 вопросов','правило и короткая практика');};
const learningSessionResult=sessionResultPage;
sessionResultPage=function(){
 return learningSessionResult()+`<section class="panel"><h2>Что дальше</h2><p class="muted">План обновлён по вашим последним ответам. Ошибки остаются на закреплении, даже после первого верного ответа.</p>${learningSummary()}<div class="button-row"><a href="#plan" class="btn">Открыть обновлённый план →</a><a href="#mistakes" class="btn light">Разобрать ошибки</a></div></section>`;
};
const learningAbout=aboutPage;
aboutPage=function(){return learningAbout().replace('Темы определённого уровня и предшествующих уровней сортируются по точности. Задания из наиболее слабых тем и тем текущего уровня перемешиваются в подборку из 10 вопросов.','Подборка до 10 вопросов учитывает ошибки по сроку, последние 20 ответов по теме и текущий уровень. Сначала предлагаются ещё не решённые примеры. Ошибка закрепляется после трёх верных проверок с интервалами: сутки, затем 3 дня. Самооценка перевода не подтверждает закрепление.');};

function learningCleanImport(data){
 if(data?.version!==1||!data.attempts||!Array.isArray(data.history)||!data.daily||data.learning?.version!==1)return null;
 const clean={version:1,topics:{},answers:{},reviews:{}};
 const time=n=>Number.isFinite(n)&&n>=0&&n<=Date.now()+366*LEARNING_DAY;
 for(const[id,r]of Object.entries(data.learning.reviews||{}))if(questionBy(id)&&r&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=3&&[r.due,r.lastSuccess,r.updated].every(time)&&Number.isInteger(r.misses)&&r.misses>=0)clean.reviews[id]={stage:r.stage,due:r.due,lastSuccess:r.lastSuccess,updated:r.updated,misses:r.misses};
 for(const[id,r]of Object.entries(data.learning.answers||{}))if(questionBy(id)&&r&&time(r.at)&&typeof r.correct==='boolean'&&typeof r.answer==='string')clean.answers[id]={at:r.at,correct:r.correct,answer:r.answer.slice(0,1000),selfAssessed:r.selfAssessed===true,assisted:r.assisted===true};
 for(const[id,r]of Object.entries(data.learning.topics||{}))if(topicBy(id)&&Array.isArray(r?.recent))clean.topics[id]={recent:r.recent.filter(a=>a&&questionBy(a.id)?.topic===id&&typeof a.correct==='boolean'&&time(a.at)).slice(-20).map(a=>({id:a.id,correct:a.correct,at:a.at,selfAssessed:a.selfAssessed===true,assisted:a.assisted===true}))};
 return clean;
}
const learningImport=importProgressFile;
importProgressFile=async function(file){
 if(file.size>20*1024*1024)return learningImport(file);
 let data;try{data=JSON.parse(await file.text());}catch(e){}
 await learningImport(file);
 const clean=learningCleanImport(data);if(!clean)return;
 const target=learningState();
 for(const section of ['reviews','answers'])for(const[id,row]of Object.entries(clean[section])){
  const field=section==='reviews'?'updated':'at';
  if(!target[section][id]||row[field]>target[section][id][field])target[section][id]=row;
 }
 for(const[id,row]of Object.entries(clean.topics)){
  const old=target.topics[id]?.recent||[];
  target.topics[id]={recent:[...new Map([...old,...row.recent].map(a=>[a.id+'|'+a.at,a])).values()].sort((a,b)=>a.at-b.at).slice(-20)};
 }
 learningSyncMistakes();persist();render();
};
render();
