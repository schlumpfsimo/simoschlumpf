// simo.js – Simos Sprechblase unten am Bildschirm.
//   Simo.sagen('gewinn', { punkte: 30 })   Situation aus texte.json («simo»), Platzhalter werden ersetzt
//   Simo.sagenText(['Satz 1', 'Satz 2'], 'freude')
// Der Text läuft Buchstabe für Buchstabe ein. Antippen: Satz sofort ganz zeigen, dann nächster Satz.
// Nach dem letzten Satz schliesst ein weiteres Antippen die Blase; ein kleiner Simo bleibt zum Wiederöffnen.
(function () {
  'use strict';
  const TEMPO = 28;                    // ms pro Buchstabe
  const AUSDRUCK = {                   // Gesichtsausdruck pro Situation
    gewinn: 'freude', jackpot: 'staunen', sofortgewinn: 'freude', kauf: 'freude', oeffnen: 'freude',
    ungueltig: 'staunen', sonntag: 'freude', neue_ware: 'freude', ende: 'freude'
  };

  let platz = null, blase = null, textEl = null, gesicht = null;
  const ZU_NACH = 8000;                 // ms: so lange bleibt der letzte Satz stehen, dann schliesst die Blase
  let saetze = [], index = 0, uhr = null, laeuft = false, ausdruck = 'normal', letzte = null, zuUhr = null;
  const ruhig = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bauen() {
    if (platz) return;
    platz = document.createElement('div');
    platz.className = 'blase-platz';
    document.body.append(platz);
  }

  function zeigenBlase() {
    platz.textContent = '';
    blase = document.createElement('div');
    blase.className = 'blase';
    blase.setAttribute('role', 'status');
    blase.setAttribute('aria-live', 'polite');
    blase.tabIndex = 0;
    blase.innerHTML = `<div class="blase-gesicht">${Grafik.simo(ausdruck)}</div>
      <span class="blase-name">Simo</span><p class="blase-text"></p><span class="blase-weiter" aria-hidden="true"></span>`;
    textEl = blase.querySelector('.blase-text');
    gesicht = blase.querySelector('.blase-gesicht');
    blase.addEventListener('click', weiter);
    blase.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); weiter(); } });
    platz.append(blase);
  }

  function zeigenKnopf() {
    platz.textContent = '';
    const k = document.createElement('button');
    k.className = 'simo-knopf';
    k.setAttribute('aria-label', 'Simo nochmals sprechen lassen');
    k.innerHTML = Grafik.simo('normal');
    k.addEventListener('click', () => { if (letzte) sagenText(letzte.saetze, letzte.ausdruck); });
    platz.append(k);
  }

  function tippen() {
    const satz = saetze[index] || '';
    clearInterval(uhr);
    blase.classList.remove('mehr');
    if (ruhig()) { textEl.textContent = satz; fertig(); return; }
    let n = 0;
    laeuft = true;
    blase.classList.add('spricht');
    textEl.textContent = '';
    uhr = setInterval(() => {
      n++;
      textEl.textContent = satz.slice(0, n);
      if (n % 3 === 0 && window.Klang) Klang.spielen('tipp');
      if (n >= satz.length) fertig();
    }, TEMPO);
  }

  function fertig() {
    clearInterval(uhr);
    laeuft = false;
    textEl.textContent = saetze[index] || '';
    blase.classList.remove('spricht');
    blase.classList.toggle('mehr', index < saetze.length - 1);
    clearTimeout(zuUhr);
    if (index >= saetze.length - 1) zuUhr = setTimeout(schliessen, ZU_NACH);
  }

  function schliessen() {
    clearTimeout(zuUhr);
    if (!blase || !blase.isConnected) return;
    const b = blase;
    b.classList.add('weg');
    setTimeout(() => { if (b === blase) zeigenKnopf(); }, 230);
  }

  function weiter() {
    if (laeuft) { fertig(); return; }
    if (index < saetze.length - 1) { index++; tippen(); return; }
    schliessen();
  }

  /** Zeigt Sätze an. */
  function sagenText(liste, ausdr) {
    bauen();
    saetze = (liste || []).filter(Boolean);
    if (!saetze.length) return;
    index = 0;
    clearTimeout(zuUhr);
    ausdruck = ausdr || 'normal';
    letzte = { saetze, ausdruck };
    zeigenBlase();
    tippen();
  }

  /** Situation aus texte.json. Varianten (Liste von Listen) werden zufällig gewählt. */
  function sagen(situation, vars) {
    let s = Advent.THEME.simo[situation];
    if (!s || !s.length) return;
    if (Array.isArray(s[0])) s = s[Math.floor(Math.random() * s.length)];
    sagenText(s.map(x => Advent.fuellen(x, vars)), AUSDRUCK[situation] || 'normal');
  }

  window.Simo = { sagen, sagenText };
})();
