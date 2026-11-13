/*
 * home-view.js - pure view builders for the landing page (hero, marquee, stats, bento features, lifecycle, servers,
 * call to action). Pattern: template functions over data. index.html and indexBonus.html are the same page;
 * the bonus-only pieces carry data-bonus and appear once the server proves it runs a bonus config.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  /* Mini visuals for the bento cards: CSS-only, decorative. */
  var VIZ = {
    verbs: function () { return el('div', { class: 'viz viz-verbs' }, ['POST', 'GET', 'DELETE'].map(function (m, i) { return el('span', { class: 'method ' + m.toLowerCase(), style: { '--i': i }, text: m }); })); },
    progress: function () { return el('div', { class: 'viz' }, el('div', { class: 'progress' }, el('i', { class: 'viz-fill' })), el('small', { class: 'mono mute', text: 'photo.png  ·  POST /succesPost' })); },
    term: function () { return el('div', { class: 'viz viz-term' }, el('span', { text: '$ python3 get.py' }), el('span', { class: 't-status-2', text: 'Hello, ada!' })); },
    codes: function () { return el('div', { class: 'viz viz-codes' }, [200, 301, 404, 405, 413, 500].map(function (c, i) { return el('span', { class: 'status ' + WS.net.status.describe(c).cls, style: { '--i': i }, text: c }); })); },
    ports: function () { return el('div', { class: 'viz viz-ports' }, [4442, 4443, 4444, 4445].map(function (p, i) { return el('span', { style: { '--i': i } }, el('i'), ':' + p); })); },
    bars: function () { var bars = []; for (var i = 0; i < 16; i++) bars.push(el('i', { style: { '--i': i } })); return el('div', { class: 'viz viz-bars' }, bars); }
  };

  var FEATURES = [
    { icon: 'layers', title: 'CRUD over REST', text: 'Create, read, replace and delete uploads through plain HTTP verbs on one resource, with a rollback when a replace fails half way.', href: '/pages/crud.html', more: 'Open the CRUD manager', span: 'w3', viz: 'verbs' },
    { icon: 'upload', title: 'File uploads', text: 'multipart/form-data saved to the folder the route names. Drag, drop, watch the progress, hit the size limit.', href: '/post', more: 'Create with POST', span: 'w3', viz: 'progress' },
    { icon: 'terminal', title: 'CGI execution', text: 'Scripts chosen by extension, fed through pipes and environment variables.', href: '/cgi', more: 'How CGI works', span: 'w2', viz: 'term' },
    { icon: 'alert', title: 'Error pages', text: 'A page for 400, 404, 405, 413 and 5xx, with defaults when none is set.', href: '/pages/errors.html', more: 'Open the error lab', span: 'w2', viz: 'codes' },
    { icon: 'server', title: 'Many ports, one process', text: 'Several servers declared in one config, each with its own routes and limits.', href: '/pages/servers.html', more: 'Multi-port servers', span: 'w2', viz: 'ports' },
    { icon: 'zap', title: 'Built to stay up', text: 'Non-blocking I/O from a single poll loop. Hammer it and watch the charts.', href: '/pages/stress.html', more: 'Stress test', span: 'w3', viz: 'bars' },
    { icon: 'globe', title: 'Static hosting, redirects, listings', text: 'A full static website from per-route folders, default files, HTTP redirection and generated directory listings.', href: '/pages/routes.html', more: 'Route explorer', span: 'w3' },
    { icon: 'cookie', title: 'Cookies & sessions', text: 'A clicker whose score lives in a server-side session, with a plain cookie as fallback. The bonus hub adds Perl and shell CGI.', href: '/cookie-clicker', more: 'Play the clicker', span: 'w6' }
  ];

  var CAPS = ['HTTP server in C++98', 'poll() event loop', 'non-blocking sockets', 'multipart uploads', 'chunked bodies', 'CGI: Python · Perl · sh', 'redirects', 'directory listing', 'custom error pages', 'several ports', 'body size limits', 'cookies', 'sessions'];

  var STEPS = [
    { icon: 'link', title: 'Accept', text: 'poll() reports the listening socket is readable' },
    { icon: 'code', title: 'Parse', text: 'Request line, headers and body, even chunked' },
    { icon: 'route', title: 'Route', text: 'Longest matching route from the config' },
    { icon: 'cpu', title: 'Handle', text: 'File, upload, delete, redirect or CGI' },
    { icon: 'send', title: 'Respond', text: 'Written when poll() says the socket can take it' }
  ];

  function floats() {
    return el('div', { class: 'floats', 'aria-hidden': 'true' },
      el('div', { class: 'float-card f1' }, el('span', { class: 'status s2', text: '200 OK' }), el('small', { class: 'mono mute', text: 'GET /  ·  3 ms' })),
      el('div', { class: 'float-card f2' }, el('div', { class: 'row' }, el('span', { class: 'method post', text: 'POST' }), el('small', { class: 'mono mute', text: '/succesPost' })), el('div', { class: 'progress' }, el('i', { class: 'viz-fill' }))),
      el('div', { class: 'float-card f3' }, el('span', { class: 'chip on' }, WS.icon('terminal'), 'CGI · python3'), el('small', { class: 'mono mute', text: 'fork + execve' })));
  }

  function hero() {
    return el('section', { class: 'hero' },
      el('div', { class: 'hero-copy', 'data-reveal': true },
        el('span', { class: 'eyebrow' }, WS.icon('zap'), '42 project  ·  C++98'),
        el('h1', null, 'The HTTP server ', el('span', { class: 'grad-text', text: 'you can actually see.' })),
        el('p', { class: 'lead', text: 'webserv is an HTTP server written from scratch: one poll loop, non-blocking sockets, CGI, uploads, redirects and several ports. This website is served by it, so every page, request and error you see here is real.' }),
        el('div', { class: 'row' },
          el('a', { class: 'btn primary lg', href: '/pages/crud.html' }, WS.icon('layers'), 'Try the CRUD manager'),
          el('a', { class: 'btn lg', href: '/pages/checklist.html' }, WS.icon('check'), 'Subject checklist')),
        el('div', { class: 'hero-pills' }, ['GET', 'POST', 'DELETE'].map(function (m) { return el('span', { class: 'method ' + m.toLowerCase(), text: m }); }),
          [['terminal', 'CGI'], ['upload', 'Uploads'], ['redirect', 'Redirects']].map(function (c) { return el('span', { class: 'chip' }, WS.icon(c[0]), c[1]); }),
          el('span', { class: 'chip bonus', hidden: true, 'data-bonus': '1' }, WS.icon('cookie'), 'Cookies & sessions'))),
      el('div', { class: 'hero-term', 'data-reveal': true }, el('div', { id: 'hero-term' }), floats()));
  }

  function marquee() {
    var items = CAPS.concat(CAPS).map(function (c) { return el('span', { class: 'cap' }, el('i'), c); });
    return el('div', { class: 'marquee', 'aria-hidden': 'true' }, el('div', { class: 'marquee-track' }, items));
  }

  function stats() {
    var base = WS.data.routes.filter(function (r) { return !r.bonus; }).length;
    var items = [[base, 'routes in the main config'], [WS.data.methods.length, 'HTTP methods'], [WS.data.errors.length, 'custom error pages'], [WS.data.servers.length, 'ports across the configs']];
    return el('div', { class: 'stats' }, items.map(function (s) {
      return el('div', { class: 'card stat', 'data-reveal': true }, el('b', { 'data-count': s[0], text: '0' }), el('span', { text: s[1] }));
    }));
  }

  function features() {
    return el('div', { class: 'bento' }, FEATURES.map(function (f) {
      return el('a', { class: 'card spot lift bento-item ' + f.span, href: f.href, 'data-reveal': true, hidden: !!f.bonus, 'data-bonus': f.bonus ? '1' : null },
        el('div', { class: 'ico-lg' }, WS.icon(f.icon)), el('h3', { text: f.title }), el('p', { text: f.text }),
        f.viz ? VIZ[f.viz]() : null,
        f.bonus ? el('span', { class: 'chip bonus', text: 'Bonus' }) : null,
        el('span', { class: 'more' }, f.more, WS.icon('arrow')));
    }));
  }

  function lifecycle() {
    return el('div', { class: 'lifecycle', 'data-reveal': true }, STEPS.map(function (s) {
      return el('div', { class: 'step' }, el('div', { class: 'num' }, WS.icon(s.icon)), el('h4', { text: s.title }), el('p', { text: s.text }));
    }));
  }

  function section(title, lead, content) {
    return el('section', { class: 'section' }, el('div', { class: 'sec-head', 'data-reveal': true }, el('h2', { text: title }), lead ? el('p', { text: lead }) : null), content);
  }

  function serverCards() {
    return el('div', { class: 'mini-servers' }, WS.data.servers.map(function (s) {
      return el('a', { class: 'card srv-card lift', 'data-port': s.port, href: WS.net.features.origin(s.port) + '/', 'data-reveal': true },
        el('span', { class: 'port', text: ':' + s.port }), el('strong', { text: s.label }), el('small', { text: s.config }),
        el('span', { class: 'state' }, el('i'), el('span', { text: 'checking...' })));
    }));
  }

  function cta() {
    return el('section', { class: 'section' }, el('div', { class: 'cta glow', 'data-reveal': true },
      el('div', null, el('h2', { text: 'Break it on purpose.' }), el('p', { text: 'Trigger every error page, upload and delete files, run CGI scripts, then hammer the server and see if it stays up.' })),
      el('div', { class: 'row' }, el('a', { class: 'btn primary lg', href: '/pages/errors.html' }, 'Open the error lab'), el('a', { class: 'btn lg', href: '/pages/stress.html' }, 'Stress test'))));
  }

  WS.ns('pages.homeView', { hero: hero, marquee: marquee, stats: stats, features: features, lifecycle: lifecycle, section: section, serverCards: serverCards, cta: cta });
}());
