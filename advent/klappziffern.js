// klappziffern.js – Ziffern wie an der Preistafel einer Tankstelle, die beim Wechsel umklappen.
//   const k = Klappziffern.erstellen(4, 'gross');   // 4 Stellen
//   Klappziffern.setzen(k, 1250, { von: 0 });        // klappt von 0 bis 1250 hoch
(function () {
  'use strict';
  const ruhig = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function erstellen(stellen, klasse) {
    const k = document.createElement('span');
    k.className = 'klapp ' + (klasse || '');
    k.setAttribute('role', 'img');
    for (let i = 0; i < stellen; i++) {
      const z = document.createElement('span');
      z.className = 'klapp-ziffer';
      z.textContent = ' ';
      k.append(z);
    }
    k._wert = null;
    return k;
  }

  /** Stellt eine Ziffer ein; mit Klappe, die die alte obere Hälfte wegklappt. */
  function klappe(z, neu) {
    const alt = z.textContent;
    z.textContent = neu;
    if (ruhig() || alt === neu) return;
    const k = document.createElement('span');
    k.className = 'klapp-klappe';
    const s = document.createElement('span');
    s.textContent = alt;
    k.append(s);
    z.append(k);
    k.addEventListener('animationend', () => k.remove());
  }

  /** Zeigt eine Zahl an. Jede Stelle klappt Ziffer für Ziffer bis zum Ziel (wie ein Fallblatt). */
  function setzen(k, wert, opt) {
    opt = opt || {};
    const ziffern = [...k.children];
    const n = ziffern.length;
    const f = opt.fuellen != null ? opt.fuellen : ' ';
    const text = wert == null ? '-'.repeat(n)
      : wert < 0 ? '-' + String(Math.abs(Math.round(wert))).padStart(n - 1, f)     // negativer Stand (nach Korrekturen)
      : String(Math.round(wert)).padStart(n, f);
    const ziel = text.slice(-n);
    k.setAttribute('aria-label', String(wert == null ? '' : wert));
    k._wert = wert;
    if (ruhig()) { ziffern.forEach((z, i) => { z.textContent = ziel[i]; }); return Promise.resolve(); }
    const start = opt.von != null ? String(Math.round(opt.von)).padStart(n, opt.fuellen != null ? opt.fuellen : ' ').slice(-n) : ziffern.map(z => z.textContent).join('');
    return Promise.all(ziffern.map((z, i) => new Promise(fertig => {
      const a = start[i], b = ziel[i];
      z.textContent = a;
      if (a === b) { fertig(); return; }
      // Folge der Klappen: Ziffern von a bis b, Leerzeichen und Striche direkt
      const folge = [];
      if (/\d/.test(a) && /\d/.test(b)) { let x = +a; while (x !== +b) { x = (x + 1) % 10; folge.push(String(x)); } }
      else if (/\d/.test(b)) { for (let x = 0; x <= +b; x++) folge.push(String(x)); }
      else folge.push(b);
      let j = 0;
      setTimeout(function schritt() {
        klappe(z, folge[j++]);
        if (j < folge.length) setTimeout(schritt, 70); else fertig();
      }, (opt.verzoegerung || 0) + i * 90);
    })));
  }

  window.Klappziffern = { erstellen, setzen };
})();
