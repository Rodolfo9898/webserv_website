/*
 * background.js - a living network behind every page: nodes drift, links appear between close ones, and small
 * glowing "packets" travel along the links (a request on its way). The cursor lights up nearby links.
 * Pauses when the tab is hidden, caps pixel ratio, and draws a single still frame under prefers-reduced-motion.
 */
(function () {
  'use strict';
  var LINK = 150;
  var canvas, ctx, w, h, dpr, nodes = [], packets = [], mouse = { x: -999, y: -999 }, raf = 0, rgb = [139, 120, 255], accent = [34, 211, 238];

  function hex(v) {
    v = v.replace('#', '');
    if (v.length === 3) v = v.replace(/(.)/g, '$1$1');
    var n = parseInt(v, 16);
    return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    rgb = hex(WS.theme.cssVar('--brand-1')) || rgb;
    accent = hex(WS.theme.cssVar('--brand-2')) || accent;
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(Math.min(70, Math.max(22, (w * h) / 26000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() < .12 ? 3.4 : 1.6, hub: false });
      nodes[i].hub = nodes[i].r > 3;
    }
    packets = [];
  }

  function spawnPacket() {
    var a = nodes[(Math.random() * nodes.length) | 0];
    var best = null, bd = LINK;
    nodes.forEach(function (b) {
      if (b === a) return;
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bd && Math.random() < .5) { bd = d; best = b; }
    });
    if (best) packets.push({ a: a, b: best, t: 0, v: .006 + Math.random() * .01, hot: Math.random() < .35 });
  }

  function draw(still) {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, d;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      if (!still) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      }
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = rgba(rgb, (1 - d / LINK) * .28);
          ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 190) {
        ctx.strokeStyle = rgba(accent, (1 - md / 190) * .55);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = a.hub ? rgba(accent, .9) : rgba(rgb, .75);
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      if (a.hub) { ctx.strokeStyle = rgba(accent, .25); ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 5, 0, 6.2832); ctx.stroke(); }
    }
    if (still) return;
    if (Math.random() < .07 && packets.length < 14) spawnPacket();
    packets = packets.filter(function (p) {
      p.t += p.v;
      if (p.t >= 1) return false;
      var x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      var c = p.hot ? accent : rgb;
      var g = ctx.createRadialGradient(x, y, 0, x, y, 12);
      g.addColorStop(0, rgba(c, .95)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12, 0, 6.2832); ctx.fill();
      return true;
    });
  }

  function loop() { draw(false); raf = requestAnimationFrame(loop); }

  function init() {
    canvas = document.getElementById('bg-net');
    if (!canvas || !canvas.getContext) return;
    ctx = canvas.getContext('2d');
    readColors(); resize();
    var timer;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(function () { resize(); if (WS.ui.fx.reduced) draw(true); }, 150); });
    window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    WS.bus.on('theme:changed', function () { readColors(); if (WS.ui.fx.reduced) draw(true); });
    if (WS.ui.fx.reduced) { draw(true); return; }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    });
    raf = requestAnimationFrame(loop);
  }

  WS.ns('ui.background', { init: init });
}());
