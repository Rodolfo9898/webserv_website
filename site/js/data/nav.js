/*
 * nav.js - the whole site map as data. layout.js renders it, the footer reuses it, tests can iterate it.
 * Links use the routes of the server configuration where they exist, and plain /pages/... files otherwise
 * (every file under site/ is reachable through the root route).
 */
(function () {
  'use strict';
  WS.ns('data.nav', [
    { key: 'home', label: 'Home', href: '/' },
    {
      key: 'methods', label: 'HTTP methods', icon: 'swap', items: [
        { key: 'get', label: 'Read · GET', desc: 'Send any request, inspect every byte', href: '/pages/get.html', icon: 'eye' },
        { key: 'post', label: 'Create · POST', desc: 'Upload files with live progress', href: '/post', icon: 'upload' },
        { key: 'delete', label: 'Delete · DELETE', desc: 'Remove files, test idempotency', href: '/delete', icon: 'trash' },
        { key: 'crud', label: 'CRUD manager', desc: 'The whole REST cycle in one screen', href: '/pages/crud.html', icon: 'layers' }
      ]
    },
    {
      key: 'cgi', label: 'CGI', icon: 'terminal', items: [
        { key: 'cgi', label: 'How CGI works', desc: 'fork, execve, pipes and environment', href: '/cgi', icon: 'cpu' },
        { key: 'cgipython', label: 'Python scripts', desc: 'GET query and POST upload', href: '/cgiPython', icon: 'code' },
        { key: 'cgiperl', label: 'Perl script', desc: 'Another interpreter, same contract', href: '/cgiPerl', icon: 'terminal' }
      ]
    },
    {
      key: 'explore', label: 'Explore', icon: 'globe', items: [
        { key: 'how', label: 'How it works', desc: 'Event loop and request lifecycle', href: '/pages/how.html', icon: 'activity' },
        { key: 'routes', label: 'Route explorer', desc: 'Every route of the config, live', href: '/pages/routes.html', icon: 'route' },
        { key: 'errors', label: 'Error lab', desc: '400, 404, 405, 413 and 5xx pages', href: '/pages/errors.html', icon: 'alert' },
        { key: 'servers', label: 'Multi-port servers', desc: 'Several servers, one process', href: '/pages/servers.html', icon: 'server' },
        { key: 'stress', label: 'Stress test', desc: 'Hammer /siege from your browser', href: '/pages/stress.html', icon: 'zap' },
        { key: 'cookie', label: 'Cookie clicker', desc: 'Cookies stored in the browser', href: '/cookie-clicker', icon: 'cookie' }
      ]
    },
    {
      key: 'bonus', label: 'Bonus', icon: 'gift', bonus: true, items: [
        { key: 'bonus-hub', label: 'Bonus hub', desc: 'Sessions, cookies, more CGI types', href: '/bonus', icon: 'gift' },
        { key: 'session-clicker', label: 'Session clicker', desc: 'Score kept in a server session', href: '/bonus/cookie-clicker.html', icon: 'cookie' }
      ]
    }
  ]);
}());
