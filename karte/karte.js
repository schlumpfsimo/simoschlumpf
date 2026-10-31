// Startseite als Punkteraster über den ganzen Bildschirm.
// 1. Rhein in Basel holen (BAFU über api.existenz.ch) und in den HTML-Satz schreiben.
// 2. Karte des Oberrheins und den HTML-Satz auf eine Leinwand setzen, ein Pixel = ein Punkt:
//    Karte geordnet gerastert (Grautöne werden Punktdichte), Schrift mit fester Schwelle.
// 3. Die Punkte rund zeichnen und Zeile um Zeile von oben nach unten «drucken».
// 4. Ein Klick auf ein Gebiet (Département, Kanton, Land) macht es weiss und schreibt seinen Namen hinein.
// Der HTML-Satz bleibt die Wahrheit: er bestimmt die Lage, bleibt anklickbar und markierbar.
(() => {
  'use strict';
  const root = document.documentElement;
  const LANG = root.lang === 'fr' ? 'fr' : 'de';
  const TZ = 'Europe/Zurich';
  const SCHWELLE = 170;                       // Schrift: dunkler als etwa 67 % Grau wird schwarz
  // Geordnetes Raster 8×8 (Bayer): 64 Tonstufen, Punkte gleichmässig verteilt
  const BAYER = (() => {
    const m = [0];
    for (let n = 1; n < 8; n *= 2) {
      const a = m.slice(), z = [];
      for (let y = 0; y < 2 * n; y++) for (let x = 0; x < 2 * n; x++) {
        const v = a[(y % n) * n + (x % n)] * 4;
        z.push(v + [0, 2, 3, 1][(y >= n) * 2 + (x >= n)]);
      }
      m.length = 0; m.push(...z);
    }
    return m.map(v => (v + .5) / 64 * 255);
  })();
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
  // Gebietstöne als Punktdichte: Stufe t → 3, 6, 9, 12 oder 15 von 64 Punkten.
  // Die Stufen sind in den Daten so verteilt, dass Nachbarn nie gleich sind.
  const TON = [3, 6, 9, 12, 15].map(d => 255 * (64 - d) / 64);
  const UEBERGANG = 260;                      // ms, bis ein gewähltes Gebiet weiss ist

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

  const ringe = (ctx, px, rs) => rs.forEach(r => r.forEach((q, i) => { const [a, b] = px(q); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }));

  // Gebiete als Kennungen: Farbe = Nummer + 1 (rot + 256 × grün), Blau 7 als Prüfzeichen; Seen sparen aus
  function gebiete(ctx, px) {
    const D = window.OBERRHEIN;
    D.gebiete.forEach((g, i) => {
      ctx.fillStyle = `rgb(${(i + 1) & 255},${(i + 1) >> 8},7)`;
      ctx.beginPath(); ringe(ctx, px, g.p); ctx.fill();
    });
    ctx.fillStyle = '#000'; ctx.beginPath(); ringe(ctx, px, D.seen); ctx.fill();
  }

  // Linien, Seen, Sterne und Ortspunkte
  function linien(ctx, W, H, px, inhalt, schilder) {
    const D = window.OBERRHEIN;
    const linie = l => { ctx.beginPath(); ringe(ctx, px, [l]); ctx.stroke(); };
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.fillStyle = '#a8a8a8'; ctx.beginPath(); ringe(ctx, px, D.seen); ctx.fill();
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
  const hell = (d, j) => .299 * d[j] + .587 * d[j + 1] + .114 * d[j + 2];

  // Der Satz hält alles, was es zum Neudrucken eines Ausschnitts braucht
  let S = null;
  let wahl = -1;                              // gewähltes Gebiet (Nummer in D.gebiete), -1 = keins
  const blass = new Map();                    // Gebiet → Anteil seines Tons, 0 = weiss, 1 = voll

  function setzen() {
    const B = blatt.getBoundingClientRect();
    const W = B.width, H = B.height;
    if (!W || !H) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const p = dpr >= 2 ? .75 : 1;              // CSS-Pixel pro Punkt: fein, aber auf dem Schirm noch rund
    const w = Math.ceil(W / p), h = Math.ceil(H / p);
    const lage = r => ({ x: r.left - B.left, y: r.top - B.top, w: r.width, h: r.height });
    const neu = (grund = '#fff') => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.fillStyle = grund; x.fillRect(0, 0, w, h); x.scale(1 / p, 1 / p);
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

    // Fläche des Inhalts: Ortsnamen und Sternenkreis halten Abstand davon
    const inhalt = { rechts: 0, unten: 0 };
    [...satz.children].forEach(el => {
      if (!sichtbar(el)) return;
      const r = lage(el.getBoundingClientRect());
      inhalt.rechts = Math.max(inhalt.rechts, r.x + r.w); inhalt.unten = Math.max(inhalt.unten, r.y + r.h);
    });

    const D = window.OBERRHEIN;
    const schilder = [];
    const n = w * h;
    const linie = new Uint8Array(n).fill(255), gebiet = new Uint16Array(n);
    if (D) {
      const px = projektion(W, Math.min(H, Math.max(window.innerHeight, 480)), inhalt);
      const l = neu(); linien(l, W, H, px, inhalt, schilder);
      const ld = l.getImageData(0, 0, w, h).data;
      const g = neu('#000'); gebiete(g, px);
      const gd = g.getImageData(0, 0, w, h).data;
      const anzahl = D.gebiete.length;
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        linie[i] = hell(ld, j);
        if (gd[j + 2] === 7) { const k = gd[j] + 256 * gd[j + 1]; if (k >= 1 && k <= anzahl) gebiet[i] = k; }
      }
    }

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
    for (const { n: t, r } of texte) {
      const el = t.parentElement, st = getComputedStyle(el);
      let text = t.nodeValue.replace(/\s+/g, ' ').trim();
      if (st.textTransform === 'uppercase') text = text.toUpperCase();
      s.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      s.fillStyle = el.closest('.knopf') ? '#fff' : '#000';
      s.textBaseline = 'alphabetic';
      const m = s.measureText('Hg');
      const asc = m.fontBoundingBoxAscent ?? parseFloat(st.fontSize) * .78;
      const desc = m.fontBoundingBoxDescent ?? parseFloat(st.fontSize) * .22;
      const vorne = /^\s/.test(t.nodeValue) ? s.measureText(' ').width : 0;
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
      const sp = 1.6, bw = [...o.t].reduce((a, ch) => a + s.measureText(ch).width + sp, 0) - sp;
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
    const schrift = new Uint8Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) schrift[i] = hell(sd, j) < SCHWELLE ? 1 : 0;
    // Hof um die Schrift: die Karte weicht rundherum aus
    const hof = dehnen(schrift, w, h, Math.round(7 / p));

    // Ausdehnung und Schwerpunkt je Gebiet (für Neudruck und Beschriftung)
    const anz = D ? D.gebiete.length + 1 : 1;
    const box = new Int32Array(anz * 4).fill(-1), sum = new Float64Array(anz * 3);
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const k = gebiet[i]; if (!k) continue;
      const b = k * 4;
      if (box[b] < 0) { box[b] = box[b + 2] = x; box[b + 1] = box[b + 3] = y; }
      else { if (x < box[b]) box[b] = x; if (x > box[b + 2]) box[b + 2] = x; if (y > box[b + 3]) box[b + 3] = y; }
      if (!hof[i]) { sum[k * 3] += x; sum[k * 3 + 1] += y; sum[k * 3 + 2]++; }
    }

    S = { w, h, p, W, H, linie, gebiet, schrift, hof, box, sum, bits: new Uint8Array(n), schild: null };
    S.schild = schild(wahl);
    punkteRechnen(0, 0, w, h);
    return S;
  }

  // Ein Punkt: Schrift > Hof > Name des gewählten Gebiets > Linien > Gebietston
  function punkteRechnen(x0, y0, x1, y1) {
    const { w, linie, gebiet, schrift, hof, bits, schild: sch } = S;
    const D = window.OBERRHEIN;
    for (let y = y0; y < y1; y++) {
      const zeile = (y & 7) * 8;
      for (let x = x0, i = y * w + x0; x < x1; x++, i++) {
        let b = 0;
        if (schrift[i]) b = 1;
        else if (!hof[i]) {
          const imSchild = sch && x >= sch.x && x < sch.x + sch.w && y >= sch.y && y < sch.y + sch.h;
          const si = imSchild ? (y - sch.y) * sch.w + (x - sch.x) : -1;
          if (imSchild && sch.bits[si]) b = 1;
          else if (!(imSchild && sch.hof[si])) {
            const schwelle = BAYER[zeile + (x & 7)];
            if (linie[i] < schwelle) b = 1;
            else if (gebiet[i]) {
              const k = gebiet[i] - 1, f = blass.has(k) ? blass.get(k) : 1;
              if (f > 0 && 255 - (255 - TON[D.gebiete[k].t]) * f < schwelle) b = 1;
            }
          }
        }
        bits[i] = b;
      }
    }
  }

  // Name des gewählten Gebiets, fein gepunktet mit eigenem Hof, an der Stelle nahe dem Schwerpunkt
  function schild(k) {
    const D = window.OBERRHEIN;
    if (k < 0 || !D || !S) return null;
    const { w, h, p, gebiet, hof, sum } = S, id = k + 1;
    if (!sum[id * 3 + 2]) return null;
    const cx = sum[id * 3] / sum[id * 3 + 2], cy = sum[id * 3 + 1] / sum[id * 3 + 2];
    let best = -1, bd = Infinity;               // nächster freie Punkt des Gebiets zum Schwerpunkt
    for (let i = 0; i < w * h; i++) {
      if (gebiet[i] !== id || hof[i]) continue;
      const dx = i % w - cx, dy = (i / w | 0) - cy, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return null;
    const t = (LANG === 'fr' ? D.gebiete[k].fr : D.gebiete[k].de).toUpperCase();
    const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    c.font = '700 13px Plex, sans-serif';
    const sp = 1.8, bw = [...t].reduce((a, ch) => a + c.measureText(ch).width + sp, 0) - sp;
    const rand = 8, sw = Math.ceil((bw + 2 * rand) / p), sh = Math.ceil((18 + 2 * rand) / p);
    c.canvas.width = sw; c.canvas.height = sh;
    c.fillStyle = '#fff'; c.fillRect(0, 0, sw, sh); c.scale(1 / p, 1 / p);
    c.font = '700 13px Plex, sans-serif'; c.fillStyle = '#000'; c.textBaseline = 'middle';
    let x = rand;
    for (const ch of t) { c.fillText(ch, x, rand + 9); x += c.measureText(ch).width + sp; }
    const d = c.getImageData(0, 0, sw, sh).data, bits = new Uint8Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) bits[i] = hell(d, i * 4) < SCHWELLE ? 1 : 0;
    const sx = Math.min(Math.max(best % w - (sw >> 1), 0), w - sw), sy = Math.min(Math.max((best / w | 0) - (sh >> 1), 0), h - sh);
    return { x: sx, y: sy, w: sw, h: sh, bits, hof: dehnen(bits, sw, sh, Math.round(5 / p)), name: LANG === 'fr' ? D.gebiete[k].fr : D.gebiete[k].de };
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
  let laeuft = 0, ctx = null, gross = 1;
  // Punkte im Ausschnitt [x0, x1) × [y0, y1) zeichnen; loeschen: vorher frei machen
  function punkte(x0, y0, x1, y1, loeschen) {
    const s = gross, rund = s >= 1.5, rad = s * .5 * 1.12;   // leicht überlappend: Flächen satt, Kanten perlig
    if (loeschen) ctx.clearRect(Math.floor(x0 * s), Math.floor(y0 * s), Math.ceil((x1 - x0) * s) + 1, Math.ceil((y1 - y0) * s) + 1);
    const pfad = new Path2D(), { w, bits } = S;
    const a = Math.max(0, x0 - 1), e = Math.min(w, x1 + 1);
    for (let y = Math.max(0, y0 - 1); y < Math.min(S.h, y1 + 1); y++) {
      const o = y * w, cy = (y + .5) * s;
      for (let x = a; x < e; x++) {
        if (!bits[o + x]) continue;
        if (rund) { const cx = (x + .5) * s; pfad.moveTo(cx + rad, cy); pfad.arc(cx, cy, rad, 0, 2 * Math.PI); }
        else {                                 // Quadrate auf ganze Bildschirmpixel, sonst bleiben Haarfugen
          const qx = Math.floor(x * s), qy = Math.floor(y * s);
          pfad.rect(qx, qy, Math.floor((x + 1) * s) - qx, Math.floor((y + 1) * s) - qy);
        }
      }
    }
    ctx.fill(pfad);
  }

  function zeichnen(langsam) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    leinwand.width = Math.round(S.W * dpr);
    leinwand.height = Math.round(S.H * dpr);
    ctx = leinwand.getContext('2d'); ctx.fillStyle = '#000';
    gross = S.p * dpr;                         // Gerätepixel pro Punkt
    const id = ++laeuft;
    if (!langsam) { punkte(0, 0, S.w, S.h); return; }
    // Wie aus dem Drucker: Zeile um Zeile von oben nach unten
    const dauer = 1100, t0 = performance.now();
    let fertig = 0;
    const schritt = t => {
      if (id !== laeuft) return;
      const bis = Math.min(S.h, Math.ceil(S.h * Math.min(1, (t - t0) / dauer)));
      if (bis > fertig) { punkte(0, fertig, S.w, bis); fertig = bis; }
      if (fertig < S.h) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  let breite = 0, hoehe = 0;
  function drucken(langsam = false) {
    if (!setzen()) return;
    breite = S.W; hoehe = S.H;
    zeichnen(langsam);
    root.classList.add('gedruckt');
  }

  // ------------------------------------------------------------ Gebiete wählen
  const ansage = document.createElement('p');
  ansage.className = 'unsichtbar'; ansage.setAttribute('aria-live', 'polite');
  blatt.append(ansage);

  // Ausschnitt eines Gebiets (in Punkten) oder des Schilds
  const flaeche = k => {
    if (k < 0) return null;
    const b = (k + 1) * 4;
    return S.box[b] < 0 ? null : [S.box[b], S.box[b + 1], S.box[b + 2] + 1, S.box[b + 3] + 1];
  };
  const vereinen = rs => rs.filter(Boolean).reduce((a, r) => a ? [Math.min(a[0], r[0]), Math.min(a[1], r[1]), Math.max(a[2], r[2]), Math.max(a[3], r[3])] : r, null);
  const sichtbereich = r => r && [Math.max(0, r[0]), Math.max(0, r[1]), Math.min(S.w, r[2]), Math.min(S.h, r[3])];

  let blende = 0;
  function waehlen(k) {
    if (!S || k === wahl) return;
    const vorher = wahl, altSchild = S.schild;
    wahl = k;
    const neuSchild = S.schild = schild(k);
    const ausschnitt = sichtbereich(vereinen([flaeche(vorher), flaeche(k),
      altSchild && [altSchild.x, altSchild.y, altSchild.x + altSchild.w, altSchild.y + altSchild.h],
      neuSchild && [neuSchild.x, neuSchild.y, neuSchild.x + neuSchild.w, neuSchild.y + neuSchild.h]]));
    ansage.textContent = neuSchild ? neuSchild.name : '';
    if (!ausschnitt) return;
    const id = ++blende, t0 = performance.now(), dauer = leise ? 0 : UEBERGANG;
    const schritt = t => {
      if (id !== blende) return;
      // in Stufen wie ein Raster: das neue Gebiet verliert seinen Ton, das alte bekommt ihn zurück
      const a = dauer ? Math.min(1, (t - t0) / dauer) : 1, stufe = Math.round(a * 5) / 5;
      if (k >= 0) blass.set(k, 1 - stufe);
      if (vorher >= 0) { if (stufe >= 1) blass.delete(vorher); else blass.set(vorher, stufe); }
      punkteRechnen(...ausschnitt);
      punkte(...ausschnitt, true);
      if (a < 1) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  const zelle = e => {
    if (!S) return 0;
    const r = blatt.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / S.p), y = Math.floor((e.clientY - r.top) / S.p);
    if (x < 0 || y < 0 || x >= S.w || y >= S.h) return 0;
    const i = y * S.w + x;
    return S.hof[i] ? -1 : S.gebiet[i];        // −1: über der Schrift, dort nichts wählen
  };
  blatt.addEventListener('click', e => {
    if (e.target.closest('a, nav') || !getSelection().isCollapsed) return;
    const k = zelle(e);
    if (k < 0) return;
    waehlen(k && k - 1 !== wahl ? k - 1 : -1);
  });
  blatt.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    blatt.style.cursor = !e.target.closest('a') && zelle(e) > 0 ? 'pointer' : '';
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') waehlen(-1); });

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
