'use strict';
const BETA_PREFS_KEY='ekvivalent-interface-v1';
let betaPrefs={quiet:false};
try{betaPrefs.quiet=JSON.parse(localStorage.getItem(BETA_PREFS_KEY)||'{}').quiet===true;}catch(e){}
let betaWordRequest=0,betaWordAnchor=null,betaPopup=null;
const betaShards=new Map();
const BETA_COPY_ICON='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/></svg>';
function betaCopyButton(selector,label='Копировать'){return `<button type="button" class="copy-button" data-copy-selector="${escape(selector)}" aria-label="${escape(label)}">${BETA_COPY_ICON}<span>Копировать</span></button>`;}
const betaTextPage=textPage;
textPage=function(id,data){return betaTextPage(id,data)
 .replace('<h2>Исходный текст</h2>','<div class="section-top"><h2>Исходный текст</h2>'+betaCopyButton('#translation-source','Копировать исходный текст')+'</div>')
 .replace('<div class="reading-text" lang=', '<div id="translation-source" class="reading-text" lang=')
 .replace('<label class="answer-label">Ваш перевод','<div class="translation-copy-row">'+betaCopyButton('#text-draft','Копировать мой перевод')+'</div><label class="answer-label">Ваш перевод')
 .replace('<summary>Сопоставить с образцом</summary><div class="reading-text">','<summary>Сопоставить с образцом</summary><div class="translation-copy-row">'+betaCopyButton('#translation-reference','Копировать образец перевода')+'</div><div id="translation-reference" class="reading-text">');};
const betaLessonPage=lessonPage;
lessonPage=function(id){return betaLessonPage(id)
 .replace('<div class="reading-text" lang="en">','<div class="translation-copy-row">'+betaCopyButton('#lesson-original','Копировать текст урока')+'</div><div id="lesson-original" class="reading-text" lang="en">')
 .replace('<summary>Русский перевод</summary><p class="muted">','<summary>Русский перевод</summary><div class="translation-copy-row">'+betaCopyButton('#lesson-translation','Копировать перевод урока')+'</div><p id="lesson-translation" class="muted">');};
const betaQuizPage=quizPage;
quizPage=function(){const html=betaQuizPage();if(!quiz)return html;const supported=quiz.betaHelp?.includes(quiz.ids[quiz.index]);return `${supported?'<p class="notice">Использован словарь: ответ будет отмечен как выполненный с подсказкой. Проверка закрепления по памяти не засчитывается.</p>':''}<div class="test-display-tools"><span>Комфортный режим</span>${betaGraphicsButton()}</div>`+html;};
const betaRecord=record;
record=function(q,correct){
 const assisted=!!quiz?.betaHelp?.includes(q.id);
 betaRecord(q,correct);
 if(!assisted)return;
 const answer=quiz?.answers.findLast(a=>a.id===q.id),data=learningState();
 if(answer)answer.assisted=true;
 const recent=data.topics[q.topic]?.recent?.findLast(a=>a.id===q.id);if(recent)recent.assisted=true;
 if(data.answers[q.id])data.answers[q.id].assisted=true;
 if(correct&&answer?.learningPreviousReview)data.reviews[q.id]={...answer.learningPreviousReview};
 learningSyncMistakes();
};
const betaReviewCard=reviewCard;
reviewCard=function(q,a,showTopic=true){return betaReviewCard(q,a,showTopic).replace('<div class="review-answer">',a?.assisted?'<p class="note">Ответ с помощью словаря.</p><div class="review-answer">':'<div class="review-answer">');};
function betaGraphicsButton(){return `<button type="button" class="display-toggle" data-action="beta-quiet" aria-pressed="${betaPrefs.quiet}">${betaPrefs.quiet?'Показать графику':'Без графики'}</button>`;}
function betaSetQuiet(value){
 betaPrefs.quiet=value;try{localStorage.setItem(BETA_PREFS_KEY,JSON.stringify(betaPrefs));}catch(e){}
 document.body.classList.toggle('quiet-mode',value);
 document.querySelectorAll('[data-action="beta-quiet"]').forEach(b=>{b.textContent=value?'Показать графику':'Без графики';b.setAttribute('aria-pressed',String(value));});
}
async function betaCopy(selector,button){
 const el=document.querySelector(selector);if(!el)return;
 const value=el.value!==undefined?el.value:el.textContent;
 if(!String(value).trim()){toast('Здесь пока нет текста для копирования.');return;}
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(value);
  if(button?.isConnected){button.innerHTML='✓ <span>Скопировано</span>';setTimeout(()=>{if(button.isConnected)button.innerHTML=BETA_COPY_ICON+'<span>Копировать</span>';},2200);}
  toast('Текст скопирован.');
 }catch(e){
  // Clipboard permissions can be denied. Keep the full text available for manual copy.
  betaShowPopup('Скопируйте текст вручную',`<p>Браузер не разрешил автоматическое копирование. Выделите текст ниже.</p><textarea class="manual-copy" readonly aria-label="Текст для копирования">${escape(value)}</textarea>`);
  betaPopup.querySelector('textarea')?.select();
 }
}
function betaNormalize(word){return word.toLowerCase().replace(/’/g,"'").normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ё/g,'е');}
function betaCandidates(word){
 const w=betaNormalize(word),forms=[w];
 const irregular={am:'be',is:'be',are:'be',was:'be',were:'be',been:'be',has:'have',had:'have',does:'do',did:'do',done:'do',went:'go',gone:'go',children:'child',men:'man',women:'woman',people:'person',feet:'foot',teeth:'tooth',mice:'mouse',better:'good',best:'good',worse:'bad',worst:'bad',bought:'buy',brought:'bring',thought:'think',taught:'teach',caught:'catch',said:'say',told:'tell',made:'make',took:'take',taken:'take',saw:'see',seen:'see',knew:'know',known:'know',wrote:'write',written:'write',gave:'give',given:'give',found:'find',felt:'feel',left:'leave',kept:'keep',ran:'run',ate:'eat',eaten:'eat',drank:'drink',drunk:'drink',spoke:'speak',spoken:'speak',could:'can',would:'will',should:'shall',"i'm":'be',"isn't":'be',"aren't":'be',"don't":'do',"doesn't":'do',"didn't":'do',"can't":'can',"won't":'will'};
 if(irregular[w])forms.push(irregular[w]);
 if(/^[a-z'-]+$/.test(w)){
  if(w.endsWith("'s"))forms.push(w.slice(0,-2));
  if(w.endsWith('ies'))forms.push(w.slice(0,-3)+'y');
  if(w.endsWith('s')&&!w.endsWith('ss'))forms.push(w.slice(0,-1));
  if(w.endsWith('es'))forms.push(w.slice(0,-2));
  if(w.endsWith('ied'))forms.push(w.slice(0,-3)+'y');
  for(const suffix of ['ing','ed'])if(w.endsWith(suffix)&&w.length>suffix.length+2){const stem=w.slice(0,-suffix.length);forms.push(stem,stem+'e');if(/([a-z])\1$/.test(stem))forms.push(stem.slice(0,-1));}
 }
 return [...new Set(forms)].filter(x=>x.length>0).slice(0,8);
}
function betaShard(word){return [...word].reduce((n,c)=>n+c.codePointAt(0),0)%32;}
async function betaLookup(word){
 for(const candidate of betaCandidates(word)){
  const id=betaShard(candidate);
  if(!betaShards.has(id))betaShards.set(id,fetch('data/tap-dictionary/'+id+'.json?v=20261101-beta1').then(r=>{if(!r.ok)throw Error('dictionary');return r.json();}).catch(e=>{betaShards.delete(id);throw e;}));
  const data=await betaShards.get(id);
  if(Object.hasOwn(data,candidate))return {...data[candidate],approximate:candidate!==betaNormalize(word)};
 }
 return null;
}
function betaShowPopup(title,html){
 if(!betaPopup){betaPopup=document.createElement('aside');betaPopup.className='word-popup';betaPopup.id='word-popup';betaPopup.setAttribute('role','dialog');betaPopup.setAttribute('aria-modal','false');betaPopup.setAttribute('aria-labelledby','word-popup-title');document.body.append(betaPopup);}
 betaPopup.hidden=false;
 betaPopup.innerHTML=`<div class="word-popup-head"><h2 id="word-popup-title">${escape(title)}</h2><button type="button" class="popup-close" aria-label="Закрыть перевод">×</button></div><div class="word-popup-content" role="status">${html}</div>`;
 betaPopup.querySelector('.popup-close').addEventListener('click',betaClosePopup);
 betaPopup.querySelector('.popup-close').focus({preventScroll:true});
}
function betaClosePopup(){betaWordRequest++;if(betaPopup)betaPopup.hidden=true;if(betaWordAnchor?.isConnected)betaWordAnchor.focus({preventScroll:true});betaWordAnchor=null;}
async function betaTranslate(word,anchor){
 if(location.hash==='#session'&&quiz?.kind==='diagnostic'){
  toast('Во время диагностики отвечайте без словаря. Перевод будет доступен в разборе после завершения теста.');return;
 }
 if(location.hash==='#session'&&quiz&&!feedback){quiz.betaHelp??=[];if(!quiz.betaHelp.includes(quiz.ids[quiz.index]))quiz.betaHelp.push(quiz.ids[quiz.index]);persist();}
 const token=++betaWordRequest;betaWordAnchor=anchor;
 betaShowPopup(word,'<p>Ищем в словаре…</p>');
 try{
  const result=await betaLookup(word);if(token!==betaWordRequest)return;
  if(!result){betaShowPopup(word,`<p>В загруженном словаре точного перевода нет. Можно изменить слово или поискать выражение целиком.</p>${betaWordSearchForm(word)}<a class="text-link" href="#dictionary">Поискать в полном словаре →</a>`);return;}
  const english=/[a-z]/i.test(word),en=english?result.w:result.m[0],ru=english?result.m.join('; '):result.w;
  betaShowPopup(word,`${result.approximate?`<p class="note">Возможная начальная форма: <b>${escape(result.w)}</b>. Проверьте значение по контексту.</p>`:''}<ul class="word-meanings">${result.m.map(m=>`<li>${escape(m)}</li>`).join('')}</ul><p class="note">${['Учебный словарь','Общий словарь EN → RU','Общий словарь RU → EN'][result.s]||'Словарь'} · значение зависит от контекста.</p><div class="button-row"><button class="btn light" data-action="speak-word" data-en="${escape(en)}">▶ Произношение</button><button class="btn light" data-action="card-add" data-en="${escape(en)}" data-ru="${escape(ru)}" data-key="tap-${escape(betaNormalize(en))}" data-level="${escape(targetLevel())}">+ В мои слова</button></div>${betaWordSearchForm(word)}<a class="text-link" href="#dictionary">Открыть полный словарь →</a>`);
 }catch(e){if(token!==betaWordRequest)return;betaShowPopup(word,`<p>Словарь не загрузился. Проверьте подключение и попробуйте ещё раз.</p>${betaWordSearchForm(word)}`);}
}
function betaWordSearchForm(word){return `<form id="word-popup-search"><label>Другое слово<input name="word" value="${escape(word)}" maxlength="80" autocomplete="off" spellcheck="false"></label><button class="btn light" type="submit">Найти</button></form>`;}
function betaTokenizeText(text){return text.split(/([\p{L}]+(?:[’'\-][\p{L}]+)*)/u).map((part,i)=>i%2?`<span class="tap-word" role="button" tabindex="${i===1?0:-1}" data-word="${escape(part)}" aria-label="Перевести слово ${escape(part)}">${escape(part)}</span>`:escape(part)).join('');}
function betaEnhance(){
 if(!document.createTreeWalker)return;
 const diagnostic=location.hash==='#session'&&quiz?.kind==='diagnostic';
 if(!diagnostic){
  const selectors='.reading-text,.question,.rule,.examples,.example,.lesson-example,.lesson-rule,.feedback,.review-answer,.lesson-vocab b,.word-row b,#lesson-translation';
  for(const root of app.querySelectorAll(selectors)){
   const walker=document.createTreeWalker(root,4),nodes=[];let node;
   while((node=walker.nextNode()))if(/[\p{L}]/u.test(node.nodeValue)&&!node.parentElement.closest('button,a,input,textarea,select,summary,.tap-word,.copy-button,[data-no-translate]'))nodes.push(node);
   for(const text of nodes){const span=document.createElement('span');span.className='tap-text';span.innerHTML=betaTokenizeText(text.nodeValue);text.replaceWith(span);}
  }
 }
 for(const root of app.querySelectorAll('.translation-grid,.lesson-rule'))if(!root.previousElementSibling?.classList.contains('tap-hint')){
  const hint=document.createElement('p');hint.className='tap-hint';hint.textContent='Нажмите на слово, чтобы посмотреть перевод. Словарь EN ⇄ RU из исходного тренажёра.';root.before(hint);
 }
}
const betaRender=render;
render=function(){betaRender();betaEnhance();};
if(typeof MutationObserver!=='undefined')new MutationObserver(()=>betaEnhance()).observe(app,{childList:true,subtree:true});
// Popup controls live outside #app; forward only the two existing, explicitly chosen actions.
document.addEventListener('click',e=>{
 const quiet=e.target.closest('[data-action="beta-quiet"]');if(quiet){betaSetQuiet(!betaPrefs.quiet);return;}
 const copy=e.target.closest('[data-copy-selector]');if(copy){betaCopy(copy.dataset.copySelector,copy);return;}
 const word=e.target.closest('.tap-word');if(word){betaTranslate(word.dataset.word,word);return;}
 const full=e.target.closest('#word-popup a[href="#dictionary"]');if(full){dictionarySearch=betaPopup.querySelector('#word-popup-title')?.textContent||'';dictionaryMode=/[а-яё]/i.test(dictionarySearch)?'general':'words';dictionaryPage=0;}
 const action=e.target.closest('#word-popup [data-action]');
 if(action){
  if(action.dataset.action==='speak-word')speak(action.dataset.en);
  if(action.dataset.action==='card-add'){state.cards??={};state.cards[action.dataset.key]={...state.cards[action.dataset.key],en:action.dataset.en,ru:action.dataset.ru,level:action.dataset.level,due:state.cards[action.dataset.key]?.due??Date.now()};persist();action.textContent='✓ Добавлено';toast('Слово добавлено в карточки.');}
 }
});
document.addEventListener('submit',e=>{if(e.target.id==='word-popup-search'){e.preventDefault();const input=e.target.querySelector('input');const word=input.value.trim();if(word)betaTranslate(word,betaWordAnchor);}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&betaPopup&&!betaPopup.hidden){e.preventDefault();betaClosePopup();return;}
 if(['ArrowRight','ArrowLeft'].includes(e.key)&&e.target.classList?.contains('tap-word')){const words=[...e.target.closest('.tap-text').querySelectorAll('.tap-word')],index=words.indexOf(e.target),next=words[index+(e.key==='ArrowRight'?1:-1)];if(next){e.preventDefault();e.stopImmediatePropagation();e.target.tabIndex=-1;next.tabIndex=0;next.focus();}return;}
 if((e.key==='Enter'||e.key===' ')&&e.target.classList?.contains('tap-word')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)betaTranslate(e.target.dataset.word,e.target);}
},true);
window.addEventListener('hashchange',()=>{betaWordRequest++;if(betaPopup)betaPopup.hidden=true;betaWordAnchor=null;});
const betaTopbar=document.querySelector('.top-right');
if(betaTopbar?.insertAdjacentHTML)betaTopbar.insertAdjacentHTML('afterbegin',betaGraphicsButton());
// Keep dictionary discoverable in the main learning group.
const betaDictionaryLink=document.querySelector('[data-nav="dictionary"]');
const betaLearningGroup=document.querySelector('.sidebar .nav-group:nth-child(2)');
if(betaDictionaryLink&&betaLearningGroup?.append)betaLearningGroup.append(betaDictionaryLink);
if(betaDictionaryLink)betaDictionaryLink.setAttribute('title','Словарь EN ⇄ RU');
for(const link of document.querySelectorAll('.sidebar [data-nav]'))link.setAttribute('title',link.textContent.trim());
betaSetQuiet(betaPrefs.quiet);render();
