/*
 * config.js - a hand-kept mirror of what the webserv configuration files declare
 * (config/defaultConfig.conf, singleServeConfig.conf, multiServerConfig.conf and config/bonus/*.conf).
 * The server never serves its own config, so the website carries this copy to draw the route explorer, the
 * server cards and the demos. If a .conf changes, change it here too (the README says so).
 */
(function () {
  'use strict';

  function route(path, methods, what, extra) {
    var r = {
      path: path, methods: methods, what: what,
      entry: 'site', defPage: null, autoindex: false, cgi: null, redirect: null, bonus: false,
      upload: false, tryPath: path
    };
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }

  var routes = [
    route('/', ['GET'], 'Static site: serves index.html when the URL is a directory', { defPage: '/index.html', demo: 'Default file' }),
    route('/get', ['GET'], 'Directory listing switched on for the whole site folder', { defPage: '/pages/get.html', autoindex: true, demo: 'Autoindex' }),
    route('/post', ['GET', 'POST'], 'Upload form: POST saves the file in the upload folder', { entry: 'site/pages', defPage: '/post.html', upload: true, demo: 'Upload' }),
    route('/succesPost', ['GET', 'POST'], 'Upload target: answers with the success page', { entry: 'site/pages', defPage: '/succesPost.html', upload: true, demo: 'Upload' }),
    route('/delete', ['GET'], 'Page that deletes files by sending DELETE to /uploads', { entry: 'site/pages', defPage: '/delete.html', demo: 'DELETE' }),
    route('/uploads', ['GET', 'DELETE'], 'The uploaded files: listed on GET, removed on DELETE', { entry: 'uploads', defPage: '/.placeholder', autoindex: true, demo: 'Autoindex + DELETE' }),
    route('/cgi', ['GET'], 'CGI page: the journey of a request and the two Python scripts', { entry: 'site/pages', defPage: '/cgi.html', demo: 'CGI' }),
    route('/cgiPython', ['GET'], 'Short page that forwards to /cgi (the forms live there now)', { entry: 'site/pages', defPage: '/cgiPython.html', demo: 'CGI' }),
    route('/cgiPerl', ['GET'], 'Short page that forwards to the bonus page, where Perl lives', { entry: 'site/pages', defPage: '/cgiPerl.html', demo: 'CGI' }),
    route('/cgi-bin', ['GET', 'POST'], 'Executes .py scripts (the bonus config also runs .pl and .sh)', { entry: 'cgi', defPage: '/get.py', cgi: ['.py'], bonusCgi: ['.py', '.pl', '.sh'], upload: true, demo: 'CGI by extension' }),
    route('/cgi-bin/get.pl', ['GET', 'POST'], 'Perl script mounted on its own route', { entry: 'cgi/bonus', defPage: '/get.pl', cgi: ['.pl'], demo: 'CGI by extension' }),
    route('/cookie-clicker', ['GET'], 'Cookie clicker: a server session when available, a cookie otherwise', { entry: 'site/pages', defPage: '/cookie-clicker.html', demo: 'Cookies' }),
    route('/siege', ['GET'], 'Empty file, the target for load tests', { entry: 'site/siege', defPage: '/siegeFile', demo: 'Load test' }),
    route('/old-home', ['GET'], 'HTTP redirection to /', { defPage: '/index.html', redirect: '/', demo: 'Redirect' }),
    route('/bonus', ['GET'], 'Bonus hub: sessions, cookies, more CGI types', { entry: 'site/bonus', defPage: '/index.html', bonus: true, demo: 'Bonus' })
  ];

  var errors = [
    { codes: [400], file: '/site/errors/error400.html' },
    { codes: [404], file: '/site/errors/error404.html' },
    { codes: [405], file: '/site/errors/error405.html' },
    { codes: [413], file: '/site/errors/error413.html' },
    { codes: [500, 502, 504], file: '/site/errors/error500.html' }
  ];

  var servers = [
    { id: 'main', port: 4442, label: 'Main server', config: 'defaultConfig.conf', domains: ['test.com', 'rest.com', '1.com'], bodySize: '-1', routes: 14, errors: 5, note: 'The full site' },
    { id: 'single', port: 4443, label: 'Single server', config: 'singleServeConfig.conf', domains: ['test.com', 'rest.com', '1.com'], bodySize: '-1', routes: 14, errors: 5, note: 'Same site, own config' },
    { id: 'multi-a', port: 4444, label: 'Multi A', config: 'multiServerConfig.conf', domains: ['test.com', 'rest.com', '1.com'], bodySize: '-1', routes: 1, errors: 2, note: 'First of two servers in one config', page: '/indexServer2.html' },
    { id: 'multi-b', port: 4445, label: 'Multi B', config: 'multiServerConfig.conf', domains: ['test2.com', 'rest2.com', '12.com'], bodySize: '1000', routes: 1, errors: 2, note: 'Second server, body size capped at 1000', page: '/indexServer3.html' }
  ];

  var methods = [
    { name: 'GET', does: 'Read a resource', safe: true },
    { name: 'POST', does: 'Create: upload or send data', safe: false },
    { name: 'DELETE', does: 'Remove a resource', safe: false }
  ];

  var cgi = {
    env: ['REQUEST_METHOD', 'QUERY_STRING', 'CONTENT_LENGTH', 'CONTENT_TYPE', 'PATH_INFO', 'SCRIPT_NAME', 'SERVER_PROTOCOL', 'SERVER_PORT', 'HTTP_COOKIE'],
    bonusScripts: [
      { id: 'session-py', title: 'Session in Python', path: '/cgi-bin/bonus/session.py', blurb: 'A session kept by the server, shown by a Python script.', lang: 'Python' },
      { id: 'session-pl', title: 'Session in Perl', path: '/cgi-bin/bonus/session.pl', blurb: 'The same session in Perl: it belongs to the server, not to the language.', lang: 'Perl' },
      { id: 'cookies', title: 'Cookies', path: '/cgi-bin/bonus/cookies.py', blurb: 'The cookies your browser sends, with a form to set and delete them.', lang: 'Python' },
      { id: 'hello', title: 'Shell script', path: '/cgi-bin/bonus/hello.sh', blurb: 'A page made by a shell script, the third kind of CGI.', lang: 'Shell' }
    ]
  };

  WS.ns('data.routes', routes);
  WS.ns('data.errors', errors);
  WS.ns('data.servers', servers);
  WS.ns('data.methods', methods);
  WS.ns('data.cgi', cgi);
}());
