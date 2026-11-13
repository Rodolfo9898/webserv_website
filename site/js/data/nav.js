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
    { key: 'cgi', label: 'CGI', href: '/cgi' },
    {
      key: 'explore', label: 'Explore', icon: 'globe', items: [
        { key: 'checklist', label: 'Subject checklist', desc: 'Every requirement, one click away', href: '/pages/checklist.html', icon: 'check' },
        { key: 'how', label: 'How it works', desc: 'Event loop and request lifecycle', href: '/pages/how.html', icon: 'activity' },
        { key: 'routes', label: 'Route explorer', desc: 'Every route of the config, live', href: '/pages/routes.html', icon: 'route' },
        { key: 'errors', label: 'Error lab', desc: 'All 40 error pages', href: '/pages/errors.html', icon: 'alert' },
        { key: 'servers', label: 'Multi-port servers', desc: 'Several servers, one process', href: '/pages/servers.html', icon: 'server' },
        { key: 'stress', label: 'Stress test', desc: 'Hammer /siege from your browser', href: '/pages/stress.html', icon: 'zap' }
      ]
    },
    { key: 'cookie', label: 'Cookies', href: '/cookie-clicker' },
    { key: 'bonus-hub', label: 'Bonus', href: '/bonus', bonus: true }
  ]);
}());
