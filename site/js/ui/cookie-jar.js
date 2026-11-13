/*
 * cookie-jar.js - a live view of document.cookie: what the browser will send in the Cookie header of the next
 * request, one row per cookie, with delete buttons and a small form to add one. Cookies set by the server with
 * HttpOnly never show here (JavaScript cannot see them), which is the point of HttpOnly.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  function read() {
    return document.cookie ? document.cookie.split('; ').map(function (pair) {
      var i = pair.indexOf('=');
      return { name: decodeURIComponent(pair.slice(0, i)), value: decodeURIComponent(pair.slice(i + 1)) };
    }) : [];
  }
  function write(name, value, days) {
    var expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
    document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    WS.bus.emit('cookies:changed');
  }
  function erase(name) {
    document.cookie = encodeURIComponent(name) + '=; Max-Age=0; path=/';
    WS.bus.emit('cookies:changed');
  }

  function mount(container, opts) {
    opts = opts || {};
    var header = el('code', { class: 'jar-header' });
    var rows = el('div', { class: 'jar-rows' });
    var name = el('input', { class: 'input', placeholder: 'name', 'aria-label': 'Cookie name', maxlength: '40' });
    var value = el('input', { class: 'input', placeholder: 'value', 'aria-label': 'Cookie value', maxlength: '120' });
    var form = el('form', { class: 'jar-form', onsubmit: function (e) {
      e.preventDefault();
      if (!name.value.trim()) return;
      write(name.value.trim(), value.value, 7);
      name.value = value.value = '';
    } }, name, value, el('button', { class: 'btn sm primary', type: 'submit' }, WS.icon('plus'), 'Set'));

    container.appendChild(el('div', { class: 'jar' },
      el('small', { class: 'mute', text: 'The browser sends this header with every request to this host' }), header, rows, opts.readOnly ? null : form));

    function paint() {
      var jar = read();
      header.textContent = jar.length ? 'Cookie: ' + jar.map(function (c) { return c.name + '=' + c.value; }).join('; ') : '(no cookies yet: no Cookie header is sent)';
      WS.dom.clear(rows);
      jar.forEach(function (c) {
        rows.appendChild(el('div', { class: 'jar-row' }, el('code', { text: c.name }), el('span', { class: 'truncate', text: c.value }),
          opts.readOnly ? null : el('button', { class: 'icon-btn', 'aria-label': 'Delete cookie ' + c.name, onclick: function () { erase(c.name); } }, WS.icon('x'))));
      });
    }
    WS.bus.on('cookies:changed', paint);
    setInterval(paint, 1500);
    paint();
    return { refresh: paint };
  }

  WS.ns('ui.cookieJar', { mount: mount, read: read, write: write, erase: erase });
}());
