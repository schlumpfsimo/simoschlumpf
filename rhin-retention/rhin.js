// Rhein – Abflussbilanz und Rückhalt.
// Die Daten erzeugt das Python-Werkzeug (werkzeug/, siehe README): daten/meta.json, daten/karte.json, daten/jahr/<Jahr>.json.
// Diese Datei zeichnet die Karte, rechnet die Bilanz für frei gewählte Zeiträume nach derselben Logik wie
// werkzeug/rheinbilanz/bilanz.py und führt den Stausimulator. Fehlende Werte bleiben leer, nichts wird interpoliert.
(async () => {
  'use strict';
  const FR = new URLSearchParams(location.search).get('l') === 'fr';
  document.documentElement.lang = FR ? 'fr' : 'de';

  // ------------------------------------------------------------ Texte
  const T = FR ? {
    titel: 'Rhin · Bilan des débits', lead: 'D’où vient l’eau du Rhin à Bâle et à Kaub. Chaque station mesure un débit ; la différence avec les stations situées en amont est le bassin intermédiaire. Il s’agit d’un reste calculé, pas d’une mesure.',
    ziel: 'Bilan pour', modus: 'Situation', mq: 'Débit moyen', nw: 'Étiage', zeit: 'Période', jahr: 'Année', von: 'du', bis: 'au',
    glied: 'Composante', anteil: 'Part', gemessen: 'mesuré', rest: 'reste (bassin intermédiaire)', negativ: 'reste négatif',
    zwischen: 'Bassin intermédiaire', kontrolle: 'Contrôle Aar : Stilli − (Brugg + Reuss + Limmat)', inkl: 'y compris', ohneReihe: 'sans série',
    summe: 'mesuré', tage: 'jours avec valeurs complètes', von_: 'sur', periode: 'Période',
    mqText: 'Moyenne de tous les jours', nwText: 'Moyenne des 7 jours les plus secs de chaque année (NM7Q) à cette station, composantes décalées du temps de parcours',
    keine: 'Pas de bilan : des valeurs manquent pour cette période.', status: 'État de validation des valeurs',
    seen: 'Lacs pendant la période', see: 'Lac', stand: 'Niveau', aenderung: 'Variation', speicher: 'Variation du stock', fuellt: 'Positif : le lac se remplit et retient de l’eau. Calculé avec une surface constante.',
    station: 'Station', quelle: 'Source', reihe: 'Série', mqK: 'MQ', nm7q: 'NM7Q moyen', nm7qMin: 'NM7Q le plus bas', dgj: 'Annuaire (DGJ)', oben: 'Somme amont', restK: 'Reste', zu: 'Fermer',
    simTitel: 'Simulateur de retenue', simLead: 'Que se passerait-il si les lacs retenaient un peu plus d’eau au printemps pour la restituer à l’étiage ? Choisissez une tranche supplémentaire par lac, la période de retenue et la restitution.',
    rueck: 'Retenue', abgabe: 'Restitution dès le', dauer: 'Durée (jours)', auto: 'Phase la plus sèche', ausschnitt: 'Extrait', ganz: 'Année', phase: 'Restitution', band: 'Tranche utilisée 1991–2020', flaeche: 'Surface', jecm: 'Par cm', zusatz: 'Tranche suppl.', vol: 'Volume',
    reguliert: 'régulé', unreguliert: 'non régulé', volumen: 'Volume retenu', plus: 'Débit supplémentaire', minus: 'Débit retenu', nm7qSim: 'NM7Q', pegel: 'Échelle de Kaub (7 jours les plus bas)',
    maxAnteil: 'Retenue maximale', vomAbfluss: 'du débit à', simuliert: 'simulé', fRueck: 'Retenue', fAbgabe: 'Restitution', diff: 'Écart',
    keinJahr: 'Pas de valeurs journalières pour cette station et cette année.', warn: 'La restitution commence avant la fin de la retenue.',
    simHinweis: 'Modèle simple : le volume est retenu et restitué de façon uniforme et se déplace vers l’aval avec le temps de parcours, sans atténuation. Les règlements de régulation, la protection contre les crues et l’écologie ne sont pas pris en compte. Le lac de Constance n’est pas régulé ; une tranche y est hypothétique. Niveau à Kaub d’après les couples niveau/débit journaliers de la même année (DGJ).',
    methode: 'Méthode', quellen: 'Sources', standT: 'Données du', monate: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    legende: 'Largeur du trait = débit. Carré noir = station du bilan. Cliquer sur une station pour ses valeurs.', fehlt: 'Les données n’ont pas pu être chargées.',
    meth: ['Réseau : graphe orienté, nœuds = stations, arêtes = tronçons. Reste = débit mesuré moins la somme des stations amont.',
      'Temps de parcours : hypothèses en jours entiers (Bâle–Maxau 1 jour, Maxau–Worms 1 jour, Neckar–Worms 1 jour, sinon 0 ; Bâle–Kaub 2 jours), non mesurés.',
      'MQ et NM7Q calculés à partir des valeurs journalières : stations OFEV 1991–2020, stations allemandes 2010–2020 (seules années où toutes les séries de l’annuaire existent ; Neckar 2010–2020). NM7Q = plus faible moyenne sur 7 jours de l’année civile.',
      'Étiage : parts pendant les fenêtres NM7Q de la station du bilan. Leur somme fait 100 %.',
      'Stations allemandes : valeurs journalières contrôlées de l’annuaire hydrologique (2008–2025) ; ensuite seulement les données brutes des 31 derniers jours (PEGELONLINE). Entre deux, il n’y a pas de valeurs.',
      'Lacs : variation du stock = surface × variation du niveau moyen journalier. Surfaces d’après Wikidata (non officielles).',
      'Rien n’est interpolé. Si une valeur manque, le résultat manque.'],
  } : {
    titel: 'Rhein · Abflussbilanz', lead: 'Woher das Wasser des Rheins in Basel und in Kaub kommt. Jede Messstelle liefert einen Abfluss; die Differenz zu den Messstellen oberhalb ist das Zwischengebiet. Das ist ein gerechneter Rest, kein Messwert.',
    ziel: 'Bilanz für', modus: 'Lage', mq: 'Mittelwasser', nw: 'Niedrigwasser', zeit: 'Zeitraum', jahr: 'Jahr', von: 'von', bis: 'bis',
    glied: 'Bilanzglied', anteil: 'Anteil', gemessen: 'gemessen', rest: 'Rest (Zwischengebiet)', negativ: 'negativer Rest',
    zwischen: 'Zwischengebiet', kontrolle: 'Kontrollbilanz Aare: Stilli − (Brugg + Reuss + Limmat)', inkl: 'inkl.', ohneReihe: 'ohne Messreihe',
    summe: 'gemessen', tage: 'Tage mit vollständigen Werten', von_: 'von', periode: 'Periode',
    mqText: 'Mittel aller Tage', nwText: 'Mittel der sieben trockensten Tage jedes Jahres (NM7Q) an dieser Messstelle, Glieder um die Fliesszeit versetzt',
    keine: 'Keine Bilanz: Für diesen Zeitraum fehlen Werte.', status: 'Freigabestatus der Werte',
    seen: 'Seen im Zeitraum', see: 'See', stand: 'Stand', aenderung: 'Änderung', speicher: 'Speicheränderung', fuellt: 'Positiv: Der See füllt sich und hält Wasser zurück. Gerechnet mit konstanter Seefläche.',
    station: 'Messstelle', quelle: 'Quelle', reihe: 'Reihe', mqK: 'MQ', nm7q: 'Mittleres NM7Q', nm7qMin: 'Kleinstes NM7Q', dgj: 'Jahrbuch (DGJ)', oben: 'Summe oberhalb', restK: 'Rest', zu: 'Schliessen',
    simTitel: 'Stausimulator', simLead: 'Was wäre, wenn die Seen im Frühling etwas mehr Wasser zurückhielten und es bei Niedrigwasser abgäben? Wähle je See ein zusätzliches Band, die Zeit des Rückhalts und die Abgabe.',
    rueck: 'Rückhalt', abgabe: 'Abgabe ab', dauer: 'Dauer (Tage)', auto: 'Trockenste Phase', ausschnitt: 'Ausschnitt', ganz: 'Jahr', phase: 'Abgabe', band: 'Genutztes Band 1991–2020', flaeche: 'Fläche', jecm: 'Je cm', zusatz: 'Zusatzband', vol: 'Volumen',
    reguliert: 'reguliert', unreguliert: 'nicht reguliert', volumen: 'Rückhaltevolumen', plus: 'Zusatzabfluss', minus: 'Minderabfluss', nm7qSim: 'NM7Q', pegel: 'Pegel Kaub (tiefste 7 Tage)',
    maxAnteil: 'Rückhalt höchstens', vomAbfluss: 'des Abflusses in', simuliert: 'simuliert', fRueck: 'Rückhalt', fAbgabe: 'Abgabe', diff: 'Differenz',
    keinJahr: 'Für diese Messstelle liegen in diesem Jahr keine Tageswerte vor.', warn: 'Die Abgabe beginnt vor dem Ende des Rückhalts.',
    simHinweis: 'Einfaches Modell: Das Volumen wird gleichmässig zurückgehalten und abgegeben und wandert mit der Fliesszeit talwärts, ohne Abflachung. Regulierreglemente, Hochwasserschutz und Ökologie sind nicht berücksichtigt. Der Bodensee ist nicht reguliert; ein Band dort ist hypothetisch. Pegel Kaub aus den Tageswertpaaren Wasserstand/Abfluss desselben Jahres (DGJ).',
    methode: 'Methode', quellen: 'Quellen', standT: 'Datenstand', monate: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    legende: 'Strichbreite = Abfluss. Schwarzes Quadrat = Messstelle der Bilanz. Klick auf eine Messstelle zeigt ihre Werte.', fehlt: 'Die Daten konnten nicht geladen werden.',
    meth: ['Netz: gerichteter Graph, Knoten = Messstellen, Kanten = Fliessstrecken. Rest = gemessener Abfluss minus Summe der Messstellen oberhalb.',
      'Fliesszeiten: Annahmen in ganzen Tagen (Basel–Maxau 1 Tag, Maxau–Worms 1 Tag, Neckar–Worms 1 Tag, sonst 0; Basel–Kaub 2 Tage), nicht gemessen.',
      'MQ und NM7Q sind aus den Tageswerten gerechnet: BAFU-Stationen 1991–2020, deutsche Pegel 2010–2020 (nur in diesen Jahren liegen alle Reihen des Jahrbuchs vor; Neckar 2010–2020). NM7Q = kleinstes Mittel über 7 Tage im Kalenderjahr.',
      'Niedrigwasser: Anteile in den NM7Q-Fenstern der Bilanz-Messstelle. Sie summieren sich auf 100 %.',
      'Deutsche Pegel: geprüfte Tageswerte aus dem Deutschen Gewässerkundlichen Jahrbuch (2008–2025); danach nur Rohdaten der letzten 31 Tage (PEGELONLINE). Dazwischen gibt es keine Werte.',
      'Seen: Speicheränderung = Fläche × Änderung des Tagesmittels. Seeflächen nach Wikidata (nicht amtlich).',
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
  const datum = iso => { const [j, m, t] = iso.split('-'); return `${+t}.${+m}.${j}`; };

  // ------------------------------------------------------------ Daten
  let meta, karte;
  try {
    [meta, karte] = await Promise.all(['daten/meta.json', 'daten/karte.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
  } catch (e) { $('bilanz').textContent = T.fehlt; return; }
  const ST = Object.fromEntries(meta.stationen.map(s => [s.id, s]));
  const oben = id => meta.kanten.filter(k => k.nach === id);
  const unten = id => meta.kanten.find(k => k.von === id);
  const einzug = ziel => {                       // {knoten: Fliesszeit in Tagen bis zum Ziel}
    const e = { [ziel]: 0 }, offen = [ziel];
    while (offen.length) { const k = offen.pop(); for (const c of oben(k)) { e[c.von] = e[k] + c.tage; offen.push(c.von); } }
    return e;
  };
  const jahre = {};
  const jahr = async j => jahre[j] || (jahre[j] = fetch(`daten/jahr/${j}.json`).then(r => r.ok ? r.json() : null).catch(() => null));
  const tagNr = (iso) => Math.round((Date.UTC(...iso.split('-').map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 864e5);
  const isoTag = (j, i) => new Date(Date.UTC(j, 0, 1 + i)).toISOString().slice(0, 10);
  const kurz = s => s.name.split(',')[0];

  // ------------------------------------------------------------ Bilanz (wie bilanz.py)
  const wert = (Y, id, i) => (i < 0 || !Y.q[id] || Y.q[id][i] == null) ? null : Y.q[id][i];
  function rest(Y, id, i) {
    const q = wert(Y, id, i); let summe = 0;
    for (const k of oben(id)) {
      const v = wert(Y, k.von, i - k.tage);
      if (v == null) { if (!k.zufluss) return null; } else summe += v;
    }
    return q == null ? null : q - summe;
  }
  function glieder(Y, ziel, i) {
    const zq = wert(Y, ziel, i); if (zq == null) return null;
    const g = {};
    for (const [id, tage] of Object.entries(einzug(ziel))) {
      if (!oben(id).length) {
        const v = wert(Y, id, i - tage);
        if (v == null) { const u = unten(id); if (u && u.zufluss) continue; return null; }
        g['Q:' + id] = v;
      } else { const r = rest(Y, id, i - tage); if (r == null) return null; g['R:' + id] = r; }
    }
    g.ziel = zq; return g;
  }
  function anteile(Y, ziel, i0, i1) {
    const summe = {}; let n = 0;
    for (let i = i0; i <= i1; i++) { const g = glieder(Y, ziel, i); if (!g) continue; n++; for (const k in g) summe[k] = (summe[k] || 0) + g[k]; }
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
  const Z = { ziel: '25700100', modus: 'nw', jahr: 2018, von: '2018-10-01', bis: '2018-10-31', wahl: null };
  const SIM = { zoom: false, jahr: 2018, cm: Object.fromEntries(meta.seen.map(s => [s.id, s.reguliert ? 10 : 0])), f0: '04-01', f1: '06-30', r0: null, rd: 30 };

  function knoepfe(titel, liste, aktiv, klick) {
    const g = document.createElement('div'); g.className = 'gruppe';
    g.innerHTML = `<span>${h(titel)}</span><div class="knoepfe" role="group" aria-label="${h(titel)}">` +
      liste.map(([w, t]) => `<button type="button" data-w="${w}" aria-pressed="${w === aktiv}">${h(t)}</button>`).join('') + '</div>';
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => klick(b.dataset.w)));
    return g;
  }
  function feld(titel, html) { const g = document.createElement('label'); g.className = 'gruppe'; g.innerHTML = `<span>${h(titel)}</span>${html}`; return g; }
  const jahrWahl = (aktiv) => `<select>${meta.jahre.slice().reverse().map(j => `<option${j === aktiv ? ' selected' : ''}>${j}</option>`).join('')}</select>`;

  function wahlZeichnen() {
    const w = $('wahl'); w.textContent = '';
    w.append(knoepfe(T.ziel, meta.ziele.map(z => [z, kurz(ST[z])]), Z.ziel, v => { Z.ziel = v; SIM.r0 = null; alles(); }));
    w.append(knoepfe(T.modus, [['mq', T.mq], ['nw', T.nw], ['zeit', T.zeit]], Z.modus, v => { Z.modus = v; alles(); }));
    if (Z.modus === 'zeit') {
      const j = feld(T.jahr, jahrWahl(Z.jahr));
      j.querySelector('select').addEventListener('change', e => { Z.jahr = +e.target.value; Z.von = Z.jahr + Z.von.slice(4); Z.bis = Z.jahr + Z.bis.slice(4); alles(); });
      const a = feld(T.von, `<input type="date" value="${Z.von}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      const b = feld(T.bis, `<input type="date" value="${Z.bis}" min="${Z.jahr}-01-01" max="${Z.jahr}-12-31">`);
      a.querySelector('input').addEventListener('change', e => { if (e.target.value) { Z.von = e.target.value; if (Z.bis < Z.von) Z.bis = Z.von; alles(); } });
      b.querySelector('input').addEventListener('change', e => { if (e.target.value) { Z.bis = e.target.value; if (Z.bis < Z.von) Z.von = Z.bis; alles(); } });
      w.append(j, a, b);
    }
  }

  // ------------------------------------------------------------ Karte
  const [WEST, , , NORD] = karte.rahmen, KX = Math.cos(48.45 * Math.PI / 180) * 100;
  const px = p => [((p[0] - WEST) * KX).toFixed(1), ((NORD - p[1]) * 100).toFixed(1)];
  const pfad = (l, zu) => 'M' + l.map(p => px(p).join(',')).join('L') + (zu ? 'Z' : '');
  const MIT_NAME = ['2473', '2288', '2135', '2289', '23700200', '23800690', '23900200', '24700404', '25100100', '25700100'];
  function karteGrund() {
    const svg = $('karte');
    svg.setAttribute('viewBox', `0 0 ${((karte.rahmen[2] - WEST) * KX).toFixed(0)} ${((NORD - karte.rahmen[1]) * 100).toFixed(0)}`);
    const grenzen = (window.OBERRHEIN && window.OBERRHEIN.grenzen) || [];
    svg.innerHTML = `<g>${grenzen.map(l => `<path class="grenze" d="${pfad(l)}"/>`).join('')}</g>` +
      `<g>${karte.fluesse.map(l => `<path class="fluss" d="${pfad(l)}"/>`).join('')}</g>` +
      `<g>${karte.seen.map(s => `<path class="see" d="${pfad(s.p, true)}"/>`).join('')}</g><g id="stroeme"></g><g id="punkte"></g>`;
  }
  function karteZeichnen(a) {
    const zielQ = a ? a.ziel_mittel : null, e = einzug(Z.ziel);
    $('stroeme').innerHTML = meta.kanten.map(k => {
      const s = karte.strecken[`${k.von}>${k.nach}`]; if (!s) return '';
      const q = a && k.von in e ? abfluss(a, k.von) : null;
      return q == null || q <= 0 ? `<path class="strom leer" stroke-width=".8" d="${pfad(s.p)}"/>`
        : `<path class="strom" stroke-width="${Math.max(.6, 8 * q / zielQ).toFixed(2)}" d="${pfad(s.p)}"><title>${h(ST[k.von].gewaesser)}–${h(kurz(ST[k.von]))}: ${zahl(q)} m³/s</title></path>`;
    }).join('');
    $('punkte').innerHTML = meta.stationen.filter(s => s.lat).map(s => {
      const [x, y] = px([s.lon, s.lat]).map(Number), kl = (s.id === Z.ziel ? ' ziel' : '') + (s.id === Z.wahl ? ' gewaehlt' : '');
      const links = ['2135', '2289', '25700100', '23700200'].includes(s.id);
      const name = MIT_NAME.includes(s.id) || s.id === Z.wahl
        ? `<text x="${links ? x - 5.5 : x + 5.5}" y="${y + 1.9}" text-anchor="${links ? 'end' : 'start'}">${h(kurz(s))}</text>` : '';
      return `<g class="punkt${kl}" data-id="${s.id}" tabindex="0" role="button" aria-label="${h(s.gewaesser)}–${h(s.name)}"><circle cx="${x}" cy="${y}" r="6"/>` +
        `<rect x="${x - 2.4}" y="${y - 2.4}" width="4.8" height="4.8"/>${name}<title>${h(s.gewaesser)}–${h(s.name)}</title></g>`;
    }).join('');
    $('punkte').querySelectorAll('.punkt').forEach(g => {
      const w = () => { Z.wahl = Z.wahl === g.dataset.id ? null : g.dataset.id; alles(); };
      g.addEventListener('click', w); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); w(); } });
    });
    $('kartenlegende').textContent = T.legende + ' ' + (FR ? 'Fond de carte : ' : 'Kartengrundlage: ') + karte.quelle.replace('Rheinachse', FR ? 'axe du Rhin' : 'Rheinachse').replace('übrige Flüsse und Seen', FR ? 'autres cours d’eau et lacs' : 'übrige Flüsse und Seen').replace('gemeinfrei', FR ? 'domaine public' : 'gemeinfrei');
  }

  // ------------------------------------------------------------ Bilanztafel
  function gliedName(k, a) {
    const id = k.slice(2), s = ST[id];
    if (k[0] === 'Q') return `${s.gewaesser}–${kurz(s)}`;
    if (id === meta.kontrolle.ziel) return T.kontrolle;
    const fehlt = oben(id).filter(c => c.zufluss && !oben(c.von).length && !('Q:' + c.von in a.mittel)).map(c => ST[c.von].gewaesser);
    return `${T.zwischen} ${oben(id).filter(c => !fehlt.includes(ST[c.von].gewaesser)).map(c => kurz(ST[c.von])).join(' + ')} → ${kurz(s)}` +
      (fehlt.length ? ` (${T.inkl} ${fehlt.join(', ')}, ${T.ohneReihe})` : '');
  }
  async function bilanzRechnen() {
    if (Z.modus !== 'zeit') {
      const p = meta.anteile[Z.ziel], a = p[Z.modus === 'mq' ? 'mq' : 'nm7q'];
      return { a, text: `${Z.modus === 'mq' ? T.mqText : T.nwText}. ${T.periode} ${p.periode[0]}–${p.periode[1]}.` };
    }
    const Y = await jahr(Z.jahr);
    if (!Y) return { a: null, text: '' };
    const i0 = tagNr(Z.von), i1 = tagNr(Z.bis), a = anteile(Y, Z.ziel, i0, i1);
    const codes = new Set();
    for (const id in einzug(Z.ziel)) (Y.s[id] || []).forEach(([start, c], n, l) => { const ende = n + 1 < l.length ? l[n + 1][0] - 1 : 999; if (c != null && start <= i1 && ende >= i0) codes.add(c); });
    return { a, Y, i0, i1, text: `${datum(Z.von)} ${T.bis} ${datum(Z.bis)}.`, status: [...codes].sort().map(c => meta.status[c]).join(', ') };
  }
  function bilanzZeichnen(r) {
    const z = ST[Z.ziel], a = r.a, el = $('bilanz');
    if (!a) { el.innerHTML = `<h2>${h(z.gewaesser)}–${h(z.name)}</h2><p>${T.keine}</p><p class="hinweis">${h(r.text)}</p>`; return; }
    const reihenfolge = meta.stationen.flatMap(s => ['Q:' + s.id, 'R:' + s.id]).filter(k => k in a.mittel);
    const max = Math.max(...reihenfolge.map(k => Math.abs(a.mittel[k])));
    el.innerHTML = `<h2>${h(z.gewaesser)}–${h(z.name)}</h2><p class="gross">${zahl(a.ziel_mittel)} <small>m³/s</small></p>` +
      `<p class="hinweis">${h(r.text)} ${zahl(a.tage_gueltig)} ${T.von_} ${zahl(a.tage)} ${T.tage}.</p>` +
      `<div class="rollen"><table><thead><tr><th>${T.glied}</th><th class="z">m³/s</th><th class="z">${T.anteil}</th><th></th></tr></thead><tbody>` +
      reihenfolge.map(k => {
        const v = a.mittel[k], kl = v < 0 ? 'b minus' : k[0] === 'R' ? 'b rest' : 'b';
        return `<tr class="wahlbar${k.slice(2) === Z.wahl ? ' gewaehlt' : ''}" data-id="${k.slice(2)}"><td>${h(gliedName(k, a))}</td><td class="z">${zahl(v, Math.abs(v) < 100 ? 1 : 0)}</td>` +
          `<td class="z">${zahl(a.prozent[k], 1)} %</td><td class="balken"><span class="${kl}" style="width:${(100 * Math.abs(v) / max).toFixed(1)}%"></span></td></tr>`;
      }).join('') +
      `<tr class="summe"><td>${h(z.gewaesser)}–${h(kurz(z))} (${T.summe})</td><td class="z">${zahl(a.ziel_mittel)}</td><td class="z">100.0 %</td><td></td></tr></tbody></table></div>`.replace('100.0', zahl(100, 1)) +
      `<p class="zeichen"><span><i class="b"></i>${T.gemessen}</span><span><i class="b rest"></i>${T.rest}</span><span><i class="b minus"></i>${T.negativ}</span></p>` +
      (r.status ? `<p class="hinweis">${T.status}: ${h(r.status)}.</p>` : '');
    el.querySelectorAll('tr.wahlbar').forEach(tr => tr.addEventListener('click', () => { Z.wahl = Z.wahl === tr.dataset.id ? null : tr.dataset.id; alles(); }));
  }
  function stationZeichnen(a) {
    const el = $('station'), s = ST[Z.wahl];
    el.hidden = !s; if (!s) return;
    const zeile = (k, w) => `<span class="k">${k}</span><span class="w">${w}</span>`;
    const q = a ? abfluss(a, s.id) : null, hat = oben(s.id).length > 0, r = a && a.mittel['R:' + s.id];
    el.innerHTML = `<div class="kopfzeile"><h2>${T.station} ${h(s.id)}</h2><button class="schliessen" type="button">${T.zu}</button></div>` +
      `<p class="gross">${h(s.gewaesser)}–${h(s.name)}</p><div class="raster2">` +
      zeile(T.quelle, s.quelle === 'BAFU' ? 'BAFU' : 'WSV / BfG') +
      zeile(T.reihe, s.zeitraum ? `${datum(s.zeitraum[0])} – ${datum(s.zeitraum[1])}` : '–') +
      zeile(`${T.mqK} ${s.periode.join('–')}`, `${zahl(s.mq)} m³/s`) +
      zeile(`${T.nm7q} ${s.periode.join('–')}`, `${zahl(s.mnm7q, s.mnm7q < 100 ? 1 : 0)} m³/s`) +
      zeile(T.nm7qMin, s.nm7q_min == null ? '–' : `${zahl(s.nm7q_min, s.nm7q_min < 100 ? 1 : 0)} m³/s (${FR ? 'dès le' : 'ab'} ${datum(s.nm7q_min_beginn)})`) +
      (s.dgj ? zeile(`${T.dgj} ${s.dgj.periode}`, `MQ ${zahl(s.dgj.mq)} · MNQ ${zahl(s.dgj.mnq)} m³/s`) : '') +
      (q != null ? zeile(T.gemessen, `${zahl(q, q < 100 ? 1 : 0)} m³/s`) : '') +
      (q != null && hat && r != null ? zeile(T.oben, `${zahl(q - r, 0)} m³/s`) + zeile(T.restK, `${zahl(r, Math.abs(r) < 100 ? 1 : 0)} m³/s`) : '') + '</div>';
    el.querySelector('button').addEventListener('click', () => { Z.wahl = null; alles(); });
  }
  function seenZeichnen(r) {
    const el = $('seen');
    if (Z.modus !== 'zeit' || !r.Y) { el.innerHTML = ''; return; }
    const zeilen = meta.seen.map(s => {
      const w = r.Y.w[s.id]; if (!w) return '';
      const a = r.i0 > 0 ? w[r.i0 - 1] : null, b = w[r.i1];
      const ds = a == null || b == null ? null : s.flaeche_km2 * 1e6 * (b - a) / ((r.i1 - r.i0 + 1) * 86400);
      return `<tr><td>${h(s.name)}</td><td class="z">${b == null ? '–' : zahl(b, 2)}</td><td class="z">${ds == null ? '–' : zahl((b - a) * 100, 0) + ' cm'}</td><td class="z">${ds == null ? '–' : (ds > 0 ? '+' : '') + zahl(ds, 1)}</td></tr>`;
    }).join('');
    el.innerHTML = `<h2>${T.seen}</h2><div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.stand} m ü. M.</th><th class="z">${T.aenderung}</th><th class="z">${T.speicher} m³/s</th></tr></thead><tbody>${zeilen}</tbody></table></div><p class="hinweis">${T.fuellt}</p>`;
  }

  // ------------------------------------------------------------ Stausimulator
  function simWahl() {
    const w = $('simwahl'); w.textContent = '';
    const j = feld(T.jahr, jahrWahl(SIM.jahr));
    j.querySelector('select').addEventListener('change', e => { SIM.jahr = +e.target.value; SIM.r0 = null; sim(); });
    const d = (k, titel) => {
      const f = feld(titel, `<input type="date" value="${SIM.jahr}-${SIM[k]}" min="${SIM.jahr}-01-01" max="${SIM.jahr}-12-31">`);
      f.querySelector('input').addEventListener('change', e => { if (e.target.value) { SIM[k] = e.target.value.slice(5); sim(); } });
      return f;
    };
    const tage = feld(T.dauer, `<input type="number" min="1" max="180" value="${SIM.rd}">`);
    tage.querySelector('input').addEventListener('change', e => { SIM.rd = Math.max(1, Math.min(180, +e.target.value || 30)); sim(); });
    const auto = knoepfe(' ', [['a', T.auto]], '', () => { SIM.r0 = null; sim(); });
    const zoom = knoepfe(T.ausschnitt, [['0', T.ganz], ['1', T.phase]], SIM.zoom ? '1' : '0', v => { SIM.zoom = v === '1'; sim(); });
    w.append(j, d('f0', `${T.rueck} ${T.von}`), d('f1', T.bis), d('r0', T.abgabe), tage, auto, zoom);
  }
  function simSeen() {
    $('simseen').innerHTML = `<div class="rollen"><table><thead><tr><th>${T.see}</th><th class="z">${T.flaeche} km²</th><th class="z">${T.jecm} Mio. m³</th><th class="z">${T.band}</th><th style="width:24%">${T.zusatz}</th><th class="z">cm</th><th class="z">${T.vol} Mio. m³</th></tr></thead><tbody>` +
      meta.seen.map(s => `<tr><td>${h(s.name)}<br><span style="font-size:13px">${s.reguliert ? T.reguliert : T.unreguliert}</span></td><td class="z">${zahl(s.flaeche_km2, 1)}</td><td class="z">${zahl(s.flaeche_km2 / 100, 2)}</td>` +
        `<td class="z">${s.band ? `${zahl(s.band.band_m, 2)} m · ${zahl(s.band.volumen_mio_m3)}` : '–'}</td>` +
        `<td><input type="range" min="0" max="50" step="1" value="${SIM.cm[s.id]}" data-see="${s.id}" aria-label="${h(s.name)}: ${T.zusatz} cm"></td>` +
        `<td class="z" id="cm-${s.id}"></td><td class="z" id="vol-${s.id}"></td></tr>`).join('') +
      `<tr class="summe"><td colspan="6">${T.volumen}</td><td class="z" id="vol-summe"></td></tr></tbody></table></div>`;
    $('simseen').querySelectorAll('input').forEach(i => i.addEventListener('input', () => { SIM.cm[i.dataset.see] = +i.value; sim(true); }));
  }
  async function sim(nurWerte) {
    const Y = await jahr(SIM.jahr), z = ST[Z.ziel], q = Y && Y.q[Z.ziel];
    let v = 0;
    for (const s of meta.seen) { const m = SIM.cm[s.id] * s.flaeche_km2 / 100; v += m; $('cm-' + s.id).textContent = SIM.cm[s.id]; $('vol-' + s.id).textContent = zahl(m, 1); }
    $('vol-summe').textContent = zahl(v, 1);
    if (!q) { $('simwerte').innerHTML = `<p>${T.keinJahr}</p>`; $('verlauf').innerHTML = ''; $('simlegende').innerHTML = ''; if (!nurWerte) simWahl(); return; }
    if (SIM.r0 == null) {                        // trockenste Phase: Abgabe so legen, dass sie das NM7Q-Fenster am Ziel mittig trifft
      const tief = nm7q(q), lag = Math.max(0, ...meta.seen.map(s => einzug(Z.ziel)[s.knoten] || 0));
      SIM.r0 = isoTag(SIM.jahr, Math.max(0, Math.min(q.length - SIM.rd, (tief ? tief.beginn : 273) - Math.floor((SIM.rd - 7) / 2) - lag))).slice(5);
    }
    if (!nurWerte) simWahl();
    const e = einzug(Z.ziel), n = q.length, f0 = tagNr(`${SIM.jahr}-${SIM.f0}`), f1 = Math.max(f0, tagNr(`${SIM.jahr}-${SIM.f1}`)), r0 = tagNr(`${SIM.jahr}-${SIM.r0}`), nf = f1 - f0 + 1;
    const wirkung = new Array(n).fill(0), jeKnoten = {};
    let lagMax = 0;
    for (const s of meta.seen) {
      const m3 = SIM.cm[s.id] * s.flaeche_km2 * 1e4; if (!m3 || !(s.knoten in e)) continue;
      const lag = e[s.knoten]; lagMax = Math.max(lagMax, lag);
      jeKnoten[s.knoten] = (jeKnoten[s.knoten] || 0) + m3 / (nf * 86400);
      for (let i = f0; i <= f1; i++) if (i + lag < n) wirkung[i + lag] -= m3 / (nf * 86400);
      for (let i = r0; i < r0 + SIM.rd; i++) if (i + lag < n) wirkung[i + lag] += m3 / (SIM.rd * 86400);
    }
    const qs = q.map((x, i) => x == null ? null : x + wirkung[i]);
    let anteilMax = null;                        // grösster Anteil des Rückhalts am Abfluss unterhalb der Seen
    for (const k in jeKnoten) for (let i = f0; i <= f1; i++) { const x = Y.q[k] && Y.q[k][i]; if (x) { const a = jeKnoten[k] / x; if (!anteilMax || a > anteilMax.a) anteilMax = { a, k }; } }
    const a = nm7q(q), b = nm7q(qs);
    const karteW = (titel, gross, zusatz = '') => `<div><span>${titel}</span><b>${gross}</b><em>${zusatz}</em></div>`;
    let pegel = '';
    if (Z.ziel === '25700100' && Y.wk && a && b) {   // Pegel aus Tageswertpaaren W/Q desselben Jahres
      const paare = q.map((x, i) => [x, Y.wk[i]]).filter(p => p[0] != null && p[1] != null).sort((x, y) => x[0] - y[0]);
      const w = x => { if (paare.length < 30 || x < paare[0][0] || x > paare[paare.length - 1][0]) return null; let i = 1; while (paare[i][0] < x) i++; const [x0, y0] = paare[i - 1], [x1, y1] = paare[i]; return x1 === x0 ? y0 : y0 + (y1 - y0) * (x - x0) / (x1 - x0); };
      const w0 = w(a.wert), w1 = w(b.wert);
      if (w0 != null && w1 != null) pegel = karteW(T.pegel, `${zahl(w0)} → ${zahl(w1)} cm`, `${w1 >= w0 ? '+' : ''}${zahl(w1 - w0)} cm`);
    }
    $('simwerte').innerHTML = karteW(T.volumen, `${zahl(v, 1)} Mio. m³`) +
      karteW(`${T.plus} (${SIM.rd} ${FR ? 'jours' : 'Tage'})`, `+${zahl(v * 1e6 / (SIM.rd * 86400), 1)} m³/s`) +
      karteW(`${T.minus} (${nf} ${FR ? 'jours' : 'Tage'})`, `−${zahl(v * 1e6 / (nf * 86400), 1)} m³/s`, anteilMax ? `${T.maxAnteil} ${zahl(100 * anteilMax.a, 0)} % ${T.vomAbfluss} ${kurz(ST[anteilMax.k])}` : '') +
      (a && b ? karteW(`${T.nm7qSim} ${kurz(z)}`, `${zahl(a.wert)} → ${zahl(b.wert)} m³/s`, `${b.wert >= a.wert ? '+' : ''}${zahl(100 * (b.wert - a.wert) / a.wert, 1)} %`) : '') + pegel +
      (r0 <= f1 && v ? `<div><em>${T.warn}</em></div>` : '');
    verlauf(q, v ? qs : null, { f0: f0 + lagMax, f1: f1 + lagMax, r0: r0 + lagMax, r1: r0 + SIM.rd - 1 + lagMax }, z);
  }
  function verlauf(q, qs, f, z) {
    const B = 1000, H = 400, L = 62, R = 14, O = 22, U = 62, n = q.length, svg = $('verlauf');
    // Ausschnitt: ganzes Jahr ab null, oder die Abgabe mit 20 Tagen davor und danach (Achse dann nicht ab null)
    const zoom = SIM.zoom && qs, i0 = zoom ? Math.max(0, f.r0 - 20) : 0, i1 = zoom ? Math.min(n - 1, f.r1 + 20) : n - 1;
    const sicht = [...q.slice(i0, i1 + 1), ...(qs || []).slice(i0, i1 + 1)].filter(v => v != null);
    const max = Math.max(...sicht), min = zoom ? Math.min(...sicht) : 0;
    const schritt = [10, 20, 50, 100, 200, 250, 500, 1000, 2000].find(s => (max - min) / s <= 6) || 5000;
    const unten_ = Math.floor(min / schritt) * schritt, oben_ = Math.max(unten_ + schritt, Math.ceil(max / schritt) * schritt);
    const x = i => L + (B - L - R) * (i - i0) / (i1 - i0), y = v => O + (H - O - U) * (1 - (v - unten_) / (oben_ - unten_));
    const linie = a => { let d = '', an = false; a.forEach((v, i) => { if (v == null || i < i0 || i > i1) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); an = true; }); return d; };
    let s = '';
    for (let v = unten_; v <= oben_; v += schritt) s += (v > unten_ ? `<line class="gitter" x1="${L}" x2="${B - R}" y1="${y(v)}" y2="${y(v)}"/>` : '') + `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${zahl(v)}</text>`;
    s += `<text x="${L}" y="${O - 9}" class="fett">m³/s</text><line class="achse" x1="${L}" x2="${B - R}" y1="${y(unten_)}" y2="${y(unten_)}"/>`;
    for (let m = 0; m < 12; m++) { const i = tagNr(`${SIM.jahr}-${String(m + 1).padStart(2, '0')}-01`); if (i < i0 || i > i1) continue; s += `<line class="achse" x1="${x(i)}" x2="${x(i)}" y1="${y(unten_)}" y2="${y(unten_) + 5}"/><text x="${x(i) + 4}" y="${y(unten_) + 18}">${T.monate[m]}</text>`; }
    const balken = (a, b, farbe, yy) => b < i0 || a > i1 ? '' : `<rect x="${x(Math.max(i0, a))}" y="${yy}" width="${Math.max(2, x(Math.min(i1, b)) - x(Math.max(i0, a)))}" height="8" fill="${farbe}"/>`;
    if (qs) s += balken(f.f0, f.f1, '#000', H - 26) + balken(f.r0, f.r1, '#003399', H - 14);
    s += `<path class="gemessen" d="${linie(q)}"/>` + (qs ? `<path class="simuliert" d="${linie(qs)}"/>` : '') +
      `<line class="lot" id="lot" y1="${O}" y2="${y(unten_)}" visibility="hidden"/><rect id="flaeche" x="${L}" y="${O}" width="${B - L - R}" height="${H - O - U}" fill="transparent"/>`;
    svg.setAttribute('viewBox', `0 0 ${B} ${H}`); svg.innerHTML = s;
    svg.setAttribute('aria-label', `${z.gewaesser}–${z.name} ${SIM.jahr}`);
    $('simlegende').innerHTML = `<span><i></i>${h(z.gewaesser)}–${h(kurz(z))} ${SIM.jahr}, ${T.gemessen}</span>` +
      (qs ? `<span><i class="blau"></i>${T.simuliert}</span><span><i class="fenster"></i>${T.fRueck}</span><span><i class="fenster blau"></i>${T.fAbgabe}</span>` : '');
    const tip = $('tip'), lot = $('lot');
    const zeige = ev => {
      const r = svg.getBoundingClientRect(), i = Math.max(i0, Math.min(i1, i0 + Math.round(((ev.clientX - r.left) / r.width * B - L) / (B - L - R) * (i1 - i0))));
      lot.setAttribute('x1', x(i)); lot.setAttribute('x2', x(i)); lot.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${datum(isoTag(SIM.jahr, i))}</b><br>${T.gemessen}: <b>${zahl(q[i])} m³/s</b>` +
        (qs && q[i] != null ? `<br>${T.simuliert}: <b>${zahl(qs[i])} m³/s</b><br>${T.diff}: <b>${qs[i] - q[i] > 0 ? '+' : ''}${zahl(qs[i] - q[i], 1)} m³/s</b>` : '');
      const lx = x(i) / B * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, lx > r.width / 2 ? lx - tip.offsetWidth - 10 : lx + 10)) + 'px';
    };
    $('flaeche').addEventListener('pointermove', zeige); $('flaeche').addEventListener('pointerdown', zeige);
    $('flaeche').addEventListener('pointerleave', () => { tip.hidden = true; lot.setAttribute('visibility', 'hidden'); });
  }

  // ------------------------------------------------------------ Fuss
  $('methodentext').innerHTML = '<ul>' + T.meth.map(m => `<li>${h(m)}</li>`).join('') + '</ul>';
  $('quellen').innerHTML = '<ul>' + meta.quellen.map(q => `<li>${h(q.text)} – <a href="${q.url}">${h(q.url.replace('https://', ''))}</a></li>`).join('') +
    `<li>${FR ? 'Fond de carte' : 'Karte'}: GeoRhena – <a href="https://www.georhena.eu">www.georhena.eu</a>; Natural Earth</li>` +
    `<li>${FR ? 'Surfaces des lacs : Wikidata (non officiel)' : 'Seeflächen: Wikidata (nicht amtlich)'}</li></ul>`;
  $('stand').textContent = `${T.standT}: ${datum(meta.stand.slice(0, 10))}` + (meta.meldungen.length ? ` · ${meta.meldungen.join(' · ')}` : '');

  // ------------------------------------------------------------ Ablauf
  let lauf = 0;
  async function alles() {
    const nr = ++lauf;
    wahlZeichnen();
    const r = await bilanzRechnen();
    if (nr !== lauf) return;
    karteZeichnen(r.a); stationZeichnen(r.a); bilanzZeichnen(r); seenZeichnen(r);
    sim();
  }
  karteGrund(); simSeen(); alles();
})();
