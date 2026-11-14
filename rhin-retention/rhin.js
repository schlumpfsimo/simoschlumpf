// Rhein – Abflussbilanz und Rückhalt.
// Daten: daten/meta.json, daten/karte.json, daten/jahr/<Jahr>.json, erzeugt vom Python-Werkzeug (werkzeug/, siehe README).
// Diese Datei zeichnet die Karte (Leaflet), rechnet die Bilanz eines Tages nach derselben Logik wie
// werkzeug/rheinbilanz/bilanz.py und legt die Simulation des Rückhalts darüber.
// Fehlende Werte bleiben leer, nichts wird interpoliert.
(async () => {
  'use strict';
  const FR = new URLSearchParams(location.search).get('l') === 'fr';
  document.documentElement.lang = FR ? 'fr' : 'de';

  // ------------------------------------------------------------ Texte
  const T = FR ? {
    titel: 'Rhin · Bilan des débits', lead: 'D’où vient l’eau du Rhin à Bâle et à Kaub, aujourd’hui, lors des étiages extrêmes et n’importe quel jour. Et ce qui changerait si les lacs avaient retenu de l’eau au printemps.',
    ziel: 'Bilan pour', ansicht: 'Vue', heute: 'Aujourd’hui', extrem: 'Extrêmes', tag: 'Date', mq: 'Moyenne', nw: 'Étiage moyen', jahr: 'Année', datum: 'Date', lage: 'Étiage',
    werte: 'Valeurs', gem: 'Mesuré', simu: 'Simulé', glied: 'Composante', anteil: 'Part', gemessen: 'mesuré', rest: 'reste (bassin intermédiaire)', negativ: 'reste négatif',
    zwischen: 'Bassin intermédiaire', kontrolle: 'Contrôle Aar : Stilli − (Brugg + Reuss + Limmat)', inkl: 'y compris', ohneReihe: 'sans série',
    tage: 'jours avec valeurs complètes', von_: 'sur', periode: 'Période', bis: 'au',
    mqText: 'Moyenne de tous les jours', nwText: 'Moyenne des 7 jours les plus secs de chaque année (NM7Q) à cette station',
    keine: 'Pas de bilan : des valeurs manquent pour ce jour.', status: 'État de validation', letzter: 'Dernier jour avec valeurs complètes', nm7qVon: 'Plus faible moyenne sur 7 jours de',
    seen: 'Lacs', see: 'Lac', stand: 'Niveau', aenderung: 'Variation', speicher: 'Variation du stock', fuellt: 'Positif : le lac se remplit et retient de l’eau. Calculé avec une surface constante.',
    station: 'Station de mesure', nr: 'Numéro', abfluss: 'Débit', anteilAn: 'Part à', quelle: 'Source', restK: 'Bassin intermédiaire (reste)', mqK: 'MQ', nm7q: 'NM7Q moyen', nm7qMin: 'NM7Q le plus bas',
    regulierung: 'Régulation', grenzen: 'Limites', flaeche: 'Surface', reguliert: 'régulé', unreguliert: 'non régulé', keinWehr: 'Lac non régulé, pas de barrage.',
    simTitel: 'Simulation de la retenue', simLead: 'Et si les lacs avaient retenu un peu plus d’eau au printemps pour la restituer à l’étiage ? Choisissez la tranche supplémentaire par lac (tous ou quelques-uns), la période de retenue et la restitution. La carte et le bilan montrent alors l’état simulé.',
    alle: 'Tous les lacs régulés', rueck: 'Retenue du', abgabe: 'Restitution dès le', dauer: 'Durée (jours)', auto: 'Automatique', band: 'Tranche utilisée 1991–2020', jecm: 'Par cm', zusatz: 'Tranche suppl.', vol: 'Volume',
    grenzenK: 'Limites de régulation m s. m. · mio m³', volumen: 'Volume retenu', plus: 'Débit supplémentaire', minus: 'Débit retenu', nm7qSim: 'NM7Q', pegel: 'Échelle de Kaub', pegelTief: 'Échelle de Kaub (7 jours les plus bas)',
    maxAnteil: 'Retenue maximale', vomAbfluss: 'du débit à', fRueck: 'Retenue', fAbgabe: 'Restitution', diff: 'Écart', ausschnitt: 'Extrait', ganz: 'Année', phase: 'Restitution',
    keinJahr: 'Pas de valeurs journalières pour cette station et cette année.', warn: 'La restitution commence avant la fin de la retenue.', nurTag: 'La simulation s’applique aux vues « Aujourd’hui », « Extrêmes » et « Date ».',
    autoHeute: 'Automatique : la restitution se termine le jour affiché.', autoTief: 'Automatique : la restitution couvre les 7 jours les plus secs de l’année.',
    simHinweis: 'Modèle simple : le volume est retenu et restitué de façon uniforme et se déplace vers l’aval avec le temps de parcours, sans atténuation. Les règlements de régulation, la protection contre les crues et l’écologie ne sont pas pris en compte. Le lac de Constance n’est pas régulé ; une tranche y est hypothétique. Niveau à Kaub d’après les couples niveau/débit journaliers de la même année.',
    methode: 'Méthode', quellen: 'Sources', standT: 'Données du', monate: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    legende: 'Largeur du trait = débit. Noir : débit de la station amont. Gris : apport du bassin intermédiaire (reste calculé). Bleu : tronçon modifié par la simulation. Carré : station de mesure. Triangle : lac régulé. Cercle : lac non régulé.', fehlt: 'Les données n’ont pas pu être chargées.',
    meth: ['Réseau : graphe orienté, nœuds = stations, arêtes = tronçons. Reste = débit mesuré moins la somme des stations amont.',
      'Temps de parcours : hypothèses en jours entiers (Bâle–Maxau 1 jour, Maxau–Worms 1 jour, Neckar–Worms 1 jour, sinon 0 ; Bâle–Kaub 2 jours), non mesurés.',
      'MQ et NM7Q calculés à partir des valeurs journalières : stations OFEV 1991–2020, stations allemandes 2010–2020. NM7Q = plus faible moyenne sur 7 jours de l’année civile.',
      'Extrêmes : les douze NM7Q annuels les plus bas depuis le début des séries (Bâle dès 1970, Kaub dès 2008).',
      'Stations allemandes : valeurs journalières contrôlées de l’annuaire hydrologique (2008–2025) ; ensuite seulement les données brutes des 31 derniers jours (PEGELONLINE). Entre deux, il n’y a pas de valeurs. Neckar : 2010–2020.',
      'Lacs : variation du stock = surface × variation du niveau moyen journalier. Surfaces et limites d’après les fiches OFEV « Seeregulierung » (2020). Lac de Constance : 536 km² selon l’IGKB, répartition non officielle.',
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.'],
  } : {
    titel: 'Rhein · Abflussbilanz', lead: 'Woher das Wasser des Rheins in Basel und in Kaub kommt: heute, in den extremen Niedrigwasserlagen und an jedem beliebigen Tag. Und was anders wäre, wenn die Seen im Frühling Wasser zurückgehalten hätten.',
    ziel: 'Bilanz für', ansicht: 'Ansicht', heute: 'Heute', extrem: 'Extremwerte', tag: 'Datum', mq: 'Mittelwasser', nw: 'Mittleres Niedrigwasser', jahr: 'Jahr', datum: 'Datum', lage: 'Niedrigwasserlage',
    werte: 'Werte', gem: 'Gemessen', simu: 'Simuliert', glied: 'Bilanzglied', anteil: 'Anteil', gemessen: 'gemessen', rest: 'Rest (Zwischengebiet)', negativ: 'negativer Rest',
    zwischen: 'Zwischengebiet', kontrolle: 'Kontrollbilanz Aare: Stilli − (Brugg + Reuss + Limmat)', inkl: 'inkl.', ohneReihe: 'ohne Messreihe',
    tage: 'Tage mit vollständigen Werten', von_: 'von', periode: 'Periode', bis: 'bis',
    mqText: 'Mittel aller Tage', nwText: 'Mittel der sieben trockensten Tage jedes Jahres (NM7Q) an dieser Messstelle',
    keine: 'Keine Bilanz: Für diesen Tag fehlen Werte.', status: 'Freigabestatus', letzter: 'Letzter Tag mit vollständigen Werten', nm7qVon: 'Kleinstes 7-Tage-Mittel von',
    seen: 'Seen', see: 'See', stand: 'Stand', aenderung: 'Änderung', speicher: 'Speicheränderung', fuellt: 'Positiv: Der See füllt sich und hält Wasser zurück. Gerechnet mit konstanter Seefläche.',
    station: 'Messstation', nr: 'Nummer', abfluss: 'Abfluss', anteilAn: 'Anteil an', quelle: 'Quelle', restK: 'Zwischengebiet (Rest)', mqK: 'MQ', nm7q: 'Mittleres NM7Q', nm7qMin: 'Kleinstes NM7Q',
    regulierung: 'Regulierung', grenzen: 'Grenzen', flaeche: 'Fläche', reguliert: 'reguliert', unreguliert: 'nicht reguliert', keinWehr: 'Nicht regulierter See, kein Wehr.',
    simTitel: 'Simulation Rückhalt', simLead: 'Was wäre, wenn die Seen im Frühling etwas mehr Wasser zurückgehalten und es bei Niedrigwasser abgegeben hätten? Wähle das Zusatzband je See (alle oder nur einzelne), die Zeit des Rückhalts und die Abgabe. Karte und Bilanz zeigen dann den simulierten Zustand.',
    alle: 'Alle regulierten Seen', rueck: 'Rückhalt von', abgabe: 'Abgabe ab', dauer: 'Dauer (Tage)', auto: 'Automatisch', band: 'Genutztes Band 1991–2020', jecm: 'Je cm', zusatz: 'Zusatzband', vol: 'Volumen',
    grenzenK: 'Reguliergrenzen m ü. M. · Mio. m³', volumen: 'Rückhaltevolumen', plus: 'Zusatzabfluss', minus: 'Minderabfluss', nm7qSim: 'NM7Q', pegel: 'Pegel Kaub', pegelTief: 'Pegel Kaub (tiefste 7 Tage)',
    maxAnteil: 'Rückhalt höchstens', vomAbfluss: 'des Abflusses in', fRueck: 'Rückhalt', fAbgabe: 'Abgabe', diff: 'Differenz', ausschnitt: 'Ausschnitt', ganz: 'Jahr', phase: 'Abgabe',
    keinJahr: 'Für diese Messstelle liegen in diesem Jahr keine Tageswerte vor.', warn: 'Die Abgabe beginnt vor dem Ende des Rückhalts.', nurTag: 'Die Simulation wirkt in den Ansichten «Heute», «Extremwerte» und «Datum».',
    autoHeute: 'Automatisch: Die Abgabe endet am angezeigten Tag.', autoTief: 'Automatisch: Die Abgabe deckt die sieben trockensten Tage des Jahres.',
    simHinweis: 'Einfaches Modell: Das Volumen wird gleichmässig zurückgehalten und abgegeben und wandert mit der Fliesszeit talwärts, ohne Abflachung. Regulierreglemente, Hochwasserschutz und Ökologie sind nicht berücksichtigt. Der Bodensee ist nicht reguliert; ein Band dort ist hypothetisch. Pegel Kaub aus den Tageswertpaaren Wasserstand/Abfluss desselben Jahres.',
    methode: 'Methode', quellen: 'Quellen', standT: 'Datenstand', monate: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    legende: 'Strichbreite = Abfluss. Schwarz: Abfluss der Messstelle oberhalb. Grau: Zuwachs aus dem Zwischengebiet (gerechneter Rest). Blau: Strecke, die die Simulation verändert. Quadrat: Messstation. Dreieck: regulierter See. Kreis: nicht regulierter See.', fehlt: 'Die Daten konnten nicht geladen werden.',
    meth: ['Netz: gerichteter Graph, Knoten = Messstellen, Kanten = Fliessstrecken. Rest = gemessener Abfluss minus Summe der Messstellen oberhalb.',
      'Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1 Tag, Maxau–Worms 1 Tag, Neckar–Worms 1 Tag, sonst 0; Basel–Kaub 2 Tage), nicht gemessen.',
      'MQ und NM7Q sind aus den Tageswerten gerechnet: BAFU-Stationen 1991–2020, deutsche Pegel 2010–2020. NM7Q = kleinstes Mittel über 7 Tage im Kalenderjahr.',
      'Extremwerte: die zwölf tiefsten jährlichen NM7Q seit Beginn der Reihen (Basel ab 1970, Kaub ab 2008).',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Deutschen Gewässerkundlichen Jahrbuch (2008–2025); danach nur Rohdaten der letzten 31 Tage (PEGELONLINE). Dazwischen gibt es keine Werte. Neckar: 2010–2020.',
      'Seen: Speicheränderung = Fläche × Änderung des Tagesmittels. Flächen und Grenzen aus den BAFU-Faktenblättern «Seeregulierung» (2020). Bodensee: 536 km² nach IGKB, Aufteilung nicht amtlich.',
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
  const vz = (x, n) => (x > 0 ? '+' : '') + zahl(x, n);
  const datum = iso => { const [j, m, t] = iso.split('-'); return `${+t}.${+m}.${j}`; };

  // ------------------------------------------------------------ Daten
  let meta, karte;
  try {
    [meta, karte] = await Promise.all(['daten/meta.json', 'daten/karte.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
  } catch (e) { $('bilanz').textContent = T.fehlt; return; }
  const ST = Object.fromEntries(meta.stationen.map(s => [s.id, s]));
  const oben = id => meta.kanten.filter(k => k.nach === id);
  const unten = id => meta.kanten.find(k => k.von === id);
  const EINZUG = {};
  const einzug = ziel => {                       // {knoten: Fliesszeit in Tagen bis zum Ziel}
    if (EINZUG[ziel]) return EINZUG[ziel];
    const e = { [ziel]: 0 }, offen = [ziel];
    while (offen.length) { const k = offen.pop(); for (const c of oben(k)) { e[c.von] = e[k] + c.tage; offen.push(c.von); } }
    return (EINZUG[ziel] = e);
  };
  const jahre = {};
  const jahr = j => jahre[j] || (jahre[j] = fetch(`daten/jahr/${j}.json`).then(r => r.ok ? r.json() : null).catch(() => null));
  const tagNr = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5);
  const isoTag = (j, i) => new Date(Date.UTC(j, 0, 1 + i)).toISOString().slice(0, 10);
  const kurz = s => s.name.split(',')[0];
  const LETZTES = meta.jahre[meta.jahre.length - 1];

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

  // ------------------------------------------------------------ Zustand
  const Z = { ziel: '25700100', ansicht: 'heute', jahr: LETZTES, tag: null, extrem: 0, sim: false, zoom: false };
  const SIM = { cm: Object.fromEntries(meta.seen.map(s => [s.id, s.reguliert ? 10 : 0])), f0: '04-01', f1: '06-30', r0: null, rd: 30, auto: true };
  const tagAnsicht = () => ['heute', 'extrem', 'tag'].includes(Z.ansicht);

  // Simulation: Rückhalt und Abgabe je See wirken an der ersten Messstelle unterhalb und wandern mit der Fliesszeit talwärts.
  function simulieren(Y, f0, f1, r0) {
    const q = {}, wirkung = {}, n = (Y.q['2289'] || Object.values(Y.q)[0]).length, nf = f1 - f0 + 1, jeKnoten = {};
    let volumen = 0;
    for (const s of meta.seen) {
      const m3 = SIM.cm[s.id] * s.flaeche_km2 * 1e4; if (!m3) continue;
      volumen += m3; jeKnoten[s.knoten] = (jeKnoten[s.knoten] || 0) + m3 / (nf * 86400);
      for (let k = s.knoten, lag = 0; k;) {
        const w = wirkung[k] || (wirkung[k] = new Float64Array(n));
        for (let i = f0; i <= f1; i++) if (i + lag < n) w[i + lag] -= m3 / (nf * 86400);
        for (let i = r0; i < r0 + SIM.rd; i++) if (i + lag >= 0 && i + lag < n) w[i + lag] += m3 / (SIM.rd * 86400);
        const u = unten(k); if (!u) break; lag += u.tage; k = u.nach;
      }
    }
    for (const id in Y.q) q[id] = wirkung[id] ? Y.q[id].map((x, i) => x == null ? null : x + wirkung[id][i]) : Y.q[id];
    return { q, wirkung, volumen, nf, jeKnoten };
  }
  function fenster(Y) {                          // Tagesnummern von Rückhalt und Abgabe; r0 automatisch, solange SIM.auto
    const j = Z.jahr, f0 = tagNr(`${j}-${SIM.f0}`), f1 = Math.max(f0, tagNr(`${j}-${SIM.f1}`)), q = Y.q[Z.ziel] || [];
    const lag = Math.max(0, ...meta.seen.map(s => einzug(Z.ziel)[s.knoten] || 0));
    if (SIM.auto || SIM.r0 == null) {
      let r;
      if ((Z.ansicht === 'heute' || Z.ansicht === 'tag') && Z.tag != null) r = Z.tag - SIM.rd + 1 - lag;
      else { const tief = Z.ansicht === 'extrem' && Z.i0 != null ? { beginn: Z.i0 } : nm7q(q); r = (tief ? tief.beginn : 273) - Math.floor((SIM.rd - 7) / 2) - lag; }
      SIM.r0 = isoTag(j, Math.max(0, Math.min(Math.max(0, q.length - SIM.rd), r))).slice(5);
    }
    return { f0, f1, r0: tagNr(`${j}-${SIM.r0}`), lag };
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
      const n = (Y.q['2289'] || []).length, iso = isoTag(Z.jahr, Z.tag);
      const j = feld(T.jahr, `<select>${meta.jahre.slice().reverse().map(x => `<option${x === Z.jahr ? ' selected' : ''}>${x}</option>`).join('')}</select>`);
      j.querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; alles(); });
      const d = feld(T.datum, `<input type="date" value="${iso}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      d.querySelector('input').addEventListener('change', e => { if (e.target.value) { Z.tag = tagNr(e.target.value); alles(); } });
      const r = document.createElement('div'); r.className = 'gruppe regler';
      r.innerHTML = `<input type="range" min="0" max="${n - 1}" value="${Z.tag}" aria-label="${T.datum}">`;
      r.querySelector('input').addEventListener('input', e => { Z.tag = +e.target.value; alles(true); });
      w.append(j, d, r);
    }
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
  const RAHMEN = { '2289': [[46.6, 7.0], [47.8, 9.8]], '25700100': [[46.6, 6.9], [50.2, 9.9]] };
  let rahmenFuer = null;
  const MIT_NAME = { '2473': 'r', '2288': 'r', '2135': 'r', '2289': 'l', '23700200': 'l', '23800690': 'r', '23900200': 'l', '24700404': 'r', '25100100': 'l', '25700100': 'l', '2044': 'r', '2029': 'l' };

  function karteZeichnen(R) {
    if (rahmenFuer !== Z.ziel) { map.fitBounds(RAHMEN[Z.ziel]); rahmenFuer = Z.ziel; }
    ebene.clearLayers();
    const a = R.zeige, e = einzug(Z.ziel), px = a ? 14 / a.ziel_mittel : 0, ll = p => [p[1], p[0]];
    const fluss = id => a && id in e && id !== Z.ziel ? abfluss(a, id) : null;   // unterhalb des Ziels wird nichts gezeichnet
    const geaendert = id => Z.sim && R.sim && R.wirk && R.wirk[id] && Math.abs(R.wirk[id]) > .05;
    const kanten = meta.kanten.slice().sort((x, y) => (fluss(y.von) || 0) - (fluss(x.von) || 0));
    for (const k of kanten) {                    // grauer Rand: Zuwachs aus dem Zwischengebiet bis zur nächsten Messstelle
      const s = karte.strecken[`${k.von}>${k.nach}`], q = fluss(k.von), r = a && a.mittel['R:' + k.nach];
      if (s && q > 0 && r > 0 && !k.zufluss) L.polyline(s.p.map(ll), { color: '#a8a8a8', weight: Math.max(2, (q + r) * px), lineCap: 'butt', interactive: false }).addTo(ebene);
    }
    for (const k of kanten) {
      const s = karte.strecken[`${k.von}>${k.nach}`]; if (!s) continue;
      const q = fluss(k.von), o = ST[k.von];
      if (q == null || q <= 0) L.polyline(s.p.map(ll), { color: '#a8a8a8', weight: 1.5, dashArray: '4 5', interactive: false }).addTo(ebene);
      else L.polyline(s.p.map(ll), { color: geaendert(k.von) ? '#003399' : '#000', weight: Math.max(1.5, q * px), lineCap: 'butt', lineJoin: 'round' }).addTo(ebene)
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
      if (seite) L.marker([s.lat, s.lon], { interactive: false, icon: L.divIcon({ className: 'ort', html: seite === 'l' ? `<span style="position:absolute;right:10px;top:-5px">${h(kurz(s))}</span>` : `<span style="position:absolute;left:10px;top:-5px">${h(kurz(s))}</span>`, iconSize: [0, 0] }) }).addTo(ebene);
    }
    $('kartenlegende').textContent = T.legende;
  }
  const zeile = (k, w) => `<span class="k">${k}</span><span class="w">${w}</span>`;
  function stationPopup(s, R) {
    const a = R.zeige, q = a ? abfluss(a, s.id) : null, m = R.a && Z.sim && R.sim ? abfluss(R.a, s.id) : null, r = a && a.mittel['R:' + s.id];
    let html = `<h3>${h(s.gewaesser)}–${h(s.name)}</h3><div class="raster2">` + zeile(T.nr, s.id) +
      zeile(T.abfluss, q == null ? '–' : `${qz(q)} m³/s` + (m != null && Math.abs(q - m) > .05 ? ` (${T.gemessen} ${qz(m)})` : ''));
    for (const z of meta.ziele) {
      const b = R.je && R.je[z];
      if (b && s.id in einzug(z)) { const x = abfluss(b, s.id); if (x != null) html += zeile(`${T.anteilAn} ${kurz(ST[z])}`, `${zahl(100 * x / b.ziel_mittel, 1)} %`); }
    }
    if (r != null && oben(s.id).length) html += zeile(T.restK, `${qz(r)} m³/s`);
    if (R.Y && R.i1 != null) { const c = statusAm(R.Y, s.id, R.i1); if (c != null) html += zeile(T.status, h(meta.status[c])); }
    html += zeile(T.quelle, s.quelle === 'BAFU' ? 'BAFU' : 'WSV / BfG') + zeile(T.datum, h(R.datumText)) +
      zeile(`${T.mqK} ${s.periode.join('–')}`, `${zahl(s.mq)} m³/s`) + zeile(T.nm7qMin, s.nm7q_min == null ? '–' : `${qz(s.nm7q_min)} m³/s (${datum(s.nm7q_min_beginn)})`) + '</div>';
    return html;
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
  const statusAm = (Y, id, i) => { let c = null; for (const [start, code] of (Y.s[id] || [])) { if (start <= i) c = code; else break; } return c; };

  // ------------------------------------------------------------ Bilanz rechnen und zeigen
  async function rechnen() {
    if (!tagAnsicht()) {
      const p = meta.anteile[Z.ziel], a = p[Z.ansicht === 'mq' ? 'mq' : 'nm7q'], je = {};
      for (const z of meta.ziele) je[z] = meta.anteile[z][Z.ansicht === 'mq' ? 'mq' : 'nm7q'];
      const text = `${Z.ansicht === 'mq' ? T.mqText : T.nwText}. ${T.periode} ${p.periode[0]}–${p.periode[1]}.`;
      return { a, zeige: a, je, text, datumText: `${p.periode[0]}–${p.periode[1]}`, Y: await jahr(Z.jahr) };
    }
    if (Z.ansicht === 'extrem') { const x = meta.extreme[Z.ziel][Z.extrem]; Z.jahr = x.jahr; Z.i0 = tagNr(x.beginn); Z.tag = tagNr(x.ende); }
    const Y = await jahr(Z.jahr);
    if (!Y) return { a: null, zeige: null, text: '' };
    const n = (Y.q['2289'] || Object.values(Y.q)[0]).length;
    if (Z.ansicht === 'heute' && Z.tag == null) { Z.tag = n - 1; while (Z.tag > 0 && !glieder(Y.q, Z.ziel, Z.tag)) Z.tag--; }
    if (Z.tag == null || Z.tag >= n) Z.tag = Math.min(n - 1, Z.tag == null ? n - 1 : Z.tag);
    const i1 = Z.tag, i0 = Z.ansicht === 'extrem' ? Z.i0 : i1;
    const F = fenster(Y), S = simulieren(Y, F.f0, F.f1, F.r0);
    const a = anteile(Y.q, Z.ziel, i0, i1), s = anteile(S.q, Z.ziel, i0, i1), q = Z.sim ? S.q : Y.q, je = {}, wirk = {};
    for (const z of meta.ziele) je[z] = anteile(q, z, i0, i1);
    for (const id in S.wirkung) { let x = 0; for (let i = i0; i <= i1; i++) x += S.wirkung[id][i - (einzug(Z.ziel)[id] || 0)] || 0; wirk[id] = x / (i1 - i0 + 1); }
    const codes = new Set(); for (const id in einzug(Z.ziel)) for (let i = i0; i <= i1; i++) { const c = statusAm(Y, id, i); if (c != null) codes.add(c); }
    const dt = i0 === i1 ? datum(isoTag(Z.jahr, i1)) : `${datum(isoTag(Z.jahr, i0)).slice(0, -4)}–${datum(isoTag(Z.jahr, i1))}`;
    const text = Z.ansicht === 'heute' ? `${T.letzter}: ${dt}.` : Z.ansicht === 'extrem' ? `${T.nm7qVon} ${Z.jahr}: ${dt}.` : `${dt}.`;
    return { a, sim: s, zeige: Z.sim ? s : a, je, Y, S, F, i0, i1, wirk, text, datumText: dt, status: [...codes].sort().map(c => meta.status[c]).join(', ') };
  }
  function pegelKurve(Y) {                       // Wasserstand Kaub aus den Tageswertpaaren W/Q desselben Jahres
    const q = Y.q['25700100']; if (!q || !Y.wk) return () => null;
    const paare = q.map((x, i) => [x, Y.wk[i]]).filter(p => p[0] != null && p[1] != null).sort((x, y) => x[0] - y[0]);
    return x => { if (x == null || paare.length < 20 || x < paare[0][0] || x > paare[paare.length - 1][0]) return null; let i = 1; while (paare[i][0] < x) i++; const [x0, y0] = paare[i - 1], [x1, y1] = paare[i]; return x1 === x0 ? y0 : y0 + (y1 - y0) * (x - x0) / (x1 - x0); };
  }
  function gliedName(k, a) {
    const id = k.slice(2), s = ST[id];
    if (k[0] === 'Q') return `${s.gewaesser}–${kurz(s)}`;
    if (id === meta.kontrolle.ziel) return T.kontrolle;
    const fehlt = oben(id).filter(c => c.zufluss && !oben(c.von).length && !('Q:' + c.von in a.mittel)).map(c => ST[c.von].gewaesser);
    return `${T.zwischen} ${oben(id).filter(c => !fehlt.includes(ST[c.von].gewaesser)).map(c => kurz(ST[c.von])).join(' + ')} → ${kurz(s)}` +
      (fehlt.length ? ` (${T.inkl} ${fehlt.join(', ')}, ${T.ohneReihe})` : '');
  }
  function bilanzZeichnen(R) {
    const z = ST[Z.ziel], a = R.zeige, el = $('bilanz');
    if (!a) { el.innerHTML = `<h2>${h(z.gewaesser)}–${h(z.name)}</h2><p>${T.keine}</p><p class="hinweis">${h(R.text)}</p>`; return; }
    const reihen = meta.stationen.flatMap(s => ['Q:' + s.id, 'R:' + s.id]).filter(k => k in a.mittel);
    const max = Math.max(...reihen.map(k => Math.abs(a.mittel[k])));
    let kopf = `<p class="gross">${zahl(a.ziel_mittel)} <small>m³/s</small></p>`;
    if (tagAnsicht() && R.a && R.sim) {
      const w = Z.ziel === '25700100' ? pegelKurve(R.Y) : null, w0 = w && w(R.a.ziel_mittel), w1 = w && w(R.sim.ziel_mittel), d = R.sim.ziel_mittel - R.a.ziel_mittel;
      kopf = `<div class="vergleich"><div><span>${T.gem}</span><b>${zahl(R.a.ziel_mittel)} <small>m³/s</small></b><em>${w0 != null ? `${T.pegel} ${zahl(w0)} cm` : ''}</em></div>` +
        `<div><span>${T.simu}</span><b class="${Z.sim ? 'sim' : ''}">${zahl(R.sim.ziel_mittel)} <small>m³/s</small></b><em>${vz(d, 1)} m³/s${w1 != null && w0 != null ? ` · ${vz(w1 - w0, 0)} cm` : ''}</em></div></div>`;
    }
    el.innerHTML = `<div class="kopfzeile"><h2>${h(z.gewaesser)}–${h(z.name)}</h2><button class="textknopf" type="button" id="csv">CSV</button></div>${kopf}` +
      `<p class="hinweis">${h(R.text)}${tagAnsicht() && R.i0 === R.i1 ? '' : ` ${zahl(a.tage_gueltig)} ${T.von_} ${zahl(a.tage)} ${T.tage}.`}${R.status ? ` ${T.status}: ${h(R.status)}.` : ''}</p>` +
      `<div class="rollen"><table><thead><tr><th>${T.glied}</th><th class="z">m³/s</th><th class="z">${T.anteil}</th><th></th></tr></thead><tbody>` +
      reihen.map(k => {
        const v = a.mittel[k], kl = v < 0 ? 'b minus' : k[0] === 'R' ? 'b rest' : 'b';
        return `<tr><td>${h(gliedName(k, a))}</td><td class="z">${qz(v)}</td><td class="z">${zahl(a.prozent[k], 1)} %</td>` +
          `<td class="balken"><span class="${kl}" style="width:${(100 * Math.abs(v) / max).toFixed(1)}%"></span></td></tr>`;
      }).join('') +
      `<tr class="summe"><td>${h(z.gewaesser)}–${h(kurz(z))} (${Z.sim && tagAnsicht() ? T.simu.toLowerCase() : T.gemessen})</td><td class="z">${zahl(a.ziel_mittel)}</td><td class="z">${zahl(100, 1)} %</td><td></td></tr></tbody></table></div>` +
      `<p class="zeichen"><span><i class="b"></i>${T.gemessen}</span><span><i class="b rest"></i>${T.rest}</span><span><i class="b minus"></i>${T.negativ}</span></p>`;
    $('csv').addEventListener('click', () => {
      const zeilen = [[`# ${z.gewaesser}–${z.name}; ${R.datumText}; ${Z.sim && tagAnsicht() ? T.simu : T.gem}`], ['# Quellen: BAFU, Hydrologische Beobachtungen (data.bafu.admin.ch); WSV, bereitgestellt durch die BfG (DGJ, PEGELONLINE)'],
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

  // ------------------------------------------------------------ Simulation: Bedienung, Kennwerte, Verlauf
  function simWahl() {
    const w = $('simwahl'); w.textContent = '';
    const d = (k, titel) => {
      const f = feld(titel, `<input type="date" value="${Z.jahr}-${SIM[k]}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      f.querySelector('input').addEventListener('change', e => { if (e.target.value) { SIM[k] = e.target.value.slice(5); if (k === 'r0') SIM.auto = false; alles(); } });
      return f;
    };
    const alle = feld(`${T.alle} (cm)`, `<input type="number" min="0" max="50" value="">`);
    alle.querySelector('input').addEventListener('change', e => { const v = Math.max(0, Math.min(50, +e.target.value || 0)); meta.seen.forEach(s => { if (s.reguliert) SIM.cm[s.id] = v; }); simSeen(); alles(); });
    const tage = feld(T.dauer, `<input type="number" min="1" max="180" value="${SIM.rd}">`);
    tage.querySelector('input').addEventListener('change', e => { SIM.rd = Math.max(1, Math.min(180, +e.target.value || 30)); alles(); });
    w.append(alle, d('f0', T.rueck), d('f1', T.bis), d('r0', T.abgabe), tage,
      knoepfe(' ', [['a', T.auto]], SIM.auto ? 'a' : '', () => { SIM.auto = true; alles(); }),
      knoepfe(T.ausschnitt, [['0', T.ganz], ['1', T.phase]], Z.zoom ? '1' : '0', v => { Z.zoom = v === '1'; alles(); }));
  }
  function simSeen() {
    $('simseen').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.flaeche} km²</th><th class="z">${T.jecm} Mio. m³</th><th class="z">${T.band}</th><th class="z">${T.grenzenK}</th><th style="width:22%">${T.zusatz}</th><th class="z">cm</th><th class="z">${T.vol} Mio. m³</th></tr></thead><tbody>` +
      meta.seen.map(s => `<tr><td>${h(s.name)}<br><span style="font-size:13px">${s.reguliert ? T.reguliert : T.unreguliert}</span></td><td class="z">${zahl(s.flaeche_km2, 1)}</td><td class="z">${zahl(s.flaeche_km2 / 100, 2)}</td>` +
        `<td class="z">${s.band ? `${zahl(s.band.band_m, 2)} m · ${zahl(s.band.volumen_mio_m3)}` : '–'}</td>` +
        `<td class="z" title="${s.grenzen ? h(s.grenzen.art) : ''}">${s.grenzen ? `${zahl(s.grenzen.tief, 2)}–${zahl(s.grenzen.hoch, 2)} · ${zahl(s.grenzen.volumen_mio_m3)}` : '–'}</td>` +
        `<td><input type="range" min="0" max="50" step="1" value="${SIM.cm[s.id]}" data-see="${s.id}" aria-label="${h(s.name)}: ${T.zusatz} cm"></td>` +
        `<td class="z" id="cm-${s.id}"></td><td class="z" id="vol-${s.id}"></td></tr>`).join('') +
      `<tr class="summe"><td colspan="7">${T.volumen}</td><td class="z" id="vol-summe"></td></tr></tbody></table></div>`;
    $('simseen').querySelectorAll('input').forEach(i => i.addEventListener('input', () => { SIM.cm[i.dataset.see] = +i.value; alles(true); }));
  }
  function simZeichnen(R) {
    let v = 0;
    for (const s of meta.seen) { const m = SIM.cm[s.id] * s.flaeche_km2 / 100; v += m; $('cm-' + s.id).textContent = SIM.cm[s.id]; $('vol-' + s.id).textContent = zahl(m, 1); }
    $('vol-summe').textContent = zahl(v, 1);
    const z = ST[Z.ziel], q = R.Y && R.Y.q[Z.ziel];
    if (!q || !R.S) { $('simwerte').innerHTML = `<p>${R.S ? T.keinJahr : T.nurTag}</p>`; $('verlauf').innerHTML = ''; $('simlegende').innerHTML = ''; return; }
    const qs = R.S.q[Z.ziel], F = R.F, nf = R.S.nf, a = nm7q(q), b = nm7q(qs);
    let anteilMax = null;                        // grösster Anteil des Rückhalts am Abfluss unterhalb der Seen
    for (const k in R.S.jeKnoten) for (let i = F.f0; i <= F.f1; i++) { const x = R.Y.q[k] && R.Y.q[k][i]; if (x) { const t = R.S.jeKnoten[k] / x; if (!anteilMax || t > anteilMax.a) anteilMax = { a: t, k }; } }
    const kachel = (titel, gross, zusatz = '') => `<div><span>${titel}</span><b>${gross}</b><em>${zusatz}</em></div>`;
    let pegel = '';
    if (Z.ziel === '25700100' && a && b) { const w = pegelKurve(R.Y), w0 = w(a.wert), w1 = w(b.wert); if (w0 != null && w1 != null) pegel = kachel(T.pegelTief, `${zahl(w0)} → ${zahl(w1)} cm`, `${vz(w1 - w0, 0)} cm`); }
    $('simwerte').innerHTML = kachel(T.volumen, `${zahl(v, 1)} Mio. m³`) +
      kachel(`${T.plus} (${SIM.rd} ${FR ? 'jours' : 'Tage'})`, `+${zahl(v * 1e6 / (SIM.rd * 86400), 1)} m³/s`, SIM.auto ? ((Z.ansicht === 'heute' || Z.ansicht === 'tag') ? T.autoHeute : T.autoTief) : '') +
      kachel(`${T.minus} (${nf} ${FR ? 'jours' : 'Tage'})`, `−${zahl(v * 1e6 / (nf * 86400), 1)} m³/s`, anteilMax ? `${T.maxAnteil} ${zahl(100 * anteilMax.a, 0)} % ${T.vomAbfluss} ${kurz(ST[anteilMax.k])}` : '') +
      (a && b ? kachel(`${T.nm7qSim} ${kurz(z)} ${Z.jahr}` + (q.filter(x => x != null).length < .95 * q.length ? ` (${q.filter(x => x != null).length} ${FR ? 'jours avec valeurs' : 'Tage mit Werten'})` : ''), `${zahl(a.wert)} → ${zahl(b.wert)} m³/s`, `${vz(100 * (b.wert - a.wert) / a.wert, 1)} %`) : '') + pegel +
      (F.r0 <= F.f1 && v ? `<div><em>${T.warn}</em></div>` : '');
    verlauf(q, v ? qs : null, { f0: F.f0 + F.lag, f1: F.f1 + F.lag, r0: F.r0 + F.lag, r1: F.r0 + SIM.rd - 1 + F.lag }, z, R.i1);
  }
  function verlauf(q, qs, f, z, heute) {
    const B = 1000, H = 400, L = 62, R = 14, O = 22, U = 62, n = q.length, svg = $('verlauf');
    // Ausschnitt: ganzes Jahr ab null, oder die Abgabe mit 20 Tagen davor und danach (Achse dann nicht ab null)
    const zoom = Z.zoom && qs, i0 = zoom ? Math.max(0, f.r0 - 20) : 0, i1 = zoom ? Math.min(n - 1, f.r1 + 20) : n - 1;
    const sicht = [...q.slice(i0, i1 + 1), ...(qs || []).slice(i0, i1 + 1)].filter(v => v != null);
    if (!sicht.length) { svg.innerHTML = ''; $('simlegende').textContent = T.keinJahr; return; }
    const max = Math.max(...sicht), min = zoom ? Math.min(...sicht) : 0;
    const schritt = [10, 20, 50, 100, 200, 250, 500, 1000, 2000].find(s => (max - min) / s <= 6) || 5000;
    const unten_ = Math.floor(min / schritt) * schritt, oben_ = Math.max(unten_ + schritt, Math.ceil(max / schritt) * schritt);
    const x = i => L + (B - L - R) * (i - i0) / Math.max(1, i1 - i0), y = v => O + (H - O - U) * (1 - (v - unten_) / (oben_ - unten_));
    const linie = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null || i < i0 || i > i1) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    let s = '';
    for (let v = unten_; v <= oben_; v += schritt) s += (v > unten_ ? `<line class="gitter" x1="${L}" x2="${B - R}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    s += `<text x="${L}" y="${O - 9}" class="fett">m³/s</text><line class="achse" x1="${L}" x2="${B - R}" y1="${y(unten_)}" y2="${y(unten_)}"/>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${Z.jahr}-${String(m + 1).padStart(2, '0')}-01`); if (i < i0 || i > i1) continue; s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${y(unten_)}" y2="${y(unten_) + 5}"/><text x="${x(i) + 4}" y="${y(unten_) + 18}">${T.monate[m]}</text>`; }
    const balken = (a, b, farbe, yy) => b < i0 || a > i1 ? '' : `<rect x="${x(Math.max(i0, a))}" y="${yy}" width="${Math.max(2, x(Math.min(i1, b)) - x(Math.max(i0, a)))}" height="8" fill="${farbe}"/>`;
    if (qs) s += balken(f.f0, f.f1, '#000', H - 26) + balken(f.r0, f.r1, '#003399', H - 14);
    if (heute != null && heute >= i0 && heute <= i1) s += `<line class="tag" x1="${x(heute)}" x2="${x(heute)}" y1="${O}" y2="${y(unten_)}"/>`;
    s += `<path class="gemessen" d="${linie(q)}"/>` + (qs ? `<path class="simuliert" d="${linie(qs)}"/>` : '') +
      `<line class="lot" id="lot" y1="${O}" y2="${y(unten_)}" visibility="hidden"/><rect id="flaeche" x="${L}" y="${O}" width="${B - L - R}" height="${H - O - U}" fill="transparent"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    svg.setAttribute('aria-label', `${z.gewaesser}–${z.name} ${Z.jahr}`);
    $('simlegende').innerHTML = `<span><i></i>${h(z.gewaesser)}–${h(kurz(z))} ${Z.jahr}, ${T.gemessen}</span>` +
      (qs ? `<span><i class="blau"></i>${T.simu.toLowerCase()}</span><span><i class="fenster"></i>${T.fRueck}</span><span><i class="fenster blau"></i>${T.fAbgabe}</span>` : '');
    const tip = $('tip'), lot = $('lot');
    const zeige = ev => {
      const r = svg.getBoundingClientRect(), i = Math.max(i0, Math.min(i1, i0 + Math.round(((ev.clientX - r.left) / r.width * B - L) / (B - L - R) * (i1 - i0))));
      lot.setAttribute('x1', x(i)); lot.setAttribute('x2', x(i)); lot.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${datum(isoTag(Z.jahr, i))}</b><br>${T.gemessen}: <b>${zahl(q[i])} m³/s</b>` +
        (qs && q[i] != null ? `<br>${T.simu.toLowerCase()}: <b>${zahl(qs[i])} m³/s</b><br>${T.diff}: <b>${vz(qs[i] - q[i], 1)} m³/s</b>` : '');
      const lx = x(i) / B * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, lx > r.width / 2 ? lx - tip.offsetWidth - 10 : lx + 10)) + 'px';
    };
    $('flaeche').addEventListener('pointermove', zeige); $('flaeche').addEventListener('pointerdown', zeige);
    $('flaeche').addEventListener('pointerleave', () => { tip.hidden = true; lot.setAttribute('visibility', 'hidden'); });
  }

  // ------------------------------------------------------------ Fuss
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Lacs : OFEV, fiches « Seeregulierung » (2020)' : 'Seen: BAFU, Faktenblätter «Seeregulierung» (2020)'} – <a href="https://www.bafu.admin.ch/de/wichtige-seeregulierungen">bafu.admin.ch/de/wichtige-seeregulierungen</a>; IGKB</li>` +
    `<li>${FR ? 'Fond de carte' : 'Grundkarte'}: © swisstopo; © OpenStreetMap (ODbL). ${h(karte.quelle)}</li></ul>`;
  $('stand').textContent = `${T.standT}: ${datum(meta.stand.slice(0, 10))}` + (meta.meldungen.length ? ` · ${meta.meldungen.join(' · ')}` : '');

  // ------------------------------------------------------------ Ablauf
  let lauf = 0;
  async function alles(nurWerte) {
    const nr = ++lauf, R = await rechnen();
    if (nr !== lauf) return;
    if (!nurWerte) { wahlZeichnen(R.Y); simWahl(); }
    else { const d = $('wahl').querySelector('input[type=date]'); if (d && Z.tag != null) d.value = isoTag(Z.jahr, Z.tag); }
    karteZeichnen(R); bilanzZeichnen(R); seenZeichnen(R); simZeichnen(R);
  }
  simSeen(); alles();
})();
