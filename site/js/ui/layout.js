/*
 * layout.js - builds the page shell (background, header, navigation, footer) around the <main> of every page.
 * Pages only ship their own content; the chrome comes from here and from data/nav.js, so a navigation change is
 * one edit. Bonus-only entries stay hidden until the server proves (features.edition) that it runs a bonus config.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs><linearGradient id="wsl" x1="0" y1="0" x2="32" y2="32">' +
    '<stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>' +
    '<rect width="32" height="32" rx="9" fill="url(#wsl)"/><path d="M6.5 11l4 10 5.5-8 5.5 8 4-10" stroke="#fff" stroke-width="2.3" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function background() {
    return el('div', { class: 'bg', 'aria-hidden': 'true' },
      el('div', { class: 'bg-orb o1' }), el('div', { class: 'bg-orb o2' }), el('div', { class: 'bg-orb o3' }),
      el('div', { class: 'bg-grid' }), el('canvas', { id: 'bg-net' }), el('div', { class: 'bg-noise' }), el('div', { class: 'bg-vignette' }));
  }

  function isActive(item, key) {
    return item.key === key || (item.items || []).some(function (i) { return i.key === key; });
  }

  function navItem(item, key) {
    if (!item.items) {
      return el('a', { class: 'nav-link' + (isActive(item, key) ? ' active' : ''), href: item.href }, item.label);
    }
    var links = item.items.map(function (s) {
      return el('a', { href: s.href, class: s.key === key ? 'active' : '' },
        el('span', { class: 'ico' }, WS.icon(s.icon)), el('b', { text: s.label }), el('small', { class: 'mute', text: s.desc }));
    });
    var group = el('div', { class: 'nav-group', hidden: !!item.bonus },
      el('button', { class: 'nav-link' + (isActive(item, key) ? ' active' : ''), 'aria-haspopup': 'true',
        onclick: function (e) { e.stopPropagation(); toggleGroup(group); } }, item.label, WS.icon('chevron', 'chev')),
      el('div', { class: 'menu' }, links));
    if (item.bonus) group.dataset.bonus = '1';
    return group;
  }

  function toggleGroup(group) {
    var wasOpen = group.classList.contains('open');
    WS.dom.$$('.nav-group.open').forEach(function (g) { g.classList.remove('open'); });
    if (!wasOpen) group.classList.add('open');
  }

  function themeButton() {
    var btn = el('button', { class: 'icon-btn', 'aria-label': 'Toggle colour theme', onclick: function () { WS.theme.toggle(); } });
    function paint() { WS.dom.clear(btn).appendChild(WS.icon(WS.theme.get() === 'dark' ? 'sun' : 'moon')); }
    paint();
    WS.bus.on('theme:changed', paint);
    return btn;
  }

  function liveChip() {
    var txt = el('span', { class: 'txt-long', text: 'checking...' });
    var chip = el('button', { class: 'live-chip', title: 'Click to ping the server', onclick: check }, el('i', { class: 'dot' }), txt);
    function check() {
      chip.className = 'live-chip';
      WS.net.features.ping().then(function (r) {
        chip.classList.add(r.up ? 'up' : 'down');
        txt.textContent = r.up ? ':' + (location.port || '80') + ' · ' + Math.max(1, Math.round(r.ms)) + ' ms' : 'server unreachable';
      });
    }
    check();
    setInterval(check, 30000);
    return chip;
  }

  function header(key) {
    var nav = el('nav', { class: 'nav', id: 'site-nav', 'aria-label': 'Main' }, WS.data.nav.map(function (i) { return navItem(i, key); }));
    var burger = el('button', { class: 'icon-btn burger', 'aria-label': 'Menu', 'aria-controls': 'site-nav',
      onclick: function (e) { e.stopPropagation(); nav.classList.toggle('open'); } }, WS.icon('menu'));
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-group')) WS.dom.$$('.nav-group.open').forEach(function (g) { g.classList.remove('open'); });
      if (!e.target.closest('.nav') && !e.target.closest('.burger')) nav.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { nav.classList.remove('open'); WS.dom.$$('.nav-group.open').forEach(function (g) { g.classList.remove('open'); }); }
    });
    var brand = el('a', { class: 'brand', href: '/', 'aria-label': 'webserv home' });
    brand.innerHTML = LOGO;
    brand.appendChild(el('span', { text: 'webserv' }));
    return el('header', { class: 'site-header' }, el('div', { class: 'hdr-inner' }, brand, nav, el('div', { class: 'hdr-tools' }, liveChip(), themeButton(), burger)));
  }

  function footer() {
    var links = [['/', 'Home'], ['/pages/crud.html', 'CRUD'], ['/cgi', 'CGI'], ['/pages/routes.html', 'Routes'], ['/pages/errors.html', 'Errors'], ['/pages/stress.html', 'Stress test']];
    return el('footer', { class: 'site-footer' }, el('div', { class: 'ftr-inner' },
      el('div', null, el('strong', { text: 'webserv' }), el('p', { text: 'An HTTP server written from scratch in C++98. This site is served by it.' }),
        el('p', { class: 'mute', text: 'A 42 project by rperez-t, jsteenpu and abaccari.' })),
      el('div', { class: 'ftr-links' }, links.map(function (l) { return el('a', { href: l[0], text: l[1] }); }))));
  }

  function init() {
    var body = document.body;
    var key = body.getAttribute('data-nav') || '';
    document.documentElement.classList.remove('no-js');
    /* Shown inside another page's preview frame: skip the chrome (see .embedded in labs.css). */
    if (window.top !== window.self) document.documentElement.classList.add('embedded');
    body.insertBefore(background(), body.firstChild);
    body.insertBefore(header(key), body.children[1] || null);
    body.appendChild(footer());
    WS.ui.background.init();
    WS.ui.fx.reveal(document);
    WS.dom.$$('[data-icon]').forEach(function (n) { n.appendChild(WS.icon(n.getAttribute('data-icon'))); });
    applyEdition(document).then(function (edition) { body.setAttribute('data-edition', edition); });
    WS.bus.emit('layout:ready', key);
  }

  /* Show or hide everything marked data-bonus under root, once the server has said which edition it runs. */
  function applyEdition(root) {
    return WS.net.features.edition().then(function (edition) {
      WS.dom.$$('[data-bonus]', root || document).forEach(function (n) { n.hidden = edition !== 'bonus'; });
      WS.ui.fx.reveal(root || document);
      return edition;
    });
  }

  WS.ns('ui.layout', { init: init, applyEdition: applyEdition });
  WS.ready(init);
}());
