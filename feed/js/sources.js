// Chaque source renvoie des cartes au même format :
// { id, kind, source, sourceLabel, label, lang, title, text, image, url, date, credit, tags, words }
// Toutes ces API sont publiques, sans clé.

const STOP = new Set(
  ('dans pour avec sont plus cette leur leurs entre apres avant sans sous comme mais elle elles nous vous tout tous toute ' +
    'deux trois etre avoir fait faire selon depuis dont chez vers aussi encore contre quand alors ainsi ' +
    'with that this from have were their which about after there ' +
    'oder eine einer einem einen nach auch sich nicht sind wird werden durch uber unter beim sein seine ihre ihrer liste').split(' ')
);

export function words(s) {
  const all = (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{4,}/g) || [];
  return [...new Set(all.filter((w) => !STOP.has(w)))];
}

function card(c) {
  return { tags: [], ...c, words: words(c.title) };
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const strip = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const bigger = (url) => (url || '').replace(/\/(\d+)px-/, (m, n) => (+n < 640 ? '/640px-' : m));

function ymd(d) {
  return [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')].join('/');
}

function shorten(s, max) {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
}

/* ---------- Actualités (news.json, mis à jour chaque heure par GitHub Actions) ---------- */

export async function loadNews() {
  const d = await getJSON('data/news.json?v=' + Math.floor(Date.now() / 9e5));
  return d.items.map((it) =>
    card({
      id: 'news:' + it.url,
      kind: 'news',
      source: it.source,
      sourceLabel: it.sourceLabel,
      label: (it.categories[0] || 'Actualité').toUpperCase(),
      lang: it.lang,
      title: it.title,
      text: it.summary,
      image: it.image,
      url: it.url,
      date: it.date,
      tags: it.categories.slice(0, 2).map((t) => t.toLowerCase()),
    })
  );
}

/* ---------- Wikipédia : le flux du jour (tendances, image du jour, éphéméride) ---------- */

function fromSummary(s, lang, extra) {
  return card({
    id: `wiki:${lang}:${s.titles.normalized}`,
    kind: 'article',
    source: 'wiki-' + lang,
    sourceLabel: lang === 'fr' ? 'Wikipédia' : 'Wikipedia (DE)',
    lang,
    title: s.titles.normalized,
    text: shorten(s.extract, 520),
    image: bigger(s.thumbnail?.source),
    url: s.content_urls?.mobile?.page,
    ...extra,
  });
}

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
          text: `personnes ont lu « ${top.titles.normalized} » sur Wikipédia hier. C'est l'article le plus lu en français.`,
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
        sourceLabel: lang === 'fr' ? 'Wikipédia' : 'Wikipedia (DE)',
        label: `IL Y A ${year - ev.year} ANS`,
        lang,
        year: ev.year,
        title: page.titles.normalized,
        text: ev.text,
        image: bigger(page.thumbnail?.source),
        url: page.content_urls?.mobile?.page,
        tags: ['histoire'],
      })
    );
  }
  return { cards, trend };
}

/* ---------- Wikipédia : articles au hasard, par thème ---------- */

const THEMES = {
  fr: [
    ['incategory:"Article de qualité"', 'ARTICLE DE QUALITÉ'],
    ['incategory:"Bon article"', 'BON ARTICLE'],
    ['Union européenne', 'EUROPE'],
    ['frontière', 'FRONTIÈRES'],
    ['Rhin supérieur', 'RHIN SUPÉRIEUR'],
    ['architecture moderne', 'ARCHITECTURE'],
    ['photographe de rue', 'PHOTOGRAPHIE'],
    ['Finlande', 'FINLANDE'],
    ['Suisse romande', 'SUISSE'],
    ['science politique', 'POLITIQUE'],
    ['traité international', 'POLITIQUE'],
  ],
  de: [
    ['incategory:"Wikipedia:Exzellent"', 'EXZELLENT'],
    ['incategory:"Wikipedia:Lesenswert"', 'LESENSWERT'],
    ['Grenze Europa', 'FRONTIÈRES'],
    ['Oberrhein', 'RHIN SUPÉRIEUR'],
    ['Karelien', 'CARÉLIE'],
    ['Bauhaus Architektur', 'ARCHITECTURE'],
  ],
};

function wikiApi(lang, params) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', exsentences: '5',
    piprop: 'thumbnail', pithumbsize: '640', inprop: 'url', gsrnamespace: '0',
    ...params,
  });
  return getJSON(`https://${lang}.wikipedia.org/w/api.php?${q}`);
}

function fromPages(d, lang, label, tag) {
  return (d.query?.pages || [])
    .filter((p) => p.extract && p.extract.length > 120)
    .map((p) =>
      card({
        id: `wiki:${lang}:${p.title}`,
        kind: 'article',
        source: 'wiki-' + lang,
        sourceLabel: lang === 'fr' ? 'Wikipédia' : 'Wikipedia (DE)',
        label,
        lang,
        title: p.title,
        text: shorten(p.extract, 520),
        image: p.thumbnail?.source,
        url: p.fullurl,
        tags: [tag],
      })
    );
}

export async function loadWikiTheme(lang) {
  const [query, label] = rand(THEMES[lang]);
  const d = await wikiApi(lang, { generator: 'search', gsrsearch: query, gsrlimit: '4', gsrsort: 'random' });
  return fromPages(d, lang, label, label.toLowerCase());
}

/* ---------- Plus comme ça ---------- */

export async function loadMoreLike(c) {
  if (c.source.startsWith('wiki-')) {
    const lang = c.source.slice(5);
    const d = await wikiApi(lang, { generator: 'search', gsrsearch: 'morelike:' + c.title, gsrlimit: '3' });
    return fromPages(d, lang, 'PLUS COMME ÇA', (c.tags[0] || 'similaire'));
  }
  if (c.source === 'finna') return loadFinna(c.words.slice(0, 2).join(' ') || undefined);
  if (c.source === 'commons') return loadCommons(c.words.slice(0, 2).join(' '));
  // Actualités : un article Wikipédia sur le même sujet.
  const d = await wikiApi('fr', { generator: 'search', gsrsearch: c.words.slice(0, 4).join(' '), gsrlimit: '2' });
  return fromPages(d, 'fr', 'POUR COMPRENDRE', c.tags[0] || 'contexte');
}

/* ---------- Wikimedia Commons : images de qualité ---------- */

export async function loadCommons(theme = rand(['', 'architecture', 'street', 'railway', 'city', 'Europe', 'landscape'])) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    generator: 'search', gsrnamespace: '6', gsrlimit: '4', gsrsort: 'random',
    gsrsearch: `filetype:bitmap incategory:"Featured_pictures_on_Wikimedia_Commons" ${theme}`.trim(),
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '720',
    iiextmetadatafilter: 'ImageDescription|Artist|LicenseShortName|ObjectName', iiextmetadatalanguage: 'fr',
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
        text: shorten(strip(m.ImageDescription?.value), 200),
        image: ii.thumburl,
        url: ii.descriptionurl,
        credit: [strip(m.Artist?.value), m.LicenseShortName?.value].filter(Boolean).join(' · '),
        tags: theme ? [theme.toLowerCase()] : [],
      });
    });
}

/* ---------- Finna : archives finlandaises (photos libres de droits) ---------- */

const FINNA_THEMES = ['karjala', 'kaupunki', 'arkkitehtuuri', 'rautatieasema', 'raja', 'katukuva', 'satama', 'Helsinki 1960'];

export async function loadFinna(theme = rand(FINNA_THEMES)) {
  const q = new URLSearchParams({ lookfor: theme, type: 'AllFields', limit: '4', page: String(1 + Math.floor(Math.random() * 30)) });
  for (const f of ['format:0/Image/', 'online_boolean:1', 'usage_rights_str_mv:usage_A']) q.append('filter[]', f);
  for (const f of ['id', 'title', 'images', 'year', 'buildings', 'imageRights']) q.append('field[]', f);
  const d = await getJSON('https://api.finna.fi/api/v1/search?' + q);
  return (d.records || [])
    .filter((r) => r.images?.length)
    .map((r) =>
      card({
        id: 'finna:' + r.id,
        kind: 'image',
        source: 'finna',
        sourceLabel: 'Finna',
        label: 'ARCHIVES · FINLANDE',
        lang: 'fi',
        title: shorten(r.title, 120),
        image: 'https://finna.fi' + r.images[0],
        url: 'https://finna.fi/Record/' + encodeURIComponent(r.id),
        credit: [r.buildings?.[0]?.translated, r.year, r.imageRights?.copyright].filter(Boolean).join(' · '),
        tags: [theme],
      })
    );
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
