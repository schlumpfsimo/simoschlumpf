// ware.js – Zeichnungen für die Ware im Regal. Im Blatt «Ware» steht in der Spalte «Illustration»
// einer dieser Namen. Neue Zeichnung: einen Eintrag nach dem Muster unten ergänzen (viewBox 0 0 100 100).
//   Ware.svg('kaffee')   → SVG-Text
//   Ware.namen()         → alle verfügbaren Namen
(function () {
  'use strict';

  function zeichnungen(c) {
    const k = `stroke="${c.braun}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
    const kd = `stroke="${c.braun}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
    const glanz = (x, y, rx, ry, w) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".75" transform="rotate(${w || -25} ${x} ${y})"/>`;
    const boden = (y, rx) => `<ellipse cx="50" cy="${y || 92}" rx="${rx || 30}" ry="5" fill="${c.braun}" opacity=".16"/>`;
    const schoko = '#7B4B2E';
    return {
      kaffee: `${boden()}<path d="M30 30 L70 30 L64 88 Q50 92 36 88 Z" fill="${c.weiss}" ${k}/>
        <path d="M33 50 L67 50 L65 68 L35 68 Z" fill="${c.mint}" ${k}/>
        <rect x="25" y="22" width="50" height="10" rx="5" fill="${c.rot}" ${k}/>
        <path d="M42 14 q-4 -5 0 -10 M54 15 q-4 -5 0 -10" fill="none" ${kd} opacity=".7"/>${glanz(40, 40, 3, 7, 5)}`,
      croissant: `${boden(86, 34)}<path d="M14 70 C12 48 34 30 50 30 C66 30 88 48 86 70 C80 74 74 70 70 66 C66 58 58 54 50 54 C42 54 34 58 30 66 C26 70 20 74 14 70 Z" fill="#F3B04A" ${k}/>
        <path d="M30 40 Q36 52 34 64 M42 32 Q46 44 44 55 M58 32 Q54 44 56 55 M70 40 Q64 52 66 64" fill="none" ${kd}/>${glanz(38, 38, 6, 3)}`,
      gluehwein: `${boden(90, 28)}<path d="M26 34 h42 v40 a12 12 0 0 1 -12 12 h-18 a12 12 0 0 1 -12 -12 z" fill="${c.rot}" ${k}/>
        <path d="M68 44 h6 a9 9 0 0 1 0 18 h-6" fill="none" ${k} stroke-width="5"/>
        <ellipse cx="47" cy="35" rx="21" ry="5" fill="#8E2A1C" ${k}/>
        <rect x="52" y="14" width="6" height="28" rx="3" fill="#B97A4A" ${k} transform="rotate(18 55 28)"/>
        <path d="M34 54 l3 6 6 0 -5 4 2 6 -6 -4 -6 4 2 -6 -5 -4 6 0 z" fill="${c.gelb}" ${kd}/>${glanz(33, 48, 3, 8, 0)}`,
      konzert: `${boden(88, 34)}<g transform="rotate(-10 50 50)"><rect x="12" y="34" width="62" height="34" rx="7" fill="${c.cyan}" ${k}/><path d="M56 34 v34" stroke="${c.braun}" stroke-width="2.6" stroke-dasharray="4 4"/></g>
        <g transform="rotate(8 50 50)"><rect x="26" y="40" width="62" height="34" rx="7" fill="${c.gelb}" ${k}/><path d="M70 40 v34" stroke="${c.braun}" stroke-width="2.6" stroke-dasharray="4 4"/>
        <path d="M44 66 v-16 l14 -3 v15" fill="none" ${kd}/><circle cx="41" cy="66" r="4" fill="${c.braun}"/><circle cx="55" cy="62" r="4" fill="${c.braun}"/></g>${glanz(32, 46, 5, 2.5)}`,
      herz: `${boden(90, 26)}<path d="M50 86 C20 66 12 50 14 38 C16 24 32 18 42 26 C46 29 48 32 50 36 C52 32 54 29 58 26 C68 18 84 24 86 38 C88 50 80 66 50 86 Z" fill="${c.rot}" ${k}/>${glanz(30, 36, 7, 4)}`,
      pflanze: `${boden(92, 24)}<path d="M50 60 C48 44 40 34 26 30 C26 44 34 56 50 60 Z" fill="${c.mint}" ${k}/>
        <path d="M50 60 C52 42 62 30 78 28 C78 44 68 56 50 60 Z" fill="${c['mint-tief']}" ${k}/>
        <path d="M50 62 C48 40 50 22 56 12 C62 26 58 46 50 62 Z" fill="${c.mint}" ${k}/>
        <path d="M30 60 h40 l-5 30 h-30 z" fill="${c['rot-tief']}" ${k}/><rect x="27" y="56" width="46" height="10" rx="4" fill="${c.rot}" ${k}/>${glanz(36, 74, 2.5, 6, 0)}`,
      schlittschuh: `${boden(90, 32)}<path d="M28 18 h22 l2 34 q22 2 28 14 q2 8 -6 8 h-48 z" fill="${c.weiss}" ${k}/>
        <path d="M34 26 h12 M34 34 h12 M34 42 h12" ${kd}/><path d="M20 82 h64 q6 0 6 -6" fill="none" stroke="${c.cyan}" stroke-width="6" stroke-linecap="round"/>
        <path d="M30 74 v8 M66 74 v8" ${k}/>${glanz(36, 58, 3, 7, 0)}`,
      zug: `${boden(92, 32)}<rect x="20" y="16" width="60" height="66" rx="18" fill="${c.mint}" ${k}/>
        <rect x="29" y="26" width="42" height="24" rx="8" fill="${c.cyan}" ${k}/>
        <circle cx="33" cy="66" r="5" fill="${c.gelb}" ${k}/><circle cx="67" cy="66" r="5" fill="${c.gelb}" ${k}/>
        <rect x="42" y="61" width="16" height="9" rx="3" fill="${c.weiss}" ${kd}/><path d="M30 82 l-6 10 M70 82 l6 10" ${k}/>${glanz(36, 31, 5, 2.5)}`,
      schokolade: `${boden(90, 30)}<g transform="rotate(-12 50 50)"><rect x="22" y="14" width="56" height="74" rx="8" fill="${schoko}" ${k}/>
        <path d="M22 33 h56 M22 51 h56 M50 14 v40" ${kd}/><path d="M22 54 h56 v26 a8 8 0 0 1 -8 8 h-40 a8 8 0 0 1 -8 -8 z" fill="${c.rot}" ${k}/>
        <path d="M22 54 l8 -4 8 4 8 -4 8 4 8 -4 8 4 8 -4 4 2" fill="none" ${kd}/><text x="50" y="76" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="11" fill="${c.gelb}">SCHOGGI</text></g>${glanz(32, 26, 2.5, 6, -12)}`,
      duftbaum: `${boden(94, 18)}<path d="M50 4 v10" ${k}/><circle cx="50" cy="16" r="3" fill="${c.weiss}" ${kd}/>
        <path d="M50 18 L64 34 H57 L70 50 H61 L76 68 H56 V82 H44 V68 H24 L39 50 H30 L43 34 H36 Z" fill="${c.mint}" ${k}/>
        <text x="50" y="62" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="8" fill="${c.braun}">VANILLE</text>${glanz(44, 34, 2.5, 5, 30)}`,
      kino: `${boden(92, 26)}<circle cx="34" cy="30" r="10" fill="${c.weiss}" ${k}/><circle cx="50" cy="24" r="11" fill="#FFF0C2" ${k}/><circle cx="66" cy="30" r="10" fill="${c.weiss}" ${k}/>
        <circle cx="42" cy="36" r="9" fill="#FFF0C2" ${k}/><circle cx="58" cy="36" r="9" fill="${c.weiss}" ${k}/>
        <path d="M26 38 h48 l-6 50 h-36 z" fill="${c.weiss}" ${k}/><path d="M36 38 l3 50 M50 38 v50 M64 38 l-3 50" stroke="${c.rot}" stroke-width="6"/><path d="M26 38 h48 l-6 50 h-36 z" fill="none" ${k}/>${glanz(32, 52, 2.5, 7, -5)}`,
      brief: `${boden(84, 34)}<rect x="14" y="26" width="72" height="52" rx="8" fill="${c.weiss}" ${k}/>
        <path d="M16 30 L50 56 L84 30" fill="none" ${k}/><path d="M50 62 c-8 -6 -10 -10 -8 -13 c2 -3 6 -3 8 1 c2 -4 6 -4 8 -1 c2 3 0 7 -8 13 z" fill="${c.rot}" ${kd}/>${glanz(24, 36, 5, 2.5)}`,
      koffer: `${boden(92, 34)}<path d="M38 26 v-8 a4 4 0 0 1 4 -4 h16 a4 4 0 0 1 4 4 v8" fill="none" ${k} stroke-width="5"/>
        <rect x="14" y="26" width="72" height="60" rx="12" fill="${c.gelb}" ${k}/><path d="M32 26 v60 M68 26 v60" ${kd}/>
        <circle cx="50" cy="48" r="9" fill="${c.rot}" ${kd}/><rect x="56" y="60" width="18" height="12" rx="3" fill="${c.mint}" ${kd} transform="rotate(10 65 66)"/>${glanz(22, 38, 3, 7, 0)}`,
      paket: `${boden(92, 32)}<rect x="18" y="38" width="64" height="50" rx="8" fill="${c.mint}" ${k}/><rect x="14" y="28" width="72" height="16" rx="6" fill="${c['mint-hell']}" ${k}/>
        <path d="M50 28 v60" stroke="${c.rot}" stroke-width="9"/><path d="M50 28 v60" fill="none" ${kd} opacity="0"/>
        <path d="M50 28 C38 12 26 18 32 26 C36 30 44 30 50 28 C56 30 64 30 68 26 C74 18 62 12 50 28 Z" fill="${c.rot}" ${k}/>${glanz(26, 52, 3, 7, 0)}`,
      buch: `${boden(90, 32)}<path d="M18 22 h52 a8 8 0 0 1 8 8 v56 h-52 a8 8 0 0 1 -8 -8 z" fill="${c.cyan}" ${k}/>
        <path d="M18 78 a8 8 0 0 0 8 8 h52 v-8 h-52 a8 8 0 0 1 -8 -8" fill="${c.weiss}" ${k}/>
        <rect x="32" y="34" width="34" height="10" rx="4" fill="${c.gelb}" ${kd}/>${glanz(28, 34, 2.5, 7, 0)}`,
      kerze: `${boden(92, 22)}<path d="M50 8 C58 18 60 26 50 32 C40 26 42 18 50 8 Z" fill="${c.gelb}" ${k}/>
        <path d="M50 32 v6" ${k}/><rect x="36" y="38" width="28" height="50" rx="6" fill="${c.rot}" ${k}/>
        <path d="M36 50 q6 6 10 0 q2 -4 6 0" fill="none" ${kd}/>${glanz(42, 56, 2.5, 8, 0)}`,
      blume: `${boden(94, 20)}<path d="M50 52 v40" ${k} stroke="${c['mint-tief']}" stroke-width="6"/><path d="M50 50 L50 92" fill="none" ${k}/>
        <path d="M50 76 C40 64 28 68 30 74 C34 80 44 80 50 76" fill="${c.mint}" ${k}/>
        ${[0, 72, 144, 216, 288].map(w => `<ellipse cx="50" cy="22" rx="10" ry="14" fill="${c.rot}" ${k} transform="rotate(${w} 50 36)"/>`).join('')}
        <circle cx="50" cy="36" r="9" fill="${c.gelb}" ${k}/>${glanz(46, 32, 2.5, 2.5)}`,
      gutschein: `${boden(86, 34)}<g transform="rotate(-6 50 50)"><path d="M12 30 h76 v14 a6 6 0 0 0 0 12 v14 h-76 v-14 a6 6 0 0 0 0 -12 z" fill="${c.gelb}" ${k}/>
        <path d="M34 30 v40" stroke="${c.braun}" stroke-width="2.6" stroke-dasharray="4 4"/>
        <text x="62" y="58" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="22" fill="${c.rot}" stroke="${c.braun}" stroke-width="2" paint-order="stroke">%</text></g>${glanz(22, 40, 2.5, 5, 0)}`
    };
  }

  let cache = null;
  function alle() { if (!cache) cache = zeichnungen(Grafik.farben()); return cache; }

  function svg(name) {
    const z = alle();
    const inhalt = z[name] || z.paket;
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="ware-svg" aria-hidden="true">${inhalt}</svg>`;
  }

  window.Ware = { svg, namen: () => Object.keys(alle()) };
})();
