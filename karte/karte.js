// Visitenkarte als Bon.
// 1. Rhein in Basel holen (BAFU über api.existenz.ch) und in den HTML-Satz schreiben.
// 2. Den HTML-Satz Punkt für Punkt nachdrucken: Text, Linien und Sterne werden auf eine
//    kleine Leinwand gesetzt (ein Pixel = ein Druckpunkt), schwarz-weiss gerastert und dann
//    als runde Punkte gezeichnet, so wie ein Thermodrucker sie aufs Papier brennt.
// Der HTML-Satz bleibt die Wahrheit: er bestimmt die Lage, bleibt anklickbar und markierbar.
(() => {
  'use strict';
  const root = document.documentElement;
  const LANG = root.lang === 'fr' ? 'fr' : 'de';
  const TZ = 'Europe/Zurich';
  const SCHWELLE = 170;          // wie die Bon-Apps: dunkler als etwa 67 % Grau wird schwarz
  const PUNKTE = 576;            // Druckpunkte über die volle Papierbreite: 72 mm bei 203 dpi

  const bon = document.getElementById('bon');
  const satz = bon.querySelector('.satz');
  const leinwand = bon.querySelector('.druck');

  // ------------------------------------------------------------ Rhein
  // 2613 Weil, Palmrainbrücke: Temperatur · 2289 Basel, Rheinhalle: Abfluss · 2091 Rheinfelden: Ersatz
  const ST = { temp: '2613', abfluss: '2289', ersatz: '2091' };

  // 13,3 und 1’050 wie in der Schweiz üblich, in beiden Sprachen
  const zahl = (x, n) => x.toFixed(n).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const zeit = s => {
    const d = new Date(s * 1000);
    const p = Object.fromEntries(new Intl.DateTimeFormat('de-CH', {
      timeZone: TZ, day: 'numeric', month: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(t => [t.type, t.value]));
    const heute = d.toLocaleDateString('sv-SE', { timeZone: TZ }) === new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
    const uhr = LANG === 'fr' ? `${+p.hour} h ${p.minute}` : `${+p.hour}.${p.minute}`;
    return heute ? uhr : `${p.day}.${p.month}. ${uhr}`;
  };

  async function rhein() {
    const url = 'https://api.existenz.ch/apiv1/hydro/latest?' + new URLSearchParams({
      locations: Object.values(ST).join(','), parameters: 'temperature,flow', app: 'simoschlumpf.ch',
    });
    const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout?.(6000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const w = (loc, par) => d.payload.find(x => x.loc === loc && x.par === par && typeof x.val === 'number');
    const t = w(ST.temp, 'temperature') || w(ST.ersatz, 'temperature');
    const q = w(ST.abfluss, 'flow') || w(ST.ersatz, 'flow');
    if (!t && !q) throw new Error('keine Messung');

    const box = document.getElementById('rhein');
    if (t) document.getElementById('rtemp').textContent = zahl(t.val, 1) + ' °C';
    if (q) document.getElementById('rq').textContent = zahl(q.val, 0) + ' m³/s';
    document.getElementById('rtemp').parentElement.hidden = !t;
    document.getElementById('rq').parentElement.hidden = !q;
    const neu = Math.max(t?.timestamp || 0, q?.timestamp || 0);
    const z = document.getElementById('rzeit');
    z.textContent = zeit(neu);
    z.dateTime = new Date(neu * 1000).toISOString();
    box.hidden = false;
    if (new URLSearchParams(location.search).get('hg') === 'd') box.querySelector('.landkarte').hidden = false;
  }

  // ------------------------------------------------------------ Drucken
  const fuer = (el, fn) => el.querySelectorAll('*').forEach(e => e.closest('[hidden]') || fn(e));
  const istSchwarz = c => /^rgba?\(0, 0, 0(, 1)?\)$/.test(c);

  function setzen() {
    const B = bon.getBoundingClientRect();
    const W = B.width, H = B.height;
    if (!W || !H) return null;
    // Nie feiner als ein Bildschirmpixel, sonst verschwinden Punkte
    const w = Math.min(PUNKTE, Math.floor(W * Math.min(window.devicePixelRatio || 1, 3)));
    const p = W / w;                              // CSS-Pixel pro Druckpunkt
    const h = Math.ceil(H / p);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.scale(1 / p, 1 / p);
    const lage = r => ({ x: r.left - B.left, y: r.top - B.top, w: r.width, h: r.height });

    // Flächen (schwarze Knöpfe), Linien, Sterne
    fuer(satz, el => {
      const s = getComputedStyle(el);
      if (istSchwarz(s.backgroundColor)) {
        const r = lage(el.getBoundingClientRect());
        ctx.fillStyle = '#000'; ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      if (el.tagName === 'HR') {
        const r = lage(el.getBoundingClientRect());
        const strich = 8 * p, luecke = 6 * p;     // Strich 8, Lücke 6, Dicke 3 Punkte
        ctx.fillStyle = '#000';
        for (let x = 0; x < r.w; x += strich + luecke) ctx.fillRect(r.x + x, r.y, Math.min(strich, r.w - x), 3 * p);
      }
      if (el.tagName === 'svg' && el.closest('.sterne')) {
        const r = lage(el.getBoundingClientRect());
        const vb = el.viewBox.baseVal;
        ctx.save();
        ctx.translate(r.x, r.y); ctx.scale(r.w / vb.width, r.h / vb.height); ctx.translate(-vb.x, -vb.y);
        ctx.fillStyle = '#000'; ctx.fill(new Path2D(el.querySelector('path').getAttribute('d')));
        ctx.restore();
      }
    });

    // Landkarte des Oberrheins (Entwurf ?hg=d); Flächen grau, werden unten im Bayer-Raster gedruckt
    const karten = [];
    fuer(satz, el => { if (el.classList.contains('landkarte') && window.OBERRHEIN) karten.push(lage(el.getBoundingClientRect())); });
    karten.forEach(r => landkarte(ctx, r));

    // Text: jeder Textknoten an seiner Stelle im HTML-Satz
    const gang = document.createTreeWalker(satz, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n; (n = gang.nextNode());) {
      if (!n.nodeValue.trim() || n.parentElement.closest('[hidden]')) continue;
      const el = n.parentElement, s = getComputedStyle(el);
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter(r => r.width);
      if (!rects.length) continue;
      let text = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (s.textTransform === 'uppercase') text = text.toUpperCase();
      ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      ctx.fillStyle = el.closest('.knopf') ? '#fff' : '#000';
      ctx.textBaseline = 'alphabetic';
      const m = ctx.measureText('Hg');
      const asc = m.fontBoundingBoxAscent ?? parseFloat(s.fontSize) * .78;
      const desc = m.fontBoundingBoxDescent ?? parseFloat(s.fontSize) * .22;
      const r = lage(rects[0]);
      // Ganze Breite des Knotens nehmen; führende Leerzeichen verschieben den Anfang
      const vorne = n.nodeValue.match(/^\s*/)[0].length ? ctx.measureText(' ').width : 0;
      const y = r.y + (r.h - asc - desc) / 2 + asc;
      const sperr = parseFloat(s.letterSpacing) || 0;
      if (!sperr) ctx.fillText(text, r.x + vorne, y);
      else {                                      // Zeichen für Zeichen: ctx.letterSpacing kann nicht jedes Safari
        let x = r.x + vorne;
        for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + sperr; }
      }
    }

    // Rastern: ein Bit pro Druckpunkt; in der Landkarte geordnet gerastert, damit Grautöne als Punktdichte erscheinen
    const px = ctx.getImageData(0, 0, w, h).data;
    const bits = new Uint8Array(w * h);
    const inKarte = (x, y) => karten.some(r => x * p >= r.x && x * p < r.x + r.w && y * p >= r.y && y * p < r.y + r.h);
    for (let i = 0; i < w * h; i++) {
      const k = i * 4, x = i % w, y = (i / w) | 0;
      const l = 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2];
      const sw = inKarte(x, y) ? BAYER[(y & 3) * 4 + (x & 3)] * 255 : SCHWELLE;
      bits[i] = l < sw ? 1 : 0;
    }
    return { w, h, p, W, H, bits };
  }

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(x => (x + .5) / 16);
  const STERN = 'M0,-1L.2245,-.309L.951,-.309L.363,.118L.588,.809L0,.382L-.588,.809L-.363,.118L-.951,-.309L-.2245,-.309Z';
  const LINKS = new Set(['Basel', 'Strasbourg', 'Haguenau', 'Colmar', 'Mulhouse', 'Sélestat']);
  const ORTE = new Set(['Basel', 'Strasbourg', 'Freiburg', 'Mulhouse', 'Colmar', 'Karlsruhe']);

  function landkarte(ctx, r) {
    const D = window.OBERRHEIN;
    const lat0 = 48.25, k = Math.cos(lat0 * Math.PI / 180);
    const s = r.h / 1.72, lonC = 7.95;
    const px = ([lon, lat]) => [r.x + r.w / 2 + (lon - lonC) * k * s, r.y + r.h / 2 - (lat - lat0) * s];
    const pfad = l => { ctx.beginPath(); l.forEach((q, i) => { const [a, b] = px(q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); };
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.lineCap = ctx.lineJoin = 'round';
    // Länder als Grautöne: Schweiz dunkel, Frankreich mittel, Deutschland hell
    for (const [a, g] of [['FRA', '#e6e6e6'], ['DEU', '#f3f3f3'], ['CHE', '#c8c8c8']]) {
      ctx.fillStyle = g; ctx.beginPath();
      (D.land[a] || []).forEach(ring => ring.forEach((q, i) => { const [x, y] = px(q); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }));
      ctx.fill();
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = .8; ctx.setLineDash([1.5, 2.5]); D.grenzen.forEach(l => { pfad(l); ctx.stroke(); }); ctx.setLineDash([]);
    ctx.lineWidth = 1; D.fluesse.forEach(l => { pfad(l); ctx.stroke(); });
    ctx.lineWidth = 3.2; D.rhein.forEach(l => { pfad(l); ctx.stroke(); });
    // Sternenkreis um Strasbourg
    const [sx, sy] = px([7.752, 48.573]), R = r.h * .085, st = new Path2D(STERN);
    ctx.fillStyle = '#000';
    for (let i = 0; i < 12; i++) {
      const w = i / 12 * 2 * Math.PI; ctx.save(); ctx.translate(sx + R * Math.sin(w), sy - R * Math.cos(w)); ctx.scale(3.6, 3.6); ctx.fill(st); ctx.restore();
    }
    // Orte
    ctx.font = '700 10px Plex, sans-serif'; ctx.textBaseline = 'middle';
    D.orte.filter(o => ORTE.has(o.n)).forEach(o => {
      const [a, b] = px(o.p), t = o.n.toUpperCase();
      if (o.n === 'Basel') { ctx.beginPath(); ctx.arc(a, b, 5, 0, 2 * Math.PI); ctx.lineWidth = 2; ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#000'; ctx.fillRect(a - 1.8, b - 1.8, 3.6, 3.6);
      const breit = [...t].reduce((n, ch) => n + ctx.measureText(ch).width + 1.2, 0);
      let x = LINKS.has(o.n) ? a - 9 - breit : a + 9;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, b - 7, breit + 5, 14);
      ctx.fillStyle = '#000'; for (const ch of t) { ctx.fillText(ch, x, b); x += ctx.measureText(ch).width + 1.2; }
    });
    ctx.restore();
  }

  let laeuft = 0;
  function zeichnen(b, langsam) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    leinwand.width = Math.round(b.W * dpr);
    leinwand.height = Math.round(b.H * dpr);
    const ctx = leinwand.getContext('2d');
    const s = b.p * dpr;                          // Gerätepixel pro Druckpunkt
    const rund = s >= 1.5;                        // auf scharfen Bildschirmen runde Punkte, sonst Quadrate
    const rad = s * 0.5 * 1.18;                   // leicht überlappend: Flächen satt, Kanten perlig wie beim Thermodruck
    ctx.fillStyle = '#000';

    const reihen = (von, bis) => {
      const pfad = new Path2D();
      for (let y = von; y < bis; y++) {
        const o = y * b.w, cy = (y + .5) * s;
        for (let x = 0; x < b.w; x++) {
          if (!b.bits[o + x]) continue;
          if (rund) { const cx = (x + .5) * s; pfad.moveTo(cx + rad, cy); pfad.arc(cx, cy, rad, 0, 2 * Math.PI); }
          else {                                  // Quadrate auf ganze Bildschirmpixel, sonst bleiben Haarfugen
            const x0 = Math.floor(x * s), y0 = Math.floor(y * s);
            pfad.rect(x0, y0, Math.floor((x + 1) * s) - x0, Math.floor((y + 1) * s) - y0);
          }
        }
      }
      ctx.fill(pfad);
    };

    const id = ++laeuft;
    if (!langsam) { reihen(0, b.h); return; }
    // Wie aus dem Drucker: Zeile um Zeile von oben nach unten
    const dauer = Math.min(900, b.h * 1.6), t0 = performance.now();
    let fertig = 0;
    const schritt = t => {
      if (id !== laeuft) return;
      const bis = Math.min(b.h, Math.ceil(b.h * Math.min(1, (t - t0) / dauer)));
      if (bis > fertig) { reihen(fertig, bis); fertig = bis; }
      if (fertig < b.h) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  let breite = 0, hoehe = 0;
  function drucken(langsam = false) {
    const b = setzen();
    if (!b) return;
    breite = b.W; hoehe = b.H;
    zeichnen(b, langsam);
    root.classList.add('gedruckt');
  }

  // Zeitstempel unten wie auf einem Kassenbon
  const jetzt = new Date();
  const fuss = document.getElementById('stempel');
  if (fuss) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('de-CH', {
      timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(jetzt).map(t => [t.type, t.value]));
    fuss.textContent = `${p.day}.${p.month}.${p.year} ${p.hour}.${p.minute}`;
  }

  const schrift = Promise.all(['500 15px Plex', '700 15px Plex'].map(f => document.fonts.load(f))).catch(() => {});
  const daten = rhein().catch(() => {});
  const warten = ms => new Promise(r => setTimeout(r, ms));
  const leise = matchMedia('(prefers-reduced-motion: reduce)').matches;

  (async () => {
    await schrift;
    await Promise.race([daten, warten(1200)]);   // kurz auf den Rhein warten, dann drucken
    try { drucken(!leise); } catch (e) { root.classList.remove('js'); throw e; }
    // Neu drucken, ohne Animation, wenn sich das Papier ändert (Fenster, Schrift, Rhein kommt später)
    new ResizeObserver(() => {
      const r = bon.getBoundingClientRect();
      if (Math.abs(r.width - breite) > .5 || Math.abs(r.height - hoehe) > .5) drucken(false);
    }).observe(bon);
    matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener?.('change', () => drucken(false));
  })();
})();
