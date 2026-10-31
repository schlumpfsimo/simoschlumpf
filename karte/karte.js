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

    // Rastern: ein Bit pro Druckpunkt
    const px = ctx.getImageData(0, 0, w, h).data;
    const bits = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const k = i * 4;
      bits[i] = 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2] < SCHWELLE ? 1 : 0;
    }
    return { w, h, p, W, H, bits };
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
