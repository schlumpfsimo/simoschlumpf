// Druckaufträge: gemeinsames Protokoll aller Bon-Apps (bon/NEUE-APP.md, Abschnitt «Protokoll»).
//
// Einbinden gleich nach </main>, vor dem eigenen Skript:  <script src="../protokoll.js"></script>
// Das Skript hängt unter die Seite ein aufklappbares Feld «Druckaufträge» und merkt sich in
// localStorage (bon.protokoll, gilt für alle Apps auf diesem Gerät) jede Einreichung bei der Bon-Post:
// Es fängt fetch an die Bon-Post ab, Apps müssen dafür nichts tun. Zusätzlich:
//   bonProtokoll.warten(['Titel 1', 'Titel 2'])   Bons, die gleich nacheinander gesendet werden → «wartet»
//   bonProtokoll.beginnen({titel, weg:'usb'})      Druck direkt per USB → Griff mit .gedruckt(titel), .fehler(text)
//   bonProtokoll.eintragen({titel, status, weg})   ein fertiger Eintrag, z. B. status:'gedruckt'
// Stände: wartet, sendet, eingereicht (Bon-Post hat angenommen), druckt, gedruckt (USB), fehler,
// abgebrochen (Rest einer abgebrochenen Reihe), unklar (Seite wurde mitten im Senden geschlossen).
// Ob der Mac einen eingereichten Bon schon gedruckt hat, sieht die Website nicht.
// STOPP-Knopf im Feld: hält in allen offenen Bon-Apps dieses Geräts die laufenden Reihen an. Wartende Bons
// werden «abgebrochen», weitere Einreichungen scheitern mit «Gestoppt», bis man wieder selbst etwas antippt.
// USB-Apps hören auf das Ereignis 'bon-stopp' am window. Schon eingereichte Bons holt der Mac trotzdem ab.
(() => {
  'use strict';
  const SCHLUESSEL = 'bon.protokoll';
  const MAX = 80;                              // Einträge
  const ALTER = 30 * 86400000;                 // ms: ältere Einträge fliegen raus
  const HERZ = 15000, TOT = 180000;            // Lebenszeichen offener Seiten, Frist bis eine Seite als geschlossen gilt
  const OFFEN = ['wartet', 'sendet', 'druckt'];
  const STOPP = SCHLUESSEL + '.stopp';         // Zeitpunkt des letzten STOPP (localStorage, alle Reiter)
  const WORT = { wartet: 'wartet', sendet: 'wird gesendet', eingereicht: 'eingereicht', druckt: 'druckt', gedruckt: 'gedruckt',
                 fehler: 'Fehler', abgebrochen: 'abgebrochen', unklar: 'unklar' };

  const pfad = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/').pop() || 'bon';
  const brand = document.querySelector('.brand span');
  const APP = (brand && brand.textContent.split('·')[0].trim()) || pfad;
  const SITZUNG = (() => {
    try { let s = sessionStorage.getItem(SCHLUESSEL + '.sitzung'); if (!s) { s = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(SCHLUESSEL + '.sitzung', s); } return s; }
    catch (e) { return Math.random().toString(36).slice(2, 10); }
  })();

  // ---------------------------------------------------------------- Speicher
  function lesen(){
    try {
      const d = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}');
      return { eintraege: Array.isArray(d.eintraege) ? d.eintraege : [], sitzungen: d.sitzungen || {} };
    } catch (e) { return { eintraege: [], sitzungen: {} }; }
  }
  function schreiben(d){
    const jetzt = Date.now();
    d.eintraege = d.eintraege.filter(e => jetzt - e.t < ALTER).slice(-MAX);
    for (const s in d.sitzungen) if (jetzt - d.sitzungen[s] > 86400000) delete d.sitzungen[s];
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(d)); } catch (e) {}
    zeigen(d);
  }
  // Alle Änderungen laufen hier durch: lesen, ändern, schreiben, anzeigen
  function aendern(fn){ const d = lesen(); const r = fn(d); schreiben(d); return r; }
  const neu = (f) => ({ k: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), app: APP, s: SITZUNG, weg: 'post', ...f });
  const finde = (d, k) => d.eintraege.find(e => e.k === k);
  const setze = (k, f) => aendern(d => { const e = finde(d, k); if (e) Object.assign(e, f); });

  // Lebenszeichen, damit eine zweite offene Seite die Aufträge dieser Seite nicht für abgebrochen hält
  function herz(){ aendern(d => { d.sitzungen[SITZUNG] = Date.now(); }); }
  // Offene Aufträge von Seiten, die nicht mehr leben, abschliessen
  function aufraeumen(){
    aendern(d => {
      const jetzt = Date.now();
      for (const e of d.eintraege) {
        if (e.s === SITZUNG || OFFEN.indexOf(e.status) < 0) continue;
        const zuletzt = d.sitzungen[e.s] || e.t;
        if (jetzt - zuletzt < TOT) continue;
        e.status = e.status === 'wartet' ? 'abgebrochen' : 'unklar';
        if (e.status === 'unklar') e.fehler = 'Seite wurde geschlossen';
      }
    });
  }

  // ---------------------------------------------------------------- Schnittstelle
  function griff(k){
    return {
      k,
      eingereicht(id){ setze(k, { status: 'eingereicht', bid: id || '', t2: Date.now() }); },
      gedruckt(titel){ setze(k, { status: 'gedruckt', t2: Date.now(), ...(titel ? { titel } : {}) }); },
      fehler(text){ setze(k, { status: 'fehler', fehler: String(text || 'unbekannter Fehler').slice(0, 120), t2: Date.now() }); },
      titel(t){ setze(k, { titel: t }); },
    };
  }
  const bonProtokoll = {
    warten(titel){
      const liste = (Array.isArray(titel) ? titel : [titel]).map(t => String(t || 'Bon'));
      aendern(d => { for (const t of liste) d.eintraege.push(neu({ titel: t, status: 'wartet' })); });
      herz();
      return liste.length;
    },
    beginnen(f){
      const e = neu({ titel: String((f && f.titel) || 'Bon'), status: (f && f.status) || 'druckt', weg: (f && f.weg) || 'usb' });
      aendern(d => { d.eintraege.push(e); });
      herz();
      return griff(e.k);
    },
    eintragen(f){
      const e = neu({ titel: String((f && f.titel) || 'Bon'), status: (f && f.status) || 'gedruckt', weg: (f && f.weg) || 'usb', fehler: f && f.fehler });
      aendern(d => { d.eintraege.push(e); });
      return griff(e.k);
    },
    // Rest einer Reihe, die abgebrochen wurde (Fehler oder Anhalten): alle wartenden dieser Seite
    abbrechen(){ aendern(d => { for (const e of d.eintraege) if (e.s === SITZUNG && e.status === 'wartet') e.status = 'abgebrochen'; }); },
    // STOPP: wartende Bons aller Seiten abbrechen, laufende Reihen in allen Reitern anhalten
    stoppen(){
      try { localStorage.setItem(STOPP, String(Date.now())); } catch (e) {}
      aendern(d => { for (const e of d.eintraege) if (e.status === 'wartet') { e.status = 'abgebrochen'; e.fehler = 'gestoppt'; } });
      melden();
    },
    // true, wenn seit dem letzten eigenen Antippen auf dieser Seite STOPP gedrückt wurde
    gestoppt(){ return stoppZeit() > geste; },
    leeren(){ aendern(d => { d.eintraege = d.eintraege.filter(e => OFFEN.indexOf(e.status) >= 0); }); },
    liste(){ return lesen().eintraege.slice(); },
  };
  window.bonProtokoll = bonProtokoll;

  // ---------------------------------------------------------------- STOPP
  // Ein STOPP gilt für alles, was vorher angestossen wurde. Wer danach selbst wieder etwas antippt
  // oder tippt, darf neu drucken. Der STOPP-Knopf selbst zählt nicht als Antippen.
  let geste = Date.now();
  const stoppZeit = () => { try { return Number(localStorage.getItem(STOPP) || 0); } catch (e) { return 0; } };
  for (const typ of ['pointerdown', 'keydown']) document.addEventListener(typ, e => {
    if (!(e.target && e.target.closest && e.target.closest('#bp-stopp'))) geste = Date.now();
  }, true);
  function melden(){ try { window.dispatchEvent(new Event('bon-stopp')); } catch (e) {} }

  // ---------------------------------------------------------------- fetch an die Bon-Post abfangen
  const fetchAlt = window.fetch;
  window.fetch = function(ziel, init){
    const url = typeof ziel === 'string' ? ziel : (ziel && ziel.url) || '';
    let daten = null;
    if (/script\.google\.com\/macros\/s\/[^/]+\/exec/.test(url) && init && typeof init.body === 'string') {
      try { daten = JSON.parse(init.body); } catch (e) { daten = null; }
    }
    if (!daten || daten.aktion || !('inhalt' in daten)) return fetchAlt.apply(this, arguments);   // kein Bon (z. B. Zeitplan)
    if (bonProtokoll.gestoppt()) {                                                                 // nach STOPP nichts mehr senden
      bonProtokoll.abbrechen();
      return Promise.reject(new Error('Gestoppt'));
    }

    const titel = String(daten.titel || 'Bon');
    // Den passenden wartenden Eintrag dieser Seite übernehmen, sonst einen neuen anlegen
    const k = aendern(d => {
      let e = d.eintraege.find(x => x.s === SITZUNG && x.status === 'wartet' && x.titel === titel)
           || d.eintraege.find(x => x.s === SITZUNG && x.status === 'wartet');
      if (!e) { e = neu({ titel }); d.eintraege.push(e); }
      Object.assign(e, { titel, status: 'sendet', t: Date.now(), weg: 'post' });
      return e.k;
    });
    herz();
    const g = griff(k);
    const scheitert = (text) => { g.fehler(text); bonProtokoll.abbrechen(); };
    return fetchAlt.apply(this, arguments).then(r => {
      r.clone().json().then(j => {
        if (j && j.ok) g.eingereicht(j.id);
        else scheitert((j && j.fehler) || ('Antwort ' + r.status));
      }, () => scheitert('Antwort unlesbar (' + r.status + ')'));
      return r;
    }, err => { scheitert(err && err.message); throw err; });
  };

  // ---------------------------------------------------------------- Anzeige
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zwei = n => String(n).padStart(2, '0');
  function zeit(t){
    const d = new Date(t), h = new Date();
    const uhr = zwei(d.getHours()) + ':' + zwei(d.getMinutes());
    return d.toDateString() === h.toDateString() ? uhr : zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '. ' + uhr;
  }
  const stil = document.createElement('style');
  stil.textContent = `
.bon-protokoll{margin:0 auto;padding-top:10px;padding-bottom:40px;font-family:var(--mono,ui-monospace,Menlo,Consolas,monospace);font-size:14px;line-height:1.45;color:#000;background:#fff}
.bon-protokoll details{border-top:1px solid #000}
.bon-protokoll summary{list-style:none;cursor:pointer;padding:8px 0;font-size:.76rem;text-transform:uppercase;letter-spacing:.04em;color:#666;display:flex;gap:8px;align-items:center;-webkit-tap-highlight-color:transparent}
.bon-protokoll summary::-webkit-details-marker{display:none}
.bon-protokoll summary::before{content:"▸";color:#000;flex:none}
.bon-protokoll details[open] summary::before{content:"▾"}
.bon-protokoll summary b{color:#000;font-weight:700}
.bon-protokoll .bp-offen{margin-left:auto;color:#000;border:1px solid #000;padding:0 6px;white-space:nowrap}
.bon-protokoll ol{list-style:none;margin:0;padding:0;border:1px solid #000}
.bon-protokoll li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:0 10px;align-items:baseline;padding:6px 8px;border-top:1px solid #000;font-size:.85rem}
.bon-protokoll li:first-child{border-top:0}
.bon-protokoll li.bp-offen-zeile{background:#000;color:#fff}
.bon-protokoll .bp-zeit{color:#666;white-space:nowrap;font-size:.78rem}
.bon-protokoll li.bp-offen-zeile .bp-zeit{color:#ccc}
.bon-protokoll .bp-was{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bon-protokoll .bp-was small{color:#666;font-size:.78rem}
.bon-protokoll li.bp-offen-zeile .bp-was small{color:#ccc}
.bon-protokoll .bp-stand{white-space:nowrap;text-transform:uppercase;letter-spacing:.04em;font-size:.72rem}
.bon-protokoll .bp-fehler{grid-column:2/4;color:#b00000;font-size:.78rem;white-space:normal}
.bon-protokoll li.bp-offen-zeile .bp-fehler{color:#fff}
.bon-protokoll .bp-leer{margin:0;padding:12px 8px;border:1px solid #000;color:#666;font-size:.8rem;text-align:center}
.bon-protokoll .bp-fuss{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-top:8px}
.bon-protokoll p.bp-hinweis{margin:0;font-size:.74rem;color:#666}
.bon-protokoll button.bp-leeren{font:inherit;font-size:.72rem;width:auto;margin:0;padding:6px 10px;border:1px solid #000;border-radius:0;background:#fff;color:#000;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;flex:none}
.bon-protokoll button.bp-leeren:hover,.bon-protokoll button.bp-leeren:focus-visible{background:#000;color:#fff}
.bon-protokoll button.bp-leeren:disabled{opacity:.4;cursor:default}
.bon-protokoll .bp-kopf{position:relative;border-top:1px solid #000}
.bon-protokoll .bp-kopf details{border-top:0}
.bon-protokoll .bp-kopf summary{min-height:52px;padding-right:110px}
.bon-protokoll button.bp-stopp{position:absolute;top:4px;right:0;font:inherit;font-weight:700;font-size:.8rem;width:auto;min-width:96px;height:44px;margin:0;padding:0 14px;border:2px solid #000;border-radius:0;background:#fff;color:#000;text-transform:uppercase;letter-spacing:.12em;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bon-protokoll button.bp-stopp.bp-aktiv{background:#000;color:#fff}
.bon-protokoll button.bp-stopp:hover,.bon-protokoll button.bp-stopp:focus-visible{outline:2px solid #000;outline-offset:2px}
.bon-protokoll button.bp-stopp:active{background:#b00000;border-color:#b00000;color:#fff}
.bon-protokoll p.bp-gestoppt{margin:0 0 8px;padding:8px;border:1px solid #000;font-size:.8rem}
.bon-protokoll p.bp-gestoppt[hidden]{display:none}`;
  document.head.appendChild(stil);

  const feld = document.createElement('section');
  feld.className = 'bon-protokoll';
  feld.setAttribute('aria-label', 'Druckaufträge');
  feld.innerHTML = `<div class="bp-kopf"><details><summary>Druckaufträge <b id="bp-zahl"></b><span class="bp-offen" id="bp-offen" hidden></span></summary>
    <p class="bp-gestoppt" id="bp-gestoppt" hidden></p>
    <div id="bp-liste"></div>
    <div class="bp-fuss"><p class="bp-hinweis">Nur Aufträge von diesem Gerät. Ob der Mac einen eingereichten Bon schon gedruckt hat, sieht die Website nicht.</p>
    <button type="button" class="bp-leeren" id="bp-leeren">Leeren</button></div></details>
    <button type="button" class="bp-stopp" id="bp-stopp" title="Alle laufenden Druckaufträge auf diesem Gerät anhalten">Stopp</button></div>`;
  const main = document.querySelector('main');
  if (main) {
    const cs = getComputedStyle(main);
    feld.style.maxWidth = cs.maxWidth; feld.style.paddingLeft = cs.paddingLeft; feld.style.paddingRight = cs.paddingRight;
    main.insertAdjacentElement('afterend', feld);
  } else document.body.appendChild(feld);
  const details = feld.querySelector('details');
  try { details.open = localStorage.getItem(SCHLUESSEL + '.offen') === '1'; } catch (e) {}
  details.addEventListener('toggle', () => { try { localStorage.setItem(SCHLUESSEL + '.offen', details.open ? '1' : '0'); } catch (e) {} });
  feld.querySelector('#bp-leeren').addEventListener('click', () => bonProtokoll.leeren());
  feld.querySelector('#bp-stopp').addEventListener('click', () => {
    bonProtokoll.stoppen();
    const h = feld.querySelector('#bp-gestoppt');
    h.textContent = 'Gestoppt ' + zeit(Date.now()) + '. Wartende Bons sind abgebrochen. Was schon eingereicht ist, holt der Mac trotzdem ab: dann Drucker ausschalten.';
    h.hidden = false; details.open = true;
  });

  function zeigen(d){
    const liste = d.eintraege.slice().sort((a, b) => b.t - a.t);
    const offen = liste.filter(e => OFFEN.indexOf(e.status) >= 0).length;
    feld.querySelector('#bp-zahl').textContent = liste.length ? liste.length : '';
    const o = feld.querySelector('#bp-offen');
    o.hidden = !offen; o.textContent = offen + ' offen';
    feld.querySelector('#bp-stopp').classList.toggle('bp-aktiv', offen > 0);
    feld.querySelector('#bp-leeren').disabled = liste.length === offen;
    feld.querySelector('#bp-liste').innerHTML = liste.length ? '<ol>' + liste.map(e => {
      const ist = OFFEN.indexOf(e.status) >= 0;
      const stand = WORT[e.status] || e.status;
      const wo = e.weg === 'usb' ? ' · USB' : '';
      // Steht der App-Name schon im Titel («Kniffel Spielregeln»), nicht doppelt zeigen
      const vorne = e.titel.toLowerCase().startsWith(String(e.app).toLowerCase()) ? wo.replace(/^ · /, '') : e.app + wo;
      const fehler = (e.status === 'fehler' || e.status === 'unklar' || e.status === 'abgebrochen') && e.fehler ? `<span class="bp-fehler">${esc(e.fehler)}</span>` : '';
      return `<li class="${ist ? 'bp-offen-zeile' : ''}"><span class="bp-zeit">${zeit(e.t)}</span><span class="bp-was">${vorne ? `<small>${esc(vorne)} · </small>` : ''}${esc(e.titel)}</span><span class="bp-stand">${esc(stand)}</span>${fehler}</li>`;
    }).join('') + '</ol>' : '<p class="bp-leer">Noch keine Druckaufträge.</p>';
  }

  // ---------------------------------------------------------------- Start
  aufraeumen();
  window.addEventListener('storage', e => {                                                     // andere Reiter
    if (e.key === SCHLUESSEL) zeigen(lesen());
    if (e.key === STOPP && e.newValue) melden();
  });
  setInterval(() => { if (lesen().eintraege.some(e => e.s === SITZUNG && OFFEN.indexOf(e.status) >= 0)) herz(); }, HERZ);
  setInterval(aufraeumen, TOT / 3);
})();
