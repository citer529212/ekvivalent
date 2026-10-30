'use strict';
const STUDY_LEVELS=['A0',...LEVELS];
const EXERCISE_LABELS={c:'Выберите ответ',g:'Заполните пропуск',o:'Соберите предложение',r:'Переведите на английский',f:'Исправьте ошибку',t:'Преобразуйте предложение'};
const IMPORT_MAP=new Map();
const ASSESSMENT=[];
const COURSE_LESSONS=IMPORTED.clcourse.lessons;
for(const r of IMPORTED.drills.rules){
 const id='eq-'+r.id;
 TOPICS.push({id,level:r.lvl,name:r.title,rule:r.text,example:r.ex.map(e=>e[0]+' → '+e[1]).join('\n'),examples:r.ex,typical:r.typ,category:r.cat,source:'30.10.html'});
 r.exs.forEach((group,gi)=>group.items.forEach((item,i)=>{
 const accepted=(Array.isArray(item.a)?item.a:[item.a]).filter(x=>typeof x==='string');
 const options=group.t==='c'?[...new Set([accepted[0],...(item.w||[])])]:null;
 const q={id:`eq-${r.id}-${gi}-${i}`,topic:id,level:r.lvl,skill:'grammar',type:group.t,prompt:item.q,instruction:group.title,options,answer:0,accepted,source:'30.10.html'};
 BANK.push(q);
 }));
 IMPORT_MAP.set(r.id,id);
}
const PASSAGES=new Map(IMPORTED.placement.passages.map(p=>[p.id,p]));
for(const i of IMPORTED.placement.items){
 const skill={gram:'grammar',vocab:'vocabulary',read:'reading',trans:'translation'}[i.skill]||'grammar';
 const accepted=(Array.isArray(i.a)?i.a:[i.a]).filter(x=>typeof x==='string');
 ASSESSMENT.push({id:'pool-'+i.id,topic:IMPORT_MAP.get(i.tag)||null,level:i.lvl,skill,type:i.t,prompt:i.q,options:i.t==='c'?[...new Set([accepted[0],...(i.w||[])])]:null,answer:0,accepted,passage:PASSAGES.get(i.psg)?.text,explanation:skill==='reading'?'Сопоставьте ответ с приведённым текстом.':null,source:'30.10.html'});
}
for(const lesson of COURSE_LESSONS){
 lesson.exerciseIds=[];lesson.translationIds=[];
 lesson.practice.forEach((p,i)=>{const accepted=(Array.isArray(p[2])?p[2]:[p[2]]);const q={id:`lesson-${lesson.id}-${i}`,topic:IMPORT_MAP.get(lesson.grammar.rid)||null,level:lesson.lvl,skill:'grammar',type:p[0],prompt:p[1],accepted,options:p[0]==='c'?[...new Set([accepted[0],...(p[3]||[])])]:null,answer:0,explanation:lesson.grammar.title,lesson:lesson.id};BANK.push(q);lesson.exerciseIds.push(q.id);});
 lesson.translate.forEach((p,i)=>{const q={id:`lesson-tr-${lesson.id}-${i}`,topic:IMPORT_MAP.get(lesson.grammar.rid)||null,level:lesson.lvl,skill:'translation',type:'r',prompt:p.ru,accepted:p.en,options:null,answer:0,explanation:'Сравните свой вариант с образцами. Другие точные переводы тоже возможны.',lesson:lesson.id};BANK.push(q);lesson.translationIds.push(q.id);});
}
const QUESTION_INDEX=new Map([...BANK,...DIAG,...ASSESSMENT].map(q=>[q.id,q]));
const explanationOf=q=>q.explanation||topicBy(q.topic)?.rule||'Образец показывает ожидаемый ответ. Для свободного перевода возможны и другие корректные варианты.';
const isChoice=q=>Array.isArray(q.options);
function normalizedAnswer(s){return String(s).normalize('NFKC').toLowerCase().replace(/[’‘`]/g,"'").replace(/\bwon't\b/g,'will not').replace(/\bcan't\b/g,'can not').replace(/\bcannot\b/g,'can not').replace(/n't\b/g,' not').replace(/\bi'm\b/g,'i am').replace(/\b(it|he|she|that|there|what)'s\b/g,'$1 is').replace(/'re\b/g,' are').replace(/'ve\b/g,' have').replace(/'ll\b/g,' will').replace(/'d\b/g,' would').replace(/ё/g,'е').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();}
function acceptedAnswer(q,value){const variants=q.accepted||[q.options?.[q.answer]];if(q.type==='f'&&variants.every(a=>normalizedAnswer(a)===normalizedAnswer(q.prompt)))return variants.some(a=>String(a).trim().replace(/\s+/g,' ')===String(value).trim().replace(/\s+/g,' '));return variants.some(a=>normalizedAnswer(a)===normalizedAnswer(value));}
function extendedDiagnostic(){return [...['A1','A2','B1','B2','C1'].flatMap(l=>[['grammar',6],['vocabulary',3],['reading',3]].flatMap(([s,n])=>shuffle(ASSESSMENT.filter(q=>q.level===l&&q.skill===s&&isChoice(q)&&q.options.length>=2)).slice(0,n))),...DIAG.filter(q=>q.level==='C2')];}
