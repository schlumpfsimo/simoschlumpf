/**
 * Daten.gs – Zugriff auf das Google Sheet.
 *
 * Alle Tabellenblätter sind als «Nur Text» formatiert (siehe Einrichten.gs). Werte werden
 * immer als Text gelesen (getDisplayValues) und als Text geschrieben. So wandelt Google
 * Sheets weder Kürzel wie «2E34» in Zahlen noch «2026-12-01» in ein Datum um.
 *
 * Jede Zeile wird als Objekt geliefert: { 'Spaltenkopf': 'Wert', ..., _zeile: 5 }.
 * _zeile ist die Zeilennummer im Blatt (1 = Kopfzeile).
 */

/** Spalten jedes Tabellenblatts. Reihenfolge = Reihenfolge im Blatt. */
var BLAETTER = {
  Lose: ['Tag', 'Datum', 'Typ', 'Regeltext', 'Felderzahl', 'Quizfrage'],
  Felder: ['Tag', 'Feld', 'QR-ID', 'Kürzel', 'Beschriftung', 'Effekt', 'Wert', 'Geschenk-ID', 'Richtig'],
  Einsendungen: ['ID', 'Zeitstempel', 'Modus', 'Spieldatum', 'Tag', 'Codes', 'Manuell', 'Foto-ID',
                 'Punkte', 'Ergebnis', 'Status', 'Notiz'],
  Buchungen: ['Zeitstempel', 'Modus', 'Grund', 'Betrag', 'Saldo', 'Bezug'],
  Katalog: ['ID', 'Titel', 'Beschreibung', 'Bild', 'Preis', 'Sichtbarkeit', 'Sichtbar ab',
            'Verfügbar bis', 'Bestand', 'Geschenk-ID'],
  Geschenke: ['ID', 'Titel', 'Art', 'Inhalt', 'Beschreibung'],
  Erhalten: ['ID', 'Zeitstempel', 'Modus', 'Quelle', 'Bezug', 'Geschenk-ID'],
  Bestellungen: ['ID', 'Zeitstempel', 'Modus', 'Katalog-ID', 'Titel', 'Preis', 'Status'],
  Einstellungen: ['Schlüssel', 'Wert', 'Erklärung'],
  Konfiguration: ['Los-Konfiguration (JSON, wird vom Admin gespeichert)']
};

/** Zwischenspeicher pro Anfrage, damit ein Blatt nur einmal gelesen wird. */
var _cache = {};

function tabelleLeeren_() { _cache = {}; }

function ss_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    ss = SpreadsheetApp.openById(id);
  }
  return ss;
}

function blatt_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw fehler_('einrichtung', 'Das Tabellenblatt «' + name + '» fehlt. Bitte einrichten() ausführen.');
  return sh;
}

/** Liest ein Blatt als Liste von Objekten (leere Zeilen werden übersprungen). */
function lesen_(name) {
  if (_cache[name]) return _cache[name];
  var werte = blatt_(name).getDataRange().getDisplayValues();
  var kopf = werte[0] || [];
  var zeilen = [];
  for (var i = 1; i < werte.length; i++) {
    var r = werte[i];
    if (r.join('').trim() === '') continue;
    var o = { _zeile: i + 1 };
    for (var j = 0; j < kopf.length; j++) o[kopf[j]] = String(r[j] == null ? '' : r[j]).trim();
    zeilen.push(o);
  }
  _cache[name] = zeilen;
  return zeilen;
}

/** Wandelt ein Objekt in eine Zeile in Spaltenreihenfolge um. */
function zeileAus_(name, obj) {
  return BLAETTER[name].map(function (k) { return obj[k] == null ? '' : String(obj[k]); });
}

/** Hängt eine Zeile an. */
function anhaengen_(name, obj) {
  var sh = blatt_(name);
  var zeile = zeileAus_(name, obj);
  var nr = sh.getLastRow() + 1;
  var r = sh.getRange(nr, 1, 1, zeile.length);
  r.setNumberFormat('@');
  r.setValues([zeile]);
  delete _cache[name];
  obj._zeile = nr;
  return obj;
}

/** Schreibt mehrere Zeilen auf einmal ans Ende (schneller als einzeln). */
function anhaengenViele_(name, objs) {
  if (!objs.length) return;
  var sh = blatt_(name);
  var zeilen = objs.map(function (o) { return zeileAus_(name, o); });
  var r = sh.getRange(sh.getLastRow() + 1, 1, zeilen.length, zeilen[0].length);
  r.setNumberFormat('@');
  r.setValues(zeilen);
  delete _cache[name];
}

/** Überschreibt eine bestehende Zeile (obj._zeile muss gesetzt sein). */
function aktualisieren_(name, obj) {
  var zeile = zeileAus_(name, obj);
  var r = blatt_(name).getRange(obj._zeile, 1, 1, zeile.length);
  r.setNumberFormat('@');
  r.setValues([zeile]);
  delete _cache[name];
}

/** Löscht alle Zeilen, auf die die Bedingung zutrifft. Gibt die Anzahl zurück. */
function loeschenWo_(name, bedingung) {
  var sh = blatt_(name);
  var treffer = lesen_(name).filter(bedingung).map(function (o) { return o._zeile; });
  treffer.sort(function (a, b) { return b - a; }); // von unten nach oben löschen
  treffer.forEach(function (nr) { sh.deleteRows(nr, 1); });
  delete _cache[name];
  return treffer.length;
}

/** Löscht alle Datenzeilen eines Blatts (Kopfzeile bleibt). */
function leeren_(name) {
  var sh = blatt_(name);
  var n = sh.getLastRow();
  if (n > 1) sh.deleteRows(2, n - 1);
  delete _cache[name];
}

// ------------------------------------------------------------------ Einstellungen

/** Standardwerte der Einstellungen. Werden bei einrichten() ins Blatt geschrieben. */
var EINSTELLUNGEN_STANDARD = [
  ['Zeitzone', 'Europe/Zurich', 'Zeitzone für das Tagesdatum.'],
  ['Testdatum', '', 'Simuliertes Datum (z. B. 2026-12-05). Gilt nur für den Testzugang, nie für die Spielerin.'],
  ['Nachholen erlaubt', 'ja', 'ja/nein: Dürfen frühere Lose nachgeholt werden?'],
  ['Serienbonus', '5', 'Bonuspunkte pro Los, wenn die Serie lang genug ist (0 = aus).'],
  ['Serienbonus ab', '3', 'Ab so vielen Tagen in Folge gibt es den Serienbonus.'],
  ['E-Mail', '', 'Empfänger der Bestell-Mails. Leer = Konto, unter dem das Skript läuft.']
];

function einstellung_(schluessel) {
  var z = lesen_('Einstellungen').filter(function (o) { return o['Schlüssel'] === schluessel; })[0];
  if (z) return z['Wert'];
  var std = EINSTELLUNGEN_STANDARD.filter(function (e) { return e[0] === schluessel; })[0];
  return std ? std[1] : '';
}

function einstellungSetzen_(schluessel, wert) {
  var z = lesen_('Einstellungen').filter(function (o) { return o['Schlüssel'] === schluessel; })[0];
  if (z) { z['Wert'] = wert; aktualisieren_('Einstellungen', z); }
  else {
    var std = EINSTELLUNGEN_STANDARD.filter(function (e) { return e[0] === schluessel; })[0];
    anhaengen_('Einstellungen', { 'Schlüssel': schluessel, 'Wert': wert, 'Erklärung': std ? std[2] : '' });
  }
}

function jaNein_(s) { return /^(ja|j|yes|true|1|x)$/i.test(String(s || '').trim()); }

// ------------------------------------------------------------------ Zeit und Datum

/** Jetzt. Eigene Funktion, damit Tests die Zeit verstellen können. */
function jetzt_() { return new Date(); }

function zeitzone_() { return einstellung_('Zeitzone') || 'Europe/Zurich'; }

function zeitstempel_() { return Utilities.formatDate(jetzt_(), zeitzone_(), 'yyyy-MM-dd HH:mm:ss'); }

/** Heutiges Spieldatum (yyyy-MM-dd). Im Testzugang gilt das Testdatum, falls gesetzt. */
function heute_(ctx) {
  if (ctx && ctx.modus === 'test') {
    var t = datumLesen_(einstellung_('Testdatum'));
    if (t) return t;
  }
  return Utilities.formatDate(jetzt_(), zeitzone_(), 'yyyy-MM-dd');
}

/** Liest «2026-12-01», «1.12.2026» oder «01.12.2026». Gibt yyyy-MM-dd oder '' zurück. */
function datumLesen_(s) {
  s = String(s || '').trim();
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + zwei_(m[2]) + '-' + zwei_(m[3]);
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return m[3] + '-' + zwei_(m[2]) + '-' + zwei_(m[1]);
  return '';
}

function zwei_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

/** Addiert Tage zu einem Datum yyyy-MM-dd (ohne Zeitzonen-Probleme). */
function tageAddieren_(iso, n) {
  var p = iso.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.getUTCFullYear() + '-' + zwei_(d.getUTCMonth() + 1) + '-' + zwei_(d.getUTCDate());
}

// ------------------------------------------------------------------ Zufall

/** Alphabet für Kürzel und QR-IDs: ohne 0, O, 1, I, L (leicht zu verwechseln). */
var ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Zufällige Zeichenkette aus dem Alphabet. Nutzt UUIDs als Zufallsquelle. */
function zufall_(laenge) {
  var s = '';
  while (s.length < laenge) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    for (var i = 0; i + 4 <= hex.length && s.length < laenge; i += 4) {
      var n = parseInt(hex.substr(i, 4), 16);           // 0..65535
      if (n >= 65536 - (65536 % ALPHABET.length)) continue; // gleichverteilt
      s += ALPHABET.charAt(n % ALPHABET.length);
    }
  }
  return s;
}

function neueId_() { return zufall_(10); }
