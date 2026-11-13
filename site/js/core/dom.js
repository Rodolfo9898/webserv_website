/*
 * dom.js - safe DOM construction + formatting helpers.
 * Pattern: Factory. WS.dom.el() builds nodes from plain descriptions; text is always textContent (never innerHTML),
 * so anything that came from the network (file names, headers, bodies) cannot inject markup.
 */
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* el('button', { class: 'btn', onclick: fn, dataset: { id: 1 } }, 'Label', child, ...) */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var v = attrs[key];
      if (v === undefined || v === null || v === false) return;
      if (key === 'class') node.className = v;
      else if (key === 'dataset') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
      else if (key === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { node.style.setProperty(s, v[s]); });
      else if (key === 'text') node.textContent = v;
      else if (key === 'html') node.innerHTML = v; /* only ever fed with trusted literals from this repo */
      else if (key.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(key.slice(2), v);
      else node.setAttribute(key, v === true ? '' : v);
    });
    append(node, Array.prototype.slice.call(arguments, 2));
    return node;
  }

  function append(node, children) {
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) append(node, c);
      else node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* Event delegation: on(root, 'click', '[data-act]', handler) */
  function on(root, type, selector, handler) {
    root.addEventListener(type, function (e) {
      var target = e.target.closest && e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    });
  }

  var fmt = {
    bytes: function (n) {
      if (n === null || n === undefined || isNaN(n)) return '-';
      if (n < 1024) return n + ' B';
      var units = ['KB', 'MB', 'GB'];
      var i = -1;
      do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
      return n.toFixed(n < 10 ? 1 : 0) + ' ' + units[i];
    },
    ms: function (n) { return n < 1 ? '<1 ms' : n < 1000 ? Math.round(n) + ' ms' : (n / 1000).toFixed(2) + ' s'; },
    ext: function (name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; },
    clamp: function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    pad: function (n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; },
    clock: function (d) { d = d || new Date(); return fmt.pad(d.getHours()) + ':' + fmt.pad(d.getMinutes()) + ':' + fmt.pad(d.getSeconds()); },
    number: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); },
    percentile: function (sorted, p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0; }
  };

  /* Copy to clipboard with a graceful fallback (clipboard API needs a secure context). */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var area = el('textarea', { style: { position: 'fixed', opacity: '0' } });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } finally { area.remove(); }
    return Promise.resolve();
  }

  WS.ns('dom', { $: $, $$: $$, el: el, clear: clear, on: on, copy: copy });
  WS.ns('fmt', fmt);
}());
