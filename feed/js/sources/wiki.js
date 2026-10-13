// Wikimédia : Wikipédia (FR/DE/EN), Vikidia, Wikiquote, Wikidata, Commons, Wiktionary. Sans clé.
import { card, getJSON, rand, strip, shorten, words } from './util.js';
import { WIKI_FR, WIKI_DE, WIKI_EN, PLACES, QUOTES } from '../topics.js';

const bigger = (url) => (url || '').replace(/\/(\d+)px-/, (m, n) => (+n < 640 ? '/640px-' : m));
const WIKI_LABEL = { fr: 'Wikipédia', de: 'Wikipedia (DE)', en: 'Wikipedia (EN)' };

function ymd(d) {
  return [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')].join('/');
}

function fromSummary(s, lang, extra) {
  return card({
    id: `wiki:${lang}:${s.titles.normalized}`,
    kind: 'article',
    source: 'wiki-' + lang,
    sourceLabel: WIKI_LABEL[lang],
    lang,
    title: s.titles.normalized,
    text: s.extract,
    image: bigger(s.thumbnail?.source),
    url: s.content_urls?.mobile?.page,
    ...extra,
  });
}

/* ---------- Le flux du jour : tendances, image du jour, éphéméride ---------- */

export async function loadWikiDaily(lang) {
  const base = `https://${lang}.wikipedia.org/api/rest_v1/feed/featured/`;
  const d = await getJSON(base + ymd(new Date()));
  let mostread = d.mostread;
  if (!mostread) {
    try {
      mostread = (await getJSON(base + ymd(new Date(Date.now() - 864e5)))).mostread;
    } catch {}
  }
  const cards = [];
  const trend = [];

  if (d.tfa) cards.push(fromSummary(d.tfa, lang, { label: 'ARTICLE DU JOUR' }));

  if (d.image?.thumbnail) {
    cards.push(
      card({
        id: 'potd:' + d.image.title,
        kind: 'image',
        source: 'commons',
        sourceLabel: 'Wikimedia Commons',
        label: 'IMAGE DU JOUR',
        lang,
        title: strip(d.image.description?.text) || d.image.title.replace(/^File:|\.\w+$/g, ''),
        image: d.image.thumbnail.source,
        url: d.image.file_page,
        credit: [strip(d.image.artist?.text), d.image.license?.type].filter(Boolean).join(' · '),
      })
    );
  }

  if (mostread) {
    const arts = mostread.articles.filter((a) => a.type === 'standard' && a.namespace?.id === 0).slice(0, 15);
    trend.push(...arts.map((a) => a.titles.normalized));
    arts.slice(0, 4).forEach((a) => cards.push(fromSummary(a, lang, { label: 'TENDANCE', tags: ['tendance'] })));
    const top = arts[0];
    if (top && lang === 'fr') {
      cards.push(
        card({
          id: 'chiffre:' + mostread.date + ':' + top.titles.normalized,
          kind: 'chiffre',
          source: 'wiki-fr',
          sourceLabel: 'Wikipédia',
          label: 'LE CHIFFRE DU JOUR',
          lang: 'fr',
          number: top.views.toLocaleString('fr-CH'),
          title: top.titles.normalized,
          text: `personnes ont lu « ${top.titles.normalized} » sur Wikipédia hier.`,
          long: top.extract,
          url: top.content_urls?.mobile?.page,
        })
      );
    }
  }

  for (const n of d.news || []) trend.push(...n.links.map((l) => l.titles.normalized));

  const year = new Date().getFullYear();
  for (const ev of (d.onthisday || []).filter((e) => e.pages?.[0])) {
    const page = ev.pages[0];
    cards.push(
      card({
        id: `jour:${lang}:${ev.year}:${page.titles.normalized}`,
        kind: 'jour',
        source: 'wiki-' + lang,
        sourceLabel: WIKI_LABEL[lang],
        label: `IL Y A ${year - ev.year} ANS`,
        lang,
        year: ev.year,
        title: page.titles.normalized,
        text: ev.text,
        long: page.extract,
        image: bigger(page.thumbnail?.source),
        url: page.content_urls?.mobile?.page,
        tags: ['histoire'],
      })
    );
  }
  return { cards, trend };
}

/* ---------- Articles au hasard, par thème : la réserve infinie ---------- */

function wikiApi(host, params) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', exsentences: '4',
    piprop: 'thumbnail', pithumbsize: '640', inprop: 'url', gsrnamespace: '0',
    ...params,
  });
  return getJSON(`https://${host}/w/api.php?${q}`);
}

function fromPages(d, { lang, source, sourceLabel, label, tag }) {
  return (d.query?.pages || [])
    .filter((p) => p.extract && p.extract.length > 100)
    .map((p) =>
      card({
        id: `${source}:${p.title}`,
        kind: 'article',
        source,
        sourceLabel,
        label,
        lang,
        title: p.title,
        text: p.extract,
        image: p.thumbnail?.source,
        url: p.fullurl,
        tags: [tag],
      })
    );
}

const THEMES = { fr: WIKI_FR, de: WIKI_DE, en: WIKI_EN };

export async function loadWikiTheme(lang) {
  const [query, label] = rand(THEMES[lang]);
  const d = await wikiApi(`${lang}.wikipedia.org`, { generator: 'search', gsrsearch: query, gsrlimit: '4', gsrsort: 'random' });
  return fromPages(d, { lang, source: 'wiki-' + lang, sourceLabel: WIKI_LABEL[lang], label, tag: label.toLowerCase() });
}

// Vikidia : l'encyclopédie en français plus simple.
export async function loadVikidia() {
  const d = await wikiApi('fr.vikidia.org', { generator: 'random', grnnamespace: '0', grnlimit: '4' });
  return fromPages(d, { lang: 'fr', source: 'vikidia', sourceLabel: 'Vikidia', label: 'EN FRANÇAIS FACILE', tag: 'facile' });
}

/* ---------- Wikiquote : citations ---------- */

function cleanWikitext(t) {
  return t
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function loadQuotes() {
  const who = rand(QUOTES);
  const q = new URLSearchParams({ action: 'parse', page: who, prop: 'wikitext', format: 'json', formatversion: '2', origin: '*', redirects: '1' });
  const d = await getJSON('https://fr.wikiquote.org/w/api.php?' + q);
  const text = d.parse?.wikitext || '';
  const found = [...text.matchAll(/\{\{\s*[Cc]itation\s*\|\s*(?:citation\s*=\s*)?((?:[^{}]|\{\{[^{}]*\}\})+?)\s*(?:\||\}\})/g)]
    .map((m) => cleanWikitext(m[1]))
    .filter((s) => s.length > 30 && s.length < 320);
  const pickN = found.sort(() => Math.random() - 0.5).slice(0, 2);
  return pickN.map((quote) =>
    card({
      id: `quote:${who}:${quote.slice(0, 40)}`,
      kind: 'quote',
      source: 'wikiquote',
      sourceLabel: 'Wikiquote',
      label: 'CITATION',
      lang: 'fr',
      title: quote,
      author: who,
      url: 'https://fr.wikiquote.org/wiki/' + encodeURIComponent(who.replace(/ /g, '_')),
      tags: ['citation'],
    })
  );
}

/* ---------- Wikidata : des lieux réels (frontières, architecture) ---------- */

export async function loadPlaces() {
  const [pattern, label] = rand(PLACES);
  const seed = Math.random().toString(36).slice(2, 8);
  const sparql = `SELECT ?x ?xLabel ?xDescription ?img ?article WHERE {
    ?x ${pattern} ; wdt:P18 ?img .
    OPTIONAL { ?article schema:about ?x ; schema:isPartOf <https://fr.wikipedia.org/> . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,de,en". }
  } ORDER BY MD5(CONCAT(STR(?x), "${seed}")) LIMIT 3`;
  const d = await getJSON('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql));
  return d.results.bindings
    .filter((b) => !/^Q\d+$/.test(b.xLabel?.value))
    .map((b) =>
      card({
        id: 'place:' + b.x.value,
        kind: 'image',
        source: 'wikidata',
        sourceLabel: 'Wikidata',
        label,
        lang: 'fr',
        title: b.xLabel.value,
        text: b.xDescription?.value || '',
        image: b.img.value + '?width=720',
        imageLarge: b.img.value + '?width=1200',
        url: b.article?.value || b.x.value,
        tags: [label.toLowerCase()],
      })
    );
}

/* ---------- Wikimedia Commons : images remarquables ---------- */

export async function loadCommons(theme = rand(['', 'architecture', 'street', 'railway', 'city', 'Europe', 'landscape', 'night', 'bridge', 'harbour', 'mountain'])) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    generator: 'search', gsrnamespace: '6', gsrlimit: '4', gsrsort: 'random',
    gsrsearch: `filetype:bitmap incategory:"Featured_pictures_on_Wikimedia_Commons" ${theme}`.trim(),
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '720',
    iiextmetadatafilter: 'ImageDescription|Artist|LicenseShortName|ObjectName|DateTimeOriginal', iiextmetadatalanguage: 'fr',
  });
  const d = await getJSON('https://commons.wikimedia.org/w/api.php?' + q);
  return (d.query?.pages || [])
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .map((p) => {
      const ii = p.imageinfo[0];
      const m = ii.extmetadata || {};
      return card({
        id: 'commons:' + p.title,
        kind: 'image',
        source: 'commons',
        sourceLabel: 'Wikimedia Commons',
        label: 'IMAGE',
        lang: 'fr',
        title: shorten(strip(m.ObjectName?.value) || p.title.replace(/^File:|\.\w+$/g, ''), 120),
        text: strip(m.ImageDescription?.value),
        image: ii.thumburl,
        url: ii.descriptionurl,
        credit: [strip(m.Artist?.value), m.LicenseShortName?.value].filter(Boolean).join(' · '),
        facts: [['Date', strip(m.DateTimeOriginal?.value)]],
        tags: theme ? [theme.toLowerCase()] : [],
      });
    });
}

/* ---------- Plus comme ça ---------- */

export async function wikiMoreLike(c) {
  const lang = c.lang in THEMES ? c.lang : 'fr';
  if (c.source.startsWith('wiki-')) {
    const d = await wikiApi(`${lang}.wikipedia.org`, { generator: 'search', gsrsearch: 'morelike:' + c.title, gsrlimit: '3' });
    return fromPages(d, { lang, source: 'wiki-' + lang, sourceLabel: WIKI_LABEL[lang], label: 'PLUS COMME ÇA', tag: c.tags[0] || 'similaire' });
  }
  // Pour tout le reste : un article Wikipédia sur le même sujet.
  const d = await wikiApi('fr.wikipedia.org', { generator: 'search', gsrsearch: c.words.slice(0, 4).join(' '), gsrlimit: '2' });
  return fromPages(d, { lang: 'fr', source: 'wiki-fr', sourceLabel: 'Wikipédia', label: 'POUR COMPRENDRE', tag: c.tags[0] || 'contexte' });
}

/* ---------- Vue détaillée : l'article plus long ---------- */

export async function wikiLong(c) {
  const host = c.source === 'vikidia' ? 'fr.vikidia.org' : `${c.lang}.wikipedia.org`;
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1',
    prop: 'extracts|pageimages', explaintext: '1', exchars: '3000', piprop: 'thumbnail', pithumbsize: '1000', titles: c.title,
  });
  const p = (await getJSON(`https://${host}/w/api.php?${q}`)).query?.pages?.[0];
  return { long: p?.extract, imageLarge: p?.thumbnail?.source };
}

/* ---------- Dictionnaire (Wiktionary, sens en anglais) ---------- */

export async function define(word) {
  for (const w of [...new Set([word, word.toLowerCase()])]) {
    try {
      const d = await getJSON('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(w));
      if (d.fr?.length) {
        return d.fr.slice(0, 3).map((e) => ({
          pos: e.partOfSpeech,
          defs: e.definitions.map((x) => strip(x.definition)).filter(Boolean).slice(0, 3),
        }));
      }
    } catch {}
  }
  return null;
}

export { words };
