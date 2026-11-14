/*
 * errors-lab.js - one tile per error code, each a real test: what the request breaks, why that gives the
 * code, where the decision is made, and a Trigger button that sends exactly that request (data/error-tests.js).
 * Requests a browser cannot write go through cgi/errors/probe.py, which sends them on a raw socket and returns
 * both sides; they are turned into an exchange here so the inspector shows them like any other.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var host = location.host || 'localhost:4442';
  var port = host.split(':')[1] || '80';
  var out = WS.ui.inspector.mount($('#out'), 'Press a Trigger button above.');
  var TESTS = WS.data.errorTests;

  function fill(cmd) {
    return cmd.replace(/\{host\}/g, host).replace(/\{hostsp\}/g, host.replace(':', ' ')).replace(/\{port\}/g, port);
  }

  function shorten(text, max) {
    return text.length > max ? text.slice(0, max) + '... (' + text.length + ' characters)' : text;
  }

  /* ---- Sending ---- */

  function live(req) {
    var body = req.body;
    var describe;
    if (req.upload) {
      body = new FormData();
      body.append('file', new Blob(['hello\n'], { type: 'text/plain' }), req.upload);
      describe = 'multipart/form-data: one file named "' + req.upload + '"';
    }
    return WS.net.http.request(req.method, req.path, { headers: req.headers, body: body, describe: describe, timeout: 20000 });
  }

  /* A probe answer {request, response, ms} as an exchange: the raw reply is parsed like a browser would. */
  function fromProbe(data) {
    var first = data.request.split('\r\n')[0];
    var parts = first.split(' ');
    var looksHttp = parts.length === 3 && /^HTTP\//.test(parts[2]);
    var ex = new WS.net.http.Exchange(looksHttp ? parts[0] : 'RAW', '/');
    ex.path = looksHttp ? parts[1] : first;
    ex.rawRequest = data.request;
    ex.ms = data.ms || 0;
    ex.protocol = 'http/1.1';
    var split = data.response.indexOf('\r\n\r\n');
    var status = /^HTTP\/\d\.\d (\d{3}) ?(.*)/.exec(data.response.split('\r\n')[0]);
    if (!status || split < 0) {
      ex.error = data.response || 'the server closed the connection without an answer';
      return ex;
    }
    ex.status = Number(status[1]);
    ex.statusText = status[2];
    ex.ok = ex.status < 400;
    data.response.slice(0, split).split('\r\n').slice(1).forEach(function (line) {
      var i = line.indexOf(':');
      if (i > 0) ex.headers.push([line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()]);
    });
    ex.contentType = ex.header('content-type') || '';
    ex.text = data.response.slice(split + 4);
    ex.size = ex.text.length;
    return ex;
  }

  function probeUrl(code, token) {
    return '/cgi-bin/errors/probe.py?case=' + code + (token ? '&token=' + token : '');
  }

  function probe(code) {
    return WS.net.http.get(probeUrl(code), { timeout: 20000 }).then(function (ex) {
      try { return fromProbe(JSON.parse(ex.text)); } catch (e) { return ex; }
    });
  }

  /* 408 takes the server's 30 second idle timeout: start the probe, then ask for its result until it is there. */
  function slowProbe(code) {
    return WS.net.http.get(probeUrl(code), { quiet: true }).then(function (ex) {
      var token;
      try { token = JSON.parse(ex.text).token; } catch (e) { return ex; }
      var started = Date.now();
      return new Promise(function (resolve) {
        (function poll() {
          var waited = Math.round((Date.now() - started) / 1000);
          out.loading('Half a request sent, now silent. The server should give up after 30 s (' + waited + ' s so far)...');
          if (waited > 60) return resolve(fromProbe({ request: '', response: 'No answer after 60 seconds.' }));
          setTimeout(function () {
            WS.net.http.get(probeUrl(code, token), { quiet: true }).then(function (res) {
              var data;
              try { data = JSON.parse(res.text); } catch (e) { return resolve(res); }
              if (data.pending) poll(); else resolve(fromProbe(data));
            });
          }, 3000);
        }());
      });
    });
  }

  /* 429: the same request a few times in a row; every status is shown, the last exchange is inspected. */
  function burst(req, times, result) {
    var statuses = [];
    function next() {
      return live(req).then(function (ex) {
        statuses.push(ex.status);
        WS.dom.clear(result);
        statuses.forEach(function (s) { result.appendChild(badge(s)); });
        return statuses.length < times && ex.status !== 429 ? next() : ex;
      });
    }
    return next();
  }

  /* The valid request: the trigger's request with what the test changes (a probe test gives a whole one). */
  function goodRequest(t) {
    var g = t.good;
    var base = t.send || {};
    return {
      method: g.method || base.method,
      path: g.path || base.path,
      headers: g.headers !== undefined ? g.headers : base.headers,
      body: g.body !== undefined ? g.body : base.body
    };
  }

  /* A badge with the name of the code, not just its family ("401 Unauthorized", not "401 Client error"). */
  var NAMES = {};
  WS.data.errorCatalog.forEach(function (e) { NAMES[e.code] = e.name; });
  function badge(status) {
    return WS.net.status.badge(status, NAMES[status]);
  }

  function run(code, t, kind, result) {
    var label = kind === 'good' ? 'Valid request' : 'Trigger';
    var job;
    out.loading(label + ' for ' + code + '...');
    if (kind === 'good') job = live(goodRequest(t));
    else if (t.slow) job = slowProbe(code);
    else if (t.probe) job = probe(code);
    else if (t.burst) job = burst(t.send, t.burst, result);
    else job = live(t.send);
    job.then(function (ex) {
      out.show(ex);
      if (!(t.burst && kind !== 'good')) WS.dom.clear(result).appendChild(badge(ex.status));
      $('#out').scrollIntoView({ behavior: WS.ui.fx.reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* ---- Tiles ---- */

  function requestText(t) {
    if (t.probe) return t.show;
    var s = t.send;
    var lines = [s.method + ' ' + shorten(s.path, 70)];
    Object.keys(s.headers || {}).forEach(function (k) { lines.push(k + ': ' + s.headers[k]); });
    if (s.upload) lines.push('(multipart body: one file named "' + s.upload + '")');
    else if (s.body) lines.push('', shorten(s.body, 60));
    if (t.burst) lines.push('(sent ' + t.burst + ' times in a row)');
    return lines.join('\n');
  }

  function copyRow(cmd) {
    return el('div', { class: 'cmd' }, el('span', { text: cmd }),
      el('button', { class: 'icon-btn', 'aria-label': 'Copy the command', onclick: function () { WS.dom.copy(cmd).then(function () { WS.ui.toast.ok('Command copied'); }); } }, WS.icon('copy')));
  }

  function tile(e) {
    var t = TESTS[e.code];
    var bad = el('span', { class: 'trig-result' });
    var good = el('span', { class: 'trig-result' });
    var actions = el('div', { class: 'trig-actions' },
      el('button', { class: 'btn sm primary', onclick: function () { run(e.code, t, 'bad', bad); } }, WS.icon('zap'), 'Trigger'), bad);
    if (t.good) actions.appendChild(el('button', { class: 'btn sm ghost', onclick: function () { run(e.code, t, 'good', good); } }, WS.icon('check'), 'Valid request'));
    if (t.good) actions.appendChild(good);
    if (t.open) actions.appendChild(el('a', { class: 'btn sm ghost', href: t.send.path, target: '_blank', rel: 'noopener' }, WS.icon('external'), 'Open'));
    return el('article', { class: 'trig-tile', style: { '--ec': e.color } },
      el('div', { class: 'trig-head' },
        el('b', { text: e.code }),
        el('div', { class: 'trig-chips' },
          el('span', { class: 'chip', text: t.by === 'server' ? 'webserv decides' : 'CGI app decides' }),
          t.probe ? el('span', { class: 'chip', text: 'raw request' }) : null)),
      el('span', { class: 'trig-name', text: e.name }),
      el('p', { class: 'trig-why', text: t.why }),
      el('pre', { class: 'trig-req', text: requestText(t) }),
      el('small', { class: 'mute' }, 'Decided in ', el('code', { text: t.where })),
      copyRow(fill(t.cmd)),
      actions);
  }

  /* ---- Grid: every code, filterable. ---- */
  var CATALOG = WS.data.errorCatalog.filter(function (e) { return TESTS[e.code]; }).sort(function (a, b) { return a.code - b.code; });
  var galFilter = 'all';
  var galQuery = '';
  var GAL = {
    all: ['All', function () { return true; }],
    client: ['4xx', function (e) { return e.kind === 'client'; }],
    server: ['5xx', function (e) { return e.kind === 'server'; }],
    webserv: ['webserv', function (e) { return TESTS[e.code].by === 'server'; }],
    app: ['CGI app', function (e) { return TESTS[e.code].by === 'app'; }]
  };

  function paintGrid() {
    var box = $('#grid');
    WS.dom.clear(box);
    CATALOG.filter(function (e) {
      return GAL[galFilter][1](e) && (!galQuery || (e.code + ' ' + e.name).toLowerCase().indexOf(galQuery) >= 0);
    }).forEach(function (e) { box.appendChild(tile(e)); });
    if (!box.children.length) box.appendChild(el('div', { class: 'empty' }, 'No error code matches this filter.'));
  }
  $('#total').textContent = CATALOG.length;
  $('#by-server').textContent = CATALOG.filter(GAL.webserv[1]).length;
  $('#by-app').textContent = CATALOG.filter(GAL.app[1]).length;
  Object.keys(GAL).forEach(function (k) {
    $('#gal-tabs').appendChild(el('button', { role: 'tab', 'aria-selected': String(k === galFilter), onclick: function () {
      galFilter = k;
      WS.dom.$$('#gal-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.textContent === GAL[k][0])); });
      paintGrid();
    } }, GAL[k][0]));
  });
  $('#gal-q').addEventListener('input', function (ev) { galQuery = ev.target.value.toLowerCase(); paintGrid(); });
  paintGrid();

  Object.keys(WS.net.status.EXACT).forEach(function (code) {
    var d = WS.net.status.describe(Number(code));
    $('#codes').appendChild(el('tr', null, el('td', null, el('span', { class: 'status ' + d.cls, text: code })), el('td', { text: d.phrase }), el('td', { class: 'dim', text: d.meaning })));
  });
}());
