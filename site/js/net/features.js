/*
 * features.js - ask the running server what it can do, instead of hard-coding it.
 *   edition()  'bonus' when the server was started with a bonus config (the /bonus route exists), else 'base'
 *   ping()     latency of the server that served this page
 *   probe()    is another port (the multi-server demo) answering?
 */
(function () {
  'use strict';
  var editionPromise = null;

  function edition() {
    if (editionPromise) return editionPromise;
    /* Bonus pages know where they live; every other page asks the server (one tiny request, never cached). */
    if (document.body && document.body.getAttribute('data-edition') === 'bonus') {
      editionPromise = Promise.resolve('bonus');
    } else {
      editionPromise = WS.net.http.get('/bonus', { quiet: true, timeout: 4000 }).then(function (ex) {
        return ex.ok && /html/i.test(ex.contentType) ? 'bonus' : 'base';
      });
    }
    return editionPromise;
  }

  function ping() {
    return WS.net.http.get('/favicon.ico', { quiet: true, timeout: 4000 }).then(function (ex) {
      return { up: ex.status > 0, ms: ex.ms, status: ex.status };
    });
  }

  /* Other ports are other origins: no-cors gives an opaque answer, which is all "is it up" needs. */
  function probe(port, timeoutMs) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 2500);
    var t0 = performance.now();
    var url = location.protocol + '//' + location.hostname + ':' + port + '/favicon.ico';
    return fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal }).then(
      function () { clearTimeout(timer); return { up: true, ms: performance.now() - t0 }; },
      function () { clearTimeout(timer); return { up: false, ms: 0 }; }
    );
  }

  function origin(port) { return location.protocol + '//' + location.hostname + ':' + port; }

  WS.ns('net.features', { edition: edition, ping: ping, probe: probe, origin: origin });
}());
