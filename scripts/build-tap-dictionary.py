"""Build small same-origin lookup shards from the dictionaries supplied with 30.10.html."""
import json, re, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
out=ROOT/'data'/'tap-dictionary';out.mkdir(exist_ok=True)
def norm(w):
 return ''.join(c for c in unicodedata.normalize('NFD',w.lower().replace('’',"'")) if unicodedata.category(c)!='Mn').replace('ё','е')
rows={}
def add(word,meaning,source):
 key=norm(word)
 if not key or len(key)>80 or not re.fullmatch(r"[\w'-]+",key) or not meaning:return
 item=rows.setdefault(key,{'w':word,'m':[],'s':0 if source=='Учебный словарь' else 1 if source=='Общий словарь EN → RU' else 2})
 if meaning not in item['m'] and len(item['m'])<3:item['m'].append(meaning)
words=json.loads((ROOT/'data/words.json').read_text())
for w in words:
 for sense in w['s']:add(w['w'],sense[0],'Учебный словарь')
lex=json.loads((ROOT/'data/lexis.json').read_text())
for band in lex['bands'].values():
 for en,ru,*_ in band:add(en,ru,'Учебный словарь')
gen=json.loads((ROOT/'data/gendict.json').read_text())
heads={norm(w):senses for w,senses in gen['en']}
def meanings(senses,seen=None):
 seen=set() if seen is None else seen
 for sense in senses:
  ru=sense[2]
  if ru.startswith('→ '):
   key=norm(ru[2:].strip())
   if key not in seen and key in heads:
    seen.add(key);yield from meanings(heads[key],seen)
  elif ru:yield ru
for word,senses in gen['en']:
 for meaning in meanings(senses):add(word,meaning,'Общий словарь EN → RU')
for word,pos,en,*_ in gen['ru']:add(word,en,'Общий словарь RU → EN')
for form,indices in gen.get('rf',{}).items():
 for i in indices:
  if 0<=i<len(gen['ru']):
   word,pos,en,*_=gen['ru'][i];add(form,en,'Форма слова «'+word+'» · RU → EN')
for word,translations in gen.get('rx',{}).items():
 for en in translations[:4]:add(word,en,'Обратный указатель RU → EN')
shards=[{} for _ in range(32)]
for key,row in sorted(rows.items()):shards[sum(map(ord,key))%32][key]=row
for i,data in enumerate(shards):(out/(str(i)+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
(out/'manifest.json').write_text(json.dumps({'entries':len(rows),'shards':32,'source':'Dictionaries imported from 30.10.html. See ATTRIBUTION.md and #about.'},ensure_ascii=False))
print(len(rows),'lookup entries;',sum(p.stat().st_size for p in out.glob('*.json')),'bytes in 32 shards')
