/*
 * traffic.js - the "network tap": a small pill in the corner that lists every request the page made through
 * WS.net.http, newest first, and opens any of them in the inspector. Pure Observer: it only listens to the bus.
 * Pages that generate heavy traffic on purpose (the stress test) switch it off with <body data-tap="off">.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var MAX = 40;
  var items = [];
  var pill, list, panel, root, countNode, openId = null, isOpen = false;

  function build() {
    countNode = el('span', { text: '0' });
    pill = el('button', { class: 'tap-pill', 'aria-expanded': 'false', onclick: toggle }, WS.icon('activity'), 'Traffic ', countNode);
    list = el('div', { class: 'tap-list' });
    panel = el('div', { class: 'tap-panel', hidden: true },
      el('header', null, 'Requests made by this page',
        el('button', { class: 'btn sm ghost', onclick: function () { items = []; openId = null; paint(); } }, 'Clear')),
      list);
    root = el('div', { class: 'tap' }, panel, pill);
    document.body.appendChild(root);
  }

  function toggle() {
    isOpen = !isOpen;
    panel.hidden = !isOpen;
    pill.setAttribute('aria-expanded', String(isOpen));
  }

  function paint() {
    countNode.textContent = items.length;
    WS.dom.clear(list);
    items.forEach(function (ex) {
      var d = WS.net.status.describe(ex.status);
      list.appendChild(el('button', { class: 'tap-item', onclick: function () { openId = openId === ex.id ? null : ex.id; paint(); } },
        el('span', { class: 'method ' + ex.method.toLowerCase(), text: ex.method }),
        el('span', { class: 'p', title: ex.path, text: ex.path }),
        el('span', { class: 'status ' + d.cls, text: ex.status || 'ERR' }),
        el('span', { class: 'ms', text: WS.fmt.ms(ex.ms) })));
      if (openId === ex.id) list.appendChild(el('div', { class: 'tap-detail' }, WS.ui.inspector.render(ex, { compact: true })));
    });
  }

  WS.bus.on('http:exchange', function (ex) {
    if (document.body.getAttribute('data-tap') === 'off') return;
    if (!root) build();
    items.unshift(ex);
    if (items.length > MAX) items.pop();
    paint();
  });
}());
