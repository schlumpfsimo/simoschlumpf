// app.js – Seite der Spielerin. Ansichten über die Adresse (#/start, #/einlesen, #/ergebnis/5, …).
// Texte stehen in theme/theme.json, Aussehen in theme/theme.css, die Ergebnis-Animation in theme/reveal/.
(function () {
  'use strict';
  const { api, t, el, datum, zeit, zahl } = Advent;

  const inhalt = document.getElementById('inhalt');
  const zustand = {
    start: null,            // letzte Antwort von «start»
    ergebnisse: {},         // Tag → Ergebnis (aus Einreichen oder Verlauf)
    frisch: null,           // Tag des gerade eingereichten Loses (dann mit Animation)
    bilder: {},             // Zwischenspeicher für Bilder (Data-URLs)
    einlesen: null          // Stand der Ansicht «Los einlesen»
  };

  // ---------------------------------------------------------------- Hilfen
  function saldoZeigen(s) {
    if (s == null) return;
    if (zustand.start) zustand.start.saldo = s;
    const k = document.getElementById('kopf-saldo');
    k.textContent = t('allg.punkte', { punkte: s });
    k.hidden = false;
  }

  function punkteText(n) { return n === 1 ? t('allg.punkt') : t('allg.punkte', { punkte: n }); }

  function laden(text) { return el('div', { class: 'laden' }, text || t('allg.laden')); }

  function fehlerKasten(e, nochmals) {
    return el('div', { class: 'meldung fehler', role: 'alert' },
      el('p', {}, e.message || String(e)),
      nochmals ? el('button', { class: 'knopf klein zweit', onclick: nochmals }, t('allg.nochmals')) : null);
  }

  /** Wie Element.append, überspringt aber null/false (sonst stünde «null» auf der Seite). */
  function anhaengen(ziel, ...knoten) { ziel.append(...knoten.filter(k => k != null && k !== false)); }

  function zeigen(...knoten) {
    inhalt.textContent = '';
    anhaengen(inhalt, ...knoten);
    window.scrollTo(0, 0);
  }

  /** Einfacher Dialog. knoepfe: [{text, zweit, wert}] → Promise mit dem gewählten Wert. */
  function dialog(inhaltKnoten, knoepfe) {
    const d = document.getElementById('dialog');
    return new Promise(ok => {
      const box = el('div', { class: 'dialog-box', role: 'dialog', 'aria-modal': 'true' }, inhaltKnoten,
        ...knoepfe.map(k => el('button', { class: 'knopf' + (k.zweit ? ' zweit' : ''), onclick: () => { d.hidden = true; ok(k.wert); } }, k.text)));
      d.textContent = '';
      d.append(box);
      d.hidden = false;
      d.onclick = (ev) => { if (ev.target === d) { d.hidden = true; ok(null); } };
    });
  }

  async function bild(art, id) {
    const s = art + ':' + id;
    if (!zustand.bilder[s]) zustand.bilder[s] = api('bild', { art, id }, { zeit: 45 }).then(r => r.bild);
    try { return await zustand.bilder[s]; } catch (e) { delete zustand.bilder[s]; throw e; }
  }

  /** Bild-Element, das sein Bild nachlädt. */
  function nachladeBild(laderFn, alt) {
    const img = el('img', { alt: alt || '', loading: 'lazy' });
    laderFn().then(src => { img.src = src; }).catch(() => img.remove());
    return img;
  }

  function effektText(f) {
    if (f.effekt === 'sofortgewinn') return t('effekt.sofortgewinn', { geschenk: f.geschenk || '' });
    if (f.effekt === 'punkte') return f.wert === 1 ? t('allg.punkt') : t('effekt.punkte', { wert: zahl(f.wert) });
    return t('effekt.' + f.effekt, { wert: String(f.wert).replace('.', ',') });
  }

  // ---------------------------------------------------------------- Start
  async function ansichtStart() {
    zeigen(laden());
    let s;
    try { s = await api('start'); } catch (e) { zeigen(fehlerKasten(e, ansichtStart)); return; }
    zustand.start = s;
    kopfAktualisieren();
    const teile = [];

    teile.push(el('div', { class: 'karte' },
      el('div', { class: 'leise' }, t('start.konto')),
      el('div', { class: 'zahl-gross' }, zahl(s.saldo)),
      el('div', { class: 'leise' }, s.serie ? t('start.serie', { serie: s.serie }) : t('start.serie_null'))));

    const heute = el('div', { class: 'karte' }, el('div', { class: 'leise' }, t('start.heute', { datum: s.heute })));
    if (s.los) {
      const l = s.los;
      if (l.status === 'offen') {
        anhaengen(heute, el('h2', {}, t('start.los_offen', { tag: l.tag })),
          l.regel ? el('p', {}, l.regel) : null,
          l.frage ? el('p', {}, el('strong', {}, l.frage)) : null,
          el('a', { class: 'knopf', href: '#/einlesen' }, t('start.los_einlesen')));
      } else {
        if (s.ergebnisHeute) zustand.ergebnisse[l.tag] = s.ergebnisHeute;
        anhaengen(heute, el('h2', {}, t(l.status === 'ungueltig' ? 'start.los_ungueltig' : 'start.los_erledigt', { tag: l.tag })),
          s.ergebnisHeute && !s.ergebnisHeute.ungueltig ? el('p', {}, punkteText(s.ergebnisHeute.total)) : null,
          el('a', { class: 'knopf zweit', href: '#/ergebnis/' + l.tag }, t('start.ergebnis_ansehen')));
      }
    } else if (s.erstes && s.heute < s.erstes) {
      heute.append(el('p', {}, t('start.vor_start', { datum: s.erstes })));
    } else if (s.naechstes) {
      heute.append(el('p', {}, t('start.kein_los', { datum: s.naechstes.datum })));
    } else {
      heute.append(el('p', {}, t('start.ende')));
    }
    teile.push(heute);

    if (s.nachholbar && s.nachholbar.length) {
      teile.push(el('div', { class: 'karte' },
        el('p', {}, t('start.nachholen', { liste: s.nachholbar.map(n => n.tag + ' (' + datum(n.datum, true) + ')').join(', ') })),
        el('a', { class: 'knopf zweit', href: '#/einlesen' }, t('start.nachholen_knopf'))));
    }
    if (s.neueKatalog) {
      teile.push(el('a', { class: 'karte zeile', href: '#/katalog', style: 'text-decoration:none' },
        el('span', {}, s.neueKatalog === 1 ? t('start.katalog_neu_1') : t('start.katalog_neu', { anzahl: s.neueKatalog })),
        el('span', { class: 'marke neu' }, t('katalog.neu'))));
    }
    zeigen(...teile);
  }

  function kopfAktualisieren() {
    const s = zustand.start;
    if (!s) return;
    saldoZeigen(s.saldo);
    const band = document.getElementById('testband');
    band.hidden = !s.testmodus;
    band.textContent = t('allg.testmodus', { datum: s.heute });
  }

  async function startDaten() {
    if (!zustand.start) { zustand.start = await api('start'); kopfAktualisieren(); }
    return zustand.start;
  }

  // ---------------------------------------------------------------- Los einlesen
  function ansichtEinlesen() {
    zeigen(laden());
    startDaten().then(s => einlesenAufbauen(s)).catch(e => zeigen(fehlerKasten(e, ansichtEinlesen)));
    Erkennung.laden().catch(() => { /* wird beim Lesen nochmals versucht */ });
  }

  function einlesenAufbauen(s) {
    // Welches Los erwarten wir? Heutiges, sonst das älteste nachholbare (nur für Hinweise)
    const los = s.los && s.los.status === 'offen' ? s.los : null;
    const noetig = los ? los.felderzahl : null;
    const z = zustand.einlesen = { codes: [], foto: null, noetig, sendet: false };

    const kamera = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'datei', id: 'foto-kamera' });
    const galerie = el('input', { type: 'file', accept: 'image/*', class: 'datei', id: 'foto-galerie' });
    const vorschau = el('div');
    const meldung = el('div', { 'aria-live': 'polite' });
    const liste = el('div', { class: 'codes' });
    const zaehler = el('p', { class: 'leise' });
    const eingabe = el('input', { type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters',
      spellcheck: 'false', maxlength: '6', placeholder: 'K7QX', 'aria-label': t('einlesen.manuell') });
    const einreichen = el('button', { class: 'knopf', disabled: true, onclick: absenden }, t('einlesen.einreichen'));
    const fotoKnopf = el('label', { class: 'knopf', for: 'foto-kamera' }, t('einlesen.foto'));

    function codesZeichnen() {
      liste.textContent = '';
      z.codes.forEach((c, i) => liste.append(el('span', { class: 'code' + (c.manuell ? ' manuell' : '') }, c.kuerzel,
        el('button', { 'aria-label': t('einlesen.entfernen') + ' ' + c.kuerzel, onclick: () => { z.codes.splice(i, 1); codesZeichnen(); } }, '×'))));
      zaehler.textContent = z.noetig ? t('einlesen.anzahl', { anzahl: z.codes.length, noetig: z.noetig }) : '';
      einreichen.disabled = !z.codes.length || z.sendet;
      if (z.noetig && z.codes.length > z.noetig) {
        meldung.textContent = '';
        meldung.append(el('div', { class: 'meldung fehler' }, t('einlesen.zu_viele_warnung', { anzahl: z.codes.length, noetig: z.noetig })));
      }
    }

    async function fotoGewaehlt(ev) {
      const datei = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (!datei) return;
      meldung.textContent = '';
      vorschau.textContent = '';
      vorschau.append(laden(t('einlesen.erkennen')));
      try {
        const r = await Erkennung.lesen(datei);
        z.foto = r.jpeg;
        // Neues Foto ersetzt die erkannten Codes, abgetippte bleiben
        z.codes = z.codes.filter(c => c.manuell && !r.codes.some(x => x.kuerzel === c.kuerzel))
          .concat(r.codes.map(c => ({ kuerzel: c.kuerzel, qrId: c.qrId, manuell: false })));
        vorschau.textContent = '';
        vorschau.append(el('img', { class: 'vorschau-bild', src: r.vorschau, alt: '' }));
        if (!r.codes.length) meldung.append(el('div', { class: 'meldung fehler' }, t('einlesen.keine')));
        fotoKnopf.textContent = t('einlesen.foto_neu');
      } catch (e) {
        console.error(e);
        vorschau.textContent = '';
        meldung.append(el('div', { class: 'meldung fehler' }, t('fehler.kamera')));
      }
      codesZeichnen();
    }
    kamera.addEventListener('change', fotoGewaehlt);
    galerie.addEventListener('change', fotoGewaehlt);

    function abtippen() {
      const k = Erkennung.kuerzelPruefen(eingabe.value);
      meldung.textContent = '';
      if (!k) { meldung.append(el('div', { class: 'meldung fehler' }, t('einlesen.kuerzel_falsch'))); return; }
      if (!z.codes.some(c => c.kuerzel === k)) z.codes.push({ kuerzel: k, qrId: null, manuell: true });
      eingabe.value = '';
      codesZeichnen();
    }
    eingabe.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); abtippen(); } });

    async function absenden() {
      if (z.sendet || !z.codes.length) return;
      z.sendet = true;
      einreichen.disabled = true;
      meldung.textContent = '';
      meldung.append(laden(t('einlesen.senden')));
      try {
        const r = await api('einreichen', {
          codes: z.codes.map(c => c.qrId || c.kuerzel),
          manuell: z.codes.some(c => c.manuell),
          foto: z.foto
        }, { zeit: 90 });
        zustand.ergebnisse[r.ergebnis.tag] = r.ergebnis;
        zustand.frisch = r.ergebnis.tag;
        zustand.start = null;           // Startseite neu laden
        saldoZeigen(r.saldo);
        zustand.letzterSaldo = r.saldo;
        location.hash = '#/ergebnis/' + r.ergebnis.tag;
      } catch (e) {
        meldung.textContent = '';
        meldung.append(fehlerKasten(e));
        // Unbekannte Kürzel markieren, damit sie leicht zu entfernen sind
        if (e.code === 'code_unbekannt' && e.daten.codes) {
          z.codes = z.codes.filter(c => !e.daten.codes.includes(c.kuerzel)).concat(
            z.codes.filter(c => e.daten.codes.includes(c.kuerzel)));
        }
        if (e.code === 'schon_eingereicht') zustand.start = null;
      } finally {
        z.sendet = false;
        codesZeichnen();
      }
    }

    const regel = los
      ? el('div', { class: 'karte' }, el('p', {}, t('einlesen.regel', { tag: los.tag, regel: los.regel || '' })),
          los.frage ? el('p', {}, el('strong', {}, los.frage)) : null)
      : null;

    zeigen(
      el('h1', {}, t('einlesen.titel')),
      regel,
      el('p', { class: 'leise' }, t('einlesen.anleitung')),
      kamera, galerie, fotoKnopf,
      el('label', { class: 'knopf zweit', for: 'foto-galerie' }, t('einlesen.galerie')),
      el('div', { style: 'margin-top:16px' }, vorschau),
      meldung,
      el('h2', { style: 'margin-top:16px' }, t('einlesen.erkannt')),
      liste, zaehler,
      el('div', { class: 'leise' }, t('einlesen.manuell'), ' · ', t('einlesen.manuell_hinweis')),
      el('div', { class: 'eingabe-zeile' }, eingabe, el('button', { class: 'knopf klein zweit', onclick: abtippen }, t('einlesen.hinzufuegen'))),
      einreichen);
    codesZeichnen();
  }

  // ---------------------------------------------------------------- Ergebnis (Reveal)
  let revealModul = null;
  async function reveal() {
    if (!revealModul) {
      const name = (Advent.THEME.reveal || 'schlicht').replace(/[^\w-]/g, '');
      revealModul = (await import('./theme/reveal/' + name + '.js')).default;
    }
    return revealModul;
  }

  async function ansichtErgebnis(tag) {
    tag = Number(tag);
    let e = zustand.ergebnisse[tag];
    if (!e) {
      zeigen(laden());
      try {
        const v = await api('verlauf');
        v.lose.forEach(l => { if (l.ergebnis) zustand.ergebnisse[l.tag] = l.ergebnis; });
      } catch (x) { zeigen(fehlerKasten(x, () => ansichtErgebnis(tag))); return; }
      e = zustand.ergebnisse[tag];
      if (!e) { location.hash = '#/verlauf'; return; }
    }
    const frisch = zustand.frisch === tag;
    zustand.frisch = null;
    const buehne = el('div', { class: 'reveal-buehne' });
    const rest = el('div');
    zeigen(el('h1', { class: 'ergebnis-kopf' }, t('reveal.titel', { tag })), buehne, rest);
    const modul = await reveal();
    await modul.zeigen(buehne, e, { t, el, zahl, effektText, frisch });
    rest.append(...ergebnisDetails(e, { mitSaldo: frisch }));
    rest.append(el('a', { class: 'knopf', href: '#/start' }, t('reveal.weiter')));
    if (e.gewinne && e.gewinne.length) rest.append(el('a', { class: 'knopf zweit', href: '#/geschenke' }, t('reveal.geschenke')));
  }

  /** Aufstellung und «Das hättest du bekommen» (auch im Verlauf verwendet). */
  function ergebnisDetails(e, opt) {
    const teile = [];
    const zeilen = [];
    if (e.ungueltig) {
      teile.push(el('div', { class: 'meldung fehler' }, t('reveal.ungueltig', { erlaubt: e.erlaubt, erkannt: e.erkannt })));
    } else {
      if (e.typ === 'quiz') {
        const richtig = e.felder.find(f => f.richtig);
        teile.push(el('div', { class: 'meldung ' + (e.quizRichtig ? 'gut' : 'fehler') },
          e.quizRichtig ? t('reveal.quiz_richtig') : t('reveal.quiz_falsch', { antwort: richtig ? richtig.beschriftung : '' })));
      }
      if (e.multiplikator && e.multiplikator !== 1) zeilen.push([t('reveal.multiplikator', { punkte: e.punkte, faktor: String(e.multiplikator).replace('.', ',') }), e.losPunkte]);
      if (e.serienbonus) zeilen.push([t('reveal.serienbonus', { serie: e.serie, punkte: e.serienbonus }), e.serienbonus]);
      (e.gewinne || []).forEach(g => zeilen.push([t('reveal.sofortgewinn', { titel: g.titel }), '']));
      if (e.adminPunkte != null) zeilen.push([t('reveal.admin', { punkte: e.adminPunkte }), e.adminPunkte]);
    }
    if (zeilen.length) {
      teile.push(el('table', { class: 'aufstellung' }, el('tbody', {},
        zeilen.map(z => el('tr', {}, el('td', {}, z[0]), el('td', {}, z[1] === '' ? '' : zahl(z[1])))))));
    }
    if (opt && opt.mitSaldo && zustand.letzterSaldo != null) {
      teile.push(el('p', { class: 'leise', style: 'margin-top:10px' }, t('reveal.saldo', { saldo: zustand.letzterSaldo })));
    }
    teile.push(el('h2', { style: 'margin-top:20px' }, t('reveal.haettest')));
    teile.push(el('div', { class: 'felder-gitter' }, e.felder.map(f =>
      el('div', { class: 'feld-karte ' + (f.gerubbelt ? 'gerubbelt' : 'ungerubbelt') + (f.richtig ? ' richtig' : '') },
        el('div', { class: 'feld-nr' }, 'Feld ' + f.feld + (f.beschriftung ? ' · ' + f.beschriftung : '') + (f.gerubbelt ? ' · ' + t('reveal.gerubbelt') : '')),
        el('div', { class: 'feld-wert' + (f.effekt === 'niete' ? ' niete' : '') }, effektText(f))))));
    return teile;
  }

  // ---------------------------------------------------------------- Katalog
  async function ansichtKatalog() {
    zeigen(laden());
    let k;
    try { k = await api('katalog'); } catch (e) { zeigen(fehlerKasten(e, ansichtKatalog)); return; }
    saldoZeigen(k.saldo);
    if (zustand.start) zustand.start.neueKatalog = 0;
    const teile = [el('h1', {}, t('katalog.titel')), el('p', { class: 'leise' }, t('katalog.konto', { saldo: k.saldo }))];
    if (!k.eintraege.length) teile.push(el('p', {}, t('katalog.leer')));
    // Erst kaufbare, dann nach Preis
    k.eintraege.sort((a, b) => (a.rest === 0) - (b.rest === 0) || (a.preis == null) - (b.preis == null) || (a.preis || 0) - (b.preis || 0));
    k.eintraege.forEach(a => teile.push(angebotKarte(a, k.saldo)));
    zeigen(...teile);
  }

  function angebotKarte(a, saldo) {
    const verdeckt = a.titel == null;
    const titel = verdeckt ? t(a.sichtbarkeit === 'ganz' ? 'katalog.geheimnis' : 'katalog.ueberraschung') : a.titel;
    const karte = el('div', { class: 'karte angebot' + (verdeckt ? ' verdeckt' : '') });
    if (a.hatBild) karte.append(nachladeBild(() => bild('katalog', a.id), titel));
    karte.append(el('div', { class: 'zeile' }, el('h2', { style: 'margin:0' }, titel), a.neu ? el('span', { class: 'marke neu' }, t('katalog.neu')) : null));
    if (a.beschreibung) karte.append(el('p', { style: 'margin-top:6px' }, a.beschreibung));
    if (a.sichtbarkeit === 'ganz' && verdeckt) karte.append(el('p', { class: 'leise', style: 'margin-top:6px' }, t('katalog.geheimnis_text')));
    const info = [];
    if (a.preis != null) info.push(el('strong', {}, t('katalog.preis', { preis: a.preis })));
    if (a.bis) info.push(t('katalog.bis', { datum: a.bis }));
    if (a.rest != null && a.rest > 0) info.push(t('katalog.rest', { rest: a.rest }));
    if (a.gekauft) info.push(t('katalog.gekauft', { anzahl: a.gekauft }));
    if (info.length) karte.append(el('p', { class: 'leise', style: 'margin:8px 0 0' }, ...info.flatMap((x, i) => i ? [' · ', x] : [x])));
    if (a.preis != null && a.fehlend > 0 && a.rest !== 0) {
      karte.append(el('div', { class: 'balken' }, el('div', { style: `width:${Math.max(3, Math.min(100, saldo / a.preis * 100))}%` })),
        el('div', { class: 'leise' }, t('katalog.fehlend', { fehlend: a.fehlend })));
    }
    const knopf = el('button', { class: 'knopf', onclick: () => kaufen(a, titel) },
      a.rest === 0 ? t('katalog.ausverkauft') : t('katalog.kaufen'));
    knopf.disabled = a.rest === 0 || (a.preis != null && a.fehlend > 0);
    karte.append(knopf);
    return karte;
  }

  async function kaufen(a, titel) {
    let preis = a.preis;
    const saldo = zustand.start ? zustand.start.saldo : null;
    try {
      if (preis == null) {
        // «ganz verdeckt»: Preis erst jetzt vom Server holen
        try { await api('kaufen', { id: a.id }); } catch (e) {
          if (e.code !== 'bestaetigen') throw e;
          preis = e.daten.preis;
          if (e.daten.fehlend > 0) {
            await dialog(el('p', {}, t('fehler.zu_wenig_punkte', { fehlend: e.daten.fehlend })), [{ text: t('allg.ok'), wert: true }]);
            return;
          }
        }
      }
      const rest = (saldo != null ? saldo : preis) - preis;
      const frage = a.titel == null && a.sichtbarkeit === 'ganz'
        ? t('katalog.bestaetigen_geheim', { preis, rest })
        : t('katalog.bestaetigen', { titel, preis, rest });
      const ja = await dialog(el('p', {}, frage), [{ text: t('katalog.ja'), wert: true }, { text: t('allg.abbrechen'), zweit: true, wert: false }]);
      if (!ja) return;
      const r = await api('kaufen', { id: a.id, preis });
      saldoZeigen(r.saldo);
      const inhaltKnoten = el('div', {}, el('h2', {}, t('katalog.gekauft_titel')),
        el('p', {}, t('katalog.gekauft_text', { titel: r.bestellung.titel })),
        r.bestellung.beschreibung ? el('p', { class: 'leise' }, r.bestellung.beschreibung) : null,
        r.geschenk ? geschenkInhalt(r.geschenk) : null);
      await dialog(inhaltKnoten, [{ text: t('allg.ok'), wert: true }]);
      ansichtKatalog();
    } catch (e) {
      await dialog(el('p', {}, e.message), [{ text: t('allg.ok'), wert: true }]);
      ansichtKatalog();
    }
  }

  // ---------------------------------------------------------------- Geschenke
  function geschenkInhalt(g) {
    if (!g) return null;
    const box = el('div', { class: 'geschenk-inhalt' });
    if (g.beschreibung) box.append(el('p', { class: 'leise' }, g.beschreibung));
    if (g.art === 'code') {
      const knopf = el('button', { class: 'knopf klein zweit' }, t('geschenke.kopieren'));
      knopf.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(g.inhalt); knopf.textContent = t('geschenke.kopiert'); } catch (e) { /* manuell kopieren */ }
      });
      box.append(el('div', { class: 'geschenk-code' }, g.inhalt), knopf);
    } else if (g.art === 'link') {
      box.append(el('a', { class: 'knopf klein', href: g.inhalt, target: '_blank', rel: 'noopener noreferrer' }, t('geschenke.oeffnen')));
    } else if (g.art === 'bild') {
      box.append(nachladeBild(() => bild('geschenk', g.id), g.titel));
    } else if (g.inhalt) {
      box.append(el('p', { class: 'geschenk-text' }, g.inhalt));
    }
    return box;
  }

  async function ansichtGeschenke() {
    zeigen(laden());
    let r;
    try { r = await api('geschenke'); } catch (e) { zeigen(fehlerKasten(e, ansichtGeschenke)); return; }
    const teile = [el('h1', {}, t('geschenke.titel'))];
    if (!r.geschenke.length) teile.push(el('p', {}, t('geschenke.leer')));
    r.geschenke.forEach(x => {
      const titel = x.geschenk && x.quelle === 'los' ? x.geschenk.titel : x.titel;
      const karte = el('div', { class: 'karte geschenk' });
      if (x.quelle === 'kauf' && x.hatBild) karte.append(nachladeBild(() => bild('katalog', x.katalogId), titel));
      karte.append(el('div', { class: 'zeile' }, el('h2', { style: 'margin:0' }, titel),
        x.quelle === 'kauf' ? el('span', { class: 'marke' + (x.status === 'erledigt' ? ' gut' : '') }, t(x.status === 'erledigt' ? 'geschenke.status_erledigt' : 'geschenke.status_neu')) : null));
      karte.append(el('p', { class: 'leise', style: 'margin-top:4px' }, x.quelle === 'los'
        ? t('geschenke.aus_los', { tag: x.tag })
        : t('geschenke.gekauft', { datum: x.zeit.slice(0, 10), preis: x.preis })));
      if (x.quelle === 'kauf' && x.beschreibung) karte.append(el('p', {}, x.beschreibung));
      karte.append(x.geschenk ? geschenkInhalt(x.geschenk) : el('p', {}, t('geschenke.ohne_inhalt')));
      teile.push(karte);
    });
    zeigen(...teile);
  }

  // ---------------------------------------------------------------- Verlauf
  async function ansichtVerlauf() {
    zeigen(laden());
    let v;
    try { v = await api('verlauf'); } catch (e) { zeigen(fehlerKasten(e, ansichtVerlauf)); return; }
    const teile = [el('h1', {}, t('verlauf.titel'))];
    v.lose.forEach(l => {
      if (l.ergebnis) zustand.ergebnisse[l.tag] = l.ergebnis;
      const e = l.ergebnis;
      let rechts;
      if (e && !e.ungueltig) rechts = el('span', { class: 'marke gut' }, t('verlauf.punkte', { punkte: e.total }));
      else if (l.status === 'ungueltig') rechts = el('span', { class: 'marke schlecht' }, t('verlauf.ungueltig'));
      else if (l.status === 'gesperrt') rechts = el('span', { class: 'leise' }, t('verlauf.gesperrt', { datum: l.datum }));
      else rechts = el('span', { class: 'marke' }, t('verlauf.' + l.status));
      const details = el('div', { class: 'los-details', hidden: true });
      const zeile = el('div', { class: 'los-zeile' + (l.status === 'gesperrt' ? ' gesperrt' : '') },
        el('span', { class: 'nr' }, l.tag),
        el('span', { class: 'mitte' }, datum(l.datum), e && e.nachgeholt ? el('span', { class: 'leise' }, ' · ' + t('verlauf.nachgeholt')) : null),
        rechts);
      if (l.status !== 'gesperrt') {
        zeile.addEventListener('click', () => {
          details.hidden = !details.hidden;
          if (!details.hidden && !details.firstChild) details.append(...verlaufDetails(l));
        });
      }
      teile.push(zeile, details);
    });
    zeigen(...teile);
  }

  function verlaufDetails(l) {
    const teile = [];
    if (l.regel) teile.push(el('p', { class: 'leise' }, l.regel));
    if (l.frage) teile.push(el('p', {}, el('strong', {}, l.frage)));
    if (!l.ergebnis) {
      if (l.status === 'nachholbar' || l.status === 'offen') teile.push(el('a', { class: 'knopf', href: '#/einlesen' }, t('start.los_einlesen')));
      return teile;
    }
    teile.push(...ergebnisDetails(l.ergebnis));
    if (l.ergebnis.hatFoto) {
      const platz = el('div');
      const knopf = el('button', { class: 'knopf klein zweit' }, t('verlauf.foto'));
      knopf.addEventListener('click', async () => {
        knopf.disabled = true;
        platz.append(laden());
        try {
          const r = await api('foto', { einsendung: l.ergebnis.einsendung }, { zeit: 45 });
          platz.textContent = '';
          platz.append(el('img', { src: r.bild, alt: '', style: 'border-radius:8px;margin-top:10px' }));
          knopf.remove();
        } catch (e) { platz.textContent = ''; platz.append(fehlerKasten(e)); knopf.disabled = false; }
      });
      teile.push(knopf, platz);
    }
    return teile;
  }

  // ---------------------------------------------------------------- Navigation
  const ANSICHTEN = { start: ansichtStart, einlesen: ansichtEinlesen, ergebnis: ansichtErgebnis, katalog: ansichtKatalog,
    geschenke: ansichtGeschenke, verlauf: ansichtVerlauf };

  function route() {
    const teile = location.hash.replace(/^#\/?/, '').split('/');
    const name = ANSICHTEN[teile[0]] ? teile[0] : 'start';
    document.querySelectorAll('.navi a').forEach(a => a.classList.toggle('aktiv', a.dataset.ziel === name || (name === 'ergebnis' && a.dataset.ziel === 'verlauf')));
    ANSICHTEN[name](teile[1]);
  }

  async function los() {
    await Advent.theme();
    document.getElementById('kopf-name').textContent = Advent.THEME.name || '';
    document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    if (!Advent.token('spieler')) {
      zeigen(el('div', { class: 'meldung' }, t('start.kein_zugang')));
      return;
    }
    document.getElementById('navi').hidden = false;
    window.addEventListener('hashchange', route);
    route();
  }

  los();
})();
