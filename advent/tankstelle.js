// tankstelle.js – Startseite: Dach mit Schild, Leuchtschrift, Laden mit Simo, Preistafel, Knöpfe, Asphalt.
// Am Sonntag zusätzlich «SONNTAGSVERKAUF» und Wimpelkette.
(function () {
  'use strict';
  const { el, t } = Advent;

  /** Schreibt einen Text als einzelne Buchstaben, damit einer davon wie eine kaputte Röhre flackern kann. */
  function roehrenText(text, flackerIndex) {
    const s = el('span');
    [...text].forEach((b, i) => s.append(i === flackerIndex ? el('span', { class: 'flacker' }, b) : b));
    return s;
  }

  async function tankstelle() {
    App.laden();
    let s;
    try { s = await App.startDaten(true); } catch (e) { App.fehlerAnzeigen(e, tankstelle); return; }

    // Dach mit Schild
    const dach = el('header', { class: 'dach' }, App.leiste({}));
    const schild = el('div', { class: 'schild', role: 'img', 'aria-label': Advent.THEME.name || 'SimOil' });
    schild.innerHTML = Grafik.logo(Advent.THEME.name || 'SimOil');
    dach.append(schild);

    // Wimpel und Leuchtschrift
    const wimpel = s.sonntag ? el('div', { class: 'wimpel' }) : null;
    if (wimpel) wimpel.innerHTML = Grafik.wimpel(12);
    const brett = el('div', { class: 'leuchtbrett', style: s.sonntag ? 'margin-top:4px' : null },
      el('div', { class: 'neon' }, roehrenText(t('schild.leuchtschrift'), 3)),
      s.sonntag ? el('div', { class: 'neon cyan sonntag' }, t('schild.sonntag')) : null);

    // Laden mit Fenster (Simo an der Kasse), Tür mit Türschild, Sternaufkleber
    const fenster = el('div', { class: 'fenster' });
    fenster.innerHTML = Grafik.simo(s.sonntag ? 'freude' : 'normal');
    const tuerText = t('schild.tuer').split(' ');
    const tuer = el('div', { class: 'tuer' },
      el('div', { class: 'tuerschild' }, el('b', {}, tuerText[0]), tuerText.slice(1).join(' ')));
    const stern = el('div', { class: 'aufkleber' });
    const sternText = Advent.roh('schild.stern');
    stern.innerHTML = Grafik.stern(Array.isArray(sternText) ? sternText : [String(sternText || '')], { seed: 11 });
    const laden = el('div', { class: 'laden' }, stern, fenster, tuer);

    // Preistafel mit Klappziffern
    const punkte = Klappziffern.erstellen(Math.max(4, String(s.saldo).length), 'gross');
    const losNr = Klappziffern.erstellen(2);
    const tafel = el('div', { class: 'tafel' },
      el('div', { class: 'tafel-kasten' },
        el('div', { class: 'tafel-kopf' }, Advent.THEME.name || 'SimOil'),
        el('div', { class: 'tafel-zeile' }, el('div', { class: 'tafel-label' }, t('tafel.punkte')), punkte),
        el('div', { class: 'tafel-zeile' }, el('div', { class: 'tafel-label' }, t('tafel.los')), losNr)),
      el('div', { class: 'tafel-mast' }));

    // Nachholen
    const notiz = s.nachholbar && s.nachholbar.length
      ? el('div', { class: 'notiz' }, t('nachholen', { liste: s.nachholbar.map(n => n.tag).join(', ') }))
      : null;

    // Knöpfe
    const regalKnopf = App.knopf(t('knopf.regal'), 'mint', '#/regal', 'regal');
    if (s.neueWare) regalKnopf.append(el('span', { class: 'marke-neu' }, t('regal.neu')));
    const knoepfe = el('div', { class: 'knopfreihe' }, App.knopf(t('knopf.los_pruefen'), '', '#/terminal', 'los'), regalKnopf);

    // Asphalt mit Fahrbahnmarkierung
    const markierung = el('div', { class: 'markierung' });
    for (let i = 0; i < 8; i++) markierung.append(el('span'));
    const asphalt = el('div', { class: 'asphalt', 'aria-hidden': 'true' }, markierung);

    App.zeigen(el('div', { class: 'tankstelle' }, dach, wimpel, brett,
      el('div', { class: 'platz' }, laden, tafel), notiz, knoepfe, asphalt));

    // Ziffern: vom zuletzt gesehenen Stand aus hochklappen
    let vorher = 0;
    try { vorher = Number(sessionStorage.getItem('simoil.saldo') || 0); sessionStorage.setItem('simoil.saldo', String(s.saldo)); } catch (e) { /* egal */ }
    Klappziffern.setzen(punkte, s.saldo, { von: Math.min(vorher, s.saldo), verzoegerung: 250, fuellen: '0' });
    Klappziffern.setzen(losNr, s.los ? s.los.tag : (s.naechstes ? s.naechstes.tag : null), { fuellen: '0', von: 0, verzoegerung: 500 });

    // Simo begrüsst passend zur Lage
    const vars = { tag: s.los ? s.los.tag : '', saldo: s.saldo, datum: s.erstes };
    if (!s.los && s.erstes && s.heute < s.erstes) App.simoEinmal('vor_start', { datum: s.erstes, saldo: s.saldo });
    else if (!s.los && !s.naechstes) App.simoEinmal('ende', vars);
    else if (s.sonntag) App.simoEinmal('sonntag', vars);
    else if (s.neueWare) App.simoEinmal('neue_ware', vars);
    else if (s.los && s.los.status !== 'offen') App.simoEinmal('begruessung_erledigt', vars);
    else App.simoEinmal('begruessung', vars);
  }

  App.ansichten.tankstelle = tankstelle;
})();
