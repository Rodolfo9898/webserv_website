/*
 * linechart.js - a small SVG line chart for live data (one series per chart, never a dual axis).
 * Anatomy follows the dataviz rules: 2px line, ~10% area wash, 8px end-dot with a 2px surface ring, solid hairline
 * grid, text in text tokens (never the series colour), hover crosshair + tooltip, keyboard stepping, and a table
 * view with the same numbers. Points are { t: seconds, v: number }.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var el = WS.dom.el;

  function s(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = String(attrs[k]);
      /* CSS variables are most reliable as style properties, not presentation attributes. */
      if (v.indexOf('var(') === 0) n.style.setProperty(k, v); else n.setAttribute(k, v);
    });
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  function create(container, o) {
    var W = 640, H = 210, L = 52, R = 22, T = 16, B = 30;
    var pts = [];
    var focus = -1;
    var color = 'var(' + (o.color || '--chart-1') + ')';
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lc', role: 'img', 'aria-label': o.title });
    var tip = el('div', { class: 'lc-tip', hidden: true });
    var wrap = el('div', { class: 'lc-wrap', tabindex: '0' }, svg, tip);
    var tableBox = el('div', { class: 'table-wrap', hidden: true });
    var toggle = el('button', { class: 'btn sm ghost', 'aria-pressed': 'false', onclick: function () {
      var show = tableBox.hidden;
      tableBox.hidden = !show;
      wrap.hidden = show;
      toggle.setAttribute('aria-pressed', String(show));
      toggle.textContent = show ? 'Chart view' : 'Table view';
      if (show) paintTable();
    } }, 'Table view');

    container.appendChild(el('div', { class: 'card lc-card' },
      el('div', { class: 'row between' }, el('div', null, el('h4', { text: o.title }), el('small', { text: o.subtitle || '' })), toggle), wrap, tableBox));

    var max = function () { return niceMax(Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([o.minMax || 1]))); };
    var px = function (i) { return L + (W - L - R) * (pts.length > 1 ? i / (pts.length - 1) : 0); };
    var py = function (v, m) { return T + (H - T - B) * (1 - v / m); };

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var m = max();
      for (var g = 0; g <= 4; g++) {
        var gy = T + (H - T - B) * g / 4;
        svg.appendChild(s('line', { x1: L, x2: W - R, y1: gy, y2: gy, stroke: 'var(--chart-grid)', 'stroke-width': 1 }));
        svg.appendChild(s('text', { x: L - 8, y: gy + 4, 'text-anchor': 'end', class: 'lc-tick' }, o.format(m * (1 - g / 4), true)));
      }
      if (!pts.length) return;
      svg.appendChild(s('text', { x: L, y: H - 8, class: 'lc-tick' }, '0 s'));
      svg.appendChild(s('text', { x: W - R, y: H - 8, 'text-anchor': 'end', class: 'lc-tick' }, pts[pts.length - 1].t.toFixed(1) + ' s'));
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.v, m).toFixed(1); }).join(' ');
      var base = py(0, m).toFixed(1);
      svg.appendChild(s('path', { d: d + ' L' + px(pts.length - 1).toFixed(1) + ' ' + base + ' L' + px(0).toFixed(1) + ' ' + base + ' Z', fill: color, 'fill-opacity': '.1' }));
      svg.appendChild(s('path', { d: d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      var i = focus >= 0 ? focus : pts.length - 1;
      if (focus >= 0) svg.appendChild(s('line', { x1: px(i), x2: px(i), y1: T, y2: H - B, stroke: 'var(--border-strong)', 'stroke-width': 1 }));
      svg.appendChild(s('circle', { cx: px(i), cy: py(pts[i].v, m), r: 4.5, fill: color, stroke: 'var(--bg-elev)', 'stroke-width': 2 }));
    }

    function showTip(i) {
      focus = i;
      var m = max();
      var p = pts[i];
      WS.dom.clear(tip).appendChild(el('div', null, el('small', { text: p.t.toFixed(1) + ' s' }),
        el('div', { class: 'lc-val' }, el('i', { style: { background: color } }), el('strong', { text: o.format(p.v) }))));
      tip.hidden = false;
      var rect = svg.getBoundingClientRect();
      tip.style.left = Math.min(rect.width - 110, Math.max(0, px(i) / W * rect.width - 40)) + 'px';
      tip.style.top = Math.max(0, py(p.v, m) / H * rect.height - 62) + 'px';
      render();
    }
    function hideTip() { focus = -1; tip.hidden = true; render(); }

    svg.addEventListener('pointermove', function (e) {
      if (!pts.length) return;
      var rect = svg.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width * W;
      showTip(WS.fmt.clamp(Math.round((x - L) / (W - L - R) * (pts.length - 1)), 0, pts.length - 1));
    });
    svg.addEventListener('pointerleave', hideTip);
    wrap.addEventListener('keydown', function (e) {
      if (!pts.length || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      showTip(WS.fmt.clamp((focus < 0 ? pts.length - 1 : focus) + (e.key === 'ArrowLeft' ? -1 : 1), 0, pts.length - 1));
    });
    wrap.addEventListener('blur', hideTip);

    function paintTable() {
      WS.dom.clear(tableBox).appendChild(el('table', { class: 'table' },
        el('thead', null, el('tr', null, el('th', { text: 'Time' }), el('th', { text: o.title }))),
        el('tbody', null, pts.slice(-60).reverse().map(function (p) { return el('tr', null, el('td', { class: 'mono', text: p.t.toFixed(1) + ' s' }), el('td', { class: 'mono', text: o.format(p.v) })); }))));
    }

    render();
    return {
      push: function (p) { pts.push(p); if (pts.length > (o.maxPoints || 120)) pts.shift(); if (focus < 0) render(); if (!tableBox.hidden) paintTable(); },
      clear: function () { pts = []; focus = -1; tip.hidden = true; render(); }
    };
  }

  WS.ns('ui.lineChart', { create: create });
}());
