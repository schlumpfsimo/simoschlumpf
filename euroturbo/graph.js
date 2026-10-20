/* Kleiner kraftbasierter Netzwerk-Graph auf Canvas (ohne Abhängigkeiten). */
(function () {
  'use strict';
  function TurboGraph(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const G = { nodes: [], edges: [], sel: null, hover: null, tx: 0, ty: 0, scale: 1, running: false, alpha: 1, opts: opts || {} };
    let W = 0, H = 0, dpr = 1, raf = 0, drag = null, pinch = null, lastTap = 0;
    const byId = {};
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw();
    }
    function setData(nodes, edges) {
      const old = Object.fromEntries(G.nodes.map(n => [n.id, n]));
      G.nodes = nodes.map((n, i) => { const o = old[n.id]; const a = (i / nodes.length) * Math.PI * 2, r = Math.min(W, H) * 0.35 || 200;
        return { ...n, x: o ? o.x : W / 2 + Math.cos(a) * r, y: o ? o.y : H / 2 + Math.sin(a) * r, vx: 0, vy: 0, fixed: o ? o.fixed : false }; });
      Object.keys(byId).forEach(k => delete byId[k]); G.nodes.forEach(n => byId[n.id] = n);
      G.edges = edges.filter(e => byId[e.a] && byId[e.b]).map(e => ({ ...e, A: byId[e.a], B: byId[e.b] }));
      G.nodes.forEach(n => { n.deg = 0; }); G.edges.forEach(e => { e.A.deg++; e.B.deg++; });
      G.alpha = 1; start();
    }
    function tick() {
      const n = G.nodes, k = 0.02, rep = 1800, cx = W / 2, cy = H / 2;
      for (let i = 0; i < n.length; i++) { const a = n[i];
        for (let j = i + 1; j < n.length; j++) { const b = n[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy; if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
          if (d2 > 90000) continue; const f = rep / d2; const fx = dx * f, fy = dy * f; a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy; } }
      for (const e of G.edges) { const dx = e.B.x - e.A.x, dy = e.B.y - e.A.y; const d = Math.sqrt(dx * dx + dy * dy) || 1; const want = 60 + 40 / Math.max(1, e.w / 3); const f = (d - want) * k * Math.min(1, e.w / 6 + .3); const fx = dx / d * f, fy = dy / d * f; e.A.vx += fx; e.A.vy += fy; e.B.vx -= fx; e.B.vy -= fy; }
      for (const a of n) { a.vx += (cx - a.x) * 0.004; a.vy += (cy - a.y) * 0.004; if (a.fixed) { a.vx = a.vy = 0; continue; } a.vx *= 0.82; a.vy *= 0.82; a.x += a.vx * G.alpha; a.y += a.vy * G.alpha; }
      G.alpha = Math.max(0.02, G.alpha * 0.992);
    }
    function start() { if (!G.running) { G.running = true; loop(); } G.alpha = Math.max(G.alpha, 0.6); }
    function loop() { if (G.alpha > 0.03) tick(); draw(); raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); G.running = false; }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.save(); ctx.translate(G.tx, G.ty); ctx.scale(G.scale, G.scale);
      const selN = G.sel && byId[G.sel]; const neigh = new Set(); if (selN) for (const e of G.edges) { if (e.A === selN) neigh.add(e.B.id); if (e.B === selN) neigh.add(e.A.id); }
      for (const e of G.edges) { const hl = selN && (e.A === selN || e.B === selN); if (selN && !hl) continue;
        ctx.strokeStyle = hl ? (G.opts.hlColor || 'rgba(0,0,0,.85)') : (G.opts.edgeColor || 'rgba(0,0,0,.14)'); ctx.lineWidth = Math.min(6, 0.6 + e.w / 4) / G.scale; ctx.beginPath(); ctx.moveTo(e.A.x, e.A.y); ctx.lineTo(e.B.x, e.B.y); ctx.stroke(); }
      for (const a of G.nodes) { const r = (a.size || 6); const dim = selN && a !== selN && !neigh.has(a.id);
        ctx.globalAlpha = dim ? 0.25 : 1;
        if (a.ring) { ctx.beginPath(); ctx.arc(a.x, a.y, r + 3, 0, Math.PI * 2); ctx.strokeStyle = a.ring; ctx.lineWidth = 2 / G.scale; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, Math.PI * 2); ctx.fillStyle = a.color || '#888'; ctx.fill();
        if (a === selN || a === G.hover) { ctx.strokeStyle = G.opts.outline || '#000'; ctx.lineWidth = 2 / G.scale; ctx.stroke(); }
        if (G.scale > 0.9 || a === selN || a === G.hover || neigh.has(a.id) || a.always) { ctx.fillStyle = G.opts.labelColor || '#000'; ctx.font = `${Math.max(9, 11 / G.scale)}px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'center'; ctx.fillText(a.label, a.x, a.y + r + 11 / G.scale); }
        ctx.globalAlpha = 1; }
      ctx.restore();
    }
    function toWorld(px, py) { return { x: (px - G.tx) / G.scale, y: (py - G.ty) / G.scale }; }
    function nodeAt(px, py) { const p = toWorld(px, py); let best = null, bd = 1e9; for (const a of G.nodes) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < (a.size || 6) + 6 / G.scale && d < bd) { best = a; bd = d; } } return best; }
    function pos(ev) { const r = canvas.getBoundingClientRect(); const t = ev.touches ? ev.touches[0] : ev; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    canvas.addEventListener('pointerdown', ev => { const p = pos(ev); const n = nodeAt(p.x, p.y); canvas.setPointerCapture(ev.pointerId); drag = { n, sx: p.x, sy: p.y, tx: G.tx, ty: G.ty, moved: false }; if (n) { n.fixed = true; } });
    canvas.addEventListener('pointermove', ev => { const p = pos(ev); if (drag) { const dx = p.x - drag.sx, dy = p.y - drag.sy; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; if (drag.n) { const w = toWorld(p.x, p.y); drag.n.x = w.x; drag.n.y = w.y; start(); } else { G.tx = drag.tx + dx; G.ty = drag.ty + dy; draw(); } } else { const h = nodeAt(p.x, p.y); if (h !== G.hover) { G.hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; draw(); } } });
    canvas.addEventListener('pointerup', ev => { if (!drag) return; const p = pos(ev); if (!drag.moved) { const n = nodeAt(p.x, p.y); G.sel = n ? n.id : null; if (G.opts.onSelect) G.opts.onSelect(n ? n.id : null); draw(); } else if (drag.n) { setTimeout(() => { if (drag && drag.n) drag.n.fixed = false; }, 0); drag.n.fixed = false; } drag = null; });
    canvas.addEventListener('wheel', ev => { ev.preventDefault(); const p = pos(ev); const f = Math.exp(-ev.deltaY * 0.0015); zoomAt(p.x, p.y, f); }, { passive: false });
    canvas.addEventListener('touchstart', ev => { if (ev.touches.length === 2) { pinch = { d: Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY), s: G.scale }; } }, { passive: true });
    canvas.addEventListener('touchmove', ev => { if (pinch && ev.touches.length === 2) { ev.preventDefault(); const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY); const r = canvas.getBoundingClientRect(); const cx = (ev.touches[0].clientX + ev.touches[1].clientX) / 2 - r.left, cy = (ev.touches[0].clientY + ev.touches[1].clientY) / 2 - r.top; zoomAt(cx, cy, (pinch.s * d / pinch.d) / G.scale); } }, { passive: false });
    canvas.addEventListener('touchend', () => { pinch = null; });
    function zoomAt(px, py, f) { const ns = Math.min(4, Math.max(0.3, G.scale * f)); const w = toWorld(px, py); G.scale = ns; G.tx = px - w.x * ns; G.ty = py - w.y * ns; draw(); }
    function select(id) { G.sel = id; if (id && byId[id]) { const n = byId[id]; G.tx = W / 2 - n.x * G.scale; G.ty = H / 2 - n.y * G.scale; } draw(); }
    function fit() { if (!G.nodes.length) return; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const a of G.nodes) { x0 = Math.min(x0, a.x); y0 = Math.min(y0, a.y); x1 = Math.max(x1, a.x); y1 = Math.max(y1, a.y); } const s = Math.min(3, 0.9 * Math.min(W / Math.max(1, x1 - x0 + 40), H / Math.max(1, y1 - y0 + 40))); G.scale = s; G.tx = W / 2 - (x0 + x1) / 2 * s; G.ty = H / 2 - (y0 + y1) / 2 * s; draw(); }
    window.addEventListener('resize', resize); resize();
    return { setData, select, fit, stop, start, get sel() { return G.sel; } };
  }
  window.TurboGraph = TurboGraph;
})();
