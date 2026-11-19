/**
 * Katalog.gs – Katalog, Kauf, Geschenke.
 *
 * Sichtbarkeit im Blatt «Katalog»:
 *   sichtbar            Titel, Beschreibung, Bild und Preis sind zu sehen.
 *   verdeckt mit Preis  «Überraschung» mit Preis. Inhalt erst nach dem Kauf.
 *   ganz verdeckt       «Geheimnis» ohne Preis. Den Preis erfährt sie im Bestätigungsdialog.
 * «Sichtbar ab»: Vorher erscheint der Eintrag nicht. «Verfügbar bis»: Danach verschwindet er.
 * «Bestand»: leer = unbegrenzt. Echt- und Testzugang zählen ihren Bestand getrennt.
 * «Geschenk-ID»: Verweis ins Blatt «Geschenke» (Text, Code, Link oder Bild, das sie nach dem Kauf sieht).
 */

function katalog_() {
  return lesen_('Katalog').filter(function (o) { return o['ID']; }).map(function (o) {
    var s = (o['Sichtbarkeit'] || '').toLowerCase();
    return {
      id: o['ID'], titel: o['Titel'], beschreibung: o['Beschreibung'], bild: driveId_(o['Bild']),
      preis: zahl_(o['Preis']),
      sichtbarkeit: s.indexOf('ganz') >= 0 ? 'ganz' : (s.indexOf('verdeckt') >= 0 ? 'verdeckt' : 'sichtbar'),
      ab: datumLesen_(o['Sichtbar ab']), bis: datumLesen_(o['Verfügbar bis']),
      bestand: String(o['Bestand']).trim() === '' ? null : zahl_(o['Bestand']),
      geschenkId: o['Geschenk-ID']
    };
  });
}

function katalogAktuell_(ctx) {
  return katalog_().filter(function (k) {
    return (!k.ab || k.ab <= ctx.heute) && (!k.bis || k.bis >= ctx.heute);
  });
}

function bestellungen_(modus) {
  return lesen_('Bestellungen').filter(function (o) { return o['Modus'] === modus; });
}

function gekauftAnzahl_(modus) {
  var m = {};
  bestellungen_(modus).forEach(function (o) {
    if (o['Status'] !== 'storniert') m[o['Katalog-ID']] = (m[o['Katalog-ID']] || 0) + 1;
  });
  return m;
}

function gesehenSchluessel_(ctx) { return 'KATALOG_GESEHEN_' + ctx.modus; }

function gesehen_(ctx) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(gesehenSchluessel_(ctx)) || '[]'); }
  catch (x) { return []; }
}

function neueKatalogEintraege_(ctx) {
  var g = gesehen_(ctx);
  return katalogAktuell_(ctx).filter(function (k) { return g.indexOf(k.id) < 0; }).length;
}

/** Eintrag so, wie ihn die Seite sehen darf (Verdecktes bleibt verdeckt). */
function eintragFuerSeite_(k, saldo, gekauft, neu) {
  var n = gekauft[k.id] || 0;
  var rest = k.bestand == null ? null : Math.max(0, k.bestand - n);
  var e = { id: k.id, sichtbarkeit: k.sichtbarkeit, bis: k.bis || null, rest: rest, gekauft: n, neu: neu };
  if (k.sichtbarkeit === 'sichtbar' || n > 0) {
    e.titel = k.titel;
    e.beschreibung = k.beschreibung;
    e.hatBild = !!k.bild;
  }
  if (k.sichtbarkeit !== 'ganz' || n > 0) {
    e.preis = k.preis;
    e.fehlend = Math.max(0, k.preis - saldo);
  }
  return e;
}

function aktionKatalog_(ctx) {
  var saldo = saldo_(ctx.modus);
  var gekauft = gekauftAnzahl_(ctx.modus);
  var g = gesehen_(ctx);
  var liste = katalogAktuell_(ctx);
  var eintraege = liste.map(function (k) { return eintragFuerSeite_(k, saldo, gekauft, g.indexOf(k.id) < 0); });
  // Alles Angezeigte gilt ab jetzt als gesehen
  var neu = g.concat(liste.map(function (k) { return k.id; }).filter(function (id) { return g.indexOf(id) < 0; }));
  PropertiesService.getScriptProperties().setProperty(gesehenSchluessel_(ctx), JSON.stringify(neu));
  return { eintraege: eintraege, saldo: saldo };
}

function aktionKaufen_(ctx, a) {
  return gesperrt_(function () {
    var k = katalogAktuell_(ctx).filter(function (x) { return x.id === a.id; })[0];
    if (!k) throw fehler_('nicht_verfuegbar', 'Dieses Angebot gibt es nicht mehr.');
    var gekauft = gekauftAnzahl_(ctx.modus);
    if (k.bestand != null && k.bestand - (gekauft[k.id] || 0) <= 0) {
      throw fehler_('ausverkauft', 'Leider ausverkauft.');
    }
    var saldo = saldo_(ctx.modus);
    // Ohne Preis in der Anfrage: nur den Preis zum Bestätigen zurückgeben (wichtig für «ganz verdeckt»)
    if (a.preis == null) {
      throw fehler_('bestaetigen', 'Bitte bestätigen: ' + k.preis + ' Punkte.',
        { preis: k.preis, saldo: saldo, fehlend: Math.max(0, k.preis - saldo) });
    }
    if (Number(a.preis) !== k.preis) {
      throw fehler_('preis_geaendert', 'Der Preis hat sich geändert: jetzt ' + k.preis + ' Punkte.', { preis: k.preis });
    }
    if (saldo < k.preis) {
      throw fehler_('zu_wenig_punkte', 'Dafür fehlen noch ' + (k.preis - saldo) + ' Punkte.',
        { preis: k.preis, saldo: saldo, fehlend: k.preis - saldo });
    }
    var id = neueId_();
    var neuerSaldo = buchen_(ctx.modus, 'Kauf: ' + k.titel, -k.preis, 'B:' + id);
    var zeit = zeitstempel_();
    anhaengen_('Bestellungen', { 'ID': id, 'Zeitstempel': zeit, 'Modus': ctx.modus, 'Katalog-ID': k.id,
      'Titel': k.titel, 'Preis': k.preis, 'Status': 'neu' });
    bestellMail_(ctx, k, zeit, neuerSaldo);
    return {
      saldo: neuerSaldo,
      bestellung: { id: id, titel: k.titel, beschreibung: k.beschreibung, hatBild: !!k.bild, katalogId: k.id },
      geschenk: geschenk_(k.geschenkId)
    };
  });
}

/** Schickt dir eine E-Mail zur Bestellung. Ein Mailfehler bricht den Kauf nicht ab. */
function bestellMail_(ctx, k, zeit, saldo) {
  try {
    var an = einstellung_('E-Mail') || Session.getEffectiveUser().getEmail();
    var test = ctx.modus === 'test' ? '[Test] ' : '';
    MailApp.sendEmail(an, test + 'Rubbellos: Bestellung «' + k.titel + '»',
      'Neue Bestellung im Rubbellos-Adventskalender.\n\n' +
      'Angebot: ' + k.titel + ' (' + k.id + ')\n' +
      'Preis: ' + k.preis + ' Punkte\n' +
      'Zeit: ' + zeit + '\n' +
      'Restguthaben: ' + saldo + ' Punkte\n' +
      'Zugang: ' + ctx.modus + '\n\n' +
      'Auf der Admin-Seite als erledigt markieren.');
  } catch (x) {
    console.error('Mail fehlgeschlagen: ' + x.message);
  }
}

function aktionGeschenke_(ctx) {
  var proId = {};
  einsendungen_(ctx.modus).forEach(function (e) { proId[e.id] = e; });
  var liste = [];
  // Sofortgewinne aus Losen
  lesen_('Erhalten').filter(function (o) { return o['Modus'] === ctx.modus; }).forEach(function (o) {
    var e = proId[String(o['Bezug']).replace(/^E:/, '')];
    if (e && !istAktiv_(e)) return; // Los wurde zurückgesetzt
    liste.push({ id: o['ID'], zeit: o['Zeitstempel'], quelle: 'los', tag: e ? e.tag : null,
      geschenk: geschenk_(o['Geschenk-ID']) });
  });
  // Käufe
  var kat = {};
  katalog_().forEach(function (k) { kat[k.id] = k; });
  bestellungen_(ctx.modus).forEach(function (o) {
    if (o['Status'] === 'storniert') return;
    var k = kat[o['Katalog-ID']] || {};
    liste.push({ id: o['ID'], zeit: o['Zeitstempel'], quelle: 'kauf', titel: o['Titel'], preis: zahl_(o['Preis']),
      status: o['Status'], beschreibung: k.beschreibung || '', katalogId: o['Katalog-ID'], hatBild: !!k.bild,
      geschenk: geschenk_(k.geschenkId) });
  });
  liste.sort(function (a, b) { return a.zeit < b.zeit ? 1 : -1; });
  return { geschenke: liste };
}

/** Liefert ein Bild als Data-URL, aber nur, wenn die Spielerin es sehen darf. */
function aktionBild_(ctx, a) {
  var id = '';
  if (a.art === 'katalog') {
    var k = katalog_().filter(function (x) { return x.id === a.id; })[0];
    var gekauft = gekauftAnzahl_(ctx.modus)[a.id] || 0;
    var sichtbar = k && ((k.sichtbarkeit === 'sichtbar' && (!k.ab || k.ab <= ctx.heute)) || gekauft > 0);
    if (sichtbar) id = k.bild;
  } else if (a.art === 'geschenk') {
    var erlaubt = aktionGeschenke_(ctx).geschenke.some(function (x) { return x.geschenk && x.geschenk.id === a.id; });
    var g = erlaubt ? geschenk_(a.id) : null;
    if (g && g.art === 'bild') id = driveId_(g.inhalt);
  }
  if (!id) throw fehler_('kein_bild', 'Bild nicht verfügbar.');
  return { bild: dateiAlsDataUrl_(id) };
}
