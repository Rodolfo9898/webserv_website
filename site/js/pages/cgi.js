/*
 * cgi.js - the animated journey of a CGI request. A step list drives the highlighted nodes and the packet that
 * travels along the wires; the same data fills the explanation panel. Clicking a node jumps to its step.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var NODES = [
    { icon: 'globe', title: 'Browser', sub: 'GET /cgi-bin/get.py?name=ada' },
    { icon: 'server', title: 'webserv', sub: 'poll() loop, router' },
    { icon: 'cpu', title: 'Child process', sub: 'fork() + execve()' },
    { icon: 'terminal', title: 'Script', sub: 'python / perl / sh' }
  ];
  var STEPS = [
    { nodes: [0, 1], wire: 0, dir: 'fwd', title: '1. The request arrives', text: 'The browser sends a normal HTTP request. The server reads it from a socket that poll() reported as readable.' },
    { nodes: [1], wire: -1, dir: '', title: '2. The route decides', text: 'The longest matching route is /cgi-bin. Its "cgi-bin allowed .py" line says the extension .py is a program, not a file to send back.' },
    { nodes: [1, 2], wire: 1, dir: 'fwd', title: '3. fork and execve', text: 'The server forks a child (the one thing fork is allowed for) that moves into the script folder and executes the interpreter with the script.' },
    { nodes: [2, 3], wire: 2, dir: 'fwd', title: '4. Environment and stdin', text: 'The request reaches the script as environment variables. A POST body is written to its standard input, with chunked bodies already un-chunked.' },
    { nodes: [3, 2], wire: 2, dir: 'back', title: '5. The script prints', text: 'Everything the script writes to stdout travels through a pipe. The server reads it without blocking, from the same poll() loop. EOF ends the data.' },
    { nodes: [2, 1, 0], wire: 0, dir: 'back', title: '6. The response goes out', text: 'The server turns the script output into an HTTP response and writes it back as soon as poll() says the client socket can take it.' }
  ];

  var flow = WS.dom.$('#flow');
  var detail = WS.dom.$('#detail');
  var nodeEls = [], wireEls = [];
  NODES.forEach(function (n, i) {
    var node = el('button', { class: 'pnode', onclick: function () { stop(); show(i); } },
      el('span', { class: 'ico' }, WS.icon(n.icon)), el('strong', { text: n.title }), el('small', { text: n.sub }));
    nodeEls.push(node);
    flow.appendChild(node);
    if (i < NODES.length - 1) { var w = el('div', { class: 'wire' }, el('i')); wireEls.push(w); flow.appendChild(w); }
  });

  var index = 0, timer = null;
  function show(i) {
    index = i;
    var s = STEPS[i];
    nodeEls.forEach(function (n, k) { n.classList.toggle('active', s.nodes.indexOf(k) >= 0); });
    wireEls.forEach(function (w, k) { w.className = 'wire' + (k === s.wire ? ' ' + s.dir : ''); });
    WS.dom.clear(detail).appendChild(el('div', { class: 'flow-step' },
      el('div', { class: 'dots' }, STEPS.map(function (_, k) { return el('button', { class: k === i ? 'on' : '', 'aria-label': 'Step ' + (k + 1), onclick: function () { stop(); show(k); } }); })),
      el('h4', { text: s.title }), el('p', { text: s.text })));
  }
  function play() {
    stop();
    show(0);
    timer = setInterval(function () { show((index + 1) % STEPS.length); }, 3600);
  }
  function stop() { clearInterval(timer); timer = null; }

  WS.dom.$('#play').addEventListener('click', play);
  play();

  var DESC = { REQUEST_METHOD: 'GET or POST', QUERY_STRING: 'what follows the ?', CONTENT_LENGTH: 'bytes of body on stdin', CONTENT_TYPE: 'type of that body', PATH_INFO: 'extra path after the script', SCRIPT_NAME: 'which script runs', SERVER_PROTOCOL: 'HTTP version', SERVER_PORT: 'port that accepted it', HTTP_COOKIE: 'the Cookie header' };
  WS.data.cgi.env.forEach(function (name) {
    WS.dom.$('#env').appendChild(el('div', { class: 'env' }, el('code', { text: name }), el('span', { text: DESC[name] || '' })));
  });
  WS.ui.layout.applyEdition(document);
}());
