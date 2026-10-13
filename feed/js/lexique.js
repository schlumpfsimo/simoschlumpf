// Ton lexique : les mots enregistrés reviennent dans le flux à intervalles croissants.
import { load, save } from './store.js?v=202610132127';

const DAYS = [1, 3, 7, 16, 35, 90];
const DAY = 864e5;

export function list() {
  return load('lexique', []);
}

export function has(word) {
  return list().some((e) => e.w === word);
}

export function add(word, def) {
  const all = list();
  if (all.some((e) => e.w === word)) return;
  all.unshift({ w: word, def, added: Date.now(), step: 0, due: Date.now() + DAY });
  save('lexique', all);
}

export function remove(word) {
  save('lexique', list().filter((e) => e.w !== word));
}

export function due(exclude) {
  return list().find((e) => e.due <= Date.now() && !exclude.has(e.w)) || null;
}

export function review(word, knew) {
  const all = list();
  const e = all.find((x) => x.w === word);
  if (!e) return;
  e.step = knew ? Math.min(e.step + 1, DAYS.length - 1) : 0;
  e.due = Date.now() + DAYS[e.step] * DAY;
  save('lexique', all);
}
