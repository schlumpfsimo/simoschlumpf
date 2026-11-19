// admin.js – Admin-Seite. Alle Aktionen laufen mit dem Admin-Token (aus ?t=… beim ersten Aufruf).
// Oben rechts wählst du, welche Daten du siehst: die der Spielerin oder die des Testzugangs.
(function () {
  'use strict';
  const { el, datum, zeit, zahl } = Advent;
  const $ = id => document.getElementById(id);

  let modus = sessionStorage.getItem('advent.admin.modus') || 'echt';
  let reiter = sessionStorage.getItem('advent.admin.reiter') || 'uebersicht';
  let daten = null;   // letzte Übersicht

  const api = (aktion, d, opt) => Advent.api(aktion, Object.assign({ modus }, d || {}), Object.assign({ art: 'admin' }, opt || {}));

  function meldung(text, art) {
    $('meldung').textContent = '';
    if (text) $('meldung').append(el('div', { class: 'meldung ' + (art || '') }, text));
  }

  function zeigen(...k) { const a = $('ansicht'); a.textContent = ''; a.append(...k.filter(x => x != null && x !== false)); }

  async function ausfuehren(fn, erfolg) {
    meldung('');
    try { const r = await fn(); if (erfolg) meldung(erfolg, 'gut'); await laden(); return r; }
    catch (e) { meldung(e.message, 'fehler'); return null; }
  }

  function tabelle(kopf, zeilen) {
    return el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste' },
      el('thead', {}, el('tr', {}, kopf.map(k => el('th', {}, k)))),
      el('tbody', {}, zeilen)));
  }

  const STATUSWORT = { offen: 'heute offen', gesperrt: 'gesperrt', nachholbar: 'nachholbar', verpasst: 'verpasst', eingereicht: 'eingereicht', ungueltig: 'ungültig' };

  // ---------------------------------------------------------------- Reiter
  function uebersicht() {
    const d = daten;
    const basis = location.href.replace(/admin\.html.*$/, '');
    const link = (titel, token) => {
      const url = basis + '?t=' + token;
      return el('div', { style: 'margin:6px 0' }, el('div', { class: 'leise' }, titel),
        el('div', { class: 'zeile' }, el('code', { style: 'word-break:break-all;font-size:13px' }, url),
          el('button', { class: 'knopf klein zweit', onclick: (ev) => { navigator.clipboard.writeText(url).then(() => { ev.target.textContent = 'Kopiert'; }); } }, 'Kopieren')));
    };
    const offen = d.bestellungen.filter(b => b.status === 'neu').length;
    zeigen(
      el('div', { class: 'karte' },
        el('div', { class: 'leise' }, modus === 'test' ? 'Testzugang' : 'Spielerin'),
        el('div', { class: 'zahl-gross' }, zahl(d.saldo)), el('div', { class: 'leise' }, 'Punkte · Serie ' + d.serie)),
      el('div', { class: 'karte' },
        el('p', {}, 'Spieldatum Spielerin: ', el('strong', {}, datum(d.heuteEcht))),
        el('p', {}, 'Spieldatum Testzugang: ', el('strong', {}, datum(d.heuteTest)), d.einstellungen['Testdatum'] ? ' (Testdatum gesetzt)' : ' (echtes Datum)'),
        el('p', {}, 'Einsendungen: ', String(d.einsendungen.filter(e => e.status !== 'zurückgesetzt').length),
          ' · offene Bestellungen: ', el('strong', {}, String(offen)))),
      el('div', { class: 'karte' }, el('h2', {}, 'Links'),
        link('Spielerin (nur ihr schicken)', d.zugaenge.spieler),
        link('Testzugang (für dich)', d.zugaenge.test),
        el('a', { class: 'knopf zweit klein', href: 'druck.html', style: 'margin-top:10px' }, 'Druckvorlage öffnen')),
      modus === 'test' ? el('div', { class: 'karte' }, el('h2', {}, 'Testdaten'),
        el('p', { class: 'leise' }, 'Löscht alle Einsendungen, Buchungen, Bestellungen und Gewinne des Testzugangs samt Testfotos. Die Daten der Spielerin bleiben.'),
        el('button', { class: 'knopf zweit klein', onclick: () => {
          if (confirm('Alle Testdaten löschen?')) ausfuehren(() => api('admin_testdaten_loeschen'), 'Testdaten gelöscht.');
        } }, 'Testdaten löschen')) : null);
  }

  function einsendungen() {
    const zeilen = daten.einsendungen.map(e => {
      const fotobox = el('div', { class: 'fotobox' });
      const knoepfe = el('div', { class: 'knoepfe' });
      if (e.hatFoto) knoepfe.append(el('button', { class: 'knopf klein zweit', onclick: async (ev) => {
        ev.target.disabled = true;
        try { const r = await api('admin_foto', { einsendung: e.id }, { zeit: 45 }); fotobox.append(el('img', { src: r.bild, alt: '' })); ev.target.remove(); }
        catch (x) { meldung(x.message, 'fehler'); ev.target.disabled = false; }
      } }, 'Foto'));
      if (e.status !== 'zurückgesetzt') {
        knoepfe.append(el('button', { class: 'knopf klein zweit', onclick: () => {
          const p = prompt('Neue Gesamtpunkte für Los ' + e.tag + ' (bisher ' + e.total + '):', e.total);
          if (p == null) return;
          const notiz = prompt('Notiz (optional):', '') || '';
          ausfuehren(() => api('admin_ergebnis', { einsendung: e.id, punkte: p, notiz }), 'Ergebnis geändert.');
        } }, 'Ergebnis ändern'));
        knoepfe.append(el('button', { class: 'knopf klein zweit', onclick: () => {
          if (confirm('Los ' + e.tag + ' zurücksetzen? Punkte und Sofortgewinne dieses Loses werden storniert, das Los kann neu eingereicht werden.')) {
            ausfuehren(() => api('admin_zuruecksetzen', { tag: e.tag }), 'Los ' + e.tag + ' zurückgesetzt.');
          }
        } }, 'Zurücksetzen'));
      }
      const felder = (e.felder || []).map(f => (f.gerubbelt ? '●' : '○') + f.feld + ' ' + kurzEffekt(f)).join('  ');
      return el('tr', {},
        el('td', { class: 'z' }, e.tag),
        el('td', {}, zeit(e.zeit), e.nachgeholt ? el('div', { class: 'leise' }, 'nachgeholt') : null),
        el('td', {}, e.status, e.manuell ? el('div', { class: 'leise' }, 'Kürzel von Hand') : null, e.notiz ? el('div', { class: 'leise' }, e.notiz) : null),
        el('td', {}, el('div', { class: 'effekte' }, e.codes), el('div', { class: 'effekte leise' }, felder)),
        el('td', { class: 'z' }, zahl(e.total)),
        el('td', {}, knoepfe, fotobox));
    });
    zeigen(daten.einsendungen.length ? tabelle(['Tag', 'Zeit', 'Status', 'Codes / Felder', 'Punkte', ''], zeilen) : el('p', {}, 'Noch keine Einsendungen.'));
  }

  function kurzEffekt(f) {
    return f.effekt === 'punkte' ? 'P' + f.wert : f.effekt === 'multiplikator' ? 'x' + f.wert
      : f.effekt === 'sofortgewinn' ? 'S:' + (f.geschenk || '') : '–';
  }

  function bestellungen() {
    const zeilen = daten.bestellungen.map(b => el('tr', {},
      el('td', {}, zeit(b.zeit)), el('td', {}, b.titel, el('div', { class: 'leise' }, b.wareId)),
      el('td', { class: 'z' }, zahl(b.preis)), el('td', {}, b.status),
      el('td', {}, el('div', { class: 'knoepfe' },
        b.status === 'neu' ? el('button', { class: 'knopf klein', onclick: () => ausfuehren(() => api('admin_bestellung', { id: b.id, status: 'erledigt' }), 'Als erledigt markiert.') }, 'Erledigt') : null,
        b.status === 'erledigt' ? el('button', { class: 'knopf klein zweit', onclick: () => ausfuehren(() => api('admin_bestellung', { id: b.id, status: 'neu' })) }, 'Wieder offen') : null,
        b.status !== 'storniert' ? el('button', { class: 'knopf klein zweit', onclick: () => {
          if (confirm('«' + b.titel + '» stornieren? Die Punkte gehen zurück.')) ausfuehren(() => api('admin_bestellung', { id: b.id, status: 'storniert' }), 'Storniert.');
        } }, 'Stornieren') : null))));
    zeigen(daten.bestellungen.length ? tabelle(['Zeit', 'Angebot', 'Preis', 'Status', ''], zeilen) : el('p', {}, 'Noch keine Bestellungen.'));
  }

  function punkte() {
    const betrag = el('input', { type: 'number', inputmode: 'numeric', step: '1', placeholder: 'z. B. 20 oder -10' });
    const grund = el('input', { type: 'text', placeholder: 'Grund, z. B. Bonus für …' });
    zeigen(
      el('div', { class: 'karte formular' }, el('h2', {}, 'Punkte buchen'),
        el('label', {}, 'Betrag', betrag), el('label', {}, 'Grund (sieht nur du)', grund),
        el('button', { class: 'knopf', onclick: () => ausfuehren(() => api('admin_buchen', { betrag: betrag.value, grund: grund.value }), 'Gebucht.') }, 'Buchen')),
      el('h2', {}, 'Buchungen (neueste zuerst)'),
      tabelle(['Zeit', 'Grund', 'Betrag', 'Saldo'], daten.buchungen.map(b => el('tr', {},
        el('td', {}, zeit(b.zeit)), el('td', {}, b.grund), el('td', { class: 'z' }, zahl(b.betrag)), el('td', { class: 'z' }, zahl(b.saldo))))));
  }

  async function lose() {
    zeigen(el('div', { class: 'laden' }, 'Lade Lose …'));
    let r;
    try { r = await api('admin_lose'); } catch (e) { zeigen(el('div', { class: 'meldung fehler' }, e.message)); return; }
    if (!r.lose.length) { zeigen(el('p', {}, 'Noch keine Lose. Reiter «Lose erzeugen».')); return; }
    zeigen(tabelle(['Tag', 'Datum', 'Typ', 'Felder (Effekt, Kürzel)', 'Status'], r.lose.map(l => el('tr', {},
      el('td', { class: 'z' }, l.tag), el('td', {}, datum(l.datum)), el('td', {}, l.typ + ' · ' + l.felderzahl),
      el('td', {}, l.frage ? el('div', { class: 'leise' }, l.frage) : null,
        el('div', { class: 'effekte' }, l.felder.map(f => f.feld + ': ' + kurzEffekt(f) + (f.richtig ? ' ✓' : '') + (f.beschriftung ? ' «' + f.beschriftung + '»' : '') + ' [' + f.kuerzel + ']').join('  '))),
      el('td', {}, STATUSWORT[l.status] || l.status)))));
  }

  function einstellungen() {
    const e = daten.einstellungen;
    const felder = {
      'Testdatum': el('input', { type: 'date', value: e['Testdatum'] || '' }),
      'Nachholen erlaubt': el('select', {}, el('option', { value: 'ja' }, 'ja'), el('option', { value: 'nein' }, 'nein')),
      'Serienbonus an': el('select', {}, el('option', { value: 'ja' }, 'ja'), el('option', { value: 'nein' }, 'nein')),
      'Serienbonus': el('input', { type: 'number', step: '1', value: e['Serienbonus'] || '0' }),
      'Serienbonus ab': el('input', { type: 'number', step: '1', min: '1', value: e['Serienbonus ab'] || '3' }),
      'Jackpot ab': el('input', { type: 'number', step: '1', min: '1', value: e['Jackpot ab'] || '100' }),
      'E-Mail': el('input', { type: 'email', value: e['E-Mail'] || '', placeholder: 'leer = Skript-Konto' })
    };
    felder['Serienbonus an'].value = /^(nein|n|false|0)$/i.test(e['Serienbonus an'] || 'ja') ? 'nein' : 'ja';
    felder['Nachholen erlaubt'].value = /^(ja|j|true|1)$/i.test(e['Nachholen erlaubt'] || 'ja') ? 'ja' : 'nein';
    const hilfe = {
      'Testdatum': 'Gilt nur für den Testzugang. Leer = echtes Datum.',
      'Serienbonus': 'Punkte pro Los, sobald die Serie lang genug ist.',
      'Jackpot ab': 'Ab so vielen Punkten aus einem Los zeigt das Terminal JACKPOT.',
      'Serienbonus ab': 'Ab so vielen Tagen in Folge.'
    };
    zeigen(el('div', { class: 'karte formular' },
      ...Object.keys(felder).map(k => el('label', {}, k, felder[k], hilfe[k] ? el('span', { class: 'leise' }, hilfe[k]) : null)),
      el('div', { class: 'knoepfe' },
        el('button', { class: 'knopf klein', onclick: () => {
          const werte = {};
          Object.keys(felder).forEach(k => { werte[k] = felder[k].value; });
          ausfuehren(() => api('admin_einstellungen', { werte }), 'Gespeichert.');
        } }, 'Speichern'),
        el('button', { class: 'knopf klein zweit', onclick: () => ausfuehren(() => api('admin_einstellungen', { werte: { 'Testdatum': '' } }), 'Testdatum entfernt.') }, 'Testdatum entfernen'))));
  }

  async function erzeugen() {
    const feld = el('textarea', { spellcheck: 'false' });
    const ergebnis = el('div');
    const ueber = el('input', { type: 'checkbox' });
    zeigen(
      el('p', { class: 'leise' }, 'Konfiguration als JSON (Aufbau: beispiel-konfiguration.json und Kommentar in gas/Generator.gs). ',
        'Sie wird nur im Sheet gespeichert, nicht im Repo. Neu erzeugen vergibt neue Codes: Gedruckte Lose werden ungültig, Testdaten werden gelöscht.'),
      feld,
      el('div', { class: 'knoepfe', style: 'margin:10px 0' },
        el('button', { class: 'knopf klein zweit', onclick: () => pruefen(true) }, 'Prüfen'),
        el('button', { class: 'knopf klein', onclick: () => {
          if (confirm('Lose jetzt neu erzeugen? Alle Codes ändern sich.')) pruefen(false);
        } }, 'Erzeugen'),
        el('label', { class: 'leise', style: 'display:flex;gap:6px;align-items:center' }, ueber, 'trotzdem überschreiben, wenn schon gespielt'),
        el('button', { class: 'knopf klein zweit', onclick: async () => {
          const r = await fetch('beispiel-konfiguration.json'); feld.value = await r.text();
        } }, 'Beispiel laden')),
      ergebnis);
    try {
      const k = await api('admin_konfiguration');
      if (k.konfiguration) feld.value = k.konfiguration;
    } catch (e) { /* leer lassen */ }

    async function pruefen(nur) {
      ergebnis.textContent = '';
      ergebnis.append(el('div', { class: 'laden' }, nur ? 'Prüfe …' : 'Erzeuge …'));
      try {
        const r = await api('admin_generieren', { konfiguration: feld.value, nurPruefen: nur, ueberschreiben: ueber.checked }, { zeit: 120 });
        ergebnis.textContent = '';
        const u = r.uebersicht;
        ergebnis.append(
          el('div', { class: 'meldung gut' }, nur ? 'Konfiguration in Ordnung.' : r.lose + ' Lose mit ' + r.felder + ' Feldern erzeugt. Jetzt neu drucken.'),
          el('p', {}, 'Summe aller Lose bei Pech: ', el('strong', {}, zahl(u.summe.minimal)), ' Punkte, bei Glück: ',
            el('strong', {}, zahl(u.summe.maximal)), ' Punkte (ohne Serienbonus). Sofortgewinne: ', String(u.summe.sofortgewinne), '.'),
          tabelle(['Tag', 'Datum', 'Typ', 'Felder', 'min', 'max'], u.lose.map(l => el('tr', {},
            el('td', { class: 'z' }, l.tag), el('td', {}, datum(l.datum)), el('td', {}, l.typ + ' · ' + l.felderzahl),
            el('td', { class: 'effekte' }, l.felder.join('  ')), el('td', { class: 'z' }, l.minimal), el('td', { class: 'z' }, l.maximal)))));
        if (!nur) laden();
      } catch (e) {
        ergebnis.textContent = '';
        ergebnis.append(el('div', { class: 'meldung fehler' }, el('pre', { class: 'fehlerliste' }, e.message)));
      }
    }
  }

  // ---------------------------------------------------------------- Ware verwalten
  async function ware() {
    zeigen(el('div', { class: 'laden' }, 'Lade Ware …'));
    let r;
    try { r = await api('admin_ware'); } catch (e) { zeigen(el('div', { class: 'meldung fehler' }, e.message)); return; }
    const liste = el('div', { class: 'ware-liste' });
    r.ware.forEach(w => {
      const bild = el('div', { class: 'ware-mini' + (w.zustand === 'eingeschweisst' ? ' folie' : '') });
      bild.innerHTML = Ware.svg(w.illustration);
      liste.append(el('div', { class: 'karte ware-zeile' }, bild,
        el('div', { class: 'ware-info' },
          el('strong', {}, w.id + ' · ' + w.titel),
          el('div', { class: 'leise' }, zahl(w.preis) + ' Pkt · ' + w.zustand + (w.ab ? ' · ab ' + datum(w.ab) : '') + (w.bis ? ' · Aktion bis ' + datum(w.bis) : '') +
            (w.bestand != null ? ' · Bestand ' + w.bestand : '')),
          el('div', { class: 'leise' }, 'verkauft: ' + w.verkauftEcht + (w.verkauftTest ? ' (Test ' + w.verkauftTest + ')' : '') + (w.gehoertIhr ? ' · gehört ihr' : ''))),
        el('button', { class: 'knopf klein zweit', onclick: () => formular(w) }, 'Bearbeiten')));
    });
    zeigen(el('div', { class: 'knoepfe', style: 'margin-bottom:14px' },
      el('button', { class: 'knopf klein', onclick: () => formular({ zustand: 'sichtbar', illustration: 'paket', inhaltArt: 'text' }) }, 'Neue Ware')),
      el('p', { class: 'leise' }, 'Zustand «versteckt»: nur als Sofortgewinn, erscheint erst im Regal, wenn sie es gewonnen hat. Die ID (z. B. W90) steht in der Los-Konfiguration als S:W90.'),
      liste);
  }

  function formular(w) {
    const f = {};
    const feld = (name, input, hilfe) => { f[name] = input; return el('label', {}, name, input, hilfe ? el('span', { class: 'leise' }, hilfe) : null); };
    const sel = (wert, optionen) => { const s = el('select', {}, ...optionen.map(o => el('option', { value: o }, o))); s.value = wert || optionen[0]; return s; };
    const vorschau = el('div', { class: 'ware-gross' });
    const illu = sel(w.illustration, Ware.namen());
    const zeichnen = () => { vorschau.innerHTML = Ware.svg(illu.value); };
    illu.addEventListener('change', zeichnen);
    zeichnen();
    zeigen(el('div', { class: 'karte formular' },
      el('h2', {}, w.id ? 'Ware ' + w.id + ' bearbeiten' : 'Neue Ware'),
      vorschau,
      feld('Titel', el('input', { type: 'text', value: w.titel || '' })),
      feld('Beschreibung', el('textarea', { rows: '2', class: 'kurz' }, w.beschreibung || '')),
      feld('Illustration', illu),
      feld('Preis', el('input', { type: 'number', min: '0', step: '1', value: w.preis != null ? w.preis : '' }), 'in Punkten; Sofortgewinne: 0'),
      feld('Zustand', sel(w.zustand, ['sichtbar', 'eingeschweisst', 'ausverkauft', 'versteckt'])),
      feld('Sichtbar ab', el('input', { type: 'date', value: w.ab || '' }), 'leer = sofort'),
      feld('Aktion bis', el('input', { type: 'date', value: w.bis || '' }), 'Stern «AKTION!»; danach verschwindet die Ware'),
      feld('Bestand', el('input', { type: 'number', min: '0', step: '1', value: w.bestand != null ? w.bestand : '' }), 'leer = unbegrenzt'),
      feld('Inhalt-Art', sel(w.inhaltArt, ['text', 'code', 'link', 'bild'])),
      feld('Inhalt', el('textarea', { rows: '3', class: 'kurz' }, w.inhalt || ''), 'was sie nach dem Kauf sieht; bei «bild» ein Drive-Link'),
      el('div', { class: 'knoepfe' },
        el('button', { class: 'knopf klein', onclick: async () => {
          const daten2 = { id: w.id, titel: f['Titel'].value, beschreibung: f['Beschreibung'].value, illustration: f['Illustration'].value,
            preis: f['Preis'].value, zustand: f['Zustand'].value, ab: f['Sichtbar ab'].value, bis: f['Aktion bis'].value,
            bestand: f['Bestand'].value, inhaltArt: f['Inhalt-Art'].value, inhalt: f['Inhalt'].value };
          try { await api('admin_ware_speichern', { ware: daten2 }); meldung('Gespeichert.', 'gut'); ware(); }
          catch (e) { meldung(e.message, 'fehler'); }
        } }, 'Speichern'),
        el('button', { class: 'knopf klein zweit', onclick: ware }, 'Abbrechen'),
        w.id ? el('button', { class: 'knopf klein zweit', onclick: async () => {
          if (!confirm('«' + w.titel + '» löschen?')) return;
          try { await api('admin_ware_loeschen', { id: w.id }); meldung('Gelöscht.', 'gut'); ware(); }
          catch (e) { meldung(e.message, 'fehler'); }
        } }, 'Löschen') : null)));
  }

  const REITER = { uebersicht, einsendungen, bestellungen, punkte, ware, lose, einstellungen, erzeugen };

  function anzeigen() {
    document.querySelectorAll('#reiter button').forEach(b => b.classList.toggle('aktiv', b.dataset.reiter === reiter));
    document.querySelectorAll('#modus button').forEach(b => b.classList.toggle('aktiv', b.dataset.modus === modus));
    const band = $('testband');
    band.hidden = modus !== 'test';
    if (daten) band.textContent = 'Testzugang · Spieldatum ' + datum(daten.heuteTest);
    if (daten || reiter === 'erzeugen' || reiter === 'lose' || reiter === 'ware') REITER[reiter]();
  }

  async function laden() {
    try { daten = await api('admin_uebersicht'); }
    catch (e) { meldung(e.message, 'fehler'); daten = null; }
    anzeigen();
  }

  async function start() {
    await Advent.theme();
    $('name').textContent = Advent.THEME.name || '';
    if (!Advent.token('admin')) { meldung('Bitte die Seite einmal über den Admin-Link mit ?t=… öffnen.', 'fehler'); return; }
    $('reiter').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      reiter = b.dataset.reiter; sessionStorage.setItem('advent.admin.reiter', reiter); meldung(''); anzeigen();
    });
    $('modus').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      modus = b.dataset.modus; sessionStorage.setItem('advent.admin.modus', modus); meldung(''); laden();
    });
    laden();
  }

  start();
})();
