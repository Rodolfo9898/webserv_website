/*
 * delete.js - the Delete page: tick files, delete them one request each, and run the idempotency experiment
 * (two DELETEs on the same address: the second one is the interesting answer).
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var items = [];
  var picked = {};
  var timer;

  var list = $('#list'), go = $('#go'), twice = $('#twice'), all = $('#all');
  var last = WS.ui.inspector.mount($('#last'), 'Delete a file and the answer shows up here.');
  WS.bus.on('http:exchange', function (ex) { if (ex.method === 'DELETE') last.show(ex); });

  function pickedItems() { return items.filter(function (i) { return picked[i.href]; }); }

  function sync() {
    var n = pickedItems().length;
    go.disabled = n === 0;
    twice.disabled = n === 0;
    go.lastChild.textContent = n ? ' Delete ' + n + ' selected' : ' Delete selected';
    all.checked = n > 0 && n === items.length;
  }

  function paint() {
    WS.dom.clear(list);
    items.forEach(function (it) {
      var box = el('input', { type: 'checkbox', checked: !!picked[it.href], onchange: function () { picked[it.href] = box.checked; row.classList.toggle('on', box.checked); sync(); } });
      var size = el('span', { class: 'mono mute', text: '...' });
      var row = el('label', { class: 'pick' + (picked[it.href] ? ' on' : '') }, box,
        it.kind === 'image' ? el('img', { class: 'thumb', src: it.href, alt: '', loading: 'lazy' }) : el('span', { class: 'thumb ico' }, WS.icon(WS.ui.fileIcons.icon(it.name))),
        el('strong', { class: 'truncate', text: it.name }), size);
      WS.net.uploads.size(it).then(function (n) { size.textContent = WS.fmt.bytes(n); });
      list.appendChild(row);
    });
    if (!items.length) list.appendChild(el('div', { class: 'empty' }, WS.icon('folder'), 'Nothing to delete yet. ', el('a', { class: 'link', href: '/post', text: 'Upload a file' }), ' first.'));
    sync();
  }

  function load() {
    return WS.net.uploads.list().then(function (r) {
      if (!r.ok) { WS.ui.toast.error('Could not read /uploads: ' + (r.ex.status || r.ex.error)); return; }
      items = r.data;
      Object.keys(picked).forEach(function (k) { if (!items.some(function (i) { return i.href === k; })) delete picked[k]; });
      paint();
    });
  }

  all.addEventListener('change', function () { items.forEach(function (i) { picked[i.href] = all.checked; }); paint(); });

  go.addEventListener('click', function () {
    var targets = pickedItems();
    go.disabled = true;
    targets.reduce(function (p, it) {
      return p.then(function (acc) { return WS.net.uploads.remove(it).then(function (r) { acc.push(r); return acc; }); });
    }, Promise.resolve([])).then(function (results) {
      var ok = results.filter(function (r) { return r.ok; }).length;
      if (ok === results.length) WS.ui.toast.ok('Deleted ' + ok + ' file' + (ok === 1 ? '' : 's')); else WS.ui.toast.error(ok + ' of ' + results.length + ' deleted');
    });
  });

  function box(node, ex, label) {
    WS.dom.clear(node).appendChild(el('div', null, el('small', { class: 'mute', text: label }), el('br'), el('code', { text: 'DELETE ' + ex.path }), el('div', { class: 'mt' }, WS.net.status.badge(ex.status))));
  }

  twice.addEventListener('click', function () {
    var it = pickedItems()[0];
    if (!it) return;
    $('#idem').hidden = false;
    var note = $('#idem-note');
    note.hidden = true;
    twice.disabled = true;
    WS.dom.clear($('#s1')).appendChild(el('span', { class: 'spinner' }));
    WS.dom.clear($('#s2')).appendChild(el('span', { class: 'spinner' }));
    WS.net.uploads.remove(it).then(function (a) {
      box($('#s1'), a.ex, 'first request');
      return WS.net.uploads.remove(it).then(function (b) {
        box($('#s2'), b.ex, 'second request');
        note.hidden = false;
        note.textContent = a.ex.ok && b.ex.status === 404 ? 'Exactly as expected: ' + a.ex.status + ' then 404. The file is gone either way.' :
          'First: ' + a.ex.status + ', second: ' + b.ex.status + '. Both leave the file deleted, which is what idempotent means.';
      });
    });
  });

  WS.bus.on('uploads:changed', function () { clearTimeout(timer); timer = setTimeout(load, 200); });
  load();
}());
