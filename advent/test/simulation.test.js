// Gesamttest: 24 Tage mit simuliertem Datum. Die Spielerin spielt zufällig (mal pünktlich, mal nachgeholt,
// mal ungültig, mal ausgelassen), der Test rechnet jeden Kontostand unabhängig nach.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { neueUmgebung } = require('./gas-umgebung');

const BEISPIEL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'beispiel-konfiguration.json'), 'utf8'));

/** Kleiner Zufallsgenerator mit Startwert, damit ein Fehler reproduzierbar ist. */
function zufall(seed) { return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }

/** Eigene Nachrechnung der Regeln (unabhängig vom Server-Code). */
function erwartetePunkte(typ, gerubbelt) {
  let p = 0, m = 1;
  for (const f of gerubbelt) {
    if (typ === 'quiz' && !f.richtig) continue;
    if (f.effekt === 'punkte') p += f.wert;
    if (f.effekt === 'multiplikator') m *= f.wert;
  }
  return Math.round(p * m);
}

function simulieren(seed, wer) {
  const u = neueUmgebung();
  u.zeilen('Katalog', [{ 'ID': 'K1', 'Titel': 'Kaffee', 'Preis': '40', 'Sichtbarkeit': 'sichtbar' }]);
  u.zeilen('Geschenke', [{ 'ID': 'G01', 'Titel': 'A', 'Art': 'text', 'Inhalt': 'a' }, { 'ID': 'G02', 'Titel': 'B', 'Art': 'text', 'Inhalt': 'b' }]);
  assert.equal(u.als('admin', 'admin_generieren', { konfiguration: BEISPIEL }).ok, true);
  const lose = u.tabelle('Lose');
  const R = zufall(seed);
  const BONUS = 5, AB = 3;
  let saldo = 0, gewinne = 0, serie;
  const pünktlich = {};          // Tag → gültig am eigenen Tag eingereicht
  const erledigt = {};
  const offen = [];              // ausgelassene Tage zum Nachholen

  const setzeDatum = (tag, stunde) => {
    const d = `2026-12-${String(tag).padStart(2, '0')}`;
    if (wer === 'test') {
      u.jetzt('2026-11-20T12:00:00');   // echtes Datum vor dem Start: nur das Testdatum zählt
      u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': d } });
    } else {
      u.jetzt(`${d}T${stunde}`);
    }
  };

  function spielen(tag, heute) {
    const los = lose.find(l => Number(l['Tag']) === tag);
    const felder = u.felder(tag);
    const noetig = Number(los['Felderzahl']);
    const ungueltig = R() < 0.08;
    const anzahl = ungueltig ? noetig + 1 : noetig;
    const gemischt = felder.slice().sort(() => R() - 0.5).slice(0, anzahl);
    const codes = gemischt.map(f => (R() < 0.2 ? f.kuerzel : f.qrId));
    const r = u.als(wer, 'einreichen', { codes, manuell: codes.some(c => !c.includes('-')) });
    assert.equal(r.ok, true, `Tag ${tag}: ${r.text}`);
    erledigt[tag] = true;
    if (ungueltig) {
      assert.equal(r.ergebnis.ungueltig, true);
      assert.equal(r.ergebnis.total, 0);
      return r;
    }
    let p = erwartetePunkte(los['Typ'], gemischt);
    if (tag === heute) {
      pünktlich[tag] = true;
      serie = 0;
      for (let t = tag; pünktlich[t]; t--) serie++;
      assert.equal(r.ergebnis.serie, serie, `Serie an Tag ${tag}`);
      if (serie >= AB) p += BONUS;
    } else {
      assert.equal(r.ergebnis.serie, 0);
      assert.equal(r.ergebnis.nachgeholt, true);
    }
    gewinne += gemischt.filter(f => f.effekt === 'sofortgewinn' && (los['Typ'] !== 'quiz' || f.richtig)).length;
    saldo += p;
    assert.equal(r.ergebnis.total, p, `Punkte an Tag ${tag}`);
    assert.equal(r.saldo, saldo, `Saldo an Tag ${tag}`);
    return r;
  }

  for (let tag = 1; tag <= 24; tag++) {
    setzeDatum(tag, R() < 0.5 ? '00:00:05' : '23:59:30');
    // Vor dem Spielen: morgiges Los ist gesperrt
    if (tag < 24) {
      const morgen = u.felder(tag + 1);
      assert.equal(u.als(wer, 'einreichen', { codes: morgen.slice(0, 2).map(f => f.qrId) }).fehler, 'los_gesperrt');
    }
    const s = u.als(wer, 'start');
    assert.equal(s.los.tag, tag);
    assert.equal(s.saldo, saldo);
    if (R() < 0.15) { offen.push(tag); continue; }   // heute ausgelassen
    spielen(tag, tag);
    // Doppelt einreichen geht nicht
    const f = u.felder(tag);
    assert.equal(u.als(wer, 'einreichen', { codes: f.slice(0, Number(lose[tag - 1]['Felderzahl'])).map(x => x.qrId) }).fehler, 'schon_eingereicht');
    // Manchmal etwas nachholen
    if (offen.length && R() < 0.5) spielen(offen.shift(), tag);
    // Manchmal etwas kaufen
    if (saldo >= 40 && R() < 0.2) {
      const k = u.als(wer, 'kaufen', { id: 'K1', preis: 40 });
      assert.equal(k.ok, true, k.text);
      saldo -= 40;
      assert.equal(k.saldo, saldo);
    }
  }
  // Am Schluss alles nachholen
  while (offen.length) spielen(offen.shift(), 24);

  // Kontrollen
  const verlauf = u.als(wer, 'verlauf').lose;
  assert.equal(verlauf.filter(l => l.ergebnis).length, 24);
  assert.equal(u.als(wer, 'start').saldo, saldo);
  const modus = wer === 'test' ? 'test' : 'echt';
  const buchungen = u.tabelle('Buchungen').filter(b => b['Modus'] === modus);
  assert.equal(buchungen.reduce((s, b) => s + Number(b['Betrag']), 0), saldo);
  assert.equal(Number(buchungen.at(-1)['Saldo']), saldo);
  assert.equal(u.als(wer, 'geschenke').geschenke.filter(g => g.quelle === 'los').length, gewinne);
  // Die jeweils andere Seite ist unberührt
  const andere = wer === 'test' ? 'spieler' : 'test';
  assert.equal(u.als(andere, 'start').saldo, 0);
  return { saldo, gewinne };
}

for (const seed of [1, 7, 42, 99, 2026]) {
  test(`24 Tage als Spielerin mit echter Uhr (Startwert ${seed})`, () => { simulieren(seed, 'spieler'); });
  test(`24 Tage im Testzugang mit Testdatum (Startwert ${seed})`, () => { simulieren(seed, 'test'); });
}
