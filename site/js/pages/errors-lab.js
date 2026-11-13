/*
 * errors-lab.js - one card per configured error page: a scaled live preview of the real page, a "Trigger" button for
 * the errors a browser can cause (404 and 405), and a copyable command for the ones it cannot (400, 413, 5xx).
 * A request the browser cannot produce is not faked: the card says how to produce it.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var host = location.host || 'localhost:4442';
  var out = WS.ui.inspector.mount($('#out'), 'Press a Trigger button above.');

  var CARDS = [
    { code: 400, name: 'Bad Request', color: '#fbbf24', text: 'The request could not be parsed: a broken request line, a bad header, an invalid body.',
      cmd: "printf 'THIS IS NOT HTTP\\r\\n\\r\\n' | nc " + host.replace(':', ' ') },
    { code: 404, name: 'Not Found', color: '#22d3ee', text: 'No route matches the URL, or the file is not in the folder the route points to.',
      live: { method: 'GET', path: '/this-page-does-not-exist' } },
    { code: 405, name: 'Method Not Allowed', color: '#fb923c', text: 'The route exists but its method list does not include this verb. The home route only takes GET.',
      live: { method: 'DELETE', path: '/' } },
    { code: 413, name: 'Payload Too Large', color: '#f472b6', text: 'The body is bigger than the bodySize limit. Set a small bodySize on a server with a POST route, then send more than that.',
      cmd: 'head -c 5000 /dev/zero | curl -i -X POST --data-binary @- http://' + host + '/post' },
    { code: 500, name: 'Server Error', color: '#f87171', text: 'The server failed on a valid request, for example a CGI script that crashes. The same page serves 502 and 504.',
      cmd: 'curl -i http://' + host + '/cgi-bin/<a-script-that-exits-with-an-error>.py' }
  ];

  function trigger(card, result) {
    out.loading(card.live.method + ' ' + card.live.path);
    WS.net.http.request(card.live.method, card.live.path).then(function (ex) {
      out.show(ex);
      WS.dom.clear(result).appendChild(WS.net.status.badge(ex.status));
      $('#out').scrollIntoView({ behavior: WS.ui.fx.reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  CARDS.forEach(function (c) {
    var result = el('span');
    var action;
    if (c.live) {
      action = el('div', { class: 'row' },
        el('button', { class: 'btn sm primary', onclick: function () { trigger(c, result); } }, WS.icon('zap'), 'Trigger ' + c.live.method + ' ' + c.live.path), result);
    } else {
      action = el('div', { class: 'cmd' }, el('span', { text: c.cmd }),
        el('button', { class: 'icon-btn', 'aria-label': 'Copy the command', onclick: function () { WS.dom.copy(c.cmd).then(function () { WS.ui.toast.ok('Command copied'); }); } }, WS.icon('copy')));
    }
    var file = '/errors/error' + c.code + '.html';
    $('#grid').appendChild(el('article', { class: 'card lab-card', style: { '--ec': c.color }, 'data-reveal': true },
      el('div', { class: 'preview' }, el('iframe', { src: file, loading: 'lazy', title: c.code + ' page preview', tabindex: '-1' })),
      el('div', { class: 'body' },
        el('div', { class: 'head' }, el('span', { class: 'code', text: c.code }), el('a', { class: 'btn sm ghost', href: file, target: '_blank', rel: 'noopener' }, WS.icon('external'), 'Open page')),
        el('strong', { text: c.name }), el('p', { text: c.text }), action)));
  });

  /* ---- Gallery: every page of the catalog, filterable, previewed in a dialog ---- */
  var CATALOG = WS.data.errorCatalog.slice().sort(function (a, b) { return a.code - b.code; });
  var dialog = $('#preview');
  var galFilter = 'all';
  var galQuery = '';
  var GAL = {
    all: ['All', function () { return true; }],
    client: ['4xx client', function (e) { return e.kind === 'client'; }],
    server: ['5xx server', function (e) { return e.kind === 'server'; }],
    used: ['In use', function (e) { return inUse(e); }]
  };
  function inUse(e) { return WS.data.errors.some(function (c) { return c.file === '/site/errors/error' + e.code + '.html'; }); }

  function preview(e) {
    var file = '/errors/error' + e.code + '.html';
    WS.dom.clear(dialog);
    dialog.appendChild(el('header', null, el('span', { text: e.code + ' ' + e.name }),
      el('div', { class: 'row' }, el('a', { class: 'btn sm', href: file, target: '_blank', rel: 'noopener' }, WS.icon('external'), 'Open'), el('button', { class: 'btn sm ghost', onclick: function () { dialog.close ? dialog.close() : dialog.removeAttribute('open'); } }, WS.icon('x'), 'Close'))));
    dialog.appendChild(el('iframe', { src: file, title: e.code + ' ' + e.name }));
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function paintGallery() {
    var box = $('#gallery');
    WS.dom.clear(box);
    CATALOG.filter(function (e) {
      return GAL[galFilter][1](e) && (!galQuery || (e.code + ' ' + e.name).toLowerCase().indexOf(galQuery) >= 0);
    }).forEach(function (e) {
      box.appendChild(el('button', { class: 'tile', style: { '--ec': e.color }, onclick: function () { preview(e); } },
        el('b', { text: e.code }), el('span', { text: e.name }), el('small', { class: 'mute', text: e.kind === 'client' ? 'client error' : 'server error' }),
        inUse(e) ? el('span', { class: 'chip on' }, WS.icon('check'), 'in use') : null));
    });
    if (!box.children.length) box.appendChild(el('div', { class: 'empty' }, 'No error page matches this filter.'));
  }
  $('#total').textContent = CATALOG.length;
  Object.keys(GAL).forEach(function (k) {
    $('#gal-tabs').appendChild(el('button', { role: 'tab', 'aria-selected': String(k === galFilter), onclick: function () {
      galFilter = k;
      WS.dom.$$('#gal-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.textContent === GAL[k][0])); });
      paintGallery();
    } }, GAL[k][0]));
  });
  $('#gal-q').addEventListener('input', function (ev) { galQuery = ev.target.value.toLowerCase(); paintGallery(); });
  paintGallery();

  Object.keys(WS.net.status.EXACT).forEach(function (code) {
    var d = WS.net.status.describe(Number(code));
    $('#codes').appendChild(el('tr', null, el('td', null, el('span', { class: 'status ' + d.cls, text: code })), el('td', { text: d.phrase }), el('td', { class: 'dim', text: d.meaning })));
  });
}());
