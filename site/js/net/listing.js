/*
 * listing.js - Adapter: turns the HTML directory listing the server generates (route with "treeVieuw on")
 * into plain entities. The only contract with the server is its markup: links inside `.styled-list`.
 */
(function () {
  'use strict';

  /* html -> [{ name, href, dir }]; the parent link (..) and dotfiles (like .placeholder) are infrastructure, not content. */
  function parse(html, baseUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var links = WS.dom.$$('.styled-list a', doc);
    if (!links.length) links = WS.dom.$$('a', doc);
    var base = new URL(baseUrl, location.href);
    var out = [];
    links.forEach(function (a) {
      var raw = a.getAttribute('href') || '';
      var label = (a.textContent || '').trim();
      if (!raw || label === '..' || /(^|\/)\.\.\/?$/.test(raw)) return;
      var url = new URL(raw, base);
      var dir = /\/$/.test(url.pathname) || /\/$/.test(label);
      var name = decodeURIComponent(url.pathname.replace(/\/$/, '').split('/').pop() || label);
      if (!name || name.charAt(0) === '.') return;
      out.push({ name: name, href: url.pathname, dir: dir });
    });
    return out;
  }

  WS.ns('net.listing', { parse: parse });
}());
