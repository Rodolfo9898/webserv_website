/*
 * how-steps.js - the request lifecycle as tabs (each step names the config line that controls it) and an
 * annotated tour of a real config file. Both are plain data rendered by small functions.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  var STEPS = [
    { title: 'Accept', text: 'Every interface:port pair of every Server block gets a listening socket, all watched by the same poll().',
      points: ['A readable listening socket means a client is waiting.', 'New client sockets are made non-blocking and join the poll set.'], conf: 'listen 127.000.000.001 04442 ;' },
    { title: 'Read and parse', text: 'Bytes are collected as they arrive, in as many reads as it takes, then parsed.',
      points: ['Request line, headers, then the body.', 'Chunked bodies are un-chunked before anyone else sees them.', 'Malformed requests get 400, bodies over the limit get 413.'], conf: 'bodySize -1 ;' },
    { title: 'Route', text: 'The URL is matched against the Route blocks of the server that accepted the connection.',
      points: ['A method outside the route list gets 405.', 'A route with a redirect answers with a redirection to the target.', 'No matching route or file means 404.'], conf: 'Route /uploads ;\nmethod [GET,DELETE] ;' },
    { title: 'Handle', text: 'What the route is configured to do decides the handler.',
      points: ['A file, or the default file for a directory.', 'A generated directory listing when it is switched on.', 'An upload saved to uploadPath, a DELETE, or a CGI script chosen by extension.'], conf: 'treeVieuw on ;\ndefPage /index.html ;\nuploadPath /../uploads ;' },
    { title: 'Respond', text: 'Status line, headers and body are queued and written whenever poll() says the socket can take more.',
      points: ['Errors use the page from an "errors" line.', 'Without one, the server falls back to a built-in default page.'], conf: 'errors /site/errors/error404.html [404] ;' },
    { title: 'Stay alive', text: 'Nothing a client does is allowed to stop the loop.',
      points: ['A request never hangs forever: stalled ones are cut off.', 'Disconnects are noticed and their state is cleaned up.', 'Out of memory or bad input must not crash the server.'], conf: '' }
  ];

  function lifecycle(container) {
    var tabs = el('div', { class: 'life-tabs', role: 'tablist' });
    var body = el('div', { class: 'card pad-lg life-body' });
    container.appendChild(el('div', { class: 'life' }, tabs, body));
    function select(i) {
      var s = STEPS[i];
      WS.dom.$$('button', tabs).forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); });
      WS.dom.clear(body).appendChild(el('div', { style: { animation: 'slideUp .35s var(--ease)' } },
        el('h3', { text: (i + 1) + '. ' + s.title }), el('p', { text: s.text }),
        el('ul', null, s.points.map(function (p) { return el('li', { text: p }); })),
        s.conf ? el('div', null, el('small', { class: 'mute', text: 'controlled by' }), el('pre', { class: 'code-block', text: s.conf })) : null));
    }
    STEPS.forEach(function (s, i) { tabs.appendChild(el('button', { role: 'tab', onclick: function () { select(i); } }, el('b', { text: i + 1 }), s.title)); });
    select(0);
  }

  var CFG = [
    ['Server ;', 0, 'Server', 'One Server block describes one listening server. A config can hold several.'],
    ['listen 127.000.000.001 04442 ;', 1, 'listen', 'The interface and port to listen on.'],
    ['domains test.com rest.com 1.com ;', 1, 'domains', 'Names this server answers to (virtual hosts).'],
    ['entry ./eval_helper/website ;', 1, 'entry', 'The base folder of the server.'],
    ['errors /site/errors/error404.html [404] ;', 1, 'errors', 'The page to send for the listed status codes. One line per page.'],
    ['bodySize -1 ;', 1, 'bodySize', 'Largest request body accepted. Beyond it the answer is 413.'],
    ['Route /uploads ;', 1, 'Route', 'A URL prefix. The longest matching prefix wins.'],
    ['method [GET,DELETE] ;', 2, 'method', 'The HTTP methods this route accepts. Others get 405.'],
    ['redirect false ;', 2, 'redirect', 'Where to redirect to, or false for no redirect.'],
    ['entry ./eval_helper/website/uploads ;', 2, 'entry', 'The folder this URL prefix maps to on disk.'],
    ['treeVieuw on ;', 2, 'treeVieuw', 'Directory listing on or off for this route.'],
    ['defPage /.placeholder ;', 2, 'defPage', 'The file served when the URL is a directory.'],
    ['uploadPath / ;', 2, 'uploadPath', 'Where files POSTed to this route are stored.'],
    ['cgi-bin disabled none ;', 2, 'cgi-bin', 'allowed plus extensions turns files into programs; disabled keeps them plain files.'],
    ['ENDRoute ;', 1, 'ENDRoute', 'Closes the Route block.'],
    ['ENDServer ;', 0, 'ENDServer', 'Closes the Server block.']
  ];

  function config(container) {
    var note = el('div', { class: 'card pad-lg cfg-note' });
    var lines = el('div', { class: 'card cfg-lines' });
    function select(btn, row) {
      WS.dom.$$('.cfg-line', lines).forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      WS.dom.clear(note).appendChild(el('div', null, el('code', { text: row[2] }), el('p', { text: row[3] })));
    }
    CFG.forEach(function (row) {
      var btn = el('button', { class: 'cfg-line' + (row[1] ? ' ind' : ''), style: { 'padding-left': (14 + row[1] * 20) + 'px' }, text: row[0] });
      btn.addEventListener('click', function () { select(btn, row); });
      btn.addEventListener('mouseenter', function () { select(btn, row); });
      lines.appendChild(btn);
    });
    container.appendChild(el('div', { class: 'cfg' }, lines, note));
    select(lines.children[1], CFG[1]);
  }

  WS.ns('pages.howSteps', { lifecycle: lifecycle, config: config });
}());
