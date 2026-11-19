// regal.js – das Regal: Ware mit Preisschildern, Zustände, Kaufen, Öffnen.
// Zustände: sichtbar · eingeschweisst (Form in Folie, Inhalt verschwommen) · Aktion (Stern mit Enddatum)
//           · ausverkauft (Stempel) · gehört dir (Band, lässt sich öffnen) · neu (springt ins Regal)
(function () {
  'use strict';
  const { el, t, zahl, datum } = Advent;

  /** Blatt, das von unten hochfedert. Gibt { blatt, schliessen } zurück. */
  function dialog(beimSchliessen) {
    const blatt = el('div', { class: 'dialog-blatt', role: 'dialog', 'aria-modal': 'true' });
    const grund = el('div', { class: 'dialog-grund' }, blatt);
    function schliessen() { grund.remove(); document.removeEventListener('keydown', taste); if (beimSchliessen) beimSchliessen(); }
    function taste(e) { if (e.key === 'Escape') schliessen(); }
    grund.addEventListener('click', e => { if (e.target === grund) schliessen(); });
    document.addEventListener('keydown', taste);
    document.body.append(grund);
    return { blatt, schliessen };
  }

  function bildEl(w, gross) {
    const b = el('div', { class: (gross ? 'dialog-bild' : 'ware-bild') + (w.eingeschweisst ? ' folie' : '') });
    b.innerHTML = Ware.svg(w.illustration);
    return b;
  }

  function preisschild(w, gross) {
    if (w.gewonnen && !w.preis) return el('div', { class: 'preisschild' + (gross ? ' gross' : '') }, el('small', {}, t('regal.gewonnen')));
    return el('div', { class: 'preisschild' + (gross ? ' gross' : '') }, el('b', {}, zahl(w.preis)), el('small', {}, 'Pkt'));
  }

  function wareKnopf(w, i, offen) {
    const b = el('button', { class: 'ware' + (w.ausverkauft && !w.gehoert ? ' ausverkauft' : '') + (w.neu ? ' neu-rein' : ''),
      style: '--n:' + Math.min(i, 6), 'aria-label': (w.titel || t('regal.eingeschweisst')) + ', ' + zahl(w.preis) + ' Punkte' + (w.gehoert ? ', ' + t('regal.gehoert') : '') });
    const bild = bildEl(w);
    if (w.aktionBis && !w.gehoert) {
      const s = el('div', { class: 'aktion-stern' });
      s.innerHTML = Grafik.stern([t('regal.aktion'), t('regal.aktion_bis', { datum: '' }) + datum(w.aktionBis, true).replace(/^\S+ /, '')], { seed: i + 5 });
      bild.append(s);
    }
    if (w.ausverkauft && !w.gehoert) bild.append(el('div', { class: 'stempel' }, t('regal.ausverkauft')));
    b.append(bild);
    if (w.gehoert) b.append(el('span', { class: 'band-gehoert' }, t('regal.gehoert')));
    if (w.neu) b.append(el('span', { class: 'marke-neu' }, t('regal.neu')));
    b.append(el('div', { class: 'ware-titel' }, w.titel || '???'), preisschild(w));
    if (!w.gehoert && w.kaufbar && w.fehlend > 0) b.append(el('div', { class: 'ware-noch' }, t('regal.noch', { fehlend: zahl(w.fehlend) })));
    b.addEventListener('click', () => { Klang.spielen('klick'); offen(w); });
    return b;
  }

  /** Inhalt einer Ware, die ihr gehört (Text, Code, Link oder Bild). */
  function inhaltEl(x) {
    if (!x.inhalt && !x.hatBild) return el('p', { class: 'info' }, t('regal.ohne_inhalt'));
    if (x.art === 'code') {
      const kopieren = el('button', { class: 'pille creme klein', style: 'margin:12px auto 0' }, t('regal.kopieren'));
      kopieren.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(x.inhalt); kopieren.textContent = t('regal.kopiert'); Klang.spielen('tipp'); } catch (e) { /* von Hand kopieren */ }
      });
      return el('div', { class: 'inhalt-box' }, el('div', { class: 'inhalt-code' }, x.inhalt), kopieren);
    }
    if (x.art === 'link') {
      return el('div', { class: 'inhalt-box', style: 'text-align:center' },
        el('a', { class: 'pille', href: x.inhalt, target: '_blank', rel: 'noopener noreferrer' }, t('regal.link')));
    }
    if (x.art === 'bild') {
      const box = el('div', { class: 'inhalt-box' }, el('div', { class: 'laden-punkte', style: 'padding:20px' }, '…'));
      Advent.api('bild', { id: x.id }, { zeit: 45 })
        .then(r => { box.textContent = ''; box.append(el('img', { src: r.bild, alt: x.titel || '' })); })
        .catch(e => { box.textContent = e.message; });
      return box;
    }
    return el('div', { class: 'inhalt-box' }, x.inhalt);
  }

  async function regal() {
    App.laden();
    let r;
    try { r = await Advent.api('regal'); } catch (e) { App.fehlerAnzeigen(e, regal); return; }
    let saldo = r.saldo;
    const konto = el('span', { class: 'kontostand', 'aria-live': 'polite' }, zahl(saldo), el('small', {}, 'Pkt'));

    // Reihenfolge: Neues zuerst, dann Kaufbares nach Preis, dann Eigenes, Ausverkauftes am Schluss
    const rang = w => (w.neu ? 0 : 1) * 10 + (w.gehoert ? 2 : 0) + (w.ausverkauft && !w.gehoert ? 4 : 0);
    const ware = r.ware.slice().sort((a, b) => rang(a) - rang(b) || a.preis - b.preis);

    const regalEl = el('section', { class: 'regal', 'aria-label': t('regal.titel') });
    if (!ware.length) regalEl.append(el('div', { class: 'regal-leer' }, t('regal.leer')));
    for (let i = 0; i < ware.length; i += 2) {
      regalEl.append(el('div', { class: 'fach' }, ...ware.slice(i, i + 2).map((w, j) => wareKnopf(w, i + j, offen))));
    }

    App.zeigen(App.leiste({ zurueck: true, mitte: konto }),
      el('div', { class: 'regal-kopf' }, el('h1', { class: 'regal-schild' }, t('regal.titel'))), regalEl);

    if (ware.some(w => w.neu)) Simo.sagen('neue_ware', { saldo });
    else App.simoEinmal('regal', { saldo });

    // ---------- Detail, Kauf, Öffnen
    function offen(w) {
      const d = dialog(() => { if (geaendert) regal(); });
      let geaendert = false;
      zeigeDetail();

      function zeigeDetail() {
        const b = d.blatt;
        b.textContent = '';
        b.append(bildEl(w, true),
          el('h2', {}, w.titel || t('regal.eingeschweisst')),
          w.beschreibung ? el('p', {}, w.beschreibung) : (w.eingeschweisst ? el('p', {}, t('regal.eingeschweisst_text')) : null),
          preisschild(w, true));
        const info = [];
        if (w.aktionBis && !w.gehoert) info.push(t('regal.aktion') + ' ' + t('regal.aktion_bis', { datum: w.aktionBis }));
        if (w.rest != null && w.rest > 0 && !w.gehoert) info.push(t('regal.rest', { rest: w.rest }));
        if (info.length) b.append(el('p', { class: 'info', style: 'margin-top:14px' }, info.join(' · ')));
        const knoepfe = el('div', { class: 'dialog-knoepfe' });
        if (w.gehoert) knoepfe.append(App.knopf(t('regal.oeffnen'), 'mint', oeffnen));
        if (w.kaufbar && (!w.gehoert)) {
          if (w.fehlend > 0) {
            const k = App.knopf(t('regal.noch', { fehlend: zahl(w.fehlend) }), '', () => {});
            k.disabled = true;
            knoepfe.append(k);
            Simo.sagen('zu_wenig', { fehlend: w.fehlend, saldo });
          } else {
            knoepfe.append(App.knopf(t('regal.kaufen', { preis: zahl(w.preis) }), 'rot', bestaetigen));
          }
        } else if (w.kaufbar && w.gehoert && w.fehlend === 0) {
          knoepfe.append(App.knopf(t('regal.nochmals'), 'creme', bestaetigen));
        }
        knoepfe.append(App.knopf(t('regal.schliessen'), 'creme', d.schliessen));
        b.append(knoepfe);
      }

      function bestaetigen() {
        const b = d.blatt;
        const rest = saldo - w.preis;
        b.textContent = '';
        b.append(bildEl(w, true),
          el('p', { style: 'font-size:19px;font-weight:600' }, w.eingeschweisst
            ? t('regal.bestaetigen_eingeschweisst', { preis: zahl(w.preis), rest: zahl(rest) })
            : t('regal.bestaetigen', { titel: w.titel, preis: zahl(w.preis), rest: zahl(rest) })),
          el('div', { class: 'dialog-knoepfe' },
            App.knopf(t('regal.ja'), 'rot', kaufen),
            App.knopf(t('regal.nein'), 'creme', zeigeDetail)));
      }

      async function kaufen(ev) {
        const knopf = ev && ev.currentTarget;
        if (knopf) knopf.disabled = true;
        try {
          const k = await Advent.api('kaufen', { id: w.id, preis: w.preis });
          geaendert = true;
          saldo = k.saldo;
          konto.firstChild.textContent = zahl(saldo);
          try { sessionStorage.setItem('simoil.saldo', String(saldo)); } catch (e) { /* egal */ }
          Klang.spielen('kasse');
          Konfetti.los();
          Object.assign(w, { gehoert: true, eingeschweisst: false, titel: k.ware.titel, beschreibung: k.ware.beschreibung });
          zeigeOffen(k.ware, true);
          Simo.sagen('kauf', { ware: k.ware.titel, saldo });
        } catch (e) {
          Klang.spielen('fehler');
          if (e.code === 'zu_wenig_punkte') Simo.sagen('zu_wenig', { fehlend: e.daten.fehlend, saldo });
          const b = d.blatt;
          b.textContent = '';
          b.append(el('div', { class: 'meldung fehler', role: 'alert', style: 'margin:0 0 10px' }, e.message),
            el('div', { class: 'dialog-knoepfe' }, App.knopf(t('regal.schliessen'), 'creme', () => { geaendert = true; d.schliessen(); })));
        }
      }

      async function oeffnen(ev) {
        const knopf = ev && ev.currentTarget;
        if (knopf) knopf.disabled = true;
        try {
          const o = await Advent.api('oeffnen', { id: w.id });
          zeigeOffen(o.ware, false);
          Simo.sagen('oeffnen', { ware: o.ware.titel });
        } catch (e) {
          if (knopf) knopf.disabled = false;
          d.blatt.append(el('div', { class: 'meldung fehler', role: 'alert' }, e.message));
        }
      }

      function zeigeOffen(x, frisch) {
        const b = d.blatt;
        b.textContent = '';
        const bild = bildEl({ illustration: x.illustration }, true);
        if (frisch) bild.classList.add('ausgepackt');
        b.append(bild, el('h2', {}, x.titel), x.beschreibung ? el('p', {}, x.beschreibung) : null, inhaltEl(x),
          el('div', { class: 'dialog-knoepfe' }, App.knopf(t('regal.schliessen'), 'creme', d.schliessen)));
      }
    }
  }

  App.ansichten.regal = regal;
})();
