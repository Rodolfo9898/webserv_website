/*
 * file-table.js - the READ / UPDATE / DELETE side of the CRUD manager: a searchable, sortable table of the files
 * in /uploads with one action per verb on every row. Re-renders itself when 'uploads:changed' fires.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  function mount(container) {
    var items = [];
    var query = '';
    var sort = 'name';
    var body = el('tbody');
    var count = el('span', { class: 'mute' });
    var search = el('input', { class: 'input', type: 'search', placeholder: 'Filter files...', 'aria-label': 'Filter files', oninput: function () { query = search.value.toLowerCase(); paint(); } });
    var sorter = el('select', { class: 'select', 'aria-label': 'Sort by', onchange: function () { sort = sorter.value; paint(); } },
      el('option', { value: 'name', text: 'Sort: name' }), el('option', { value: 'size', text: 'Sort: size' }), el('option', { value: 'kind', text: 'Sort: type' }));
    var dialog = el('dialog', { class: 'modal' });
    var replaceInput = el('input', { type: 'file', class: 'sr-only', 'aria-label': 'Choose the replacement file' });
    var replaceTarget = null;
    var refreshBtn = el('button', { class: 'icon-btn', 'aria-label': 'Refresh the list', onclick: load }, WS.icon('refresh'));

    container.appendChild(el('div', { class: 'toolbar' }, search, sorter, refreshBtn));
    container.appendChild(el('div', { class: 'table-wrap' }, el('table', { class: 'table files' },
      el('thead', null, el('tr', null, ['', 'Name', 'Type', 'Size', 'Actions'].map(function (h) { return el('th', { text: h }); }))), body)));
    container.appendChild(el('p', { class: 'table-foot' }, count));
    container.appendChild(dialog);
    container.appendChild(replaceInput);

    function load() {
      refreshBtn.classList.add('spin');
      return WS.net.uploads.list().then(function (r) {
        refreshBtn.classList.remove('spin');
        if (!r.ok) { WS.ui.toast.error('Could not read /uploads: ' + (r.ex.status || r.ex.error)); return; }
        items = r.data;
        paint();
        items.forEach(function (it) { if (it.size === undefined) WS.net.uploads.size(it).then(function (n) { it.size = n; paintSize(it); }); });
      });
    }

    function visible() {
      var list = items.filter(function (i) { return i.name.toLowerCase().indexOf(query) >= 0; });
      list.sort(function (a, b) {
        if (sort === 'size') return (b.size || 0) - (a.size || 0);
        if (sort === 'kind') return a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
      return list;
    }

    function thumb(it) {
      if (it.kind === 'image') return el('img', { class: 'thumb', src: it.href, alt: '', loading: 'lazy', onerror: function () { this.replaceWith(el('span', { class: 'thumb ico' }, WS.icon('image'))); } });
      return el('span', { class: 'thumb ico' }, WS.icon(WS.ui.fileIcons.icon(it.name)));
    }

    function paintSize(it) {
      var cell = WS.dom.$('[data-size="' + CSS.escape(it.name) + '"]', body);
      if (cell) cell.textContent = WS.fmt.bytes(it.size);
    }

    function paint() {
      var list = visible();
      WS.dom.clear(body);
      list.forEach(function (it) {
        body.appendChild(el('tr', null,
          el('td', { class: 'c-thumb' }, thumb(it)),
          el('td', null, el('a', { class: 'fname', href: it.href, target: '_blank', rel: 'noopener', text: it.name })),
          el('td', null, el('span', { class: 'chip', text: it.ext || it.kind })),
          el('td', { class: 'mono', 'data-size': it.name, text: it.size === undefined || it.size === null ? '...' : WS.fmt.bytes(it.size) }),
          el('td', null, el('div', { class: 'row-actions' },
            btn('eye', 'View (GET)', function () { view(it); }),
            el('a', { class: 'icon-btn', href: it.href, download: it.name, title: 'Download (GET)', 'aria-label': 'Download ' + it.name }, WS.icon('download')),
            btn('edit', 'Replace (DELETE + POST)', function () { replaceTarget = it; replaceInput.click(); }),
            btn('trash', 'Delete (DELETE)', function () { confirmDelete(it); }, 'danger')))));
      });
      if (!list.length) {
        body.appendChild(el('tr', null, el('td', { colspan: '5' }, el('div', { class: 'empty' }, WS.icon('folder'), items.length ? 'No file matches this filter.' : 'The uploads folder is empty. Create a file with the drop zone.'))));
      }
      count.textContent = items.length + ' file' + (items.length === 1 ? '' : 's') + ' in ' + WS.net.uploads.BASE + (query ? '  ·  ' + list.length + ' shown' : '');
    }

    function btn(icon, title, fn, cls) {
      return el('button', { class: 'icon-btn ' + (cls || ''), title: title, 'aria-label': title, onclick: fn }, WS.icon(icon));
    }

    function openDialog(children) {
      WS.dom.clear(dialog);
      children.forEach(function (c) { dialog.appendChild(c); });
      if (dialog.showModal) { if (!dialog.open) dialog.showModal(); } else dialog.setAttribute('open', '');
    }
    function closeDialog() { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }

    function view(it) {
      WS.net.uploads.read(it).then(function (ex) {
        dialog.classList.add('wide');
        openDialog([el('h3', { text: it.name }), WS.ui.inspector.render(ex, { compact: true }),
          el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: closeDialog }, 'Close'))]);
      });
    }

    function confirmDelete(it) {
      dialog.classList.remove('wide');
      openDialog([el('h3', { text: 'Delete ' + it.name + '?' }),
        el('p', null, 'This sends ', el('code', { text: 'DELETE ' + it.href }), ' to the server. The file is removed from the uploads folder.'),
        el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: closeDialog }, 'Cancel'),
          el('button', { class: 'btn danger', onclick: function () {
            closeDialog();
            WS.net.uploads.remove(it).then(function (r) { if (r.ok) WS.ui.toast.ok('Deleted ' + it.name); else WS.ui.toast.error('Delete failed: ' + (r.ex.status || r.ex.error)); });
          } }, WS.icon('trash'), 'Delete'))]);
    }

    replaceInput.addEventListener('change', function () {
      var file = replaceInput.files[0];
      replaceInput.value = '';
      if (!file || !replaceTarget) return;
      WS.net.uploads.replace(replaceTarget, file).then(function (r) { if (r.ok) WS.ui.toast.ok(r.note); else WS.ui.toast.error(r.note); WS.bus.emit('uploads:replaced', r); });
    });

    WS.bus.on('uploads:changed', load);
    load();
    return { reload: load };
  }

  WS.ns('ui.fileTable', { mount: mount });
}());
