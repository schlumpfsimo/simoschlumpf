// druck.js – Druckvorlage: A4 mit 4 Losen, Schnittmarken, QR-Codes (Fehlerkorrektur H) und Kürzel.
// Die Lose kommen mit dem Admin-Token vom Server (Aktion admin_druck). Ohne Token gibt es Beispieldaten,
// damit du die Masse schon vorher mit den Rubbelklebern ausprobieren kannst.
(function () {
  'use strict';
  const { el, datum } = Advent;

  // Standardmasse. Werden im Browser gespeichert, sobald du sie änderst.
  const STANDARD = { feldB: 26, feldH: 24, abstand: 7, qr: 12, kuerzelPt: 8, rand: 9, anordnung: '2x2', rahmen: true };
  const SPEICHER = 'advent.druck';
  let masse = Object.assign({}, STANDARD, lesen());
  let lose = null;
  let beispiel = false;

  function lesen() { try { return JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch (e) { return {}; } }
  function merken() { try { localStorage.setItem(SPEICHER, JSON.stringify(masse)); } catch (e) { /* egal */ } }

  const $ = id => document.getElementById(id);

  // ---------------------------------------------------------------- QR-Code als SVG in mm
  function qrSvg(text, mm) {
    const q = qrcode(0, 'H');                 // Version automatisch, Fehlerkorrektur H (30 %)
    q.addData(text, /^[0-9A-Z $%*+\-./:]+$/.test(text) ? 'Alphanumeric' : 'Byte');
    q.make();
    const n = q.getModuleCount();
    const ruhe = 2;                           // Ruhezone in Modulen rund um den Code
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + ruhe} ${r + ruhe}h1v1h-1z`;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const gesamt = n + 2 * ruhe;
    const aussen = mm * gesamt / n;           // «mm» ist die Grösse des Codes selbst, ohne Ruhezone
    svg.setAttribute('viewBox', `0 0 ${gesamt} ${gesamt}`);
    svg.setAttribute('width', aussen + 'mm');
    svg.setAttribute('height', aussen + 'mm');
    svg.setAttribute('shape-rendering', 'crispEdges');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', '#000');
    svg.append(p);
    return svg;
  }

  // ---------------------------------------------------------------- ein Los
  function losElement(los) {
    const T = Advent.THEME;
    const [spalten, zeilen] = { '2x2': [2, 2], '4x1': [4, 1], '1x4': [1, 4] }[masse.anordnung];
    const felder = el('div', { class: 'los-felder', style:
      `grid-template-columns: repeat(${spalten}, auto); grid-template-rows: repeat(${zeilen}, auto); gap: ${masse.abstand}mm;` });
    los.felder.forEach(f => {
      const flaeche = el('div', { class: 'feld-flaeche' + (masse.rahmen ? ' rahmen' : ''),
        style: `width:${masse.feldB}mm;height:${masse.feldH}mm` },
        qrSvg(f.qrId, masse.qr),
        el('div', { class: 'kuerzel', style: `font-size:${masse.kuerzelPt}pt` }, f.kuerzel));
      felder.append(el('div', { class: 'feld', style: `width:${Math.max(masse.feldB, 18)}mm` },
        el('div', { class: 'feld-kopf' }, el('b', {}, f.feld), f.beschriftung || ''),
        flaeche));
    });
    const titel = (T.texte && T.texte['druck.titel']) || T.name || 'Rubbellos';
    return el('div', { class: 'los-innen', style: `--rand:${masse.rand}mm` },
      el('div', { class: 'los-kopf' },
        el('div', { class: 'los-tag' }, los.tag),
        el('div', { class: 'los-titel' }, el('b', {}, titel), datum(los.datum))),
      los.regel ? el('p', { class: 'los-regel' }, los.regel) : null,
      los.frage ? el('p', { class: 'los-frage' }, los.frage) : null,
      felder,
      beispiel ? el('div', { class: 'beispiel' }, 'Beispiel, Codes ungültig') : null);
  }

  // ---------------------------------------------------------------- Blatt mit Schnittmarken
  function marken() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'marken');
    svg.setAttribute('viewBox', '0 0 210 297');
    // Kurze Striche am Rand (ausserhalb des nicht bedruckbaren Bereichs) und ein Kreuz in der Mitte
    const striche = [
      [105, 3, 105, 10], [105, 287, 105, 294],   // senkrechter Schnitt
      [3, 148.5, 10, 148.5], [200, 148.5, 207, 148.5], // waagrechter Schnitt
      [105, 144.5, 105, 152.5], [101, 148.5, 109, 148.5] // Mitte
    ];
    striche.forEach(([x1, y1, x2, y2]) => {
      const l = document.createElementNS(ns, 'line');
      Object.entries({ x1, y1, x2, y2, stroke: '#000', 'stroke-width': 0.2 }).forEach(([k, v]) => l.setAttribute(k, v));
      svg.append(l);
    });
    return svg;
  }

  const POS = [[0, 0], [105, 0], [0, 148.5], [105, 148.5]];

  function blatt(inhalt) {
    const b = el('div', { class: 'blatt' });
    inhalt.forEach((x, i) => {
      if (!x) return;
      b.append(el('div', { class: 'los', style: `left:${POS[i][0]}mm;top:${POS[i][1]}mm` }, x));
    });
    b.append(marken());
    return b;
  }

  function testHinweis() {
    return el('div', { class: 'hinweis-los' },
      el('h2', {}, 'Testblatt'),
      el('p', {}, 'Die Linie unten muss genau 50 mm lang sein. Sonst im Druckdialog die Skalierung auf 100 % stellen.'),
      el('div', { class: 'massstab' }, el('div'), el('small', {}, '50 mm')),
      el('p', {}, `Felder ${masse.feldB} × ${masse.feldH} mm, Abstand ${masse.abstand} mm, QR ${masse.qr} mm.`),
      el('p', {}, 'Kleber aufkleben, ein Feld freirubbeln, mit dem Testzugang fotografieren und prüfen, ob der Code erkannt wird.'));
  }

  // ---------------------------------------------------------------- Zeichnen
  function zeichnen() {
    const v = $('vorschau');
    v.textContent = '';
    if (!lose) return;
    const art = $('auswahl').value;
    $('l-tag').hidden = art === 'alle';
    $('l-bis').hidden = art !== 'bereich';
    $('l-tag').firstChild.textContent = art === 'bereich' ? 'von Tag ' : 'Tag ';
    let liste = lose;
    if (art === 'test') {
      const l = lose.find(x => x.tag === Number($('tag').value)) || lose[0];
      v.append(blatt([losElement(l), testHinweis()]));
      return;
    }
    if (art === 'bereich') liste = lose.filter(l => l.tag >= Number($('tag').value) && l.tag <= Number($('bis').value));
    for (let i = 0; i < liste.length; i += 4) v.append(blatt(liste.slice(i, i + 4).map(losElement)));
  }

  function meldung(text, fehler) {
    $('meldung').textContent = '';
    if (text) $('meldung').append(el('div', { class: 'meldung' + (fehler ? ' fehler' : '') }, text));
  }

  // ---------------------------------------------------------------- Beispieldaten
  function beispielLose() {
    const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const z = n => Array.from({ length: n }, () => A[Math.floor(Math.random() * A.length)]).join('');
    return Array.from({ length: 24 }, (_, i) => {
      const tag = i + 1;
      const quiz = [6, 13, 20].includes(tag);
      const antworten = ['Rhein', 'Aare', 'Limmat', 'Reuss'];
      return {
        tag, datum: `2026-12-${String(tag).padStart(2, '0')}`, typ: quiz ? 'quiz' : 'normal',
        regel: quiz ? 'Sonntagsquiz: Rubble nur das Feld mit der richtigen Antwort frei.' : 'Rubble genau 2 der 4 Felder frei.',
        frage: quiz ? 'Welcher Fluss fliesst durch Basel?' : '',
        felder: [1, 2, 3, 4].map(feld => { const k = z(4); return { feld, kuerzel: k, qrId: k + '-' + z(8), beschriftung: quiz ? antworten[feld - 1] : '' }; })
      };
    });
  }

  // ---------------------------------------------------------------- Start
  async function laden() {
    await Advent.theme();
    ['feldB', 'feldH', 'abstand', 'qr', 'kuerzelPt', 'rand', 'anordnung'].forEach(k => {
      $(k).value = masse[k];
      $(k).addEventListener('input', () => { masse[k] = k === 'anordnung' ? $(k).value : Number($(k).value) || STANDARD[k]; merken(); zeichnen(); });
    });
    $('rahmen').checked = masse.rahmen;
    $('rahmen').addEventListener('change', () => { masse.rahmen = $('rahmen').checked; merken(); zeichnen(); });
    ['auswahl', 'tag', 'bis'].forEach(k => $(k).addEventListener('input', zeichnen));
    $('drucken').addEventListener('click', () => window.print());
    $('zuruecksetzen').addEventListener('click', () => {
      masse = Object.assign({}, STANDARD); merken();
      ['feldB', 'feldH', 'abstand', 'qr', 'kuerzelPt', 'rand', 'anordnung'].forEach(k => { $(k).value = masse[k]; });
      $('rahmen').checked = masse.rahmen;
      zeichnen();
    });
    $('beispiel').addEventListener('click', () => {
      beispiel = true; lose = beispielLose();
      meldung('Beispieldaten: nur zum Ausprobieren der Masse. Diese Codes kennt der Server nicht.');
      zeichnen();
    });

    if (!Advent.token('admin')) {
      meldung('Kein Admin-Zugang. Öffne die Seite einmal über den Admin-Link (…/admin.html?t=…) oder mit ?t=<Admin-Token>.', true);
      $('beispiel').hidden = false;
      return;
    }
    meldung('Lade Lose …');
    try {
      const r = await Advent.api('admin_druck', {}, { art: 'admin' });
      lose = r.lose;
      if (!lose.length) { meldung('Noch keine Lose erzeugt. Admin-Seite → «Lose erzeugen».', true); $('beispiel').hidden = false; return; }
      meldung('');
      zeichnen();
    } catch (e) {
      meldung(e.message, true);
      $('beispiel').hidden = false;
    }
  }

  laden();
})();
