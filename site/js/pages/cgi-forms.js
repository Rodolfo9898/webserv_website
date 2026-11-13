/*
 * cgi-forms.js - shared by /cgiPython and /cgiPerl. Every <form data-cgi> works as a normal form (the browser
 * navigates to the script's page). With "Inspect here" ticked, or when a file name has spaces that the server
 * would not accept, the request is sent with fetch instead, so the raw answer can be inspected in place.
 */
(function () {
  'use strict';
  var out = WS.ui.inspector.mount(WS.dom.$('#out'), 'Tick "Inspect here" and run a script: its raw answer appears here.');

  function safeName(name) { return name.replace(/\s+/g, '_'); }

  function inspect(form) {
    var method = (form.getAttribute('method') || 'GET').toUpperCase();
    var action = form.getAttribute('action');
    var data = new FormData(form);
    out.loading(method + ' ' + action);
    if (method === 'GET') return WS.net.http.get(action + '?' + new URLSearchParams(data).toString()).then(out.show);
    Array.prototype.slice.call(data.entries()).forEach(function (pair) {
      if (pair[1] instanceof File && /\s/.test(pair[1].name)) data.set(pair[0], pair[1], safeName(pair[1].name));
    });
    return WS.net.http.post(action, data, { describe: 'multipart/form-data' }).then(out.show);
  }

  WS.dom.$$('form[data-cgi]').forEach(function (form) {
    var box = WS.dom.$('input[data-inline]', form);
    var file = WS.dom.$('input[type=file]', form);
    form.addEventListener('submit', function (e) {
      var spaced = file && file.files[0] && /\s/.test(file.files[0].name);
      if ((box && box.checked) || spaced) {
        e.preventDefault();
        if (spaced) WS.ui.toast.info('The file name has spaces: it was renamed with underscores and sent from this page.');
        inspect(form);
      }
    });
  });

  WS.dom.$$('[data-fill]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = WS.dom.$('input[name=name]', btn.closest('form'));
      input.value = btn.getAttribute('data-fill');
      input.focus();
    });
  });
}());
