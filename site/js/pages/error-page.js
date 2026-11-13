/*
 * error-page.js - turns the static error markup into the full experience: what the code means, what was asked for,
 * and the exact config line that makes the server use THIS page. The page is the same file the server returns for
 * the status code, so it reads the code from data-code and the requested path from location (the server answers at
 * the original URL). Texts come from the catalog in data/errors4.js and data/errors5.js.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var TEAPOT = '<svg class="teapot" viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path class="steam" d="M44 22c-5-6 5-9 0-16M60 22c-5-6 5-9 0-16M76 22c-5-6 5-9 0-16"/>' +
    '<path d="M30 52c0-16 12-24 30-24s30 8 30 24v10c0 14-12 24-30 24S30 76 30 62z"/><path d="M45 28h30"/><path d="M60 28v-4"/>' +
    '<path d="M90 48c14-2 18 8 12 16-3 4-8 5-12 5"/><path d="M30 50c-10-6-16-2-18 4 2 6 8 8 14 8"/><path d="M42 88h36"/></svg>';

  var main = WS.dom.$('main.err');
  if (!main) return;
  var code = Number(main.getAttribute('data-code'));
  var list = WS.data.errorCatalog.slice().sort(function (a, b) { return a.code - b.code; });
  var at = list.findIndex(function (e) { return e.code === code; });
  var entry = list[at] || { code: code, name: 'Error', color: '#a78bfa', lead: '', hints: [] };
  var d = WS.net.status.describe(code);
  var card = WS.dom.$('.err-card', main);
  var file = '/site/errors/error' + code + '.html';
  var line = 'errors ' + file + ' [' + code + '] ;';

  main.style.setProperty('--ec', entry.color);
  var codeEl = WS.dom.$('.err-code', main);
  if (codeEl) codeEl.setAttribute('data-text', code);
  if (code === 418) card.insertBefore(el('div', { class: 'teapot-wrap', html: TEAPOT }), card.firstChild);

  /* Is this status code already routed to a page by the configs, and to which one? */
  var mapped = WS.data.errors.filter(function (e) { return e.codes.indexOf(code) >= 0; })[0];
  var status = !mapped ? ['off', 'Not selected by the current configs: the server uses its built-in page for ' + code + '. Add the line below to a Server block to use this one.']
    : mapped.file === file ? ['on', 'Already selected by the configs: this is the page the server sends for ' + code + '.']
      : ['warn', 'The configs send ' + code + ' to ' + mapped.file.split('/').pop() + '. Use the line below to point it here instead.'];

  var path = decodeURIComponent(location.pathname + location.search);
  var kv = el('dl', { class: 'kv' },
    el('dt', { text: 'requested' }), el('dd', { text: path }),
    el('dt', { text: 'status' }), el('dd', { text: code + ' ' + d.phrase }),
    el('dt', { text: 'class' }), el('dd', { text: d.familyName }));

  card.appendChild(el('div', { class: 'err-info' },
    el('div', { class: 'card' }, el('h4', { text: 'What was asked' }), kv),
    el('div', { class: 'card' }, el('h4', { text: 'What it means here' }), el('ul', null, entry.hints.map(function (t) { return el('li', { text: t }); })))));

  card.appendChild(el('div', { class: 'card err-config' },
    el('div', { class: 'row between' }, el('h4', { text: 'Use this page in the config' }), el('span', { class: 'chip ' + status[0], text: status[0] === 'on' ? 'in use' : status[0] === 'warn' ? 'remap' : 'not mapped' })),
    el('p', { text: status[1] }),
    el('div', { class: 'cmd' }, el('span', { text: line }),
      el('button', { class: 'icon-btn', 'aria-label': 'Copy the config line', onclick: function () { WS.dom.copy(line).then(function () { WS.ui.toast.ok('Config line copied'); }); } }, WS.icon('copy')))));

  /* Previous / next code, and the gallery. */
  function sibling(e, dir) {
    return e ? el('a', { class: 'btn sm ghost', href: '/errors/error' + e.code + '.html' }, dir < 0 ? WS.icon('back') : null, e.code + ' ' + e.name, dir > 0 ? WS.icon('arrow') : null) : null;
  }
  card.appendChild(el('div', { class: 'err-nav' }, sibling(list[at - 1], -1), el('a', { class: 'btn sm', href: '/pages/errors.html' }, WS.icon('alert'), 'All ' + list.length + ' error pages'), sibling(list[at + 1], 1)));

  if (history.length > 1) {
    WS.dom.$('.err-actions', main).appendChild(el('button', { class: 'btn ghost', onclick: function () { history.back(); } }, WS.icon('back'), 'Go back'));
  }
}());
