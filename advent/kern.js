// kern.js – gemeinsame Hilfen für alle Seiten (Spielerin, Admin, Druck).
//   Advent.api(aktion, daten)   Anfrage an Apps Script, liefert die Antwort oder wirft einen Fehler
//   Advent.token(art)           Token aus ?t=… lesen und merken ('spieler' oder 'admin')
//   Advent.datum('2026-12-01')  → «Di 1.12.2026»
//   Advent.theme()              lädt theme/theme.json, danach Advent.t('schluessel', {platzhalter})
(function () {
  'use strict';

  const SPEICHER = { spieler: 'advent.token', admin: 'advent.admin' };
  const tokens = {};

  function lesen(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function schreiben(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privates Fenster */ } }

  /** Token aus der Adresse übernehmen (und aus der Adresszeile entfernen) oder gespeichertes nehmen. */
  function token(art) {
    if (tokens[art]) return tokens[art];
    const url = new URL(location.href);
    const t = url.searchParams.get('t');
    if (t) {
      schreiben(SPEICHER[art], t);
      url.searchParams.delete('t');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      tokens[art] = t;
    } else {
      tokens[art] = lesen(SPEICHER[art]) || '';
    }
    return tokens[art];
  }

  /** Fehler mit Code, Text und Daten aus der Antwort des Servers. */
  class ApiFehler extends Error {
    constructor(code, text, daten) { super(text); this.code = code; this.daten = daten || {}; }
  }

  /**
   * Schickt eine Anfrage an Apps Script. Content-Type text/plain, damit es keinen CORS-Preflight gibt.
   * opt.art: 'spieler' (Standard) oder 'admin'. opt.zeit: Zeitlimit in Sekunden.
   */
  async function api(aktion, daten, opt) {
    opt = opt || {};
    const url = window.ADVENT_API;
    if (!url || /HIER_DIE/.test(url)) throw new ApiFehler('keine_api', t('fehler.keine_api'));
    const body = Object.assign({ aktion, token: token(opt.art || 'spieler') }, daten || {});
    const ctrl = new AbortController();
    const uhr = setTimeout(() => ctrl.abort(), (opt.zeit || 30) * 1000);
    let antwort;
    try {
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body), redirect: 'follow', signal: ctrl.signal
      });
      antwort = await r.json();
    } catch (e) {
      throw new ApiFehler('netz', t(e.name === 'AbortError' ? 'fehler.zeit' : 'fehler.netz'));
    } finally {
      clearTimeout(uhr);
    }
    if (!antwort || !antwort.ok) {
      const code = (antwort && antwort.fehler) || 'server';
      const daten2 = (antwort && antwort.daten) || {};
      // Text aus dem Theme, falls vorhanden, sonst der Text des Servers
      const text = THEME.texte['fehler.' + code] ? t('fehler.' + code, daten2) : (antwort && antwort.text) || t('fehler.server');
      throw new ApiFehler(code, text, daten2);
    }
    return antwort;
  }

  // ---------------------------------------------------------------- Datum
  const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  /** '2026-12-01' → 'Di 1.12.2026'.  ohneJahr: 'Di 1.12.' */
  function datum(iso, ohneJahr) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return WOCHENTAGE[d.getUTCDay()] + ' ' + (+m[3]) + '.' + (+m[2]) + '.' + (ohneJahr ? '' : m[1]);
  }

  /** '2026-12-01 18:30:12' → 'Di 1.12.2026, 18.30 Uhr' */
  function zeit(s) {
    const m = String(s || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    return m ? datum(m[1]) + ', ' + m[2] + '.' + m[3] + ' Uhr' : '';
  }

  /** Zahl mit Apostroph als Tausendertrennzeichen: 1250 → 1'250 */
  function zahl(n) {
    const s = String(Math.round(Number(n) || 0));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  }

  // ---------------------------------------------------------------- Theme
  let THEME = { texte: {} };

  async function theme(pfad) {
    try {
      const r = await fetch((pfad || 'theme/') + 'theme.json', { cache: 'no-cache' });
      THEME = await r.json();
      THEME.texte = THEME.texte || {};
    } catch (e) { console.warn('theme.json nicht geladen', e); }
    if (THEME.name) document.title = document.title.replace('{name}', THEME.name);
    return THEME;
  }

  /** Text aus theme.json. Platzhalter {name} werden ersetzt; {datum} etc. werden formatiert. */
  function t(schluessel, vars) {
    let s = THEME.texte[schluessel];
    if (s == null) s = STANDARD[schluessel] != null ? STANDARD[schluessel] : schluessel;
    if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];
    vars = Object.assign({ name: THEME.name || '' }, vars);
    return String(s).replace(/\{(\w+)\}/g, (_, k) => {
      if (!vars || vars[k] == null) return '';
      if (/^datum|datum$/i.test(k)) return datum(vars[k]);
      if (/punkte|saldo|preis|fehlend|betrag/i.test(k) && typeof vars[k] === 'number') return zahl(vars[k]);
      return vars[k];
    });
  }

  // Notfalltexte, falls theme.json nicht lädt
  const STANDARD = {
    'fehler.keine_api': 'Die Seite ist noch nicht fertig eingerichtet (API-Adresse fehlt in config.js).',
    'fehler.netz': 'Keine Verbindung. Bitte prüfen, ob das Handy online ist, und nochmals versuchen.',
    'fehler.zeit': 'Der Server antwortet nicht. Bitte nochmals versuchen.',
    'fehler.server': 'Auf dem Server ist etwas schiefgegangen.'
  };

  // ---------------------------------------------------------------- DOM
  /** Element bauen: el('div', {class:'x', onclick: f}, kind1, 'Text', …) */
  function el(tag, attr, ...kinder) {
    const e = document.createElement(tag);
    for (const k in attr || {}) {
      const v = attr[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : String(k));
    return e;
  }

  window.Advent = { api, token, datum, zeit, zahl, theme, t, el, ApiFehler, get THEME() { return THEME; } };
})();
