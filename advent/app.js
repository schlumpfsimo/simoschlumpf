// app.js – Gerüst der Seite: drei Ansichten (Tankstelle, Terminal, Regal), Wechsel über die Adresse.
//   #/          Tankstelle (tankstelle.js)
//   #/terminal  Lotto-Terminal (terminal.js)
//   #/regal     Regal (regal.js)
(function () {
  'use strict';
  const { el, t } = Advent;
  const buehne = document.getElementById('buehne');

  const App = {
    ansichten: {},          // werden von tankstelle.js, terminal.js, regal.js eingetragen
    start: null,            // letzte Antwort von «start» (Kontostand, heutiges Los …)

    /** Daten für Tankstelle und Terminal. neu = true: sicher frisch vom Server holen. */
    async startDaten(neu) {
      if (!App.start || neu) App.start = await Advent.api('start');
      return App.start;
    },

    /** Ansicht anzeigen (ersetzt den ganzen Inhalt der Bühne). */
    zeigen(...knoten) {
      buehne.textContent = '';
      const a = el('div', { class: 'ansicht' });
      a.append(...knoten.filter(k => k != null && k !== false));
      buehne.append(a);
      window.scrollTo(0, 0);
      return a;
    },

    laden() {
      return App.zeigen(el('div', { class: 'laden-punkte', role: 'status' }, el('span', {}, '•'), el('span', {}, '•'), el('span', {}, '•')));
    },

    fehlerAnzeigen(e, nochmals) {
      Klang.spielen('fehler');
      App.zeigen(App.leiste({ zurueck: location.hash && location.hash !== '#/' }),
        el('div', { class: 'meldung fehler', role: 'alert' }, e.message || String(e)),
        nochmals ? el('div', { class: 'knopfreihe', style: 'margin-top:20px' },
          el('button', { class: 'pille', onclick: nochmals }, 'Nochmals versuchen')) : null);
    },

    /** Obere Leiste: links «Tankstelle» (zurück), rechts Ton an/aus. */
    leiste(opt) {
      opt = opt || {};
      const ton = el('button', { class: 'pille creme rund', 'aria-label': t('knopf.ton'), 'aria-pressed': String(Klang.an) });
      ton.innerHTML = Grafik.symbol(Klang.an ? 'ton-an' : 'ton-aus');
      ton.addEventListener('click', () => {
        const an = Klang.umschalten();
        ton.innerHTML = Grafik.symbol(an ? 'ton-an' : 'ton-aus');
        ton.setAttribute('aria-pressed', String(an));
      });
      const links = opt.zurueck
        ? el('a', { class: 'pille creme klein', href: '#/', onclick: () => Klang.spielen('klick') })
        : el('span');
      if (opt.zurueck) { links.innerHTML = Grafik.symbol('zurueck'); links.append(t('knopf.tankstelle')); }
      return el('div', { class: 'leiste' }, links, opt.mitte || null, ton);
    },

    /** Federnder Knopf mit Klick-Geräusch. */
    knopf(text, klasse, aktion, symbol) {
      const b = el(aktion && typeof aktion === 'string' ? 'a' : 'button', { class: 'pille ' + (klasse || '') });
      if (typeof aktion === 'string') b.setAttribute('href', aktion);
      if (symbol) b.insertAdjacentHTML('afterbegin', Grafik.symbol(symbol));
      b.append(text);
      b.addEventListener('click', ev => { Klang.spielen('klick'); if (typeof aktion === 'function') aktion(ev); });
      return b;
    },

    /** Simo nur einmal pro Situation und Tag ausführlich sprechen lassen, sonst als kleiner Knopf. */
    simoEinmal(situation, vars, schluessel) {
      const k = 'simoil.gesagt.' + (schluessel || situation) + '.' + (App.start ? App.start.heute : '');
      let schon = false;
      try { schon = sessionStorage.getItem(k) === '1'; sessionStorage.setItem(k, '1'); } catch (e) { /* egal */ }
      if (!schon) Simo.sagen(situation, vars);
    },

    route() {
      const name = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'tankstelle';
      const f = App.ansichten[name] || App.ansichten.tankstelle;
      f();
    },

    async starten() {
      await Advent.theme();
      document.title = Advent.THEME.name || 'SimOil';
      if (!Advent.token('spieler')) {
        App.zeigen(el('div', { class: 'meldung', style: 'margin-top:40px' }, t('fehler.kein_zugang')));
        return;
      }
      window.addEventListener('hashchange', App.route);
      App.route();
    }
  };

  window.App = App;
})();
