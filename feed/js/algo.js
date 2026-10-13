// L'algorithme : des poids par source, type et thème, appris de ce que tu fais.
// 20 % des cartes sont tirées au hasard pour ne pas s'enfermer dans une bulle.
import { load, save } from './store.js?v=202610132110';

const EXPLORE = 0.2;
const FRENCH_PUSH = 1.35;
// Après une image : actualités, savoir ou recherche, dans ces proportions (modulées par ce que tu aimes).
const MIX = { news: 0.45, savoir: 0.35, paper: 0.2 };

let profile = load('profil', { w: {} });
let trending = new Set();

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function features(card) {
  return ['cat:' + card.cat, 'src:' + card.source, 'type:' + card.kind, ...(card.tags || []).map((t) => 'tag:' + t)];
}

export function weight(key) {
  return profile.w[key] ?? 1;
}

export function reward(card, delta) {
  for (const f of features(card)) profile.w[f] = clamp(weight(f) * Math.exp(delta), 0.2, 5);
  save('profil', profile);
}

export function resetProfile() {
  profile = { w: {} };
  save('profil', profile);
}

export function setTrending(words) {
  trending = new Set(words);
}

export function trendHits(card) {
  return (card.words || []).filter((w) => trending.has(w)).length;
}

function score(card, recent) {
  const tags = (card.tags || []).map((t) => weight('tag:' + t));
  const tagW = tags.length ? tags.reduce((a, b) => a + b) / tags.length : 1;
  let s = weight('src:' + card.source) * weight('type:' + card.kind) * tagW;
  s *= 1 + 0.4 * Math.min(trendHits(card), 3);
  if (card.lang === 'fr') s *= FRENCH_PUSH;
  if (card.date) {
    const hours = (Date.now() - new Date(card.date)) / 36e5;
    s *= Math.max(0.35, Math.pow(0.5, hours / 36));
  }
  // Variété : pas deux fois de suite la même source, pas trois fois le même type.
  if (recent.some((r) => r.source === card.source)) s *= 0.35;
  if (recent.length === 2 && recent.every((r) => r.kind === card.kind)) s *= 0.25;
  return s;
}

function weighted(items, w) {
  const ws = items.map(w);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  const i = ws.findIndex((x) => (r -= x) <= 0);
  return items[i < 0 ? items.length - 1 : i];
}

// La famille voulue pour la prochaine carte : une image sur deux.
export function nextCategory(recent) {
  if (recent.at(-1)?.cat !== 'image') return 'image';
  return weighted(Object.keys(MIX), (k) => MIX[k] * weight('cat:' + k));
}

// Retire et renvoie la prochaine carte du pool, dans la famille voulue si possible.
export function pick(pool, recent, want = nextCategory(recent)) {
  if (!pool.length) return null;
  let candidates = pool.filter((c) => c.cat === want);
  if (!candidates.length && want !== 'image') candidates = pool.filter((c) => c.cat !== 'image');
  if (!candidates.length) candidates = pool;
  const c = Math.random() < EXPLORE
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : weighted(candidates, (x) => score(x, recent));
  pool.splice(pool.indexOf(c), 1);
  return c;
}
