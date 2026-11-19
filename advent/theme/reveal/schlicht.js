// Reveal-Modul «schlicht»: deckt die gerubbelten Felder nacheinander auf und zählt die Punkte hoch.
//
// Schnittstelle für eigene Module (neue Datei in theme/reveal/, Name in theme.json bei "reveal"):
//   export default { async zeigen(buehne, ergebnis, hilfen) { … } }
//   buehne    leeres Element, in das das Modul zeichnet
//   ergebnis  { tag, typ, felder:[{feld, effekt, wert, geschenk, beschriftung, gerubbelt, richtig}],
//               ungueltig, quizRichtig, punkte, multiplikator, losPunkte, serienbonus, total, gewinne:[{titel,…}] }
//   hilfen    { t, el, zahl, effektText, frisch }   frisch = true direkt nach dem Einreichen (dann animieren)
// Das Versprechen (Promise) soll sich erfüllen, wenn die Animation fertig ist. Danach zeigt die Seite die Details.

const STIL = `
.rv { text-align: center; padding: 8px 0 16px; }
.rv-felder { display: flex; justify-content: center; gap: 12px; margin: 12px 0 18px; }
.rv-feld { width: 120px; min-height: 120px; border-radius: var(--radius); background: var(--farbe-flaeche);
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px;
  border: 2px solid var(--farbe-text); font-weight: 700; font-size: 18px; position: relative; overflow: hidden; }
.rv-feld small { font-weight: 400; font-size: 13px; color: var(--farbe-leise); margin-bottom: 4px; }
.rv-feld .rv-deckel { position: absolute; inset: 0; background: var(--farbe-text); transition: transform .7s cubic-bezier(.6,0,.3,1); }
.rv-feld.offen .rv-deckel { transform: translateY(-101%); }
.rv-summe { font-family: var(--schrift-zahl); font-size: 56px; font-weight: 700; line-height: 1; }
.rv-text { font-size: 19px; margin-top: 8px; min-height: 1.4em; }
.rv-text.gut { color: var(--farbe-gut); }
.rv-text.schlecht { color: var(--farbe-schlecht); }
.rv-fade { opacity: 0; transform: translateY(6px); transition: opacity .4s, transform .4s; }
.rv-fade.da { opacity: 1; transform: none; }
`;

const warten = ms => new Promise(r => setTimeout(r, ms));
const ruhig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default {
  async zeigen(buehne, e, { t, el, zahl, effektText, frisch }) {
    if (!document.getElementById('rv-stil')) document.head.append(el('style', { id: 'rv-stil' }, STIL));
    const animieren = frisch && !ruhig();

    const gerubbelt = e.felder.filter(f => f.gerubbelt);
    const felder = el('div', { class: 'rv-felder' }, gerubbelt.map(f =>
      el('div', { class: 'rv-feld' + (animieren ? '' : ' offen') },
        el('small', {}, 'Feld ' + f.feld + (f.beschriftung ? ' · ' + f.beschriftung : '')),
        el('span', {}, effektText(f)),
        el('div', { class: 'rv-deckel' }))));
    const summe = el('div', { class: 'rv-summe rv-fade' + (animieren ? '' : ' da') }, '0');
    const text = el('div', { class: 'rv-text rv-fade' + (animieren ? '' : ' da') });
    buehne.append(el('div', { class: 'rv' }, felder, summe, text));

    let ziel = e.total || 0;
    if (e.ungueltig) {
      text.textContent = t('reveal.ungueltig', { erlaubt: e.erlaubt, erkannt: e.erkannt });
      text.classList.add('schlecht');
    } else if (ziel > 0) {
      text.textContent = t('reveal.gewonnen', { punkte: ziel });
      text.classList.add('gut');
    } else if (e.gewinne && e.gewinne.length) {
      text.textContent = t('reveal.sofortgewinn', { titel: e.gewinne.map(g => g.titel).join(', ') });
      text.classList.add('gut');
    } else {
      text.textContent = t('reveal.nichts');
    }

    if (!animieren) { summe.textContent = zahl(ziel); return; }

    // Felder nacheinander aufdecken
    await warten(350);
    for (const f of felder.children) { f.classList.add('offen'); await warten(650); }
    // Summe hochzählen
    summe.classList.add('da');
    const dauer = Math.min(1400, 300 + ziel * 15);
    const start = performance.now();
    await new Promise(fertig => {
      function schritt(jetzt) {
        const p = Math.min(1, (jetzt - start) / dauer);
        summe.textContent = zahl(Math.round(ziel * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(schritt); else fertig();
      }
      requestAnimationFrame(schritt);
    });
    text.classList.add('da');
    await warten(300);
  }
};
