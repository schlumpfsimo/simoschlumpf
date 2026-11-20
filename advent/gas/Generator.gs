/**
 * Generator.gs – erzeugt die Lose aus einer Konfiguration (JSON) und schreibt sie ins Sheet.
 *
 * Die Konfiguration fügst du auf der Admin-Seite ein (Reiter «Lose erzeugen»). Sie wird im Blatt
 * «Konfiguration» gespeichert und liegt nie im öffentlichen Repo. Beispiel: advent/beispiel-konfiguration.json
 *
 * Aufbau:
 * {
 *   "start": "2026-12-01",            Datum von Tag 1; Tag n = start + n − 1 (oder "datum" pro Los)
 *   "mischen": true,                  Effekte zufällig auf die Felder 1–4 verteilen (Standard: ja)
 *   "typen": {                        Standard pro Typ
 *     "normal": { "felderzahl": 2, "regel": "Rubble genau 2 der 4 Felder frei." },
 *     "quiz":   { "felderzahl": 1, "regel": "Rubble nur das Feld mit der richtigen Antwort frei." }
 *   },
 *   "lose": [
 *     { "tag": 1, "typ": "normal", "felder": ["P10", "P5", "x2", "-"] },
 *     { "tag": 6, "typ": "quiz", "frage": "Wie heisst …?", "felder": [
 *         { "antwort": "Basel", "richtig": true, "effekt": "punkte", "wert": 40 },
 *         { "antwort": "Kehl" }, { "antwort": "Colmar" }, { "antwort": "Freiburg" } ] }
 *   ]
 * }
 *
 * Kurzschreibweise für Felder:  "P10" = 10 Punkte,  "x2" = Multiplikator 2,
 *   "S:W01" = Sofortgewinn: Ware W01 (muss im Blatt «Ware» stehen),  "-" = Niete.
 * Langform: { "effekt": "punkte"|"multiplikator"|"sofortgewinn"|"niete", "wert": 10, "ware": "W01",
 *             "antwort": "Text neben dem Feld (Quiz)", "richtig": true }
 * Pro Los sind auch "regel" und "felderzahl" möglich; sie überschreiben den Standard des Typs.
 */

var FELDER_PRO_LOS = 4;

function feldLesen_(f, wo, fehlerliste) {
  if (typeof f === 'string') {
    var s = f.trim();
    var m;
    if (s === '-' || s === '' || /^niete$/i.test(s)) return { effekt: 'niete', wert: 0 };
    if ((m = s.match(/^P\s*(-?\d+)$/i))) return { effekt: 'punkte', wert: Number(m[1]) };
    if ((m = s.match(/^[x×]\s*(\d+(?:[.,]\d+)?)$/i))) return { effekt: 'multiplikator', wert: Number(m[1].replace(',', '.')) };
    if ((m = s.match(/^S\s*:\s*(.+)$/i))) return { effekt: 'sofortgewinn', wert: 0, ware: m[1].trim() };
    fehlerliste.push(wo + ': «' + s + '» verstehe ich nicht (erlaubt: P10, x2, S:W01, -).');
    return { effekt: 'niete', wert: 0 };
  }
  f = f || {};
  var effekt = String(f.effekt || (f.richtig ? 'punkte' : 'niete')).toLowerCase();
  if (EFFEKTE.indexOf(effekt) < 0) fehlerliste.push(wo + ': unbekannter Effekt «' + effekt + '».');
  var wert = f.wert == null ? 0 : Number(f.wert);
  if (isNaN(wert)) { fehlerliste.push(wo + ': Wert ist keine Zahl.'); wert = 0; }
  if (effekt === 'multiplikator' && !(wert > 0)) fehlerliste.push(wo + ': Multiplikator braucht einen Wert > 0.');
  var ware = f.ware || f.geschenk || '';
  if (effekt === 'sofortgewinn' && !ware) fehlerliste.push(wo + ': Sofortgewinn braucht "ware" (ID aus dem Blatt «Ware»).');
  return { effekt: effekt, wert: wert, ware: ware, antwort: f.antwort || '', richtig: !!f.richtig };
}

/** Prüft die Konfiguration und baut daraus Lose und Felder (noch ohne zu schreiben). */
function konfigurationVerarbeiten_(k) {
  var fehlerliste = [];
  if (!k || !Array.isArray(k.lose) || !k.lose.length) throw fehler_('konfiguration', 'Die Konfiguration braucht eine Liste "lose".');
  var start = datumLesen_(k.start || '');
  var typen = k.typen || {};
  var wareIds = lesen_('Ware').map(function (o) { return o['ID']; });
  var tageGesehen = {};
  var lose = [], felder = [];
  var kuerzelGesehen = {};

  k.lose.forEach(function (l, i) {
    var wo = 'Los ' + (l.tag || ('#' + (i + 1)));
    var tag = Number(l.tag);
    if (!(tag >= 1 && tag <= 31 && Math.floor(tag) === tag)) { fehlerliste.push(wo + ': "tag" muss 1 bis 31 sein.'); return; }
    if (tageGesehen[tag]) fehlerliste.push(wo + ': Tag kommt doppelt vor.');
    tageGesehen[tag] = true;
    var typ = String(l.typ || 'normal').toLowerCase();
    if (TYPEN.indexOf(typ) < 0) fehlerliste.push(wo + ': unbekannter Typ «' + typ + '» (normal, quiz, sonntag).');
    var std = typen[typ] || {};
    var felderzahl = Number(l.felderzahl || std.felderzahl || (typ === 'quiz' ? 1 : 2));
    if (!(felderzahl >= 1 && felderzahl <= FELDER_PRO_LOS)) fehlerliste.push(wo + ': Felderzahl muss 1 bis 4 sein.');
    var datum = datumLesen_(l.datum || '') || (start ? tageAddieren_(start, tag - 1) : '');
    if (!datum) fehlerliste.push(wo + ': kein Datum (setze "start" oder "datum").');
    var regel = l.regel || std.regel || '';
    if (!Array.isArray(l.felder) || l.felder.length !== FELDER_PRO_LOS) {
      fehlerliste.push(wo + ': braucht genau ' + FELDER_PRO_LOS + ' Felder.');
      return;
    }
    var fs = l.felder.map(function (f, j) { return feldLesen_(f, wo + ', Feld ' + (j + 1), fehlerliste); });
    fs.forEach(function (f, j) {
      if (f.effekt === 'sofortgewinn' && wareIds.indexOf(f.ware) < 0) {
        fehlerliste.push(wo + ', Feld ' + (j + 1) + ': Ware «' + f.ware + '» fehlt im Blatt «Ware».');
      }
    });
    if (typ === 'quiz') {
      var richtige = fs.filter(function (f) { return f.richtig; }).length;
      if (richtige < 1) fehlerliste.push(wo + ': Quiz braucht mindestens eine Antwort mit "richtig": true.');
      if (!l.frage) fehlerliste.push(wo + ': Quiz braucht eine "frage".');
      if (fs.some(function (f) { return !f.antwort; })) fehlerliste.push(wo + ': Beim Quiz braucht jedes Feld eine "antwort".');
    }
    var mischen = l.mischen != null ? !!l.mischen : (k.mischen != null ? !!k.mischen : true);
    if (mischen) fs = mischen_(fs);

    lose.push({ 'Tag': tag, 'Datum': datum, 'Typ': typ, 'Regeltext': regel, 'Felderzahl': felderzahl, 'Quizfrage': l.frage || '' });
    fs.forEach(function (f, j) {
      var kz;
      do { kz = zufall_(4); } while (kuerzelGesehen[kz]);
      kuerzelGesehen[kz] = true;
      felder.push({
        'Tag': tag, 'Feld': j + 1, 'QR-ID': kz + '-' + zufall_(8), 'Kürzel': kz, 'Beschriftung': f.antwort || '',
        'Effekt': f.effekt, 'Wert': f.wert || '', 'Ware-ID': f.ware || '', 'Richtig': f.richtig ? 'ja' : ''
      });
    });
  });

  if (fehlerliste.length) throw fehler_('konfiguration', 'Die Konfiguration hat Fehler:\n' + fehlerliste.join('\n'), { fehler: fehlerliste });
  lose.sort(function (a, b) { return a['Tag'] - b['Tag']; });
  felder.sort(function (a, b) { return a['Tag'] - b['Tag'] || a['Feld'] - b['Feld']; });
  return { lose: lose, felder: felder };
}

/** Zufällige Reihenfolge (Fisher-Yates mit der Zufallsquelle aus Daten.gs). */
function mischen_(liste) {
  var a = liste.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var n = i + 1, grenze = Math.floor(ALPHABET.length / n) * n, r;
    do { r = ALPHABET.indexOf(zufall_(1)); } while (r >= grenze); // gleichverteilt
    var j = r % n;
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/** Übersicht: was pro Los möglich ist (zum Prüfen der Verteilung). */
function zusammenfassung_(lose, felder) {
  var summe = { minimal: 0, maximal: 0, sofortgewinne: 0 };
  var proLos = lose.map(function (l) {
    var fs = felder.filter(function (f) { return f['Tag'] === l['Tag']; }).map(function (f) {
      return { feld: f['Feld'], effekt: f['Effekt'], wert: zahl_(f['Wert']), wareId: f['Ware-ID'], richtig: f['Richtig'] === 'ja' };
    });
    // alle Kombinationen mit genau «Felderzahl» Feldern durchrechnen
    var los = { typ: l['Typ'], felderzahl: zahl_(l['Felderzahl']) };
    var werte = kombinationen_(fs, los.felderzahl).map(function (k) {
      var e = berechnen_(los, k);
      return e.losPunkte;
    });
    var min = Math.min.apply(null, werte), max = Math.max.apply(null, werte);
    var sg = fs.filter(function (f) { return f.effekt === 'sofortgewinn'; }).length;
    summe.minimal += min; summe.maximal += max; summe.sofortgewinne += sg;
    return { tag: l['Tag'], datum: l['Datum'], typ: l['Typ'], felderzahl: los.felderzahl,
             felder: fs.map(function (f) { return f.effekt === 'punkte' ? 'P' + f.wert : f.effekt === 'multiplikator' ? 'x' + f.wert :
               f.effekt === 'sofortgewinn' ? 'S:' + f.wareId : '-'; }),
             minimal: min, maximal: max, sofortgewinne: sg };
  });
  return { lose: proLos, summe: summe };
}

function kombinationen_(liste, k) {
  if (k === 0) return [[]];
  if (liste.length < k) return [];
  var erst = liste[0], rest = liste.slice(1);
  return kombinationen_(rest, k - 1).map(function (c) { return [erst].concat(c); }).concat(kombinationen_(rest, k));
}

/**
 * Admin-Aktion. a.konfiguration = JSON-Text oder Objekt.
 * a.nurPruefen = true: nur prüfen und Übersicht zeigen, nichts schreiben.
 * a.ueberschreiben = true: auch dann neu erzeugen, wenn die Spielerin schon Lose eingereicht hat.
 */
function adminGenerieren_(ctx, a) {
  var k = a.konfiguration;
  if (typeof k === 'string') {
    try { k = JSON.parse(k); } catch (x) { throw fehler_('konfiguration', 'Die Konfiguration ist kein gültiges JSON: ' + x.message); }
  }
  var erg = konfigurationVerarbeiten_(k);
  var uebersicht = zusammenfassung_(erg.lose, erg.felder);
  if (a.nurPruefen) return { geprueft: true, uebersicht: uebersicht };

  return gesperrt_(function () {
    var gespielt = lesen_('Einsendungen').filter(function (o) {
      return o['Modus'] === 'echt' && o['Status'] !== STATUS.ZURUECK;
    }).length;
    if (gespielt && !a.ueberschreiben) {
      throw fehler_('schon_gespielt', 'Die Spielerin hat schon ' + gespielt + ' Los(e) eingereicht. ' +
        'Neue Lose machen die gedruckten ungültig. Nur mit «trotzdem überschreiben».');
    }
    leeren_('Lose');
    leeren_('Felder');
    anhaengenViele_('Lose', erg.lose);
    anhaengenViele_('Felder', erg.felder);
    // Konfiguration aufbewahren, damit du sie später wieder bearbeiten kannst
    var sh = blatt_('Konfiguration');
    sh.getRange(2, 1).setNumberFormat('@');
    sh.getRange(2, 1).setValues([[JSON.stringify(k, null, 2)]]);
    delete _cache['Konfiguration'];
    // Testdaten beziehen sich auf die alten Codes und werden gelöscht
    var geloescht = testdatenLoeschen_();
    return { geschrieben: true, lose: erg.lose.length, felder: erg.felder.length, uebersicht: uebersicht, testdaten: geloescht.geloescht };
  });
}

function adminKonfiguration_() {
  var z = lesen_('Konfiguration')[0];
  return { konfiguration: z ? z[BLAETTER.Konfiguration[0]] : '' };
}
