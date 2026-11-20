// konfetti.js – Konfetti und Sterne bei Gewinn, länger und dichter beim Jackpot.
//   Konfetti.los({ jackpot: true })
(function () {
  'use strict';
  const ruhig = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stern(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const w = i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(w) * rad, Math.sin(w) * rad);
    }
    ctx.closePath();
  }

  function los(opt) {
    opt = opt || {};
    if (ruhig()) return Promise.resolve();
    const F = Grafik.farben();
    const farben = [F.rot, F.gelb, F.mint, F.cyan, F.magenta, F.weiss];
    const c = document.createElement('canvas');
    c.className = 'konfetti';
    document.body.append(c);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    const ctx = c.getContext('2d');
    const dauer = opt.jackpot ? 4200 : 2200;
    const n = opt.jackpot ? 180 : 80;
    const teile = [];
    function welle(anzahl, ausMitte) {
      for (let i = 0; i < anzahl; i++) {
        const w = ausMitte ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const v = (ausMitte ? 6 + Math.random() * 9 : 11 + Math.random() * 9) * dpr;
        teile.push({
          x: ausMitte ? W / 2 : W * (0.15 + Math.random() * 0.7), y: ausMitte ? H * 0.38 : H * 0.95,
          vx: Math.cos(w) * v, vy: Math.sin(w) * v, r: (5 + Math.random() * 6) * dpr, dreh: Math.random() * 6, vd: (Math.random() - 0.5) * 0.3,
          form: Math.random() < (opt.jackpot ? 0.45 : 0.25) ? 'stern' : (Math.random() < 0.5 ? 'rechteck' : 'kreis'),
          farbe: farben[Math.floor(Math.random() * farben.length)]
        });
      }
    }
    welle(n, false);
    if (opt.jackpot) { setTimeout(() => welle(90, true), 600); setTimeout(() => welle(90, false), 1500); }
    const start = performance.now();
    return new Promise(fertig => {
      function bild(jetzt) {
        const t = jetzt - start;
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = t > dauer - 600 ? Math.max(0, (dauer - t) / 600) : 1;
        ctx.lineWidth = 2.2 * dpr;
        ctx.strokeStyle = F.braun;
        teile.forEach(p => {
          p.vy += 0.32 * dpr; p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx; p.y += p.vy; p.dreh += p.vd;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.dreh); ctx.fillStyle = p.farbe;
          if (p.form === 'stern') { stern(ctx, p.r * 1.3); ctx.fill(); ctx.stroke(); }
          else if (p.form === 'kreis') { ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
          else { ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); ctx.strokeRect(-p.r, -p.r * 0.5, p.r * 2, p.r); }
          ctx.restore();
        });
        if (t < dauer) requestAnimationFrame(bild); else { c.remove(); fertig(); }
      }
      requestAnimationFrame(bild);
    });
  }

  window.Konfetti = { los };
})();
