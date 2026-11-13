/*
 * clicker-stores.js - where the clicker keeps its score. Three Strategy objects and one chooser:
 *   session  the score lives in the session the server keeps for this browser, read and written through the CGI
 *            /cgi-bin/bonus/clicker.py (GET returns { session, score }; POST click=1 adds one, reset=1 clears).
 *            The browser only holds the session id.
 *   cookie   the score lives in a browser cookie (cookieCount, 365 days), sent back with every request.
 *   auto     asks the server first: a session when there is one (bonus build), a cookie otherwise.
 */
(function () {
  'use strict';
  var API = '/cgi-bin/bonus/clicker.py';
  var NAME = 'cookieCount';

  /* resolves to the score kept by the server, or null when there is no session / the call failed */
  function call(method, fields) {
    var opts = method === 'POST' ? { body: new URLSearchParams(fields).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } : {};
    return WS.net.http.request(method, API, opts).then(function (ex) {
      if (!ex.ok) return null;
      try {
        var data = JSON.parse(ex.text);
        return data.session === false || !Number.isInteger(data.score) ? null : data.score;
      } catch (e) { return null; }
    });
  }

  function cookieStore() {
    return {
      kind: 'cookie',
      init: function (api) {
        var hit = WS.ui.cookieJar.read().filter(function (c) { return c.name === NAME; })[0];
        api.set(hit ? parseInt(hit.value, 10) || 0 : 0);
        api.mode('Cookie in the browser', false);
        api.status('This server offers no session, so the score is kept in the cookie "' + NAME + '" (365 days). Reload: it is still here.', true);
      },
      click: function (api) { WS.ui.cookieJar.write(NAME, api.get(), 365); },
      reset: function (api) { WS.ui.cookieJar.erase(NAME); api.set(0); }
    };
  }

  function sessionStore(first, fallback) {
    var pending = 0;
    var queue = Promise.resolve();
    function send(api, fields) {
      pending++;
      queue = queue.then(function () {
        return call('POST', fields).then(function (value) {
          pending--;
          if (value === null) return fallback(api);            /* the session vanished: keep playing with a cookie */
          if (pending === 0) api.set(value);
        });
      });
    }
    return {
      kind: 'session',
      init: function (api) {
        api.set(first);
        api.mode('Session on the server', true);
        api.status('The server keeps your score in your session. The browser only holds the session id, so the score survives a reload and cannot be edited from the page.', true);
      },
      click: function (api) { send(api, { click: '1' }); },
      reset: function (api) { send(api, { reset: '1' }); }
    };
  }

  function auto() {
    var impl = null;
    var early = 0;
    function useCookie(api) { var kept = api.get(); impl = cookieStore(); impl.init(api); api.set(kept); impl.click(api); }
    return {
      init: function (api) {
        api.status('Asking the server for a session...', true);
        return call('GET').then(function (score) {
          impl = score === null ? cookieStore() : sessionStore(score, useCookie);
          var typed = early;
          impl.init(api);
          if (typed) api.set(api.get() + typed);
          for (var i = 0; i < typed; i++) impl.click(api);
        });
      },
      click: function (api) { if (impl) impl.click(api); else early++; },
      reset: function (api) { if (impl) impl.reset(api); early = 0; }
    };
  }

  WS.ns('pages.clickerStores', { auto: auto, cookie: cookieStore, API: API });
}());
