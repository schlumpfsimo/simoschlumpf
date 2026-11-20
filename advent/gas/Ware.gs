/**
 * Ware.gs – das Regal: Ware, Kauf, Öffnen.
 *
 * Spalten im Blatt «Ware»:
 *   ID            z. B. W01 (wird im Admin automatisch vergeben)
 *   Titel, Beschreibung
 *   Illustration  Name einer Zeichnung aus advent/ware.js (z. B. kaffee, kino, brief, paket)
 *   Preis         in Punkten
 *   Zustand       sichtbar | eingeschweisst (Form erkennbar, Titel erst nach dem Kauf) | ausverkauft (Stempel)
 *                 | versteckt (nur als Sofortgewinn: erscheint erst im Regal, wenn sie es gewonnen hat)
 *   Sichtbar ab   vorher steht die Ware nicht im Regal (Datum 2026-12-06 oder 6.12.2026)
 *   Aktion bis    Stern «AKTION!» mit Enddatum; danach verschwindet die Ware (ausser sie gehört ihr)
 *   Bestand       leer = unbegrenzt
 *   Inhalt-Art    text | code | link | bild   (was sie nach dem Kauf beim Öffnen sieht)
 *   Inhalt        der Text, Code, Link oder bei «bild» ein Drive-Link
 *   Gehört ihr    wird automatisch gesetzt (ja, sobald gekauft oder als Sofortgewinn gewonnen)
 * Spielerin und Testzugang haben je eigene Käufe und eigenen Bestand.
 */

var ZUSTAENDE = ['sichtbar', 'eingeschweisst', 'ausverkauft', 'versteckt'];

function ware_() {
  return lesen_('Ware').filter(function (o) { return o['ID']; }).map(function (o) {
    var z = (o['Zustand'] || '').toLowerCase();
    return {
      id: o['ID'], titel: o['Titel'], beschreibung: o['Beschreibung'],
      illustration: (o['Illustration'] || 'paket').toLowerCase().trim(),
      preis: zahl_(o['Preis']),
      zustand: z.indexOf('eingeschweisst') >= 0 ? 'eingeschweisst' : z.indexOf('ausverkauft') >= 0 ? 'ausverkauft'
        : z.indexOf('versteckt') >= 0 ? 'versteckt' : 'sichtbar',
      ab: datumLesen_(o['Sichtbar ab']), bis: datumLesen_(o['Aktion bis']),
      bestand: String(o['Bestand']).trim() === '' ? null : zahl_(o['Bestand']),
      inhaltArt: (o['Inhalt-Art'] || 'text').toLowerCase().trim(), inhalt: o['Inhalt'],
      _roh: o
    };
  });
}

function bestellungen_(modus) {
  return lesen_('Bestellungen').filter(function (o) { return o['Modus'] === modus; });
}

/** Wie oft wurde jede Ware gekauft (ohne Stornos)? */
function verkauft_(modus) {
  var m = {};
  bestellungen_(modus).forEach(function (o) {
    if (o['Status'] !== 'storniert') m[o['Ware-ID']] = (m[o['Ware-ID']] || 0) + 1;
  });
  return m;
}

/** Was gehört ihr? { 'W01': { kauf: 1, gewinn: 0, seit: '2026-12-03 …' } } */
function besitz_(modus) {
  var m = {};
  function dazu(id, art, zeit) {
    if (!id) return;
    m[id] = m[id] || { kauf: 0, gewinn: 0, seit: zeit };
    m[id][art]++;
    if (zeit < m[id].seit) m[id].seit = zeit;
  }
  bestellungen_(modus).forEach(function (o) { if (o['Status'] !== 'storniert') dazu(o['Ware-ID'], 'kauf', o['Zeitstempel']); });
  var aktiv = {};
  einsendungen_(modus).forEach(function (e) { if (istAktiv_(e)) aktiv['E:' + e.id] = true; });
  lesen_('Erhalten').forEach(function (o) {
    if (o['Modus'] === modus && aktiv[o['Bezug']]) dazu(o['Ware-ID'], 'gewinn', o['Zeitstempel']);
  });
  return m;
}

/** Schreibt «Gehört ihr» ins Blatt (nur für die echte Spielerin, zur Übersicht für dich). */
function besitzEintragen_() {
  var b = besitz_('echt');
  ware_().forEach(function (w) {
    var soll = b[w.id] ? 'ja' : '';
    if ((w._roh['Gehört ihr'] || '') !== soll) {
      w._roh['Gehört ihr'] = soll;
      aktualisieren_('Ware', w._roh);
    }
  });
}

/** Ware, die heute im Regal steht (oder ihr schon gehört). */
function wareImRegal_(ctx, besitz) {
  return ware_().filter(function (w) {
    if (besitz[w.id]) return true;
    if (w.zustand === 'versteckt') return false;
    return (!w.ab || w.ab <= ctx.heute) && (!w.bis || w.bis >= ctx.heute);
  });
}

function gesehenSchluessel_(ctx) { return 'WARE_GESEHEN_' + ctx.modus; }

function gesehen_(ctx) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(gesehenSchluessel_(ctx)) || '[]'); }
  catch (x) { return []; }
}

function neueWare_(ctx) {
  var g = gesehen_(ctx), b = besitz_(ctx.modus);
  return wareImRegal_(ctx, b).filter(function (w) { return !b[w.id] && g.indexOf(w.id) < 0; }).length;
}

/** Eine Ware so, wie das Regal sie zeigen darf. Eingeschweisstes bleibt verborgen, bis es ihr gehört. */
function wareFuerRegal_(w, ctx, saldo, besitz, verkauft, neu) {
  var b = besitz[w.id];
  var rest = w.bestand == null ? null : Math.max(0, w.bestand - (verkauft[w.id] || 0));
  var ausverkauft = w.zustand === 'ausverkauft' || rest === 0;
  var eingeschweisst = !b && w.zustand === 'eingeschweisst';
  var e = {
    id: w.id, illustration: w.illustration, preis: w.preis, fehlend: Math.max(0, w.preis - saldo),
    eingeschweisst: eingeschweisst, ausverkauft: ausverkauft,
    aktionBis: w.bis && w.bis >= ctx.heute ? w.bis : null,
    rest: rest, gehoert: !!b, anzahl: b ? b.kauf + b.gewinn : 0, gewonnen: !!(b && b.gewinn),
    neu: neu && !b,
    kaufbar: !ausverkauft && w.zustand !== 'versteckt' && (!b || w.bestand == null || rest > 0) && (!w.bis || w.bis >= ctx.heute) && (!w.ab || w.ab <= ctx.heute),
    hatInhalt: !!(b && w.inhalt)
  };
  if (!eingeschweisst) { e.titel = w.titel; e.beschreibung = w.beschreibung; }
  return e;
}

function aktionRegal_(ctx) {
  var saldo = saldo_(ctx.modus);
  var besitz = besitz_(ctx.modus);
  var verkauft = verkauft_(ctx.modus);
  var g = gesehen_(ctx);
  var liste = wareImRegal_(ctx, besitz);
  var ware = liste.map(function (w) { return wareFuerRegal_(w, ctx, saldo, besitz, verkauft, g.indexOf(w.id) < 0); });
  var neu = g.concat(liste.map(function (w) { return w.id; }).filter(function (id) { return g.indexOf(id) < 0; }));
  PropertiesService.getScriptProperties().setProperty(gesehenSchluessel_(ctx), JSON.stringify(neu));
  return { ware: ware, saldo: saldo };
}

/** Kaufen. Ohne «preis» in der Anfrage: nur Preis zurückgeben (Fehler «bestaetigen»). */
function aktionKaufen_(ctx, a) {
  return gesperrt_(function () {
    var besitz = besitz_(ctx.modus);
    var w = wareImRegal_(ctx, besitz).filter(function (x) { return x.id === a.id; })[0];
    if (!w) throw fehler_('nicht_verfuegbar', 'Diese Ware gibt es nicht mehr.');
    var saldo = saldo_(ctx.modus);
    var r = wareFuerRegal_(w, ctx, saldo, besitz, verkauft_(ctx.modus), false);
    if (!r.kaufbar) throw fehler_(r.ausverkauft ? 'ausverkauft' : 'nicht_verfuegbar', 'Diese Ware ist nicht zu haben.');
    if (a.preis == null) {
      throw fehler_('bestaetigen', 'Bitte bestätigen: ' + w.preis + ' Punkte.', { preis: w.preis, saldo: saldo, fehlend: r.fehlend });
    }
    if (Number(a.preis) !== w.preis) {
      throw fehler_('preis_geaendert', 'Der Preis hat sich geändert: jetzt ' + w.preis + ' Punkte.', { preis: w.preis });
    }
    if (saldo < w.preis) {
      throw fehler_('zu_wenig_punkte', 'Dafür fehlen noch ' + (w.preis - saldo) + ' Punkte.',
        { preis: w.preis, saldo: saldo, fehlend: w.preis - saldo });
    }
    var id = neueId_();
    var neuerSaldo = w.preis ? buchen_(ctx.modus, 'Kauf: ' + w.titel, -w.preis, 'B:' + id) : saldo;
    var zeit = zeitstempel_();
    anhaengen_('Bestellungen', { 'ID': id, 'Zeitstempel': zeit, 'Modus': ctx.modus, 'Ware-ID': w.id,
      'Titel': w.titel, 'Preis': w.preis, 'Status': 'neu' });
    if (ctx.modus === 'echt') besitzEintragen_();
    bestellMail_(ctx, w, zeit, neuerSaldo);
    return { saldo: neuerSaldo, bestellung: id, ware: wareOffen_(w) };
  });
}

/** Alles über eine Ware, die ihr gehört (inkl. Inhalt). */
function wareOffen_(w) {
  return { id: w.id, titel: w.titel, beschreibung: w.beschreibung, illustration: w.illustration,
           art: w.inhaltArt, inhalt: w.inhaltArt === 'bild' ? '' : w.inhalt, hatBild: w.inhaltArt === 'bild' && !!driveId_(w.inhalt) };
}

function aktionOeffnen_(ctx, a) {
  var besitz = besitz_(ctx.modus);
  var w = ware_().filter(function (x) { return x.id === a.id; })[0];
  if (!w || !besitz[w.id]) throw fehler_('nicht_deins', 'Das gehört dir (noch) nicht.');
  return { ware: wareOffen_(w) };
}

/** Bild-Inhalt einer Ware, die ihr gehört. */
function aktionBild_(ctx, a) {
  var w = ware_().filter(function (x) { return x.id === a.id; })[0];
  var id = w && besitz_(ctx.modus)[w.id] && w.inhaltArt === 'bild' ? driveId_(w.inhalt) : '';
  if (!id) throw fehler_('kein_bild', 'Bild nicht verfügbar.');
  return { bild: dateiAlsDataUrl_(id) };
}

/** E-Mail an dich: welche Ware, wann. Ein Mailfehler bricht den Kauf nicht ab. */
function bestellMail_(ctx, w, zeit, saldo) {
  try {
    var an = einstellung_('E-Mail') || Session.getEffectiveUser().getEmail();
    var test = ctx.modus === 'test' ? '[Test] ' : '';
    MailApp.sendEmail(an, test + 'SimOil: «' + w.titel + '» gekauft',
      'Neue Bestellung an der SimOil-Kasse.\n\n' +
      'Ware: ' + w.titel + ' (' + w.id + ')\n' +
      'Preis: ' + w.preis + ' Punkte\n' +
      'Zeitpunkt: ' + zeit + '\n' +
      'Restguthaben: ' + saldo + ' Punkte\n' +
      'Zugang: ' + (ctx.modus === 'test' ? 'Testzugang' : 'Spielerin') + '\n\n' +
      'Auf der Admin-Seite unter «Bestellungen» als erledigt markieren.');
  } catch (x) {
    console.error('Mail fehlgeschlagen: ' + x.message);
  }
}

// ------------------------------------------------------------------ Admin: Ware verwalten

function adminWare_(ctx) {
  var vEcht = verkauft_('echt'), vTest = verkauft_('test'), bEcht = besitz_('echt');
  return {
    ware: ware_().map(function (w) {
      return {
        id: w.id, titel: w.titel, beschreibung: w.beschreibung, illustration: w.illustration, preis: w.preis,
        zustand: w.zustand, ab: w.ab, bis: w.bis, bestand: w.bestand, inhaltArt: w.inhaltArt, inhalt: w.inhalt,
        verkauftEcht: vEcht[w.id] || 0, verkauftTest: vTest[w.id] || 0, gehoertIhr: !!bEcht[w.id]
      };
    })
  };
}

/** Ware anlegen oder ändern. a.ware = { id (leer = neu), titel, beschreibung, illustration, preis, … } */
function adminWareSpeichern_(ctx, a) {
  var x = a.ware || {};
  if (!String(x.titel || '').trim()) throw fehler_('eingabe', 'Die Ware braucht einen Titel.');
  var preis = zahl_(x.preis, NaN);
  if (isNaN(preis) || preis < 0) throw fehler_('eingabe', 'Preis bitte als Zahl ab 0.');
  var zustand = String(x.zustand || 'sichtbar').toLowerCase();
  if (ZUSTAENDE.indexOf(zustand) < 0) throw fehler_('eingabe', 'Zustand: sichtbar, eingeschweisst, ausverkauft oder versteckt.');
  ['ab', 'bis'].forEach(function (k) {
    if (x[k] && !datumLesen_(x[k])) throw fehler_('eingabe', 'Datum bitte als 2026-12-06 oder 6.12.2026.');
  });
  if (x.bestand !== '' && x.bestand != null && isNaN(zahl_(x.bestand, NaN))) throw fehler_('eingabe', 'Bestand bitte als Zahl oder leer.');
  return gesperrt_(function () {
    var alle = ware_();
    var w = x.id ? alle.filter(function (y) { return y.id === x.id; })[0] : null;
    var zeile = w ? w._roh : {};
    if (!w) {
      var n = alle.reduce(function (m, y) { var k = Number(String(y.id).replace(/\D/g, '')) || 0; return Math.max(m, k); }, 0) + 1;
      zeile['ID'] = 'W' + (n < 10 ? '0' + n : n);
    }
    zeile['Titel'] = String(x.titel).trim();
    zeile['Beschreibung'] = x.beschreibung || '';
    zeile['Illustration'] = String(x.illustration || 'paket').toLowerCase();
    zeile['Preis'] = preis;
    zeile['Zustand'] = zustand;
    zeile['Sichtbar ab'] = datumLesen_(x.ab || '');
    zeile['Aktion bis'] = datumLesen_(x.bis || '');
    zeile['Bestand'] = x.bestand == null ? '' : String(x.bestand).trim();
    zeile['Inhalt-Art'] = String(x.inhaltArt || 'text').toLowerCase();
    zeile['Inhalt'] = x.inhalt || '';
    if (w) aktualisieren_('Ware', zeile); else anhaengen_('Ware', zeile);
    return { id: zeile['ID'] };
  });
}

/** Ware löschen, aber nur, wenn sie nirgends verwendet wird. */
function adminWareLoeschen_(ctx, a) {
  return gesperrt_(function () {
    var inFeldern = lesen_('Felder').some(function (o) { return o['Ware-ID'] === a.id; });
    var gekauft = lesen_('Bestellungen').some(function (o) { return o['Ware-ID'] === a.id; });
    if (inFeldern || gekauft) {
      throw fehler_('eingabe', 'Diese Ware ist ' + (inFeldern ? 'ein Sofortgewinn in einem Los' : 'schon gekauft worden') +
        '. Statt zu löschen: Zustand «ausverkauft» setzen.');
    }
    var n = loeschenWo_('Ware', function (o) { return o['ID'] === a.id; });
    if (!n) throw fehler_('nicht_gefunden', 'Ware nicht gefunden.');
    return {};
  });
}
