/*
 * effects.js - small, reusable motion helpers.
 *   reveal()     fade/slide elements marked data-reveal as they enter the viewport (IntersectionObserver)
 *   spotlight()  feed --mx/--my to every .card.spot so the glow follows the cursor
 *   countUp()    animate a number from 0 to its target
 *   confetti()   one-shot celebration burst on a canvas (used by the upload success)
 */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('no-motion');

  function reveal(root) {
    var nodes = WS.dom.$$('[data-reveal]:not(.in)', root);
    if (!('IntersectionObserver' in window) || reduced) { nodes.forEach(function (n) { n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n, i) { if (!n.style.getPropertyValue('--d')) n.style.setProperty('--d', Math.min(i % 6, 5) * 70 + 'ms'); io.observe(n); });
  }

  function spotlight() {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.card.spot');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  function countUp(node, to, ms, suffix) {
    suffix = suffix || '';
    if (reduced || !isFinite(to)) { node.textContent = to + suffix; return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / (ms || 1200));
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(to * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }(t0));
  }

  function confetti(canvas) {
    if (reduced || !canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * 2;
    var h = canvas.height = canvas.offsetHeight * 2;
    var palette = ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    var bits = [];
    for (var i = 0; i < 140; i++) {
      bits.push({ x: w / 2, y: h * 0.38, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 20 - 4, s: Math.random() * 10 + 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: palette[i % palette.length] });
    }
    var t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, w, h);
      bits.forEach(function (b) {
        b.vy += 0.5; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.vx *= 0.99;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
        ctx.globalAlpha = Math.max(0, 1 - (now - t0) / 2600);
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
      });
      if (now - t0 < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
    }(t0));
  }

  WS.ns('ui.fx', { reveal: reveal, spotlight: spotlight, countUp: countUp, confetti: confetti, reduced: reduced });
  WS.ready(function () { spotlight(); });
}());
