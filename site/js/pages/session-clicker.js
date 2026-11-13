/*
 * session-clicker.js - the bonus clicker: the score lives in the SESSION the server keeps for this browser
 * (CGI /cgi-bin/bonus/clicker.py: GET returns { session, score }, POST click=1 adds one, reset=1 clears).
 * Requests go one at a time through a queue; without a session on the server the page counts locally.
 */
(function () {
  'use strict';
  var API = '/cgi-bin/bonus/clicker.py';
  var lastExchange = WS.ui.inspector.mount(WS.dom.$('#last'), 'Click the cookie: every request to the session script shows up here.');
  var hasSession = false;
  var pending = 0;
  var queue = Promise.resolve();

  /* resolves to the score kept by the server, or null when there is no session / the call failed */
  function call(method, fields) {
    var opts = method === 'POST' ? { body: new URLSearchParams(fields).toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } : {};
    return WS.net.http.request(method, API, opts).then(function (ex) {
      lastExchange.show(ex);
      if (!ex.ok) return null;
      try {
        var data = JSON.parse(ex.text);
        return data.session === false || !Number.isInteger(data.score) ? null : data.score;
      } catch (e) { return null; }
    });
  }

  function setSession(api, found) {
    hasSession = found;
    api.status(found ? 'Your score is kept in your session on the server, so it survives a reload.' : 'No session on this server: the score is counted in this page only.', found);
  }

  function send(api, fields) {
    pending++;
    queue = queue.then(function () {
      if (!hasSession) { pending--; return null; }
      return call('POST', fields).then(function (value) {
        if (value === null) setSession(api, false); else if (pending === 1) api.set(value);
        pending--;
      });
    });
  }

  var store = {
    init: function (api) {
      queue = queue.then(function () {
        return call('GET').then(function (value) {
          setSession(api, value !== null);
          if (value !== null && pending === 0) api.set(value);
        });
      });
    },
    click: function (api) { send(api, { click: '1' }); },
    reset: function (api) { send(api, { reset: '1' }); }
  };

  WS.pages.clickerUI.mount(WS.dom.$('#game'), store);
  WS.ui.cookieJar.mount(WS.dom.$('#jar'), { readOnly: true });
}());
