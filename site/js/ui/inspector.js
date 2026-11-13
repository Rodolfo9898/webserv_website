/*
 * inspector.js - shows one HTTP exchange the way a network tab would: status, timing, headers, body.
 * Pattern: Strategy for the body viewer (json / html / image / text / binary), picked from the Content-Type.
 * Everything from the network is rendered with textContent or a sandboxed iframe, never as live markup.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var MAX_CHARS = 30000;

  function kind(ex) {
    var t = ex.contentType.toLowerCase();
    if (ex.blob && /^image\//.test(t)) return 'image';
    if (ex.blob) return 'binary';
    if (/json/.test(t)) return 'json';
    if (/html/.test(t)) return 'html';
    return 'text';
  }

  var viewers = {
    json: function (ex) { try { return JSON.stringify(JSON.parse(ex.text), null, 2); } catch (e) { return ex.text; } },
    html: function (ex) { return ex.text; },
    text: function (ex) { return ex.text || ''; },
    binary: function (ex) { return '(binary body, ' + WS.fmt.bytes(ex.size) + ', ' + ex.contentType + ')'; },
    image: function (ex) { return '(image, ' + WS.fmt.bytes(ex.size) + ', ' + ex.contentType + ')'; }
  };

  function bodyText(ex) {
    var t = viewers[kind(ex)](ex);
    return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) + '\n... (' + WS.fmt.bytes(ex.size) + ' in total, cut here)' : (t || '(empty body)');
  }

  function proto(ex) {
    var p = (ex.protocol || '').toLowerCase();
    return p === 'h2' ? 'HTTP/2' : /^http\/1\.[01]$/.test(p) ? p.toUpperCase() : 'HTTP/1.1';
  }

  function rawText(ex) {
    var reqHdr = Object.keys(ex.requestHeaders).map(function (k) { return k + ': ' + ex.requestHeaders[k]; });
    var out = [ex.method + ' ' + ex.path + ' ' + proto(ex), 'Host: ' + location.host].concat(reqHdr);
    if (ex.requestBody) out.push('', String(ex.requestBody).slice(0, 600));
    out.push('', '');
    out.push(proto(ex) + ' ' + ex.status + ' ' + (ex.statusText || WS.net.status.describe(ex.status).phrase));
    ex.headers.forEach(function (h) { out.push(h[0] + ': ' + h[1]); });
    out.push('', bodyText(ex).slice(0, 900));
    return out.join('\n');
  }

  function panes(ex) {
    var k = kind(ex);
    var list = [];
    if (k === 'html') list.push({ id: 'preview', label: 'Preview' });
    if (k === 'image') list.push({ id: 'preview', label: 'Preview' });
    list.push({ id: 'body', label: 'Body' }, { id: 'headers', label: 'Headers (' + ex.headers.length + ')' }, { id: 'raw', label: 'Raw' });
    return list;
  }

  function paneNode(ex, id) {
    if (id === 'preview') {
      if (kind(ex) === 'image') return el('div', { class: 'body-view' }, el('img', { src: URL.createObjectURL(ex.blob), alt: 'Response image' }));
      return el('div', { class: 'body-view frame' }, el('iframe', { sandbox: '', srcdoc: ex.text, title: 'Rendered response' }));
    }
    if (id === 'headers') {
      var rows = ex.headers.map(function (h) { return el('tr', null, el('td', { text: h[0] }), el('td', { text: h[1] })); });
      return el('div', { class: 'body-view' }, ex.headers.length ? el('table', { class: 'hdr-table' }, el('tbody', null, rows)) : '(the browser exposed no headers)');
    }
    return el('pre', { class: 'body-view', text: id === 'raw' ? rawText(ex) : bodyText(ex) });
  }

  function render(ex, opts) {
    opts = opts || {};
    var d = WS.net.status.describe(ex.status);
    var meaning = ex.error ? 'No answer: ' + ex.error + '.' : d.meaning;
    if (ex.redirected && ex.status > 0) meaning = 'The server redirected the request, and the browser followed it to ' + ex.finalUrl.replace(location.origin, '') + '. ' + meaning;

    var meta = [WS.fmt.ms(ex.ms), WS.fmt.bytes(ex.size), proto(ex)].filter(Boolean).join('  ·  ');
    var pane = el('div');
    var tabs = el('div', { class: 'tabs', role: 'tablist' });
    var list = panes(ex);

    function select(id) {
      WS.dom.$$('button', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.id === id)); });
      WS.dom.clear(pane).appendChild(paneNode(ex, id));
    }
    list.forEach(function (p) { tabs.appendChild(el('button', { role: 'tab', 'data-id': p.id, onclick: function () { select(p.id); } }, p.label)); });

    var root = el('section', { class: 'inspector' },
      el('div', { class: 'insp-head' },
        el('span', { class: 'method ' + ex.method.toLowerCase(), text: ex.method }),
        el('span', { class: 'url', title: ex.path, text: ex.path }),
        WS.net.status.badge(ex.status),
        el('span', { class: 'meta', text: meta })),
      el('div', { class: 'insp-meaning', text: meaning }),
      el('div', { class: 'insp-body' },
        el('div', { class: 'insp-tabs' }, tabs,
          opts.compact ? null : el('button', { class: 'btn sm ghost', onclick: function () { WS.dom.copy(rawText(ex)).then(function () { WS.ui.toast.ok('Raw exchange copied'); }); } }, WS.icon('copy'), 'Copy raw')),
        pane));
    select(list[0].id);
    return root;
  }

  /* A slot that always shows the latest exchange (or a hint when there is none yet). */
  function mount(container, hint) {
    function clear() {
      WS.dom.clear(container).appendChild(el('div', { class: 'inspector' }, el('div', { class: 'insp-empty', text: hint || 'Send a request to see the response here.' })));
    }
    clear();
    return {
      show: function (ex) { WS.dom.clear(container).appendChild(render(ex)); return ex; },
      loading: function (label) { WS.dom.clear(container).appendChild(el('div', { class: 'inspector' }, el('div', { class: 'insp-empty row center' }, el('span', { class: 'spinner' }), label || 'Waiting for the server...'))); },
      clear: clear
    };
  }

  WS.ns('ui.inspector', { render: render, mount: mount, rawText: rawText });
}());
