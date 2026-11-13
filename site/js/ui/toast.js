/* toast.js - non-blocking notifications. Singleton host, auto-dismiss, one call per kind. */
(function () {
  'use strict';
  var host = null;
  var ICONS = { ok: 'check', error: 'x', warn: 'alert', info: 'info' };

  function ensureHost() {
    if (!host) { host = WS.dom.el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(host); }
    return host;
  }

  function show(message, kind, ms) {
    kind = kind || 'info';
    var node = WS.dom.el('div', { class: 'toast ' + kind },
      WS.icon(ICONS[kind] || 'info'),
      WS.dom.el('div', { text: message }),
      WS.dom.el('button', { 'aria-label': 'Dismiss', onclick: function () { dismiss(node); } }, WS.icon('x'))
    );
    ensureHost().appendChild(node);
    setTimeout(function () { dismiss(node); }, ms || 4200);
    return node;
  }

  function dismiss(node) {
    if (!node.parentNode) return;
    node.classList.add('out');
    setTimeout(function () { if (node.parentNode) node.remove(); }, 300);
  }

  WS.ns('ui.toast', {
    show: show,
    ok: function (m) { return show(m, 'ok'); },
    error: function (m) { return show(m, 'error', 6000); },
    warn: function (m) { return show(m, 'warn'); },
    info: function (m) { return show(m, 'info'); }
  });
}());
