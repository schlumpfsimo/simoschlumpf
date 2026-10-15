// Le registre des sources, rangées en quatre familles.
// Le flux alterne : une image sur deux, puis actualités, savoir et recherche.
import * as wiki from './wiki.js?v=202610150659';
import * as art from './art.js?v=202610150659';
import { ART_LOADERS, artMoreLike } from './art.js?v=202610150659';
import { PAPERS_PP } from '../topics.js?v=202610150659';
import { loadPapers, fromWork } from './papers.js?v=202610150659';

import { loadNews } from './news.js?v=202610150659';
import { getJSON } from './util.js?v=202610150659';
export { loadNews } from './news.js?v=202610150659';
export { loadWikiDaily, translate, meaningsDE, words, rabbitStart, rabbitNext } from './wiki.js?v=202610150659';

export function category(c) {
  if (c.kind === 'image') return 'image';
  if (c.kind === 'news') return 'news';
  if (c.kind === 'paper') return 'paper';
  return 'savoir';
}

// [clé de source, fonction, poids de départ, famille]
export const LOADERS = [
  ...ART_LOADERS.map(([key, fn, w]) => [key, () => fn(), w, 'image']),
  ['commons', () => wiki.loadCommons(), 1.1, 'image'],
  ['commons-contemporain', () => wiki.loadContemporary(), 1.3, 'image'],
  ['wikidata', () => wiki.loadPlaces(), 0.9, 'image'],
  ['wiki-fr', () => wiki.loadWikiTheme('fr'), 2, 'savoir'],
  ['wiki-de', () => wiki.loadWikiTheme('de'), 0.7, 'savoir'],
  ['wiki-en', () => wiki.loadWikiTheme('en'), 0.4, 'savoir'],
  ['vikidia', () => wiki.loadVikidia(), 0.5, 'savoir'],
  ['wikiquote', () => wiki.loadQuotes(), 0.6, 'savoir'],
  ['openalex', () => loadPapers(), 1, 'paper'],
  // Parti pris (dosé par l'algorithme, voir algo.js)
  ['wiki-pp-fr', () => wiki.loadWikiPP('fr'), 1.2, 'savoir'],
  ['wiki-pp-de', () => wiki.loadWikiPP('de'), 0.4, 'savoir'],
  ['openalex-pp', () => loadPapers(PAPERS_PP, true), 0.8, 'paper'],
];

// L'artiste d'une œuvre, nettoyé (« Paul Klee (Swiss, 1879–1940) » → « Paul Klee »).
export function artistOf(c) {
  const raw = (c.facts || []).find(([k]) => /Artiste|Auteur/.test(k))?.[1] || '';
  const name = raw.split('\n')[0].replace(/\(.*$/, '').replace(/,.*$/, '').trim();
  return name && name.length < 40 && !/unknown|anonym|inconnu|unbekannt/i.test(name) ? name : null;
}

// Une série : le même catalogue, interrogé avec le nom de l'artiste.
export function loadSeries(c, artist) {
  const entry = ART_LOADERS.find(([key]) => key === c.source);
  return entry ? entry[1](artist) : null;
}

export async function loadMoreLike(c) {
  if (c.kind === 'image') {
    const more = artMoreLike(c);
    if (more) return more;
    if (c.source === 'commons') return wiki.loadCommons(c.words.slice(0, 2).join(' '));
    if (c.source === 'commons-contemporain') return wiki.loadContemporary();
  }
  if (c.kind === 'paper') return loadPapers();
  return wiki.wikiMoreLike(c);
}

// Contenu supplémentaire pour la vue détaillée.
export async function loadDetail(c) {
  if (c.kind === 'article' && /^wiki-|^vikidia$/.test(c.source)) return wiki.wikiLong(c);
  return {};
}

/* ---------- Liens partagés : une référence courte, retrouvée à l'ouverture ---------- */

// Empreinte courte et stable d'une adresse (FNV-1a), pour les actualités.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

export function refOf(c) {
  if (c.kind === 'news' && c.url) return 'n:' + hash(c.url);
  if (c.kind === 'paper') return 'p:' + c.id.replace(/^paper:https:\/\/openalex\.org\//, '');
  const wiki = c.id?.match(/^wiki[-:](\w+):(.+)$/);
  if (wiki) return `w:${wiki[1]}:${wiki[2]}`;
  if (/^(aic|met|cma|smk|wellcome|openverse|finna|commons|vikidia):/.test(c.id || '')) return c.id;
  return null;
}

const FINNA_FIELDS = ['id', 'title', 'images', 'year', 'buildings', 'imageRights', 'summary', 'nonPresenterAuthors'];

export async function loadRef(ref) {
  const [, kind, rest] = ref.match(/^(\w+):(.+)$/) || [];
  switch (kind) {
    case 'n':
      return (await loadNews()).find((c) => hash(c.url) === rest) || null;
    case 'p':
      return fromWork(await getJSON(`https://api.openalex.org/works/${rest}?select=id,doi,title,publication_date,authorships,primary_location,abstract_inverted_index,open_access`));
    case 'w': {
      const [, lang, title] = rest.match(/^(\w+):(.+)$/);
      return wiki.articleByTitle(lang, title);
    }
    case 'vikidia':
      return wiki.articleByTitle('vikidia', rest);
    case 'commons':
      return wiki.commonsByTitle(rest);
    case 'aic':
      return art.fromAIC((await getJSON(`https://api.artic.edu/api/v1/artworks/${rest}?fields=id,title,image_id,artist_display,date_display,medium_display,place_of_origin,description`)).data);
    case 'met':
      return art.fromMet(await getJSON('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + rest));
    case 'cma':
      return art.fromCleveland((await getJSON('https://openaccess-api.clevelandart.org/api/artworks/' + rest)).data);
    case 'smk':
      return art.fromSMK((await getJSON('https://api.smk.dk/api/v1/art/?object_number=' + encodeURIComponent(rest))).items[0]);
    case 'wellcome':
      return art.fromWellcome(await getJSON('https://api.wellcomecollection.org/catalogue/v2/images/' + rest));
    case 'openverse':
      return art.fromOpenverse(await getJSON(`https://api.openverse.org/v1/images/${rest}/`));
    case 'finna':
      return art.fromFinna((await getJSON(`https://api.finna.fi/api/v1/record?id=${encodeURIComponent(rest)}&${FINNA_FIELDS.map((f) => 'field[]=' + f).join('&')}`)).records[0]);
    default:
      return null;
  }
}
