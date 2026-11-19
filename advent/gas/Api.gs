/**
 * Api.gs – Eingang der Web-App.
 *
 * Das Frontend schickt  fetch(URL, {method:'POST', headers:{'Content-Type':'text/plain'}, body: JSON})
 * Body: { aktion: 'start', token: '…', … }
 * Antwort: { ok: true, … }  oder  { ok: false, fehler: 'code', text: 'Meldung', daten: {…} }
 *
 * Zugänge (Skripteigenschaften, werden von einrichten() erzeugt):
 *   SPIELER_TOKEN  die Spielerin (Modus «echt»)
 *   TEST_TOKEN     dein Testzugang (Modus «test», eigene Daten, Testdatum gilt)
 *   ADMIN_TOKEN    Admin-Seite
 */

/** Aktionen der Spielerin (und des Testzugangs). */
var AKTIONEN = {
  start: aktionStart_,
  verlauf: aktionVerlauf_,
  einreichen: aktionEinreichen_,
  foto: aktionFoto_,
  regal: aktionRegal_,
  kaufen: aktionKaufen_,
  oeffnen: aktionOeffnen_,
  bild: aktionBild_
};

/** Aktionen der Admin-Seite (Admin-Token nötig). */
var ADMIN_AKTIONEN = {
  admin_uebersicht: adminUebersicht_,
  admin_lose: adminLose_,
  admin_foto: adminFoto_,
  admin_ergebnis: adminErgebnis_,
  admin_buchen: adminBuchen_,
  admin_bestellung: adminBestellung_,
  admin_einstellungen: adminEinstellungen_,
  admin_zuruecksetzen: adminZuruecksetzen_,
  admin_testdaten_loeschen: adminTestdatenLoeschen_,
  admin_generieren: adminGenerieren_,
  admin_konfiguration: adminKonfiguration_,
  admin_druck: adminDruck_,
  admin_ware: adminWare_,
  admin_ware_speichern: adminWareSpeichern_,
  admin_ware_loeschen: adminWareLoeschen_
};

function doGet() {
  return json_({ ok: true, dienst: 'rubbellos', hinweis: 'Diese Adresse wird von der Webseite per POST genutzt.' });
}

function doPost(e) {
  return json_(verarbeiten_(e && e.postData ? e.postData.contents : ''));
}

/** Verarbeitet eine Anfrage (Text) und gibt ein Antwortobjekt zurück. Auch von Tests genutzt. */
function verarbeiten_(text) {
  tabelleLeeren_();
  try {
    var anfrage;
    try { anfrage = JSON.parse(text || '{}'); }
    catch (x) { throw fehler_('anfrage', 'Die Anfrage war unlesbar.'); }
    var ctx = zugang_(anfrage.token);
    var aktion = String(anfrage.aktion || '');
    var f;
    if (ctx.admin) {
      f = ADMIN_AKTIONEN[aktion];
      // Der Admin wählt mit anfrage.modus, welche Daten er sieht (echt oder test).
      ctx.modus = anfrage.modus === 'test' ? 'test' : 'echt';
    } else {
      f = AKTIONEN[aktion];
    }
    if (!f) throw fehler_('aktion', 'Unbekannte Aktion «' + aktion + '».');
    ctx.heute = heute_(ctx);
    var antwort = f(ctx, anfrage) || {};
    antwort.ok = true;
    return antwort;
  } catch (err) {
    if (err && err.istFehler) return { ok: false, fehler: err.code, text: err.message, daten: err.daten || {} };
    console.error(err && err.stack ? err.stack : err);
    return { ok: false, fehler: 'server', text: 'Auf dem Server ist etwas schiefgegangen: ' + (err && err.message ? err.message : err) };
  }
}

/** Prüft das Token. */
function zugang_(token) {
  var p = PropertiesService.getScriptProperties();
  token = String(token || '');
  if (token.length >= 16) {
    if (token === p.getProperty('SPIELER_TOKEN')) return { modus: 'echt', admin: false };
    if (token === p.getProperty('TEST_TOKEN')) return { modus: 'test', admin: false };
    if (token === p.getProperty('ADMIN_TOKEN')) return { modus: 'echt', admin: true };
  }
  throw fehler_('token', 'Dieser Link ist ungültig. Bitte den Link aus der Nachricht nochmals öffnen.');
}

/** Erzeugt einen erwarteten Fehler, der als {ok:false} beim Frontend ankommt. */
function fehler_(code, text, daten) {
  var e = new Error(text);
  e.istFehler = true;
  e.code = code;
  e.daten = daten;
  return e;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Führt fn unter der Skriptsperre aus (verhindert doppelte Buchungen bei gleichzeitigen Anfragen). */
function gesperrt_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw fehler_('besetzt', 'Der Server ist gerade beschäftigt. Bitte nochmals versuchen.');
  try { tabelleLeeren_(); return fn(); }
  finally { lock.releaseLock(); }
}
