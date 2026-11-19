// grafik.js – alle selbst gezeichneten Grafiken von SimOil als SVG (keine Bilder, keine fremden Grafiken).
//   Grafik.simo('normal' | 'freude' | 'staunen')   Simo, der Kassierer
//   Grafik.stern(['NEU:', 'ADVENTSRUBBEL'])        schräger Sternaufkleber
//   Grafik.wimpel()                                 Wimpelkette für den Sonntag
//   Grafik.logo()                                   Schild «SimOil» (HTML, damit einzelne Buchstaben flackern können)
//   Grafik.symbol('kamera' | 'ton-an' | 'ton-aus' | 'zurueck' | 'tropfen' | 'regal' | 'los')
// Farben kommen aus farben.css (CSS-Variablen) und werden beim ersten Gebrauch gelesen.
(function () {
  'use strict';

  let F = null;
  /** Farben aus farben.css lesen (einmal). */
  function farben() {
    if (F) return F;
    const s = getComputedStyle(document.documentElement);
    const v = n => (s.getPropertyValue('--' + n) || '').trim();
    F = {};
    ['creme', 'braun', 'gelb', 'rot', 'mint', 'cyan', 'magenta', 'creme-tief', 'weiss', 'gelb-tief', 'rot-tief', 'mint-tief',
      'mint-hell', 'cyan-tief', 'asphalt', 'haut', 'haut-tief', 'haar', 'navy', 'wange', 'leise'].forEach(n => { F[n] = v(n); });
    return F;
  }

  // ---------------------------------------------------------------- Simo
  // Nach den Fotos: kurze Haare, Schnauz, blaue Augen, dunkelblaue Mütze mit weisser Sonne,
  // dunkelblaue Arbeitsjacke über weissem T-Shirt. Grosser runder Kopf, Punktaugen, rote Bäckchen.
  function simo(ausdruck) {
    const c = farben();
    const k = `stroke="${c.braun}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
    let augen, mund;
    if (ausdruck === 'freude') {
      augen = `<path d="M43 69 q5 -6 10 0 M67 69 q5 -6 10 0" fill="none" ${k}/>`;
      mund = `<path d="M53 90 q7 7 14 0 z" fill="${c.rot}" ${k} stroke-width="2.6"/>`;
    } else if (ausdruck === 'staunen') {
      augen = `<ellipse cx="48" cy="68" rx="5" ry="6.5" fill="${c.weiss}" ${k} stroke-width="2.6"/><circle cx="48" cy="69" r="3" fill="#3D6FB6"/>
               <ellipse cx="72" cy="68" rx="5" ry="6.5" fill="${c.weiss}" ${k} stroke-width="2.6"/><circle cx="72" cy="69" r="3" fill="#3D6FB6"/>`;
      mund = `<ellipse cx="60" cy="92" rx="4" ry="5" fill="${c.braun}"/>`;
    } else {
      augen = `<ellipse cx="48" cy="69" rx="4.2" ry="5.2" fill="#3D6FB6" ${k} stroke-width="2.4"/><circle cx="49.6" cy="67.2" r="1.5" fill="#fff"/>
               <ellipse cx="72" cy="69" rx="4.2" ry="5.2" fill="#3D6FB6" ${k} stroke-width="2.4"/><circle cx="73.6" cy="67.2" r="1.5" fill="#fff"/>`;
      mund = `<path d="M54 90 q6 4.5 12 0" fill="none" ${k} stroke-width="2.6"/>`;
    }
    const sonne = Array.from({ length: 8 }, (_, i) => {
      const w = i * Math.PI / 4, x1 = 60 + Math.cos(w) * 5.2, y1 = 34 + Math.sin(w) * 5.2, x2 = 60 + Math.cos(w) * 8, y2 = 34 + Math.sin(w) * 8;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
    }).join('');
    return `<svg viewBox="0 0 120 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="simo-svg">
      <path d="M12 128 C14 104 34 95 60 95 C86 95 106 104 108 128 Z" fill="${c.navy}" ${k}/>
      <path d="M45 97 Q60 113 75 97 Z" fill="${c.weiss}" ${k} stroke-width="2.6"/>
      <path d="M45 96 L36 110 L52 105 Z M75 96 L84 110 L68 105 Z" fill="#40548F" ${k} stroke-width="2.6"/>
      <rect x="31" y="113" width="12" height="9" rx="2" fill="${c.weiss}" ${k} stroke-width="2"/>
      <path d="M50 82 h20 v14 q-10 6 -20 0 z" fill="${c['haut-tief']}" ${k} stroke-width="2.6"/>
      <circle cx="29" cy="67" r="7.5" fill="${c.haut}" ${k}/>
      <circle cx="91" cy="67" r="7.5" fill="${c.haut}" ${k}/>
      <ellipse cx="60" cy="63" rx="31" ry="33" fill="${c.haut}" ${k}/>
      <path d="M30 52 Q29 62 33 66 L37 52 Z M90 52 Q91 62 87 66 L83 52 Z" fill="${c.haar}"/>
      <ellipse cx="40" cy="80" rx="5.5" ry="3.2" fill="${c.wange}" opacity=".75"/>
      <ellipse cx="80" cy="80" rx="5.5" ry="3.2" fill="${c.wange}" opacity=".75"/>
      <path d="M42 59 q6 -4 12 -1 M66 58 q6 -3 12 1" fill="none" stroke="${c.haar}" stroke-width="3.4" stroke-linecap="round"/>
      ${augen}
      <ellipse cx="60" cy="77" rx="4.6" ry="3.4" fill="${c['haut-tief']}"/><ellipse cx="58.8" cy="76" rx="1.4" ry="1" fill="#fff" opacity=".6"/>
      <path d="M43 86 C47 79 55 79 60 82.5 C65 79 73 79 77 86 C72 84 66 86.5 60 85.5 C54 86.5 48 84 43 86 Z" fill="#9A6A45" ${k} stroke-width="2.6"/>
      ${mund}
      <path d="M27 52 Q26 21 60 21 Q94 21 93 52 Z" fill="${c.navy}" ${k}/>
      <path d="M25 52 Q60 44 95 52 Q94 60 60 58.5 Q26 60 25 52 Z" fill="#26345C" ${k}/>
      <ellipse cx="44" cy="31" rx="7" ry="3.5" fill="#fff" opacity=".22" transform="rotate(-25 44 31)"/>
      <circle cx="60" cy="34" r="3.6" fill="#fff"/>${sonne}
    </svg>`;
  }

  // ---------------------------------------------------------------- Stern
  /** Sternaufkleber mit zwei Zeilen Text. Leicht unregelmässig, damit er billig wirkt. */
  function stern(zeilen, opt) {
    opt = opt || {};
    const c = farben();
    const n = 14, R = 48, r = 38;
    let seed = opt.seed || 7;
    const z = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const pkt = [];
    for (let i = 0; i < n * 2; i++) {
      const w = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = (i % 2 ? r : R) + (z() - 0.5) * 3;
      pkt.push((50 + Math.cos(w) * rad).toFixed(1) + ',' + (50 + Math.sin(w) * rad).toFixed(1));
    }
    const fuell = opt.farbe || c.rot;
    const text = opt.textfarbe || c.gelb;
    const groesse = zeilen.map(t => Math.min(17, 150 / Math.max(4, t.length)));
    const y0 = 50 - (zeilen.length - 1) * 8.5;
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="stern-svg" role="img" aria-label="${zeilen.join(' ')}">
      <polygon points="${pkt.join(' ')}" fill="${fuell}" stroke="${c.braun}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="36" cy="30" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-30 36 30)"/>
      ${zeilen.map((t, i) => `<text x="50" y="${y0 + i * 17}" text-anchor="middle" dominant-baseline="middle"
          font-family="Fredoka, sans-serif" font-weight="700" font-size="${groesse[i].toFixed(1)}" fill="${text}"
          stroke="${c.braun}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${t}</text>`).join('')}
    </svg>`;
  }

  // ---------------------------------------------------------------- Wimpelkette
  function wimpel(anzahl) {
    const c = farben();
    anzahl = anzahl || 11;
    const farbenListe = [c.rot, c.gelb, c.mint, c.cyan, c.weiss];
    const b = 400, h = 56;
    const y = x => 8 + 18 * Math.sin(Math.PI * x / b);       // durchhängende Schnur
    let dreiecke = '';
    for (let i = 0; i < anzahl; i++) {
      const x1 = 10 + i * (b - 20) / anzahl + 3, x2 = 10 + (i + 1) * (b - 20) / anzahl - 3, xm = (x1 + x2) / 2;
      dreiecke += `<path d="M${x1.toFixed(1)} ${y(x1).toFixed(1)} L${x2.toFixed(1)} ${y(x2).toFixed(1)} L${xm.toFixed(1)} ${(y(xm) + 26).toFixed(1)} Z"
        fill="${farbenListe[i % farbenListe.length]}" stroke="${c.braun}" stroke-width="3" stroke-linejoin="round" class="wimpel-dreieck" style="--i:${i}"/>`;
    }
    return `<svg viewBox="0 0 ${b} ${h}" preserveAspectRatio="none" class="wimpel-svg" aria-hidden="true">
      <path d="M0 6 Q${b / 2} ${8 + 36} ${b} 6" fill="none" stroke="${c.braun}" stroke-width="3"/>${dreiecke}</svg>`;
  }

  // ---------------------------------------------------------------- Schild «SimOil»
  /** Logo als HTML: Tropfen + Buchstaben einzeln (für das Flackern einer «kaputten Röhre»). */
  function logo(text) {
    text = text || 'SimOil';
    const buchstaben = [...text].map((b, i) => `<span class="logo-b" style="--i:${i}">${b}</span>`).join('');
    return `<span class="logo">${symbol('tropfen')}<span class="logo-text">${buchstaben}</span></span>`;
  }

  // ---------------------------------------------------------------- Symbole
  function symbol(name) {
    const c = farben();
    const k = `stroke="${c.braun}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
    const S = {
      tropfen: `<svg viewBox="0 0 40 48" class="sym sym-tropfen" aria-hidden="true"><path d="M20 3 C26 14 36 22 36 31 A16 16 0 0 1 4 31 C4 22 14 14 20 3 Z" fill="${c.gelb}" ${k} stroke-width="3.5"/><ellipse cx="13" cy="30" rx="3.5" ry="6" fill="#fff" opacity=".7" transform="rotate(20 13 30)"/></svg>`,
      kamera: `<svg viewBox="0 0 48 40" class="sym" aria-hidden="true"><path d="M8 12 h7 l4 -6 h10 l4 6 h7 a5 5 0 0 1 5 5 v15 a5 5 0 0 1 -5 5 h-32 a5 5 0 0 1 -5 -5 v-15 a5 5 0 0 1 5 -5 z" fill="${c.weiss}" ${k}/><circle cx="24" cy="24" r="8" fill="${c.cyan}" ${k}/><circle cx="21.5" cy="21.5" r="2.4" fill="#fff"/></svg>`,
      'ton-an': `<svg viewBox="0 0 40 40" class="sym" aria-hidden="true"><path d="M6 15 h7 l9 -8 v26 l-9 -8 h-7 z" fill="${c.gelb}" ${k}/><path d="M27 14 q5 6 0 12 M31 9 q10 11 0 22" fill="none" ${k}/></svg>`,
      'ton-aus': `<svg viewBox="0 0 40 40" class="sym" aria-hidden="true"><path d="M6 15 h7 l9 -8 v26 l-9 -8 h-7 z" fill="${c.creme}" ${k}/><path d="M27 15 l9 10 M36 15 l-9 10" fill="none" ${k}/></svg>`,
      zurueck: `<svg viewBox="0 0 40 40" class="sym" aria-hidden="true"><path d="M24 9 L12 20 L24 31" fill="none" ${k} stroke-width="5"/></svg>`,
      regal: `<svg viewBox="0 0 48 44" class="sym" aria-hidden="true"><rect x="5" y="4" width="38" height="36" rx="7" fill="${c.mint}" ${k}/><path d="M5 22 h38" ${k}/><rect x="11" y="10" width="9" height="12" rx="3" fill="${c.gelb}" ${k} stroke-width="2.5"/><circle cx="31" cy="16" r="5.5" fill="${c.rot}" ${k} stroke-width="2.5"/><rect x="12" y="28" width="22" height="12" rx="3" fill="${c.weiss}" ${k} stroke-width="2.5"/></svg>`,
      los: `<svg viewBox="0 0 48 44" class="sym" aria-hidden="true"><rect x="5" y="5" width="38" height="34" rx="7" fill="${c.weiss}" ${k}/><rect x="11" y="11" width="11" height="10" rx="3" fill="#C9BFB0" ${k} stroke-width="2.5"/><rect x="26" y="11" width="11" height="10" rx="3" fill="${c.gelb}" ${k} stroke-width="2.5"/><rect x="11" y="24" width="11" height="10" rx="3" fill="#C9BFB0" ${k} stroke-width="2.5"/><rect x="26" y="24" width="11" height="10" rx="3" fill="#C9BFB0" ${k} stroke-width="2.5"/></svg>`
    };
    return S[name] || '';
  }

  window.Grafik = { simo, stern, wimpel, logo, symbol, farben };
})();
