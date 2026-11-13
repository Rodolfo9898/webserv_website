/*
 * stress.js - a worker pool of fetch loops against one URL, sampled every 500 ms into two charts.
 * Pattern: Worker pool (N loops pull from a shared counter) + Observer-style sampler. Traffic bypasses the
 * network tap on purpose (<body data-tap="off">): thousands of rows would only slow the page down.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var fmt = WS.fmt;

  var statEls = {};
  [['sent', 'sent'], ['ok', 'succeeded'], ['fail', 'failed'], ['rps', 'requests / s'], ['p50', 'median'], ['p95', '95th percentile'], ['max', 'slowest']].forEach(function (s) {
    var b = el('b', { text: '0' });
    statEls[s[0]] = b;
    $('#stats').appendChild(el('div', { class: 'card' }, b, el('span', { text: s[1] })));
  });
  var rpsChart = WS.ui.lineChart.create($('#charts'), { title: 'Throughput', subtitle: 'requests completed per second', color: '--chart-1', minMax: 5, format: function (v, axis) { return axis ? fmt.number(v) : fmt.number(v) + ' req/s'; } });
  var latChart = WS.ui.lineChart.create($('#charts'), { title: 'Latency', subtitle: 'average response time in each 500 ms window', color: '--chart-2', minMax: 10, format: function (v, axis) { return axis ? Math.round(v) + '' : Math.round(v) + ' ms'; } });

  var run = null;
  var go = $('#go');
  var conc = $('#conc');
  conc.addEventListener('input', function () { $('#c-val').textContent = conc.value; });

  function paintStats(r) {
    var sorted = r.lat.slice().sort(function (a, b) { return a - b; });
    var secs = Math.max(0.001, (performance.now() - r.t0) / 1000);
    statEls.sent.textContent = fmt.number(r.sent);
    statEls.ok.textContent = fmt.number(r.ok);
    statEls.fail.textContent = fmt.number(r.fail);
    statEls.rps.textContent = fmt.number(r.done / secs);
    statEls.p50.textContent = Math.round(fmt.percentile(sorted, 0.5)) + ' ms';
    statEls.p95.textContent = Math.round(fmt.percentile(sorted, 0.95)) + ' ms';
    statEls.max.textContent = Math.round(sorted.length ? sorted[sorted.length - 1] : 0) + ' ms';
    WS.dom.clear($('#codes'));
    Object.keys(r.codes).sort().forEach(function (code) {
      var d = WS.net.status.describe(Number(code));
      $('#codes').appendChild(el('span', { class: 'status ' + d.cls }, (code === '0' ? 'no response' : code + ' ' + d.phrase) + '  ×' + fmt.number(r.codes[code])));
    });
  }

  async function worker(r, url) {
    while (!r.stop && r.sent < r.total) {
      r.sent++;
      var t = performance.now();
      var status = 0;
      try {
        var res = await fetch(url, { cache: 'no-store' });
        await res.arrayBuffer();
        status = res.status;
      } catch (e) { status = 0; }
      var ms = performance.now() - t;
      r.done++;
      r.window.push(ms);
      r.lat.push(ms);
      r.codes[status] = (r.codes[status] || 0) + 1;
      if (status >= 200 && status < 400 || (url.indexOf('does-not-exist') > 0 && status === 404)) r.ok++; else r.fail++;
    }
  }

  function start() {
    var r = { total: Number($('#total').value), sent: 0, done: 0, ok: 0, fail: 0, lat: [], window: [], codes: {}, stop: false, t0: performance.now() };
    run = r;
    rpsChart.clear();
    latChart.clear();
    $('#panel').classList.add('running');
    go.lastElementChild.textContent = 'Stop';
    var last = 0;
    var sampler = setInterval(function () {
      var secs = (performance.now() - r.t0) / 1000;
      var avg = r.window.length ? r.window.reduce(function (a, b) { return a + b; }, 0) / r.window.length : 0;
      rpsChart.push({ t: secs, v: (r.done - last) * 2 });
      if (r.window.length) latChart.push({ t: secs, v: avg });
      last = r.done;
      r.window = [];
      paintStats(r);
    }, 500);
    var pool = [];
    for (var i = 0; i < Number(conc.value); i++) pool.push(worker(r, $('#target').value));
    Promise.all(pool).then(function () {
      clearInterval(sampler);
      paintStats(r);
      $('#panel').classList.remove('running');
      go.lastElementChild.textContent = 'Run again';
      run = null;
      var alive = r.ok > 0;
      (alive ? WS.ui.toast.ok : WS.ui.toast.error)(r.stop ? 'Stopped after ' + r.done + ' requests' : (alive ? 'Server still standing: ' + r.ok + ' of ' + r.done + ' requests succeeded' : 'No request succeeded: is the server running?'));
    });
  }

  go.addEventListener('click', function () { if (run) run.stop = true; else start(); });
}());
