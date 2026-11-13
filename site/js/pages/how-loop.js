/*
 * how-loop.js - an illustration of the single poll() loop. NOT real server data: a timer picks one of the
 * descriptors a webserv-like server watches, lights it up as readable or writable, and logs what the server does next.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var FDS = [
    { name: 'listen', fd: 3, sub: ':4442', read: ['accept()', 'a new client connects'], write: null },
    { name: 'client', fd: 7, sub: 'browser A', read: ['recv()', 'read the request, feed the parser'], write: ['send()', 'write the response'] },
    { name: 'client', fd: 8, sub: 'browser B', read: ['recv()', 'read the next chunk of the body'], write: ['send()', 'write the next part of the file'] },
    { name: 'client', fd: 9, sub: 'browser C', read: ['recv()', 'read a request line'], write: ['send()', 'write an error page'] },
    { name: 'cgi out', fd: 11, sub: 'pipe', read: ['read()', 'collect what the script printed'], write: null },
    { name: 'cgi in', fd: 12, sub: 'pipe', read: null, write: ['write()', 'feed the POST body to the script'] }
  ];

  function mount(container) {
    var nodes = FDS.map(function (f, i) {
      return el('div', { class: 'fd', style: { '--a': (i * 360 / FDS.length) + 'deg' } }, el('b', { text: 'fd ' + f.fd }), el('span', { text: f.name }), el('br'), el('span', { text: f.sub }));
    });
    var log = el('div', { class: 'evlog', 'aria-hidden': 'true' });
    container.appendChild(el('div', { class: 'loop-wrap' },
      el('div', { class: 'loop' }, el('div', { class: 'core', text: 'poll()' }), nodes),
      el('div', null, log, el('div', { class: 'rules' },
        ['one poll() for every socket and pipe', 'read and write watched together', 'no read or write without readiness', 'every descriptor non-blocking'].map(function (t) { return el('span', { class: 'chip on' }, WS.icon('check'), t); })),
        el('p', { class: 'err-note', text: 'An illustration of the idea: the descriptors, events and order here are simulated.' }))));

    function tick() {
      var i = Math.floor(Math.random() * FDS.length);
      var f = FDS[i];
      var dirs = [];
      if (f.read) dirs.push('r');
      if (f.write) dirs.push('w');
      var d = dirs[Math.floor(Math.random() * dirs.length)];
      var action = d === 'r' ? f.read : f.write;
      nodes.forEach(function (n) { n.classList.remove('read', 'write'); });
      nodes[i].classList.add(d === 'r' ? 'read' : 'write');
      log.appendChild(el('div', { class: d }, 'fd ' + f.fd + '  ' + (d === 'r' ? 'POLLIN ' : 'POLLOUT') + '  ->  ' + action[0] + '  ' + action[1]));
      while (log.children.length > 9) log.removeChild(log.firstChild);
    }
    tick();
    setInterval(tick, WS.ui.fx.reduced ? 2500 : 1000);
  }

  WS.ns('pages.howLoop', { mount: mount });
}());
