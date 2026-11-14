// Rhein – Abfluss, Pegel Kaub, Herkunft und Rückhalt.
// Daten: daten/meta.json, daten/karte.json, daten/jahr/<Jahr>.json, erzeugt vom Python-Werkzeug (werkzeug/, siehe README).
// Die Rechnung hier folgt denselben Formeln wie werkzeug/rheinbilanz (bilanz.py, simulation.py, schifffahrt.py);
// der Abschnitt «Herleitung» der Seite zeigt sie mit den Zahlen des angezeigten Tages.
// Fehlende Werte bleiben leer. Geschätzte Werte (Kaub, Tage ohne Messwert) sind als solche bezeichnet.
(async () => {
  'use strict';
  const FR = new URLSearchParams(location.search).get('l') === 'fr';
  document.documentElement.lang = FR ? 'fr' : 'de';

  // ------------------------------------------------------------ Texte
  const T = FR ? {
    titel: 'Rhin · Débit et retenue', lead: 'Combien d’eau le Rhin apporte à Bâle et à Kaub, d’où elle vient, et de combien les lacs pourraient relever les basses eaux s’ils retenaient davantage.',
    ziel: 'Bilan pour', ansicht: 'Vue', heute: 'Aujourd’hui', extrem: 'Extrêmes', tag: 'Date', mq: 'Moyenne', nw: 'Étiage moyen', jahr: 'Année', datum: 'Date', lage: 'Étiage',
    werte: 'Valeurs', gem: 'Mesuré', simu: 'Simulé', glied: 'Composante', anteil: 'Part', gemessen: 'mesuré', geschaetzt: 'estimé', rest: 'reste (bassin intermédiaire)', negativ: 'reste négatif',
    zwischen: 'Bassin intermédiaire', kontrolle: 'Contrôle Aar : Stilli − (Brugg + Reuss + Limmat)', inkl: 'y compris', ohneReihe: 'sans série', ohneReihen: 'y compris Neckar et Main, sans séries',
    tage: 'jours avec valeurs complètes', von_: 'sur', periode: 'Période',
    mqText: 'Moyenne de tous les jours', nwText: 'Moyenne des 7 jours les plus secs de chaque année (NM7Q) à cette station',
    keine: 'Pas de bilan : des valeurs manquent pour ce jour.', status: 'État des valeurs', letzter: 'Dernier jour avec valeurs complètes', nm7qVon: 'Plus faible moyenne sur 7 jours de',
    seen: 'Lacs', see: 'Lac', stand: 'Niveau', aenderung: 'Variation', speicher: 'Variation du stock', fuellt: 'Positif : le lac se remplit et retient de l’eau.',
    nr: 'Numéro', abfluss: 'Débit', anteilAn: 'Part à', quelle: 'Source', restK: 'Bassin intermédiaire (reste)', mqK: 'MQ', nm7qMin: 'NM7Q le plus bas',
    regulierung: 'Régulation', grenzen: 'Limites', flaeche: 'Surface', reguliert: 'régulé', unreguliert: 'non régulé', keinWehr: 'Lac non régulé, pas de barrage.',
    kaubQ: 'Débit à Kaub', kaubW: 'Échelle de Kaub', glw: 'Écart au GlW (77 cm)', tiefe: 'Profondeur du chenal', baselQ: 'Débit à Bâle', vorhersage: 'Prévision à 4 jours', jetzt: 'Valeur actuelle', ausKurve: 'd’après la courbe de tarage',
    herkunft: 'Origine de l’eau', gAlpen: 'Rhin alpin et lac de Constance', gHoch: 'Thur et Haut-Rhin', gAareOben: 'Aar jusqu’à Brügg (Oberland, lacs du pied du Jura)', gAareMitte: 'Aar de Brügg à Stilli (Emme, Plateau)', gReuss: 'Reuss (lac des Quatre-Cantons)', gLimmat: 'Limmat (lac de Zurich)', gUnten: 'En aval de Bâle (Rhin supérieur, Neckar, Main)',
    aareGesamt: 'Aar à Stilli, total', rheinOben: 'Rhin avant l’Aar (Rekingen)',
    simTitel: 'Retenue pour la navigation', simLead: 'Seule la capacité supplémentaire des lacs se règle. La référence de la restitution est l’étiage équivalent (GlW) à l’échelle de Kaub : chaque relèvement sous le GlW compte. Le calcul relève d’abord les jours les plus bas à un niveau commun L*, au plus jusqu’au GlW, et ne retient que lorsque Kaub est au-dessus du GlW.', verlaufFuer: 'Courbe pour', abgabeTitel: 'Restitution (en haut) et retenue (en bas) aux lacs, m³/s', wirktSpaeter: 'agit à la station du bilan avec un retard en jours de', gAareO: 'Aar : lacs de Thoune et de Brienz', gAareJ: 'Aar : lacs du pied du Jura', seeTitel: 'Restitution et retenue par groupe de lacs', sAnteil: 'Part', sVol: 'Restitué mio m³', sMaxA: 'Restitution max. m³/s', sMaxR: 'Retenue max. m³/s', sOrt: 'Station en aval', sMin: 'Débit minimal à cette station m³/s', seeHinweis: 'Les lacs se partagent restitution et retenue au prorata de leur capacité supplémentaire.', zielAbgabe: 'But de la restitution', zGlw: 'Relever jusqu’au GlW', zMin: 'Relever sans plafond', gehoben: 'Jours relevés', imMittel: 'en moyenne', rund: 'environ', bedarf: 'Besoin pour tous les jours', bedarfText: 'Somme des déficits ; sur tous les lacs régulés, cela ferait', nieUnter: 'Kaub ne passe jamais sous le GlW cette année.', ohneKaub: 'Pas de valeurs pour Kaub cette année ; le calcul relève le débit minimal à la station du bilan.',
    alle: 'Tous les lacs régulés (cm)', band: 'Tranche utilisée 1991–2020', jecm: 'Par cm', zusatz: 'Capacité suppl.', vol: 'Volume', grenzenK: 'Limites m s. m. · mio m³', volumen: 'Capacité totale',
    gBodensee: 'Lac de Constance (non régulé, hypothétique)', gAare: 'Aar', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Plus faible débit journalier', nm7qSim: 'NM7Q', pegelMin: 'Niveau le plus bas à Kaub', unterGlw: 'Jours sous le GlW à Kaub', abgabeTage: 'Restitution', rueckTage: 'Retenue', tageW: 'jours', schwellen: 'Seuils', genutzt: 'Volume utilisé',
    ausschnitt: 'Extrait', ganz: 'Année', phase: 'Étiage', diff: 'Écart', inhalt: 'Contenu du réservoir, mio m³', keinGewinn: 'Pas de gain : le plus faible débit tombe avant toute crue qui aurait pu remplir le réservoir (réservoir vide au 1er janvier).',
    keinJahr: 'Pas de valeurs journalières pour cette station et cette année.', nurTag: 'Choisissez une capacité supérieure à zéro.', geschHinweis: 'jours estimés dans l’année ; le résultat pour Kaub est d’autant moins sûr.',
    simHinweis: 'Année civile, réservoir vide au 1er janvier, prévision parfaite : le résultat est une borne supérieure. Les règlements de régulation, la protection contre les crues et l’écologie ne sont pas pris en compte.',
    herTitel: 'Dérivation', herLead: 'Chaque nombre de cette page découle des formules ci-dessous, ici avec les valeurs du jour affiché.',
    methode: 'Hypothèses et lacunes', quellen: 'Sources', standT: 'Données du', monate: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    legende: 'Largeur du trait = débit. Noir : débit de la station amont. Gris : apport du bassin intermédiaire (reste calculé). Bleu : tronçon modifié par la simulation. Carré : station. Triangle : lac régulé. Cercle : lac non régulé. Fond : swisstopo et OpenStreetMap, en trame de points.', fehlt: 'Les données n’ont pas pu être chargées.',
    meth: ['Temps de parcours : hypothèses en jours entiers (Bâle–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sinon 0 ; Bâle–Kaub 2), non mesurés.',
      'Stations allemandes : valeurs journalières contrôlées de l’annuaire (2008–2025), puis données brutes des 31 derniers jours. Neckar : 2010–2020. Pour Kaub, les jours sans mesure depuis le 1.1.2026 sont estimés et désignés comme tels.',
      'Si les stations entre Bâle et Kaub manquent, le bilan regroupe tout l’aval de Bâle en un seul reste.',
      'Lacs : surface constante. Surfaces et limites d’après les fiches OFEV « Seeregulierung » (2020). Lac de Constance : 536 km² selon l’IGKB, répartition non officielle.',
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.'],
  } : {
    titel: 'Rhein · Abfluss und Rückhalt', lead: 'Wie viel Wasser der Rhein in Basel und in Kaub führt, woher es kommt, und um wie viel die Seen das Niedrigwasser anheben könnten, wenn sie mehr zurückhielten.',
    ziel: 'Bilanz für', ansicht: 'Ansicht', heute: 'Heute', extrem: 'Extremwerte', tag: 'Datum', mq: 'Mittelwasser', nw: 'Mittleres Niedrigwasser', jahr: 'Jahr', datum: 'Datum', lage: 'Niedrigwasserlage',
    werte: 'Werte', gem: 'Gemessen', simu: 'Simuliert', glied: 'Bilanzglied', anteil: 'Anteil', gemessen: 'gemessen', geschaetzt: 'geschätzt', rest: 'Rest (Zwischengebiet)', negativ: 'negativer Rest',
    zwischen: 'Zwischengebiet', kontrolle: 'Kontrollbilanz Aare: Stilli − (Brugg + Reuss + Limmat)', inkl: 'inkl.', ohneReihe: 'ohne Messreihe', ohneReihen: 'inkl. Neckar und Main, ohne Messreihen',
    tage: 'Tage mit vollständigen Werten', von_: 'von', periode: 'Periode',
    mqText: 'Mittel aller Tage', nwText: 'Mittel der sieben trockensten Tage jedes Jahres (NM7Q) an dieser Messstelle',
    keine: 'Keine Bilanz: Für diesen Tag fehlen Werte.', status: 'Status der Werte', letzter: 'Letzter Tag mit vollständigen Werten', nm7qVon: 'Kleinstes 7-Tage-Mittel von',
    seen: 'Seen', see: 'See', stand: 'Stand', aenderung: 'Änderung', speicher: 'Speicheränderung', fuellt: 'Positiv: Der See füllt sich und hält Wasser zurück.',
    nr: 'Nummer', abfluss: 'Abfluss', anteilAn: 'Anteil an', quelle: 'Quelle', restK: 'Zwischengebiet (Rest)', mqK: 'MQ', nm7qMin: 'Kleinstes NM7Q',
    regulierung: 'Regulierung', grenzen: 'Grenzen', flaeche: 'Fläche', reguliert: 'reguliert', unreguliert: 'nicht reguliert', keinWehr: 'Nicht regulierter See, kein Wehr.',
    kaubQ: 'Abfluss Kaub', kaubW: 'Pegel Kaub', glw: 'Abstand zum GlW (77 cm)', tiefe: 'Fahrrinnentiefe', baselQ: 'Abfluss Basel', vorhersage: 'Vorhersage 4 Tage', jetzt: 'Aktueller Wert', ausKurve: 'aus der Abflusskurve',
    herkunft: 'Herkunft des Wassers', gAlpen: 'Alpenrhein und Bodensee', gHoch: 'Thur und Hochrhein', gAareOben: 'Aare bis Brügg (Oberland, Jurarandseen)', gAareMitte: 'Aare Brügg bis Stilli (Emme, Mittelland)', gReuss: 'Reuss (Vierwaldstättersee)', gLimmat: 'Limmat (Zürichsee)', gUnten: 'Unterhalb Basel (Oberrhein, Neckar, Main)',
    aareGesamt: 'Aare in Stilli, gesamt', rheinOben: 'Rhein vor der Aare (Rekingen)',
    simTitel: 'Rückhalt für die Schifffahrt', simLead: 'Einstellen lässt sich nur die zusätzliche Staukapazität der Seen. Bezugswert der Abgabe ist der gleichwertige Wasserstand (GlW) am Pegel Kaub: Jede Anhebung unter dem GlW zählt. Die Rechnung hebt die tiefsten Tage zuerst auf ein gemeinsames Niveau L*, höchstens bis zum GlW, und staut nur, wenn Kaub über dem GlW liegt.', verlaufFuer: 'Verlauf für', abgabeTitel: 'Abgabe (oben) und Rückhalt (unten) an den Seen, m³/s', wirktSpaeter: 'wirkt am Ziel später um Tage:', gAareO: 'Aare: Thuner- und Brienzersee', gAareJ: 'Aare: Jurarandseen', seeTitel: 'Abgabe und Rückhalt je Seegruppe', sAnteil: 'Anteil', sVol: 'Abgegeben Mio. m³', sMaxA: 'Grösste Abgabe m³/s', sMaxR: 'Grösster Rückhalt m³/s', sOrt: 'Messstelle unterhalb', sMin: 'Kleinster Abfluss dort m³/s', seeHinweis: 'Die Seen teilen sich Abgabe und Rückhalt im Verhältnis ihrer zusätzlichen Kapazität.', zielAbgabe: 'Ziel der Abgabe', zGlw: 'Bis zum GlW heben', zMin: 'Ohne Deckel heben', gehoben: 'Gehobene Tage', imMittel: 'im Mittel', rund: 'rund', bedarf: 'Bedarf für alle Tage', bedarfText: 'Summe der Fehlbeträge; auf allen regulierten Seen wären das', nieUnter: 'Kaub liegt in diesem Jahr nie unter dem GlW.', ohneKaub: 'Für dieses Jahr gibt es keine Werte für Kaub; gerechnet ist «Kleinsten Abfluss heben» an der Bilanz-Messstelle.',
    alle: 'Alle regulierten Seen (cm)', band: 'Genutztes Band 1991–2020', jecm: 'Je cm', zusatz: 'Zusätzliche Kapazität', vol: 'Volumen', grenzenK: 'Reguliergrenzen m ü. M. · Mio. m³', volumen: 'Kapazität gesamt',
    gBodensee: 'Bodensee (nicht reguliert, hypothetisch)', gAare: 'Aare', gReussL: 'Reuss', gLimmatL: 'Limmat',
    minTag: 'Kleinster Tagesabfluss', nm7qSim: 'NM7Q', pegelMin: 'Tiefster Pegel Kaub', unterGlw: 'Tage unter GlW in Kaub', abgabeTage: 'Abgabe', rueckTage: 'Rückhalt', tageW: 'Tage', schwellen: 'Schwellen', genutzt: 'Genutztes Volumen',
    ausschnitt: 'Ausschnitt', ganz: 'Jahr', phase: 'Niedrigwasser', diff: 'Differenz', inhalt: 'Speicherinhalt, Mio. m³', keinGewinn: 'Kein Gewinn: Der kleinste Abfluss fällt vor jedes Hochwasser, das den Speicher hätte füllen können (Speicher am 1. Januar leer).',
    keinJahr: 'Für diese Messstelle liegen in diesem Jahr keine Tageswerte vor.', nurTag: 'Wähle eine Kapazität grösser als null.', geschHinweis: 'Tage des Jahres sind geschätzt; das Ergebnis für Kaub ist entsprechend unsicher.',
    simHinweis: 'Kalenderjahr, Speicher am 1. Januar leer, volle Voraussicht: Das Ergebnis ist eine Obergrenze. Regulierreglemente, Hochwasserschutz und Ökologie sind nicht berücksichtigt.',
    herTitel: 'Herleitung', herLead: 'Jede Zahl dieser Seite folgt aus den Formeln unten, hier mit den Werten des angezeigten Tages.',
    methode: 'Annahmen und Lücken', quellen: 'Quellen', standT: 'Datenstand', monate: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    legende: 'Strichbreite = Abfluss. Schwarz: Abfluss der Messstelle oberhalb. Grau: Zuwachs aus dem Zwischengebiet (gerechneter Rest). Blau: Strecke, die die Simulation verändert. Quadrat: Messstation. Dreieck: regulierter See. Kreis: nicht regulierter See. Grundkarte: swisstopo und OpenStreetMap, als Punkteraster.', fehlt: 'Die Daten konnten nicht geladen werden.',
    meth: ['Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1, Maxau–Worms 1, Neckar–Worms 1, sonst 0; Basel–Kaub 2), nicht gemessen.',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Jahrbuch (2008–2025), danach Rohdaten der letzten 31 Tage. Neckar: 2010–2020. Für Kaub sind die Tage ohne Messwert seit dem 1.1.2026 geschätzt und so bezeichnet.',
      'Fehlen die Pegel zwischen Basel und Kaub, fasst die Bilanz alles unterhalb von Basel zu einem Rest zusammen.',
      'Seen: konstante Fläche. Flächen und Grenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020). Bodensee: 536 km² nach IGKB, Aufteilung nicht amtlich.',
      'Es wird nichts interpoliert. Fehlt ein Wert, fehlt das Ergebnis.'],
  };
  const $ = id => document.getElementById(id);
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[e.dataset.t]; });
  document.title = T.titel.replace(' · ', ' – ');
  $('sprache').innerHTML = FR ? '<a href="./" hreflang="de" lang="de">DE</a> · <span aria-current="page">FR</span>'
    : '<span aria-current="page">DE</span> · <a href="?l=fr" hreflang="fr" lang="fr">FR</a>';
  const zahl = (x, n = 0) => x == null || !isFinite(x) ? '–'
    : (x < 0 ? '−' : '') + Math.abs(x).toFixed(n).replace(/\B(?=(\d{3})+(?!\d))/g, FR ? ' ' : '’').replace('.', FR ? ',' : '.');
  const qz = x => zahl(x, x != null && Math.abs(x) < 100 ? 1 : 0);
  const vz = (x, n) => x == null ? '–' : (x > 0 ? '+' : '') + zahl(x, n);
  const datum = iso => { const [j, m, t] = iso.split('-'); return `${+t}.${+m}.${j}`; };

  // ------------------------------------------------------------ Daten und Netz
  let meta, karte;
  try {
    [meta, karte] = await Promise.all(['daten/meta.json', 'daten/karte.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
  } catch (e) { $('bilanz').textContent = T.fehlt; return; }
  const ST = Object.fromEntries(meta.stationen.map(s => [s.id, s]));
  const KAUB = '25700100', BASEL = '2289', K = meta.kaub || {};
  const GLW = K.kennwerte && K.kennwerte.GlW ? K.kennwerte.GlW.value : null, TUG = K.kennwerte && K.kennwerte.TuGLW ? K.kennwerte.TuGLW.value : null;
  // Volles Netz und Kurznetz (alles unterhalb von Basel als ein Rest), falls die Pegel zwischen Basel und Kaub fehlen
  const VOLL = meta.kanten, KURZ = meta.kanten.filter(k => ST[k.nach].quelle === 'BAFU').concat([{ von: BASEL, nach: KAUB, tage: 2, zufluss: false }]);
  let NETZ = VOLL; const EINZUG = new Map();
  const oben = id => NETZ.filter(k => k.nach === id);
  const unten = id => NETZ.find(k => k.von === id);
  const einzug = ziel => {                       // {knoten: Fliesszeit in Tagen bis zum Ziel}
    const s = (NETZ === VOLL ? 'v' : 'k') + ziel; if (EINZUG.has(s)) return EINZUG.get(s);
    const e = { [ziel]: 0 }, offen = [ziel];
    while (offen.length) { const k = offen.pop(); for (const c of oben(k)) { e[c.von] = e[k] + c.tage; offen.push(c.von); } }
    EINZUG.set(s, e); return e;
  };
  const jahre = {};
  const jahr = j => jahre[j] || (jahre[j] = fetch(`daten/jahr/${j}.json`).then(r => r.ok ? r.json() : null).catch(() => null));
  const tagNr = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5);
  const isoTag = (j, i) => new Date(Date.UTC(j, 0, 1 + i)).toISOString().slice(0, 10);
  const kurz = s => s.name.split(',')[0];
  const LETZTES = meta.jahre[meta.jahre.length - 1];
  const statusAm = (Y, id, i) => { let c = null; for (const [start, code] of (Y.s[id] || [])) { if (start <= i) c = code; else break; } return c; };

  // ------------------------------------------------------------ Bilanz (wie bilanz.py)
  const wert = (q, id, i) => (i < 0 || !q[id] || q[id][i] == null) ? null : q[id][i];
  function rest(q, id, i) {
    const x = wert(q, id, i); let summe = 0;
    for (const k of oben(id)) {
      const v = wert(q, k.von, i - k.tage);
      if (v == null) { if (!k.zufluss) return null; } else summe += v;
    }
    return x == null ? null : x - summe;
  }
  function glieder(q, ziel, i) {
    const zq = wert(q, ziel, i); if (zq == null) return null;
    const g = {};
    for (const [id, tage] of Object.entries(einzug(ziel))) {
      if (!oben(id).length) {
        const v = wert(q, id, i - tage);
        if (v == null) { const u = unten(id); if (u && u.zufluss) continue; return null; }
        g['Q:' + id] = v;
      } else { const r = rest(q, id, i - tage); if (r == null) return null; g['R:' + id] = r; }
    }
    g.ziel = zq; return g;
  }
  function anteile(q, ziel, i0, i1) {
    const summe = {}; let n = 0;
    for (let i = i0; i <= i1; i++) { const g = glieder(q, ziel, i); if (!g) continue; n++; for (const k in g) summe[k] = (summe[k] || 0) + g[k]; }
    if (!n || !summe.ziel) return null;
    const mittel = {}, prozent = {};
    for (const k in summe) if (k !== 'ziel') { mittel[k] = summe[k] / n; prozent[k] = 100 * summe[k] / summe.ziel; }
    return { tage: i1 - i0 + 1, tage_gueltig: n, ziel_mittel: summe.ziel / n, mittel, prozent };
  }
  function nm7q(a) {
    let b = null;
    for (let i = 0; i + 6 < a.length; i++) {
      let s = 0, ok = true;
      for (let k = 0; k < 7; k++) { if (a[i + k] == null) { ok = false; break; } s += a[i + k]; }
      if (ok && (!b || s / 7 < b.wert)) b = { wert: s / 7, beginn: i };
    }
    return b;
  }
  const abfluss = (a, id) => {                   // Abfluss an einem Knoten = Summe seiner Glieder
    const e = einzug(id); let s = 0, n = 0;
    for (const k in a.mittel) if (k.slice(2) in e) { s += a.mittel[k]; n++; }
    return n ? s : null;
  };

  // ------------------------------------------------------------ Pegel Kaub (wie schifffahrt.py)
  const KURVE = K.abflusskurve || [];           // Stützpunkte [Q, W]
  const linear = (x, von, nach) => {
    if (x == null || KURVE.length < 2 || x < KURVE[0][von] || x > KURVE[KURVE.length - 1][von]) return null;
    let i = 1; while (KURVE[i][von] < x) i++;
    const a = KURVE[i - 1], b = KURVE[i];
    return b[von] === a[von] ? a[nach] : a[nach] + (b[nach] - a[nach]) * (x - a[von]) / (b[von] - a[von]);
  };
  const wAusQ = q => linear(q, 0, 1), qAusW = w => linear(w, 1, 0);
  const Q_GLW = GLW != null ? qAusW(GLW) : null;

  // ------------------------------------------------------------ Optimaler Rückhalt (wie simulation.py)
  const SEK = 86400, P_MAX = 0.10;
  function lauf(q, V, tief, hoch) {
    const n = q.length, abgabe = new Float64Array(n), rueck = new Float64Array(n), speicher = new Float64Array(n);
    let letzter = -1; for (let i = 0; i < n; i++) if (q[i] != null && q[i] < tief) letzter = i;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const x = q[i];
      if (x != null) {
        if (x < tief) { const bedarf = (tief - x) * SEK; if (bedarf > s + 1e-6) return null; s -= bedarf; abgabe[i] = tief - x; }
        else if (x > hoch && i < letzter && s < V) { const r = Math.min(x - hoch, P_MAX * x, (V - s) / SEK); s += r * SEK; rueck[i] = r; }
      }
      speicher[i] = s;
    }
    return { abgabe, rueck, speicher };
  }
  function optimieren(q, V) {                  // Ziel «kleinsten Abfluss heben»
    const w = q.filter(x => x != null); if (!w.length || V <= 0) return null;
    let a = Math.min(...w), b = w.reduce((s, x) => s + x, 0) / w.length;
    for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (lauf(q, V, m, m)) a = m; else b = m; }
    const tief = a; let c = tief, d = Math.max(...w);
    for (let i = 0; i < 50; i++) { const m = (c + d) / 2; if (lauf(q, V, tief, m)) c = m; else d = m; }
    return { tief, hoch: c, ...lauf(q, V, tief, c) };
  }
  function heben(q, V, deckel) {               // Ziel «bis zum GlW heben»: tiefste Tage zuerst, höchstens bis zum Deckel; gestaut wird nur darüber
    const w = q.filter(x => x != null); if (!w.length || V <= 0) return null;
    let a = Math.min(deckel, ...w), b = deckel;
    if (lauf(q, V, deckel, deckel)) a = deckel;
    else for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (lauf(q, V, m, deckel)) a = m; else b = m; }
    const tief = a; let c = deckel, d = Math.max(deckel, ...w);
    for (let i = 0; i < 50; i++) { const m = (c + d) / 2; if (lauf(q, V, tief, m)) c = m; else d = m; }
    return { tief, hoch: c, ...lauf(q, V, tief, c), glw: true, deckel, bedarf: w.reduce((s, x) => s + Math.max(0, deckel - x), 0) * SEK };
  }

  // ------------------------------------------------------------ Zustand
  const Z = { ziel: KAUB, ansicht: 'heute', jahr: LETZTES, tag: null, extrem: 0, sim: false, zoom: false, modus: 'glw', verlauf: null };
  const CM = Object.fromEntries(meta.seen.map(s => [s.id, s.reguliert ? 10 : 0]));
  const tagAnsicht = () => ['heute', 'extrem', 'tag'].includes(Z.ansicht);
  // Seegruppen: Name, Seen, erste Messstelle unterhalb
  const SEEGRUPPEN = [['gBodensee', ['obersee', 'untersee'], '2288'], ['gAareO', ['brienz', 'thun'], '2135'], ['gAareJ', ['murten', 'neuenburg', 'biel'], '2029'], ['gReussL', ['vws'], '2018'], ['gLimmatL', ['zuerich'], '2243']];
  const SEE = Object.fromEntries(meta.seen.map(s => [s.id, s]));

  // Die Seen teilen sich Rückhalt und Abgabe im Verhältnis ihrer Kapazität; die Wirkung wandert mit der Fliesszeit talwärts.
  function simulieren(Y) {
    // Ziel «GlW halten» rechnet immer am Pegel Kaub; ohne Kaub-Werte im Jahr gilt «kleinsten Abfluss heben» an der Bilanz-Messstelle
    const glw = Z.modus === 'glw' && Q_GLW != null && Y.q[KAUB] && Y.q[KAUB].some(x => x != null), zid = glw ? KAUB : Z.ziel;
    const qz = Y.q[zid]; let V = 0;
    for (const s of meta.seen) V += CM[s.id] * s.flaeche_km2 * 1e4;
    if (!qz || !V) return { q: Y.q, wirkung: {}, V, O: null, zid };
    const O = glw ? heben(qz, V, Q_GLW) : optimieren(qz, V), n = qz.length, wirkung = {}, alt = NETZ; NETZ = VOLL;
    const zumZiel = einzug(zid);
    for (const s of meta.seen) {
      const teil = CM[s.id] * s.flaeche_km2 * 1e4 / V; if (!teil || !(s.knoten in zumZiel)) continue;
      for (let k = s.knoten, lag = 0; k;) {
        const w = wirkung[k] || (wirkung[k] = new Float64Array(n));
        for (let i = 0; i < n; i++) { const j = i - zumZiel[s.knoten] + lag; if (j >= 0 && j < n) w[j] += teil * (O.abgabe[i] - O.rueck[i]); }
        const u = unten(k); if (!u) break; lag += u.tage; k = u.nach;
      }
    }
    NETZ = alt;
    const q = {};
    for (const id in Y.q) q[id] = wirkung[id] ? Y.q[id].map((x, i) => x == null ? null : x + wirkung[id][i]) : Y.q[id];
    // Aktion an den Seen (Abgabe positiv, Rückhalt negativ) am Tag, an dem sie geschieht: lz Tage vor der Wirkung am Ziel
    const lz = zumZiel[BASEL] || 0, aktion = new Float64Array(n);
    for (let i = 0; i < n; i++) { const j = i - lz; if (j >= 0) aktion[j] = O.abgabe[i] - O.rueck[i]; }
    const teile = SEEGRUPPEN.map(([g, ids, knoten]) => ({ g, knoten, teil: ids.reduce((s, id) => s + CM[id] * SEE[id].flaeche_km2 * 1e4, 0) / V }));
    return { q, wirkung, V, O, zid, lz, aktion, teile };
  }

  // ------------------------------------------------------------ Bedienung
  function knoepfe(titel, liste, aktiv, klick) {
    const g = document.createElement('div'); g.className = 'gruppe';
    g.innerHTML = `<span>${h(titel)}</span><div class="knoepfe" role="group" aria-label="${h(titel)}">` +
      liste.map(([w, t]) => `<button type="button" data-w="${w}" aria-pressed="${w === aktiv}">${h(t)}</button>`).join('') + '</div>';
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => klick(b.dataset.w)));
    return g;
  }
  function feld(titel, html) { const g = document.createElement('label'); g.className = 'gruppe'; g.innerHTML = `<span>${h(titel)}</span>${html}`; return g; }
  function wahlZeichnen(Y) {
    const w = $('wahl'); w.textContent = '';
    w.append(knoepfe(T.ziel, meta.ziele.map(z => [z, kurz(ST[z])]), Z.ziel, v => { Z.ziel = v; Z.extrem = 0; if (Z.ansicht === 'heute') Z.tag = null; alles(); }));
    w.append(knoepfe(T.ansicht, [['heute', T.heute], ['extrem', T.extrem], ['tag', T.tag], ['mq', T.mq], ['nw', T.nw]], Z.ansicht, v => {
      if (v === 'tag' && Z.ansicht === 'extrem' && Z.i0 != null) Z.tag = Z.i0;
      Z.ansicht = v; if (v === 'heute') { Z.jahr = LETZTES; Z.tag = null; } alles();
    }));
    if (tagAnsicht()) w.append(knoepfe(T.werte, [['0', T.gem], ['1', T.simu]], Z.sim ? '1' : '0', v => { Z.sim = v === '1'; alles(); }));
    if (Z.ansicht === 'extrem') {
      const f = feld(T.lage, `<select>${meta.extreme[Z.ziel].map((e, i) => `<option value="${i}"${i === Z.extrem ? ' selected' : ''}>${e.jahr} · ${datum(e.beginn).slice(0, -4)}–${datum(e.ende)} · ${zahl(e.wert)} m³/s</option>`).join('')}</select>`);
      f.querySelector('select').addEventListener('change', e => { Z.extrem = +e.target.value; alles(); });
      w.append(f);
    }
    if (Z.ansicht === 'tag' && Y) {
      const n = (Y.q[BASEL] || []).length;
      const j = feld(T.jahr, `<select>${meta.jahre.slice().reverse().map(x => `<option${x === Z.jahr ? ' selected' : ''}>${x}</option>`).join('')}</select>`);
      j.querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; alles(); });
      const d = feld(T.datum, `<input type="date" value="${isoTag(Z.jahr, Z.tag)}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      d.querySelector('input').addEventListener('change', e => { if (e.target.value) { Z.tag = tagNr(e.target.value); alles(); } });
      const r = document.createElement('div'); r.className = 'gruppe regler';
      r.innerHTML = `<input type="range" min="0" max="${n - 1}" value="${Z.tag}" aria-label="${T.datum}">`;
      r.querySelector('input').addEventListener('input', e => { Z.tag = +e.target.value; alles(true); });
      w.append(j, d, r);
    }
  }

  // ------------------------------------------------------------ Rechnen
  async function rechnen() {
    NETZ = VOLL;
    if (!tagAnsicht()) {
      const art = Z.ansicht === 'mq' ? 'mq' : 'nm7q', p = meta.anteile[Z.ziel], je = {};
      for (const z of meta.ziele) je[z] = meta.anteile[z][art];
      const Y = await jahr(Z.jahr);
      return { a: p[art], zeige: p[art], je, Y, S: Y ? simulieren(Y) : null, text: `${Z.ansicht === 'mq' ? T.mqText : T.nwText}. ${T.periode} ${p.periode[0]}–${p.periode[1]}.`, datumText: `${p.periode[0]}–${p.periode[1]}` };
    }
    if (Z.ansicht === 'extrem') { const x = meta.extreme[Z.ziel][Z.extrem]; Z.jahr = x.jahr; Z.i0 = tagNr(x.beginn); Z.tag = tagNr(x.ende); }
    const Y = await jahr(Z.jahr);
    if (!Y) return { a: null, zeige: null, text: '' };
    const n = (Y.q[BASEL] || Object.values(Y.q)[0]).length;
    const netzWahl = i => { NETZ = VOLL; if (!glieder(Y.q, KAUB, i)) { NETZ = KURZ; if (!glieder(Y.q, KAUB, i)) NETZ = VOLL; } };
    if (Z.ansicht === 'heute' && Z.tag == null) { for (Z.tag = n - 1; Z.tag > 0; Z.tag--) { netzWahl(Z.tag); if (glieder(Y.q, Z.ziel, Z.tag)) break; } }
    if (Z.tag == null || Z.tag >= n) Z.tag = n - 1;
    const i1 = Z.tag, i0 = Z.ansicht === 'extrem' ? Z.i0 : i1;
    netzWahl(i1);
    const S = simulieren(Y), a = anteile(Y.q, Z.ziel, i0, i1), s = S.O ? anteile(S.q, Z.ziel, i0, i1) : null, q = Z.sim && s ? S.q : Y.q, je = {}, wirk = {};
    for (const z of meta.ziele) je[z] = anteile(q, z, i0, i1);
    for (const id in S.wirkung) { let x = 0; for (let i = i0; i <= i1; i++) x += S.wirkung[id][i - (einzug(Z.ziel)[id] || 0)] || 0; wirk[id] = x / (i1 - i0 + 1); }
    const codes = new Set(); for (const id in einzug(Z.ziel)) for (let i = i0; i <= i1; i++) { const c = statusAm(Y, id, i - einzug(Z.ziel)[id]); if (c != null) codes.add(c); }
    const dt = i0 === i1 ? datum(isoTag(Z.jahr, i1)) : `${datum(isoTag(Z.jahr, i0)).slice(0, -4)}–${datum(isoTag(Z.jahr, i1))}`;
    const text = Z.ansicht === 'heute' ? `${T.letzter}: ${dt}.` : Z.ansicht === 'extrem' ? `${T.nm7qVon} ${Z.jahr}: ${dt}.` : `${dt}.`;
    return { a, sim: s, zeige: Z.sim && s ? s : a, je, Y, S, i0, i1, wirk, text, datumText: dt, status: [...codes].sort().map(c => meta.status[c]).join(', ') };
  }

  // ------------------------------------------------------------ Lage: Kaub und Basel am angezeigten Tag
  function lageZeichnen(R) {
    const el = $('lage');
    if (!tagAnsicht() || !R.Y) { el.hidden = true; return; }
    el.hidden = false;
    const mittel = (q, id) => { let s = 0, n = 0; for (let i = R.i0; i <= R.i1; i++) { const x = wert(q, id, i); if (x != null) { s += x; n++; } } return n ? s / n : null; };
    const sim = Z.sim && R.S && R.S.O, qK = mittel(R.Y.q, KAUB), qKs = sim ? mittel(R.S.q, KAUB) : null, qB = mittel(R.Y.q, BASEL), qBs = sim ? mittel(R.S.q, BASEL) : null;
    const gesch = statusAm(R.Y, KAUB, R.i1) === 5;
    let wM = null; if (R.Y.wk && R.i0 === R.i1) wM = R.Y.wk[R.i1];
    const w = wM != null ? wM : wAusQ(qK), ws = sim ? (wM != null && wAusQ(qK) != null && wAusQ(qKs) != null ? wM + wAusQ(qKs) - wAusQ(qK) : wAusQ(qKs)) : null;
    const k = (titel, gross, zusatz = '', kl = '') => `<div><span>${titel}</span><b class="${kl}">${gross}</b><em>${zusatz}</em></div>`;
    const beide = (x, y, einheit, n = 0) => y != null && x != null ? `${zahl(y, n)} <small>${einheit}</small>` : `${zahl(x, n)} <small>${einheit}</small>`;
    const anders = (x, y) => y != null && x != null && Math.abs(y - x) >= .05;
    const dazu = (x, y, einheit, n, wort = T.gemessen) => anders(x, y) ? `${wort} ${zahl(x, n)} ${einheit} · ${vz(y - x, 1)}` : '';
    const kl = anders(qK, qKs) ? 'sim' : '', klB = anders(qB, qBs) ? 'sim' : '';
    let html = k(`${T.kaubQ}${gesch ? ` (${T.geschaetzt})` : ''}`, beide(qK, qKs, 'm³/s'), dazu(qK, qKs, 'm³/s', 0, gesch ? T.geschaetzt : T.gemessen) || (gesch && K.schaetzung.pruefung_roh ? `± ${zahl(K.schaetzung.pruefung_roh.rmse)} m³/s` : ''), kl) +
      k(T.kaubW, beide(w, ws, 'cm'), [dazu(w, ws, 'cm', 0, wM == null ? T.ausKurve : T.gemessen), wM == null && w != null && !anders(w, ws) ? T.ausKurve : ''].filter(Boolean).join(''), kl);
    const wz = ws != null ? ws : w;
    if (GLW != null && wz != null) html += k(T.glw, `${vz(wz - GLW, 0)} <small>cm</small>`, '', kl) + k(T.tiefe, `${zahl(wz - GLW + TUG)} <small>cm</small>`, `= ${zahl(wz)} − ${zahl(GLW)} + ${zahl(TUG)}`, kl);
    html += k(T.baselQ, beide(qB, qBs, 'm³/s'), dazu(qB, qBs, 'm³/s', 0), klB);
    if (Z.ansicht === 'heute' && K.vorhersage && K.vorhersage.length) {
      const v = K.vorhersage, l = v[v.length - 1], werte = v.map(x => x[1]);
      html += k(T.vorhersage, `${zahl(l[1])} <small>cm</small>`, `${datum(l[0].slice(0, 10))} · ${zahl(Math.min(...werte))}–${zahl(Math.max(...werte))} cm · WSV/BfG`);
      if (K.aktuell) html += k(T.jetzt, `${zahl(K.aktuell.value)} <small>cm</small>`, `${datum(K.aktuell.timestamp.slice(0, 10))}, ${K.aktuell.timestamp.slice(11, 16).replace(':', '.')} Uhr · ${meta.status[0]}`);
    }
    el.innerHTML = html;
  }

  // ------------------------------------------------------------ Karte
  const map = L.map('karte', { zoomSnap: .25, scrollWheelZoom: false });
  map.createPane('osm').style.zIndex = 190; map.getPane('osm').classList.add('grundkarte');
  map.createPane('ch').style.zIndex = 195; map.getPane('ch').classList.add('grundkarte');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { pane: 'osm', maxZoom: 13,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg', { pane: 'ch', maxZoom: 13,
    bounds: [[45.75, 5.9], [47.85, 10.55]], attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a> · BAFU · WSV/BfG · HydroRIVERS' }).addTo(map);
  map.on('click', () => map.scrollWheelZoom.enable());
  const ebene = L.layerGroup().addTo(map);
  const RAHMEN = { [BASEL]: [[46.6, 7.0], [47.8, 9.8]], [KAUB]: [[46.6, 6.9], [50.2, 9.9]] };
  let rahmenFuer = null;
  const MIT_NAME = { '2473': 'r', '2288': 'r', '2135': 'r', '2289': 'l', '23700200': 'l', '23800690': 'r', '23900200': 'l', '24700404': 'r', '25100100': 'l', '25700100': 'l', '2044': 'r', '2029': 'l' };
  function karteZeichnen(R) {
    if (rahmenFuer !== Z.ziel) { map.fitBounds(RAHMEN[Z.ziel]); rahmenFuer = Z.ziel; }
    ebene.clearLayers();
    const a = R.zeige, e = einzug(Z.ziel), px = a ? 14 / a.ziel_mittel : 0, ll = p => [p[1], p[0]];
    const fluss = id => a && id in e && id !== Z.ziel ? abfluss(a, id) : null;
    const geaendert = id => Z.sim && R.wirk && R.wirk[id] && Math.abs(R.wirk[id]) > .05;
    // Im Kurznetz stehen die Strecken Basel–Maxau–Worms–Mainz–Kaub für die eine Kante Basel–Kaub
    const strecke = k => NETZ === KURZ && k.von === BASEL ? ['2289>23700200', '23700200>23900200', '23900200>25100100', '25100100>25700100'].flatMap(s => karte.strecken[s].p) : (karte.strecken[`${k.von}>${k.nach}`] || {}).p;
    const kanten = NETZ.slice().sort((x, y) => (fluss(y.von) || 0) - (fluss(x.von) || 0));
    for (const k of kanten) {                    // grauer Rand: Zuwachs aus dem Zwischengebiet bis zur nächsten Messstelle
      const p = strecke(k), q = fluss(k.von), r = a && a.mittel['R:' + k.nach];
      if (p && q > 0 && r > 0 && !k.zufluss) L.polyline(p.map(ll), { color: '#a8a8a8', weight: Math.max(2, (q + r) * px), lineCap: 'butt', interactive: false }).addTo(ebene);
    }
    for (const k of kanten) {
      const p = strecke(k); if (!p) continue;
      const q = fluss(k.von), o = ST[k.von];
      if (q == null || q <= 0) L.polyline(p.map(ll), { color: '#a8a8a8', weight: 1.5, dashArray: '4 5', interactive: false }).addTo(ebene);
      else L.polyline(p.map(ll), { color: geaendert(k.von) ? '#003399' : '#000', weight: Math.max(1.5, q * px), lineCap: 'butt', lineJoin: 'round' }).addTo(ebene)
        .bindTooltip(`${o.gewaesser} ${FR ? 'dès' : 'ab'} ${kurz(o)}: ${qz(q)} m³/s`, { sticky: true });
    }
    for (const s of meta.seen) {
      if (!s.lat) continue;
      L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: `<div class="wehr${s.reguliert ? '' : ' frei'}"></div>`, iconSize: [16, 14], iconAnchor: [8, 7] }), title: s.name, alt: s.name })
        .addTo(ebene).bindPopup(() => seePopup(s, R));
    }
    for (const s of meta.stationen) {
      if (!s.lat) continue;
      L.marker([s.lat, s.lon], { icon: L.divIcon({ className: '', html: `<div class="pkt${s.id === Z.ziel ? ' ziel' : ''}"></div>`, iconSize: [11, 11], iconAnchor: [5.5, 5.5] }), title: `${s.gewaesser}–${s.name}`, alt: `${s.gewaesser}–${s.name}`, zIndexOffset: 500 })
        .addTo(ebene).bindPopup(() => stationPopup(s, R));
      const seite = MIT_NAME[s.id];
      if (seite) L.marker([s.lat, s.lon], { interactive: false, icon: L.divIcon({ className: 'ort', html: `<span style="position:absolute;${seite === 'l' ? 'right' : 'left'}:10px;top:-5px">${h(kurz(s))}</span>`, iconSize: [0, 0] }) }).addTo(ebene);
    }
    $('kartenlegende').textContent = T.legende;
  }
  const zeile = (k, w) => `<span class="k">${k}</span><span class="w">${w}</span>`;
  function stationPopup(s, R) {
    const a = R.zeige, q = a && s.id in einzug(Z.ziel) ? abfluss(a, s.id) : null, m = R.a && Z.sim && R.sim ? abfluss(R.a, s.id) : null, r = a && a.mittel['R:' + s.id];
    let html = `<h3>${h(s.gewaesser)}–${h(s.name)}</h3><div class="raster2">` + zeile(T.nr, s.id) +
      zeile(T.abfluss, q == null ? '–' : `${qz(q)} m³/s` + (m != null && Math.abs(q - m) > .05 ? ` (${T.gemessen} ${qz(m)})` : ''));
    for (const z of meta.ziele) {
      const b = R.je && R.je[z];
      if (b && s.id in einzug(z)) { const x = abfluss(b, s.id); if (x != null) html += zeile(`${T.anteilAn} ${kurz(ST[z])}`, `${zahl(100 * x / b.ziel_mittel, 1)} %`); }
    }
    if (r != null && oben(s.id).length) html += zeile(T.restK, `${qz(r)} m³/s`);
    if (R.Y && R.i1 != null) { const c = statusAm(R.Y, s.id, R.i1); if (c != null) html += zeile(T.status, h(meta.status[c])); }
    return html + zeile(T.quelle, s.quelle === 'BAFU' ? 'BAFU' : 'WSV / BfG') + zeile(T.datum, h(R.datumText)) +
      zeile(`${T.mqK} ${s.periode.join('–')}`, `${zahl(s.mq)} m³/s`) + zeile(T.nm7qMin, s.nm7q_min == null ? '–' : `${qz(s.nm7q_min)} m³/s (${datum(s.nm7q_min_beginn)})`) + '</div>';
  }
  function seePopup(s, R) {
    let html = `<h3>${h(s.name)}</h3><div class="raster2">` + zeile(T.flaeche, `${zahl(s.flaeche_km2, 1)} km²`) + zeile(T.regulierung, s.reguliert ? T.reguliert : T.unreguliert);
    if (s.grenzen) html += zeile(T.grenzen, `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} m`);
    const w = R.Y && R.Y.w[s.id];
    if (w && R.i1 != null && w[R.i1] != null) {
      html += zeile(`${T.stand} ${datum(isoTag(Z.jahr, R.i1))}`, `${zahl(w[R.i1], 2)} m`);
      if (R.i1 > 0 && w[R.i1 - 1] != null) html += zeile(T.speicher, `${vz(s.flaeche_km2 * 1e6 * (w[R.i1] - w[R.i1 - 1]) / 86400, 1)} m³/s`);
    }
    return html + '</div>' + `<p>${s.reguliert ? h(FR ? s.bemerkung.replace('Regulierbehörde', 'Autorité de régulation').replace(/seit/g, 'depuis') : s.bemerkung) : T.keinWehr}</p>`;
  }

  // ------------------------------------------------------------ Herkunft (Gruppen mit Schraffur) und Bilanz
  const GRUPPEN = [['gAlpen', 'm0', ['Q:2473', 'R:2288']], ['gHoch', 'm5', ['Q:2044', 'R:2143', 'R:2091', 'R:2289']], ['gAareOben', 'm1', ['Q:2135', 'R:2029']],
    ['gAareMitte', 'm3', ['R:2016', 'R:2205']], ['gReuss', 'm2', ['Q:2018']], ['gLimmat', 'm4', ['Q:2243']],
    ['gUnten', 'm6', ['R:23700200', 'Q:23800690', 'R:23900200', 'Q:24700404', 'R:25100100', 'R:25700100']]];
  function herkunftZeichnen(R) {
    const a = R.zeige, el = $('herkunft'); if (!a) { el.innerHTML = ''; return; }
    const g = GRUPPEN.map(([n, m, ks]) => ({ n: T[n], m, v: ks.reduce((s, k) => s + (a.mittel[k] || 0), 0), da: ks.some(k => k in a.mittel) })).filter(x => x.da);
    const aare = abfluss(a, '2205'), rhein = abfluss(a, '2143');
    el.innerHTML = `<h2>${T.herkunft}: ${h(kurz(ST[Z.ziel]))}, ${h(R.datumText)}</h2>` +
      `<div class="band" role="img" aria-label="${T.herkunft}">${g.map(x => `<i class="${x.m}" style="flex:${Math.max(0, x.v).toFixed(1)} 0 0" title="${h(x.n)}: ${zahl(100 * x.v / a.ziel_mittel, 1)} %"></i>`).join('')}</div>` +
      `<div class="herk">${g.map(x => `<i class="${x.m}"></i><span>${h(x.n)}</span><b>${qz(x.v)} m³/s</b><b>${zahl(100 * x.v / a.ziel_mittel, 1)} %</b>`).join('')}</div>` +
      (aare != null && rhein != null ? `<p class="hinweis">${T.aareGesamt}: <b>${qz(aare)} m³/s (${zahl(100 * aare / a.ziel_mittel, 1)} %)</b>. ${T.rheinOben}: <b>${qz(rhein)} m³/s (${zahl(100 * rhein / a.ziel_mittel, 1)} %)</b>.</p>` : '');
  }
  function gliedName(k, a) {
    const id = k.slice(2), s = ST[id];
    if (k[0] === 'Q') return `${s.gewaesser}–${kurz(s)}`;
    if (id === meta.kontrolle.ziel) return T.kontrolle;
    if (NETZ === KURZ && id === KAUB) return `${T.zwischen} Basel → Kaub (${T.ohneReihen})`;
    const fehlt = oben(id).filter(c => c.zufluss && !oben(c.von).length && !('Q:' + c.von in a.mittel)).map(c => ST[c.von].gewaesser);
    return `${T.zwischen} ${oben(id).filter(c => !fehlt.includes(ST[c.von].gewaesser)).map(c => kurz(ST[c.von])).join(' + ')} → ${kurz(s)}` +
      (fehlt.length ? ` (${T.inkl} ${fehlt.join(', ')}, ${T.ohneReihe})` : '');
  }
  function bilanzZeichnen(R) {
    const z = ST[Z.ziel], a = R.zeige, el = $('bilanz');
    if (!a) { el.innerHTML = `<h2>${h(z.gewaesser)}–${h(z.name)}</h2><p>${T.keine}</p><p class="hinweis">${h(R.text)}</p>`; return; }
    const reihen = meta.stationen.flatMap(s => ['Q:' + s.id, 'R:' + s.id]).filter(k => k in a.mittel);
    const max = Math.max(...reihen.map(k => Math.abs(a.mittel[k]))), simuliert = Z.sim && tagAnsicht() && R.sim;
    el.innerHTML = `<div class="kopfzeile"><h2>${T.glied}: ${h(z.gewaesser)}–${h(z.name)}</h2><button class="textknopf" type="button" id="csv">CSV</button></div>` +
      `<p class="hinweis" style="margin-top:0">${h(R.text)}${tagAnsicht() && R.i0 === R.i1 ? '' : ` ${zahl(a.tage_gueltig)} ${T.von_} ${zahl(a.tage)} ${T.tage}.`}${R.status ? ` ${T.status}: ${h(R.status)}.` : ''}</p>` +
      `<div class="rollen"><table><thead><tr><th>${T.glied}</th><th class="z">m³/s</th><th class="z">${T.anteil}</th><th></th></tr></thead><tbody>` +
      reihen.map(k => {
        const v = a.mittel[k], kl = v < 0 ? 'b minus' : k[0] === 'R' ? 'b rest' : 'b';
        return `<tr><td>${h(gliedName(k, a))}</td><td class="z">${qz(v)}</td><td class="z">${zahl(a.prozent[k], 1)} %</td>` +
          `<td class="balken"><span class="${kl}" style="width:${(100 * Math.abs(v) / max).toFixed(1)}%"></span></td></tr>`;
      }).join('') +
      `<tr class="summe"><td>${h(z.gewaesser)}–${h(kurz(z))} (${simuliert ? T.simu.toLowerCase() : statusAm(R.Y || { s: {} }, Z.ziel, R.i1) === 5 ? T.geschaetzt : T.gemessen})</td><td class="z">${zahl(a.ziel_mittel)}</td><td class="z">${zahl(100, 1)} %</td><td></td></tr></tbody></table></div>` +
      `<p class="zeichen"><span><i class="b"></i>${T.gemessen}</span><span><i class="b rest"></i>${T.rest}</span><span><i class="b minus"></i>${T.negativ}</span></p>`;
    $('csv').addEventListener('click', () => {
      const zeilen = [[`# ${z.gewaesser}–${z.name}; ${R.datumText}; ${simuliert ? T.simu : T.gem}`], ['# Quellen: BAFU, Hydrologische Beobachtungen (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG (DGJ, PEGELONLINE)'],
        [T.glied, 'm3/s', '%'], ...reihen.map(k => [gliedName(k, a), a.mittel[k].toFixed(1), a.prozent[k].toFixed(2)]), [`${z.gewaesser}–${z.name}`, a.ziel_mittel.toFixed(1), '100.00']];
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob(['﻿' + zeilen.map(r => r.map(c => /[;"\n]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c).join(';')).join('\n')], { type: 'text/csv' }));
      l.download = `rhein-bilanz-${kurz(z).toLowerCase()}-${R.datumText.replace(/[^0-9]+/g, '-')}.csv`; l.click(); URL.revokeObjectURL(l.href);
    });
  }
  function seenZeichnen(R) {
    const el = $('seen');
    if (!tagAnsicht() || !R.Y) { el.innerHTML = ''; return; }
    const zeilen = meta.seen.map(s => {
      const w = R.Y.w[s.id]; if (!w) return '';
      const a = R.i0 > 0 ? w[R.i0 - 1] : null, b = w[R.i1];
      const ds = a == null || b == null ? null : s.flaeche_km2 * 1e6 * (b - a) / ((R.i1 - R.i0 + 1) * 86400);
      return `<tr><td>${h(s.name)}</td><td class="z">${b == null ? '–' : zahl(b, 2)}</td><td class="z">${ds == null ? '–' : vz((b - a) * 100, 1) + ' cm'}</td><td class="z">${ds == null ? '–' : vz(ds, 1)}</td></tr>`;
    }).join('');
    el.innerHTML = `<h2>${T.seen}, ${h(R.datumText)}</h2><div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.stand} m</th><th class="z">${T.aenderung}</th><th class="z">${T.speicher} m³/s</th></tr></thead><tbody>${zeilen}</tbody></table></div><p class="hinweis">${T.fuellt}</p>`;
  }

  // ------------------------------------------------------------ Optimaler Rückhalt: Kapazitäten, Kennwerte, Verlauf
  const MUSTER = { gBodensee: 'm0', gAareO: 'm1', gAareJ: 'm3', gReussL: 'm2', gLimmatL: 'm5' };
  function simWahl(R) {
    const w = $('simwahl'); w.textContent = '';
    const alle = feld(T.alle, `<input type="number" min="0" max="100" value="">`);
    alle.querySelector('input').addEventListener('change', e => { const v = Math.max(0, Math.min(100, +e.target.value || 0)); meta.seen.forEach(s => { if (s.reguliert) CM[s.id] = v; }); simSeen(); alles(); });
    const orte = [...new Set([R && R.S && R.S.zid || Z.ziel, KAUB, BASEL, '2288', '2135', '2029', '2018', '2243', '2205'])];
    const ort = feld(T.verlaufFuer, `<select>${orte.map(id => `<option value="${id}"${id === Z.verlauf ? ' selected' : ''}>${h(ST[id].gewaesser)}–${h(kurz(ST[id]))}</option>`).join('')}</select>`);
    ort.querySelector('select').addEventListener('change', e => { Z.verlauf = e.target.value; alles(); });
    w.append(knoepfe(T.zielAbgabe, [['glw', T.zGlw], ['min', T.zMin]], Z.modus, v => { Z.modus = v; alles(); }), alle, ort, knoepfe(T.ausschnitt, [['0', T.ganz], ['1', T.phase]], Z.zoom ? '1' : '0', v => { Z.zoom = v === '1'; alles(); }));
  }
  function simSeen() {
    $('simseen').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.flaeche} km²</th><th class="z">${T.jecm} Mio. m³</th><th class="z">${T.band}</th><th class="z">${T.grenzenK}</th><th style="width:22%">${T.zusatz}</th><th class="z">cm</th><th class="z">${T.vol} Mio. m³</th></tr></thead><tbody>` +
      SEEGRUPPEN.map(([g, ids]) => `<tr class="gruppenkopf"><td colspan="8">${T[g]}</td></tr>` + ids.map(id => { const s = SEE[id]; return `<tr><td>${h(s.name)}</td><td class="z">${zahl(s.flaeche_km2, 1)}</td><td class="z">${zahl(s.flaeche_km2 / 100, 2)}</td>` +
        `<td class="z">${s.band ? `${zahl(s.band.band_m, 2)} m · ${zahl(s.band.volumen_mio_m3)}` : '–'}</td>` +
        `<td class="z" title="${s.grenzen ? h(s.grenzen.art) : ''}">${s.grenzen ? `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} · ${zahl(s.grenzen.volumen_mio_m3)}` : '–'}</td>` +
        `<td><input type="range" min="0" max="100" step="1" value="${CM[id]}" data-see="${id}" aria-label="${h(s.name)}: ${T.zusatz} cm"></td>` +
        `<td class="z" id="cm-${id}"></td><td class="z" id="vol-${id}"></td></tr>`; }).join('')).join('') +
      `<tr class="summe"><td colspan="7">${T.volumen}</td><td class="z" id="vol-summe"></td></tr></tbody></table></div>`;
    $('simseen').querySelectorAll('input').forEach(i => i.addEventListener('input', () => { CM[i.dataset.see] = +i.value; alles(true); }));
  }
  const tageUnter = (q, grenze) => grenze == null || !q ? null : q.reduce((n, x) => n + (x != null && x < grenze ? 1 : 0), 0);
  function simZeichnen(R) {
    let v = 0;
    for (const s of meta.seen) { const m = CM[s.id] * s.flaeche_km2 / 100; v += m; $('cm-' + s.id).textContent = CM[s.id]; $('vol-' + s.id).textContent = zahl(m, 1); }
    $('vol-summe').textContent = zahl(v, 1);
    const S = R.S, z = ST[S && S.zid || Z.ziel], q = R.Y && R.Y.q[z.id];
    if (!q || !S || !S.O) { $('simwerte').innerHTML = `<p>${q ? T.nurTag : T.keinJahr}</p>`; $('verlauf').innerHTML = ''; $('speicher').innerHTML = ''; $('abgabe').innerHTML = ''; $('abgabelegende').innerHTML = ''; $('seetafel').innerHTML = ''; $('simlegende').innerHTML = ''; R.sz = null; return; }
    const O = S.O, qs = S.q[z.id], a = nm7q(q), b = nm7q(qs), min0 = Math.min(...q.filter(x => x != null)), min1 = Math.min(...qs.filter(x => x != null));
    const qK = R.Y.q[KAUB], qKs = S.q[KAUB], tA = O.abgabe.reduce((n, x) => n + (x > 0), 0), tR = O.rueck.reduce((n, x) => n + (x > 0), 0), genutzt = Math.max(...O.speicher) / 1e6;
    const gesch = (R.Y.s[z.id] || []).some(([, c]) => c === 5) ? q.reduce((n, x, i) => n + (x != null && statusAm(R.Y, z.id, i) === 5), 0) : 0;
    const kachel = (titel, gross, zusatz = '') => `<div><span>${titel}</span><b>${gross}</b><em>${zusatz}</em></div>`;
    const kMin0 = qK ? Math.min(...qK.filter(x => x != null)) : null, kMin1 = qKs ? Math.min(...qKs.filter(x => x != null)) : null, w0 = wAusQ(kMin0), w1 = wAusQ(kMin1);
    const u0 = tageUnter(qK, Q_GLW), u1 = tageUnter(qKs, Q_GLW);
    R.sz = { min0, min1, tA, tR, genutzt, u0, u1, w0, w1, kMin0, kMin1 };
    const flaeche = meta.seen.filter(s => s.reguliert).reduce((s, x) => s + x.flaeche_km2, 0);
    const hub = tA ? O.abgabe.reduce((s, x) => s + x, 0) / tA : 0, cmJe = Q_GLW != null ? (wAusQ(Q_GLW) - wAusQ(Q_GLW - 100)) / 100 : null;
    const kopf = O.glw ? kachel(`${T.gehoben} ${Z.jahr}`, `${tA} ${T.tageW}`, tA ? `${T.imMittel} ${vz(hub, 0)} m³/s${cmJe != null ? ` · ${T.rund} ${vz(hub * cmJe, 0)} cm` : ''}` : '') +
      kachel(T.unterGlw, `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) +
      kachel(T.bedarf, `${zahl(O.bedarf / 1e6)} Mio. m³`, `${T.bedarfText} ${zahl(O.bedarf / 1e4 / flaeche)} cm`) : '';
    $('simwerte').innerHTML = kopf + kachel(`${T.minTag} ${kurz(z)} ${Z.jahr}`, `${zahl(min0)} → ${zahl(min1)} m³/s`, `${vz(min1 - min0, 1)} m³/s · ${vz(100 * (min1 - min0) / min0, 1)} %`) +
      (a && b ? kachel(`${T.nm7qSim} ${kurz(z)}`, `${zahl(a.wert)} → ${zahl(b.wert)} m³/s`, `${vz(b.wert - a.wert, 1)} m³/s`) : '') +
      (w0 != null && w1 != null ? kachel(T.pegelMin, `${zahl(w0)} → ${zahl(w1)} cm`, `${vz(w1 - w0, 0)} cm · ${T.ausKurve}`) : '') +
      (u0 != null && !O.glw ? kachel(T.unterGlw, `${zahl(u0)} → ${zahl(u1)}`, `GlW ${zahl(GLW)} cm = ${zahl(Q_GLW)} m³/s`) : '') +
      kachel(T.schwellen, `L* ${zahl(O.tief)} · H* ${zahl(O.hoch)}`, 'm³/s') +
      kachel(`${T.abgabeTage} · ${T.rueckTage}`, `${tA} · ${tR} ${T.tageW}`, `${T.genutzt}: ${zahl(genutzt, 1)} ${T.von_} ${zahl(v, 1)} Mio. m³`) +
      (!O.glw && min1 - min0 < .05 ? `<div><em>${T.keinGewinn}</em></div>` : '') + (O.glw && !u0 ? `<div><em>${T.nieUnter}</em></div>` : '') + (Z.modus === 'glw' && !O.glw ? `<div><em>${T.ohneKaub}</em></div>` : '') + (gesch ? `<div><em>${gesch} ${T.geschHinweis}</em></div>` : '');
    const vs = ST[Z.verlauf && R.Y.q[Z.verlauf] ? Z.verlauf : z.id];
    const [i0, i1] = verlauf(R, R.Y.q[vs.id], S.q[vs.id], O, vs, vs.id === z.id);
    abgabeGrafik(R, i0, i1); seeTafel(R);
  }
  function verlauf(R, q, qs, O, z, linien) {
    const B = 1000, H = 400, L = 62, RR = 14, OO = 22, U = 40, n = q.length, svg = $('verlauf');
    let i0 = 0, i1 = n - 1;
    if (Z.zoom) { let a = n, b = -1; O.abgabe.forEach((x, i) => { if (x > 0) { a = Math.min(a, i); b = Math.max(b, i); } }); if (b >= 0) { i0 = Math.max(0, a - 20); i1 = Math.min(n - 1, b + 20); } }
    const sicht = [...q.slice(i0, i1 + 1), ...qs.slice(i0, i1 + 1)].filter(v => v != null);
    const max = Math.max(...sicht), min = Z.zoom ? Math.min(...sicht) : 0;
    const schritt = [10, 20, 50, 100, 200, 250, 500, 1000, 2000].find(s => (max - min) / s <= 6) || 5000;
    const u = Math.floor(min / schritt) * schritt, o = Math.max(u + schritt, Math.ceil(max / schritt) * schritt);
    const x = i => L + (B - L - RR) * (i - i0) / Math.max(1, i1 - i0), y = v => OO + (H - OO - U) * (1 - (v - u) / (o - u));
    const linie = (a, nur) => { let d = '', an = false; a.forEach((v, i) => { if (v == null || i < i0 || i > i1 || (nur && !nur(i))) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    const gesch = i => statusAm(R.Y, z.id, i) === 5, hatGesch = q.some((v, i) => v != null && gesch(i));
    let s = '';
    for (let v = u; v <= o; v += schritt) s += (v > u ? `<line class="gitter" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    s += `<text x="${L}" y="${OO - 9}" class="fett">m³/s</text><line class="achse" x1="${L}" x2="${B - RR}" y1="${y(u)}" y2="${y(u)}"/>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); if (i < i0 || i > i1) continue; s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${y(u)}" y2="${y(u) + 5}"/><text x="${x(i) + 4}" y="${y(u) + 18}">${T.monate[m]}</text>`; }
    if (linien) for (const [name, v] of [['L*', O.tief], [O.glw && Math.abs(O.hoch - O.deckel) <= 15 ? 'H* = GlW' : 'H*', O.hoch], ...(O.glw && O.deckel - O.tief > 15 && Math.abs(O.hoch - O.deckel) > 15 ? [['GlW', O.deckel]] : [])]) if (v >= u && v <= o) s += `<line class="schwelle" x1="${L}" x2="${B - RR}" y1="${y(v)}" y2="${y(v)}"/><text class="fett" x="${B - RR - 4}" y="${name[0] === 'H' ? y(v) - 5 : y(v) + 15}" text-anchor="end">${name} ${zahl(v)}</text>`;
    if (R.i1 != null && tagAnsicht() && R.i1 >= i0 && R.i1 <= i1) s += `<line class="tag" x1="${x(R.i1)}" x2="${x(R.i1)}" y1="${OO}" y2="${y(u)}"/>`;
    s += `<path class="gemessen" d="${linie(q, i => !gesch(i))}"/>` + (hatGesch ? `<path class="geschaetzt" d="${linie(q, gesch)}"/>` : '') + `<path class="simuliert" d="${linie(qs)}"/>` +
      `<line class="lot" id="lot" y1="${OO}" y2="${y(u)}" visibility="hidden"/><rect id="flaeche" x="${L}" y="${OO}" width="${B - L - RR}" height="${H - OO - U}" fill="transparent"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s; svg.setAttribute('aria-label', `${z.gewaesser}–${z.name} ${Z.jahr}`);
    $('simlegende').innerHTML = `<span><i></i>${h(z.gewaesser)}–${h(kurz(z))} ${Z.jahr}, ${T.gemessen}</span>` + (hatGesch ? `<span><i class="punkte"></i>${T.geschaetzt}</span>` : '') +
      `<span><i class="blau"></i>${T.simu.toLowerCase()}</span>` + (linien ? `<span><i class="strich"></i>L*, H*${O.glw ? ', GlW' : ''}</span>` : '');
    // Speicherinhalt: eigene kleine Grafik mit eigener Achse, schraffierte Fläche
    const sp = $('speicher'), SH = 150, vmax = Math.max(1, ...O.speicher) / 1e6, ys = v => 20 + (SH - 46) * (1 - v / vmax);
    let d = `M${x(i0)},${ys(0)}`; for (let i = i0; i <= i1; i++) d += `L${x(i).toFixed(1)},${ys(O.speicher[i] / 1e6).toFixed(1)}`; d += `L${x(i1)},${ys(0)}Z`;
    sp.setAttribute('viewBox', `0 0 ${B} ${SH}`);
    sp.innerHTML = `<defs><pattern id="schraff" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="1.5"/></pattern></defs>` +
      `<text x="${L}" y="12" class="fett">${T.inhalt}</text><text x="${L - 8}" y="${ys(vmax) + 4}" text-anchor="end">${zahl(vmax, 0)}</text><text x="${L - 8}" y="${ys(0) + 4}" text-anchor="end">0</text>` +
      `<path class="inhalt" d="${d}" fill="url(#schraff)"/><line class="achse" x1="${L}" x2="${B - RR}" y1="${ys(0)}" y2="${ys(0)}"/>`;
    const tip = $('tip'), lot = $('lot');
    const zeige = ev => {
      const r = svg.getBoundingClientRect(), i = Math.max(i0, Math.min(i1, i0 + Math.round(((ev.clientX - r.left) / r.width * B - L) / (B - L - RR) * (i1 - i0))));
      lot.setAttribute('x1', x(i)); lot.setAttribute('x2', x(i)); lot.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${datum(isoTag(Z.jahr, i))}</b><br>${gesch(i) ? T.geschaetzt : T.gemessen}: <b>${zahl(q[i])} m³/s</b>` +
        (q[i] != null ? `<br>${T.simu.toLowerCase()}: <b>${zahl(qs[i])} m³/s</b><br>${T.diff}: <b>${vz(qs[i] - q[i], 1)} m³/s</b><br>${T.inhalt.split(',')[0]}: <b>${zahl(O.speicher[i] / 1e6, 1)} Mio. m³</b>` : '');
      const lx = x(i) / B * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, lx > r.width / 2 ? lx - tip.offsetWidth - 10 : lx + 10)) + 'px';
    };
    $('flaeche').addEventListener('pointermove', zeige); $('flaeche').addEventListener('pointerdown', zeige);
    $('flaeche').addEventListener('pointerleave', () => { tip.hidden = true; lot.setAttribute('visibility', 'hidden'); });
    return [i0, i1];
  }
  // Zweite Grafik: Abgabe und Rückhalt je Tag an den Seen, gestapelt nach Seegruppe (Muster), gleiche Zeitachse wie der Verlauf
  function abgabeGrafik(R, i0, i1) {
    const S = R.S, B = 1000, H = 210, L = 62, RR = 14, svg = $('abgabe'), teile = S.teile.filter(x => x.teil > 0);
    let auf = 0, ab = 0; for (let i = i0; i <= i1; i++) { auf = Math.max(auf, S.aktion[i]); ab = Math.min(ab, S.aktion[i]); }
    if (!auf && !ab) { svg.innerHTML = ''; $('abgabelegende').innerHTML = ''; return; }
    const o = 26, u = H - 12, spanne = (auf - ab) || 1, y = v => o + (u - o) * (auf - v) / spanne, x = i => L + (B - L - RR) * (i - i0) / Math.max(1, i1 - i0), bw = Math.max(1, (B - L - RR) / Math.max(1, i1 - i0));
    const stil = { m0: '#000', m1: 'url(#p1)', m2: 'url(#p2)', m3: 'url(#p3)', m5: 'url(#p5)' };
    let s = `<defs><pattern id="p1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="2"/></pattern>` +
      `<pattern id="p2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="3.2"/></pattern>` +
      `<pattern id="p3" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><line x1="0" y1="1" x2="4" y2="1" stroke="#000" stroke-width="1.5"/></pattern>` +
      `<pattern id="p5" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><circle cx="2" cy="2" r="1.1" fill="#000"/></pattern></defs>`;
    for (const g of teile) {                    // je Gruppe eine Fläche: Treppenlinie zwischen unterer und oberer Stapelgrenze
      const vor = teile.slice(0, teile.indexOf(g)).reduce((a, t) => a + t.teil, 0);
      let d = '';
      for (let i = i0; i <= i1; i++) { const v = S.aktion[i]; if (!v) continue; const y0 = y(v * vor), y1 = y(v * (vor + g.teil)); d += `M${(x(i) - bw / 2).toFixed(1)},${y0.toFixed(1)}h${bw.toFixed(1)}V${y1.toFixed(1)}h${(-bw).toFixed(1)}Z`; }
      s += `<path d="${d}" fill="${stil[MUSTER[g.g]]}"/>`;
    }
    s += `<line class="achse" x1="${L}" x2="${B - RR}" y1="${y(0)}" y2="${y(0)}"/><text class="fett" x="${L}" y="14">${T.abgabeTitel}${S.lz ? ` (${T.wirktSpaeter} ${S.lz})` : ''}</text>` +
      (auf ? `<text x="${L - 8}" y="${y(auf) + 4}" text-anchor="end">+${zahl(auf)}</text>` : '') + `<text x="${L - 8}" y="${y(0) + 4}" text-anchor="end">0</text>` + (ab ? `<text x="${L - 8}" y="${y(ab) + 4}" text-anchor="end">${zahl(ab)}</text>` : '');
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    $('abgabelegende').innerHTML = teile.map(g => `<span><i class="muster ${MUSTER[g.g]}"></i>${h(T[g.g])}</span>`).join('');
  }
  function seeTafel(R) {
    const S = R.S, Y = R.Y;
    const zeilen = S.teile.filter(x => x.teil > 0).map(g => {
      let vol = 0, maxA = 0, maxR = 0; for (const v of S.aktion) { if (v > 0) { vol += v * g.teil * SEK; maxA = Math.max(maxA, v * g.teil); } else maxR = Math.max(maxR, -v * g.teil); }
      const q = Y.q[g.knoten], qs = S.q[g.knoten], min = a => a ? Math.min(...a.filter(x => x != null)) : null;
      return `<tr><td><i class="muster ${MUSTER[g.g]}" style="display:inline-block;width:22px;height:12px;margin-right:10px;outline:1px solid #000;outline-offset:-1px;vertical-align:-1px"></i>${h(T[g.g])}</td><td class="z">${zahl(100 * g.teil, 1)} %</td><td class="z">${zahl(vol / 1e6, 1)}</td><td class="z">+${zahl(maxA, 1)}</td><td class="z">−${zahl(maxR, 1)}</td>` +
        `<td>${h(ST[g.knoten].gewaesser)}–${h(kurz(ST[g.knoten]))}</td><td class="z">${qz(min(q))} → ${qz(min(qs))}</td></tr>`;
    }).join('');
    $('seetafel').innerHTML = `<h2>${T.seeTitel}</h2><div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.sAnteil}</th><th class="z">${T.sVol}</th><th class="z">${T.sMaxA}</th><th class="z">${T.sMaxR}</th><th>${T.sOrt}</th><th class="z">${T.sMin}</th></tr></thead><tbody>${zeilen}</tbody></table></div><p class="hinweis">${T.seeHinweis}</p>`;
  }

  // ------------------------------------------------------------ Herleitung: Formeln mit den Zahlen des angezeigten Tages
  function herleitung(R) {
    const el = $('hertext'), f = s => `<p class="formel">${s}</p>`, r = s => `<p class="rechnung">${s}</p>`, t = (de, fr) => FR ? fr : de;
    let html = '';
    const a = R.a || R.zeige, z = ST[Z.ziel];
    // 1 Zwischengebiet
    html += `<h3>1 ${t('Zwischengebiet', 'Bassin intermédiaire')}</h3><p>${t('Der Rest eines Knotens k ist sein gemessener Abfluss minus die Summe der Messstellen direkt oberhalb, je um die Fliesszeit τ versetzt.', 'Le reste d’un nœud k est son débit mesuré moins la somme des stations situées juste en amont, décalées du temps de parcours τ.')}</p>` +
      f('R<sub>k</sub>(t) = Q<sub>k</sub>(t) − Σ<sub>j</sub> Q<sub>j</sub>(t − τ<sub>jk</sub>)');
    if (a && tagAnsicht() && R.Y && R.i0 === R.i1) {
      const ob = oben(Z.ziel), q = R.Y.q, teile = ob.map(k => ({ k, v: wert(q, k.von, R.i1 - k.tage) })).filter(x => x.v != null), zq = wert(q, Z.ziel, R.i1);
      if (teile.length && zq != null) html += r(`${h(kurz(z))}, ${datum(isoTag(Z.jahr, R.i1))}: R = ${qz(zq)} − (${teile.map(x => `${qz(x.v)} ${h(kurz(ST[x.k.von]))}${x.k.tage ? ` [t − ${x.k.tage}]` : ''}`).join(' + ')}) = <b>${qz(zq - teile.reduce((s, x) => s + x.v, 0))} m³/s</b>`);
    }
    // 2 Anteile
    html += `<h3>2 ${t('Anteile', 'Parts')}</h3><p>${t('Der Abfluss am Ziel ist die Summe aller Quellknoten (gemessen) und aller Reste oberhalb. Der Anteil eines Glieds i ist sein Wert durch den Abfluss am Ziel.', 'Le débit à la station du bilan est la somme de tous les nœuds sources (mesurés) et de tous les restes en amont. La part d’une composante i est sa valeur divisée par ce débit.')}</p>` +
      f(`Q<sub>${t('Ziel', 'bilan')}</sub>(t) = Σ<sub>i</sub> G<sub>i</sub>(t − τ<sub>i</sub>) &nbsp;&nbsp; a<sub>i</sub> = G<sub>i</sub>(t − τ<sub>i</sub>) / Q<sub>${t('Ziel', 'bilan')}</sub>(t)`);
    if (a) { const aare = abfluss(a, '2205'), alp = a.mittel['Q:2473']; if (aare != null) html += r(`${t('Aare in Stilli', 'Aar à Stilli')}: ${qz(aare)} / ${qz(a.ziel_mittel)} = <b>${zahl(100 * aare / a.ziel_mittel, 1)} %</b>` + (alp != null ? ` &nbsp;·&nbsp; ${t('Alpenrhein in Diepoldsau', 'Rhin alpin à Diepoldsau')}: ${qz(alp)} / ${qz(a.ziel_mittel)} = <b>${zahl(100 * alp / a.ziel_mittel, 1)} %</b>` : '')); }
    // 3 Kontrollbilanz
    if (a) { const kk = a.mittel['R:2205'], g = ['2016', '2018', '2243'].map(id => abfluss(a, id)), st = abfluss(a, '2205');
      if (kk != null && g.every(x => x != null)) html += `<h3>3 ${t('Kontrollbilanz Aare', 'Contrôle Aar')}</h3>` + f('Δ = Q<sub>Stilli</sub> − (Q<sub>Brugg</sub> + Q<sub>Mellingen</sub> + Q<sub>Baden</sub>)') + r(`Δ = ${qz(st)} − (${g.map(qz).join(' + ')}) = <b>${qz(kk)} m³/s</b> (${zahl(100 * kk / st, 1)} %)`); }
    // 4 Speicher
    const seen = meta.seen.filter(s => CM[s.id] > 0), V = seen.reduce((s, x) => s + CM[x.id] * x.flaeche_km2 / 100, 0);
    html += `<h3>4 ${t('Staukapazität', 'Capacité de retenue')}</h3><p>${t('Fläche mal zusätzliche Stauhöhe. 1 km² mal 1 cm sind 0,01 Mio. m³.', 'Surface fois hauteur supplémentaire. 1 km² fois 1 cm font 0,01 mio m³.')}</p>` + f('V = Σ<sub>s</sub> A<sub>s</sub> · Δh<sub>s</sub>') +
      (seen.length ? r(`V = ${seen.map(s => `${zahl(s.flaeche_km2, 1)} km² · ${CM[s.id]} cm`).join(' + ')} = <b>${zahl(V, 1)} Mio. m³</b>`) : '');
    // 5 Rückhalt
    const O = R.S && R.S.O, glw = O ? O.glw : Z.modus === 'glw';
    html += `<h3>5 ${t('Rückhalt und Abgabe', 'Retenue et restitution')}</h3>` + (glw
      ? `<p>${t('Bezugswert ist der Abfluss beim GlW in Kaub, Q<sub>GlW</sub>. Jede Anhebung darunter zählt. Unter L wird abgegeben, mit L höchstens Q<sub>GlW</sub>: Alle Tage unter L kommen auf L, die tiefsten gewinnen am meisten. Gestaut wird nur über H, mit H mindestens Q<sub>GlW</sub>, also nie an einem Tag unter dem GlW; höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt.', 'La référence est le débit au GlW à Kaub, Q<sub>GlW</sub>. Chaque relèvement en dessous compte. Sous L on restitue, avec L au plus égal à Q<sub>GlW</sub> : tous les jours sous L montent à L, les plus bas gagnent le plus. On ne retient qu’au-dessus de H, avec H au moins égal à Q<sub>GlW</sub>, donc jamais un jour sous le GlW ; au plus 10 % du débit et seulement tant qu’un jour sous L suit encore.')}</p>` +
        f(`${t('Abgabe', 'Restitution')} a(t) = L − Q(t), ${t('wenn', 'si')} Q(t) &lt; L, &nbsp; L ≤ Q<sub>GlW</sub><br>${t('Rückhalt', 'Retenue')} r(t) = min(Q(t) − H, 0,10 · Q(t)), ${t('wenn', 'si')} Q(t) &gt; H, &nbsp; H ≥ Q<sub>GlW</sub><br>S(t + 1) = S(t) + 86 400 · (r(t) − a(t)), &nbsp; 0 ≤ S(t) ≤ V, &nbsp; S(1.1.) = 0<br>${t('Bedarf für alle Tage', 'Besoin pour tous les jours')} = 86 400 · Σ max(0, Q<sub>GlW</sub> − Q(t))`) +
        `<p>${t('L* ist das grösste L bis Q<sub>GlW</sub>, bei dem der Speicher nie leer läuft. H* ist das grösste H, mit dem L* noch hält. Beide werden durch Halbieren des Intervalls gesucht.', 'L* est le plus grand L jusqu’à Q<sub>GlW</sub> pour lequel le réservoir ne se vide jamais. H* est le plus grand H qui tient encore L*. Tous deux sont cherchés par dichotomie.')}</p>`
      : `<p>${t('Zwei Schwellen am Ziel steuern den Speicher. Unter L wird abgegeben, über H wird gestaut, höchstens 10 % des Abflusses und nur, solange noch ein Tag unter L folgt.', 'Deux seuils à la station du bilan commandent le réservoir. Sous L on restitue, au-dessus de H on retient, au plus 10 % du débit et seulement tant qu’un jour sous L suit encore.')}</p>` +
        f(`${t('Abgabe', 'Restitution')} a(t) = L − Q(t), ${t('wenn', 'si')} Q(t) &lt; L<br>${t('Rückhalt', 'Retenue')} r(t) = min(Q(t) − H, 0,10 · Q(t)), ${t('wenn', 'si')} Q(t) &gt; H<br>S(t + 1) = S(t) + 86 400 · (r(t) − a(t)), &nbsp; 0 ≤ S(t) ≤ V, &nbsp; S(1.1.) = 0`) +
        `<p>${t('L* ist das grösste L, bei dem der Speicher nie leer läuft. H* ist das grösste H, mit dem L* noch hält. Beide werden durch Halbieren des Intervalls gesucht.', 'L* est le plus grand L pour lequel le réservoir ne se vide jamais. H* est le plus grand H qui tient encore L*. Tous deux sont cherchés par dichotomie.')}</p>`);
    if (O && R.sz) html += r(`${h(kurz(ST[R.S.zid]))} ${Z.jahr}: ${glw ? `Q<sub>GlW</sub> = ${zahl(O.deckel)} m³/s, ` : ''}L* = <b>${zahl(O.tief, 1)} m³/s</b>, H* = <b>${zahl(O.hoch, 1)} m³/s</b>. ${t('Abgabe an', 'Restitution sur')} ${R.sz.tA} ${T.tageW}, ${t('Rückhalt an', 'retenue sur')} ${R.sz.tR} ${T.tageW}. ${t('Kleinster Tagesabfluss', 'Plus faible débit journalier')}: ${zahl(R.sz.min0, 1)} → <b>${zahl(R.sz.min1, 1)} m³/s</b>.` +
      (glw ? ` ${t('Bedarf für alle Tage', 'Besoin pour tous les jours')}: <b>${zahl(O.bedarf / 1e6)} Mio. m³</b>, ${t('vorhanden', 'disponible')}: ${zahl(V, 1)} Mio. m³.` : ''));
    html += `<p>${t('Die Seen teilen sich Abgabe und Rückhalt im Verhältnis ihrer zusätzlichen Kapazität; die Aktion am See liegt um die Fliesszeit τ vor der Wirkung am Ziel.', 'Les lacs se partagent restitution et retenue au prorata de leur capacité supplémentaire ; l’action au lac précède l’effet à la station du bilan du temps de parcours τ.')}</p>` +
      f(`a<sub>s</sub>(t) = (V<sub>s</sub> / V) · a(t + τ) &nbsp;&nbsp; r<sub>s</sub>(t) = (V<sub>s</sub> / V) · r(t + τ)`);
    // 6 Pegel Kaub
    if (KURVE.length) {
      html += `<h3>6 ${t('Pegel Kaub und Fahrrinnentiefe', 'Échelle de Kaub et profondeur du chenal')}</h3><p>${t('Der Wasserstand folgt aus dem Abfluss über die Abflusskurve: linear zwischen den zwei benachbarten Stützpunkten. Ausserhalb der Stützpunkte gibt es keinen Wert.', 'Le niveau découle du débit par la courbe de tarage : interpolation linéaire entre les deux points voisins. Hors de ces points, pas de valeur.')} ${h(K.abflusskurve_quelle || '')}. ${KURVE.length} ${t('Stützpunkte von', 'points de')} ${zahl(KURVE[0][0])} ${t('bis', 'à')} ${zahl(KURVE[KURVE.length - 1][0])} m³/s.</p>` +
        f(`W(Q) = W<sub>1</sub> + (W<sub>2</sub> − W<sub>1</sub>) · (Q − Q<sub>1</sub>) / (Q<sub>2</sub> − Q<sub>1</sub>) &nbsp;&nbsp; T = W − GlW + T<sub>GlW</sub>`);
      const qk = R.Y && tagAnsicht() ? wert(R.Y.q, KAUB, R.i1) : null;
      if (qk != null && wAusQ(qk) != null) { let i = 1; while (KURVE[i][0] < qk) i++; const p = KURVE[i - 1], p2 = KURVE[i], w = wAusQ(qk);
        html += r(`Q = ${qz(qk)} m³/s: W = ${zahl(p[1], 1)} + (${zahl(p2[1], 1)} − ${zahl(p[1], 1)}) · (${qz(qk)} − ${qz(p[0])}) / (${qz(p2[0])} − ${qz(p[0])}) = <b>${zahl(w, 0)} cm</b> &nbsp;·&nbsp; T = ${zahl(w)} − ${zahl(GLW)} + ${zahl(TUG)} = <b>${zahl(w - GLW + TUG)} cm</b>`); }
      html += r(`GlW = ${zahl(GLW)} cm ${t('entspricht', 'correspond à')} <b>${zahl(Q_GLW)} m³/s</b>. ${t('In diesem Bereich ändert 1 m³/s den Pegel um', 'Dans cette plage, 1 m³/s modifie le niveau de')} ${zahl((wAusQ(Q_GLW + 50) - wAusQ(Q_GLW - 50)) / 100, 2)} cm.`);
    }
    // 7 Schätzung
    const m = K.schaetzung;
    if (m) { const kz = k => k.map((x, i) => (i ? (x < 0 ? ' − ' : ' + ') : '') + zahl(Math.abs(x), i ? 3 : 1) + ['', ' · B', ' · T<sub>30</sub>', ' · T<sub>120</sub>'][i]).join(''), p = m.pruefung_roh;
      html += `<h3>7 ${t('Schätzung für Kaub an Tagen ohne Messwert', 'Estimation pour Kaub les jours sans mesure')}</h3><p>${t('Seit dem 1.1.2026 gibt es für Kaub nur Rohwerte der letzten 31 Tage. Die übrigen Tage sind aus Basel und der Thur geschätzt. B ist der Abfluss in Basel zwei Tage zuvor, T das Mittel der Thur in Andelfingen über 30 und 120 Tage. Die Thur ist nicht reguliert und steht für die regengespeisten Zuflüsse unterhalb von Basel.', 'Depuis le 1.1.2026, Kaub ne dispose que des données brutes des 31 derniers jours. Les autres jours sont estimés à partir de Bâle et de la Thur. B est le débit à Bâle deux jours plus tôt, T la moyenne de la Thur à Andelfingen sur 30 et 120 jours. La Thur n’est pas régulée et représente les affluents pluviaux en aval de Bâle.')}</p>` +
        f(`Q<sub>Kaub</sub>(t) ≈ a + b · B(t − 2) + c · T<sub>30</sub>(t − 2) + d · T<sub>120</sub>(t − 2)`) +
        r(`B ≤ ${zahl(m.grenze)} m³/s: Q ≈ ${kz(m.niedrig.k)} &nbsp; (${zahl(m.niedrig.tage)} ${T.tageW}, ${t('Streuung', 'écart type')} ${zahl(m.niedrig.rmse)} m³/s)<br>B &gt; ${zahl(m.grenze)} m³/s: Q ≈ ${kz(m.sonst.k)} &nbsp; (${zahl(m.sonst.tage)} ${T.tageW}, ${t('Streuung', 'écart type')} ${zahl(m.sonst.rmse)} m³/s)`) +
        `<p>${t('Angepasst mit kleinsten Quadraten an die geprüften Tageswerte', 'Ajusté par moindres carrés aux valeurs journalières contrôlées')} ${m.jahre[0]}–${m.jahre[1]}.` + (p ? ` ${t('Geprüft an den Rohwerten vom', 'Vérifié sur les données brutes du')} ${datum(p.von)} ${t('bis', 'au')} ${datum(p.bis)} (${p.tage} ${T.tageW}): ${t('Die Schätzung lag im Mittel', 'l’estimation était en moyenne de')} <b>${vz(p.mittel, 0)} m³/s</b> ${t('daneben, Streuung', 'à côté, écart type')} <b>${zahl(p.rmse)} m³/s</b>. ${t('Das entspricht in Kaub rund', 'Cela correspond à Kaub à environ')} ${zahl(p.rmse * (wAusQ(Q_GLW + 50) - wAusQ(Q_GLW - 50)) / 100)} cm. ${t('Geschätzte Werte ersetzen keine Messung.', 'Les valeurs estimées ne remplacent pas une mesure.')}` : '') + '</p>'; }
    el.innerHTML = html;
  }

  // ------------------------------------------------------------ Fuss
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Lacs : OFEV, fiches « Seeregulierung » (2020)' : 'Seen: BAFU, Faktenblätter «Seeregulierung» (2020)'} – <a href="https://www.bafu.admin.ch/de/wichtige-seeregulierungen">bafu.admin.ch/de/wichtige-seeregulierungen</a>; IGKB</li>` +
    `<li>${FR ? 'Fond de carte' : 'Grundkarte'}: © swisstopo; © OpenStreetMap (ODbL). ${h(karte.quelle)}</li></ul>`;
  $('stand').textContent = `${T.standT}: ${datum(meta.stand.slice(0, 10))}` + (meta.meldungen.length ? ` · ${meta.meldungen.join(' · ')}` : '');

  // ------------------------------------------------------------ Ablauf
  let lauf_ = 0;
  async function alles(nurWerte) {
    const nr = ++lauf_, R = await rechnen();
    if (nr !== lauf_) return;
    if (!nurWerte) { wahlZeichnen(R.Y); simWahl(R); }
    else { const d = $('wahl').querySelector('input[type=date]'); if (d && Z.tag != null) d.value = isoTag(Z.jahr, Z.tag); }
    lageZeichnen(R); karteZeichnen(R); herkunftZeichnen(R); bilanzZeichnen(R); seenZeichnen(R); simZeichnen(R); herleitung(R);
  }
  simSeen(); alles();
})();
