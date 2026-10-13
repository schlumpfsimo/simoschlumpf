// Le registre des sources, rangées en quatre familles.
// Le flux alterne : une image sur deux, puis actualités, savoir et recherche.
import * as wiki from './wiki.js?v=202610132110';
import { ART_LOADERS, artMoreLike } from './art.js?v=202610132110';
import { loadPapers } from './papers.js?v=202610132110';

export { loadNews } from './news.js?v=202610132110';
export { loadWikiDaily, translate, meaningsDE, words, rabbitStart, rabbitNext } from './wiki.js?v=202610132110';

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
];

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
