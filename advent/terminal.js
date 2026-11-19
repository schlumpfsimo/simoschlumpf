// terminal.js – das Lotto-Terminal: Foto → Codes erkennen → korrigieren → einreichen → Ergebnis auf dem LCD.
// Das Ergebnis kommt zusätzlich als Quittung aus dem Schlitz (mit allen Feldern, auch den nicht gerubbelten).
(function () {
  'use strict';
  const { el, t, zahl, datum } = Advent;
  const warten = ms => new Promise(r => setTimeout(r, ms));

  /** Text eines Feldes (Punkte, Multiplikator, Sofortgewinn, Niete). */
  function effektText(f) {
    if (f.effekt === 'sofortgewinn') return t('effekt.sofortgewinn', { geschenk: f.geschenk || '' });
    if (f.effekt === 'punkte') return t('effekt.punkte', { wert: zahl(f.wert) });
    return t('effekt.' + f.effekt, { wert: String(f.wert).replace('.', ',') });
  }

  /** Art des Ergebnisses: jackpot, gewinn, niete, ungueltig. */
  function art(e) {
    if (e.ungueltig) return 'ungueltig';
    if (e.jackpot) return 'jackpot';
    if (e.total > 0 || (e.gewinne && e.gewinne.length)) return 'gewinn';
    return 'niete';
  }

  async function terminal() {
    App.laden();
    let s;
    try { s = await App.startDaten(); } catch (e) { App.fehlerAnzeigen(e, terminal); return; }

    const los = s.los && s.los.status === 'offen' ? s.los : null;
    const z = { codes: [], foto: null, vorschau: null, noetig: los ? los.felderzahl : null, sendet: false, fertig: false };

    // ---------- Gerät
    const display = el('div', { class: 'display', 'aria-live': 'polite' });
    const kamera = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'datei', id: 'foto-kamera', 'aria-label': t('terminal.foto') });
    const galerie = el('input', { type: 'file', accept: 'image/*', class: 'datei', id: 'foto-galerie', 'aria-label': t('terminal.galerie') });
    const fotoKnopf = el('label', { class: 'pille', for: 'foto-kamera', role: 'button' });
    fotoKnopf.innerHTML = Grafik.symbol('kamera');
    fotoKnopf.append(t('terminal.foto'));
    fotoKnopf.addEventListener('click', () => Klang.spielen('klick'));
    const galerieKnopf = el('label', { class: 'pille creme klein', for: 'foto-galerie', role: 'button', style: 'min-height:62px' }, t('terminal.galerie'));
    const codesEl = el('div', { class: 'codes' });
    const eingabe = el('input', { type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      maxlength: '6', placeholder: t('terminal.kuerzel_platzhalter'), 'aria-label': t('terminal.kuerzel'), enterkeyhint: 'done' });
    const steuerung = el('div', {},
      el('div', { class: 'terminal-knoepfe' }, fotoKnopf, galerieKnopf),
      codesEl,
      el('div', { class: 'eingabe-label' }, t('terminal.kuerzel')),
      el('div', { class: 'eingabe' }, eingabe, App.knopf(t('terminal.hinzufuegen'), 'creme klein', abtippen)));
    const geraet = el('section', { class: 'geraet', 'aria-label': t('terminal.marke') },
      el('div', { class: 'geraet-marke' }, t('terminal.marke')),
      el('div', { class: 'display-rahmen' }, display),
      el('div', { class: 'lautsprecher', 'aria-hidden': 'true' }, ...Array.from({ length: 7 }, () => el('span'))),
      kamera, galerie, steuerung,
      el('div', { class: 'schlitz', 'aria-hidden': 'true' }));
    const einreichen = App.knopf(t('terminal.einreichen'), 'rot', absenden);
    const unten = el('div', { class: 'einreichen-platz' }, einreichen);
    const quittungPlatz = el('div');
    const nachher = el('div', { class: 'knopfreihe', style: 'margin-top:24px' });

    App.zeigen(App.leiste({ zurueck: true }), geraet, quittungPlatz, unten, nachher);

    // ---------- Anzeige
    function lcd(...zeilen) { display.textContent = ''; display.append(...zeilen.filter(Boolean)); }
    const zeile = (text, klasse) => el('div', { class: 'lcd-zeile ' + (klasse || '') }, text);

    function bereit() {
      const kopf = los ? t('terminal.heute', { tag: String(los.tag).padStart(2, '0'), regel: los.regel || '' }) : '';
      lcd(zeile('SimOil · ' + datum(s.heute, true), 'lcd-klein'),
        zeile(t('terminal.bereit'), 'lcd-gross lcd-blink'),
        kopf ? zeile(kopf, 'lcd-klein') : null,
        los && los.frage ? zeile(los.frage, 'lcd-klein') : null,
        el('div', { class: 'lcd-trenn' }),
        zeile(t('terminal.los_einlegen'), 'lcd-cursor'));
    }

    function erkanntAnzeigen() {
      const n = z.codes.length;
      const kopf = z.noetig ? t('terminal.erkannt', { anzahl: n, noetig: z.noetig }) : t('terminal.erkannt_ohne', { anzahl: n });
      const teile = [zeile(kopf, 'lcd-mittel')];
      if (!n) teile.push(zeile(t('terminal.nichts'), 'lcd-blink'));
      z.codes.forEach(c => teile.push(zeile('► ' + c.kuerzel + (c.manuell ? '  (VON HAND)' : ''))));
      if (z.noetig && n > z.noetig) teile.push(el('div', { class: 'lcd-trenn' }), zeile(t('terminal.zu_viele'), 'lcd-blink'));
      lcd(...teile);
      if (z.vorschau) display.append(el('img', { class: 'foto-mini', src: z.vorschau, alt: '' }));
    }

    function codesZeichnen() {
      codesEl.textContent = '';
      z.codes.forEach((c, i) => codesEl.append(el('span', { class: 'code' + (c.manuell ? ' manuell' : '') }, c.kuerzel,
        el('button', { 'aria-label': t('terminal.entfernen') + ' ' + c.kuerzel, onclick: () => {
          Klang.spielen('klick'); z.codes.splice(i, 1); codesZeichnen(); erkanntAnzeigen();
        } }, '×'))));
      einreichen.disabled = !z.codes.length || z.sendet;
    }

    function fehlerLcd(text) {
      lcd(zeile(t('terminal.fehler'), 'lcd-gross lcd-blink'), el('div', { class: 'lcd-trenn' }), zeile(text, 'lcd-klein'));
    }

    // ---------- Foto lesen
    async function fotoGewaehlt(ev) {
      const datei = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (!datei || z.fertig) return;
      lcd(zeile(t('terminal.lese'), 'lcd-mittel'), balken(0));
      const b = display.querySelector('.ladebalken');
      const animation = balkenLaufen(b, 2500);
      try {
        const r = await Erkennung.lesen(datei);
        z.foto = r.jpeg;
        z.vorschau = r.vorschau;
        z.codes = z.codes.filter(c => c.manuell && !r.codes.some(x => x.kuerzel === c.kuerzel))
          .concat(r.codes.map(c => ({ kuerzel: c.kuerzel, qrId: c.qrId, manuell: false })));
        animation.stopp();
        Klang.spielen(r.codes.length ? 'tipp' : 'fehler');
        if (!r.codes.length) Simo.sagen('nichts_erkannt');
      } catch (e) {
        animation.stopp();
        console.error(e);
        fehlerLcd(t('fehler.kamera'));
        return;
      } finally { codesZeichnen(); }
      erkanntAnzeigen();
    }
    kamera.addEventListener('change', fotoGewaehlt);
    galerie.addEventListener('change', fotoGewaehlt);

    function abtippen() {
      const k = Erkennung.kuerzelPruefen(eingabe.value);
      if (!k) { fehlerLcd(t('terminal.kuerzel_falsch')); Klang.spielen('fehler'); return; }
      if (!z.codes.some(c => c.kuerzel === k)) z.codes.push({ kuerzel: k, qrId: null, manuell: true });
      eingabe.value = '';
      codesZeichnen();
      erkanntAnzeigen();
    }
    eingabe.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); abtippen(); } });

    // ---------- Ladebalken aus Pixel-Segmenten
    function balken(anteil) {
      const b = el('div', { class: 'ladebalken', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' });
      for (let i = 0; i < 12; i++) b.append(el('span'));
      setzeBalken(b, anteil);
      return b;
    }
    function setzeBalken(b, anteil) {
      [...b.children].forEach((s2, i) => s2.classList.toggle('voll', i < Math.round(anteil * 12)));
      b.setAttribute('aria-valuenow', String(Math.round(anteil * 100)));
    }
    function balkenLaufen(b, ms) {
      let stopp = false;
      const start = performance.now();
      (function schritt() {
        if (stopp || !b.isConnected) return;
        const p = Math.min(0.92, (performance.now() - start) / ms);
        setzeBalken(b, p);
        setTimeout(schritt, 90);
      })();
      return { stopp() { stopp = true; setzeBalken(b, 1); } };
    }

    // ---------- Einreichen
    async function absenden() {
      if (z.sendet || !z.codes.length || z.fertig) return;
      z.sendet = true;
      einreichen.disabled = true;
      lcd(zeile(t('terminal.pruefe'), 'lcd-mittel lcd-blink'), balken(0));
      const animation = balkenLaufen(display.querySelector('.ladebalken'), 1800);
      const mindestens = warten(1600);    // Spannung: der Balken läuft immer eine Weile
      try {
        const r = await Advent.api('einreichen', {
          codes: z.codes.map(c => c.qrId || c.kuerzel),
          manuell: z.codes.some(c => c.manuell),
          foto: z.foto
        }, { zeit: 90 });
        await mindestens;
        animation.stopp();
        await warten(250);
        z.fertig = true;
        App.start = null;
        try { sessionStorage.setItem('simoil.saldo', String(r.saldo - (r.ergebnis.total || 0))); } catch (e) { /* egal */ }
        ergebnisZeigen(r.ergebnis, r.saldo, true);
      } catch (e) {
        await mindestens;
        animation.stopp();
        fehlerLcd(e.message);
        Klang.spielen('fehler');
        if (e.code === 'schon_eingereicht') App.start = null;
      } finally {
        z.sendet = false;
        codesZeichnen();
      }
    }

    // ---------- Ergebnis
    function ergebnisZeigen(e, saldo, frisch) {
      const a = art(e);
      const gross = { gewinn: t('terminal.gewinn'), niete: t('terminal.kein_gewinn'), ungueltig: t('terminal.ungueltig'), jackpot: t('terminal.jackpot') }[a];
      const felder = el('div', { class: 'lcd-felder' }, e.felder.map(f =>
        el('div', { class: f.gerubbelt ? 'an' : 'aus' }, (f.gerubbelt ? '►' : ' ') + 'F' + f.feld + ' ' + effektText(f) + (f.richtig ? ' =RICHTIG' : ''))));
      lcd(zeile(t('quittung.los', { tag: String(e.tag).padStart(2, '0') }), 'lcd-klein'),
        zeile(gross, 'lcd-gross' + (a === 'jackpot' ? ' lcd-blink' : '')),
        zeile(e.ungueltig ? t('terminal.null') : (e.total > 0 ? t('terminal.punkte', { punkte: zahl(e.total) }) : t('terminal.null')), 'lcd-mittel'),
        ...(e.gewinne || []).map(g => zeile('+ ' + g.titel, 'lcd-klein')),
        el('div', { class: 'lcd-trenn' }), felder);
      steuerung.hidden = true;
      unten.hidden = true;
      quittungPlatz.textContent = '';
      quittungPlatz.append(quittung(e, saldo));
      nachher.textContent = '';
      if (e.gewinne && e.gewinne.length) nachher.append(App.knopf(t('knopf.regal'), 'mint', '#/regal', 'regal'));
      nachher.append(App.knopf(t('knopf.tankstelle'), '', '#/'));

      if (!frisch) return;
      Klang.spielen({ gewinn: 'gewinn', jackpot: 'jackpot', niete: 'niete', ungueltig: 'fehler' }[a]);
      if (a === 'gewinn' || a === 'jackpot') Konfetti.los({ jackpot: a === 'jackpot' });
      const vars = { punkte: e.total, saldo, tag: e.tag, ware: (e.gewinne || []).map(g => g.titel).join(', ') };
      if (a === 'gewinn' && e.gewinne && e.gewinne.length) Simo.sagen('sofortgewinn', vars);
      else Simo.sagen(a, vars);
    }

    function quittung(e, saldo) {
      const q = el('div', { class: 'quittung', role: 'region', 'aria-label': t('quittung.titel') });
      const z2 = (links, rechts, klasse) => el('div', { class: 'q-zeile ' + (klasse || '') }, el('span', {}, links), el('span', {}, rechts == null ? '' : rechts));
      q.append(el('h3', {}, t('quittung.titel')),
        el('div', { class: 'q-mitte' }, datum(e.spieldatum) + (String(e.zeit).length > 15 ? ', ' + e.zeit.slice(11, 13) + '.' + e.zeit.slice(14, 16) + ' Uhr' : '')),
        el('div', { class: 'q-mitte' }, t('quittung.los', { tag: String(e.tag).padStart(2, '0') })),
        el('div', { class: 'q-trenn' }));
      e.felder.forEach(f => q.append(z2(t('quittung.feld', { feld: f.feld }) + (f.beschriftung ? ' ' + f.beschriftung : ''),
        effektText(f), f.gerubbelt ? 'fett' : 'leise')));
      q.append(el('div', { class: 'q-trenn' }));
      if (e.ungueltig) q.append(el('div', { class: 'q-mitte' }, t('terminal.ungueltig')));
      if (e.typ === 'quiz' && !e.ungueltig) {
        const richtig = e.felder.find(f => f.richtig);
        q.append(el('div', { class: 'q-mitte' }, e.quizRichtig ? t('quittung.quiz_richtig') : t('quittung.quiz_falsch', { antwort: richtig ? richtig.beschriftung : '' })));
      }
      if (!e.ungueltig && e.multiplikator && e.multiplikator !== 1) q.append(z2(t('quittung.multiplikator', { punkte: e.punkte, faktor: String(e.multiplikator).replace('.', ',') }), zahl(e.losPunkte)));
      if (e.serienbonus) q.append(z2(t('quittung.serienbonus', { serie: e.serie }), '+' + zahl(e.serienbonus)));
      (e.gewinne || []).forEach(g => q.append(z2(t('quittung.sofortgewinn', { ware: g.titel }), '')));
      if (e.adminPunkte != null) q.append(z2(t('quittung.admin'), zahl(e.adminPunkte)));
      q.append(el('div', { class: 'q-trenn' }), z2(t('quittung.total'), zahl(e.total) + ' Pkt', 'fett'));
      if (saldo != null) q.append(z2(t('quittung.saldo'), zahl(saldo) + ' Pkt'));
      q.append(el('div', { class: 'q-trenn' }), el('div', { class: 'q-mitte' }, t('quittung.danke')));
      return q;
    }

    // ---------- Start der Ansicht
    if (!los && s.ergebnisHeute && !(s.nachholbar && s.nachholbar.length)) {
      ergebnisZeigen(s.ergebnisHeute, s.saldo, false);       // heutiges Los schon eingelöst: Ergebnis nochmals zeigen
    } else {
      bereit();
      codesZeichnen();
      App.simoEinmal('los_pruefen', { tag: los ? los.tag : '' });
    }
    Erkennung.laden().catch(() => { /* wird beim Lesen nochmals versucht */ });
  }

  App.ansichten.terminal = terminal;
})();
