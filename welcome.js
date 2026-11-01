'use strict';
const SCHOLAR_RANKS=[
 {name:'Ученик',xp:0,note:'Первый шаг уже считается.',color:'#db9964'},
 {name:'Старший ученик',xp:150,note:'Практика становится привычкой.',color:'#65aaa3'},
 {name:'Знаток',xp:400,note:'Замечаешь связи между словами и правилами.',color:'#719cca'},
 {name:'Наставник',xp:800,note:'Возвращаешься к сложному и идёшь дальше.',color:'#aa86c8'},
 {name:'Доцент',xp:1500,note:'За плечами — много небольших учебных шагов.',color:'#c18d56'},
 {name:'Профессор',xp:3000,note:'Твоя настойчивость заслуживает своего звания.',color:'#829bc9'},
 {name:'Академик',xp:6000,note:'Большой путь складывается из маленьких занятий.',color:'#d8b65d'}
];
function scholarRank(total=rewardState().total){
 total=Math.max(0,Number(total)||0);
 const index=SCHOLAR_RANKS.findLastIndex(r=>total>=r.xp),rank=SCHOLAR_RANKS[index],next=SCHOLAR_RANKS[index+1]||null;
 return {index,rank,next,total,progress:next?Math.min(100,Math.max(0,(total-rank.xp)/(next.xp-rank.xp)*100)):100};
}
function scholarMonkey(index=scholarRank().index,small=false){
 // Original vector character; all motion follows quiet mode and reduced-motion settings.
 return `<svg class="scholar-monkey rank-${index} ${small?'monkey-small':''}" viewBox="0 0 240 270" fill="none" aria-hidden="true" focusable="false">
 <ellipse class="monkey-shadow" cx="122" cy="250" rx="67" ry="10" fill="currentColor" opacity=".1"/>
 <g class="monkey-body">
 <path class="monkey-tail" d="M170 219c44 17 66-27 45-40-16-10-28 10-15 18" stroke="#966443" stroke-width="13" stroke-linecap="round"/>
 <ellipse cx="120" cy="195" rx="53" ry="51" fill="#a8744c"/>
 <ellipse cx="120" cy="199" rx="33" ry="37" fill="#eed0a5"/>
 <ellipse cx="87" cy="237" rx="23" ry="12" fill="#80573e"/><ellipse cx="153" cy="237" rx="23" ry="12" fill="#80573e"/>
 <g class="monkey-wave"><path d="M166 174c14-8 25-27 23-46" stroke="#a8744c" stroke-width="20" stroke-linecap="round"/><ellipse cx="187" cy="118" rx="13" ry="16" fill="#eed0a5"/><path d="m180 108-2-9m9 7 1-11m6 13 5-8" stroke="#eed0a5" stroke-width="6" stroke-linecap="round"/></g>
 <circle cx="55" cy="103" r="28" fill="#966443"/><circle cx="55" cy="103" r="17" fill="#e6ba91"/>
 <circle cx="185" cy="103" r="28" fill="#966443"/><circle cx="185" cy="103" r="17" fill="#e6ba91"/>
 <path d="M58 96c0-44 27-66 62-66s62 22 62 66v25c0 34-26 54-62 54s-62-20-62-54V96Z" fill="#a8744c"/>
 <path d="M89 61c15-8 25 1 31 11 6-10 17-19 32-11 18 10 26 36 20 60-7 26-29 39-52 39s-45-13-52-39c-6-24 3-50 21-60Z" fill="#f4dbb5"/>
 <path d="M107 32c-6-13 6-22 18-19-8 5-5 13 2 17" fill="#80573e"/>
 <g class="monkey-eyes"><ellipse cx="96" cy="103" rx="7" ry="10" fill="#3f342d"/><ellipse cx="145" cy="103" rx="7" ry="10" fill="#3f342d"/><circle cx="98" cy="100" r="2" fill="white"/><circle cx="147" cy="100" r="2" fill="white"/></g>
 <ellipse cx="79" cy="121" rx="10" ry="6" fill="#e8ac91" opacity=".7"/><ellipse cx="162" cy="121" rx="10" ry="6" fill="#e8ac91" opacity=".7"/>
 <path d="m115 119 5 3 5-3m-21 13c7 11 25 11 33 0" stroke="#80573e" stroke-width="4" stroke-linecap="round"/>
 ${index>=1?`<path d="m89 166 31 9 31-9-8 19-23 5-23-5Z" fill="${SCHOLAR_RANKS[index].color}"/><path d="m131 182 14 24 8-5-8-22" fill="${SCHOLAR_RANKS[index].color}"/>`:''}
 ${index>=2?'<g stroke="#3e536b" stroke-width="4"><circle cx="96" cy="103" r="18"/><circle cx="145" cy="103" r="18"/><path d="M114 101h13m-49-2-12-5m97 5 12-5"/></g>':''}
 ${index>=4?'<g class="monkey-cap"><path d="m70 43 50-20 50 20-50 20-50-20Z" fill="#394c69"/><path d="M91 53v13c19 8 39 8 58 0V53l-29 11-29-11Z" fill="#4a6181"/><path d="M164 46v28" stroke="#e5bf66" stroke-width="3"/><path d="m160 73-2 13h12l-3-13" fill="#e5bf66"/></g>':''}
 <path d="M79 191c16-7 28-6 41 1 13-7 25-8 41-1v39c-16-7-28-6-41 1-13-7-25-8-41-1v-39Z" fill="${SCHOLAR_RANKS[index].color}" stroke="#faf0d8" stroke-width="4" stroke-linejoin="round"/>
 <path d="M120 194v34m-30-25 19 3m-19 7 19 3m23-10 18-3m-18 13 18-3" stroke="#fff6df" stroke-width="3" stroke-linecap="round"/>
 <ellipse cx="74" cy="209" rx="10" ry="16" fill="#f0cda1"/>
 ${index>=5?'<path d="m168 204 4 8 9 1-7 6 2 9-8-4-8 4 1-9-6-6 9-1 4-8Z" fill="#f1ca68"/>':''}
 ${index===6?'<g stroke="#d4ad4f" stroke-width="4" stroke-linecap="round"><path d="M60 158c-18-21-20-48-12-67m133 67c18-21 20-48 12-67"/><path d="m51 145-12-2m8-12-12-6m10-9-10-9m153 38 12-2m-8-12 12-6m-10-9 10-9"/></g>':''}
 </g></svg>`;
}
function scholarHasProgress(){return !!(state.result||state.practice||state.diagnostic||state.studyLevel||state.history.length||totalAnswers()||rewardState().total);}
function scholarCard(compact=false){
 const s=scholarRank();
 return `<section class="scholar-card ${compact?'scholar-compact':''}" aria-label="Персонаж и учебное звание"><div class="scholar-portrait" style="--rank-color:${s.rank.color}">${scholarMonkey(s.index)}</div><div class="scholar-info"><span class="eyebrow">ТВОЙ ПЕРСОНАЖ · ЭКВИ</span><h2>${s.rank.name}</h2><p>${s.rank.note}</p><div class="scholar-xp"><strong>${s.total.toLocaleString('ru-RU')} XP</strong><span>${s.next?'до звания «'+s.next.name+'» — '+(s.next.xp-s.total).toLocaleString('ru-RU')+' XP':'Все звания открыты'}</span></div><div class="scholar-track" role="progressbar" aria-label="До следующего звания" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s.progress)}"><span style="width:${s.progress}%"></span></div><p class="note">Звание отмечает учебную активность. Уровень английского определяется отдельно.</p><div class="button-row"><a class="btn" href="#plan">Продолжить обучение →</a>${compact?'<a class="btn light" href="#profile">Все звания</a>':'<a class="btn light" href="#rewards">Как получать XP</a>'}</div></div></section>`;
}
function scholarProfilePage(){
 const s=scholarRank(),name=typeof accountSession!=='undefined'&&accountSession?accountSession.user.user_metadata?.display_name||'Ваш профиль':'Профиль гостя';
 return intro('МОЙ ПЕРСОНАЖ',escape(name),'У каждого занятия есть результат. У каждого небольшого шага — своё место в большом пути.')+scholarCard()+
 `<section class="panel"><div class="section-top"><h2>От ученика до академика</h2><span class="badge">7 ЗВАНИЙ</span></div><p class="muted">Экви растёт вместе с тобой: сначала появится шарф, затем очки, академическая шапочка и награды. Звания открываются автоматически за накопленный XP.</p><ol class="scholar-ladder">${SCHOLAR_RANKS.map((r,i)=>`<li class="${i===s.index?'current':i<s.index?'earned':'locked'}" ${i===s.index?'aria-current="step"':''}><span class="rank-seal" aria-hidden="true">${i<s.index?'✓':i+1}</span><div><strong>${r.name}</strong><span>${r.xp.toLocaleString('ru-RU')} XP · ${i<s.index?'открыто':i===s.index?'твоё звание':'впереди'}</span></div>${i===s.index?'<span class="badge">СЕЙЧАС</span>':''}</li>`).join('')}</ol></section><section class="panel"><h2>Прокачка — в твоих руках</h2><p class="muted">За новое задание в течение дня начисляется 10 XP, за верный ответ — ещё 5. Повтор того же задания в тот же день не даёт дополнительных XP. Выполни дневную цель и открой игру на английские слова.</p><div class="button-row"><a href="#practice" class="btn">К практике →</a><a href="#account" class="btn light">${typeof accountSession!=='undefined'&&accountSession?'Настройки аккаунта':'Вход и сохранение в аккаунте'}</a></div><p class="note">${typeof accountSession!=='undefined'&&accountSession?'Персонаж рассчитывается из XP этого аккаунта и входит в его прогресс.':'Пока прогресс хранится в этом браузере. При входе откроется персонаж выбранного аккаунта; прогресс гостя переносится вручную через JSON.'}</p></section>`;
}
function welcomePage(){
 const started=scholarHasProgress(),s=scholarRank();
 return `<div class="welcome-page"><nav class="welcome-nav" aria-label="Знакомство с Эквивалентом"><a class="welcome-brand" href="#welcome"><span>⇄</span>Эквивалент</a><div><a href="#welcome/how" data-welcome-scroll="welcome-how">Как это работает</a><a href="#welcome/inside" data-welcome-scroll="welcome-inside">Что внутри</a><a href="#account">Войти</a><a href="#${started?'home':'diagnostic'}" class="btn">${started?'К занятиям':'Начать'} →</a></div></nav>
 <section class="welcome-hero"><div class="welcome-hero-copy"><p class="eyebrow">АНГЛИЙСКИЙ, К КОТОРОМУ ХОЧЕТСЯ ВОЗВРАЩАТЬСЯ</p><h1>Привет!<br>Твой английский<br><em>может больше.</em></h1><p class="welcome-lead">Здесь ты в удобной и игровой форме прокачаешь свой английский. Поймёшь, с чего начать, разберёшь сложное и увидишь, как маленькие занятия складываются в прогресс.</p><div class="welcome-hero-actions"><a class="btn" href="#${started?'home':'diagnostic'}">${started?'Продолжить обучение':'Узнать свой уровень'} <span>↗</span></a><a class="welcome-try" href="#plan">Попробовать без теста →</a></div><div class="welcome-pills"><span>В своём темпе</span><span>Без таймера</span><span>Можно без регистрации</span></div></div>
 <div class="welcome-stage"><div class="welcome-orbit" aria-hidden="true"></div><span class="welcome-sticker sticker-one">Small steps.<br><b>Big progress.</b></span><div class="welcome-monkey">${scholarMonkey(s.index)}</div><div class="welcome-character-label"><span class="live-dot"></span>Экви · твой напарник в английском</div><span class="welcome-sticker sticker-two">+15 XP <span>за новый верный ответ</span></span></div></section>
 <section class="welcome-proof" aria-label="Что уже есть в тренажёре">${[[TOPICS.length,'тем грамматики'],[BANK.length.toLocaleString('ru-RU'),'заданий для практики'],['40','связанных уроков'],['322','текста для чтения и перевода']].map(([n,label])=>`<div><strong>${n}</strong><span>${label}</span></div>`).join('')}</section>
 <section class="welcome-section" id="welcome-how"><div class="welcome-section-heading"><p class="eyebrow">МЕНЬШЕ «ЗА ЧТО ВЗЯТЬСЯ?» — БОЛЬШЕ ПРАКТИКИ</p><h2>Открываешь — и знаешь,<br>что делать дальше.</h2><p>От первого ответа до следующего занятия — всё связано в один понятный маршрут.</p></div><div class="welcome-steps">${[['01','Найди свою точку старта','Пройди учебную диагностику или выбери уровень самостоятельно. От основ A0 до сложных тем C2.'],['02','Получи свой следующий шаг','План учитывает уровень, последние ответы и темы, которые требуют внимания. Решай новые примеры, а не крути одно и то же.'],['03','Преврати ошибки в опору','Разбери объяснение, проверь себя снова и вернись к заданию после перерыва. Так у сложного появляется понятный план.']].map(([n,title,text])=>`<article><span>${n}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
 <section class="welcome-demo-section"><div><p class="eyebrow">НЕ ПРОСТО «ВЕРНО» ИЛИ «НЕВЕРНО»</p><h2>Понятное объяснение.<br>И ещё одна попытка.</h2><p>В практике ты сразу видишь разбор ответа. Можно открыть правило, посмотреть перевод слова по нажатию и применить его на новых примерах.</p><a href="#grammar" class="welcome-try">Посмотреть темы грамматики →</a></div><div class="welcome-demo"><span class="badge">ПОПРОБУЙ ПРЯМО ЗДЕСЬ</span><p class="welcome-demo-prompt" lang="en">She ___ a teacher.</p><div class="welcome-demo-options">${['am','is','are'].map(w=>`<button type="button" data-action="welcome-demo:${w}">${w}</button>`).join('')}</div><p id="welcome-demo-feedback" role="status">Выбери подходящую форму to be.</p><span class="note">Мини-пример знакомства с тренажёром · без начисления XP.</span></div></section>
 <section class="welcome-section" id="welcome-inside"><div class="welcome-section-heading"><p class="eyebrow">СОБРАНО В ОДНОМ МЕСТЕ</p><h2>Всё связано.<br>Всё для твоей практики.</h2><p>Учишь правило, встречаешь его в тексте, слышишь в записи и возвращаешься к сложному.</p></div><div class="welcome-features">${[
 ['grammar','Aa','Грамматика с опорой','148 тем, короткие правила, примеры и разные форматы заданий. Выбирай тему или двигайся по плану.'],
 ['listen','♫','Английский на слух','Короткие записи: сначала общий смысл, затем детали и услышанные слова. Расшифровка — когда нужна поддержка.'],
 ['library','⇄','Чтение и перевод','322 параллельных текста, свой черновик и образец. Словарь по нажатию и кнопки копирования под рукой.'],
 ['vocabulary','+','Слова, которые остаются','Добавляй нужные слова в карточки. Повторяй их по сроку и пробуй вспоминать без подсказки.'],
 ['mistakes','↻','Ошибки работают на тебя','Сохраняй сложные места, разбирай причины и закрепляй ответы тремя проверками с перерывами.'],
 ['profile','✦','Игра, которая поддерживает','Набирай XP, открывай игру после дневной цели и развивай своего персонажа от ученика до академика.']
 ].map(([route,icon,title,text])=>`<a class="welcome-feature" href="#${route}"><span class="welcome-feature-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${text}</p><span class="welcome-feature-link">Открыть раздел ↗</span></a>`).join('')}</div></section>
 <section class="welcome-growth"><div class="welcome-growth-art">${scholarMonkey(5)}<span class="badge">ПРОФЕССОР · 3 000 XP</span><small>Одно из будущих званий твоего персонажа</small></div><div><p class="eyebrow">ПРОКАЧИВАЕТСЯ НЕ ТОЛЬКО АНГЛИЙСКИЙ</p><h2>Каждый шаг<br>меняет твою историю.</h2><p>Знакомься: это Экви. Заходи на короткую практику, получай XP и открывай новые звания. У персонажа появятся шарф, очки, академическая шапочка и награды.</p><div class="welcome-rank-chips">${SCHOLAR_RANKS.map(r=>`<span>${r.name}</span>`).join('')}</div><a href="#profile" class="btn">Посмотреть своего персонажа →</a><p class="note">Звания — игровая награда за активность, а не подтверждение уровня языка.</p></div></section>
 <section class="welcome-section welcome-faq"><div class="welcome-section-heading"><p class="eyebrow">ПЕРЕД ПЕРВЫМ ШАГОМ</p><h2>Возможно, ты хочешь спросить.</h2></div>${[
 ['Можно начать с нуля?','Да. Выбери A0: там есть вводные темы, местоимения, to be и простые предложения. Диагностика поможет сориентироваться, но проходить её необязательно.'],
 ['Нужно ли сразу создавать аккаунт?','Нет, можно сразу открыть задания. Гостевой прогресс хранится в этом браузере. В аккаунте доступна синхронизация прогресса между устройствами после входа.'],
 ['Это платно?','Сейчас материалы тренажёра открыты: можно начать без оплаты и подписки.'],
 ['Тест точно определит мой уровень?','Он даёт учебный ориентир по грамматике, лексике и чтению. Это не сертификат CEFR: речь, письмо и аудирование оцениваются отдельно.'],
 ['Как проверяется перевод?','Ответ сравнивается с сохранёнными вариантами. Свой перевод текста можно сопоставить с образцом; другой точный вариант ты можешь отметить самостоятельно. Автоматической оценки смысла перевода здесь нет.']
 ].map(([title,text])=>`<details><summary>${title}</summary><p>${text}</p></details>`).join('')}</section>
 <section class="welcome-final"><span class="eyebrow">ПО ОДНОМУ НЕБОЛЬШОМУ ШАГУ</span><h2>Начни с того,<br>что можешь сегодня.</h2><p>Один тест. Одно правило. Несколько новых слов.<br>Твой английский начинается с твоего следующего действия.</p><div class="button-row"><a class="btn" href="#${started?'home':'diagnostic'}">${started?'Продолжить занятия':'Начать мой маршрут'} →</a><a class="btn light" href="#plan">Выбрать уровень самому</a></div></section>
 <footer class="welcome-footer"><a class="welcome-brand" href="#welcome">⇄ Эквивалент</a><span>Понемногу. Каждый день.</span><div><a href="#about">О программе и материалах</a><a href="#account">Аккаунт</a></div></footer></div>`;
}
const scholarRoutes=renderEnrichment;
renderEnrichment=function(route,hash){
 const welcome=route==='welcome'||route==='home'&&!location.hash&&!scholarHasProgress();
 document.body.classList.toggle('public-welcome',welcome);
 if(welcome||route==='profile'){
  document.querySelector('#breadcrumb').textContent=welcome?'Знакомство':'Профиль и персонаж';
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(welcome?'welcome':'profile')));
  app.innerHTML=welcome?welcomePage():scholarProfilePage();return true;
 }
 return scholarRoutes(route,hash);
};
if(typeof accountPage==='function'){
 const scholarAccountPage=accountPage;
 accountPage=function(){const html=scholarAccountPage();return html.replace(/(<section class="panel account-summary"|<div class="account-layout")/,scholarCard(true)+'$1');};
}
function scholarUpdateHeader(){
 const link=document.querySelector('#account-link');if(!link)return;
 const s=scholarRank(),signed=typeof accountSession!=='undefined'&&accountSession;
 link.innerHTML=`${scholarMonkey(s.index,true)}<span class="scholar-header-label"><strong>${s.rank.name}</strong><small>${s.total.toLocaleString('ru-RU')} XP · ${signed?'Мой аккаунт':'Профиль гостя'}</small></span>`;
 link.setAttribute('aria-label',`${signed?'Мой аккаунт':'Вход и профиль гостя'}: ${s.rank.name}, ${s.total} XP`);
}
if(typeof accountSetStatus==='function'){
 const scholarAccountStatus=accountSetStatus;
 accountSetStatus=function(message){scholarAccountStatus(message);scholarUpdateHeader();};
}
const scholarRender=render;
render=function(){scholarRender();scholarUpdateHeader();};
app.addEventListener('click',e=>{
 const scroll=e.target.closest('[data-welcome-scroll]');
 if(scroll?.dataset?.welcomeScroll){e.preventDefault();document.getElementById(scroll.dataset.welcomeScroll)?.scrollIntoView({behavior:betaPrefs.quiet||window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});return;}
 const demo=e.target.closest('[data-action^="welcome-demo:"]');
 if(demo?.dataset?.action?.startsWith('welcome-demo:')){const right=demo.dataset.action==='welcome-demo:is',message=document.querySelector('#welcome-demo-feedback');message.textContent=right?'Верно! С she используем is: She is a teacher.':'Почти! С she используем is: She is a teacher. Попробуй ещё раз.';message.className=right?'demo-correct':'demo-explain';document.querySelectorAll('.welcome-demo-options button').forEach(b=>{b.classList.toggle('demo-selected',b===demo);b.setAttribute('aria-pressed',String(b===demo));});}
});
const scholarNav=document.querySelector('.sidebar nav');
if(scholarNav?.insertAdjacentHTML){
 scholarNav.insertAdjacentHTML('afterbegin','<div class="nav-group"><a href="#welcome" data-nav="welcome" title="Знакомство с Эквивалентом"><span class="nav-icon" aria-hidden="true">⇄</span><span class="nav-title">Знакомство</span></a></div>');
 const rewards=document.querySelector('[data-nav="rewards"]');
 rewards?.insertAdjacentHTML('afterend',`<a href="#profile" data-nav="profile" title="Профиль и персонаж"><span class="nav-icon" aria-hidden="true">${scholarMonkey(0,true)}</span><span class="nav-title">Профиль и персонаж</span></a>`);
}
render();
