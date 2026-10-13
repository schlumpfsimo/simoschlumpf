// Outils communs. Chaque source renvoie des cartes au même format :
// { id, kind, source, sourceLabel, label, lang, title, text, long, image, imageLarge,
//   url, date, credit, facts: [[clé, valeur]], tags, words }

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

export function card(c) {
  return { tags: [], facts: [], ...c, words: words(c.title) };
}

export async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

export const rand = (a) => a[Math.floor(Math.random() * a.length)];
export const randInt = (n) => Math.floor(Math.random() * n);
export const strip = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const first = (x) => (Array.isArray(x) ? x[0] : x);

export function shorten(s, max) {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
}
