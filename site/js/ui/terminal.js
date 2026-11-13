/*
 * terminal.js - a fake terminal window that prints REAL data (the responses this very server just sent).
 * Pattern: Command-script runner. A script is a list of { cmd, request } steps; each step types the command, performs
 * the request through WS.net.http and prints the status line and headers it actually got, then loops.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  function mount(container, title) {
    var body = el('div', { class: 'window-body', 'aria-live': 'off' });
    container.appendChild(el('div', { class: 'window' },
      el('div', { class: 'window-bar' }, el('i'), el('i'), el('i'), el('span', { class: 'title', text: title || 'terminal' })), body));
    var cancelled = false;

    function line(children, cls) {
      var node = el('span', { class: 't-line ' + (cls || '') }, children);
      body.appendChild(node);
      return node;
    }

    async function type(text) {
      var out = el('span', { class: 't-cmd' });
      var cursor = el('span', { class: 't-cursor' });
      body.appendChild(el('span', { class: 't-line' }, el('span', { class: 't-prompt', text: '$ ' }), out, cursor));
      for (var i = 0; i < text.length && !cancelled; i++) { out.textContent += text[i]; await WS.sleep(WS.ui.fx.reduced ? 0 : 24 + Math.random() * 26); }
      cursor.remove();
    }

    function printExchange(ex) {
      var d = WS.net.status.describe(ex.status);
      var proto = (ex.protocol || 'http/1.1').toUpperCase().replace('H2', 'HTTP/2');
      line([el('span', { class: 't-status-' + (ex.status ? d.family : 0), text: proto + ' ' + (ex.status || 'ERR') + ' ' + (ex.statusText || d.phrase) })]);
      var shown = ex.headers.slice(0, 6);
      return shown.reduce(function (p, h) {
        return p.then(function () {
          line([el('span', { class: 't-hdr-k', text: h[0] + ': ' }), el('span', { class: 't-hdr-v', text: h[1] })]);
          return WS.sleep(WS.ui.fx.reduced ? 0 : 55);
        });
      }, Promise.resolve()).then(function () {
        if (ex.headers.length > shown.length) line([el('span', { class: 't-dim', text: '... +' + (ex.headers.length - shown.length) + ' more headers' })]);
        line([el('span', { class: 't-dim', text: '(' + WS.fmt.bytes(ex.size) + ' body in ' + WS.fmt.ms(ex.ms) + ')' })]);
      });
    }

    async function runStep(step) {
      await type(step.cmd);
      var ex = await WS.net.http.request(step.method || 'GET', step.path, { quiet: true, timeout: 5000 });
      if (cancelled) return;
      await WS.sleep(180);
      await printExchange(ex);
      line([' ']);
    }

    async function loop(steps, pauseMs) {
      while (!cancelled) {
        for (var i = 0; i < steps.length && !cancelled; i++) {
          if (i === 0 || body.children.length > 24) WS.dom.clear(body);
          await runStep(steps[i]);
          await WS.sleep(pauseMs || 2600);
        }
      }
    }

    return { loop: loop, stop: function () { cancelled = true; } };
  }

  WS.ns('ui.terminal', { mount: mount });
}());
