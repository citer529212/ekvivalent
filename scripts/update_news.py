"""Refresh BBC RSS summaries; retain the previous snapshot if all feeds fail."""
import datetime as dt
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET

FEEDS = {'world': 'https://feeds.bbci.co.uk/news/world/rss.xml',
         'science': 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
         'technology': 'https://feeds.bbci.co.uk/news/technology/rss.xml'}

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', value or ''))).strip()

def main():
    articles, seen, failed = [], set(), []
    for section, url in FEEDS.items():
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Ekvivalent English learning RSS reader/1.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                root = ET.fromstring(response.read(2_000_000))
            for item in root.findall('./channel/item')[:25]:
                link = item.findtext('link', '').split('#')[0]
                if not re.match(r'^https://(?:www\.)?bbc\.(?:com|co\.uk)/', link) or link in seen:
                    continue
                title, summary = clean(item.findtext('title')), clean(item.findtext('description'))
                if not title or not summary:
                    continue
                seen.add(link)
                articles.append(dict(id=hashlib.sha256(link.encode()).hexdigest()[:16], title=title,
                    summary=summary, url=link, published=item.findtext('pubDate', ''), section=section))
        except Exception as exc:
            failed.append(section)
            print(f'Feed unavailable: {section}: {type(exc).__name__}')
    if not articles:
        raise SystemExit('No feeds succeeded; keeping previous data')
    payload = dict(updated=dt.datetime.now(dt.timezone.utc).isoformat(), source='BBC News RSS',
                   feeds=FEEDS, unavailable=failed, articles=articles)
    target = Path(__file__).resolve().parents[1] / 'data/news.json'
    temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temp.replace(target)
    print(f'Saved {len(articles)} BBC summaries')

if __name__ == '__main__':
    main()
