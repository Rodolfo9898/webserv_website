/*
 * http.js - the single door every network call of the site goes through.
 * Patterns:
 *   - Facade             get/post/del/upload hide fetch + XHR behind one tiny API
 *   - Chain of Responsibility  middleware(ctx, next) wrappers: recorder -> errors -> timing -> timeout -> transport
 *   - Value object       every call resolves to an Exchange (never rejects), so UIs can always show what happened
 * Because everything is funnelled here, the traffic tap and the inspectors can show real requests for free.
 */
(function () {
  'use strict';
  var seq = 0;
  var chain = [];

  function Exchange(method, url) {
    this.id = ++seq;
    this.method = method;
    this.url = url;
    this.path = pathOf(url);
    this.status = 0;
    this.statusText = '';
    this.ok = false;
    this.redirected = false;
    this.finalUrl = url;
    this.protocol = '';
    this.headers = [];
    this.requestHeaders = {};
    this.requestBody = null;
    this.contentType = '';
    this.text = null;
    this.blob = null;
    this.size = 0;
    this.ms = 0;
    this.error = null;
    this.at = new Date();
  }
  Exchange.prototype.header = function (name) {
    name = name.toLowerCase();
    for (var i = 0; i < this.headers.length; i++) if (this.headers[i][0] === name) return this.headers[i][1];
    return null;
  };
  Exchange.prototype.family = function () { return Math.floor(this.status / 100); };

  function pathOf(url) {
    try { var u = new URL(url, location.href); return u.pathname + u.search; } catch (e) { return url; }
  }

  function protocolOf(url) {
    try {
      var entries = performance.getEntriesByName(new URL(url, location.href).href);
      return entries.length ? entries[entries.length - 1].nextHopProtocol || '' : '';
    } catch (e) { return ''; }
  }

  function isTextual(type) { return !type || /^(text\/|application\/(json|xml|javascript|x-www-form)|image\/svg)/i.test(type); }

  /* ---- transport (the end of the chain) ---- */
  function transport(ctx) {
    var ex = ctx.exchange;
    var init = { method: ctx.method, headers: ctx.headers, body: ctx.body, cache: 'no-store', redirect: ctx.redirect || 'follow', signal: ctx.signal };
    return fetch(ctx.url, init).then(function (res) {
      ex.status = res.status;
      ex.statusText = res.statusText;
      ex.ok = res.ok;
      ex.redirected = res.redirected;
      ex.finalUrl = res.url || ctx.url;
      res.headers.forEach(function (v, k) { ex.headers.push([k, v]); });
      ex.contentType = res.headers.get('content-type') || '';
      var textual = isTextual(ex.contentType);
      return (textual ? res.text() : res.blob()).then(function (body) {
        if (textual) { ex.text = body; ex.size = new Blob([body]).size; } else { ex.blob = body; ex.size = body.size; }
        ex.protocol = protocolOf(ex.finalUrl);
        return ex;
      });
    });
  }

  /* ---- middleware ---- */
  function recorder(ctx, next) {
    return next().then(function (ex) { if (!ctx.quiet) WS.bus.emit('http:exchange', ex); return ex; });
  }
  function errors(ctx, next) {
    return next().catch(function (err) {
      var ex = ctx.exchange;
      ex.status = 0;
      ex.error = err && err.name === 'AbortError' ? 'Timed out after ' + (ctx.timeout / 1000) + ' s' : (err && err.message) || 'Network error';
      return ex;
    });
  }
  function timing(ctx, next) {
    var t0 = performance.now();
    return next().then(function (ex) { ex.ms = performance.now() - t0; return ex; });
  }
  function timeout(ctx, next) {
    var ctrl = new AbortController();
    ctx.signal = ctrl.signal;
    var timer = setTimeout(function () { ctrl.abort(); }, ctx.timeout);
    return next().then(function (ex) { clearTimeout(timer); return ex; }, function (e) { clearTimeout(timer); throw e; });
  }
  chain.push(recorder, errors, timing, timeout);

  function run(ctx) {
    function step(i) { return i < chain.length ? chain[i](ctx, function () { return step(i + 1); }) : transport(ctx); }
    return step(0);
  }

  /* ---- public API ---- */
  function request(method, url, opts) {
    opts = opts || {};
    var ex = new Exchange(method, url);
    ex.requestHeaders = opts.headers || {};
    ex.requestBody = opts.describe || (typeof opts.body === 'string' ? opts.body : null);
    return run({ method: method, url: url, headers: opts.headers, body: opts.body, redirect: opts.redirect, quiet: opts.quiet, timeout: opts.timeout || 15000, exchange: ex });
  }

  /* Upload with progress: fetch has no upload events, XHR does. Still produces an Exchange and still hits the tap. */
  function upload(url, formData, onProgress, describe) {
    return new Promise(function (resolve) {
      var ex = new Exchange('POST', url);
      ex.requestBody = describe || '(multipart/form-data)';
      var xhr = new XMLHttpRequest();
      var t0 = performance.now();
      function finish() {
        ex.ms = performance.now() - t0;
        WS.bus.emit('http:exchange', ex);
        resolve(ex);
      }
      xhr.open('POST', url);
      xhr.timeout = 120000;
      if (xhr.upload && onProgress) xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onload = function () {
        ex.status = xhr.status;
        ex.statusText = xhr.statusText;
        ex.ok = xhr.status >= 200 && xhr.status < 300;
        ex.redirected = xhr.responseURL && xhr.responseURL !== new URL(url, location.href).href;
        ex.finalUrl = xhr.responseURL || url;
        xhr.getAllResponseHeaders().trim().split(/\r?\n/).forEach(function (line) {
          var i = line.indexOf(':');
          if (i > 0) ex.headers.push([line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()]);
        });
        ex.contentType = ex.header('content-type') || '';
        ex.text = xhr.responseText;
        ex.size = new Blob([ex.text]).size;
        ex.protocol = protocolOf(ex.finalUrl);
        finish();
      };
      xhr.onerror = function () { ex.error = 'Network error'; finish(); };
      xhr.ontimeout = function () { ex.error = 'Timed out'; finish(); };
      xhr.send(formData);
    });
  }

  WS.ns('net.http', {
    Exchange: Exchange,
    use: function (mw) { chain.splice(1, 0, mw); },
    request: request,
    get: function (url, opts) { return request('GET', url, opts); },
    post: function (url, body, opts) { opts = opts || {}; opts.body = body; return request('POST', url, opts); },
    del: function (url, opts) { return request('DELETE', url, opts); },
    upload: upload
  });
}());
