import { load, save, exportAll, importAll } from './store.js';
import { pick, reward, resetProfile, setTrending, weight } from './algo.js';
import * as src from './sources.js';
import * as lex from './lexique.js';

const feed = document.getElementById('feed');
const sheet = document.getElementById('sheet');
const carnet = document.getElementById('carnet');
const toastEl = document.getElementById('toast');

const pool = [];
const upNext = [];
const cards = []; // cartes affichées ; l'index = data-i
const known = new Set(); // ids déjà dans le pool ou affichés pendant cette session
const seen = new Set(load('vus', []));
const reviewed = new Set();
const trend = [];
let active = 0;
let activeSince = Date.now();
let loading = false;
let sinceVocab = 0;
let newsAt = 0;
let emptyRefills = 0;
let retryAt = 0;
let ready = false; // au démarrage, on attend quelques sources pour que la première carte soit déjà un mélange

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Pool et chargement ---------- */

function addToPool(list) {
  for (const c of list || []) {
    if (!c || seen.has(c.id) || known.has(c.id)) continue;
    known.add(c.id);
    pool.push(c);
  }
  ensureAhead();
}

const LOADERS = [
  { src: 'wiki-fr', fn: () => src.loadWikiTheme('fr'), base: 1.4 },
  { src: 'wiki-de', fn: () => src.loadWikiTheme('de'), base: 0.6 },
  { src: 'commons', fn: () => src.loadCommons(), base: 0.8 },
  { src: 'finna', fn: () => src.loadFinna(), base: 0.8 },
];

function chooseLoaders(n) {
  const left = [...LOADERS];
  const out = [];
  while (out.length < n && left.length) {
    const ws = left.map((l) => l.base * weight('src:' + l.src));
    let r = Math.random() * ws.reduce((a, b) => a + b);
    const i = Math.max(0, ws.findIndex((w) => (r -= w) <= 0));
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}

async function refill() {
  if (loading || Date.now() < retryAt) return;
  loading = true;
  const before = known.size;
  const jobs = chooseLoaders(2).map((l) => l.fn().then(addToPool));
  if (Date.now() - newsAt > 30 * 6e4) {
    newsAt = Date.now();
    jobs.push(src.loadNews().then(addToPool));
  }
  await Promise.allSettled(jobs);
  loading = false;
  // Rien de neuf (réseau coupé, limites d'API) : on patiente de plus en plus longtemps.
  if (known.size === before) {
    const wait = Math.min(60e3, 3e3 * 2 ** emptyRefills++);
    retryAt = Date.now() + wait;
    setTimeout(ensureAhead, wait + 50);
  } else emptyRefills = 0;
  ensureAhead();
}

function nextCard() {
  if (upNext.length) return upNext.shift();
  if (++sinceVocab >= 7) {
    const e = lex.due(reviewed);
    if (e) {
      sinceVocab = 0;
      reviewed.add(e.w);
      return { id: 'mot:' + e.w, kind: 'mot', source: 'lexique', label: 'TU TE SOUVIENS ?', lang: 'fr', title: e.w, text: e.def, tags: [] };
    }
  }
  return pick(pool, cards.slice(-2).filter((c) => c.id));
}

function ensureAhead() {
  if (!ready) return;
  while (cards.length - active < 4) {
    const c = nextCard();
    if (!c) break;
    render(c);
  }
  if (pool.length < 10) refill();
}

/* ---------- Rendu ---------- */

function ago(date) {
  const min = Math.round((Date.now() - new Date(date)) / 6e4);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
}

function inList(name, id) {
  return load(name, []).some((x) => x.id === id);
}

function actions(c) {
  const b = (act, icon, label, pressed) =>
    `<button data-act="${act}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}><i>${icon}</i>${label}</button>`;
  return `<nav class="acts">
    ${b('aime', '♥', "J'aime", inList('aime', c.id))}
    ${b('plustard', '+', 'Plus tard', inList('plustard', c.id))}
    ${b('partager', '↗', 'Partager')}
    ${b('encore', '≈', 'Plus comme ça')}
  </nav>`;
}

function template(c, i) {
  const tr = c.lang === 'fr' ? ' tr' : '';
  const lang = c.lang ? ` lang="${c.lang}"` : '';
  const meta = `<div class="meta"><span class="no">${String(i).padStart(2, '0')}</span><span class="lbl">${esc(c.label)}</span></div>`;
  const img = c.image ? `<figure class="img"><img src="${esc(c.image)}" alt="" loading="lazy" decoding="async"></figure>` : '';
  const source = `<p class="src">${esc(c.sourceLabel)}${c.date ? ' · ' + ago(c.date) : ''}</p>`;

  switch (c.kind) {
    case 'image':
      return `${meta}${img}<h2 class="title${tr}"${lang}>${esc(c.title)}</h2>
        ${c.text ? `<p class="txt${tr}"${lang}>${esc(c.text)}</p>` : ''}
        <p class="credit">${esc(c.credit || c.sourceLabel)}</p>${actions(c)}`;
    case 'chiffre':
      return `${meta}<div class="body"><div class="num">${esc(c.number)}</div>
        <p class="txt${tr}"${lang}>${esc(c.text)}</p></div>${source}${actions(c)}`;
    case 'jour':
      return `${meta}<div class="year">${esc(c.year)}</div>${img}
        <div class="body"><p class="txt${tr}"${lang}>${esc(c.text)}</p></div>${source}${actions(c)}`;
    case 'mot':
      return `${meta}<div class="word" lang="fr">${esc(c.title)}</div>
        <button class="reveal" data-act="reveal">Révéler</button>
        <p class="def" hidden>${esc(c.text || 'Pas de définition enregistrée.')}</p>
        <nav class="acts acts-2"><button data-act="knew"><i>✓</i>Je savais</button><button data-act="again"><i>↺</i>À revoir</button></nav>`;
    default:
      return `${meta}${img}<div class="body"><h2 class="title${tr}"${lang}>${esc(c.title)}</h2>
        ${c.text ? `<p class="txt${tr}"${lang}>${esc(c.text)}</p>` : ''}</div>${source}${actions(c)}`;
  }
}

function render(c) {
  const i = cards.length;
  cards.push(c);
  known.add(c.id);
  const el = document.createElement('section');
  el.className = 'card k-' + c.kind;
  el.dataset.i = i;
  el.innerHTML = template(c, i);
  feed.appendChild(el);
  io.observe(el);
}

function renderStart() {
  const date = new Intl.DateTimeFormat('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  cards.push({ kind: 'start', id: null });
  const el = document.createElement('section');
  el.className = 'card k-start';
  el.dataset.i = 0;
  el.innerHTML = `<div class="start"><h1 class="logo">FLÂNEUR</h1><p class="motto">pas scrolleur</p></div>
    <p class="date">${esc(date)}</p><p class="hint">Glisse vers le haut ↑</p>`;
  feed.appendChild(el);
  io.observe(el);
}

// Images cassées : on enlève simplement le cadre.
feed.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.closest('figure')?.remove();
}, true);

/* ---------- Carte active et temps de lecture ---------- */

const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && setActive(+e.target.dataset.i)),
  { root: feed, threshold: 0.6 }
);

let saveSeenTimer;
function setActive(i) {
  if (i === active) return;
  const prev = cards[active];
  const dwell = Date.now() - activeSince;
  if (prev && prev.id && prev.kind !== 'mot') {
    if (dwell < 1500) reward(prev, -0.12);
    else if (dwell > 20000) reward(prev, 0.15);
    else if (dwell > 8000) reward(prev, 0.08);
  }
  active = i;
  activeSince = Date.now();
  const c = cards[i];
  if (c?.id) {
    seen.add(c.id);
    clearTimeout(saveSeenTimer);
    saveSeenTimer = setTimeout(() => save('vus', [...seen].slice(-4000)), 1000);
  }
  document.body.classList.toggle('on-start', i === 0);
  ensureAhead();
}

/* ---------- Actions ---------- */

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function toggle(name, c) {
  const list = load(name, []);
  const i = list.findIndex((x) => x.id === c.id);
  if (i >= 0) list.splice(i, 1);
  else list.unshift({ id: c.id, title: c.title, url: c.url, source: c.sourceLabel, at: Date.now() });
  save(name, list);
  return i < 0;
}

// « Plus comme ça » : les cartes déjà préparées repassent derrière les nouvelles.
function insertNext(list) {
  const fresh = list.filter((c) => !seen.has(c.id) && !known.has(c.id));
  if (!fresh.length) return false;
  fresh.forEach((c) => known.add(c.id));
  const ahead = cards.splice(active + 1);
  for (const c of ahead) {
    const el = feed.querySelector(`.card[data-i="${cards.length + ahead.indexOf(c)}"]`);
    if (el) {
      io.unobserve(el);
      el.remove();
    }
    if (c.kind === 'mot') reviewed.delete(c.title);
  }
  upNext.unshift(...fresh.slice(0, 3), ...ahead.filter((c) => c.kind !== 'mot'));
  ensureAhead();
  return true;
}

async function act(name, c, btn, el) {
  switch (name) {
    case 'aime': {
      const on = toggle('aime', c);
      btn.setAttribute('aria-pressed', on);
      if (on) reward(c, 0.5);
      toast(on ? 'Ajouté à tes favoris' : 'Retiré des favoris');
      break;
    }
    case 'plustard': {
      const on = toggle('plustard', c);
      btn.setAttribute('aria-pressed', on);
      if (on) reward(c, 0.3);
      toast(on ? 'Pour plus tard — dans le carnet' : 'Retiré de la liste');
      break;
    }
    case 'partager':
      reward(c, 0.4);
      try {
        if (navigator.share) await navigator.share({ title: c.title, url: c.url });
        else {
          await navigator.clipboard.writeText(c.url);
          toast('Lien copié');
        }
      } catch {}
      break;
    case 'encore':
      reward(c, 0.6);
      toast('Compris : plus comme ça');
      try {
        const related = pool.filter((p) => p.words.some((w) => c.words.includes(w))).slice(0, 2);
        related.forEach((p) => pool.splice(pool.indexOf(p), 1));
        const more = await src.loadMoreLike(c);
        insertNext([...more, ...related]);
      } catch {}
      break;
    case 'reveal':
      el.querySelector('.def').hidden = false;
      btn.hidden = true;
      break;
    case 'knew':
    case 'again':
      lex.review(c.title, name === 'knew');
      el.querySelectorAll('.acts button').forEach((b) => (b.disabled = true));
      el.querySelector('.def').hidden = false;
      el.querySelector('.reveal').hidden = true;
      toast(name === 'knew' ? 'Bien joué' : 'On le reverra demain');
      break;
  }
}

feed.addEventListener('click', (e) => {
  const el = e.target.closest('.card');
  if (!el) return;
  const c = cards[+el.dataset.i];
  const btn = e.target.closest('button[data-act]');
  if (btn) return act(btn.dataset.act, c, btn, el);
  if (e.target.closest('.tr')) {
    const w = wordAt(e);
    if (w) showWord(w);
  }
});

/* ---------- Toucher un mot pour le traduire ---------- */

function wordAt(e) {
  let node, offset;
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (!p) return null;
    ({ offsetNode: node, offset } = p);
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!r) return null;
    node = r.startContainer;
    offset = r.startOffset;
  }
  if (!node || node.nodeType !== 3) return null;
  const t = node.textContent;
  const isLetter = (ch) => ch && /[\p{L}-]/u.test(ch);
  let a = offset;
  let b = offset;
  while (a > 0 && isLetter(t[a - 1])) a--;
  while (b < t.length && isLetter(t[b])) b++;
  const w = t.slice(a, b).replace(/^-+|-+$/g, '');
  return w.length > 1 ? w : null;
}

async function showWord(w) {
  sheet.innerHTML = `<div class="panel"><p class="sw" lang="fr">${esc(w)}</p><p class="muted">Recherche…</p></div>`;
  sheet.hidden = false;
  const defs = await src.define(w);
  if (sheet.hidden || !sheet.querySelector('.sw') || sheet.querySelector('.sw').textContent !== w) return;
  const def = defs ? defs.map((d) => `${d.pos} : ${d.defs.join(' ; ')}`).join(' — ') : '';
  const saved = lex.has(w);
  sheet.innerHTML = `<div class="panel">
    <p class="sw" lang="fr">${esc(w)}</p>
    ${defs
      ? `<ul class="defs">${defs.map((d) => `<li><em>${esc(d.pos)}</em> ${esc(d.defs.join(' ; '))}</li>`).join('')}</ul>`
      : '<p class="muted">Pas de définition trouvée.</p>'}
    <p class="links">
      <a href="https://fr.wiktionary.org/wiki/${encodeURIComponent(w.toLowerCase())}" target="_blank" rel="noopener">Wiktionnaire</a>
      <a href="https://dict.leo.org/französisch-deutsch/${encodeURIComponent(w)}" target="_blank" rel="noopener">LEO (allemand)</a>
    </p>
    <div class="row">
      <button class="btn" data-add ${saved ? 'disabled' : ''}>${saved ? 'Déjà dans le lexique' : '+ Ajouter au lexique'}</button>
      <button class="btn ghost" data-close>Fermer</button>
    </div></div>`;
  sheet.querySelector('[data-add]').onclick = (e) => {
    lex.add(w, def);
    e.target.disabled = true;
    e.target.textContent = 'Ajouté';
  };
}

sheet.addEventListener('click', (e) => {
  if (e.target === sheet || e.target.closest('[data-close]')) sheet.hidden = true;
});

/* ---------- Carnet ---------- */

let tab = 'aime';

function openCarnet() {
  const tabs = [
    ['aime', "J'aime", load('aime', []).length],
    ['plustard', 'Plus tard', load('plustard', []).length],
    ['lexique', 'Lexique', lex.list().length],
    ['reglages', 'Réglages'],
  ];
  let body = '';
  if (tab === 'aime' || tab === 'plustard') {
    const list = load(tab, []);
    body = list.length
      ? `<ul class="items">${list.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>
          <small>${esc(x.source)}</small><button data-del="${esc(x.id)}" aria-label="Retirer">×</button></li>`).join('')}</ul>`
      : '<p class="muted">Rien pour l’instant.</p>';
  } else if (tab === 'lexique') {
    const list = lex.list();
    body = list.length
      ? `<ul class="items">${list.map((x) => `<li><b lang="fr">${esc(x.w)}</b><small>${esc(x.def || '')}</small>
          <button data-delw="${esc(x.w)}" aria-label="Retirer">×</button></li>`).join('')}</ul>`
      : '<p class="muted">Touche un mot français dans le flux pour l’ajouter ici.</p>';
  } else {
    body = `<div class="settings">
      <button class="btn" data-export>Exporter mes données</button>
      <label class="btn ghost">Importer<input type="file" accept="application/json" data-import hidden></label>
      <button class="btn ghost" data-reset>Réinitialiser l’algorithme</button>
      <p class="muted">Tout reste sur ce téléphone : favoris, lexique et préférences.
      Sources : Le Grand Continent, RFI, Le Temps, Wikipédia, Wikimedia Commons, Finna, Wiktionary.</p></div>`;
  }
  carnet.innerHTML = `<header><h2>CARNET</h2><button class="btn ghost" data-close>Fermer</button></header>
    <nav class="tabs">${tabs.map(([k, l, n]) => `<button data-tab="${k}" aria-pressed="${k === tab}">${l}${n === undefined ? '' : ` <span>${n}</span>`}</button>`).join('')}</nav>
    ${body}`;
  carnet.hidden = false;
}

carnet.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-close]')) carnet.hidden = true;
  else if (t.closest('[data-tab]')) {
    tab = t.closest('[data-tab]').dataset.tab;
    openCarnet();
  } else if (t.dataset.del) {
    save(tab, load(tab, []).filter((x) => x.id !== t.dataset.del));
    openCarnet();
  } else if (t.dataset.delw) {
    lex.remove(t.dataset.delw);
    openCarnet();
  } else if ('export' in t.dataset) {
    const blob = new Blob([JSON.stringify(exportAll(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flaneur.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } else if ('reset' in t.dataset && confirm('Réinitialiser ce que l’algorithme a appris ?')) {
    resetProfile();
    toast('Algorithme réinitialisé');
  }
});

carnet.addEventListener('change', async (e) => {
  if (!('import' in e.target.dataset) || !e.target.files[0]) return;
  try {
    importAll(JSON.parse(await e.target.files[0].text()));
    toast('Données importées');
    openCarnet();
  } catch {
    toast('Fichier illisible');
  }
});

document.getElementById('open-carnet').addEventListener('click', () => {
  openCarnet();
});

/* ---------- Démarrage ---------- */

function renderOffline() {
  const el = document.createElement('section');
  el.className = 'card k-vide';
  el.innerHTML = `<div class="body"><h2 class="title">Rien à flâner pour l’instant.</h2>
    <p class="txt">Pas de réseau, ou les sources ne répondent pas.</p></div>
    <button class="btn" onclick="location.reload()">Réessayer</button>`;
  feed.appendChild(el);
}

async function start() {
  renderStart();
  newsAt = Date.now();
  const daily = (lang) =>
    src.loadWikiDaily(lang).then((r) => {
      trend.push(...r.trend);
      setTrending(src.words(trend.join(' ')));
      addToPool(r.cards);
    });
  const first = Promise.allSettled([src.loadNews().then(addToPool), daily('fr'), daily('de'), refill()]);
  await Promise.race([first, new Promise((r) => setTimeout(r, 2500))]);
  ready = true;
  ensureAhead();
  await first;
  if (cards.length <= 1) renderOffline();
}

start();
