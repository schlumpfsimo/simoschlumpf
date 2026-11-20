/**
 * Einrichten.gs – einmalig im Apps-Script-Editor ausführen: Funktion «einrichten» wählen, ▶ Ausführen.
 *
 * Legt fehlende Tabellenblätter mit Kopfzeile an, formatiert alles als Text, schreibt die
 * Standard-Einstellungen, erzeugt die drei Zugangsschlüssel und den Drive-Ordner für die Fotos.
 * Kann gefahrlos mehrmals ausgeführt werden: Bestehendes bleibt, nur Fehlendes kommt dazu.
 * Die Links stehen danach im Ausführungsprotokoll.
 */
function einrichten() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = PropertiesService.getScriptProperties();
  p.setProperty('SHEET_ID', ss.getId());

  Object.keys(BLAETTER).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    var kopf = BLAETTER[name];
    sh.getRange(1, 1, sh.getMaxRows(), Math.max(kopf.length, 1)).setNumberFormat('@');
    sh.getRange(1, 1, 1, kopf.length).setValues([kopf]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  // Leeres Standardblatt «Tabelle1» / «Sheet1» entfernen, falls vorhanden und leer
  ['Tabelle1', 'Sheet1', 'Feuille 1'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });

  tabelleLeeren_();
  var vorhanden = lesen_('Einstellungen').map(function (o) { return o['Schlüssel']; });
  EINSTELLUNGEN_STANDARD.forEach(function (e) {
    if (vorhanden.indexOf(e[0]) < 0) anhaengen_('Einstellungen', { 'Schlüssel': e[0], 'Wert': e[1], 'Erklärung': e[2] });
  });

  ['SPIELER_TOKEN', 'TEST_TOKEN', 'ADMIN_TOKEN'].forEach(function (k) {
    if (!p.getProperty(k)) p.setProperty(k, zufall_(24));
  });

  if (!p.getProperty('ORDNER_ID')) {
    var ordner = DriveApp.createFolder('Rubbellos Fotos');
    p.setProperty('ORDNER_ID', ordner.getId());
  }

  zugaengeAnzeigen();
}

/**
 * Zeigt die Links im Ausführungsprotokoll. SEITE unten anpassen, falls die Seite anderswo liegt.
 */
function zugaengeAnzeigen() {
  var SEITE = 'https://www.simoschlumpf.ch/advent/';
  var p = PropertiesService.getScriptProperties();
  console.log('Spielerin:   ' + SEITE + '?t=' + p.getProperty('SPIELER_TOKEN'));
  console.log('Testzugang:  ' + SEITE + '?t=' + p.getProperty('TEST_TOKEN'));
  console.log('Admin:       ' + SEITE + 'admin.html?t=' + p.getProperty('ADMIN_TOKEN'));
  console.log('Fotos:       https://drive.google.com/drive/folders/' + p.getProperty('ORDNER_ID'));
}

/**
 * Notfall: neuen Spielerinnen-Link erzeugen (der alte gilt danach nicht mehr).
 * Gleiches für TEST_TOKEN oder ADMIN_TOKEN: Namen unten ändern.
 */
function spielerLinkErneuern() {
  PropertiesService.getScriptProperties().setProperty('SPIELER_TOKEN', zufall_(24));
  zugaengeAnzeigen();
}
