'use strict';
let newsLevel='all',newsSection='all',newsData=null,newsLoading=null,newsError=false,newsSentence=0,newsCurrentArticle='';
const NEWS_SECTIONS={world:'Мир',science:'Наука и природа',technology:'Технологии'};
function newsBand(article){
 const words=(article.title+' '+article.summary).match(/[a-z]+(?:'[a-z]+)?/gi)||[];
 const long=words.filter(w=>w.length>=9).length/Math.max(1,words.length);
 return words.length>55||long>.2?'C1':words.length>35||long>.12?'B2':'B1';
}
function newsUrl(url){try{const u=new URL(url);return u.protocol==='https:'&&/^(www\.)?bbc\.(com|co\.uk)$/.test(u.hostname)?u.href:'';}catch(e){return '';}}
function newsDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Дата неизвестна':d.toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});}
function newsNote(article){return state.reading?.['bbc-'+article.id]||{};}
function newsSave(article,field,value){
 state.reading??={};const key='bbc-'+article.id;state.reading[key]??={};
 state.reading[key][field]=value;state.reading[key].article=article;state.reading[key].updated=new Date().toISOString();persist();
}
function newsLoad(force=false){
 if(newsLoading)return newsLoading;
 if(newsData&&!force)return Promise.resolve(newsData);
 newsError=false;
 newsLoading=fetch('data/news.json?v='+Math.floor(Date.now()/300000),{cache:'no-cache'})
 .then(r=>{if(!r.ok)throw Error('news');return r.json();})
 .then(d=>{if(!Array.isArray(d.articles)||!d.updated)throw Error('news');newsData={...d,articles:d.articles.filter(a=>a&&typeof a.id==='string'&&/^[a-f0-9]{16}$/.test(a.id)&&typeof a.title==='string'&&typeof a.summary==='string'&&newsUrl(a.url))};return newsData;})
 .catch(()=>{newsError=true;return newsData;})
 .finally(()=>{newsLoading=null;if(location.hash.startsWith('#news'))render();});
 return newsLoading;
}
function newsSentences(article){return [article.title,...(article.summary.match(/[^.!?]+(?:[.!?]+|$)/g)||[article.summary]).map(s=>s.trim()).filter(Boolean)];}
function newsWorkspace(article){
 const note=newsNote(article),parts=newsSentences(article);newsSentence=Math.min(newsSentence,parts.length-1);
 const easy=['A1','A2'].includes(newsLevel);
 return `<a class="text-link" href="#news">← Все новости</a>${intro('BBC · '+escape(NEWS_SECTIONS[article.section]||'Новости'),'Мастерская перевода','Читайте оригинал, разбирайте слова и сохраняйте свой перевод.')}<div class="news-meta"><span>Оригинал ≈ ${newsBand(article)}</span><span>${escape(newsDate(article.published))}</span><a class="text-link" href="${escape(newsUrl(article.url))}" target="_blank" rel="noopener noreferrer">Полная статья на BBC ↗</a></div><div class="translation-grid news-workspace"><section class="panel"><p class="eyebrow">ЗАГОЛОВОК И АНОНС BBC</p><div id="news-source" class="reading-text" lang="en"><h2>${betaTokenizeText(article.title)}</h2><p>${betaTokenizeText(article.summary)}</p></div><p class="tap-hint">Нажмите на слово: перевод, произношение и добавление в карточки.</p>${betaCopyButton('#news-source','Копировать заголовок и анонс')}<p class="note">Это исходный анонс RSS, без адаптации. Полный текст доступен на сайте BBC.</p></section><section class="panel"><h2>Перевод по шагам</h2>${easy?'<p class="notice">Для A1–A2 начните с заголовка: найдите, кто действует и что происходит. Оригинальные новости сложнее вашего уровня; используйте словарь.</p>':''}<div class="news-sentence-nav"><button class="btn light" data-action="news-prev" ${newsSentence===0?'disabled':''} aria-label="Предыдущее предложение">←</button><span>${newsSentence===0?'Заголовок':'Фрагмент '+newsSentence} · ${newsSentence+1} / ${parts.length}</span><button class="btn light" data-action="news-next" ${newsSentence===parts.length-1?'disabled':''} aria-label="Следующее предложение">→</button></div><p class="reading-text news-active-sentence" lang="en">${betaTokenizeText(parts[newsSentence])}</p><label class="answer-label">Мой перевод этого фрагмента<textarea id="news-fragment" rows="3" data-article="${article.id}">${escape(note.fragments?.[newsSentence]||'')}</textarea></label><details><summary>Как проверить себя</summary><p class="note">Найдите подлежащее и сказуемое. Проверьте время, отрицание, имена и числа. Затем передайте смысл естественным русским предложением. Это самостоятельная работа: автоматическая оценка и эталонный перевод не выдаются.</p><a class="text-link" href="https://translate.google.com/?sl=en&tl=ru&text=${encodeURIComponent(parts[newsSentence])}&op=translate" target="_blank" rel="noopener noreferrer">Сравнить с машинным переводом ↗</a><p class="note">Откроется Google Translate с выбранным фрагментом BBC. Машинный перевод может ошибаться.</p></details><label class="answer-label">Мой перевод новости целиком<textarea id="news-draft" rows="7" data-article="${article.id}">${escape(note.draft||'')}</textarea></label><div class="button-row">${betaCopyButton('#news-draft','Копировать мой перевод')}<button class="btn light" data-action="news-complete" data-article="${article.id}" aria-pressed="${!!note.complete}">${note.complete?'✓ Отмечено как прочитанное':'Отметить как прочитанное'}</button></div><p class="note" id="news-save-status" role="status">Черновик сохраняется в прогрессе текущего профиля.</p></section></div>`;
}
function newsPage(id){
 if(!newsData&&!newsError){newsLoad();return intro('LIVE READING','Новости BBC','Загружаем последние заголовки и анонсы…');}
 if(!newsData)return intro('BBC NEWS','Новости не загрузились','Проверьте подключение и попробуйте снова.')+button('Повторить загрузку','news-refresh');
 const age=Date.now()-new Date(newsData.updated).getTime(),stale=age>86400000;
 const status=`<div class="news-update"><span>Лента обновлена: ${escape(newsDate(newsData.updated))}${stale?' · данные старше суток':''}</span>${button('Обновить ленту','news-refresh','light')}</div>${newsData.unavailable?.length?'<p class="note">Часть тематических лент временно недоступна. Показаны новости из доступных источников BBC.</p>':''}${newsError?'<p class="notice" role="status">Обновить ленту не удалось. Показаны ранее загруженные новости.</p>':''}`;
 if(id){const saved=state.reading?.['bbc-'+id]?.article;const article=newsData.articles.find(a=>a.id===id)||(saved&&typeof saved.title==='string'&&typeof saved.summary==='string'&&newsUrl(saved.url)?saved:null);return status+(article?newsWorkspace(article):'<div class="panel"><h1>Новость уже вышла из ленты</h1><p>Ваши черновики сохранены в прогрессе профиля.</p><a class="btn" href="#news">К свежим новостям →</a></div>');}
 const rows=newsData.articles.filter(a=>(newsSection==='all'||a.section===newsSection)&&(newsLevel==='all'||['A1','A2'].includes(newsLevel)||newsBand(a)===(newsLevel==='C2'?'C1':newsLevel)));
 return intro('READ THE REAL WORLD','Английский в новостях','Реальные новости BBC: короткий текст, словарь и собственный перевод.')+status+`<div class="panel news-filters"><label>Мой уровень<select id="news-level">${['all','A1','A2','B1','B2','C1','C2'].map(l=>`<option value="${l}" ${newsLevel===l?'selected':''}>${l==='all'?'Все уровни':l}</option>`).join('')}</select></label><label>Тема<select id="news-section">${Object.entries({all:'Все темы',...NEWS_SECTIONS}).map(([k,v])=>`<option value="${k}" ${newsSection===k?'selected':''}>${v}</option>`).join('')}</select></label><p class="note">B1–C1 — приблизительная оценка длины и лексической сложности анонса, не сертификация CEFR. Для A1–A2 доступны заголовки с пошаговыми подсказками; C2 — работа с наиболее сложными анонсами и полной статьёй.</p></div><div class="news-grid">${rows.map(a=>`<article class="panel news-card"><div class="news-meta"><span>${escape(NEWS_SECTIONS[a.section]||'BBC')}</span><span>≈ ${newsBand(a)}</span></div><h2 lang="en">${escape(a.title)}</h2><p lang="en">${escape(a.summary)}</p><p class="note">${escape(newsDate(a.published))}${newsNote(a).complete?' · ✓ Прочитано':''}</p><a class="btn light" href="#news/${a.id}">Читать и переводить →</a></article>`).join('')||'<div class="panel"><h2>В этой подборке пока нет новостей</h2><p>Выберите другой уровень или тему.</p></div>'}</div><p class="note">Источник: <a class="text-link" href="https://feeds.bbci.co.uk/news/world/rss.xml" target="_blank" rel="noopener">BBC News RSS</a>. Заголовки и анонсы принадлежат BBC. Новые выпуски загружаются на сайт каждые 6 часов при доступности источника и GitHub Actions.</p>`;
}
const newsRenderEnrichment=renderEnrichment;
renderEnrichment=function(route,hash){
 if(route!=='news')return newsRenderEnrichment(route,hash);
 document.querySelector('#breadcrumb').textContent='Новости BBC';
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav==='news'));
 const id=hash.split('/')[1]||'';if(id!==newsCurrentArticle){newsSentence=0;newsCurrentArticle=id;}
 app.innerHTML=newsPage(id);return true;
};
app.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const action=el.dataset.action;
 if(action==='news-refresh'){newsLoad(true);return;}
 if(action==='news-prev'||action==='news-next'){newsSentence=Math.max(0,newsSentence+(action==='news-next'?1:-1));render();return;}
 if(action==='news-complete'){const article=newsData?.articles.find(a=>a.id===el.dataset.article);if(article){newsSave(article,'complete',!newsNote(article).complete);render();}}
});
app.addEventListener('change',e=>{if(e.target.id==='news-level'){newsLevel=e.target.value;newsSentence=0;render();}if(e.target.id==='news-section'){newsSection=e.target.value;render();}});
app.addEventListener('input',e=>{
 if(!['news-draft','news-fragment'].includes(e.target.id))return;
 const article=newsData?.articles.find(a=>a.id===e.target.dataset.article);if(!article)return;
 if(e.target.id==='news-draft')newsSave(article,'draft',e.target.value);
 else newsSave(article,'fragments',{...(newsNote(article).fragments||{}),[newsSentence]:e.target.value});
 const status=document.querySelector('#news-save-status');if(status)status.textContent=storageOK?'✓ Черновик сохранён в этом профиле.':'Не удалось сохранить. Скопируйте перевод перед выходом.';
});
render();
