// ENTWURF: Hintergrund aus Punkten, Variante über ?hg=a|b|c
//   a  Karte: Oberrheinraum in grauen Punkten, Rhein satt, 12 Sterne um Strasbourg
//   b  Flagge: blaues Punktfeld mit dem Sternenkreis, darin der Rhein hell ausgespart
//   c  Karte blau-gold: Länder als blaue Rastertöne, Rhein dunkelblau, Sterne gold um Strasbourg
(() => {
  'use strict';
  const D = window.OBERRHEIN;
  const v = new URLSearchParams(location.search).get('hg');
  if (!['a', 'b', 'c'].includes(v) || !D) return;   // ohne Wahl: kein Hintergrund

  const BLAU = '#003399', GOLD = '#ffcc00';
  const STERN = new Path2D('M0,-1L.2245,-.309L.951,-.309L.363,.118L.588,.809L0,.382L-.588,.809L-.363,.118L-.951,-.309L-.2245,-.309Z');
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(x => (x + .5) / 16);

  const LINKS = new Set(['Basel', 'Strasbourg', 'Haguenau', 'Colmar', 'Mulhouse', 'Sélestat']);
  const cv = document.createElement('canvas');
  cv.className = 'hintergrund'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);

  function malen() {
    const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 3);
    const P = W < 600 ? 5 : 6;                        // Rasterweite in CSS-Pixeln
    const cols = Math.ceil(W / P), rows = Math.ceil(H / P);

    // Projektion: Basel bis Karlsruhe passt in die Höhe, Rhein links neben dem Bon
    const lat0 = 48.28, k = Math.cos(lat0 * Math.PI / 180);
    const s = Math.min(H / 1.95, W / 1.5);            // Pixel pro Breitengrad
    // Auf breiten Bildschirmen liegt der Oberrhein in der freien Fläche links vom Bon
    const xRhein = W > 900 ? (W / 2 - 190) * .55 : W / 2;
    const lonC = 7.75 + (W / 2 - xRhein) / (k * s);
    const px = ([lon, lat]) => [W / 2 + (lon - lonC) * k * s, H / 2 - (lat - lat0) * s];
    const sb = px([7.752, 48.573]);
    const mess = document.createElement('canvas').getContext('2d'); mess.font = '700 11px Plex, sans-serif';
    const ORTE = new Set(['Basel', 'Strasbourg', 'Freiburg', 'Mulhouse', 'Colmar', 'Karlsruhe', 'Zürich']);
    const schilder = v === 'b' ? [] : D.orte.filter(o => ORTE.has(o.n)).map(o => {
      const t = o.n.toUpperCase(), [a, b] = px(o.p);
      const breit = [...t].reduce((n, ch) => n + mess.measureText(ch).width + 1.4, 0);
      const x0 = LINKS.has(o.n) ? a - 2 * P - breit : a + 2 * P;
      return { t, x0, y: b, box: [x0 - 4, b - 9, x0 + breit + 4, b + 9] };
    });
    const frei = (x, y) => schilder.some(({ box: [a, b, c, d] }) => x >= a && x <= c && y >= b && y <= d);

    // Ebenen: jede wird auf eine kleine Leinwand im Raster gemalt, Deckung = Alpha
    const ebene = mal => {
      const c = document.createElement('canvas'); c.width = cols; c.height = rows;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.scale(1 / P, 1 / P); x.lineCap = x.lineJoin = 'round'; x.fillStyle = x.strokeStyle = '#000';
      mal(x);
      return x.getImageData(0, 0, cols, rows).data;
    };
    const linie = (x, l) => { x.beginPath(); l.forEach((p, i) => { const [a, b] = px(p); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.stroke(); };
    const flaeche = (x, rings) => { x.beginPath(); rings.forEach(r => r.forEach((p, i) => { const [a, b] = px(p); i ? x.lineTo(a, b) : x.moveTo(a, b); })); x.fill(); };
    const kreis = (x, cx, cy, r, gr) => { for (let i = 0; i < 12; i++) { const w = i / 12 * 2 * Math.PI; x.save(); x.translate(cx + r * Math.sin(w), cy - r * Math.cos(w)); x.scale(gr, gr); x.fill(STERN); x.restore(); } };

    const L = [];   // { d, farbe, ton (0..1), gross (Anteil der Rasterweite) } — oben zuerst
    const R = Math.min(W, H) * (v === 'b' ? .36 : .13);
    if (v === 'a') {
      L.push({ d: ebene(x => { x.lineWidth = P * 1.6; D.rhein.forEach(l => linie(x, l)); }), farbe: '#8d8a83', ton: 1, gross: .8 });
      L.push({ d: ebene(x => { x.lineWidth = P * .9; D.fluesse.forEach(l => linie(x, l)); }), farbe: '#a9a69f', ton: 1, gross: .55 });
      L.push({ d: ebene(x => D.orte.filter(o => o.n !== 'Haguenau' && o.n !== 'Offenburg' && o.n !== 'Sélestat' && o.n !== 'Lörrach').forEach(o => { const [a, b] = px(o.p); x.fillRect(a - P, b - P, 2 * P, 2 * P); })), farbe: '#8d8a83', ton: 1, gross: .8 });
      L.push({ d: ebene(x => { x.lineWidth = P * .7; x.setLineDash([P * 1, P * 2]); D.grenzen.forEach(l => linie(x, l)); }), farbe: '#a9a69f', ton: 1, gross: .5 });
      L.push({ d: ebene(x => flaeche(x, D.land.FRA || [])), farbe: '#cfccc5', ton: .5, gross: .45 });
      L.push({ d: ebene(x => flaeche(x, D.land.CHE || [])), farbe: '#cfccc5', ton: 1, gross: .45 });
      L.push({ d: ebene(x => flaeche(x, D.land.DEU || [])), farbe: '#cfccc5', ton: .25, gross: .45 });
    } else if (v === 'b') {
      const fc = [W / 2, H / 2];
      L.push({ d: ebene(x => kreis(x, fc[0], fc[1], R, Math.min(W, H) * .045)), farbe: GOLD, ton: 1, gross: .85 });
      L.push({ d: ebene(x => { x.lineWidth = P * 1.8; D.rhein.forEach(l => linie(x, l)); }), farbe: '#4d6fc0', ton: 1, gross: .55 });
      L.push({ d: ebene(x => { x.fillRect(0, 0, W, H); }), farbe: BLAU, ton: 1, gross: .55 });
    } else {
      L.push({ d: ebene(x => { x.lineWidth = P * 1.6; D.rhein.forEach(l => linie(x, l)); }), farbe: BLAU, ton: 1, gross: .8 });
      L.push({ d: ebene(x => { x.lineWidth = P * .9; D.fluesse.forEach(l => linie(x, l)); }), farbe: BLAU, ton: 1, gross: .5 });
      L.push({ d: ebene(x => D.orte.filter(o => o.n !== 'Haguenau' && o.n !== 'Offenburg' && o.n !== 'Sélestat' && o.n !== 'Lörrach').forEach(o => { const [a, b] = px(o.p); x.fillRect(a - P, b - P, 2 * P, 2 * P); })), farbe: BLAU, ton: 1, gross: .8 });
      L.push({ d: ebene(x => flaeche(x, D.land.FRA || [])), farbe: '#7d93cc', ton: .5, gross: .42 });
      L.push({ d: ebene(x => flaeche(x, D.land.CHE || [])), farbe: '#7d93cc', ton: 1, gross: .42 });
      L.push({ d: ebene(x => flaeche(x, D.land.DEU || [])), farbe: '#7d93cc', ton: .25, gross: .42 });
    }

    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    const pfade = new Map();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4, b = BAYER[(y & 3) * 4 + (x & 3)];
      if (frei((x + .5) * P, (y + .5) * P)) continue;
      for (const e of L) {
        if (e.d[i + 3] < 128) continue;
        if (b > e.ton) break;                         // Rasterton: Zelle bleibt leer
        const key = e.farbe + e.gross;
        let p = pfade.get(key); if (!p) pfade.set(key, p = { farbe: e.farbe, r: P * dpr * e.gross / 2, pfad: new Path2D() });
        const cx = (x + .5) * P * dpr, cy = (y + .5) * P * dpr;
        p.pfad.moveTo(cx + p.r, cy); p.pfad.arc(cx, cy, p.r, 0, 2 * Math.PI);
        break;
      }
    }
    for (const p of pfade.values()) { ctx.fillStyle = p.farbe; ctx.fill(p.pfad); }

    // Ortsnamen fein gepunktet wie auf dem Bon
    if (v !== 'b') {
      const f = 1.25, fw = Math.ceil(W / f), fh = Math.ceil(H / f);
      const c = document.createElement('canvas'); c.width = fw; c.height = fh;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.scale(1 / f, 1 / f); x.font = '700 11px Plex, sans-serif'; x.textBaseline = 'middle';
      x.save(); x.fillStyle = '#f00';
      kreis(x, sb[0], sb[1], R, 9); x.restore();
      schilder.forEach(({ t, x0, y }) => { let xx = x0; for (const ch of t) { x.fillText(ch, xx, y); xx += x.measureText(ch).width + 1.4; } });
      // Rot markiert die Sterne, Schwarz die Schrift
      const d = x.getImageData(0, 0, fw, fh).data, pf = new Path2D(), ps = new Path2D(), r = f * dpr * .58;
      for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) {
        const i = (yy * fw + xx) * 4; if (d[i + 3] < 110) continue;
        const cx = (xx + .5) * f * dpr, cy = (yy + .5) * f * dpr, p = d[i] > 128 ? ps : pf;
        p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, 2 * Math.PI);
      }
      ctx.fillStyle = v === 'c' ? BLAU : '#7a776f'; ctx.fill(pf);
      ctx.fillStyle = v === 'c' ? GOLD : '#7a776f'; ctx.fill(ps);
    }
  }

  (document.fonts ? document.fonts.load('700 11px Plex') : Promise.resolve()).finally(malen);
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(malen, 120); });
})();
