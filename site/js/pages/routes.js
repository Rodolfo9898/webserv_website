/*
 * routes.js - the route explorer. Rows come from WS.data.routes (a copy of the .conf files); each "Try it" sends a
 * real GET to the route and shows the status inline, with the full inspector one click away.
 * Filtering is a Strategy table: each filter tab is just a predicate over a route.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var edition = 'base';
  var filter = 'all';
  var query = '';
  var open = {};

  var FILTERS = {
    all: ['All', function () { return true; }],
    static: ['Static', function (r) { return !r.cgi && !r.redirect && !r.upload && !r.autoindex; }],
    upload: ['Upload', function (r) { return r.upload; }],
    autoindex: ['Listing', function (r) { return r.autoindex; }],
    cgi: ['CGI', function (r) { return !!r.cgi; }],
    redirect: ['Redirect', function (r) { return !!r.redirect; }]
  };

  function features(r) {
    var out = [];
    if (r.autoindex) out.push(['list', 'listing on']);
    if (r.upload) out.push(['upload', 'uploads']);
    if (r.cgi) out.push(['terminal', 'CGI ' + (edition === 'bonus' && r.bonusCgi ? r.bonusCgi : r.cgi).join(' ')]);
    if (r.redirect) out.push(['redirect', 'to ' + r.redirect]);
    if (r.bonus) out.push(['gift', 'bonus']);
    return out;
  }

  function visible(r) {
    if (r.bonus && edition !== 'bonus') return false;
    if (!FILTERS[filter][1](r)) return false;
    return !query || (r.path + ' ' + r.what + ' ' + r.entry).toLowerCase().indexOf(query) >= 0;
  }

  function tryIt(r, cell, tr) {
    cell.textContent = '';
    cell.appendChild(el('span', { class: 'spinner' }));
    WS.net.http.get(r.tryPath).then(function (ex) {
      WS.dom.clear(cell);
      cell.appendChild(el('button', { class: 'btn sm', onclick: function () { tryIt(r, cell, tr); } }, WS.icon('play'), 'Again'));
      cell.appendChild(WS.net.status.badge(ex.status));
      cell.appendChild(el('button', { class: 'btn sm ghost', onclick: function () { open[r.path] = open[r.path] ? null : ex; paint(); } }, WS.icon('eye')));
      open[r.path] = ex;
      paint();
    });
  }

  function row(r) {
    var cell = el('td', { class: 'try-cell' });
    var tr = el('tr', { 'data-bonus': r.bonus ? '1' : null },
      el('td', null, el('span', { class: 'rpath', text: r.path }), el('span', { class: 'rwhat', text: r.what })),
      el('td', null, el('div', { class: 'methods' }, r.methods.map(function (m) { return el('span', { class: 'method ' + m.toLowerCase(), text: m }); }))),
      el('td', { class: 'maps' }, el('b', { text: 'folder ' }), r.entry, el('br'), r.defPage ? el('span', null, el('b', { text: 'default ' }), r.defPage) : null),
      el('td', null, el('div', { class: 'feats' }, features(r).map(function (f) { return el('span', { class: 'chip' + (f[0] === 'gift' ? ' bonus' : '') }, WS.icon(f[0]), f[1]); }))),
      cell);
    var done = open[r.path];
    if (done) {
      cell.appendChild(el('button', { class: 'btn sm', onclick: function () { tryIt(r, cell, tr); } }, WS.icon('play'), 'Again'));
      cell.appendChild(WS.net.status.badge(done.status));
      cell.appendChild(el('button', { class: 'btn sm ghost', 'aria-label': 'Details', onclick: function () { open[r.path] = null; paint(); } }, WS.icon('x')));
    } else {
      cell.appendChild(el('button', { class: 'btn sm primary', onclick: function () { tryIt(r, cell, tr); } }, WS.icon('play'), 'Try it'));
    }
    return tr;
  }

  function paint() {
    var body = $('#rows');
    WS.dom.clear(body);
    var list = WS.data.routes.filter(visible);
    list.forEach(function (r) {
      body.appendChild(row(r));
      if (open[r.path]) body.appendChild(el('tr', { class: 'rdetail' }, el('td', { colspan: '5' }, WS.ui.inspector.render(open[r.path], { compact: true }))));
    });
    $('#count').textContent = list.length + ' route' + (list.length === 1 ? '' : 's') + (edition === 'bonus' ? ' (bonus config)' : '') + ' shown';
  }

  Object.keys(FILTERS).forEach(function (k) {
    $('#filters').appendChild(el('button', { role: 'tab', 'aria-selected': String(k === filter), onclick: function () {
      filter = k;
      WS.dom.$$('#filters button').forEach(function (b) { b.setAttribute('aria-selected', String(b.textContent === FILTERS[k][0])); });
      paint();
    } }, FILTERS[k][0]));
  });
  $('#q').addEventListener('input', function (e) { query = e.target.value.toLowerCase(); paint(); });
  paint();
  WS.ui.layout.applyEdition(document).then(function (ed) { edition = ed; paint(); });
}());
