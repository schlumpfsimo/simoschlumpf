'use strict';
/* ===================================================================== */
/* Turbo – App                                                            */
/* ===================================================================== */
const CFG = window.TURBO_CONFIG || {};
const API = (CFG.apiUrl || '').replace(/\/$/, '');
const PW_KEY = 'turbo.pw';
let DATA = null, KEYHASH = '';

/* ---------- Helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STANCES = ['ja', 'eher_ja', 'offen', 'eher_nein', 'nein'];
const STANCE_LABEL = { ja: 'Ja', eher_ja: 'eher Ja', offen: 'offen', eher_nein: 'eher Nein', nein: 'Nein' };
const STANCE_SHORT = { ja: 'JA', eher_ja: 'eJ', offen: '?', eher_nein: 'eN', nein: 'NEIN' };
const fmtDate = d => d ? String(d).slice(0, 10).split('-').reverse().join('.') : '';
const fmtTs = t => t ? new Date(t).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
const today = () => new Date().toISOString().slice(0, 10);
const age = d => { if (!d) return ''; const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const frColor = f => (DATA.fraktionen[f] || {}).farbe || '#888';
const frChip = m => `<span class="chip fr" style="background:${frColor(m.fraktion)}">${esc(m.partei)}</span>`;
const member = id => DATA.members.find(m => m.id === +id);
const fullName = m => `${m.vorname} ${m.name}`;
const KEYKOMM = ['APK-N', 'SPK-N', 'WAK-N', 'UREK-N', 'SGK-N', 'WBK-N', 'KVF-N', 'FK-N'];
let toastT; function toast(msg) { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2200); }
const loadJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const saveJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

/* ===================================================================== */
/* Store – gemeinsamer Zustand (Worker) mit lokalem Cache und Warteschlange */
/* ===================================================================== */
const Store = {
  state: loadJ('turbo.state', {}), version: loadJ('turbo.version', 0), queue: loadJ('turbo.queue', []),
  user: loadJ('turbo.user', ''), online: null, lastSync: null, timer: null, listeners: [],
  get(key, def) { const e = this.state[key]; return e && e.v !== undefined && e.v !== null ? e.v : def; },
  entry(key) { return this.state[key]; },
  keys(prefix) { return Object.keys(this.state).filter(k => k.startsWith(prefix) && this.state[k].v !== null && this.state[k].v !== undefined); },
  set(key, v, silent) {
    const ts = new Date().toISOString();
    if (v === null || v === undefined) delete this.state[key]; else this.state[key] = { v, ts, by: this.user || 'ich', ver: 0, pending: true };
    this.queue.push({ key, v: v === undefined ? null : v });
    saveJ('turbo.state', this.state); saveJ('turbo.queue', this.queue);
    if (!silent) this.flush();
    this.emit();
  },
  setMany(pairs) { for (const [k, v] of pairs) this.set(k, v, true); this.flush(); },
  on(fn) { this.listeners.push(fn); }, emit() { for (const fn of this.listeners) try { fn(); } catch (e) {} },
  async api(path, opt = {}) {
    if (!API) throw new Error('kein API');
    const r = await fetch(API + path, { ...opt, headers: { 'content-type': 'application/json', 'x-turbo-key': KEYHASH, ...(opt.headers || {}) } });
    if (r.status === 401) throw new Error('unauthorized');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  },
  async flush() {
    if (!API || !this.queue.length || this.flushing) return;
    this.flushing = true;
    const batch = this.queue.slice(0, 200);
    try {
      const r = await this.api('/ops', { method: 'POST', body: JSON.stringify({ ops: batch, by: this.user || 'anonym' }) });
      this.queue = this.queue.slice(batch.length); saveJ('turbo.queue', this.queue);
      for (const op of batch) { const e = this.state[op.key]; if (e) { e.pending = this.queue.some(q => q.key === op.key); } }
      this.version = Math.max(this.version, r.version || 0); saveJ('turbo.version', this.version); saveJ('turbo.state', this.state);
      this.setOnline(true);
    } catch (e) { this.setOnline(false, e.message); }
    this.flushing = false;
    if (this.queue.length && this.online) this.flush();
  },
  async pull(full) {
    if (!API) return;
    try {
      const r = await this.api('/state' + (full || !this.version ? '' : '?since=' + this.version));
      if (!r.partial) { for (const k of Object.keys(this.state)) if (!this.state[k].pending && !r.state[k]) delete this.state[k]; }
      for (const [k, e] of Object.entries(r.state)) { const loc = this.state[k]; if (loc && loc.pending) continue; this.state[k] = e; }
      this.version = Math.max(this.version, r.version || 0); this.lastSync = new Date();
      saveJ('turbo.state', this.state); saveJ('turbo.version', this.version);
      this.setOnline(true); this.emit();
    } catch (e) { this.setOnline(false, e.message); }
  },
  setOnline(ok, msg) {
    const was = this.online; this.online = ok;
    const dot = document.getElementById('syncdot'); if (dot) { dot.className = 'sync ' + (!API ? 'warn' : ok ? (this.queue.length ? 'warn' : 'ok') : 'err'); dot.title = !API ? 'Kein Speicherdienst konfiguriert – nur lokal' : ok ? 'Synchronisiert ' + (this.lastSync ? this.lastSync.toLocaleTimeString('de-CH') : '') : 'Offline: ' + (msg || ''); }
    const b = document.getElementById('banner');
    if (b) { if (!API) { b.textContent = 'Kein gemeinsamer Speicher konfiguriert – Änderungen bleiben nur in diesem Browser.'; b.classList.remove('hidden'); } else if (ok === false) { b.textContent = 'Speicherdienst nicht erreichbar (' + (msg || '') + ') – Änderungen werden zwischengespeichert und später übertragen.'; b.classList.remove('hidden'); } else b.classList.add('hidden'); }
    if (was === false && ok) this.flush();
  },
  startPolling() {
    if (!API) { this.setOnline(null); return; }
    this.pull(true).then(() => this.flush());
    clearInterval(this.timer); this.timer = setInterval(() => { if (document.visibilityState === 'visible') this.pull(); }, 25000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.pull(); });
    window.addEventListener('online', () => this.pull());
  },
};

/* ---------- Domänen-Zugriffe auf den Store ---------- */
const DEFAULT_STATUSES = [
  { id: 'offen', label: 'offen', color: '#6b7a9e' }, { id: 'kontaktiert', label: 'kontaktiert', color: '#4da3ff' }, { id: 'gespraech', label: 'im Gespräch', color: '#ffb454' },
  { id: 'dabei', label: 'dabei', color: '#38d47a' }, { id: 'unsicher', label: 'unsicher', color: '#c678dd' }, { id: 'abgesagt', label: 'abgesagt', color: '#ff5c5c' }];
const statuses = () => Store.get('config:statuses', DEFAULT_STATUSES);
const statusOf = id => { const t = tracking(id); return statuses().find(s => s.id === (t.status || 'offen')) || statuses()[0]; };
const tracking = id => Store.get('tracking:' + id, {});
const profil = id => Store.get('profil:' + id, {});
const comments = id => Store.keys('comment:' + id + ':').map(k => ({ key: k, ...Store.state[k].v, ts: Store.state[k].v.ts || Store.state[k].ts })).sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
const relations = () => Store.keys('relation:').map(k => ({ key: k, ...Store.state[k].v }));
const team = () => Store.get('config:team', []);
function effStance(m, f) { const o = Store.get(`position:${m.id}:${f}`); return o && o.stance ? { stance: o.stance, basis: 'manuell', override: true, note: o.note || '', by: Store.state[`position:${m.id}:${f}`].by } : { ...m.positionen[f], override: false }; }
const isWon = id => ['dabei'].includes((tracking(id).status || 'offen'));
const prioOf = m => { const t = tracking(m.id); return t.prio ? +t.prio : m.prio; };
function statusChip(id) { const s = statusOf(id); return `<span class="status" style="background:${s.color}">${esc(s.label)}</span>`; }
function prioChip(m) { const p = prioOf(m); return `<span class="prio p${p}" title="${esc(m.prioGrund.join(' · '))}">P${p}</span>`; }

/* ===================================================================== */
/* Sperre / Entschlüsselung                                               */
/* ===================================================================== */
(function lockUI() {
  // Sterne als Glitch, wie der OSD-Text im Drohnenspiel: niedrige Auflösung, zeilenweises Zittern, Körnung, Aussetzer
  const cv = document.getElementById('glitch');
  if (cv) {
    const W = cv.width, H = cv.height, ctx = cv.getContext('2d');
    const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d');
    const star = (x, y, r) => { oc.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; oc.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } oc.closePath(); oc.fill(); };
    const drawClean = t => {
      oc.fillStyle = '#fff'; oc.fillRect(0, 0, W, H); oc.fillStyle = '#000';
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * 0.03; star(W / 2 + Math.cos(a) * 88, H / 2 + Math.sin(a) * 88, 11); }
      oc.font = 'bold 22px monospace'; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillText('TURBO', W / 2, H / 2 + 1);
      oc.imageSmoothingEnabled = false;
    };
    const h = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
    let t = 0, burst = 0;
    const frame = () => {
      t += 1 / 30; drawClean(t);
      const tq = Math.floor(t * 30);
      if (Math.random() < 0.012) burst = 6 + Math.random() * 10; burst = Math.max(0, burst - 1);
      const noise = burst > 0 ? 0.5 : 0.04;
      ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y++) {
        const gate = h(y * 0.37, tq + 1.7) > 0.7 - noise * 0.6;
        let jit = gate ? (h(y, tq) - 0.5) * (1 + noise * 40) : 0;
        jit += Math.sin(y * 0.13 + t * 2) * 0.6;
        ctx.drawImage(off, 0, y, W, 1, Math.round(jit), y, W, 1);
      }
      // Körnung und Aussetzer
      const grains = burst > 0 ? 400 : 60;
      for (let i = 0; i < grains; i++) { const x = (h(i, tq * 7.13) * W) | 0, y = (h(i * 1.3, tq * 3.7) * H) | 0; ctx.fillStyle = h(i, tq) > 0.5 ? '#000' : '#fff'; ctx.fillRect(x, y, 1 + (h(i, y) > 0.8 ? 2 : 0), 1); }
      if (burst > 0) { const yb = (h(tq, 5) * H) | 0; ctx.fillStyle = '#fff'; ctx.fillRect(0, yb, W, 2 + (h(tq, 9) * 6 | 0)); }
      // Laufendes Band
      const band = ((t * 0.11) % 1) * H; ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(0, band, W, 10);
    };
    setInterval(frame, 1000 / 24); frame();
  }
  const pw = document.getElementById('pw'), code = document.getElementById('code');
  const cells = () => [...code.querySelectorAll('.cell')];
  const paint = () => { const v = pw.value; cells().forEach((c, i) => { c.textContent = v[i] ? '*' : ''; c.classList.toggle('on', !!v[i]); c.classList.toggle('cursor', i === Math.min(v.length, 3) && document.activeElement === pw); }); };
  code.addEventListener('click', () => pw.focus()); pw.addEventListener('input', paint); pw.addEventListener('focus', paint); pw.addEventListener('blur', paint);
  document.getElementById('lock').addEventListener('click', e => { if (e.target.closest('form') && !e.target.closest('label,button')) pw.focus(); });
  setTimeout(() => pw.focus(), 200);
})();
async function decryptBlob(buf, password) {
  const dv = new DataView(buf); const hlen = dv.getUint32(0);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hlen)));
  const ct = new Uint8Array(buf, 4 + hlen);
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(header.salt), iterations: header.iter, hash: 'SHA-256' }, keyMat, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(header.iv) }, key, ct);
  let bytes = plain;
  if (header.gz) { if (!('DecompressionStream' in window)) throw new Error('Browser zu alt (DecompressionStream fehlt).'); bytes = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function tryUnlock(password, remember) {
  const res = await fetch('data.enc', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Datendatei nicht gefunden (' + res.status + ').');
  DATA = await decryptBlob(await res.arrayBuffer(), password);
  KEYHASH = await sha256hex('turbo:' + password);
  try { (remember ? localStorage : sessionStorage).setItem(PW_KEY, password); } catch (e) {}
  document.getElementById('lock').style.display = 'none'; document.getElementById('app').style.display = 'block';
  boot();
}
document.getElementById('lockform').addEventListener('submit', async ev => {
  ev.preventDefault(); const err = document.getElementById('lockerr'); err.textContent = '';
  const btn = ev.target.querySelector('button'); btn.disabled = true; btn.textContent = '…';
  try { await tryUnlock(document.getElementById('pw').value.trim(), document.getElementById('remember').checked); }
  catch (e) { err.textContent = /OperationError|decrypt/i.test(String(e)) ? 'FALSCHER CODE' : ('FEHLER: ' + e.message); document.getElementById('pw').value = ''; document.getElementById('pw').dispatchEvent(new Event('input')); }
  finally { btn.disabled = false; btn.textContent = 'Öffnen'; }
});
(async () => { let saved = null; try { saved = localStorage.getItem(PW_KEY) || sessionStorage.getItem(PW_KEY); } catch (e) {}
  if (saved) { try { await tryUnlock(saved, !!localStorage.getItem(PW_KEY)); } catch (e) { try { localStorage.removeItem(PW_KEY); sessionStorage.removeItem(PW_KEY); } catch (_) {} } } })();
document.getElementById('lockbtn').addEventListener('click', () => { try { localStorage.removeItem(PW_KEY); sessionStorage.removeItem(PW_KEY); } catch (e) {} location.reload(); });
document.getElementById('who').addEventListener('click', () => { const n = prompt('Dein Name/Kürzel (erscheint im Änderungsverlauf):', Store.user || ''); if (n !== null) { Store.user = n.trim(); saveJ('turbo.user', Store.user); paintWho(); } });
function paintWho() { document.getElementById('whoname').textContent = Store.user || 'Name setzen'; }

/* ===================================================================== */
/* Routing                                                                 */
/* ===================================================================== */
const ROUTES = [
  { id: 'start', label: 'Start', short: 'Start', icon: '◎' }, { id: 'liste', label: 'Nationalrat', short: 'NR', icon: '👥' }, { id: 'netzwerk', label: 'Netzwerk', short: 'Netz', icon: '⬡' },
  { id: 'kommissionen', label: 'Kommissionen', short: 'Komm.', icon: '🏛' }, { id: 'bilaterale', label: 'Bilaterale III', short: 'Bilat.', icon: '🇪🇺' }, { id: 'dossier', label: 'Dossiers', short: 'Dossiers', icon: '★', href: '#/dossier/staendemehr' },
  { id: 'positionen', label: 'Positionen', short: 'Matrix', icon: '📊' }, { id: 'info', label: 'Info', short: 'Info', icon: 'ℹ' }];
function navHtml(active) {
  document.getElementById('tabs').innerHTML = ROUTES.map(r => `<a href="${r.href || '#/' + r.id}" class="${active === r.id ? 'active' : ''}">${r.label}</a>`).join('');
  document.getElementById('bottomnav').innerHTML = ROUTES.map(r => `<a href="${r.href || '#/' + r.id}" class="${active === r.id ? 'active' : ''}"><span class="ic">${r.icon}</span>${r.short}</a>`).join('');
}
let CURRENT = null;
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'start';
  const [view, arg] = h.split('/');
  const main = document.getElementById('main');
  if (CURRENT && CURRENT.cleanup) CURRENT.cleanup();
  CURRENT = { view, arg };
  window.scrollTo(0, 0);
  const map = { start: renderStart, liste: renderListe, person: renderPerson, kommissionen: renderKommissionen, kommission: renderKommission, netzwerk: renderNetzwerk, bilaterale: renderBilaterale, dossier: renderDossier, positionen: renderPositionen, info: renderInfo };
  const fn = map[view] || renderStart;
  navHtml(view === 'person' ? 'liste' : view === 'kommission' ? 'kommissionen' : view);
  fn(main, arg);
}
function rerender() { if (CURRENT && !CURRENT.noRerender) route(); }
function boot() {
  migrateLegacy(); paintWho();
  window.addEventListener('hashchange', route);
  Store.on(() => { if (CURRENT && CURRENT.onStore) CURRENT.onStore(); });
  Store.startPolling(); route();
  if (!Store.user) setTimeout(() => document.getElementById('who').click(), 400);
}
function migrateLegacy() {
  const ov = loadJ('turbo.overrides', null), notes = loadJ('turbo.notes', null);
  if (ov) { for (const [mid, fs] of Object.entries(ov)) for (const [f, o] of Object.entries(fs)) Store.set(`position:${mid}:${f}`, { stance: o.stance, note: o.note || '' }, true); localStorage.removeItem('turbo.overrides'); }
  if (notes) { for (const [mid, t] of Object.entries(notes)) if (t) Store.set(`comment:${mid}:${uid()}`, { text: t, by: Store.user || 'import', ts: new Date().toISOString() }, true); localStorage.removeItem('turbo.notes'); }
  if (ov || notes) Store.flush();
}

/* ---------- Aggregation ---------- */
function aggregate(members, f) { const c = { ja: 0, eher_ja: 0, offen: 0, eher_nein: 0, nein: 0 }; for (const m of members) c[effStance(m, f).stance]++; return c; }
function barHtml(c) { const n = Object.values(c).reduce((a, b) => a + b, 0) || 1; return `<div class="bar" title="${esc(Object.entries(c).map(([k, v]) => STANCE_LABEL[k] + ': ' + v).join(', '))}">${STANCES.map(s => `<div class="${s}" style="width:${100 * c[s] / n}%"></div>`).join('')}</div>`; }
const legendHtml = () => `<div class="legend">${STANCES.map(s => `<span><i style="background:var(--${s === 'eher_ja' ? 'eja' : s === 'eher_nein' ? 'enein' : s})"></i>${STANCE_LABEL[s]}</span>`).join('')}<span><i style="border:2px dashed var(--muted);background:transparent"></i>manuell</span></div>`;
function sumLine(c) { const pro = c.ja + c.eher_ja, con = c.nein + c.eher_nein; return `<span class="st chip ja">${pro} Ja/eher Ja</span> <span class="st chip offen">${c.offen} offen</span> <span class="st chip nein">${con} Nein/eher Nein</span>`; }
function statusCounts(members) { const c = {}; for (const s of statuses()) c[s.id] = 0; for (const m of members) { const s = statusOf(m.id).id; c[s] = (c[s] || 0) + 1; } return c; }
function statusBar(members) { const c = statusCounts(members), n = members.length || 1; return `<div class="bar">${statuses().map(s => `<div style="width:${100 * (c[s.id] || 0) / n}%;background:${s.color}" title="${esc(s.label)}: ${c[s.id] || 0}"></div>`).join('')}</div><div class="legend">${statuses().map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)} ${c[s.id] || 0}</span>`).join('')}</div>`; }

/* ===================================================================== */
/* Start / Dashboard                                                       */
/* ===================================================================== */
function renderStart(main) {
  const D = DATA, F = D.bilaterale.fragen;
  const won = D.members.filter(m => isWon(m.id));
  const openSteps = D.members.map(m => ({ m, t: tracking(m.id) })).filter(x => x.t.naechsterSchritt || x.t.naechsterTermin).sort((a, b) => (a.t.naechsterTermin || '9').localeCompare(b.t.naechsterTermin || '9'));
  const recent = Object.entries(Store.state).filter(([k, e]) => /^(tracking|comment|position|profil|relation):/.test(k) && e.ts).sort((a, b) => b[1].ts.localeCompare(a[1].ts)).slice(0, 12);
  const focus = ['staendemehr', 'erasmus'].map(fid => F.find(f => f.id === fid));
  const komm = kurz => (D.kommissionen.find(k => k.kurz === kurz) || { mitglieder: [] }).mitglieder.map(x => member(x.id)).filter(Boolean);
  main.innerHTML = `<h1>Lage</h1>
    <div class="stat">
      <div class="card"><div class="n">${D.members.length}</div><div class="l">Nationalratsmitglieder</div></div>
      <div class="card"><div class="n">${won.length}</div><div class="l">dabei</div></div>
      <div class="card"><div class="n">${D.members.filter(m => ['kontaktiert', 'gespraech'].includes(statusOf(m.id).id)).length}</div><div class="l">in Kontakt / Gespräch</div></div>
      <div class="card"><div class="n">${D.members.filter(m => prioOf(m) === 3).length}</div><div class="l">Priorität 1 (P3)</div></div>
      <div class="card"><div class="n">${openSteps.filter(x => x.t.naechsterTermin && x.t.naechsterTermin < today()).length}</div><div class="l">überfällige Schritte</div></div>
    </div>
    <div class="card"><h3>Stand der Kontaktarbeit</h3>${statusBar(D.members)}</div>
    <div class="grid two" style="margin-top:12px">
      ${focus.map(f => `<div class="card"><h3>Fokus: ${esc(f.label)}</h3><div class="small muted">${esc(f.frage)}</div>
        <div style="margin:8px 0"><b>Nationalrat</b>${barHtml(aggregate(D.members, f.id))}${sumLine(aggregate(D.members, f.id))}</div>
        ${[f.kommission, ...f.mitbericht].map(k => { const ms = komm(k); return ms.length ? `<div style="margin:8px 0"><b>${esc(k)}</b> <span class="small muted">(${ms.length})</span>${barHtml(aggregate(ms, f.id))}${sumLine(aggregate(ms, f.id))}</div>` : ''; }).join('')}
        <a class="btn sm" href="#/dossier/${f.id}">Dossier öffnen</a></div>`).join('')}
    </div>
    <div class="card section"><h3>Nächste Termine</h3><ul class="list small">${(D.bilaterale.termine || []).filter(t => t.bis >= today()).sort((a, b) => a.von.localeCompare(b.von)).slice(0, 12).map(t => `<li><span class="num">${fmtDate(t.von)}${t.bis !== t.von ? '–' + fmtDate(t.bis) : ''}</span> · <b>${esc(t.gremium)}</b> · ${esc(t.text)}</li>`).join('') || '<li class="muted">Keine Termine erfasst.</li>'}</ul></div>
    <div class="grid two" style="margin-top:12px">
      <div class="card"><h3>Nächste Schritte</h3>${openSteps.length ? `<ul class="list small">${openSteps.slice(0, 15).map(x => `<li><span class="${x.t.naechsterTermin && x.t.naechsterTermin < today() ? 'due' : 'num'}">${fmtDate(x.t.naechsterTermin) || '–'}</span> · <a href="#/person/${x.m.id}">${esc(fullName(x.m))}</a> ${frChip(x.m)}<br>${esc(x.t.naechsterSchritt || '')}${x.t.owner ? ` <span class="pill">${esc(x.t.owner)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">Noch keine nächsten Schritte erfasst. Im Profil einer Person unter «Tracking» eintragen.</p>'}</div>
      <div class="card"><h3>Zuletzt geändert</h3>${recent.length ? `<ul class="list small">${recent.map(([k, e]) => { const mid = k.split(':')[1]; const m = member(mid); return `<li><span class="muted">${fmtTs(e.ts)}</span> · ${esc(e.by || '')} · ${m ? `<a href="#/person/${m.id}">${esc(fullName(m))}</a>` : esc(k)} <span class="muted">${esc(k.split(':')[0])}</span></li>`; }).join('')}</ul>` : '<p class="muted small">Noch keine Änderungen.</p>'}</div>
    </div>
    <div class="card section"><h3>Prioritäre Personen, noch nicht dabei</h3>
      <div class="chips">${D.members.filter(m => prioOf(m) === 3 && !isWon(m.id)).sort((a, b) => a.name.localeCompare(b.name)).map(m => `<a class="chip k" href="#/person/${m.id}" style="border-left:4px solid ${statusOf(m.id).color}">${esc(fullName(m))} · ${esc(m.partei)} ${esc(m.kanton)}</a>`).join('')}</div>
      <p class="small muted">Priorität aus Kommissionszugehörigkeit (APK-N, SPK-N, WBK-N, FK-N), Fraktion mit offenem Stimmverhalten und offener Haltung zu Ständemehr/Erasmus+. Im Profil manuell änderbar.</p></div>`;
  CURRENT.onStore = () => renderStart(main);
}

/* ===================================================================== */
/* Liste                                                                   */
/* ===================================================================== */
const LIST_STATE = loadJ('turbo.list', { q: '', fr: '', kt: '', ko: '', fr_id: 'staendemehr', st: '', sort: 'prio', g: '', status: '', prio: '' });
function renderListe(main) {
  const D = DATA, S = LIST_STATE;
  const kantone = [...new Set(D.members.map(m => m.kanton))].sort();
  const komm = D.kommissionen.filter(k => k.typ === 'Ständig' || k.bilaterale).sort((a, b) => a.kurz.localeCompare(b.kurz));
  main.innerHTML = `
    <h1>Nationalrat <span class="muted small">${D.members.length} Mitglieder · Stand ${fmtDate((D.meta.quelleStand || '').slice(0, 10))}</span></h1>
    <div class="toolbar collapsible" id="ltb">
      <input type="search" id="q" placeholder="Suche: Name, Kanton, Partei, Kommission, Organisation, Beruf, Mitarbeitende …" value="${esc(S.q)}">
      <button class="btn sm filterbtn" id="ftog">Filter ▾</button>
      <select class="f" id="status"><option value="">Alle Status</option>${statuses().map(s => `<option value="${s.id}" ${S.status === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
      <select class="f" id="prio"><option value="">Alle Prioritäten</option><option value="3" ${S.prio === '3' ? 'selected' : ''}>P3 (hoch)</option><option value="2" ${S.prio === '2' ? 'selected' : ''}>P2</option><option value="1" ${S.prio === '1' ? 'selected' : ''}>P1</option></select>
      <select class="f" id="fr"><option value="">Alle Fraktionen</option>${Object.entries(D.fraktionen).map(([k, v]) => `<option value="${k}" ${S.fr === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
      <select class="f" id="kt"><option value="">Alle Kantone</option>${kantone.map(k => `<option ${S.kt === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <select class="f" id="ko"><option value="">Alle Kommissionen</option>${komm.map(k => `<option value="${k.nr}" ${S.ko == k.nr ? 'selected' : ''}>${esc(k.kurz)} – ${esc(k.name)}</option>`).join('')}</select>
      <select class="f" id="g"><option value="">Alle Geschlechter</option><option value="f" ${S.g === 'f' ? 'selected' : ''}>Frauen</option><option value="m" ${S.g === 'm' ? 'selected' : ''}>Männer</option></select>
      <select class="f" id="fr_id">${D.bilaterale.fragen.map(f => `<option value="${f.id}" ${S.fr_id === f.id ? 'selected' : ''}>Position: ${esc(f.label)}</option>`).join('')}</select>
      <select class="f" id="st"><option value="">Alle Positionen</option>${STANCES.map(s => `<option value="${s}" ${S.st === s ? 'selected' : ''}>${STANCE_LABEL[s]}</option>`).join('')}</select>
      <select class="f" id="sort"><option value="prio" ${S.sort === 'prio' ? 'selected' : ''}>Sortierung: Priorität</option><option value="name" ${S.sort === 'name' ? 'selected' : ''}>Name</option><option value="kanton" ${S.sort === 'kanton' ? 'selected' : ''}>Kanton</option><option value="fraktion" ${S.sort === 'fraktion' ? 'selected' : ''}>Fraktion</option><option value="position" ${S.sort === 'position' ? 'selected' : ''}>Position</option><option value="status" ${S.sort === 'status' ? 'selected' : ''}>Status</option></select>
      <button class="btn sm f" id="reset">Zurücksetzen</button>
      <span class="counter" id="count"></span>
    </div>
    <div id="agg"></div>
    <div class="grid" id="cards"></div>`;
  const apply = () => {
    const q = norm(S.q.trim());
    let list = D.members.filter(m => {
      if (S.fr && m.fraktion !== S.fr) return false;
      if (S.kt && m.kanton !== S.kt) return false;
      if (S.g && m.geschlecht !== S.g) return false;
      if (S.status && statusOf(m.id).id !== S.status) return false;
      if (S.prio && String(prioOf(m)) !== S.prio) return false;
      if (S.ko && !m.kommissionen.some(k => k.nr == S.ko)) return false;
      if (S.st && effStance(m, S.fr_id).stance !== S.st) return false;
      if (q) { const p = profil(m.id), t = tracking(m.id); const hay = norm([m.vorname, m.name, m.kanton, m.kantonName, m.partei, m.parteiName, m.fraktionName, m.kommissionen.map(k => k.kurz + ' ' + k.name).join(' '), m.buergerorte.join(' '), m.berufe.map(b => b.beruf + ' ' + (b.arbeitgeber || '')).join(' '), m.mitarbeitende.map(x => x.name).join(' '), m.interessen.map(i => i.name).join(' '), m.parlGruppen.join(' '), p.privat, p.beruflich, p.kontaktperson, t.owner, (t.tags || []).join(' ')].join(' ')); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
      return true;
    });
    const sIdx = Object.fromEntries(statuses().map((s, i) => [s.id, i]));
    const key = { name: m => m.name + ' ' + m.vorname, kanton: m => m.kanton + m.name, fraktion: m => m.fraktion + m.name, position: m => STANCES.indexOf(effStance(m, S.fr_id).stance) + m.name, prio: m => (9 - prioOf(m)) + m.name, status: m => sIdx[statusOf(m.id).id] + m.name }[S.sort];
    list.sort((a, b) => String(key(a)).localeCompare(String(key(b)), 'de'));
    document.getElementById('count').textContent = `${list.length} von ${D.members.length}`;
    const fq = D.bilaterale.fragen.find(f => f.id === S.fr_id);
    document.getElementById('agg').innerHTML = `<div class="card" style="margin-bottom:12px"><div class="small muted">Gefiltert: ${list.length} Mitglieder · Einschätzung «${esc(fq.label)}»</div>${barHtml(aggregate(list, S.fr_id))}${sumLine(aggregate(list, S.fr_id))}<div style="margin-top:8px">${statusBar(list)}</div></div>`;
    document.getElementById('cards').innerHTML = list.map(m => { const p = effStance(m, S.fr_id), t = tracking(m.id), s = statusOf(m.id);
      return `<a class="card person" href="#/person/${m.id}" style="border-left-color:${s.color}">
        <img class="avatar" loading="lazy" src="${esc(m.foto)}" data-alt="${esc(m.fotoAlt)}" alt="" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else{this.style.visibility='hidden'}">
        <div>
          <div class="pname">${esc(fullName(m))} ${prioChip(m)}</div>
          <div class="psub">${frChip(m)} ${esc(m.kanton)} · ${m.fraktionFunktion && m.fraktionFunktion !== 'Mitglied' ? esc(m.fraktionFunktion) + ' · ' : ''}seit ${m.nrSeit ? m.nrSeit.slice(0, 4) : '?'}</div>
          <div class="chips" style="margin-top:6px">${m.kommissionen.filter(k => k.typ === 'Ständig').map(k => `<span class="chip k ${KEYKOMM.includes(k.kurz) ? 'lead' : ''}" title="${esc(k.name)} – ${esc(k.funktion)}">${esc(k.kurz)}${k.funktion !== 'Mitglied' ? ' ★' : ''}</span>`).join('')}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${statusChip(m.id)}${t.owner ? `<span class="pill">${esc(t.owner)}</span>` : ''}<span class="chip st ${p.stance} ${p.override ? 'override' : ''}">${STANCE_LABEL[p.stance]}</span> <span class="small muted">${esc(fq.label)}</span></div>
          ${t.naechsterSchritt ? `<div class="small" style="margin-top:4px">→ ${esc(t.naechsterSchritt)} <span class="${t.naechsterTermin && t.naechsterTermin < today() ? 'due' : 'muted'}">${fmtDate(t.naechsterTermin)}</span></div>` : ''}
        </div></a>`; }).join('') || '<p class="muted">Keine Treffer.</p>';
    saveJ('turbo.list', S);
  };
  for (const id of ['q', 'fr', 'kt', 'ko', 'g', 'fr_id', 'st', 'sort', 'status', 'prio']) document.getElementById(id).addEventListener('input', e => { S[id] = e.target.value; apply(); });
  document.getElementById('ftog').addEventListener('click', () => { const t = document.getElementById('ltb'); t.classList.toggle('open'); document.getElementById('ftog').textContent = t.classList.contains('open') ? 'Filter ▴' : 'Filter ▾'; });
  document.getElementById('reset').addEventListener('click', () => { Object.assign(S, { q: '', fr: '', kt: '', ko: '', st: '', sort: 'prio', g: '', status: '', prio: '' }); renderListe(main); });
  apply(); CURRENT.onStore = apply;
}

/* ===================================================================== */
/* Person                                                                  */
/* ===================================================================== */
function vcard(m) {
  const p = profil(m.id); const kontakt = [...m.kontakt, ...(p.kontakte || [])];
  const email = kontakt.find(c => c.typ === 'Email'), tel = kontakt.filter(c => /Natel|Telefon|Mobile/i.test(c.typ)), web = kontakt.find(c => c.typ === 'Homepage'), ad = m.adressen[0];
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${m.name};${m.vorname};;;`, `FN:${m.vorname} ${m.name}`, `ORG:Nationalrat;${m.partei} ${m.kanton}`, `TITLE:Nationalrat/Nationalrätin (${m.partei}, ${m.kanton})`];
  if (email) lines.push(`EMAIL;TYPE=WORK:${email.wert}`);
  for (const t of tel) lines.push(`TEL;TYPE=${/Natel|Mobile/i.test(t.typ) ? 'CELL' : 'WORK'}:${t.wert}`);
  if (web) lines.push(`URL:${/^https?:/.test(web.wert) ? web.wert : 'https://' + web.wert}`);
  if (ad) lines.push(`ADR;TYPE=HOME:;;${ad.zeilen.join(', ')};${ad.ort};${ad.kanton || ''};${ad.plz || ''};Schweiz`);
  lines.push(`NOTE:Kommissionen: ${m.kommissionen.map(k => k.kurz).join(', ')}`, `PHOTO;VALUE=URI:${m.foto}`, 'END:VCARD');
  return lines.join('\r\n');
}
function linkify(c) { const v = esc(c.wert);
  if (/mail/i.test(c.typ)) return `<a href="mailto:${v}">${v}</a>`;
  if (/Natel|Telefon|Mobile|Tel/i.test(c.typ)) return `<a href="tel:${v.replace(/\s/g, '')}">${v}</a>`;
  if (/Homepage|Web|^(www\.|https?:)/i.test(c.typ + c.wert)) return `<a href="${/^https?:/.test(c.wert) ? v : 'https://' + v}" target="_blank" rel="noopener">${v}</a>`;
  return v; }
function connectionsOf(m) {
  const list = DATA.edges.filter(e => e.a === m.id || e.b === m.id).map(e => ({ other: member(e.a === m.id ? e.b : e.a), w: e.w, gem: e.gem })).filter(x => x.other);
  for (const r of relations()) { if (r.a === m.id || r.b === m.id) { const o = member(r.a === m.id ? r.b : r.a); if (o) { const ex = list.find(x => x.other.id === o.id); const g = { typ: 'manuell', label: r.typ + (r.text ? ': ' + r.text : '') }; if (ex) { ex.w += 4; ex.gem.push(g); } else list.push({ other: o, w: 4, gem: [g] }); } } }
  return list.sort((a, b) => b.w - a.w);
}
const GEM_LABEL = { komm: 'Kommission', org: 'Organisation', arbeitgeber: 'Arbeitgeber', gruppe: 'Parl. Gruppe', buerger: 'Bürgerort', manuell: 'manuell' };
function renderPerson(main, id) {
  const D = DATA, m = member(id);
  if (!m) { main.innerHTML = '<p>Person nicht gefunden.</p>'; return; }
  const t = tracking(m.id), p = profil(m.id), cs = comments(m.id), s = statusOf(m.id);
  const rels = relations().filter(r => r.a === m.id || r.b === m.id);
  const conns = connectionsOf(m);
  const bridges = conns.filter(c => isWon(c.other.id)).slice(0, 8);
  const fraktionsinfo = D.bilaterale.parteilinien[m.partei] || D.bilaterale.fraktionslinien[m.fraktion] || {};
  const kontakte = [...m.kontakt, ...(p.kontakte || []).map(k => ({ ...k, eigen: true }))];
  main.innerHTML = `
    <a class="back" href="#/liste">← Liste</a>
    <div class="card" style="border-left:5px solid ${s.color}">
      <div class="phead">
        <img class="avatar lg" src="${esc(m.foto)}" data-alt="${esc(m.fotoAlt)}" alt="" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else{this.style.visibility='hidden'}">
        <div class="meta">
          <h1>${esc(fullName(m))} ${prioChip(m)}</h1>${m.titel ? `<div class="small muted">${esc(m.titel)}</div>` : ''}
          <div class="psub" style="font-size:.92rem">${frChip(m)} ${esc(m.parteiName)} · ${esc(m.kantonName)} (${esc(m.kanton)})<br>${esc(m.fraktionName)}${m.fraktionFunktion && m.fraktionFunktion !== 'Mitglied' ? ' · <b>' + esc(m.fraktionFunktion) + '</b>' : ''}<br>
          Im Nationalrat seit ${fmtDate(m.nrSeit)}${m.srFrueher ? ' · früher Ständerat' : ''}${m.geburtsdatum ? ' · geb. ' + fmtDate(m.geburtsdatum) + ' (' + age(m.geburtsdatum) + ')' : ''}</div>
          <div class="chips" style="margin-top:8px">${m.kommissionen.map(k => `<a class="chip k ${KEYKOMM.includes(k.kurz) ? 'lead' : ''}" href="#/kommission/${k.nr}" title="${esc(k.name)}">${esc(k.kurz || k.name)}${k.funktion !== 'Mitglied' ? ' · ' + esc(k.funktion) : ''}</a>`).join('')}</div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" href="${esc(m.bio)}" target="_blank" rel="noopener">parlament.ch ↗</a><button class="btn sm" id="vcf">vCard</button><a class="btn sm" href="#/netzwerk?sel=${m.id}">Im Netzwerk</a></div>
        </div>
      </div>
    </div>

    <div class="card section" id="trk">
      <h3>Tracking</h3>
      <div class="form">
        <label>Status<select class="inp" data-k="status">${statuses().map(x => `<option value="${x.id}" ${s.id === x.id ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
        <label>Verantwortlich (bei uns)<input class="inp" data-k="owner" list="teamlist" value="${esc(t.owner || '')}" placeholder="Name"><datalist id="teamlist">${team().map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
        <label>Priorität<select class="inp" data-k="prio"><option value="" ${!t.prio ? 'selected' : ''}>automatisch (P${m.prio})</option><option value="3" ${t.prio == 3 ? 'selected' : ''}>P3 hoch</option><option value="2" ${t.prio == 2 ? 'selected' : ''}>P2</option><option value="1" ${t.prio == 1 ? 'selected' : ''}>P1 tief</option></select></label>
        <label>Letzter Kontakt<input class="inp" type="date" data-k="letzterKontakt" value="${esc(t.letzterKontakt || '')}"></label>
        <label>Nächster Termin<input class="inp" type="date" data-k="naechsterTermin" value="${esc(t.naechsterTermin || '')}"></label>
        <label>Tags<input class="inp" data-k="tags" value="${esc((t.tags || []).join(', '))}" placeholder="z. B. Schlüsselperson, Westschweiz"></label>
        <label class="wide">Nächster Schritt<input class="inp" data-k="naechsterSchritt" value="${esc(t.naechsterSchritt || '')}" placeholder="z. B. Anruf nach APK-N-Sitzung, Einladung Anlass"></label>
        <label class="wide">Unser Draht / Zugang (wer kennt die Person, über wen erreichen wir sie?)<input class="inp" data-k="zugang" value="${esc(t.zugang || '')}"></label>
      </div>
      <div class="small muted" style="margin-top:6px">Automatische Priorität: ${esc(m.prioGrund.join(' · ') || '–')}${Store.entry('tracking:' + m.id) ? ` · zuletzt ${fmtTs(Store.entry('tracking:' + m.id).ts)} von ${esc(Store.entry('tracking:' + m.id).by || '')}` : ''}</div>
      <h3 style="margin-top:14px">Kommentare</h3>
      <div style="display:flex;gap:8px"><textarea class="note" id="newc" placeholder="Gesprächsnotiz, Einschätzung, Zusage …" style="min-height:56px"></textarea><button class="btn primary" id="addc">Speichern</button></div>
      <ul class="comments" id="clist">${cs.map(c => `<li><div class="m">${fmtTs(c.ts)} · ${esc(c.by || '')} <button class="btn sm" data-del="${esc(c.key)}" style="float:right">löschen</button></div><div>${esc(c.text).replace(/\n/g, '<br>')}</div></li>`).join('')}</ul>
    </div>

    <div class="grid two" style="margin-top:12px">
      <div class="card">
        <h3>Kontakt</h3>
        <dl class="kv">
          ${kontakte.map(c => `<dt>${esc(c.typ)}${c.eigen ? ' <span class="pill">eigen</span>' : ''}</dt><dd>${linkify(c)}${c.eigen ? ` <button class="btn sm" data-delk="${esc(c.id)}">×</button>` : ''}</dd>`).join('') || '<dd class="muted">Keine Kontaktdaten publiziert.</dd>'}
          ${m.adressen.map(a => `<dt>${esc(a.typ)}</dt><dd>${esc(a.zeilen.join(', '))}${a.zeilen.length ? ', ' : ''}${esc(a.plz || '')} ${esc(a.ort || '')}${a.bemerkung ? ' <span class="muted">(' + esc(a.bemerkung) + ')</span>' : ''}</dd>`).join('')}
        </dl>
        <div class="form" style="margin-top:8px"><label>Typ<input class="inp" id="nk_typ" placeholder="z. B. Mobile privat, Assistenz"></label><label>Wert<input class="inp" id="nk_wert" placeholder="Nummer / Adresse"></label><label>&nbsp;<button class="btn sm" id="nk_add">Kontakt ergänzen</button></label></div>
      </div>
      <div class="card">
        <h3>Persönliche Mitarbeitende <span class="muted small">(parlament.ch)</span></h3>
        ${m.mitarbeitende.length ? `<ul class="list">${m.mitarbeitende.map(e => `<li><b>${esc(e.name)}</b>${e.funktion ? ' – ' + esc(e.funktion) : ''}${e.arbeitgeber ? '<br><span class="muted small">' + esc(e.arbeitgeber) + '</span>' : ''}</li>`).join('')}</ul>` : '<p class="muted small">Keine gemeldet.</p>'}
        <h3 style="margin-top:12px">Eigene Angaben</h3>
        <div class="form"><label class="wide">Private Bindungen (Familie, Vereine, Umfeld)<textarea class="inp" data-p="privat" rows="2">${esc(p.privat || '')}</textarea></label>
        <label class="wide">Berufliche Bindungen (Arbeitgeber, Netzwerke, Verbände)<textarea class="inp" data-p="beruflich" rows="2">${esc(p.beruflich || '')}</textarea></label>
        <label class="wide">Kontaktperson bei uns / Notizen zur Person<textarea class="inp" data-p="kontaktperson" rows="2">${esc(p.kontaktperson || '')}</textarea></label></div>
      </div>
    </div>

    <div class="card section">
      <h3>Verbindungen <span class="muted small">(${conns.length} automatisch aus Kommissionen, Organisationen, Arbeitgebern, Parlamentarischen Gruppen, Bürgerorten; plus manuelle)</span></h3>
      ${bridges.length ? `<p class="small"><b>Brücken über Personen, die schon dabei sind:</b> ${bridges.map(c => `<a href="#/person/${c.other.id}">${esc(fullName(c.other))}</a> <span class="muted">(${esc(c.gem.map(g => g.label).slice(0, 3).join(', '))})</span>`).join(' · ')}</p>` : '<p class="small muted">Noch keine Brücke: keine der verbundenen Personen ist bereits «dabei».</p>'}
      <div class="tablewrap" style="max-height:40vh"><table class="t"><thead><tr><th>Person</th><th>Status</th><th>Gemeinsam</th><th>Stärke</th></tr></thead><tbody>${conns.slice(0, 40).map(c => `<tr><td><a href="#/person/${c.other.id}">${esc(fullName(c.other))}</a> ${frChip(c.other)}</td><td>${statusChip(c.other.id)}</td><td class="small">${c.gem.map(g => `<span class="pill" title="${esc(GEM_LABEL[g.typ] || g.typ)}">${esc(g.label)}</span>`).join(' ')}</td><td class="num">${c.w}</td></tr>`).join('')}</tbody></table></div>
      <h3 style="margin-top:12px">Manuelle Beziehungen</h3>
      ${rels.map(r => { const o = member(r.a === m.id ? r.b : r.a); return `<div class="rel"><span class="typ">${esc(r.typ)}</span> ${o ? `<a href="#/person/${o.id}">${esc(fullName(o))}</a>` : `<b>${esc(r.extern || '')}</b>`} <span class="muted small">${esc(r.text || '')} · ${esc(r.by || '')}</span><button class="btn sm" data-delr="${esc(r.key)}" style="margin-left:auto">×</button></div>`; }).join('')}
      <div class="form" style="margin-top:8px">
        <label>Art<select class="inp" id="r_typ"><option>kennt</option><option>Freundschaft</option><option>Familie</option><option>Geschäft</option><option>Verein</option><option>Studium</option><option>Militär</option><option>Vertrauensperson</option><option>unser Kontakt</option><option>sonstiges</option></select></label>
        <label>Mit Nationalratsmitglied<input class="inp" id="r_mit" list="mlist" placeholder="Name tippen"><datalist id="mlist">${D.members.filter(x => x.id !== m.id).map(x => `<option value="${esc(fullName(x))}">`).join('')}</datalist></label>
        <label>oder externe Person / bei uns<input class="inp" id="r_ext" placeholder="Name"></label>
        <label class="wide">Beschreibung<input class="inp" id="r_text" placeholder="woher, wie eng, worüber"></label>
        <label>&nbsp;<button class="btn sm" id="r_add">Beziehung speichern</button></label>
      </div>
    </div>

    <div class="card section">
      <h2 style="margin-top:0">Bilaterale III – Einschätzung</h2>
      <p class="small muted">Basis: Fraktions-/Parteilinie, belegte individuelle Signale und namentliche Abstimmungen. Klick auf eine Position zum Überschreiben (für alle sichtbar).</p>
      <p class="small"><b>Linie ${esc(m.partei)}:</b> ${esc(fraktionsinfo.quelle || '–')}</p>
      <div class="tablewrap"><table class="t">
        <thead><tr><th>Frage</th><th>Einschätzung</th><th>Basis</th><th>Belege</th></tr></thead>
        <tbody>${D.bilaterale.fragen.map(f => { const pp = effStance(m, f.id); const comp = m.positionen[f.id]; const focus = ['staendemehr', 'erasmus'].includes(f.id);
          return `<tr ${focus ? 'style="background:#f4f4f4"' : ''}><td>${focus ? '★ ' : ''}<b>${esc(f.label)}</b><br><span class="small muted">${esc(f.frage)}</span><br><span class="small muted">${esc(f.kommission)}${f.mitbericht.length ? ' · Mitbericht ' + esc(f.mitbericht.join(', ')) : ''}</span></td>
            <td><button class="chip st ${pp.stance} ${pp.override ? 'override' : ''} ovbtn" data-f="${f.id}" style="border:0;font-size:.9rem">${STANCE_LABEL[pp.stance]}</button>${pp.override ? `<div class="small muted">berechnet: ${STANCE_LABEL[comp.stance]}${pp.note ? ' · ' + esc(pp.note) : ''}${pp.by ? ' · ' + esc(pp.by) : ''}</div>` : ''}</td>
            <td class="small">${esc(pp.basis)}</td>
            <td class="small">${comp.signale.map(x => `<div>• <span class="st chip ${x.stance}">${STANCE_LABEL[x.stance]}</span> ${esc(x.text)} ${x.quelle ? `<a href="${esc(x.quelle)}" target="_blank" rel="noopener">↗</a>` : ''}</div>`).join('')}${comp.abstimmungen.map(v => `<div>• ${fmtDate(v.datum)}: <b>${esc(v.entscheid)}</b> – ${esc(v.label)}</div>`).join('')}${!comp.signale.length && !comp.abstimmungen.length ? '<span class="muted">keine individuellen Belege</span>' : ''}</td></tr>`; }).join('')}</tbody>
      </table></div>
    </div>

    <div class="grid two" style="margin-top:12px">
      <div class="card"><h3>Namentliche Abstimmungen (EU-relevant)</h3>${m.abstimmungen.length ? `<ul class="list small">${m.abstimmungen.slice().sort((a, b) => (b.datum || '').localeCompare(a.datum || '')).map(v => `<li><b>${esc(v.entscheid)}</b> · ${fmtDate(v.datum)} · <a href="https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${esc(String(v.business || '').replace('.', ''))}" target="_blank" rel="noopener">${esc(v.label)}</a></li>`).join('')}</ul>` : '<p class="muted small">Keine Daten.</p>'}</div>
      <div class="card"><h3>Eigene Vorstösse zu EU/Bilaterale</h3>${m.vorstoesse.length ? `<ul class="list small">${m.vorstoesse.map(v => `<li><a href="https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${v.id}" target="_blank" rel="noopener">${esc(v.nr)} ${esc(v.typ)}</a> ${esc(v.titel)} <span class="muted">· ${esc(v.status)}</span></li>`).join('')}</ul>` : '<p class="muted small">Keine seit 2024.</p>'}</div>
    </div>

    <div class="grid two" style="margin-top:12px">
      <div class="card"><h3>Persönliche Angaben</h3><dl class="kv">
          ${m.geburtsdatum ? `<dt>Geburtsdatum</dt><dd>${fmtDate(m.geburtsdatum)} (${age(m.geburtsdatum)})</dd>` : ''}${m.geburtsort ? `<dt>Geburtsort</dt><dd>${esc(m.geburtsort)}</dd>` : ''}${m.buergerorte.length ? `<dt>Bürgerorte</dt><dd>${esc(m.buergerorte.join(', '))}</dd>` : ''}
          ${m.zivilstand ? `<dt>Zivilstand</dt><dd>${esc(m.zivilstand)}</dd>` : ''}${m.kinder != null ? `<dt>Kinder</dt><dd>${esc(m.kinder)}</dd>` : ''}${m.sprache ? `<dt>Muttersprache</dt><dd>${esc(m.sprache)}</dd>` : ''}${m.militaer ? `<dt>Militär</dt><dd>${esc(m.militaer)}</dd>` : ''}
          ${m.wahl ? `<dt>Gewählt</dt><dd>${fmtDate(m.wahl)}</dd>` : ''}${m.berufe.length ? `<dt>Beruf</dt><dd>${m.berufe.map(b => esc([b.beruf, b.funktion, b.arbeitgeber].filter(Boolean).join(', '))).join('<br>')}</dd>` : ''}
          ${m.parlGruppen.length ? `<dt>Parl. Gruppen</dt><dd>${esc(m.parlGruppen.join(', '))}</dd>` : ''}</dl></div>
      <div class="card"><h3>Mandate &amp; Aktivitäten</h3><dl class="kv">${m.mandate ? `<dt>Politische Mandate</dt><dd>${esc(m.mandate)}</dd>` : ''}${m.zusatzMandate ? `<dt>Weitere Mandate</dt><dd>${esc(m.zusatzMandate)}</dd>` : ''}${m.zusatzAktivitaeten ? `<dt>Aktivitäten</dt><dd>${esc(m.zusatzAktivitaeten)}</dd>` : ''}${!m.mandate && !m.zusatzMandate && !m.zusatzAktivitaeten ? '<dd class="muted">–</dd>' : ''}</dl></div>
    </div>
    <div class="card section"><h3>Interessenbindungen <span class="muted small">(${m.interessen.length}, Register parlament.ch)</span></h3>
      ${m.interessen.length ? `<div class="tablewrap" style="max-height:50vh"><table class="t"><thead><tr><th>Organisation</th><th>Art</th><th>Funktion</th><th>Bezahlt</th></tr></thead><tbody>${m.interessen.map(i => `<tr><td>${esc(i.name)}</td><td>${esc(i.art || '')}${i.orgTyp ? ' · ' + esc(i.orgTyp) : ''}</td><td>${esc(i.funktion || '')}</td><td>${i.bezahlt == null ? '' : (i.bezahlt ? 'ja' : 'nein')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Keine Einträge.</p>'}</div>`;
  // Tracking-Felder
  const saveTracking = () => { const o = { ...tracking(m.id) }; main.querySelectorAll('#trk [data-k]').forEach(el => { const k = el.dataset.k; let v = el.value; if (k === 'tags') v = v.split(',').map(x => x.trim()).filter(Boolean); if (k === 'prio') v = v ? +v : undefined; o[k] = v === '' ? undefined : v; }); o.ts = new Date().toISOString(); Store.set('tracking:' + m.id, o); toast('Gespeichert'); };
  main.querySelectorAll('#trk [data-k]').forEach(el => el.addEventListener('change', saveTracking));
  document.getElementById('addc').addEventListener('click', () => { const txt = document.getElementById('newc').value.trim(); if (!txt) return; Store.set(`comment:${m.id}:${uid()}`, { text: txt, by: Store.user || 'anonym', ts: new Date().toISOString() }); renderPerson(main, id); });
  main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (confirm('Kommentar löschen?')) { Store.set(b.dataset.del, null); renderPerson(main, id); } }));
  main.querySelectorAll('[data-p]').forEach(el => el.addEventListener('change', () => { const o = { ...profil(m.id) }; o[el.dataset.p] = el.value; Store.set('profil:' + m.id, o); toast('Gespeichert'); }));
  document.getElementById('nk_add').addEventListener('click', () => { const typ = document.getElementById('nk_typ').value.trim(), wert = document.getElementById('nk_wert').value.trim(); if (!typ || !wert) return; const o = { ...profil(m.id) }; o.kontakte = [...(o.kontakte || []), { id: uid(), typ, wert }]; Store.set('profil:' + m.id, o); renderPerson(main, id); });
  main.querySelectorAll('[data-delk]').forEach(b => b.addEventListener('click', () => { const o = { ...profil(m.id) }; o.kontakte = (o.kontakte || []).filter(k => k.id !== b.dataset.delk); Store.set('profil:' + m.id, o); renderPerson(main, id); }));
  document.getElementById('r_add').addEventListener('click', () => { const name = document.getElementById('r_mit').value.trim(), ext = document.getElementById('r_ext').value.trim(); const o = name ? D.members.find(x => norm(fullName(x)) === norm(name)) : null; if (!o && !ext) { toast('Person angeben'); return; } Store.set('relation:' + uid(), { a: m.id, b: o ? o.id : null, extern: o ? null : ext, typ: document.getElementById('r_typ').value, text: document.getElementById('r_text').value.trim(), by: Store.user || 'anonym', ts: new Date().toISOString() }); renderPerson(main, id); });
  main.querySelectorAll('[data-delr]').forEach(b => b.addEventListener('click', () => { if (confirm('Beziehung löschen?')) { Store.set(b.dataset.delr, null); renderPerson(main, id); } }));
  document.getElementById('vcf').addEventListener('click', () => dl(new Blob([vcard(m)], { type: 'text/vcard;charset=utf-8' }), `${m.vorname}-${m.name}.vcf`));
  main.querySelectorAll('.ovbtn').forEach(b => b.addEventListener('click', ev => openOverride(ev, m, b.dataset.f, () => renderPerson(main, id))));
  CURRENT.onStore = () => { if (document.activeElement && document.activeElement.closest('#trk,.form')) return; renderPerson(main, id); };
}
function openOverride(ev, m, f, after) {
  document.querySelectorAll('.popover').forEach(p => p.remove());
  const pop = document.createElement('div'); pop.className = 'popover'; const cur = effStance(m, f);
  pop.innerHTML = `<div class="small muted">${esc(fullName(m))} · ${esc(DATA.bilaterale.fragen.find(x => x.id === f).label)}</div>${STANCES.map(s => `<button data-s="${s}" class="st ${s}">${STANCE_LABEL[s]}${cur.stance === s ? ' ✓' : ''}</button>`).join('')}<input class="inp" id="ovnote" placeholder="Begründung / Quelle" value="${esc(cur.note || '')}"><button data-s="__reset">Berechneten Wert verwenden</button><button data-s="__close">Schliessen</button>`;
  document.body.appendChild(pop);
  const r = ev.target.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 250)) + 'px'; pop.style.top = Math.min(r.bottom + 6, window.innerHeight - pop.offsetHeight - 10) + 'px';
  pop.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const s = b.dataset.s; if (s === '__close') { pop.remove(); return; } if (s === '__reset') Store.set(`position:${m.id}:${f}`, null); else Store.set(`position:${m.id}:${f}`, { stance: s, note: pop.querySelector('#ovnote').value }); pop.remove(); toast('Gespeichert'); after(); }));
  setTimeout(() => document.addEventListener('click', function h(e) { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', h); } }), 0);
}
function dl(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

/* ===================================================================== */
/* Kommissionen                                                            */
/* ===================================================================== */
const ROLE = { 'APK-N': 'Federführend: BB 1 (Stabilisierung), BB 5, Kredite BB 6–9 (inkl. Erasmus+), Entwürfe 10/11; Vorprüfung pa. Iv. 26.425 (Ständemehr)', 'UREK-N': 'Federführend: BB 2 Stromabkommen', 'WBK-N': 'Federführend: BB 3 Lebensmittelsicherheit (+ E 12); Mitbericht+ zu BB 1 (EU-Programme, EUSPA, Berufsqualifikationen) und BB 9 Erasmus+', 'SGK-N': 'Federführend: BB 4 Gesundheitsabkommen (+ E 13)', 'SPK-N': 'Mitbericht+ zu BB 1: Personenfreizügigkeit, Referendumsfrage/Ständemehr, Zuwanderung (AIG), Mitwirkung Kantone/Parlament; Kommissionsinitiative 26.427', 'WAK-N': 'Mitbericht+ zu BB 1: MRA, Landwirtschaft, staatliche Beihilfen, Lohnschutz (Entsendegesetz)', 'KVF-N': 'Mitbericht+ zu BB 1: Land- und Luftverkehr', 'FK-N': 'Mitbericht Finanzen: Kredite BB 6–9 inkl. Erasmus+ (14:8:3 gutgeheissen, 16.10.2026)' };
function renderKommissionen(main) {
  const D = DATA; const rel = D.kommissionen.filter(k => k.bilaterale), rest = D.kommissionen.filter(k => !k.bilaterale);
  const card = k => { const ms = k.mitglieder.map(x => member(x.id)).filter(Boolean); const pres = k.mitglieder.filter(x => /Präsident/.test(x.funktion)).map(x => { const m = member(x.id); return m ? `${x.funktion}: ${fullName(m)} (${m.partei})` : ''; }).filter(Boolean);
    const fr = {}; for (const m of ms) fr[m.fraktion] = (fr[m.fraktion] || 0) + 1;
    return `<a class="card" href="#/kommission/${k.nr}" style="display:block"><div class="pname">${esc(k.kurz)} <span class="muted" style="font-weight:400;font-family:var(--mono)">· ${esc(k.name)}</span></div><div class="small muted">${ms.length} Mitglieder${pres.length ? ' · ' + esc(pres.join(' · ')) : ''}</div><div class="chips" style="margin:6px 0">${Object.entries(fr).sort((a, b) => b[1] - a[1]).map(([f, n]) => `<span class="chip fr" style="background:${frColor(f)}">${esc(f)} ${n}</span>`).join('')}</div>${k.bilaterale ? statusBar(ms) : ''}${ROLE[k.kurz] ? `<div class="small" style="margin-top:6px">${esc(ROLE[k.kurz])}</div>` : ''}</a>`; };
  main.innerHTML = `<h1>Kommissionen des Nationalrats</h1><h2>Mit Bilateralen III befasst</h2><div class="grid">${rel.map(card).join('')}</div><h2>Weitere Kommissionen, Delegationen und Organe</h2><div class="grid">${rest.map(card).join('')}</div>`;
  CURRENT.onStore = () => renderKommissionen(main);
}
function renderKommission(main, nr) {
  const D = DATA, k = D.kommissionen.find(x => x.nr === +nr);
  if (!k) { main.innerHTML = '<p>Kommission nicht gefunden.</p>'; return; }
  const ms = k.mitglieder.map(x => ({ ...member(x.id), funktion: x.funktion })).filter(m => m.id);
  const byFr = {}; for (const m of ms) (byFr[m.fraktion] ||= []).push(m);
  const fragen = D.bilaterale.fragen.filter(f => f.kommission === k.kurz || f.mitbericht.includes(k.kurz));
  const order = ['Präsident/in', 'Vizepräsident/in', 'Mitglied'];
  main.innerHTML = `<a class="back" href="#/kommissionen">← Kommissionen</a><h1>${esc(k.kurz)} <span class="muted" style="font-weight:400;font-family:var(--mono);font-size:1rem">${esc(k.name)}</span></h1>
    ${ROLE[k.kurz] ? `<p class="small"><b>Rolle bei 26.023:</b> ${esc(ROLE[k.kurz])}</p>` : ''}
    <div class="stat">${Object.entries(byFr).sort((a, b) => b[1].length - a[1].length).map(([f, l]) => `<div class="card"><div class="n" style="color:${frColor(f)}">${l.length}</div><div class="l">${esc((D.fraktionen[f] || {}).name || f)}</div></div>`).join('')}</div>
    <div class="card"><h3>Kontaktstand (${ms.length} Mitglieder)</h3>${statusBar(ms)}</div>
    ${fragen.length ? `<div class="card" style="margin-top:12px"><h3>Voraussichtliche Mehrheiten in der ${esc(k.kurz)}</h3>${fragen.map(f => { const c = aggregate(ms, f.id); return `<div style="margin:8px 0"><b>${esc(f.label)}</b> <span class="small muted">(${f.kommission === k.kurz ? 'federführend' : 'Mitbericht'})</span>${barHtml(c)}${sumLine(c)}</div>`; }).join('')}${legendHtml()}</div>` : ''}
    <div class="tablewrap" style="margin-top:12px"><table class="t"><thead><tr><th>Mitglied</th><th>Fr.</th><th>Kt.</th><th>Funktion</th><th>Status</th><th>Wer</th>${fragen.map(f => `<th>${esc(f.label)}</th>`).join('')}</tr></thead>
      <tbody>${ms.sort((a, b) => order.indexOf(a.funktion) - order.indexOf(b.funktion) || a.fraktion.localeCompare(b.fraktion) || a.name.localeCompare(b.name)).map(m => `<tr><td><a href="#/person/${m.id}">${esc(fullName(m))}</a> ${prioChip(m)}</td><td>${frChip(m)}</td><td>${esc(m.kanton)}</td><td>${esc(m.funktion)}</td><td>${statusChip(m.id)}</td><td class="small">${esc(tracking(m.id).owner || '')}</td>${fragen.map(f => { const p = effStance(m, f.id); return `<td><span class="chip st ${p.stance} ${p.override ? 'override' : ''}">${STANCE_LABEL[p.stance]}</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  CURRENT.onStore = () => renderKommission(main, nr);
}

/* ===================================================================== */
/* Netzwerk                                                                */
/* ===================================================================== */
const NET_STATE = loadJ('turbo.net', { ko: '', fr: '', min: 4, mode: 'status', onlyPrio: false });
function renderNetzwerk(main) {
  const D = DATA, S = NET_STATE;
  const qs = new URLSearchParams((location.hash.split('?')[1] || '')); let sel = qs.get('sel') ? +qs.get('sel') : null;
  const komm = D.kommissionen.filter(k => k.bilaterale || k.typ === 'Ständig').sort((a, b) => a.kurz.localeCompare(b.kurz));
  main.innerHTML = `<h1>Netzwerk</h1>
    <div class="toolbar">
      <select id="n_ko"><option value="">Ganzer Nationalrat</option>${komm.map(k => `<option value="${k.nr}" ${S.ko == k.nr ? 'selected' : ''}>${esc(k.kurz)}</option>`).join('')}</select>
      <select id="n_fr"><option value="">Alle Fraktionen</option>${Object.entries(D.fraktionen).map(([k, v]) => `<option value="${k}" ${S.fr === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
      <select id="n_mode"><option value="status" ${S.mode === 'status' ? 'selected' : ''}>Farbe: Kontaktstatus</option><option value="fraktion" ${S.mode === 'fraktion' ? 'selected' : ''}>Farbe: Fraktion</option><option value="staendemehr" ${S.mode === 'staendemehr' ? 'selected' : ''}>Farbe: Position Ständemehr</option><option value="erasmus" ${S.mode === 'erasmus' ? 'selected' : ''}>Farbe: Position Erasmus+</option></select>
      <label class="small muted">Mindeststärke <input type="range" id="n_min" min="1" max="12" value="${S.min}"> <span id="n_minv">${S.min}</span></label>
      <label class="small muted"><input type="checkbox" id="n_prio" ${S.onlyPrio ? 'checked' : ''}> nur P2/P3 und «dabei»</label>
      <button class="btn sm" id="n_fit">Einpassen</button>
    </div>
    <div class="gpanel"><div><canvas id="graph"></canvas><div class="legend" id="n_leg" style="margin-top:6px"></div></div><div class="card" id="n_side"><p class="muted small">Person anklicken: Verbindungen und Brücken. Ziehen zum Verschieben, Rad/Pinch zum Zoomen.</p><div id="n_bridges"></div></div></div>`;
  const canvas = document.getElementById('graph');
  const g = TurboGraph(canvas, { onSelect: id => { sel = id; side(); }, labelColor: '#000', edgeColor: 'rgba(0,0,0,.14)', hlColor: 'rgba(0,0,0,.85)', ringP3: '#000', ringWon: '#0a7a2f', outline: '#000' });
  const colorOf = m => { if (S.mode === 'fraktion') return frColor(m.fraktion); if (S.mode === 'status') return statusOf(m.id).color; const st = effStance(m, S.mode).stance; return { ja: '#0a7a2f', eher_ja: '#8fbf2a', offen: '#bbb', eher_nein: '#f0a040', nein: '#b00020' }[st]; };
  const build = () => {
    let ms = D.members.filter(m => (!S.ko || m.kommissionen.some(k => k.nr == S.ko)) && (!S.fr || m.fraktion === S.fr) && (!S.onlyPrio || prioOf(m) >= 2 || isWon(m.id)));
    const ids = new Set(ms.map(m => m.id));
    const manual = relations().filter(r => r.b).map(r => ({ a: r.a, b: r.b, w: 6, gem: [{ typ: 'manuell', label: r.typ }] }));
    const edges = [...D.edges.filter(e => e.w >= S.min), ...manual].filter(e => ids.has(e.a) && ids.has(e.b));
    g.setData(ms.map(m => ({ id: m.id, label: m.name, color: colorOf(m), size: 4 + prioOf(m) * 1.5 + (isWon(m.id) ? 2 : 0), ring: isWon(m.id) ? '#0a7a2f' : (prioOf(m) === 3 ? '#000' : null), always: prioOf(m) === 3 })), edges);
    setTimeout(() => g.fit(), 600);
    document.getElementById('n_leg').innerHTML = (S.mode === 'status' ? statuses().map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('') : S.mode === 'fraktion' ? Object.entries(D.fraktionen).map(([k, v]) => `<span><i style="background:${v.farbe}"></i>${esc(k)}</span>`).join('') : STANCES.map(s => `<span><i style="background:${{ ja: '#0a7a2f', eher_ja: '#8fbf2a', offen: '#bbb', eher_nein: '#f0a040', nein: '#b00020' }[s]}"></i>${STANCE_LABEL[s]}</span>`).join('')) + '<span><i style="border:2px solid #0a7a2f;background:transparent"></i>Ring grün = dabei</span><span><i style="border:2px solid #000;background:transparent"></i>Ring schwarz = P3</span>';
    if (sel) g.select(sel); side();
  };
  const side = () => {
    const box = document.getElementById('n_side');
    if (!sel || !member(sel)) { const open = D.members.filter(m => !isWon(m.id) && prioOf(m) >= 2).map(m => ({ m, b: connectionsOf(m).filter(c => isWon(c.other.id)) })).filter(x => x.b.length).sort((a, b) => b.b[0].w - a.b[0].w).slice(0, 25);
      box.innerHTML = `<h3>Brücken zu prioritären Offenen</h3><p class="small muted">Wen können wir über Personen erreichen, die schon dabei sind?</p>${open.length ? `<ul class="list small">${open.map(x => `<li><a href="#/person/${x.m.id}">${esc(fullName(x.m))}</a> ${frChip(x.m)} ${prioChip(x.m)}<br>über ${x.b.slice(0, 3).map(c => `<a href="#/person/${c.other.id}">${esc(fullName(c.other))}</a> <span class="muted">(${esc(c.gem.map(gg => gg.label).slice(0, 2).join(', '))})</span>`).join(', ')}</li>`).join('')}</ul>` : '<p class="small muted">Noch niemand mit Status «dabei» – sobald erste Personen gewonnen sind, erscheinen hier die Brücken.</p>'}`; return; }
    const m = member(sel), conns = connectionsOf(m), t = tracking(m.id);
    box.innerHTML = `<div class="pname"><a href="#/person/${m.id}">${esc(fullName(m))}</a> ${prioChip(m)}</div><div class="small">${frChip(m)} ${esc(m.kanton)} · ${statusChip(m.id)} ${t.owner ? `<span class="pill">${esc(t.owner)}</span>` : ''}</div>
      <div class="small" style="margin:6px 0">Ständemehr: <span class="chip st ${effStance(m, 'staendemehr').stance}">${STANCE_LABEL[effStance(m, 'staendemehr').stance]}</span> · Erasmus+: <span class="chip st ${effStance(m, 'erasmus').stance}">${STANCE_LABEL[effStance(m, 'erasmus').stance]}</span></div>
      <h3>Verbindungen (${conns.length})</h3><ul class="list small" style="max-height:50vh;overflow:auto">${conns.slice(0, 30).map(c => `<li><span class="dot" style="background:${statusOf(c.other.id).color}"></span><a href="#" data-sel="${c.other.id}">${esc(fullName(c.other))}</a> ${frChip(c.other)} <span class="num muted">${c.w}</span><br><span class="muted">${esc(c.gem.map(gg => gg.label).slice(0, 4).join(', '))}</span></li>`).join('')}</ul>`;
    box.querySelectorAll('[data-sel]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); sel = +a.dataset.sel; g.select(sel); side(); }));
  };
  document.getElementById('n_ko').addEventListener('input', e => { S.ko = e.target.value; saveJ('turbo.net', S); build(); });
  document.getElementById('n_fr').addEventListener('input', e => { S.fr = e.target.value; saveJ('turbo.net', S); build(); });
  document.getElementById('n_mode').addEventListener('input', e => { S.mode = e.target.value; saveJ('turbo.net', S); build(); });
  document.getElementById('n_min').addEventListener('input', e => { S.min = +e.target.value; document.getElementById('n_minv').textContent = S.min; saveJ('turbo.net', S); build(); });
  document.getElementById('n_prio').addEventListener('input', e => { S.onlyPrio = e.target.checked; saveJ('turbo.net', S); build(); });
  document.getElementById('n_fit').addEventListener('click', () => g.fit());
  build();
  CURRENT.cleanup = () => g.stop(); CURRENT.onStore = build;
}

/* ===================================================================== */
/* Bilaterale (Dossier-Übersicht)                                          */
/* ===================================================================== */
function renderBilaterale(main) {
  const D = DATA, B = D.bilaterale, G = B.geschaeft;
  main.innerHTML = `<h1>${esc(G.nummer)} – ${esc(G.titel)}</h1>
    <p class="small muted">${esc(G.typ)} · Erstrat ${esc(G.erstrat)} · Botschaft vom ${fmtDate(G.botschaft)} · Federführung NR: ${esc(G.federfuehrung_nr)}</p>
    <div class="card"><b>Stand:</b> ${esc(G.status)}<br><b>Behandlungsfrist NR:</b> ${esc(G.behandlungsfrist_nr)}<div class="chips" style="margin-top:8px">${Object.entries(G.links).map(([k, u]) => `<a class="chip k" href="${esc(u)}" target="_blank" rel="noopener">${esc(k.replace(/_/g, ' '))} ↗</a>`).join('')}</div></div>
    <div class="chips" style="margin:12px 0"><a class="btn primary" href="#/dossier/staendemehr">★ Dossier Ständemehr</a><a class="btn primary" href="#/dossier/erasmus">★ Dossier Erasmus+</a></div>
    <h2>Voraussichtliche Mehrheiten im Nationalrat (200)</h2>
    <div class="card">${B.fragen.map(f => { const c = aggregate(D.members, f.id); return `<div style="margin:10px 0"><b>${esc(f.label)}</b> <span class="small muted">· ${esc(f.frage)} · ${esc(f.kommission)}${f.mitbericht.length ? ' + ' + esc(f.mitbericht.join('/')) : ''}</span>${barHtml(c)}${sumLine(c)}</div>`; }).join('')}${legendHtml()}</div>
    <h2>Entwürfe (Teilgeschäfte)</h2>
    ${B.entwuerfe.map(e => `<details><summary>Entwurf ${e.nr} · ${esc(e.kurz)} <span class="muted small">· ${esc(e.kategorie)} · ${esc(e.kommission_nr)}${e.mitbericht_nr.length ? ' + Mitbericht ' + esc(e.mitbericht_nr.join(', ')) : ''}</span></summary><p><b>${esc(e.titel)}</b>${e.bbl ? ` <span class="muted small">(${esc(e.bbl)})</span>` : ''}</p><dl class="kv"><dt>Inhalt</dt><dd>${esc(e.inhalt)}</dd>${e.mitbericht_detail ? `<dt>Mitberichte</dt><dd>${esc(e.mitbericht_detail)}</dd>` : ''}<dt>Stand Nationalrat</dt><dd>${esc(e.status_nr)}</dd><dt>Ständerat</dt><dd>${e.sr.datum ? esc(e.sr.datum) : '–'}${e.sr.eintreten ? ' · Eintreten ' + esc(e.sr.eintreten) : ''}${e.sr.gesamtabstimmung ? ' · Gesamtabstimmung ' + esc(e.sr.gesamtabstimmung) : ''}${e.sr.aenderungen.length ? '<ul class="small">' + e.sr.aenderungen.map(a => `<li>${esc(a)}</li>`).join('') + '</ul>' : ''}</dd><dt>Referendum</dt><dd>${esc(e.referendum)}</dd></dl></details>`).join('')}
    <h2>Fraktions- und Parteilinien</h2>
    <div class="tablewrap"><table class="t"><thead><tr><th>Fraktion/Partei</th>${B.fragen.map(f => `<th>${esc(f.label)}</th>`).join('')}<th>Quelle</th></tr></thead><tbody>${[...Object.entries(B.fraktionslinien), ...Object.entries(B.parteilinien)].filter(([k]) => !k.startsWith('_')).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td>${B.fragen.map(f => `<td><span class="chip st ${v[f.id] || 'offen'}">${STANCE_LABEL[v[f.id] || 'offen']}</span></td>`).join('')}<td class="small">${esc(v.quelle || '')}</td></tr>`).join('')}</tbody></table></div>
    <h2>Chronologie</h2>
    <ul class="timeline">${B.timeline.slice().sort((a, b) => b.datum.localeCompare(a.datum)).map(t => `<li><div class="d">${fmtDate(t.datum)} · ${esc(t.wer)}</div><div class="small">${esc(t.text)} ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">↗</a>` : ''}</div></li>`).join('')}</ul>
    <h2>Namentliche Abstimmungen (Indikatoren)</h2>
    <div class="tablewrap"><table class="t"><thead><tr><th>Datum</th><th>Geschäft</th><th>Deutung</th><th>Ergebnis</th></tr></thead><tbody>${D.votes.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(v => `<tr><td>${fmtDate(v.date)}</td><td><a href="https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${esc(String(v.business || '').replace('.', ''))}" target="_blank" rel="noopener">${esc(v.label)}</a><div class="small muted">${esc(v.title || '')}${v.subject ? ' · ' + esc(v.subject) : ''}</div></td><td class="small">Ja = ${v.deutung === 'pro' ? 'EU-paketnah' : 'EU-skeptisch'} · «${esc((B.fragen.find(f => f.id === v.thema) || {}).label || v.thema)}»</td><td class="small">${Object.entries(v.ergebnis).filter(([k]) => ['Ja', 'Nein', 'Enthaltung'].includes(k)).map(([k, n]) => `${k} ${n}`).join(' · ')}</td></tr>`).join('')}</tbody></table></div>
    <h2>Verwandte Geschäfte</h2><ul class="list small">${B.verwandte.map(v => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.nummer)}</a> ${esc(v.titel)} <span class="muted">· ${esc(v.status)}</span></li>`).join('')}</ul>
    <h2>Quellen</h2><ul class="list small">${B.quellen.map(q => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)} ↗</a></li>`).join('')}</ul>`;
}

/* ===================================================================== */
/* Dossiers Ständemehr / Erasmus+                                          */
/* ===================================================================== */
const DOSSIERS = {
  staendemehr: { titel: 'Ständemehr / obligatorisches Referendum', frage: 'staendemehr', seite: 'nein', ziel: 'Kein Ständemehr: fakultatives Referendum gemäss Bundesrat (Variante Ständerat «sui generis» und BB 11 verhindern).',
    lage: ['Ständerat (30.09.2026): fakultatives Referendum abgelehnt 23:17:3; obligatorisches Referendum «sui generis» mit Ständemehr beschlossen; zusätzlich Verfassungsvorlage BB 11 (SPK-S, pa. Iv. 26.425) angenommen.', 'SPK-N (22.05.2026): unterstützt Verfassungsgrundlage 15:10; bittet SPK-S 16:9, Referendum sui generis zu prüfen; eigene Kommissionsinitiative 26.427 (15:10).', 'APK-N (02.06.2026): lehnt pa. Iv. 26.425 mit 15:9 ab; Präsidentin Sibel Arslan. Kompetenzstreit APK-N/SPK-N durch Büro NR zugunsten APK-N entschieden (20.05.2026).', 'Im Nationalrat stehen drei Varianten zur Wahl: fakultatives Referendum (Bundesrat), sui generis (Ständerat), Verfassungsänderung (BB 11). APK-N behandelt 26.425 am 21.10. und 18.11.2026; Plenum voraussichtlich Wintersession 2026.', 'Hebel: Mitte- und FDP-Mitglieder, die im Ständerat für das Ständemehr stimmten, haben Pendants in der grossen Kammer; GLP, SP, Grüne, EVP dagegen; SVP, EDU, Lega dafür. Entscheidend sind Mitte und FDP (zusammen 58 Sitze).', 'Kommissionsbild (abgeleitet aus Sitzverteilung): In der SPK-N stimmten sechs der acht Mitte/FDP/GLP/EVP-Mitglieder für den Verfassungsweg (15:10), in der APK-N bis auf eine Stimme alle gegen das obligatorische Referendum (15:9). Namentlich gegen das Ständemehr: Schneider-Schneiter, Michel, de Quattro, Gredig; dafür: Pfister, Bregy, Vincenz-Stauffacher (persönlich). Die Mitte legt sich offiziell erst nach den Beratungen fest.', 'SPK-S (15.10.2026): Zweiter Teil der pa. Iv. 26.425, Kodifizierung der Schubert-Praxis (Bundesgesetz geht bei bewusster Abweichung einem Binnenmarktabkommen vor), Eintreten 7:3:1, Vernehmlassung bis 4.12.2026. Das Thema begleitet die Referendumsfrage im Nationalrat (SPK-N 12./13.11., APK-N 16.–18.11.).'],
    kommissionen: ['APK-N', 'SPK-N'], geschaefte: ['26.425', '26.427', '26.314', '26.062', '25.4657', '26.2024'] },
  erasmus: { titel: 'Erasmus+ (Verpflichtungskredit 2027, BB 9)', frage: 'erasmus', seite: 'ja', ziel: 'Zustimmung zum Verpflichtungskredit von 193 Mio. Fr. für die Vollassoziierung an Erasmus+ 2027.',
    lage: ['Ständerat (01.10.2026): Kredit mit 23:18 bei 3 Enthaltungen genehmigt; WBK-S beantragte Ja nur mit Stichentscheid, FK-S hatte wegen Bundesfinanzen Nein beantragt. Bundespräsident Parmelin warnte, ein Nein würde von der EU negativ aufgenommen.', 'Nationalrat: APK-N federführend (BB 9), Mitberichte WBK-N und FK-N. FK-N (16.10.2026): Erasmus+ mit 18:7 gutgeheissen – die Nein-Stimmen entsprechen den SVP-Sitzen, alle FDP-, Mitte- und GLP-Mitglieder stimmten zu; Kohäsionskredite 14:8:3 (drei Enthaltungen aus dem bürgerlichen Lager). Nächste FK-N-Sitzung 9.–11.11.2026 mit 13 Prüfaufträgen.', 'Hebel: Bildungs- und Forschungsnähe (WBK-N), Hochschulkantone, Wirtschaftsverbände (Fachkräfte). Gegenargument der Gegner ist der Bundeshaushalt, nicht Erasmus selbst – Finanzpolitiker der FDP/Mitte gezielt angehen.', 'Kein Referendum: Der Kredit ist ein einfacher Bundesbeschluss und entscheidet sich allein im Parlament.'],
    kommissionen: ['APK-N', 'WBK-N', 'FK-N'], geschaefte: ['24.4345', '25.3858', '24.7303'] },
};
function majorityCalc(members, f, seite, target) {
  const pro = seite === 'ja' ? ['ja', 'eher_ja'] : ['nein', 'eher_nein'], con = seite === 'ja' ? ['nein', 'eher_nein'] : ['ja', 'eher_ja'];
  const soft = seite === 'ja' ? 'eher_nein' : 'eher_ja';
  const side = m => { const s = effStance(m, f).stance; return pro.includes(s) ? 'pro' : con.includes(s) ? 'con' : 'offen'; };
  const P = members.filter(m => side(m) === 'pro'), C = members.filter(m => side(m) === 'con'), O = members.filter(m => side(m) === 'offen');
  const fehlen = Math.max(0, target - P.length);
  const rank = m => { const s = effStance(m, f).stance; return s === 'offen' ? 0 : s === soft ? 1 : 2; };
  const cache = {};
  const conns = m => cache[m.id] || (cache[m.id] = connectionsOf(m));
  const bridges = m => conns(m).filter(c => isWon(c.other.id)).length;
  const gleich = m => conns(m).filter(c => side(c.other) === 'pro').length;
  const kandidaten = [...O, ...C].sort((a, b) => rank(a) - rank(b) || prioOf(b) - prioOf(a) || gleich(b) - gleich(a)).slice(0, Math.max(6, fehlen + 6));
  return { P, C, O, fehlen, kandidaten, bridges, gleich, side };
}
function majorityHtml(titel, members, f, seite, target, link) {
  const r = majorityCalc(members, f, seite, target);
  const label = seite === 'ja' ? 'Ja' : 'Nein';
  return `<div style="margin:10px 0;padding-top:8px;border-top:1px solid #ddd"><b>${esc(titel)}</b> <span class="small muted">(${members.length} Mitglieder, Ziel ${target} × ${label})</span>${link ? ` <a class="small" href="${link}">→</a>` : ''}
    <div class="small" style="margin:4px 0">unsere Seite <b>${r.P.length}</b> · offen <b>${r.O.length}</b> · Gegenseite <b>${r.C.length}</b> · ${r.fehlen ? `<span class="due">fehlen ${r.fehlen}</span>` : '<span style="color:var(--ja);font-weight:700">Ziel erreicht (rechnerisch)</span>'}</div>
    ${r.kandidaten.length ? `<div class="tablewrap" style="max-height:40vh"><table class="t"><thead><tr><th>Kandidat/in</th><th>Fr.</th><th>Einschätzung</th><th>Status</th><th>Wer</th><th title="Verbindungen zu Personen mit Status «dabei»">Brücken</th><th title="Verbindungen zu Personen, die bereits auf unserer Seite eingeschätzt sind">Gleichgesinnte</th></tr></thead><tbody>${r.kandidaten.map(m => { const p = effStance(m, f), t = tracking(m.id); return `<tr><td><a href="#/person/${m.id}">${esc(fullName(m))}</a> ${prioChip(m)}</td><td>${frChip(m)}</td><td><span class="chip st ${p.stance} ${p.override ? 'override' : ''}">${STANCE_LABEL[p.stance]}</span></td><td>${statusChip(m.id)}</td><td class="small">${esc(t.owner || '')}</td><td class="num">${r.bridges(m)}</td><td class="num">${r.gleich(m)}</td></tr>`; }).join('')}</tbody></table></div>` : ''}</div>`;
}
function renderDossier(main, key) {
  const D = DATA, d = DOSSIERS[key] || DOSSIERS.staendemehr; key = DOSSIERS[key] ? key : 'staendemehr';
  const f = D.bilaterale.fragen.find(x => x.id === d.frage);
  const notes = Store.get('dossier:' + key, {});
  const komm = kurz => (D.kommissionen.find(k => k.kurz === kurz) || { mitglieder: [] }).mitglieder.map(x => ({ ...member(x.id), funktion: x.funktion })).filter(m => m.id);
  const swing = D.members.filter(m => ['offen', 'eher_ja', 'eher_nein'].includes(effStance(m, f.id).stance)).sort((a, b) => prioOf(b) - prioOf(a) || a.name.localeCompare(b.name));
  const rel = D.bilaterale.verwandte.filter(v => d.geschaefte.includes(v.nummer));
  const tl = D.bilaterale.timeline.filter(t => key === 'staendemehr' ? /Ständemehr|Referendum|26\.425|26\.427|Verfassung/i.test(t.text) : /Erasmus|Kredit/i.test(t.text)).sort((a, b) => b.datum.localeCompare(a.datum));
  main.innerHTML = `<div class="tabs2"><button class="${key === 'staendemehr' ? 'active' : ''}" onclick="location.hash='#/dossier/staendemehr'">Ständemehr</button><button class="${key === 'erasmus' ? 'active' : ''}" onclick="location.hash='#/dossier/erasmus'">Erasmus+</button></div>
    <h1>★ ${esc(d.titel)}</h1>
    <div class="card"><b>Ziel:</b> ${esc(d.ziel)}<ul class="small" style="margin:8px 0 0">${d.lage.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="card section"><h3>Nationalrat gesamt</h3>${barHtml(aggregate(D.members, f.id))}${sumLine(aggregate(D.members, f.id))}<div style="margin-top:8px"><b>Nach Fraktion</b>${Object.keys(D.fraktionen).map(fr => { const ms = D.members.filter(m => m.fraktion === fr); const c = aggregate(ms, f.id); return `<div class="small" style="margin:4px 0"><span class="chip fr" style="background:${frColor(fr)}">${esc(fr)}</span> ${ms.length} · ${c.ja + c.eher_ja} Ja · ${c.offen} offen · ${c.nein + c.eher_nein} Nein${barHtml(c)}</div>`; }).join('')}</div></div>
    ${d.kommissionen.map(k => { const ms = komm(k); const c = aggregate(ms, f.id); return `<div class="card section"><h3>${esc(k)} (${ms.length}) <a class="small" href="#/kommission/${(D.kommissionen.find(x => x.kurz === k) || {}).nr}">→ Kommission</a></h3>${barHtml(c)}${sumLine(c)}<div style="margin-top:6px">${statusBar(ms)}</div>
      <div class="tablewrap" style="margin-top:8px;max-height:60vh"><table class="t"><thead><tr><th>Mitglied</th><th>Fr.</th><th>Position</th><th>Status</th><th>Wer</th><th>Nächster Schritt</th></tr></thead><tbody>${ms.sort((a, b) => STANCES.indexOf(effStance(a, f.id).stance) - STANCES.indexOf(effStance(b, f.id).stance) || a.name.localeCompare(b.name)).map(m => { const p = effStance(m, f.id), t = tracking(m.id); return `<tr><td><a href="#/person/${m.id}">${esc(fullName(m))}</a>${m.funktion !== 'Mitglied' ? ' <span class="pill">' + esc(m.funktion) + '</span>' : ''} ${prioChip(m)}</td><td>${frChip(m)}</td><td><button class="chip st ${p.stance} ${p.override ? 'override' : ''} ovbtn" data-m="${m.id}" data-f="${f.id}" style="border:0">${STANCE_LABEL[p.stance]}</button></td><td>${statusChip(m.id)}</td><td class="small">${esc(t.owner || '')}</td><td class="small">${esc(t.naechsterSchritt || '')} <span class="${t.naechsterTermin && t.naechsterTermin < today() ? 'due' : 'muted'}">${fmtDate(t.naechsterTermin)}</span></td></tr>`; }).join('')}</tbody></table></div></div>`; }).join('')}
    <div class="card section"><h3>Mehrheitsrechner</h3><p class="small muted">Unsere Seite = «${d.seite === 'ja' ? 'Ja' : 'Nein'}» zu dieser Frage. Ziel im Plenum 101 von 200 (absolutes Mehr, sicherer Wert), in den Kommissionen 13 von 25. Kandidatinnen und Kandidaten: zuerst Offene, dann «eher Gegenseite», sortiert nach Priorität und gleichgesinnten Verbindungen. «Brücken» zählt Verbindungen zu Personen mit Status «dabei».</p>
      ${majorityHtml('Nationalrat', D.members, f.id, d.seite, 101)}
      ${d.kommissionen.map(k => majorityHtml(k, komm(k), f.id, d.seite, 13, '#/kommission/' + ((D.kommissionen.find(x => x.kurz === k) || {}).nr || ''))).join('')}
    </div>
    <div class="card section"><h3>Wackelkandidatinnen und -kandidaten im Plenum (${swing.length})</h3><p class="small muted">Alle Mitglieder mit Einschätzung offen / eher Ja / eher Nein, nach Priorität.</p><div class="chips">${swing.map(m => `<a class="chip k" href="#/person/${m.id}" style="border-left:4px solid ${statusOf(m.id).color}">${esc(fullName(m))} · ${esc(m.partei)} ${esc(m.kanton)} · <span class="st ${effStance(m, f.id).stance}" style="padding:0 4px;border-radius:4px">${STANCE_SHORT[effStance(m, f.id).stance]}</span></a>`).join('')}</div></div>
    <div class="card section"><h3>Gemeinsame Notizen zum Dossier</h3><textarea class="note" id="dn" placeholder="Strategie, Argumente, Verbündete, Termine …">${esc(notes.text || '')}</textarea><div class="small muted">${notes.ts ? 'zuletzt ' + fmtTs(Store.entry('dossier:' + key).ts) + ' von ' + esc(Store.entry('dossier:' + key).by || '') : ''}</div></div>
    <div class="grid two" style="margin-top:12px"><div class="card"><h3>Chronologie</h3><ul class="timeline">${tl.map(t => `<li><div class="d">${fmtDate(t.datum)} · ${esc(t.wer)}</div><div class="small">${esc(t.text)} ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">↗</a>` : ''}</div></li>`).join('')}</ul></div>
    <div class="card"><h3>Geschäfte</h3><ul class="list small">${rel.map(v => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.nummer)}</a> ${esc(v.titel)} <span class="muted">· ${esc(v.status)}</span></li>`).join('')}${d.geschaefte.filter(n => !rel.some(v => v.nummer === n)).map(n => `<li><a href="https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=${esc(n.replace('.', ''))}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join('')}</ul></div></div>`;
  document.getElementById('dn').addEventListener('change', e => { Store.set('dossier:' + key, { text: e.target.value, ts: new Date().toISOString() }); toast('Gespeichert'); });
  main.querySelectorAll('.ovbtn').forEach(b => b.addEventListener('click', ev => openOverride(ev, member(b.dataset.m), b.dataset.f, () => renderDossier(main, key))));
  CURRENT.onStore = () => { if (document.activeElement && document.activeElement.id === 'dn') return; renderDossier(main, key); };
}

/* ===================================================================== */
/* Positionen (Matrix)                                                     */
/* ===================================================================== */
const POS_STATE = loadJ('turbo.pos', { q: '', fr: '', ko: '' });
function renderPositionen(main) {
  const D = DATA, S = POS_STATE, F = D.bilaterale.fragen; const komm = D.kommissionen.filter(k => k.bilaterale);
  main.innerHTML = `<h1>Positionsmatrix</h1><p class="small muted">Klick auf eine Zelle, um die Einschätzung zu setzen (für alle sichtbar). Umrandet = manuell.</p>
    <div class="toolbar"><input type="search" id="pq" placeholder="Name filtern …" value="${esc(S.q)}"><select id="pfr"><option value="">Alle Fraktionen</option>${Object.entries(D.fraktionen).map(([k, v]) => `<option value="${k}" ${S.fr === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select><select id="pko"><option value="">Ganzer Nationalrat</option>${komm.map(k => `<option value="${k.nr}" ${S.ko == k.nr ? 'selected' : ''}>${esc(k.kurz)}</option>`).join('')}</select><button class="btn sm" id="exp">Export CSV</button><span class="counter" id="pcount"></span></div>
    ${legendHtml()}<div class="tablewrap" style="margin-top:10px"><table class="t matrix" id="mx"></table></div>`;
  const draw = () => {
    const q = norm(S.q.trim());
    let list = D.members.filter(m => (!S.fr || m.fraktion === S.fr) && (!S.ko || m.kommissionen.some(k => k.nr == S.ko)) && (!q || norm(fullName(m) + ' ' + m.kanton + ' ' + m.partei).includes(q)));
    list.sort((a, b) => a.fraktion.localeCompare(b.fraktion) || a.name.localeCompare(b.name, 'de'));
    document.getElementById('pcount').textContent = `${list.length} Mitglieder`;
    const aggs = F.map(f => aggregate(list, f.id));
    document.getElementById('mx').innerHTML = `<thead><tr><th class="name">Mitglied</th><th>Fr.</th><th>Kt.</th><th>Status</th>${F.map(f => `<th class="rot" title="${esc(f.frage)}">${['staendemehr', 'erasmus'].includes(f.id) ? '★ ' : ''}${esc(f.label)}</th>`).join('')}</tr><tr><th class="name small">Σ Ja · offen · Nein</th><th></th><th></th><th></th>${aggs.map(c => `<th class="small" style="text-align:center;white-space:nowrap"><span style="color:var(--ja)">${c.ja + c.eher_ja}</span> · ${c.offen} · <span style="color:var(--nein)">${c.nein + c.eher_nein}</span></th>`).join('')}</tr></thead>
      <tbody>${list.map(m => `<tr><td class="name"><a href="#/person/${m.id}">${esc(m.name)} ${esc(m.vorname)}</a></td><td><span class="chip fr" style="background:${frColor(m.fraktion)}">${esc(m.partei)}</span></td><td>${esc(m.kanton)}</td><td>${statusChip(m.id)}</td>${F.map(f => { const p = effStance(m, f.id); return `<td class="cell ${p.stance} ${p.override ? 'override' : ''}" data-m="${m.id}" data-f="${f.id}" title="${esc(STANCE_LABEL[p.stance])} (${esc(p.basis)})${p.note ? ' – ' + esc(p.note) : ''}">${STANCE_SHORT[p.stance]}</td>`; }).join('')}</tr>`).join('')}</tbody>`;
    document.querySelectorAll('#mx td.cell').forEach(td => td.addEventListener('click', ev => openOverride(ev, member(td.dataset.m), td.dataset.f, draw)));
    saveJ('turbo.pos', S);
  };
  document.getElementById('pq').addEventListener('input', e => { S.q = e.target.value; draw(); });
  document.getElementById('pfr').addEventListener('input', e => { S.fr = e.target.value; draw(); });
  document.getElementById('pko').addEventListener('input', e => { S.ko = e.target.value; draw(); });
  document.getElementById('exp').addEventListener('click', () => {
    const rows = [['Name', 'Vorname', 'Partei', 'Fraktion', 'Kanton', 'Kommissionen', 'E-Mail', 'Status', 'Verantwortlich', 'Nächster Schritt', 'Termin', ...F.map(f => f.label), ...F.map(f => f.label + ' (Basis)'), 'Kommentare']];
    for (const m of D.members) { const t = tracking(m.id); rows.push([m.name, m.vorname, m.partei, m.fraktion, m.kanton, m.kommissionen.filter(k => k.typ === 'Ständig').map(k => k.kurz).join(' '), (m.kontakt.find(c => c.typ === 'Email') || {}).wert || '', statusOf(m.id).label, t.owner || '', t.naechsterSchritt || '', t.naechsterTermin || '', ...F.map(f => STANCE_LABEL[effStance(m, f.id).stance]), ...F.map(f => effStance(m, f.id).basis), comments(m.id).map(c => fmtTs(c.ts) + ' ' + c.by + ': ' + c.text).join(' | ')]); }
    dl(new Blob(['﻿' + rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'turbo-positionen.csv');
  });
  draw(); CURRENT.onStore = draw;
}

/* ===================================================================== */
/* Info / Einstellungen                                                    */
/* ===================================================================== */
function renderInfo(main) {
  const D = DATA; const n = Object.keys(Store.state).length;
  main.innerHTML = `<h1>Info &amp; Einstellungen</h1>
    <div class="card"><dl class="kv"><dt>Datenstand parlament.ch</dt><dd>${esc((D.meta.quelleStand || '').replace('T', ' ').slice(0, 16))} UTC</dd><dt>Build</dt><dd>${esc((CFG.build || '').replace('T', ' ').slice(0, 16))} UTC</dd><dt>Gemeinsamer Speicher</dt><dd>${API ? `<code>${esc(API)}</code> · ${Store.online ? 'verbunden' : 'nicht erreichbar'} · Version ${Store.version} · ${n} Einträge${Store.queue.length ? ` · <b>${Store.queue.length} ausstehend</b>` : ''}` : '<b>nicht konfiguriert</b> – Änderungen bleiben lokal'}</dd><dt>Dein Name</dt><dd><input class="inp" id="uname" value="${esc(Store.user)}" placeholder="Kürzel"></dd></dl>
      <div class="chips" style="margin-top:8px"><button class="btn sm" id="sync">Jetzt synchronisieren</button><button class="btn sm" id="expall">Export (alles, JSON)</button><label class="btn sm" style="display:inline-block">Import JSON<input type="file" id="impall" accept="application/json" class="hidden"></label><button class="btn sm" id="log">Änderungsverlauf</button></div><div id="logbox"></div></div>
    <div class="card section"><h3>Team (für «Verantwortlich»)</h3><input class="inp" id="team" style="width:100%" value="${esc(team().join(', '))}" placeholder="Namen, kommagetrennt"></div>
    <div class="card section"><h3>Status-Stufen</h3><p class="small muted">Eine Zeile pro Status: <code>id | Bezeichnung | Farbe</code>. «dabei» zählt als gewonnen.</p><textarea class="note" id="stat">${esc(statuses().map(s => `${s.id} | ${s.label} | ${s.color}`).join('\n'))}</textarea><button class="btn sm" id="statsave">Speichern</button></div>
    <div class="card section"><h3>Methodik</h3><p class="small">Stammdaten, Kontakte, Adressen, Kommissionen, Interessenbindungen und persönliche Mitarbeitende stammen aus der OData-Schnittstelle des Parlaments (identisch mit parlament.ch). Verbindungen werden aus gemeinsamen Kommissionen, Organisationen (Interessenbindungen), Arbeitgebern, Parlamentarischen Gruppen und Bürgerorten abgeleitet; manuelle Beziehungen kommen dazu. Positionen: manuelle Einschätzung vor belegtem Signal vor Fraktionslinie (bei abweichendem Abstimmungsverhalten um eine Stufe angepasst). Priorität: Schlüsselkommissionen, Fraktion mit offenem Stimmverhalten, offene Haltung zu Ständemehr/Erasmus+, Führungsfunktionen.</p><p class="small warn">Die Daten sind verschlüsselt abgelegt und werden erst nach Codeeingabe im Browser entschlüsselt. Es gibt keine Benutzerkonten; alle Änderungen werden mit Name und Zeit im gemeinsamen Speicher festgehalten.</p></div>`;
  document.getElementById('uname').addEventListener('change', e => { Store.user = e.target.value.trim(); saveJ('turbo.user', Store.user); paintWho(); });
  document.getElementById('sync').addEventListener('click', async () => { await Store.pull(true); await Store.flush(); toast(Store.online ? 'Synchronisiert' : 'Nicht erreichbar'); renderInfo(main); });
  document.getElementById('expall').addEventListener('click', () => dl(new Blob([JSON.stringify({ version: Store.version, state: Store.state, exportiert: new Date().toISOString() }, null, 1)], { type: 'application/json' }), 'turbo-export.json'));
  document.getElementById('impall').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); const st = j.state || j.overrides && Object.fromEntries(Object.entries(j.overrides).flatMap(([mid, fs]) => Object.entries(fs).map(([fq, o]) => [`position:${mid}:${fq}`, { v: { stance: o.stance, note: o.note || '' } }]))) || {}; const pairs = Object.entries(st).map(([k, e]) => [k, e && typeof e === 'object' && 'v' in e ? e.v : e]); if (!pairs.length) throw new Error('leer'); if (confirm(`${pairs.length} Einträge importieren (überschreibt gleiche Schlüssel)?`)) { Store.setMany(pairs); toast('Importiert'); renderInfo(main); } } catch (err) { toast('Import fehlgeschlagen'); } });
  document.getElementById('log').addEventListener('click', async () => { const box = document.getElementById('logbox'); if (!API) { box.innerHTML = '<p class="small muted">Kein Speicherdienst.</p>'; return; } try { const r = await Store.api('/log?limit=100'); box.innerHTML = `<ul class="list small" style="max-height:40vh;overflow:auto;margin-top:8px">${r.items.map(i => { const mid = i.key.split(':')[1]; const m = member(mid); return `<li><span class="muted">${fmtTs(i.ts)}</span> · ${esc(i.by)} · ${m ? `<a href="#/person/${m.id}">${esc(fullName(m))}</a>` : ''} <code>${esc(i.key)}</code> ${i.v === null ? '<span class="muted">gelöscht</span>' : ''}</li>`; }).join('')}</ul>`; } catch (e) { box.innerHTML = '<p class="small muted">Verlauf nicht abrufbar.</p>'; } });
  document.getElementById('team').addEventListener('change', e => { Store.set('config:team', e.target.value.split(',').map(x => x.trim()).filter(Boolean)); toast('Gespeichert'); });
  document.getElementById('statsave').addEventListener('click', () => { const list = document.getElementById('stat').value.split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p[0]).map(p => ({ id: p[0], label: p[1] || p[0], color: p[2] || '#6b7a9e' })); if (!list.length) return; Store.set('config:statuses', list); toast('Gespeichert'); rerender(); });
}
