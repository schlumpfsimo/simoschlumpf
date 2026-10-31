// Startseite als Punkteraster über den ganzen Bildschirm.
// 1. Rhein in Basel holen (BAFU über api.existenz.ch) und in den HTML-Satz schreiben.
// 2. Karte des Oberrheins und den HTML-Satz auf eine Leinwand setzen, ein Pixel = ein Punkt:
//    Karte geordnet gerastert (Grautöne werden Punktdichte), Schrift mit fester Schwelle.
// 3. Die Punkte rund zeichnen und Zeile um Zeile von oben nach unten «drucken».
// Der HTML-Satz bleibt die Wahrheit: er bestimmt die Lage, bleibt anklickbar und markierbar.
(() => {
  'use strict';
  const root = document.documentElement;
  const LANG = root.lang === 'fr' ? 'fr' : 'de';
  const TZ = 'Europe/Zurich';
  const SCHWELLE = 170;                       // Schrift: dunkler als etwa 67 % Grau wird schwarz
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(x => (x + .5) / 16 * 255);
  const STERN = new Path2D('M0,-1L.2245,-.309L.951,-.309L.363,.118L.588,.809L0,.382L-.588,.809L-.363,.118L-.951,-.309L-.2245,-.309Z');

  const blatt = document.getElementById('blatt');
  const satz = blatt.querySelector('.satz');
  const leinwand = blatt.querySelector('.druck');

  // ------------------------------------------------------------ Rhein
  // 2613 Weil, Palmrainbrücke: Temperatur · 2289 Basel, Rheinhalle: Abfluss · 2091 Rheinfelden: Ersatz
  const ST = { temp: '2613', abfluss: '2289', ersatz: '2091' };
  const zahl = (x, n) => x.toFixed(n).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const tag = d => d.toLocaleDateString('sv-SE', { timeZone: TZ });
  const zeit = s => {
    const d = new Date(s * 1000);
    const p = Object.fromEntries(new Intl.DateTimeFormat('de-CH', {
      timeZone: TZ, day: 'numeric', month: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(t => [t.type, t.value]));
    const uhr = LANG === 'fr' ? `${+p.hour} h ${p.minute}` : `${+p.hour}.${p.minute}`;
    return tag(d) === tag(new Date()) ? uhr : `${p.day}.${p.month}. ${uhr}`;
  };
  let wasser = '';                            // für die Beschriftung von Basel auf der Karte

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

    const $ = id => document.getElementById(id);
    if (t) { $('rtemp').textContent = wasser = zahl(t.val, 1) + ' °C'; }
    if (q) $('rq').textContent = zahl(q.val, 0) + ' m³/s';
    for (const [id, da] of [['rtemp', t], ['rq', q]]) {
      $(id).hidden = !da; $(id).previousElementSibling.hidden = !da;
    }
    const neu = Math.max(t?.timestamp || 0, q?.timestamp || 0);
    $('rzeit').textContent = zeit(neu);
    $('rzeit').dateTime = new Date(neu * 1000).toISOString();
    $('rhein').hidden = false;
  }

  // ------------------------------------------------------------ Karte
  const ORTE = new Set(['Basel', 'Strasbourg', 'Freiburg', 'Mulhouse', 'Colmar', 'Karlsruhe', 'Zürich', 'Stuttgart', 'Mannheim', 'Nancy', 'Bern', 'Luzern', 'Belfort', 'Saarbrücken', 'Konstanz', 'Heidelberg']);
  const LINKS = new Set(['Basel', 'Strasbourg', 'Colmar', 'Mulhouse', 'Nancy', 'Belfort', 'Saarbrücken', 'Mannheim']);
  // Ländertöne als Punktdichte (Bayer 4×4): Frankreich 1/16, Schweiz 3/16, Deutschland und Rest leer
  const TON = { FRA: '#f2f2f2', CHE: '#dadada' };

  // Projektion. Quer: Basel bis Karlsruhe füllt die Höhe, der Rhein liegt rechts vom Text.
  // Hoch: Basel bis knapp über Strasbourg füllt den Raum unter dem Text.
  function projektion(W, H, inhalt) {
    const lat0 = 48.3, k = Math.cos(lat0 * Math.PI / 180), lonR = 7.95;
    if (W > H * 1.1) {
      const s = Math.max(H / 2.05, 300);
      const xRhein = Math.max(W * .62, inhalt.rechts + 260);
      return ([lon, lat]) => [xRhein + (lon - lonR) * k * s, H * .47 - (lat - lat0) * s];
    }
    const oben = inhalt.unten + 90, unten = H - 70;
    const s = Math.min(Math.max((unten - oben) / (48.573 - 47.558), 260), 900);
    return ([lon, lat]) => [W * .55 + (lon - lonR) * k * s, unten - (lat - 47.558) * s];
  }

  function karte(ctx, W, H, inhalt, schilder) {
    const D = window.OBERRHEIN;
    if (!D) return;
    const px = projektion(W, H, inhalt);
    const ring = r => r.forEach((q, i) => { const [a, b] = px(q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    const linie = l => { ctx.beginPath(); ring(l); ctx.stroke(); };
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const [a, polys] of Object.entries(D.land)) {
      if (!TON[a]) continue;
      ctx.fillStyle = TON[a]; ctx.beginPath(); polys.forEach(ring); ctx.fill();
    }
    ctx.fillStyle = '#a8a8a8'; ctx.beginPath(); D.seen.forEach(ring); ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1; ctx.setLineDash([2, 3]); D.grenzen.forEach(linie); ctx.setLineDash([]);
    ctx.lineWidth = 1.2; D.fluesse.forEach(linie);
    ctx.lineWidth = 4.5; D.rhein.forEach(linie);

    // Zwölf Sterne um Strasbourg
    const [sx, sy] = px([7.752, 48.573]);
    const R = Math.min(Math.max((px([7.752, 47.558])[1] - sy) * .13, 36), 90);   // Radius im Verhältnis zum Massstab
    ctx.fillStyle = '#000';
    for (let i = 0; i < 12; i++) {
      const w = i / 12 * 2 * Math.PI;
      ctx.save(); ctx.translate(sx + R * Math.sin(w), sy - R * Math.cos(w)); ctx.scale(6, 6); ctx.fill(STERN); ctx.restore();
    }

    // Orte: Punkt auf der Karte, Name kommt zur Schrift (scharf, mit Hof); Basel mit Ring und Wassertemperatur
    for (const o of D.orte) {
      if (!ORTE.has(o.n)) continue;
      const [a, b] = px(o.p);
      if (a < -50 || a > W + 50 || b < -20 || b > H + 20) continue;
      if (a < inhalt.rechts + 40 && b < inhalt.unten + 30) continue;   // keine Orte im Text
      const basel = o.n === 'Basel';
      schilder.push({ t: o.n.toUpperCase(), a, b, links: LINKS.has(o.n), gross: basel, zusatz: basel ? wasser : '' });
      if (basel) {
        ctx.beginPath(); ctx.arc(a, b, 8, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(a, b, 3, 0, 2 * Math.PI); ctx.fillStyle = '#000'; ctx.fill();
      } else { ctx.fillStyle = '#000'; ctx.fillRect(a - 2.5, b - 2.5, 5, 5); }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ Setzen
  const sichtbar = el => !el.closest('[hidden]');
  const istSchwarz = c => /^rgba?\(0, 0, 0(, 1)?\)$/.test(c);

  function setzen() {
    const B = blatt.getBoundingClientRect();
    const W = B.width, H = B.height;
    if (!W || !H) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const p = dpr >= 2 ? .75 : 1;              // CSS-Pixel pro Punkt: fein, aber auf dem Schirm noch rund
    const w = Math.ceil(W / p), h = Math.ceil(H / p);
    const lage = r => ({ x: r.left - B.left, y: r.top - B.top, w: r.width, h: r.height });
    const neu = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.scale(1 / p, 1 / p);
      return x;
    };

    const gang = document.createTreeWalker(satz, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const texte = [];
    for (let n; (n = gang.nextNode());) {
      if (!n.nodeValue.trim() || !sichtbar(n.parentElement)) continue;
      range.selectNodeContents(n);
      const rs = [...range.getClientRects()].filter(r => r.width);
      if (rs.length) texte.push({ n, r: lage(rs[0]) });
    }

    // Karte, geordnet gerastert
    const schilder = [];
    const k = neu();
    // Fläche des Inhalts: Ortsnamen und Sternenkreis halten Abstand davon
    const inhalt = { rechts: 0, unten: 0 };
    [...satz.children].forEach(el => {
      if (!sichtbar(el)) return;
      const r = lage(el.getBoundingClientRect());
      inhalt.rechts = Math.max(inhalt.rechts, r.x + r.w); inhalt.unten = Math.max(inhalt.unten, r.y + r.h);
    });
    karte(k, W, Math.min(H, Math.max(window.innerHeight, 480)), inhalt, schilder);
    const kd = k.getImageData(0, 0, w, h).data;

    // Schrift, Sterne und Knopf mit fester Schwelle
    const s = neu();
    satz.querySelectorAll('*').forEach(el => {
      if (!sichtbar(el)) return;
      if (istSchwarz(getComputedStyle(el).backgroundColor)) {
        const r = lage(el.getBoundingClientRect()); s.fillStyle = '#000'; s.fillRect(r.x, r.y, r.w, r.h);
      }
      if (el.tagName === 'svg' && el.closest('.sterne')) {
        const r = lage(el.getBoundingClientRect()), vb = el.viewBox.baseVal;
        s.save(); s.translate(r.x, r.y); s.scale(r.w / vb.width, r.h / vb.height); s.translate(-vb.x, -vb.y);
        s.fillStyle = '#000'; s.fill(STERN); s.restore();
      }
    });
    for (const { n, r } of texte) {
      const el = n.parentElement, st = getComputedStyle(el);
      let text = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (st.textTransform === 'uppercase') text = text.toUpperCase();
      s.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      s.fillStyle = el.closest('.knopf') ? '#fff' : '#000';
      s.textBaseline = 'alphabetic';
      const m = s.measureText('Hg');
      const asc = m.fontBoundingBoxAscent ?? parseFloat(st.fontSize) * .78;
      const desc = m.fontBoundingBoxDescent ?? parseFloat(st.fontSize) * .22;
      const vorne = /^\s/.test(n.nodeValue) ? s.measureText(' ').width : 0;
      const y = r.y + (r.h - asc - desc) / 2 + asc;
      const sperr = parseFloat(st.letterSpacing) || 0;
      if (!sperr) s.fillText(text, r.x + vorne, y);
      else {                                   // Zeichen für Zeichen: ctx.letterSpacing kann nicht jedes Safari
        let x = r.x + vorne;
        for (const ch of text) { s.fillText(ch, x, y); x += s.measureText(ch).width + sperr; }
      }
    }
    // Ortsnamen gesperrt, Zeichen für Zeichen
    for (const o of schilder) {
      s.font = `700 ${o.gross ? 13 : 11}px Plex, sans-serif`; s.fillStyle = '#000'; s.textBaseline = 'middle';
      const sp = 1.6, bw = [...o.t].reduce((n, ch) => n + s.measureText(ch).width + sp, 0) - sp;
      let links = o.links;
      if (links && o.a - 14 - bw < 8) links = false;            // am Rand auf die andere Seite
      if (!links && o.a + 14 + bw > W - 8) links = true;
      let x = links ? o.a - 14 - bw : o.a + 14;
      if (x < inhalt.rechts + 16 && o.b < inhalt.unten + 24) continue;   // nicht in den Text
      if (x < 4 || x + bw > W - 4) continue;
      const x0 = x;
      for (const ch of o.t) { s.fillText(ch, x, o.b); x += s.measureText(ch).width + sp; }
      if (o.zusatz) { s.font = '700 15px Plex, sans-serif'; s.fillText(o.zusatz, links ? x0 + bw - s.measureText(o.zusatz).width : x0, o.b + 19); }
    }
    const sd = s.getImageData(0, 0, w, h).data;

    // Schrift mit fester Schwelle
    const bits = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const j = i * 4;
      bits[i] = .299 * sd[j] + .587 * sd[j + 1] + .114 * sd[j + 2] < SCHWELLE ? 1 : 0;
    }
    // Hof um die Schrift: die Karte weicht rundherum aus (Dilatation in x und y über laufende Summen)
    const hof = dehnen(bits, w, h, Math.round(7 / p));
    // Karte geordnet gerastert, ausserhalb des Hofs
    for (let y = 0, i = 0; y < h; y++) {
      const zeile = (y & 3) * 4;
      for (let x = 0; x < w; x++, i++) {
        if (bits[i] || hof[i]) continue;
        const j = i * 4;
        if (.299 * kd[j] + .587 * kd[j + 1] + .114 * kd[j + 2] < BAYER[zeile + (x & 3)]) bits[i] = 1;
      }
    }
    return { w, h, p, W, H, bits };
  }

  function dehnen(a, w, h, r) {
    const t = new Uint8Array(w * h), o = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const z = y * w; let n = 0;
      for (let x = 0; x < Math.min(r, w); x++) n += a[z + x];
      for (let x = 0; x < w; x++) {
        if (x + r < w) n += a[z + x + r];
        if (x - r - 1 >= 0) n -= a[z + x - r - 1];
        t[z + x] = n > 0 ? 1 : 0;
      }
    }
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = 0; y < Math.min(r, h); y++) n += t[y * w + x];
      for (let y = 0; y < h; y++) {
        if (y + r < h) n += t[(y + r) * w + x];
        if (y - r - 1 >= 0) n -= t[(y - r - 1) * w + x];
        o[y * w + x] = n > 0 ? 1 : 0;
      }
    }
    return o;
  }

  // ------------------------------------------------------------ Drucken
  let laeuft = 0;
  function zeichnen(b, langsam) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    leinwand.width = Math.round(b.W * dpr);
    leinwand.height = Math.round(b.H * dpr);
    const ctx = leinwand.getContext('2d');
    const s = b.p * dpr;                       // Gerätepixel pro Punkt
    const rund = s >= 1.5;                     // auf scharfen Schirmen runde Punkte, sonst Quadrate
    const rad = s * .5 * 1.12;                 // leicht überlappend: Flächen satt, Kanten perlig
    ctx.fillStyle = '#000';

    const reihen = (von, bis) => {
      const pfad = new Path2D();
      for (let y = von; y < bis; y++) {
        const o = y * b.w, cy = (y + .5) * s;
        for (let x = 0; x < b.w; x++) {
          if (!b.bits[o + x]) continue;
          if (rund) { const cx = (x + .5) * s; pfad.moveTo(cx + rad, cy); pfad.arc(cx, cy, rad, 0, 2 * Math.PI); }
          else {                               // Quadrate auf ganze Bildschirmpixel, sonst bleiben Haarfugen
            const x0 = Math.floor(x * s), y0 = Math.floor(y * s);
            pfad.rect(x0, y0, Math.floor((x + 1) * s) - x0, Math.floor((y + 1) * s) - y0);
          }
        }
      }
      ctx.fill(pfad);
    };

    const id = ++laeuft;
    if (!langsam) { reihen(0, b.h); return; }
    const dauer = 1100, t0 = performance.now();
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

  const schrift = Promise.all(['500 17px Plex', '700 17px Plex'].map(f => document.fonts.load(f))).catch(() => {});
  const daten = rhein().catch(() => {});
  const warten = ms => new Promise(r => setTimeout(r, ms));
  const leise = matchMedia('(prefers-reduced-motion: reduce)').matches;

  (async () => {
    await schrift;
    await Promise.race([daten, warten(1200)]);   // kurz auf den Rhein warten, dann drucken
    const mitRhein = !!wasser;
    try { drucken(!leise); } catch (e) { root.classList.remove('js'); throw e; }
    // Kommt der Rhein später, neu drucken (Werte und Temperatur bei Basel), ohne Animation
    daten.then(() => { if (!mitRhein && wasser) drucken(false); });
    let t;
    new ResizeObserver(() => {
      const r = blatt.getBoundingClientRect();
      if (Math.abs(r.width - breite) < .5 && Math.abs(r.height - hoehe) < .5) return;
      clearTimeout(t); t = setTimeout(() => drucken(false), 120);
    }).observe(blatt);
  })();
})();
