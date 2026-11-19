// klang.js – leise Geräusche, im Browser erzeugt (keine Tondateien). Standardmässig aus.
//   Klang.spielen('klick' | 'tipp' | 'gewinn' | 'jackpot' | 'niete' | 'kasse' | 'fehler')
//   Klang.an  (true/false), Klang.umschalten()
(function () {
  'use strict';
  const SCHLUESSEL = 'simoil.ton';
  let ctx = null;
  let an = false;
  try { an = localStorage.getItem(SCHLUESSEL) === 'an'; } catch (e) { /* bleibt aus */ }

  function audio() {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Ein kurzer Ton: Frequenz, Start (s), Dauer (s), Wellenform, Lautstärke. */
  function ton(f, start, dauer, form, laut) {
    const a = audio();
    if (!a) return;
    const t0 = a.currentTime + start;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = form || 'square';
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(laut || 0.06, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dauer + 0.02);
  }

  const MUSTER = {
    klick: () => ton(880, 0, 0.04, 'square', 0.035),
    tipp: () => ton(1320, 0, 0.025, 'triangle', 0.05),
    gewinn: () => [660, 880, 1100, 1320].forEach((f, i) => ton(f, i * 0.08, 0.14, 'square', 0.045)),
    jackpot: () => [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => ton(f, i * 0.09, 0.18, 'square', 0.05)),
    niete: () => [392, 330, 262].forEach((f, i) => ton(f, i * 0.12, 0.18, 'triangle', 0.07)),
    kasse: () => { ton(1568, 0, 0.08, 'square', 0.04); ton(2093, 0.09, 0.25, 'triangle', 0.06); },
    fehler: () => { ton(196, 0, 0.12, 'sawtooth', 0.04); ton(185, 0.13, 0.18, 'sawtooth', 0.04); }
  };

  window.Klang = {
    get an() { return an; },
    spielen(name) { if (an && MUSTER[name]) { try { MUSTER[name](); } catch (e) { /* stumm */ } } },
    umschalten() {
      an = !an;
      try { localStorage.setItem(SCHLUESSEL, an ? 'an' : 'aus'); } catch (e) { /* egal */ }
      if (an) MUSTER.tipp();
      return an;
    }
  };
})();
