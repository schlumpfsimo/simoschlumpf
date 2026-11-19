// Tests für das Apps-Script-Backend (Schritt 2 und 3).   Ausführen:  node --test advent/test/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { neueUmgebung } = require('./gas-umgebung');

const BEISPIEL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'beispiel-konfiguration.json'), 'utf8'));

/** Ware, die nur als Sofortgewinn vorkommt (Zustand «versteckt»). */
const WARE_GEWINNE = ['W90', 'W91', 'W92', 'W93'].map((id, i) => ({
  'ID': id, 'Titel': ['Kinogutschein', 'Brief', 'Glühwein', 'Reise'][i], 'Illustration': 'kino', 'Preis': '0',
  'Zustand': 'versteckt', 'Inhalt-Art': i === 0 ? 'code' : 'text', 'Inhalt': i === 0 ? 'KINO-1234' : 'Ein langer Brief.'
}));

/** Umgebung mit Geschenken und den Losen aus einer Konfiguration. */
function bereit(konfiguration = BEISPIEL) {
  const u = neueUmgebung();
  u.zeilen('Ware', WARE_GEWINNE);
  const r = u.als('admin', 'admin_generieren', { konfiguration: JSON.stringify(konfiguration) });
  assert.equal(r.ok, true, r.text);
  return u;
}

/** Konfiguration mit festen Feldern (ohne Mischen), damit Tests wissen, welches Feld was ist. */
function fest(lose) {
  return { start: '2026-12-01', mischen: false,
    typen: { normal: { felderzahl: 2, regel: 'Zwei Felder.' }, quiz: { felderzahl: 1, regel: 'Ein Feld.' } }, lose };
}

const einreichen = (u, wer, codes, rest = {}) => u.als(wer, 'einreichen', Object.assign({ codes }, rest));

// ------------------------------------------------------------------ Einrichtung und Zugang

test('einrichten legt Blätter, Einstellungen und Zugänge an', () => {
  const u = neueUmgebung();
  for (const n of ['Lose', 'Felder', 'Einsendungen', 'Buchungen', 'Ware', 'Erhalten', 'Bestellungen', 'Einstellungen', 'Konfiguration']) {
    assert.ok(u.sheets[n], n);
  }
  assert.equal(u.tabelle('Einstellungen').length, 8);
  assert.match(u.token('spieler'), /^[2-9A-HJKMNP-Z]{24}$/);
  assert.notEqual(u.token('spieler'), u.token('admin'));
  // nochmals ausführen ändert nichts
  const vorher = u.token('spieler');
  u.kontext.einrichten();
  assert.equal(u.token('spieler'), vorher);
  assert.equal(u.tabelle('Einstellungen').length, 8);
});

test('ohne gültigen Token keine Daten', () => {
  const u = neueUmgebung();
  assert.equal(u.api({ aktion: 'start', token: 'falsch' }).fehler, 'token');
  assert.equal(u.api({ aktion: 'start' }).fehler, 'token');
  assert.equal(u.als('spieler', 'admin_uebersicht').fehler, 'aktion');   // Spielerin darf kein Admin
  assert.equal(u.als('admin', 'start').fehler, 'aktion');
});

// ------------------------------------------------------------------ Generator

test('Generator: 24 Lose, eindeutige Kürzel, Alphabet ohne 0 O 1 I L', () => {
  const u = bereit();
  const lose = u.tabelle('Lose'), felder = u.tabelle('Felder');
  assert.equal(lose.length, 24);
  assert.equal(felder.length, 96);
  assert.equal(lose[0]['Datum'], '2026-12-01');
  assert.equal(lose[23]['Datum'], '2026-12-24');
  assert.equal(lose[5]['Typ'], 'sonntag');
  assert.equal(lose[2]['Typ'], 'quiz');
  const kz = felder.map(f => f['Kürzel']);
  assert.equal(new Set(kz).size, 96);
  for (const f of felder) {
    assert.match(f['Kürzel'], /^[2-9A-HJKMNP-Z]{4}$/);
    assert.match(f['QR-ID'], new RegExp('^' + f['Kürzel'] + '-[2-9A-HJKMNP-Z]{8}$'));
  }
  assert.ok(u.tabelle('Konfiguration')[0], 'Konfiguration gespeichert');
});

test('Generator: Fehler werden verständlich gemeldet und nichts wird geschrieben', () => {
  const u = neueUmgebung();
  const r = u.als('admin', 'admin_generieren', { konfiguration: fest([
    { tag: 1, felder: ['P10', 'P5', '-'] },
    { tag: 2, felder: ['P10', 'Q5', '-', 'S:W99'] },
    { tag: 3, typ: 'quiz', felder: ['P1', '-', '-', '-'] }
  ]) });
  assert.equal(r.ok, false);
  assert.equal(r.fehler, 'konfiguration');
  const t = r.daten.fehler.join('\n');
  assert.match(t, /Los 1: braucht genau 4 Felder/);
  assert.match(t, /«Q5» verstehe ich nicht/);
  assert.match(t, /Ware «W99» fehlt/);
  assert.match(t, /Quiz braucht mindestens eine Antwort/);
  assert.equal(u.tabelle('Lose').length, 0);
  assert.equal(u.als('admin', 'admin_generieren', { konfiguration: '{kaputt' }).fehler, 'konfiguration');
});

test('Generator: nurPruefen zeigt Spannweite der Punkte', () => {
  const u = neueUmgebung();
  const r = u.als('admin', 'admin_generieren', { nurPruefen: true, konfiguration: fest([
    { tag: 1, felder: ['P10', 'P5', 'x2', '-'] }
  ]) });
  assert.equal(r.ok, true);
  assert.equal(r.uebersicht.lose[0].maximal, 20);    // P10 mit x2
  assert.equal(r.uebersicht.lose[0].minimal, 0);     // x2 + Niete
  assert.equal(u.tabelle('Lose').length, 0);
});

test('Generator: Überschreiben nur nach Bestätigung, wenn schon gespielt', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x2', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]).ok, true);
  const k = fest([{ tag: 1, felder: ['P1', 'P1', 'P1', 'P1'] }]);
  assert.equal(u.als('admin', 'admin_generieren', { konfiguration: k }).fehler, 'schon_gespielt');
  assert.equal(u.als('admin', 'admin_generieren', { konfiguration: k, ueberschreiben: true }).ok, true);
});

// ------------------------------------------------------------------ Einreichen

test('Datumssperre: Los erst ab seinem Tag (Zürcher Zeit)', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x2', '-'] }]));
  const f = u.felder(1);
  u.jetzt('2026-11-30T23:59:00');
  const r = einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]);
  assert.equal(r.fehler, 'los_gesperrt');
  assert.equal(r.daten.datum, '2026-12-01');
  u.jetzt('2026-12-01T00:00:30');
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]).ok, true);
});

test('Normal: 2 Felder, Punkte × Multiplikator, alle Felder werden aufgedeckt', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[0].qrId, f[2].qrId], { foto: 'data:image/jpeg;base64,' + Buffer.from('jpeg').toString('base64') });
  assert.equal(r.ok, true, r.text);
  const e = r.ergebnis;
  assert.equal(e.losPunkte, 30);
  assert.equal(e.total, 30);
  assert.equal(r.saldo, 30);
  assert.deepEqual(e.felder.map(x => x.gerubbelt), [true, false, true, false]);
  assert.deepEqual(e.felder.map(x => x.effekt), ['punkte', 'punkte', 'multiplikator', 'niete']);
  assert.equal(e.hatFoto, true);
  assert.equal(Object.keys(u.dateien).length, 1);
  const b = u.tabelle('Buchungen');
  assert.equal(b.length, 1);
  assert.equal(b[0]['Betrag'], '30');
  assert.equal(b[0]['Saldo'], '30');
  // Foto wieder abrufen
  const foto = u.als('spieler', 'foto', { einsendung: e.einsendung });
  assert.match(foto.bild, /^data:image\/jpeg;base64,/);
});

test('Kürzel von Hand, Kleinschreibung und Leerzeichen sind egal', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [' ' + f[0].kuerzel.toLowerCase(), f[1].qrId, f[0].qrId], { manuell: true });
  assert.equal(r.ok, true, r.text);
  assert.equal(r.ergebnis.losPunkte, 15);  // QR-ID und Kürzel desselben Feldes zählen einmal
  assert.equal(u.tabelle('Einsendungen')[0]['Manuell'], 'ja');
});

test('Zu wenige Felder: abgelehnt, nichts verbraucht', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[0].qrId]);
  assert.equal(r.fehler, 'zu_wenige');
  assert.deepEqual([r.daten.erkannt, r.daten.noetig], [1, 2]);
  assert.equal(u.tabelle('Einsendungen').length, 0);
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]).ok, true);
});

test('Zu viele Felder: ungültig, 0 Punkte, Los verbraucht', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[0].qrId, f[1].qrId, f[2].qrId]);
  assert.equal(r.ok, true);
  assert.equal(r.ergebnis.ungueltig, true);
  assert.equal(r.ergebnis.status, 'ungültig');
  assert.equal(r.ergebnis.total, 0);
  assert.equal(r.saldo, 0);
  assert.equal(r.ergebnis.felder.length, 4);  // trotzdem alles aufdecken
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]).fehler, 'schon_eingereicht');
});

test('Unbekannte, gemischte und falsche Codes', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }, { tag: 2, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-02T09:00:00');
  const f1 = u.felder(1), f2 = u.felder(2);
  let r = einreichen(u, 'spieler', ['ZZZZ', f1[0].qrId]);
  assert.equal(r.fehler, 'code_unbekannt');
  assert.deepEqual(r.daten.codes, ['ZZZZ']);
  r = einreichen(u, 'spieler', [f1[0].kuerzel + '-AAAAAAAA', f1[1].qrId]);  // erratene QR-ID
  assert.equal(r.fehler, 'code_unbekannt');
  assert.deepEqual(r.daten.codes, [f1[0].kuerzel]);   // Meldung verrät nur das Kürzel
  r = einreichen(u, 'spieler', [f1[0].qrId, f2[0].qrId]);
  assert.equal(r.fehler, 'codes_gemischt');
  r = einreichen(u, 'spieler', [f1[0].qrId, f1[1].qrId], { tag: 2 });
  assert.equal(r.fehler, 'falsches_los');
  assert.equal(einreichen(u, 'spieler', []).fehler, 'keine_codes');
});

test('Nachholen: erlaubt oder gesperrt je nach Einstellung', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }, { tag: 2, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-02T09:00:00');
  const f1 = u.felder(1);
  u.als('admin', 'admin_einstellungen', { werte: { 'Nachholen erlaubt': 'nein' } });
  assert.equal(einreichen(u, 'spieler', [f1[0].qrId, f1[1].qrId]).fehler, 'nachholen_aus');
  assert.equal(u.als('spieler', 'start').nachholbar.length, 0);
  u.als('admin', 'admin_einstellungen', { werte: { 'Nachholen erlaubt': 'ja' } });
  assert.deepEqual(u.als('spieler', 'start').nachholbar.map(x => x.tag), [1]);
  const r = einreichen(u, 'spieler', [f1[0].qrId, f1[1].qrId]);
  assert.equal(r.ok, true);
  assert.equal(r.ergebnis.nachgeholt, true);
  assert.equal(r.ergebnis.serie, 0);   // Nachgeholtes zählt nicht für die Serie
});

test('Quiz: nur die richtige Antwort zählt', () => {
  const q = { tag: 1, typ: 'quiz', frage: 'Fluss?', felder: [
    { antwort: 'Rhein', richtig: true, effekt: 'punkte', wert: 50 }, { antwort: 'Aare' },
    { antwort: 'Reuss', effekt: 'punkte', wert: 99 }, { antwort: 'Limmat' }] };
  const u = bereit(fest([q, Object.assign({}, q, { tag: 2 })]));
  u.jetzt('2026-12-02T09:00:00');
  let r = einreichen(u, 'spieler', [u.felder(1)[0].qrId]);
  assert.equal(r.ergebnis.quizRichtig, true);
  assert.equal(r.ergebnis.losPunkte, 50);
  r = einreichen(u, 'spieler', [u.felder(2)[2].qrId]);   // falsche Antwort mit Punkten im Feld
  assert.equal(r.ergebnis.quizRichtig, false);
  assert.equal(r.ergebnis.losPunkte, 0);
  assert.equal(r.ergebnis.felder[0].richtig, true);    // Auflösung zeigt die richtige Antwort
  assert.equal(r.ergebnis.felder[0].beschriftung, 'Rhein');
  // Quiz mit 2 Feldern ist ungültig
  const u2 = bereit(fest([q]));
  u2.jetzt('2026-12-01T09:00:00');
  assert.equal(einreichen(u2, 'spieler', [u2.felder(1)[0].qrId, u2.felder(1)[1].qrId]).ergebnis.ungueltig, true);
});

test('Sofortgewinn: Ware gehört ihr sofort und steht im Regal', () => {
  const u = bereit(fest([{ tag: 1, felder: ['S:W90', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  assert.equal(u.als('spieler', 'regal').ware.length, 0);   // versteckt, solange nicht gewonnen
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]);
  assert.equal(r.ergebnis.gewinne[0].titel, 'Kinogutschein');
  assert.equal(r.ergebnis.gewinne[0].inhalt, undefined);    // Inhalt erst beim Öffnen
  assert.equal(r.ergebnis.felder[0].geschenk, 'Kinogutschein');
  const regal = u.als('spieler', 'regal').ware;
  assert.equal(regal.length, 1);
  assert.equal(regal[0].gehoert, true);
  assert.equal(regal[0].gewonnen, true);
  assert.equal(regal[0].kaufbar, false);
  assert.equal(u.als('spieler', 'oeffnen', { id: 'W90' }).ware.inhalt, 'KINO-1234');
  assert.equal(u.als('test', 'oeffnen', { id: 'W90' }).fehler, 'nicht_deins');
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W90')['Gehört ihr'], 'ja');
});

test('Serie und Serienbonus (ab 3 Tagen, nur am eigenen Tag)', () => {
  const lose = [1, 2, 3, 4, 5].map(tag => ({ tag, felder: ['P10', 'P10', '-', '-'] }));
  const u = bereit(fest(lose));
  const tagEinreichen = (tag) => {
    u.jetzt(`2026-12-0${tag}T09:00:00`);
    const f = u.felder(tag);
    return einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]);
  };
  assert.equal(tagEinreichen(1).ergebnis.serie, 1);
  assert.equal(tagEinreichen(2).ergebnis.serienbonus, 0);
  const r3 = tagEinreichen(3);
  assert.equal(r3.ergebnis.serie, 3);
  assert.equal(r3.ergebnis.serienbonus, 5);
  assert.equal(r3.ergebnis.total, 25);
  assert.equal(r3.saldo, 20 + 20 + 25);
  // Tag 4 auslassen, Tag 5: Serie bricht ab
  u.jetzt('2026-12-04T20:00:00');
  assert.equal(u.als('spieler', 'start').serie, 3);   // heute noch nicht eingereicht: Serie läuft
  const r5 = tagEinreichen(5);
  assert.equal(r5.ergebnis.serie, 1);
  assert.equal(r5.ergebnis.serienbonus, 0);
  assert.equal(u.als('spieler', 'start').serie, 1);
});

// ------------------------------------------------------------------ Testzugang

test('Testzugang: eigenes Testdatum und getrennte Daten', () => {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }, { tag: 5, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-11-25T10:00:00');
  u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': '5.12.2026' } });
  assert.equal(u.tabelle('Einstellungen').find(e => e['Schlüssel'] === 'Testdatum')['Wert'], '2026-12-05');
  assert.equal(u.als('test', 'start').heute, '2026-12-05');
  assert.equal(u.als('test', 'start').testmodus, true);
  assert.equal(u.als('spieler', 'start').heute, '2026-11-25');   // Spielerin bleibt beim echten Datum
  const f = u.felder(5);
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]).fehler, 'los_gesperrt');
  const r = einreichen(u, 'test', [f[0].qrId, f[1].qrId], { foto: Buffer.from('x').toString('base64') });
  assert.equal(r.ok, true);
  assert.equal(u.als('test', 'start').saldo, 15);
  assert.equal(u.als('spieler', 'start').saldo, 0);
  // Admin sieht beide getrennt
  assert.equal(u.als('admin', 'admin_uebersicht', { modus: 'test' }).einsendungen.length, 1);
  assert.equal(u.als('admin', 'admin_uebersicht', { modus: 'echt' }).einsendungen.length, 0);
  // Testdaten löschen
  const d = u.als('admin', 'admin_testdaten_loeschen');
  assert.equal(d.geloescht.einsendungen, 1);
  assert.equal(d.geloescht.fotos, 1);
  assert.equal(u.als('test', 'start').saldo, 0);
  assert.equal(u.als('admin', 'admin_einstellungen', { werte: { 'Testdatum': 'morgen' } }).fehler, 'eingabe');
});

// ------------------------------------------------------------------ Admin

test('Admin: Ergebnis ändern, zurücksetzen, Punkte buchen', () => {
  const u = bereit(fest([{ tag: 1, felder: ['S:W90', 'P5', 'x3', '-'] }]));
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]);
  assert.equal(r.saldo, 5);
  let a = u.als('admin', 'admin_ergebnis', { einsendung: r.ergebnis.einsendung, punkte: 12, notiz: 'Kulanz' });
  assert.equal(a.saldo, 12);
  assert.equal(u.tabelle('Einsendungen')[0]['Status'], 'vom Admin geändert');
  a = u.als('admin', 'admin_buchen', { betrag: '-2', grund: 'Test' });
  assert.equal(a.saldo, 10);
  a = u.als('admin', 'admin_zuruecksetzen', { tag: 1 });
  assert.equal(a.saldo, -2);                              // nur die Admin-Buchung bleibt
  assert.equal(u.als('spieler', 'regal').ware.length, 0);  // Sofortgewinn weg
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W90')['Gehört ihr'], '');
  assert.equal(u.als('spieler', 'verlauf').lose[0].status, 'offen');
  assert.equal(einreichen(u, 'spieler', [f[0].qrId, f[2].qrId]).ok, true);  // wieder einreichbar
  assert.equal(u.als('admin', 'admin_zuruecksetzen', { tag: 3 }).fehler, 'nicht_gefunden');
});

test('Admin: Druckdaten enthalten keine Effekte', () => {
  const u = bereit();
  const d = u.als('admin', 'admin_druck');
  assert.equal(d.lose.length, 24);
  assert.equal(d.lose[9].frage, 'Welcher Fluss fliesst durch Basel?');
  assert.deepEqual(Object.keys(d.lose[0].felder[0]).sort(), ['beschriftung', 'feld', 'kuerzel', 'qrId']);
  assert.equal(u.als('spieler', 'admin_druck').ok, false);
});

// ------------------------------------------------------------------ Verlauf und Start

test('Start und Verlauf verraten keine Felder künftiger Lose', () => {
  const u = bereit();
  u.jetzt('2026-12-04T09:00:00');
  const s = u.als('spieler', 'start');
  assert.equal(s.los.tag, 4);
  assert.equal(s.los.status, 'offen');
  assert.equal(s.los.felderzahl, 2);
  assert.equal(s.naechstes.tag, 5);
  const v = u.als('spieler', 'verlauf').lose;
  assert.equal(v.length, 24);
  assert.equal(v[4].status, 'gesperrt');
  assert.equal(v[4].regel, undefined);
  assert.equal(v[9].frage, undefined);   // Quizfrage vom 10.12. noch verborgen
  u.jetzt('2026-12-06T09:00:00');
  assert.equal(u.als('spieler', 'start').sonntag, true);
  u.jetzt('2026-12-27T09:00:00');
  assert.equal(u.als('spieler', 'start').sonntag, false);
  const text = JSON.stringify(v);
  assert.doesNotMatch(text, /effekt|qrId|kuerzel/);
});

// ------------------------------------------------------------------ Regal und Kauf

function mitWare() {
  const u = bereit(fest([{ tag: 1, felder: ['P10', 'P5', 'x3', '-'] }]));
  u.zeilen('Ware', [
    { 'ID': 'W01', 'Titel': 'Kaffee', 'Beschreibung': 'Heiss', 'Illustration': 'kaffee', 'Preis': '40', 'Zustand': 'sichtbar', 'Bestand': '1', 'Inhalt-Art': 'text', 'Inhalt': 'Gutschein für einen Kaffee' },
    { 'ID': 'W02', 'Titel': 'Geheimer Titel', 'Beschreibung': 'Geheim', 'Illustration': 'konzert', 'Preis': '90', 'Zustand': 'eingeschweisst', 'Inhalt-Art': 'link', 'Inhalt': 'https://example.org/karten' },
    { 'ID': 'W03', 'Titel': 'Später', 'Preis': '10', 'Zustand': 'sichtbar', 'Sichtbar ab': '10.12.2026' },
    { 'ID': 'W04', 'Titel': 'Aktion', 'Preis': '10', 'Zustand': 'sichtbar', 'Aktion bis': '2026-12-03' },
    { 'ID': 'W05', 'Titel': 'Weg', 'Preis': '10', 'Zustand': 'ausverkauft' },
    { 'ID': 'W06', 'Titel': 'Bild', 'Preis': '5', 'Zustand': 'sichtbar', 'Inhalt-Art': 'bild', 'Inhalt': 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view' }
  ]);
  return u;
}

test('Regal: Zustände, Daten, nichts Verborgenes im JSON', () => {
  const u = mitWare();
  u.jetzt('2026-12-01T09:00:00');
  assert.equal(u.als('spieler', 'start').neueWare, 5);
  const r = u.als('spieler', 'regal');
  assert.deepEqual(r.ware.map(w => w.id), ['W01', 'W02', 'W04', 'W05', 'W06']);
  const json = JSON.stringify(r);
  assert.doesNotMatch(json, /Geheimer Titel|Geheim"|example\.org|Gutschein|KINO/);
  const w2 = r.ware.find(w => w.id === 'W02');
  assert.equal(w2.eingeschweisst, true);
  assert.equal(w2.titel, undefined);
  assert.equal(w2.illustration, 'konzert');   // Form in der Folie erkennbar
  assert.equal(w2.preis, 90);
  assert.equal(r.ware.find(w => w.id === 'W04').aktionBis, '2026-12-03');
  assert.equal(r.ware.find(w => w.id === 'W05').ausverkauft, true);
  assert.equal(r.ware.find(w => w.id === 'W05').kaufbar, false);
  assert.equal(r.ware[0].fehlend, 40);
  assert.equal(u.als('spieler', 'start').neueWare, 0);
  u.jetzt('2026-12-10T09:00:00');
  assert.equal(u.als('spieler', 'start').neueWare, 1);
  assert.equal(u.als('spieler', 'start').sonntag, false);
  assert.deepEqual(u.als('spieler', 'regal').ware.map(w => w.id), ['W01', 'W02', 'W03', 'W05', 'W06']); // Aktion W04 vorbei
  u.jetzt('2026-12-13T09:00:00');
  assert.equal(u.als('spieler', 'start').sonntag, false);   // Sonntag nach dem letzten Los: kein Sonntagsverkauf
  assert.equal(u.als('spieler', 'oeffnen', { id: 'W01' }).fehler, 'nicht_deins');
  assert.equal(u.als('spieler', 'bild', { id: 'W06' }).fehler, 'kein_bild');
});

test('Kauf: Bestätigung, Preisprüfung, Saldo, Bestand pro Zugang, Mail, Öffnen, Storno', () => {
  const u = mitWare();
  u.jetzt('2026-12-01T09:00:00');
  assert.equal(u.als('spieler', 'kaufen', { id: 'W01', preis: 40 }).fehler, 'zu_wenig_punkte');
  u.als('admin', 'admin_buchen', { betrag: 300 });
  u.als('admin', 'admin_buchen', { betrag: 300, modus: 'test' });
  let r = u.als('spieler', 'kaufen', { id: 'W02' });
  assert.equal(r.fehler, 'bestaetigen');
  assert.equal(r.daten.preis, 90);
  assert.equal(u.als('spieler', 'kaufen', { id: 'W02', preis: 50 }).fehler, 'preis_geaendert');
  r = u.als('spieler', 'kaufen', { id: 'W01', preis: 40 });
  assert.equal(r.ok, true);
  assert.equal(r.saldo, 260);
  assert.equal(r.ware.inhalt, 'Gutschein für einen Kaffee');
  assert.equal(u.als('spieler', 'kaufen', { id: 'W01', preis: 40 }).fehler, 'ausverkauft');
  assert.equal(u.als('spieler', 'kaufen', { id: 'W05', preis: 10 }).fehler, 'ausverkauft');
  assert.equal(u.als('test', 'kaufen', { id: 'W01', preis: 40 }).ok, true);   // Testzugang hat eigenen Bestand
  assert.equal(u.mails.length, 2);
  assert.match(u.mails[0].betreff, /Kaffee/);
  assert.match(u.mails[0].text, /Zeitpunkt: 2026-12-01 09:00/);
  assert.match(u.mails[1].betreff, /^\[Test\]/);
  r = u.als('spieler', 'kaufen', { id: 'W02', preis: 90 });
  assert.equal(r.ware.titel, 'Geheimer Titel');
  const w2 = u.als('spieler', 'regal').ware.find(w => w.id === 'W02');
  assert.equal(w2.titel, 'Geheimer Titel');    // nach dem Kauf ausgepackt
  assert.equal(w2.eingeschweisst, false);
  assert.equal(w2.gehoert, true);
  assert.equal(u.als('spieler', 'oeffnen', { id: 'W02' }).ware.inhalt, 'https://example.org/karten');
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W02')['Gehört ihr'], 'ja');
  // Admin: erledigt und Storno
  const best = u.als('admin', 'admin_uebersicht').bestellungen;
  assert.equal(best.length, 2);
  assert.equal(u.als('admin', 'admin_bestellung', { id: best[1].id, status: 'erledigt' }).ok, true);
  const s = u.als('admin', 'admin_bestellung', { id: best[0].id, status: 'storniert' });
  assert.equal(s.saldo, 260);
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W02')['Gehört ihr'], '');
  assert.equal(u.als('admin', 'admin_bestellung', { id: best[0].id, status: 'storniert' }).fehler, 'eingabe');
});

test('Admin: Ware anlegen, ändern, löschen', () => {
  const u = mitWare();
  let r = u.als('admin', 'admin_ware_speichern', { ware: { titel: 'Neu', preis: '25', zustand: 'sichtbar', illustration: 'pflanze', ab: '6.12.2026' } });
  assert.equal(r.id, 'W94');
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W94')['Sichtbar ab'], '2026-12-06');
  r = u.als('admin', 'admin_ware_speichern', { ware: { id: 'W94', titel: 'Neu 2', preis: 30, zustand: 'eingeschweisst' } });
  assert.equal(u.tabelle('Ware').find(w => w['ID'] === 'W94')['Titel'], 'Neu 2');
  assert.equal(u.als('admin', 'admin_ware_speichern', { ware: { titel: 'x', preis: 'viel' } }).fehler, 'eingabe');
  assert.equal(u.als('admin', 'admin_ware_speichern', { ware: { titel: 'x', preis: 1, zustand: 'kaputt' } }).fehler, 'eingabe');
  assert.equal(u.als('admin', 'admin_ware').ware.length, 11);
  assert.equal(u.als('admin', 'admin_ware_loeschen', { id: 'W94' }).ok, true);
  assert.equal(u.tabelle('Ware').length, 10);
});

test('Jackpot und Serienbonus aus', () => {
  const u = bereit(fest([1, 2, 3].map(tag => ({ tag, felder: ['P100', 'P10', '-', '-'] }))));
  u.als('admin', 'admin_einstellungen', { werte: { 'Serienbonus an': 'nein', 'Jackpot ab': '105' } });
  for (const tag of [1, 2, 3]) {
    u.jetzt(`2026-12-0${tag}T09:00:00`);
    const f = u.felder(tag);
    const r = einreichen(u, 'spieler', tag === 3 ? [f[1].qrId, f[2].qrId] : [f[0].qrId, f[1].qrId]);
    assert.equal(r.ergebnis.serienbonus, 0);
    assert.equal(r.ergebnis.jackpot, tag !== 3);
  }
});

// ------------------------------------------------------------------ Befunde der Code-Prüfung

test('Blätter schrumpfen nicht: 15-mal Lose erzeugen und Testdaten löschen', () => {
  const u = bereit();
  for (let i = 0; i < 15; i++) {
    u.jetzt('2026-12-01T09:00:00');
    const f = u.felder(1);
    assert.equal(u.als('test', 'einreichen', { codes: [f[0].qrId, f[1].qrId] }).ok, true);
    const r = u.als('admin', 'admin_generieren', { konfiguration: BEISPIEL });
    assert.equal(r.ok, true, 'Durchlauf ' + i + ': ' + r.text);
    assert.equal(u.tabelle('Felder').length, 96);
  }
  assert.ok(u.sheets['Felder'].getMaxRows() >= 1000);
  assert.equal(u.tabelle('Einsendungen').length, 0);
});

test('Eingeschweisste Ware als Sofortgewinn verrät ihren Titel nicht', () => {
  const u = bereit(fest([{ tag: 1, felder: ['S:W90', 'P5', 'x3', '-'] }]));
  const w = u.sheets['Ware'];
  const kopf = w.rows[0];
  const z = w.rows.find(r => r[0] === 'W90');
  z[kopf.indexOf('Zustand')] = 'eingeschweisst';
  u.jetzt('2026-12-01T09:00:00');
  const f = u.felder(1);
  const r = einreichen(u, 'spieler', [f[1].qrId, f[2].qrId]);   // Sofortgewinn nicht gerubbelt
  assert.doesNotMatch(JSON.stringify(r), /Kinogutschein/);
  assert.equal(r.ergebnis.felder[0].geschenk, 'Eingeschweisste Ware');
});

test('Serie zeigt 0, wenn das heutige Los ungültig war', () => {
  const u = bereit(fest([1, 2].map(tag => ({ tag, felder: ['P10', 'P10', '-', '-'] }))));
  u.jetzt('2026-12-01T09:00:00');
  let f = u.felder(1);
  einreichen(u, 'spieler', [f[0].qrId, f[1].qrId]);
  u.jetzt('2026-12-02T09:00:00');
  f = u.felder(2);
  einreichen(u, 'spieler', [f[0].qrId, f[1].qrId, f[2].qrId]);
  assert.equal(u.als('spieler', 'start').serie, 0);
});
