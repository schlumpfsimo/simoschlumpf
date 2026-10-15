import { load, save, exportAll, importAll } from './store.js?v=202610150659';
import { pick, reward, resetProfile, setTrending, weight, PARTI_PRIS, getPartiPris, setPartiPris } from './algo.js?v=202610150659';
import * as src from './sources/index.js?v=202610150659';
import * as lex from './lexique.js?v=202610150659';

const feed = document.getElementById('feed');
const detail = document.getElementById('detail');
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
const busy = new Set(); // sources en cours de chargement
const failures = {}; // source -> { n, until } : on laisse souffler les API qui refusent
let active = 0;
let activeSince = Date.now();
let sinceVocab = 0;
let newsAt = 0;
let ready = false; // au démarrage, on attend quelques sources pour que la première carte soit déjà un mélange
let detailCard = null;

// Réserve minimale par famille : deux cartes sur trois sont des images.
const STOCK = { image: 14, news: 4, savoir: 5, paper: 3 };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- Pool et chargement ---------- */

const titles = new Set(); // une même œuvre arrive parfois par deux catalogues

function addToPool(list) {
  for (const c of list || []) {
    if (!c || !c.title || seen.has(c.id) || known.has(c.id)) continue;
    c.cat = src.category(c);
    const key = c.cat + ':' + c.title.toLowerCase();
    if (titles.has(key)) continue;
    titles.add(key);
    known.add(c.id);
    pool.push(c);
    // Les cartes « image » attendent que leur image soit chargée ; les autres sortent tout de suite
    // (une image d'actualité cassée disparaît simplement, la carte reste lisible).
    if (c.cat === 'image') queuePreload(c);
    else c.ok = true;
  }
  ensureAhead();
}

// Préchargement des images, quatre à la fois : jamais des centaines de téléchargements d'un coup.
const preloadQueue = [];
let preloading = 0;

function queuePreload(c) {
  preloadQueue.push(c);
  pumpPreload();
}

function pumpPreload() {
  while (preloading < 4 && preloadQueue.length) {
    const c = preloadQueue.shift();
    if (!pool.includes(c)) continue;
    preloading++;
    const im = new Image();
    const done = (ok) => {
      preloading--;
      if (ok) c.ok = true;
      else if (pool.includes(c)) pool.splice(pool.indexOf(c), 1);
      ensureAhead();
      pumpPreload();
    };
    im.onload = () => done(true);
    im.onerror = () => done(false);
    im.src = c.image;
  }
}

function stock(cat) {
  return pool.filter((c) => c.cat === cat).length;
}

function chooseLoader(cat, ppOnly = false) {
  const now = Date.now();
  const ok = src.LOADERS.filter(([key, , , c]) => c === cat && (!ppOnly || key.endsWith('-pp') || key.includes('-pp-')) && !busy.has(key) && !(failures[key]?.until > now));
  if (!ok.length) return null;
  const ws = ok.map(([key, , w]) => w * weight('src:' + key));
  let r = Math.random() * ws.reduce((a, b) => a + b);
  return ok[Math.max(0, ws.findIndex((w) => (r -= w) <= 0))];
}

function run([key, fn]) {
  busy.add(key);
  return fn()
    .then((list) => {
      if (!list?.length) throw new Error('vide');
      delete failures[key];
      addToPool(list);
    })
    .catch(() => {
      // Erreur ou rien de neuf : cette source se repose, de plus en plus longtemps.
      const n = (failures[key]?.n || 0) + 1;
      failures[key] = { n, until: Date.now() + Math.min(120e3, 2e3 * 2 ** n) };
      setTimeout(ensureAhead, Math.min(120e3, 2e3 * 2 ** n) + 50);
    })
    .finally(() => busy.delete(key));
}

function refill() {
  if (Date.now() - newsAt > 30 * 6e4) {
    newsAt = Date.now();
    src.loadNews().then(addToPool).catch(() => {});
  }
  for (const cat of ['image', 'savoir', 'paper']) {
    // Le parti pris a besoin de réserve à lui : sinon il se dilue parmi les autres sources.
    if (getPartiPris() > 0 && pool.filter((c) => c.cat === cat && c.pp).length < 2) {
      const loader = chooseLoader(cat, true);
      if (loader) run(loader);
    }
    // Trois chargements en parallèle pour les images, un pour le reste.
    const parallel = cat === 'image' ? 3 : 1;
    for (let k = 0; k < parallel && stock(cat) < STOCK[cat]; k++) {
      const loader = chooseLoader(cat);
      if (loader) run(loader);
    }
  }
}

function nextCard() {
  if (upNext.length) return upNext.shift();
  if (++sinceVocab >= 9) {
    const e = lex.due(reviewed);
    if (e) {
      sinceVocab = 0;
      reviewed.add(e.w);
      return { id: 'mot:' + e.w, kind: 'mot', cat: 'savoir', source: 'lexique', label: 'TU TE SOUVIENS ?', lang: 'fr', title: e.w, text: e.def, tags: [], words: [] };
    }
  }
  // Seules les cartes prêtes (image chargée, ou pas d'image) peuvent sortir.
  const ready = pool.filter((c) => c.ok || !c.image);
  const c = pick(ready, cards.slice(-2).filter((c) => c.id));
  if (c) pool.splice(pool.indexOf(c), 1);
  if (c?.kind === 'image' && Math.random() < 0.12) series(c);
  return c;
}

// De temps en temps, une petite exposition : deux autres œuvres du même artiste à la suite.
async function series(c) {
  const artist = src.artistOf(c);
  if (!artist) return;
  try {
    const list = (await src.loadSeries(c, artist)) || [];
    const more = list.filter((x) => x.image && !known.has(x.id) && !seen.has(x.id)).slice(0, 2);
    more.forEach((x) => {
      x.label = 'SÉRIE · ' + artist.toUpperCase();
      x.cat = 'image';
      known.add(x.id);
    });
    upNext.unshift(...more);
  } catch {}
}

function ensureAhead() {
  if (!ready) return;
  while (cards.length - active < 4) {
    const c = nextCard();
    if (!c) break;
    render(c);
  }
  refill();
}

/* ---------- Rendu ---------- */

function ago(date) {
  const min = Math.round((Date.now() - new Date(date)) / 6e4);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`;
  if (min < 60 * 24 * 60) return `il y a ${Math.round(min / 1440)} j`;
  return new Date(date).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
}

function inList(name, id) {
  return load(name, []).some((x) => x.id === id);
}

// Icônes dessinées sur la même grille de 24 px : même taille et même épaisseur partout.
const ICON = Object.fromEntries(Object.entries({
  aime: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  plustard: '<path d="M12 5v14M5 12h14"/>',
  encore: '<path d="M4 9.5c2.7-2.6 5.3 2.6 8 0s5.3-2.6 8 0M4 15.5c2.7-2.6 5.3 2.6 8 0s5.3-2.6 8 0"/>',
  moins: '<path d="M5 12h14"/>',
  partager: '<path d="M7 17L17 7M9 7h8v8"/>',
  detail: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  knew: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  again: '<path d="M19 12a7 7 0 1 1-2.1-5M19 4.5V9h-4.5"/>',
}).map(([k, d]) => [k, `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`]));

function actions(c) {
  const b = (act, icon, label, pressed) =>
    `<button data-act="${act}" aria-label="${label}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${icon}${label}</button>`;
  return `<nav class="acts">
    ${b('aime', ICON.aime, "J'aime", inList('aime', c.id))}
    ${b('plustard', ICON.plustard, 'Plus tard', inList('plustard', c.id))}
    ${b('encore', ICON.encore, 'Plus comme ça')}
    ${b('moins', ICON.moins, 'Moins comme ça')}
    ${b('partager', ICON.partager, 'Partager')}
  </nav>`;
}

const langAttrs = (c) => ({ tr: c.lang === 'fr' ? ' tr' : '', lang: c.lang ? ` lang="${c.lang}"` : '' });

function template(c, i) {
  const { tr, lang } = langAttrs(c);
  const meta = `<div class="meta"><span class="no">${String(i).padStart(2, '0')}</span><span class="lbl">${esc(c.label)}</span>
    ${c.kind === 'mot' ? '' : `<button class="more" data-act="detail" aria-label="Plus de détails">${ICON.detail}</button>`}</div>`;
  const img = c.image ? `<figure class="img"><img src="${esc(c.image)}" alt="" loading="lazy" decoding="async"></figure>` : '';
  const source = `<p class="src">${esc(c.sourceLabel)}${c.date ? ' · ' + ago(c.date) : ''}</p>`;
  const title = `<h2 class="title${tr}"${lang}>${esc(c.title)}</h2>`;

  switch (c.kind) {
    case 'image':
      // Plein écran : l'image d'abord, le texte en petit par-dessus.
      return `${c.image ? `<figure class="full img"><img src="${esc(c.image)}" alt="" decoding="async"></figure>` : ''}
        <div class="over">${meta}<div class="bottom">${title}<p class="credit">${esc(c.credit || c.sourceLabel)}</p>${actions(c)}</div></div>`;
    case 'news':
      return `${meta}${img}<div class="body">${title}</div>${source}${actions(c)}`;
    case 'paper':
      return `${meta}<div class="body">${title}<p class="txt"${lang}>${esc(c.text)}</p></div>${source}${actions(c)}`;
    case 'quote':
      return `${meta}<div class="body"><blockquote class="quote${tr}"${lang}>« ${esc(c.title)} »</blockquote>
        <p class="author">— ${esc(c.author)}</p></div>${actions(c)}`;
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
        <nav class="acts acts-2"><button data-act="knew">${ICON.knew}Je savais</button><button data-act="again">${ICON.again}À revoir</button></nav>`;
    default:
      return `${meta}${img}<div class="body">${title}${c.text ? `<p class="txt${tr}"${lang}>${esc(c.text)}</p>` : ''}</div>${source}${actions(c)}`;
  }
}

function render(c) {
  const i = cards.length;
  cards.push(c);
  known.add(c.id);
  const el = document.createElement('section');
  el.className = `card k-${c.kind}${c.image ? '' : ' noimg'}`;
  el.dataset.i = i;
  el.innerHTML = template(c, i);
  feed.appendChild(el);
  io.observe(el);
  requestAnimationFrame(() => fit(el));
}

// Garde-fou pour les petits écrans : si le texte ne tient pas, on coupe proprement par « … »,
// d'abord le résumé, puis le titre — jamais au milieu d'une ligne.
function fit(el) {
  const box = el.querySelector('.body');
  if (!box) return;
  const blocks = [...box.querySelectorAll('.txt'), ...box.querySelectorAll('.title, .quote')];
  blocks.forEach((b) => {
    b.style.webkitLineClamp = '';
    b.hidden = false;
  });
  for (const b of blocks) {
    const lh = parseFloat(getComputedStyle(b).lineHeight) || 20;
    let lines = Math.round(b.offsetHeight / lh);
    while (box.scrollHeight > box.clientHeight + 1 && lines > 1) b.style.webkitLineClamp = --lines;
    if (box.scrollHeight <= box.clientHeight + 1) return;
    if (b.classList.contains('txt')) b.hidden = true;
  }
}

const refit = () => feed.querySelectorAll('.card').forEach(fit);
document.fonts?.ready.then(refit);
window.addEventListener('resize', () => {
  clearTimeout(refit.t);
  refit.t = setTimeout(() => {
    refit();
    const map = feed.querySelector('.europe');
    if (map) drawEurope(map);
  }, 150);
});

// L'Europe en petits cercles d'étoiles, comme le drapeau européen : 48 × 44 points, une ligne par latitude
// (de 71,5° N à 34° N, de 24° O à 44° E), tirés des contours Natural Earth.
const EUROPE = 'c00000000800,3fe00,7ff80,7fff0,ffffc,1ffffc,de00003fff83,3e00007f1f87,3c0000ff3fcf,3fe7fff,7fcffff,ff8ffff,ff8ffff,7fc43ff,77c3fff,e0678bfff,f0078bfff,e0130ffff,f0160ffff,1d0181ffff,3981ffffff,1b87ffffff,33cfffffff,39fffffff,33fffffff,7fffffff,ffffffff,3ffffffff,1fffffff7,fffffecf,ffdffcdf,ffdff80f,fccff807,3fe0e7f803,1fe163f803,1fc039f9e3,1f810dc7ff,3f81099fff,3f8009cfff,1f0030afff,f051007ff,7f00003f,4ff8030bf,fff00003f';

// Dessine une grille de points, chaque point étant un petit cercle de 12 étoiles (comme le drapeau européen).
// rows : chaînes de '0'/'1' (ou 'W' pour un cercle jaune) ; fit : largeur/hauteur du dessin en unités de grille.
function drawRings(canvas, rows, { alpha = 0.11, scale = 1, accent = '#f7cf4c' } = {}) {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  const cols = rows[0].length;
  const cell = Math.min(W / cols, H / rows.length) * scale;
  const ox = (W - cols * cell) / 2;
  const oy = (H - rows.length * cell) / 2;
  const r = cell * 0.34;
  const dot = Math.max(0.45, r * 0.16);
  rows.forEach((row, y) => {
    for (let x = 0; x < cols; x++) {
      if (row[x] === '0' || row[x] === '.') continue;
      g.fillStyle = row[x] === 'W' ? accent : `rgba(255, 255, 255, ${alpha})`;
      const cx = ox + (x + 0.5) * cell;
      const cy = oy + (y + 0.5) * cell;
      for (let k = 0; k < 12; k++) {
        const t = (k / 12) * Math.PI * 2;
        g.beginPath();
        g.arc(cx + Math.cos(t) * r, cy + Math.sin(t) * r, dot, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

function drawEurope(canvas) {
  // Les cellules de la grille sont plus larges que hautes (projection) : on étire un peu la grille.
  const rows = EUROPE.split(',').map((h) => BigInt('0x' + h).toString(2).padStart(48, '0'));
  drawRings(canvas, rows, { alpha: 0.2, scale: 1.2 });
}

// Le lapin blanc d'Alice, au fond du terrier — avec sa montre à gousset (en jaune).
const RABBIT = `
.......#..#.......
......##.##.......
......##.##.......
......##.##.......
......##.##.......
......##.##.......
.....#######......
....#########.....
....#.#######.....
....#########.....
.....#######......
......#####.......
.....#######......
....#########.....
...###########....
...###########.##.
..W###########.##.
..W###########....
...###########....
....#########.....
....###...###.....
...####..####.....`.trim().split('\n');

function renderStart() {
  const date = new Intl.DateTimeFormat('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  cards.push({ kind: 'start', id: null });
  const el = document.createElement('section');
  el.className = 'card k-start';
  el.dataset.i = 0;
  el.innerHTML = `<canvas class="europe" aria-hidden="true"></canvas><div class="start"><h1 class="logo">FLÂNEUR</h1><p class="motto">pas scrolleur</p></div>
    <p class="date">${esc(date)}</p><p class="hint">↑ flâner · ← lire plus · puis ↓ plus profonde</p>`;
  feed.appendChild(el);
  io.observe(el);
  requestAnimationFrame(() => drawEurope(el.querySelector('.europe')));
}

// Images cassées : on enlève le cadre ; une carte « image » sans image disparaît.
document.addEventListener('error', (e) => {
  if (e.target.tagName !== 'IMG') return;
  const card = e.target.closest('.card');
  e.target.closest('figure')?.remove();
  if (card?.classList.contains('k-image')) card.classList.add('broken');
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
    saveSeenTimer = setTimeout(() => save('vus', [...seen].slice(-6000)), 1000);
  }
  document.body.classList.toggle('on-start', i === 0);
  ensureAhead();
}

/* ---------- Vue détaillée : glisser vers la gauche ; en descendant, on tombe dans le terrier ---------- */

let rabbit = null; // { from, pages, visited, loading, started, done }

function detailHTML(c) {
  const { tr, lang } = langAttrs(c);
  const image = c.imageLarge || c.image;
  const facts = (c.facts || []).filter(([, v]) => v);
  const body = c.long || c.text || '';
  return `<header class="dtop"><button class="back" data-back>Flux →</button><span class="lbl">${esc(c.label)}</span></header>
    ${image ? `<figure class="dimg"><img src="${esc(image)}" alt="" decoding="async"></figure>` : ''}
    ${c.kind === 'chiffre' ? `<div class="num">${esc(c.number)}</div>` : ''}
    ${c.kind === 'jour' ? `<div class="year">${esc(c.year)}</div>` : ''}
    <h2 class="dtitle${tr}"${lang}>${esc(c.kind === 'quote' ? '« ' + c.title + ' »' : c.title)}</h2>
    ${c.author ? `<p class="author">— ${esc(c.author)}</p>` : ''}
    ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    <div class="dtext${tr}"${lang}>${body.split(/\n+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    ${c.credit ? `<p class="credit">${esc(c.credit)}</p>` : ''}
    <p class="src">${esc(c.sourceLabel)}${c.date ? ' · ' + ago(c.date) : ''}</p>
    ${c.url ? `<a class="btn ghost open" href="${esc(c.url)}" target="_blank" rel="noopener">Ouvrir la source ↗</a>` : ''}
    ${c.kind === 'mot' ? '' : actions(c)}
    <div class="tstack"><p class="tinto">↓ continue à descendre : plus profonde</p></div>`;
}

function rabbitHTML(p) {
  const tr = p.lang === 'fr' ? ' tr' : '';
  return `<section class="tpage">
    <div class="meta"><span class="no">${String(p.depth).padStart(2, '0')}</span><span class="lbl">PLUS PROFONDE · NIVEAU ${p.depth}</span></div>
    ${p.via ? `<p class="via">${p.detour ? 'Détour depuis' : 'Depuis'} « ${esc(p.via)} »</p>` : ''}
    ${p.image ? `<figure class="timg"><img src="${esc(p.image)}" alt="" decoding="async"></figure>` : ''}
    <h2 class="dtitle${tr}" lang="${p.lang}">${esc(p.title)}</h2>
    <div class="dtext${tr}" lang="${p.lang}">${p.text.split(/\n+/).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('')}</div>
    <a class="btn ghost open" href="${esc(p.url)}" target="_blank" rel="noopener">Wikipédia ↗</a>
    <p class="deeper">↓ plus profonde</p>
  </section>`;
}

function stack() {
  return detail.querySelector('.tstack');
}

function addRabbit(p) {
  rabbit.visited.add(p.title);
  rabbit.pages.push(p);
  stack().insertAdjacentHTML('beforeend', rabbitHTML(p));
}

// Le fond du terrier : plus aucun lien à suivre. Le lapin blanc attend là.
function rabbitEnd() {
  rabbit.done = true;
  stack().insertAdjacentHTML('beforeend', `<div class="fond"><canvas class="lapin" aria-hidden="true"></canvas>
    <p class="tinto">Plus profonde : tout au fond.</p></div>`);
  drawRings(stack().querySelector('.lapin'), RABBIT, { alpha: 0.85 });
}

async function deeper() {
  const r = rabbit;
  if (!r || r.loading || r.done) return;
  r.loading = true;
  await deeperStep(r);
  if (rabbit === r) requestAnimationFrame(maybeDeeper);
}

async function deeperStep(r) {
  // Une erreur réseau n'est pas le fond du trou : on le dit, et le prochain défilement réessaie.
  const failed = () => {
    r.loading = false;
    if (!stack().querySelector('.retry')) stack().insertAdjacentHTML('beforeend', '<p class="tinto retry">La connexion hésite… réessaie en descendant</p>');
    r.retryAt = Date.now() + 3000;
  };
  if (r.retryAt > Date.now()) return (r.loading = false);
  stack().querySelector('.retry')?.remove();
  if (!r.started) {
    let first;
    try {
      first = await src.rabbitStart(r.from);
    } catch {
      if (rabbit === r) failed();
      return;
    }
    if (rabbit !== r) return;
    r.started = true;
    reward(r.from, 0.3);
    r.loading = false;
    stack().querySelector('.tinto')?.remove();
    return first ? addRabbit(first) : rabbitEnd();
  }
  let next;
  try {
    next = await src.rabbitNext(r.pages.at(-1), r.visited, r.pages[0].title);
  } catch {
    if (rabbit === r) failed();
    return;
  }
  if (rabbit !== r) return;
  r.loading = false;
  if (next) addRabbit(next);
  else rabbitEnd();
}

// Plus on descend, plus on creuse : l'article suivant se charge avant d'arriver en bas.
// (Aussi vérifié à l'ouverture : une fiche courte ne déclenche aucun défilement.)
function maybeDeeper() {
  if (rabbit && detail.scrollTop + detail.clientHeight > detail.scrollHeight - detail.clientHeight * 1.2) deeper();
}
detail.addEventListener('scroll', maybeDeeper, { passive: true });

async function openDetail(c) {
  if (!c?.id || detailCard) return;
  detailCard = c;
  rabbit = { from: c, pages: [], visited: new Set([c.title]), loading: false, started: false, done: false };
  reward(c, 0.25);
  detail.innerHTML = detailHTML(c);
  detail.hidden = false;
  detail.scrollTop = 0;
  requestAnimationFrame(() => detail.classList.add('open'));
  history.pushState({ detail: true }, '');
  setTimeout(maybeDeeper, 300);
  try {
    const more = await src.loadDetail(c);
    if (detailCard === c && !rabbit.started && (more.long || more.imageLarge)) {
      Object.assign(c, Object.fromEntries(Object.entries(more).filter(([, v]) => v)));
      const y = detail.scrollTop;
      detail.innerHTML = detailHTML(c);
      detail.scrollTop = y;
    }
  } catch {}
}

function closeDetail() {
  if (!detailCard) return;
  detailCard = null;
  rabbit = null;
  detail.classList.remove('open');
  setTimeout(() => {
    if (!detailCard) detail.hidden = true;
  }, 220);
}

window.addEventListener('popstate', closeDetail);

function swipe(el, onSwipe) {
  let x0, y0, t0;
  el.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    t0 = Date.now();
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === undefined) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = undefined;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.6 * Math.abs(dy) && Date.now() - t0 < 800) onSwipe(dx > 0 ? 'right' : 'left');
  }, { passive: true });
}

// Vers la gauche : la vue détaillée glisse depuis la droite. Vers la droite : retour au flux, à toute profondeur.
swipe(feed, (dir) => dir === 'left' && openDetail(cards[active]));
swipe(detail, (dir) => dir === 'right' && history.back());

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
// Retire du DOM les cartes déjà préparées après la carte active et les renvoie.
function takeAhead() {
  const ahead = cards.splice(active + 1);
  ahead.forEach((c, k) => {
    const el = feed.querySelector(`.card[data-i="${cards.length + k}"]`);
    if (el) {
      io.unobserve(el);
      el.remove();
    }
    if (c.kind === 'mot') reviewed.delete(c.title);
  });
  return ahead.filter((c) => c.kind !== 'mot');
}

function insertNext(list) {
  const fresh = list.filter((c) => c?.title && !seen.has(c.id) && !known.has(c.id));
  if (!fresh.length) return false;
  fresh.forEach((c) => {
    c.cat = src.category(c);
    known.add(c.id);
  });
  upNext.unshift(...fresh.slice(0, 3), ...takeAhead());
  ensureAhead();
  return true;
}

// « Moins comme ça » : même source et même thème disparaissent de la réserve et des cartes préparées.
function dropSimilar(c) {
  const similar = (x) => x.source === c.source && (!c.tags.length || x.tags.some((t) => c.tags.includes(t)));
  for (let i = pool.length - 1; i >= 0; i--) if (similar(pool[i])) pool.splice(i, 1);
  for (let i = upNext.length - 1; i >= 0; i--) if (similar(upNext[i])) upNext.splice(i, 1);
  upNext.unshift(...takeAhead().filter((x) => !similar(x)));
  ensureAhead();
}

/* ---------- Partage : le lien ouvre Flâneur, avec la carte partagée en premier ---------- */

const SHARE_KEYS = { k: 'kind', t: 'title', x: 'text', i: 'image', u: 'url', s: 'sourceLabel', l: 'label', g: 'lang', y: 'year', n: 'number', a: 'author', c: 'credit' };

function shareLink(c) {
  // D'abord une référence courte (#aic:27992, #w:fr:Frontière, #n:1k3x9…) ; sinon la carte entière dans l'adresse.
  const ref = src.refOf(c);
  if (ref) return `${location.origin}${location.pathname}#${encodeURIComponent(ref).replace(/%3A/g, ':')}`;
  const data = {};
  for (const [short, key] of Object.entries(SHARE_KEYS)) if (c[key]) data[short] = key === 'text' ? String(c[key]).slice(0, 300) : c[key];
  if (c.sharedLabel) data.l = c.sharedLabel; // une carte reçue garde son étiquette d'origine
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${location.origin}${location.pathname}?c=${b64}`;
}

function sharedCard() {
  const b64 = new URLSearchParams(location.search).get('c');
  if (!b64) return null;
  try {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    const c = Object.fromEntries(Object.entries(SHARE_KEYS).filter(([k]) => data[k] !== undefined).map(([k, key]) => [key, data[k]]));
    if (!c.title || !['news', 'article', 'image', 'paper', 'quote', 'chiffre', 'jour'].includes(c.kind)) return null;
    return { ...c, id: 'partage:' + (c.url || c.title), source: 'partage', label: 'POUR TOI · ' + (c.label || ''), sharedLabel: c.label, tags: [], facts: [], words: src.words(c.title) };
  } catch {
    return null;
  }
}

// Le même bouton existe sur la carte et dans la vue détaillée.
function syncPressed(name, c, on) {
  const el = feed.querySelector(`.card[data-i="${cards.indexOf(c)}"]`);
  for (const root of [el, detailCard === c ? detail : null]) root?.querySelector(`[data-act="${name}"]`)?.setAttribute('aria-pressed', on);
}

async function act(name, c, btn, el) {
  switch (name) {
    case 'detail':
      openDetail(c);
      break;
    case 'aime':
    case 'plustard': {
      const on = toggle(name, c);
      syncPressed(name, c, on);
      if (on) reward(c, name === 'aime' ? 0.5 : 0.3);
      toast(name === 'aime' ? (on ? 'Ajouté à tes favoris' : 'Retiré des favoris') : on ? 'Pour plus tard — dans le carnet' : 'Retiré de la liste');
      break;
    }
    case 'partager': {
      reward(c, 0.4);
      const text = `Beim Spazieren im Internet an dich gedacht –\nen flânant sur Internet, j'ai pensé à toi :\n${shareLink(c)}`;
      try {
        if (navigator.share) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          toast('Lien copié');
        }
      } catch {}
      break;
    }
    case 'encore':
      reward(c, 0.6);
      toast('Compris : plus comme ça');
      if (detailCard) history.back();
      try {
        const related = pool.filter((p) => p.words.some((w) => c.words.includes(w))).slice(0, 2);
        related.forEach((p) => pool.splice(pool.indexOf(p), 1));
        const more = (await src.loadMoreLike(c)) || [];
        insertNext([...more, ...related]);
      } catch {}
      break;
    case 'moins':
      reward(c, -0.7);
      toast('Compris : moins de ça');
      if (detailCard) history.back();
      dropSimilar(c);
      setTimeout(() => feed.querySelector(`.card[data-i="${active + 1}"]`)?.scrollIntoView({ behavior: 'smooth' }), 250);
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

function onTap(e, c, el) {
  const btn = e.target.closest('button[data-act]');
  if (btn) return act(btn.dataset.act, c, btn, el);
  if (e.target.closest('.tr')) {
    const hit = wordAt(e);
    if (hit) showWord(hit.w, hit.sentence);
  }
}

// Double toucher sur une image : j'aime, avec un cœur qui s'envole.
let lastTap = { t: 0, el: null };
function doubleTap(e, el) {
  if (!e.target.closest('.full')) return false;
  const now = Date.now();
  const twice = lastTap.el === el && now - lastTap.t < 350;
  lastTap = twice ? { t: 0, el: null } : { t: now, el };
  if (!twice) return true;
  const c = cards[+el.dataset.i];
  if (!inList('aime', c.id)) act('aime', c, el.querySelector('[data-act="aime"]'), el);
  el.insertAdjacentHTML('beforeend', `<span class="burst">${ICON.aime}</span>`);
  setTimeout(() => el.querySelector('.burst')?.remove(), 800);
  return true;
}

feed.addEventListener('click', (e) => {
  const el = e.target.closest('.card');
  if (!el || doubleTap(e, el)) return;
  onTap(e, cards[+el.dataset.i], el);
});

detail.addEventListener('click', (e) => {
  if (e.target.closest('[data-back]')) return history.back();
  if (detailCard) onTap(e, detailCard, detail);
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
  if (w.length < 2) return null;
  // La phrase autour du mot, pour la traduire en contexte.
  const start = Math.max(t.lastIndexOf('. ', a), t.lastIndexOf('! ', a), t.lastIndexOf('? ', a)) + 1;
  const ends = ['. ', '! ', '? '].map((p) => t.indexOf(p, b)).filter((i) => i >= 0);
  const end = ends.length ? Math.min(...ends) + 1 : t.length;
  return { w, sentence: t.slice(start, end).trim().slice(0, 400) };
}

async function showWord(w, sentence) {
  sheet.innerHTML = `<div class="panel"><p class="sw" lang="fr">${esc(w)}</p><p class="muted">Traduction…</p></div>`;
  sheet.hidden = false;
  const [tr, wk] = await Promise.all([src.translate(w).catch(() => null), src.meaningsDE(w).catch(() => null)]);
  if (sheet.hidden || sheet.querySelector('.sw')?.textContent !== w) return;
  const de = tr?.main || wk?.meanings[0] || '';
  const def = [de, wk && wk.lemma !== w ? `(${wk.lemma})` : ''].filter(Boolean).join(' ');
  const saved = lex.has(w);
  sheet.innerHTML = `<div class="panel">
    <p class="sw" lang="fr">${esc(w)}</p>
    ${de ? `<p class="de" lang="de">${esc(de)}</p>` : '<p class="muted">Pas de traduction trouvée.</p>'}
    ${tr?.alts.length ? `<p class="alts" lang="de">auch : ${tr.alts.map(esc).join(' · ')}</p>` : ''}
    ${wk ? `<p class="lemma">${wk.lemma !== w ? `Grundform <b lang="fr">${esc(wk.lemma)}</b> · ` : ''}Wiktionary</p>
      <ol class="defs" lang="de">${wk.meanings.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>` : ''}
    ${sentence && sentence !== w ? `<div class="phrase"><p lang="fr">${esc(sentence)}</p>
      <button class="btn ghost" data-phrase>Traduire la phrase</button><p class="phrase-de" lang="de" hidden></p></div>` : ''}
    <p class="links">
      <a href="https://dict.leo.org/französisch-deutsch/${encodeURIComponent(w)}" target="_blank" rel="noopener">LEO</a>
      <a href="https://de.wiktionary.org/wiki/${encodeURIComponent(wk?.lemma || w)}" target="_blank" rel="noopener">Wiktionary</a>
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
  const phraseBtn = sheet.querySelector('[data-phrase]');
  if (phraseBtn) phraseBtn.onclick = async () => {
    phraseBtn.textContent = 'Traduction…';
    const out = sheet.querySelector('.phrase-de');
    try {
      out.textContent = (await src.translate(sentence)).main;
    } catch {
      out.textContent = 'Traduction indisponible.';
    }
    out.hidden = false;
    phraseBtn.remove();
  };
}

sheet.addEventListener('click', (e) => {
  if (e.target === sheet || e.target.closest('[data-close]')) sheet.hidden = true;
});

/* ---------- Carnet ---------- */

let tab = 'aime';

const SOURCES_TEXT = `Actualités : plus de 60 flux — presse française, suisse et européenne, think tanks,
  Rhin supérieur et régions frontalières, villes (Bâle, Strasbourg, Berlin, Bruxelles, Paris, Vienne), design et photo.
  Art : Art Institute of Chicago, Cleveland Museum of Art, SMK, V&A, The Met, Wellcome Collection, Europeana,
  Library of Congress, Openverse, Finna, Wikimedia Commons.
  Savoir : Wikipédia, Vikidia, Wikiquote, Wikidata. Traduction : MyMemory, Wiktionary. Recherche : OpenAlex.`;

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
      <h3 class="imp">Parti pris</h3>
      <p class="muted">Une part du flux vient délibérément de voix décoloniales, antiracistes, féministes, queer et solidaires.</p>
      <div class="pp">${PARTI_PRIS.map(([name, share], i) => `<button data-pp="${i}" aria-pressed="${i === getPartiPris()}">${name}${share ? ` · 1/${Math.round(1 / share)}` : ''}</button>`).join('')}</div>
      <button class="btn ghost" data-reset>Réinitialiser l’algorithme</button>
      <p class="muted">Tout reste sur ce téléphone : favoris, lexique et préférences.</p>
      <p class="muted">${SOURCES_TEXT}</p>
      <h3 class="imp">Impressum</h3>
      <p class="muted">Simo Schlumpf</p></div>`;
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
  } else if (t.dataset.pp) {
    setPartiPris(+t.dataset.pp);
    openCarnet();
    toast('Parti pris : ' + PARTI_PRIS[+t.dataset.pp][0]);
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

// Un lien partagé ouvre directement la vue détaillée de la carte.
async function openShared() {
  const ref = decodeURIComponent(location.hash.slice(1));
  let c = ref ? await src.loadRef(ref).catch(() => null) : null;
  if (!c) c = sharedCard();
  if (!c) return;
  c.cat = src.category(c);
  c.sharedLabel = c.sharedLabel || c.label;
  c.label = 'POUR TOI · ' + (c.sharedLabel || '');
  known.add(c.id);
  upNext.unshift(c);
  feed.querySelector('.k-start .motto').insertAdjacentHTML('afterend', '<p class="pourtoi">Quelqu’un a pensé à toi ↓</p>');
  history.replaceState(null, '', location.pathname);
  openDetail(c);
}

async function start() {
  renderStart();
  openShared();
  newsAt = Date.now();
  const daily = (lang) =>
    src.loadWikiDaily(lang).then((r) => {
      trend.push(...r.trend);
      setTrending(src.words(trend.join(' ')));
      addToPool(r.cards);
    });
  refill();
  const first = Promise.allSettled([src.loadNews().then(addToPool), daily('fr'), daily('de')]);
  await Promise.race([first, new Promise((r) => setTimeout(r, 2500))]);
  ready = true;
  ensureAhead();
  await first;
  setTimeout(() => cards.length <= 1 && renderOffline(), 8000);
}

start();
