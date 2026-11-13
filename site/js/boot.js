/*
 * boot.js - the only <script> a page needs.
 * Pattern: Module loader driven by a manifest. It loads the shared core, the shell, and the modules the page
 * declared with data-page, in order (dynamic scripts with async=false keep execution order, downloads run in parallel).
 * Plain classic scripts on purpose: no build step, and nothing that depends on how the server labels .js files.
 */
(function () {
  'use strict';
  var self = document.currentScript;
  var page = self.getAttribute('data-page') || '';
  var base = self.src.replace(/boot\.js(\?.*)?$/, '');

  var CORE = [
    'core/kernel.js', 'core/dom.js', 'core/icons.js', 'core/theme.js',
    'data/config.js', 'data/nav.js',
    'net/http.js', 'net/status.js', 'net/features.js',
    'ui/toast.js', 'ui/effects.js', 'ui/background.js', 'ui/traffic.js', 'ui/inspector.js', 'ui/layout.js'
  ];
  var UPLOADS = ['net/listing.js', 'net/uploads-repo.js', 'ui/file-icons.js'];
  var CLICKER = ['ui/cookie-jar.js', 'pages/clicker-ui.js', 'pages/clicker-stores.js'];
  var ERROR_DATA = ['data/errors4.js', 'data/errors5.js'];

  /* page key -> extra modules (the last one is the page controller) */
  var PAGES = {
    home: ['ui/terminal.js', 'pages/home-view.js', 'pages/home.js'],
    server: ['pages/server-landing.js'],
    error: ERROR_DATA.concat(['pages/error-page.js']),
    get: ['pages/get.js'],
    post: UPLOADS.concat(['ui/dropzone.js', 'ui/upload-queue.js', 'pages/post.js']),
    success: UPLOADS.concat(['pages/success.js']),
    delete: UPLOADS.concat(['pages/delete.js']),
    crud: UPLOADS.concat(['ui/dropzone.js', 'ui/upload-queue.js', 'ui/file-table.js', 'pages/crud.js']),
    cgi: ['pages/cgi.js', 'pages/cgi-forms.js'],
    how: ['pages/how-loop.js', 'pages/how-steps.js', 'pages/how.js'],
    routes: ['pages/routes.js'],
    errors: ERROR_DATA.concat(['pages/errors-lab.js']),
    servers: ['pages/servers.js'],
    stress: ['ui/linechart.js', 'pages/stress.js'],
    checklist: ['data/checklist.js', 'pages/checklist.js'],
    clicker: CLICKER.concat(['pages/cookie-clicker.js']),
    bonus: ['ui/cookie-jar.js', 'pages/bonus.js']
  };

  var list = CORE.concat(PAGES[page] || []);
  list.forEach(function (path) {
    var s = document.createElement('script');
    s.src = base + path;
    s.async = false;
    s.onerror = function () { console.error('[boot] could not load ' + s.src); };
    document.head.appendChild(s);
  });
}());
