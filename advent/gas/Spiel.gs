/**
 * Spiel.gs – Spielregeln: Lose, Einsendungen, Punkte, Serie.
 *
 * Regeln (Kurzfassung):
 * - Ein Los wird erst ab seinem Datum angenommen (Europe/Zurich). Frühere Lose dürfen
 *   nachgeholt werden, wenn «Nachholen erlaubt» = ja.
 * - Die Spielerin muss genau «Felderzahl» Felder rubbeln (normal 2, quiz 1).
 *   Weniger erkannt: Einsendung wird abgelehnt, nichts verbraucht (sie kann korrigieren).
 *   Mehr erkannt: Los ungültig, 0 Punkte, Los ist verbraucht.
 * - Quiz: Nur das richtige Feld zählt.
 * - Punkte des Loses = Summe der Punktefelder × Produkt der Multiplikatoren.
 * - Serienbonus: Wird ein Los an seinem eigenen Tag gültig eingereicht und war das an den
 *   Vortagen ebenso, zählt die Serie hoch. Ab «Serienbonus ab» Tagen gibt es «Serienbonus» Punkte.
 *   Nachgeholte Lose zählen nicht für die Serie. Der Multiplikator wirkt nicht auf den Bonus.
 * - Pro Los gibt es eine Einsendung. Der Admin kann sie zurücksetzen.
 */

var STATUS = {
  GUELTIG: 'gültig',
  UNGUELTIG: 'ungültig',
  ADMIN: 'vom Admin geändert',
  ZURUECK: 'zurückgesetzt'
};

var EFFEKTE = ['punkte', 'multiplikator', 'sofortgewinn', 'niete'];
var TYPEN = ['normal', 'quiz', 'sonntag'];

// ------------------------------------------------------------------ Lesen

function zahl_(s, std) {
  var t = String(s == null ? '' : s).trim().replace(',', '.').replace(/['’\s]/g, '');
  var n = Number(t);
  return isNaN(n) || t === '' ? (std === undefined ? 0 : std) : n;
}

function lose_() {
  return lesen_('Lose').map(function (o) {
    return {
      tag: zahl_(o['Tag']), datum: datumLesen_(o['Datum']), typ: o['Typ'] || 'normal',
      regel: o['Regeltext'], felderzahl: zahl_(o['Felderzahl'], 2), frage: o['Quizfrage']
    };
  }).sort(function (a, b) { return a.tag - b.tag; });
}

function losMitTag_(tag) {
  return lose_().filter(function (l) { return l.tag === Number(tag); })[0] || null;
}

function felder_() {
  return lesen_('Felder').map(function (o) {
    return {
      tag: zahl_(o['Tag']), feld: zahl_(o['Feld']), qrId: o['QR-ID'].toUpperCase(),
      kuerzel: o['Kürzel'].toUpperCase(), beschriftung: o['Beschriftung'], effekt: (o['Effekt'] || 'niete').toLowerCase(),
      wert: zahl_(o['Wert']), geschenkId: o['Geschenk-ID'], richtig: jaNein_(o['Richtig'])
    };
  });
}

function felderVon_(tag) {
  return felder_().filter(function (f) { return f.tag === Number(tag); })
                  .sort(function (a, b) { return a.feld - b.feld; });
}

function einsendungen_(modus) {
  return lesen_('Einsendungen').filter(function (o) { return o['Modus'] === modus; }).map(function (o) {
    var erg = {};
    try { erg = JSON.parse(o['Ergebnis'] || '{}'); } catch (x) { erg = {}; }
    return {
      id: o['ID'], zeit: o['Zeitstempel'], modus: o['Modus'], spieldatum: o['Spieldatum'], tag: zahl_(o['Tag']),
      codes: o['Codes'], manuell: jaNein_(o['Manuell']), fotoId: o['Foto-ID'], punkte: zahl_(o['Punkte']),
      ergebnis: erg, status: o['Status'], notiz: o['Notiz'], _roh: o
    };
  });
}

function istAktiv_(e) { return e.status === STATUS.GUELTIG || e.status === STATUS.UNGUELTIG || e.status === STATUS.ADMIN; }
function istGueltig_(e) { return e.status === STATUS.GUELTIG || e.status === STATUS.ADMIN; }

/** Aktive Einsendung pro Tag: { 5: einsendung, … } */
function aktiveProTag_(modus) {
  var m = {};
  einsendungen_(modus).forEach(function (e) { if (istAktiv_(e)) m[e.tag] = e; });
  return m;
}

// ------------------------------------------------------------------ Punkte

function saldo_(modus) {
  return lesen_('Buchungen').reduce(function (s, o) {
    return o['Modus'] === modus ? s + zahl_(o['Betrag']) : s;
  }, 0);
}

/** Bucht Punkte (positiv oder negativ) und gibt den neuen Saldo zurück. */
function buchen_(modus, grund, betrag, bezug) {
  var saldo = saldo_(modus) + betrag;
  anhaengen_('Buchungen', {
    'Zeitstempel': zeitstempel_(), 'Modus': modus, 'Grund': grund,
    'Betrag': betrag, 'Saldo': saldo, 'Bezug': bezug || ''
  });
  return saldo;
}

// ------------------------------------------------------------------ Serie

/** Zählt, wie viele Lose bis und mit «tag» lückenlos am eigenen Tag gültig eingereicht wurden. */
function serieBis_(tag, proTag) {
  var lose = lose_();
  var proDatum = {};
  lose.forEach(function (l) { proDatum[l.datum] = l; });
  var los = losMitTag_(tag);
  var n = 0;
  while (los) {
    var e = proTag[los.tag];
    if (!e || !istGueltig_(e) || e.spieldatum !== los.datum) break;
    n++;
    los = proDatum[tageAddieren_(los.datum, -1)];
  }
  return n;
}

/** Aktuelle Serie: endet heute oder gestern (heute noch nicht eingereicht = Serie läuft weiter). */
function aktuelleSerie_(ctx, proTag) {
  var lose = lose_();
  var heuteLos = lose.filter(function (l) { return l.datum === ctx.heute; })[0];
  if (heuteLos) {
    var n = serieBis_(heuteLos.tag, proTag);
    if (n > 0) return n;
  }
  var gestern = lose.filter(function (l) { return l.datum === tageAddieren_(ctx.heute, -1); })[0];
  return gestern ? serieBis_(gestern.tag, proTag) : 0;
}

// ------------------------------------------------------------------ Status eines Loses

function losStatus_(los, ctx, proTag) {
  var e = proTag[los.tag];
  if (e) return istGueltig_(e) ? 'eingereicht' : 'ungueltig';
  if (los.datum > ctx.heute) return 'gesperrt';
  if (los.datum === ctx.heute) return 'offen';
  return jaNein_(einstellung_('Nachholen erlaubt')) ? 'nachholbar' : 'verpasst';
}

/** Öffentliche Angaben zu einem Los (alles, was auch auf dem Papier steht). */
function losInfo_(los, ctx, proTag) {
  var info = { tag: los.tag, datum: los.datum, typ: los.typ, status: losStatus_(los, ctx, proTag) };
  if (los.datum <= ctx.heute || proTag[los.tag]) {
    info.regel = los.regel;
    info.felderzahl = los.felderzahl;
    info.frage = los.frage;
    info.beschriftungen = felderVon_(los.tag).map(function (f) { return { feld: f.feld, text: f.beschriftung }; });
  }
  return info;
}

// ------------------------------------------------------------------ Geschenke

function geschenk_(id) {
  if (!id) return null;
  var g = lesen_('Geschenke').filter(function (o) { return o['ID'] === id; })[0];
  if (!g) return { id: id, titel: id, art: 'text', inhalt: '', beschreibung: '' };
  return { id: g['ID'], titel: g['Titel'], art: (g['Art'] || 'text').toLowerCase(), inhalt: g['Inhalt'], beschreibung: g['Beschreibung'] };
}

// ------------------------------------------------------------------ Ergebnis

/** Rechnet ein Los aus. gerubbelt = Liste der Feld-Objekte, die eingereicht wurden. */
function berechnen_(los, gerubbelt) {
  var erg = {
    gerubbelt: gerubbelt.map(function (f) { return f.feld; }).sort(),
    punkte: 0, multiplikator: 1, losPunkte: 0, serie: 0, serienbonus: 0, gewinne: [], ungueltig: false
  };
  if (gerubbelt.length > los.felderzahl) {
    erg.ungueltig = true;
    erg.grund = 'zu_viele';
    erg.erlaubt = los.felderzahl;
    erg.erkannt = gerubbelt.length;
    return erg;
  }
  var quiz = los.typ === 'quiz';
  if (quiz) erg.quizRichtig = gerubbelt.some(function (f) { return f.richtig; });
  gerubbelt.forEach(function (f) {
    if (quiz && !f.richtig) return; // beim Quiz zählt nur die richtige Antwort
    if (f.effekt === 'punkte') erg.punkte += f.wert;
    else if (f.effekt === 'multiplikator') erg.multiplikator *= (f.wert || 1);
    else if (f.effekt === 'sofortgewinn' && f.geschenkId) erg.gewinne.push(f.geschenkId);
  });
  erg.losPunkte = Math.round(erg.punkte * erg.multiplikator);
  return erg;
}

/** Ergebnis so, wie es die Seite anzeigt (inkl. aller Felder: «Das hättest du bekommen»). */
function ergebnisFuerSeite_(e, los) {
  var erg = e.ergebnis || {};
  var gerubbelt = erg.gerubbelt || [];
  var quiz = los.typ === 'quiz';
  return {
    einsendung: e.id, tag: los.tag, datum: los.datum, typ: los.typ, regel: los.regel, frage: los.frage,
    status: e.status, zeit: e.zeit, spieldatum: e.spieldatum, nachgeholt: e.spieldatum !== los.datum,
    manuell: e.manuell, hatFoto: !!e.fotoId,
    felder: felderVon_(los.tag).map(function (f) {
      var g = f.effekt === 'sofortgewinn' ? geschenk_(f.geschenkId) : null;
      return {
        feld: f.feld, kuerzel: f.kuerzel, beschriftung: f.beschriftung, effekt: f.effekt, wert: f.wert,
        geschenk: g ? g.titel : null, richtig: quiz ? f.richtig : null,
        gerubbelt: gerubbelt.indexOf(f.feld) >= 0
      };
    }),
    ungueltig: !!erg.ungueltig, grund: erg.grund || null, erlaubt: erg.erlaubt || null, erkannt: erg.erkannt || null,
    quizRichtig: quiz ? !!erg.quizRichtig : null,
    punkte: erg.punkte || 0, multiplikator: erg.multiplikator || 1, losPunkte: erg.losPunkte || 0,
    serie: erg.serie || 0, serienbonus: erg.serienbonus || 0,
    adminPunkte: erg.adminPunkte == null ? null : erg.adminPunkte,
    total: e.punkte,
    gewinne: (erg.gewinne || []).map(geschenk_)
  };
}

// ------------------------------------------------------------------ Aktionen

function aktionStart_(ctx) {
  var proTag = aktiveProTag_(ctx.modus);
  var lose = lose_();
  var heuteLos = lose.filter(function (l) { return l.datum === ctx.heute; })[0];
  var nachholbar = lose.filter(function (l) { return losStatus_(l, ctx, proTag) === 'nachholbar'; })
                       .map(function (l) { return { tag: l.tag, datum: l.datum }; });
  var naechstes = lose.filter(function (l) { return l.datum > ctx.heute; })[0];
  return {
    heute: ctx.heute,
    testmodus: ctx.modus === 'test',
    saldo: saldo_(ctx.modus),
    serie: aktuelleSerie_(ctx, proTag),
    los: heuteLos ? losInfo_(heuteLos, ctx, proTag) : null,
    ergebnisHeute: heuteLos && proTag[heuteLos.tag] ? ergebnisFuerSeite_(proTag[heuteLos.tag], heuteLos) : null,
    nachholbar: nachholbar,
    naechstes: naechstes ? { tag: naechstes.tag, datum: naechstes.datum } : null,
    anzahlLose: lose.length,
    erstes: lose.length ? lose[0].datum : null,
    neueKatalog: neueKatalogEintraege_(ctx)
  };
}

function aktionVerlauf_(ctx) {
  var proTag = aktiveProTag_(ctx.modus);
  return {
    lose: lose_().map(function (l) {
      var info = losInfo_(l, ctx, proTag);
      if (proTag[l.tag]) info.ergebnis = ergebnisFuerSeite_(proTag[l.tag], l);
      return info;
    })
  };
}

/** Bereinigt eingegebene oder erkannte Codes: Grossbuchstaben, ohne Leerzeichen, ohne Doppelte. */
function codesBereinigen_(liste) {
  var gesehen = {};
  return (liste || []).map(function (c) {
    return String(c || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }).filter(function (c) {
    if (!c || gesehen[c]) return false;
    gesehen[c] = true;
    return true;
  });
}

function aktionEinreichen_(ctx, a) {
  var codes = codesBereinigen_(a.codes);
  if (!codes.length) throw fehler_('keine_codes', 'Es wurde kein Code erkannt. Bitte ein neues Foto machen oder das Kürzel abtippen.');

  // 1. Codes den Feldern zuordnen (QR-ID enthält einen Bindestrich, Kürzel nicht)
  var felder = felder_();
  var gefunden = [], unbekannt = [], schon = {};
  codes.forEach(function (c) {
    var f = felder.filter(function (x) { return c.indexOf('-') >= 0 ? x.qrId === c : x.kuerzel === c; })[0];
    if (!f) { unbekannt.push(c); return; }
    if (!schon[f.qrId]) { schon[f.qrId] = true; gefunden.push(f); }
  });
  if (unbekannt.length) {
    throw fehler_('code_unbekannt', 'Diese Codes kenne ich nicht: ' + unbekannt.map(kurz_).join(', ') +
      '. Bitte das Kürzel prüfen.', { codes: unbekannt.map(kurz_) });
  }

  // 2. Alle Codes müssen vom selben Los stammen
  var tage = gefunden.map(function (f) { return f.tag; }).filter(function (t, i, l) { return l.indexOf(t) === i; });
  if (tage.length > 1) {
    throw fehler_('codes_gemischt', 'Die Codes stammen von verschiedenen Losen (Tag ' + tage.join(', ') +
      '). Bitte nur ein Los aufs Foto.', { tage: tage });
  }
  var los = losMitTag_(tage[0]);
  if (!los) throw fehler_('server', 'Los ' + tage[0] + ' fehlt im Blatt «Lose».');
  if (a.tag && Number(a.tag) !== los.tag) {
    throw fehler_('falsches_los', 'Das ist das Los von Tag ' + los.tag + ', nicht von Tag ' + a.tag + '.',
      { erwartet: Number(a.tag), gefunden: los.tag });
  }

  // 3. Datum und bisherige Einsendungen
  vorEinreichenPruefen_(ctx, los);

  // 4. Felderzahl. Zu wenige: ablehnen, nichts verbraucht.
  if (gefunden.length < los.felderzahl) {
    throw fehler_('zu_wenige', 'Erkannt: ' + gefunden.length + ' Feld(er). Für dieses Los braucht es genau ' +
      los.felderzahl + '. Fehlt ein Code, bitte das Kürzel abtippen.',
      { tag: los.tag, erkannt: gefunden.length, noetig: los.felderzahl });
  }

  // 5. Foto ablegen (vor der Sperre, weil es dauert)
  var fotoId = '';
  var notiz = '';
  if (a.foto) {
    try { fotoId = fotoSpeichern_(a.foto, los, ctx); }
    catch (x) { notiz = 'Foto nicht gespeichert: ' + x.message; }
  }

  // 6. Ausrechnen und buchen, unter Sperre
  return gesperrt_(function () {
    vorEinreichenPruefen_(ctx, los); // nochmals, falls inzwischen eine Einsendung kam
    var erg = berechnen_(los, gefunden);
    var status = erg.ungueltig ? STATUS.UNGUELTIG : STATUS.GUELTIG;
    var e = {
      id: neueId_(), zeit: zeitstempel_(), modus: ctx.modus, spieldatum: ctx.heute, tag: los.tag,
      codes: gefunden.map(function (f) { return f.kuerzel; }).join(', '), manuell: !!a.manuell,
      fotoId: fotoId, ergebnis: erg, status: status, notiz: notiz
    };
    var bezug = 'E:' + e.id;
    var total = 0;
    if (!erg.ungueltig) {
      if (erg.losPunkte) buchen_(ctx.modus, 'Los ' + los.tag, erg.losPunkte, bezug);
      total += erg.losPunkte;
      // Serie: diese Einsendung zählt mit, sie wird für die Rechnung vorweg eingesetzt
      var proTag = aktiveProTag_(ctx.modus);
      proTag[los.tag] = { status: status, spieldatum: ctx.heute };
      erg.serie = los.datum === ctx.heute ? serieBis_(los.tag, proTag) : 0;
      var bonus = zahl_(einstellung_('Serienbonus'));
      if (bonus && erg.serie >= zahl_(einstellung_('Serienbonus ab'), 3)) {
        erg.serienbonus = bonus;
        buchen_(ctx.modus, 'Serienbonus (' + erg.serie + ' Tage)', bonus, bezug);
        total += bonus;
      }
      erg.gewinne.forEach(function (gid) {
        anhaengen_('Erhalten', { 'ID': neueId_(), 'Zeitstempel': e.zeit, 'Modus': ctx.modus,
          'Quelle': 'los', 'Bezug': bezug, 'Geschenk-ID': gid });
      });
    }
    e.punkte = total;
    anhaengen_('Einsendungen', {
      'ID': e.id, 'Zeitstempel': e.zeit, 'Modus': e.modus, 'Spieldatum': e.spieldatum, 'Tag': e.tag,
      'Codes': e.codes, 'Manuell': e.manuell ? 'ja' : 'nein', 'Foto-ID': e.fotoId, 'Punkte': total,
      'Ergebnis': JSON.stringify(erg), 'Status': status, 'Notiz': notiz
    });
    return { ergebnis: ergebnisFuerSeite_(e, los), saldo: saldo_(ctx.modus) };
  });
}

/** Kürzel aus einer QR-ID (K7QX-9F3HZP2W → K7QX), damit Fehlermeldungen nichts Geheimes zeigen. */
function kurz_(c) { return String(c).split('-')[0]; }

function vorEinreichenPruefen_(ctx, los) {
  if (los.datum > ctx.heute) {
    throw fehler_('los_gesperrt', 'Dieses Los gilt erst ab ' + los.datum + '.', { tag: los.tag, datum: los.datum });
  }
  if (los.datum < ctx.heute && !jaNein_(einstellung_('Nachholen erlaubt'))) {
    throw fehler_('nachholen_aus', 'Dieses Los ist abgelaufen.', { tag: los.tag, datum: los.datum });
  }
  if (aktiveProTag_(ctx.modus)[los.tag]) {
    throw fehler_('schon_eingereicht', 'Dieses Los wurde schon eingereicht.', { tag: los.tag });
  }
}

// ------------------------------------------------------------------ Fotos

function ordner_() {
  var id = PropertiesService.getScriptProperties().getProperty('ORDNER_ID');
  if (!id) throw fehler_('einrichtung', 'Der Drive-Ordner fehlt. Bitte einrichten() ausführen.');
  return DriveApp.getFolderById(id);
}

/** Speichert ein Foto (Data-URL oder Base64, JPEG) im Drive-Ordner und gibt die Datei-ID zurück. */
function fotoSpeichern_(foto, los, ctx) {
  var b64 = String(foto).replace(/^data:[^,]*,/, '');
  var bytes = Utilities.base64Decode(b64);
  var name = 'Los' + zwei_(los.tag) + '_' + ctx.modus + '_' + Utilities.formatDate(jetzt_(), zeitzone_(), 'yyyy-MM-dd_HHmmss') + '.jpg';
  return ordner_().createFile(Utilities.newBlob(bytes, 'image/jpeg', name)).getId();
}

/** Liefert eine Drive-Datei als Data-URL. */
function dateiAlsDataUrl_(id) {
  var blob = DriveApp.getFileById(id).getBlob();
  return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

/** Drive-Datei-ID aus einer ID oder einem Drive-Link. */
function driveId_(s) {
  var m = String(s || '').match(/[-\w]{25,}/);
  return m ? m[0] : '';
}

function aktionFoto_(ctx, a) {
  var e = einsendungen_(ctx.modus).filter(function (x) { return x.id === a.einsendung; })[0];
  if (!e || !e.fotoId) throw fehler_('kein_foto', 'Zu diesem Los gibt es kein Foto.');
  return { bild: dateiAlsDataUrl_(e.fotoId) };
}
