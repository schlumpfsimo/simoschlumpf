/**
 * Admin.gs – Aktionen der Admin-Seite (nur mit ADMIN_TOKEN).
 * ctx.modus ist «echt» oder «test», je nachdem, welche Daten die Admin-Seite gerade anzeigt.
 */

function adminUebersicht_(ctx) {
  var p = PropertiesService.getScriptProperties();
  var proTag = aktiveProTag_(ctx.modus);
  var lose = {};
  lose_().forEach(function (l) { lose[l.tag] = l; });
  var einsendungen = einsendungen_(ctx.modus).map(function (e) {
    var los = lose[e.tag];
    var r = los ? ergebnisFuerSeite_(e, los) : {};
    r.id = e.id; r.status = e.status; r.notiz = e.notiz; r.codes = e.codes; r.tag = e.tag;
    return r;
  }).reverse();
  var einstellungen = {};
  lesen_('Einstellungen').forEach(function (o) { einstellungen[o['Schlüssel']] = o['Wert']; });
  return {
    modus: ctx.modus,
    heute: ctx.heute,
    heuteEcht: heute_({ modus: 'echt' }),
    heuteTest: heute_({ modus: 'test' }),
    einstellungen: einstellungen,
    saldo: saldo_(ctx.modus),
    serie: aktuelleSerie_(ctx, proTag),
    einsendungen: einsendungen,
    bestellungen: bestellungen_(ctx.modus).map(function (o) {
      return { id: o['ID'], zeit: o['Zeitstempel'], wareId: o['Ware-ID'], titel: o['Titel'],
               preis: zahl_(o['Preis']), status: o['Status'] };
    }).reverse(),
    buchungen: lesen_('Buchungen').filter(function (o) { return o['Modus'] === ctx.modus; }).slice(-100).reverse()
      .map(function (o) { return { zeit: o['Zeitstempel'], grund: o['Grund'], betrag: zahl_(o['Betrag']), saldo: zahl_(o['Saldo']) }; }),
    zugaenge: { spieler: p.getProperty('SPIELER_TOKEN'), test: p.getProperty('TEST_TOKEN') }
  };
}

/** Alle Lose mit allen Feldern und Effekten (nur für dich). */
function adminLose_(ctx) {
  var proTag = aktiveProTag_(ctx.modus);
  return {
    lose: lose_().map(function (l) {
      return {
        tag: l.tag, datum: l.datum, typ: l.typ, regel: l.regel, felderzahl: l.felderzahl, frage: l.frage,
        status: losStatus_(l, ctx, proTag),
        felder: felderVon_(l.tag).map(function (f) {
          var g = f.effekt === 'sofortgewinn' ? wareKurz_(f.wareId) : null;
          return { feld: f.feld, kuerzel: f.kuerzel, beschriftung: f.beschriftung, effekt: f.effekt, wert: f.wert,
                   geschenk: g ? g.titel : null, richtig: f.richtig };
        })
      };
    })
  };
}

function einsendungFinden_(ctx, id) {
  var e = einsendungen_(ctx.modus).filter(function (x) { return x.id === id; })[0];
  if (!e) throw fehler_('nicht_gefunden', 'Einsendung nicht gefunden.');
  return e;
}

function adminFoto_(ctx, a) {
  var e = einsendungFinden_(ctx, a.einsendung);
  if (!e.fotoId) throw fehler_('kein_foto', 'Zu dieser Einsendung gibt es kein Foto.');
  return { bild: dateiAlsDataUrl_(e.fotoId) };
}

/** Ergebnis ändern: setzt die Gesamtpunkte einer Einsendung neu und bucht die Differenz. */
function adminErgebnis_(ctx, a) {
  return gesperrt_(function () {
    var e = einsendungFinden_(ctx, a.einsendung);
    if (!istAktiv_(e)) throw fehler_('zurueckgesetzt', 'Diese Einsendung wurde zurückgesetzt.');
    var neu = Math.round(zahl_(a.punkte));
    var diff = neu - e.punkte;
    if (diff) buchen_(ctx.modus, 'Korrektur Los ' + e.tag + (a.notiz ? ': ' + a.notiz : ''), diff, 'E:' + e.id);
    e.ergebnis.adminPunkte = neu;
    var z = e._roh;
    z['Punkte'] = neu;
    z['Ergebnis'] = JSON.stringify(e.ergebnis);
    z['Status'] = STATUS.ADMIN;
    if (a.notiz) z['Notiz'] = (z['Notiz'] ? z['Notiz'] + ' | ' : '') + a.notiz;
    aktualisieren_('Einsendungen', z);
    return { saldo: saldo_(ctx.modus) };
  });
}

function adminBuchen_(ctx, a) {
  var betrag = Math.round(zahl_(a.betrag));
  if (!betrag) throw fehler_('eingabe', 'Bitte einen Betrag eingeben (z. B. 20 oder -10).');
  return gesperrt_(function () {
    return { saldo: buchen_(ctx.modus, a.grund || 'Buchung durch Admin', betrag, 'A') };
  });
}

/** Bestellung als erledigt/neu markieren oder stornieren (Stornieren gibt die Punkte zurück). */
function adminBestellung_(ctx, a) {
  var status = String(a.status || '');
  if (['neu', 'erledigt', 'storniert'].indexOf(status) < 0) throw fehler_('eingabe', 'Unbekannter Status.');
  return gesperrt_(function () {
    var o = bestellungen_(ctx.modus).filter(function (x) { return x['ID'] === a.id; })[0];
    if (!o) throw fehler_('nicht_gefunden', 'Bestellung nicht gefunden.');
    if (o['Status'] === 'storniert') throw fehler_('eingabe', 'Die Bestellung ist schon storniert.');
    if (status === 'storniert') buchen_(ctx.modus, 'Storno: ' + o['Titel'], zahl_(o['Preis']), 'B:' + o['ID']);
    o['Status'] = status;
    aktualisieren_('Bestellungen', o);
    if (ctx.modus === 'echt' && status === 'storniert') besitzEintragen_();
    return { saldo: saldo_(ctx.modus) };
  });
}

/** Ändert Einstellungen. a.werte = { 'Testdatum': '2026-12-05', … } */
function adminEinstellungen_(ctx, a) {
  var erlaubt = EINSTELLUNGEN_STANDARD.map(function (e) { return e[0]; });
  Object.keys(a.werte || {}).forEach(function (k) {
    if (erlaubt.indexOf(k) < 0) throw fehler_('eingabe', 'Unbekannte Einstellung «' + k + '».');
    var w = String(a.werte[k] == null ? '' : a.werte[k]).trim();
    if (k === 'Testdatum' && w && !datumLesen_(w)) throw fehler_('eingabe', 'Testdatum bitte als 2026-12-05 oder 5.12.2026.');
    if (k === 'Testdatum') w = datumLesen_(w);
    einstellungSetzen_(k, w);
  });
  return adminUebersicht_({ modus: ctx.modus, admin: true, heute: heute_(ctx) });
}

/** Setzt das Los eines Tages zurück: Einsendung gilt nicht mehr, Punkte und Sofortgewinne werden storniert. */
function adminZuruecksetzen_(ctx, a) {
  return gesperrt_(function () {
    var tag = Number(a.tag);
    var e = aktiveProTag_(ctx.modus)[tag];
    if (!e) throw fehler_('nicht_gefunden', 'Für Tag ' + tag + ' gibt es keine aktive Einsendung.');
    var bezug = 'E:' + e.id;
    var summe = lesen_('Buchungen').reduce(function (s, o) {
      return o['Modus'] === ctx.modus && o['Bezug'] === bezug ? s + zahl_(o['Betrag']) : s;
    }, 0);
    if (summe) buchen_(ctx.modus, 'Los ' + tag + ' zurückgesetzt', -summe, bezug);
    var z = e._roh;
    z['Status'] = STATUS.ZURUECK;
    aktualisieren_('Einsendungen', z);
    if (ctx.modus === 'echt') besitzEintragen_();
    return { saldo: saldo_(ctx.modus) };
  });
}

/** Löscht alle Daten des Testzugangs (Einsendungen, Buchungen, Bestellungen, Gewinne, Testfotos). */
function adminTestdatenLoeschen_() {
  return gesperrt_(testdatenLoeschen_);
}

function testdatenLoeschen_() {
  {
    var test = function (o) { return o['Modus'] === 'test'; };
    var fotos = lesen_('Einsendungen').filter(test).map(function (o) { return o['Foto-ID']; }).filter(String);
    var n = {
      einsendungen: loeschenWo_('Einsendungen', test),
      buchungen: loeschenWo_('Buchungen', test),
      bestellungen: loeschenWo_('Bestellungen', test),
      gewinne: loeschenWo_('Erhalten', test),
      fotos: 0
    };
    fotos.forEach(function (id) {
      try { DriveApp.getFileById(id).setTrashed(true); n.fotos++; } catch (x) { /* schon weg */ }
    });
    PropertiesService.getScriptProperties().deleteProperty('WARE_GESEHEN_test');
    return { geloescht: n };
  }
}

/** Daten für die Druckvorlage: was auf dem Papier steht, ohne Effekte. */
function adminDruck_() {
  var felder = felder_();
  return {
    lose: lose_().map(function (l) {
      return {
        tag: l.tag, datum: l.datum, typ: l.typ, regel: l.regel, frage: l.frage, felderzahl: l.felderzahl,
        felder: felder.filter(function (f) { return f.tag === l.tag; }).sort(function (a, b) { return a.feld - b.feld; })
          .map(function (f) { return { feld: f.feld, qrId: f.qrId, kuerzel: f.kuerzel, beschriftung: f.beschriftung }; })
      };
    })
  };
}
