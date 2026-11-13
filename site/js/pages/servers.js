/*
 * servers.js - cards for every server the repository's configs declare, with a live reachability probe per port,
 * and framed previews of the two servers of multiServerConfig.conf. Probing other ports is cross-origin, so only
 * "answers / does not answer" and latency are known, which is exactly what the cards claim.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var pills = {};
  var overlays = {};

  function card(s) {
    var pill = el('span', { class: 'pill' }, el('i'), el('span', { text: 'checking...' }));
    pills[s.port] = pill;
    var open = el('a', { class: 'btn sm primary', href: WS.net.features.origin(s.port) + (s.page ? '' : '/') }, WS.icon('arrow'), 'Open');
    return el('article', { class: 'card srv-big spot', 'data-reveal': true },
      el('div', { class: 'head' }, el('span', { class: 'port', text: ':' + s.port }), pill),
      el('h3', { text: s.label }),
      el('p', { class: 'mt', text: s.note }),
      el('dl', { class: 'kv mt' },
        el('dt', { text: 'listen' }), el('dd', { text: '127.0.0.1:' + s.port }),
        el('dt', { text: 'domains' }), el('dd', { text: s.domains.join('  ') }),
        el('dt', { text: 'bodySize' }), el('dd', { text: s.bodySize }),
        el('dt', { text: 'routes' }), el('dd', { text: s.routes + '  ·  ' + s.errors + ' custom error pages' }),
        el('dt', { text: 'config' }), el('dd', { text: s.config })),
      el('div', { class: 'row mt' }, open, el('button', { class: 'btn sm', onclick: function () { WS.dom.copy('./webserv config/' + s.config).then(function () { WS.ui.toast.ok('Start command copied'); }); } }, WS.icon('copy'), 'Copy start command')));
  }

  function frame(s) {
    var off = el('div', { class: 'off', hidden: true }, el('div', null, WS.icon('server'), el('p', { text: 'Not running. Start ./webserv config/' + s.config })));
    overlays[s.port] = off;
    return el('div', { class: 'frame-box', 'data-reveal': true },
      el('header', null, el('span', { text: location.hostname + ':' + s.port }), el('span', { text: s.label })),
      el('div', { class: 'vp' }, el('iframe', { src: WS.net.features.origin(s.port) + '/', title: s.label, loading: 'lazy', tabindex: '-1' }), off));
  }

  function probeAll() {
    WS.data.servers.forEach(function (s) {
      var pill = pills[s.port];
      pill.className = 'pill';
      pill.lastChild.textContent = 'checking...';
      WS.net.features.probe(s.port).then(function (r) {
        pill.classList.add(r.up ? 'up' : 'down');
        pill.lastChild.textContent = r.up ? 'online · ' + Math.max(1, Math.round(r.ms)) + ' ms' : 'not running';
        if (overlays[s.port]) overlays[s.port].hidden = r.up;
      });
    });
  }

  WS.data.servers.forEach(function (s) { $('#grid').appendChild(card(s)); });
  WS.data.servers.filter(function (s) { return s.id.indexOf('multi') === 0; }).forEach(function (s) { $('#frames').appendChild(frame(s)); });
  $('#probe').addEventListener('click', probeAll);
  probeAll();
  WS.ui.fx.reveal(document);
}());
