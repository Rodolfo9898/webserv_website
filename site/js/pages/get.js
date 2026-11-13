/* get.js - the Read lab: type a path (or pick a preset), send a GET, inspect the exchange. */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var PRESETS = [
    ['/', 'default file'], ['/uploads', 'listing'], ['/get/css/', 'autoindex'], ['/old-home', '301 redirect'],
    ['/siege', 'empty file'], ['/favicon.ico', 'binary image'], ['/cgi-bin/get.py?name=webserv', 'CGI'], ['/does-not-exist', '404']
  ];
  var input = $('#path');
  var out = WS.ui.inspector.mount($('#out'), 'Pick a preset or type a path, then press Send.');

  function send(path) {
    path = (path || input.value || '/').trim();
    if (path.charAt(0) !== '/') path = '/' + path;
    input.value = path;
    out.loading('GET ' + path);
    WS.net.http.get(path).then(out.show);
  }

  PRESETS.forEach(function (p) {
    $('#presets').appendChild(el('button', { class: 'preset', onclick: function () { send(p[0]); } }, p[0], el('small', { text: p[1] })));
  });
  $('#send').addEventListener('click', function () { send(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  send('/');
}());
