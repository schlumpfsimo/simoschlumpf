// Récupère les flux RSS et écrit feed/data/news.json.
// Lancé chaque heure par .github/workflows/feed-news.yml. Aucune dépendance.
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../../feed/data/news.json', import.meta.url);
const PER_SOURCE = 15;
const UA = 'Mozilla/5.0 (compatible; Flaneur/1.0; +https://www.simoschlumpf.ch/feed/)';

const SOURCES = [
  { key: 'lgc', label: 'Le Grand Continent', lang: 'fr', url: 'https://legrandcontinent.eu/fr/feed/' },
  { key: 'rfi', label: 'RFI', lang: 'fr', url: 'https://www.rfi.fr/fr/rss' },
  { key: 'letemps', label: 'Le Temps', lang: 'fr', url: 'https://www.letemps.ch/articles.rss' },
];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—' };

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function text(html) {
  return decode(decode(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function shorten(s, max = 320) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
}

// Premier paragraphe qui ressemble à du vrai texte (sans pub ni « apparu en premier sur »).
function summary(item) {
  const html = decode(tag(item, 'content:encoded') || tag(item, 'description'));
  const paras = [...html.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .filter((m) => !/non-subscribers|post__read-more/.test(m[1] || ''))
    .map((m) => text(m[2]))
    .filter((p) => p.length > 80 && !/apparu en premier sur|Lire aussi/.test(p));
  return shorten(paras[0] || text(html));
}

function image(item) {
  const m =
    item.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i) ||
    item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ||
    decode(item).match(/<img[^>]*src="([^"]+)"/i);
  return m ? decode(m[1]) : '';
}

async function ogImage(url) {
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    const m = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    return m ? decode(m[1]) : '';
  } catch {
    return '';
  }
}

async function fetchSource(src, known) {
  const res = await fetch(src.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${src.key}: HTTP ${res.status}`);
  const xml = await res.text();
  const items = xml.split(/<item[\s>]/).slice(1, PER_SOURCE + 1);
  const out = [];
  for (const item of items) {
    const url = text(tag(item, 'link'));
    const title = text(tag(item, 'title'));
    if (!url || !title) continue;
    const date = new Date(text(tag(item, 'pubDate')) || Date.now());
    const categories = [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => text(m[1])).filter(Boolean);
    let img = image(item) || known.get(url)?.image || '';
    if (!img) img = await ogImage(url);
    out.push({
      source: src.key,
      sourceLabel: src.label,
      lang: src.lang,
      title,
      summary: summary(item),
      url,
      image: img,
      date: isNaN(date) ? new Date().toISOString() : date.toISOString(),
      categories: categories.slice(0, 3),
    });
  }
  return out;
}

let previous = { items: [] };
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch {}
const known = new Map(previous.items.map((it) => [it.url, it]));

const results = await Promise.allSettled(SOURCES.map((s) => fetchSource(s, known)));
const items = [];
results.forEach((r, i) => {
  if (r.status === 'fulfilled') items.push(...r.value);
  else {
    console.warn(r.reason.message);
    // Source en panne : on garde ses anciens articles plutôt que de les perdre.
    items.push(...previous.items.filter((it) => it.source === SOURCES[i].key));
  }
});
items.sort((a, b) => b.date.localeCompare(a.date));

const unchanged = JSON.stringify(items) === JSON.stringify(previous.items);
if (unchanged) {
  console.log('Rien de nouveau.');
} else {
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), items }, null, 1) + '\n');
  console.log(`${items.length} articles écrits.`);
}
