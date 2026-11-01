'use strict';
const repairedAcceptedAnswer=acceptedAnswer;
acceptedAnswer=function(q,value){
 if(repairedAcceptedAnswer(q,value))return true;
 if(q.type!=='g')return false;
 const prompt=q.prompt.replace(/\s*\([^()]*\)\s*$/,'');
 const gaps=prompt.match(/_{2,}|…|\.{3}/g)||[];
 if(gaps.length!==1)return false;
 return (q.accepted||[]).some(answer=>normalizedAnswer(prompt.replace(/_{2,}|…|\.{3}/,()=>answer))===normalizedAnswer(value));
};
function repairWordOrder(q){
 quiz.wordOrders??={};quiz.wordSelections??={};
 const words=q.prompt.split('/').map(s=>s.trim());
 let order=quiz.wordOrders[q.id];
 if(!Array.isArray(order)||order.length!==words.length||new Set(order).size!==words.length||!order.every(i=>Number.isInteger(i)&&i>=0&&i<words.length)){
  order=shuffle(words.map((_,i)=>i));
  if(order.every((i,j)=>i===j)&&order.length>1)[order[0],order[order.length-1]]=[order[order.length-1],order[0]];
  quiz.wordOrders[q.id]=order;
 }
 return {words,order,used:quiz.wordSelections[q.id]||[]};
}
const repairedQuizPage=quizPage;
quizPage=function(){
 if(quiz&&chosen===null&&!feedback){const id=quiz.ids[quiz.index];if(quiz.wordDrafts?.[id])chosen=quiz.wordDrafts[id];else if(quiz.wordSelections?.[id]?.length){const q=questionBy(id);chosen=quiz.wordSelections[id].map(i=>q.prompt.split('/')[i].trim()).join(' ');}}
 const html=repairedQuizPage();if(!quiz)return html;
 const q=questionBy(quiz.ids[quiz.index]);if(!q||q.type!=='o')return html;
 const {words,order,used}=repairWordOrder(q);
 const chips=`<div class="word-chips" aria-label="Слова для сборки предложения">${order.map(i=>`<button type="button" class="word-chip ${used.includes(i)?'word-used':''}" data-action="repair-word:${i}" ${feedback||used.includes(i)?'disabled':''}>${escape(words[i])}</button>`).join('')}</div><div class="word-edit-actions"><button class="text-link" data-action="repair-undo" ${feedback||!used.length?'disabled':''}>↶ Последнее слово</button><button class="text-link" data-action="repair-clear" ${feedback?'disabled':''}>Очистить</button></div>`;
 return html.replace(`<h1 class="question">${escape(q.prompt)}</h1>`,'<h1 class="question order-question">Соберите предложение</h1>')
 .replace(/<div class="word-chips">[\s\S]*?<\/div>/,'')
 .replace('<label class="answer-label">',chips+'<label class="answer-label">');
};
const repairedStartQuiz=startQuiz;
startQuiz=function(kind,qs,title){repairedStartQuiz(kind,qs,title);if(quiz){for(const id of quiz.ids){const q=questionBy(id);if(q?.type==='o')repairWordOrder(q);}persist();}};
function repairResizeAnswer(){const el=document.querySelector('#typed-answer');if(!el?.style)return;el.style.height='auto';el.style.height=Math.min(300,Math.max(90,el.scrollHeight))+'px';}
app.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el||!quiz||feedback)return;
 const [action,arg]=el.dataset.action.split(':');if(!['repair-word','repair-undo','repair-clear'].includes(action))return;
 const q=questionBy(quiz.ids[quiz.index]);if(q.type!=='o')return;
 const {words,used}=repairWordOrder(q),i=Number(arg);
 if(action==='repair-word'&&Number.isInteger(i)&&i>=0&&i<words.length&&!used.includes(i)){used.push(i);quiz.wordSelections[q.id]=used;}
 if(action==='repair-undo')used.pop();
 if(action==='repair-clear')used.length=0;
 chosen=used.map(i=>words[i]).join(' ')||null;quiz.wordSelections[q.id]=used;quiz.wordDrafts??={};quiz.wordDrafts[q.id]=chosen;persist();render();
});
app.addEventListener('input',e=>{if(e.target.id==='typed-answer'){if(quiz){quiz.wordSelections??={};quiz.wordSelections[quiz.ids[quiz.index]]=[];quiz.wordDrafts??={};quiz.wordDrafts[quiz.ids[quiz.index]]=e.target.value;persist();}repairResizeAnswer();}});
const repairedNext=next;
next=function(){const before=quiz?.index;repairedNext();if(quiz&&quiz.index!==before&&!window.matchMedia('(pointer:fine)').matches)app.querySelector('.quiz-head')?.scrollIntoView?.({block:'start',behavior:'instant'});};
const repairedRender=render;
render=function(){repairedRender();repairResizeAnswer();};
// Correct a learner-facing imported proper name without changing stable card keys.
function repairSavedVocabulary(){
 let changed=false;
 for(const c of Object.values(state.cards||{}))if(c?.en?.toLowerCase()==='steven'&&/шум|крик/.test(c.ru||'')){c.en='Steven';c.ru='Стивен (мужское имя)';changed=true;}
 if(changed)persist();
}
const repairedVocabularyRows=vocabularyRows;
vocabularyRows=function(...args){repairSavedVocabulary();return repairedVocabularyRows(...args).map(w=>w.en.toLowerCase()==='steven'&&/шум|крик/.test(w.ru)?{...w,en:'Steven',ru:'Стивен (мужское имя)',pos:'proper noun'}:w);};
render();
