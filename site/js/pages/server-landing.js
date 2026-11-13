/*
 * server-landing.js - the home page of the two servers started by multiServerConfig.conf (indexServer2.html on
 * :4444, indexServer3.html on :4445). Same code, different <body data-server="...">: the data in
 * WS.data.servers supplies the port, the domains and the limits, so each page states what ITS config says.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var me = WS.data.servers.filter(function (s) { return s.id === document.body.getAttribute('data-server'); })[0];
  var main = WS.dom.$('#server');
  if (!me) return;
  var others = WS.data.servers.filter(function (s) { return s !== me; });

  function neighbor(s) {
    var state = el('span', { class: 'state' }, el('i'), el('span', { text: 'checking...' }));
    var card = el('a', { class: 'card srv-card lift', href: WS.net.features.origin(s.port) + '/' },
      el('span', { class: 'port', text: ':' + s.port }), el('strong', { text: s.label }), el('small', { text: s.note }), state);
    WS.net.features.probe(s.port).then(function (r) {
      card.classList.add(r.up ? 'up' : 'down');
      state.lastChild.textContent = r.up ? 'online · ' + Math.max(1, Math.round(r.ms)) + ' ms' : 'not running';
    });
    return card;
  }

  main.appendChild(el('section', { class: 'srv-hero', 'data-reveal': true },
    el('span', { class: 'eyebrow' }, WS.icon('server'), 'You are talking to'),
    el('div', { class: 'srv-port' }, ':' + me.port),
    el('h1', null, me.label),
    el('p', { class: 'lead', text: 'This page is served by the ' + (me.id === 'multi-a' ? 'first' : 'second') + ' Server block of ' + me.config + '. Another block of the same file answers on the neighbouring port, inside the same process.' }),
    el('div', { class: 'row center' },
      el('span', { class: 'chip on' }, WS.icon('check'), 'bodySize ' + me.bodySize),
      el('span', { class: 'chip' }, WS.icon('route'), me.routes + ' route'),
      el('span', { class: 'chip' }, WS.icon('alert'), me.errors + ' custom error pages'),
      me.domains.map(function (d) { return el('span', { class: 'chip' }, WS.icon('globe'), d); }))));

  main.appendChild(el('section', { class: 'section' },
    el('div', { class: 'sec-head', 'data-reveal': true }, el('h2', { text: 'The other servers' }), el('p', { text: 'Same code, other configuration. Follow a link to switch.' })),
    el('div', { class: 'mini-servers' }, others.map(neighbor))));

  main.appendChild(el('div', { class: 'row center mt-lg' },
    el('a', { class: 'btn primary', href: '/pages/servers.html' }, WS.icon('server'), 'Compare all servers'),
    el('a', { class: 'btn ghost', href: WS.net.features.origin(4442) + '/' }, WS.icon('home'), 'Main site on :4442')));
  WS.ui.fx.reveal(main);
}());
