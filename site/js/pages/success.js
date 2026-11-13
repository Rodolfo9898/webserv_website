/* success.js - celebrates the upload and lists the latest files (Read side of the same resource). */
(function () {
  'use strict';
  var el = WS.dom.el;
  WS.ui.fx.confetti(WS.dom.$('#confetti'));

  var box = WS.dom.$('#latest');
  box.appendChild(el('div', { class: 'empty row center' }, el('span', { class: 'spinner' }), 'Reading the uploads folder...'));
  WS.net.uploads.list().then(function (r) {
    WS.dom.clear(box);
    if (!r.ok) { box.appendChild(el('div', { class: 'empty', text: 'Could not read /uploads (' + (r.ex.status || r.ex.error) + ').' })); return; }
    if (!r.data.length) { box.appendChild(el('div', { class: 'empty', text: 'No files yet.' })); return; }
    r.data.slice(-6).reverse().forEach(function (f) {
      box.appendChild(el('a', { class: 'latest-row', href: f.href },
        el('span', { class: 'job-icon' }, WS.icon(WS.ui.fileIcons.icon(f.name))), el('strong', { class: 'truncate', text: f.name }), el('span', { class: 'chip', text: f.ext || f.kind }), WS.icon('external')));
    });
  });
}());
