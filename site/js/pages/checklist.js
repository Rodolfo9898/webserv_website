/*
 * checklist.js (page) - renders the requirement map: filter tabs, one group per area, one row per requirement with
 * links to where it can be seen and, for the things a browser cannot do, a copyable terminal command.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var KINDS = { live: ['Live demo', 'on', 'play'], explained: ['Explained', '', 'book'], config: ['Config', '', 'list'], terminal: ['Terminal', 'bonus', 'terminal'] };
  var FILTERS = {
    all: ['All', function () { return true; }],
    mandatory: ['Mandatory', function (r) { return !r.bonus; }],
    bonus: ['Bonus', function (r) { return r.bonus; }],
    terminal: ['Terminal only', function (r) { return r.kind === 'terminal' || !!r.cmd; }]
  };
  var filter = 'all';

  function row(r) {
    var k = KINDS[r.kind];
    return el('article', { class: 'req card', 'data-kind': r.kind },
      el('div', { class: 'req-head' }, el('h3', { text: r.title }),
        el('span', { class: 'chip ' + k[1] }, WS.icon(k[2]), k[0]), r.bonus ? el('span', { class: 'chip bonus', text: 'Bonus' }) : null),
      el('p', { text: r.detail }),
      r.links.length || r.cmd ? el('div', { class: 'req-foot' },
        r.links.map(function (l) { return el('a', { class: 'btn sm', href: l[1] }, WS.icon('arrow'), l[0]); }),
        r.cmd ? el('div', { class: 'cmd' }, el('span', { text: r.cmd }),
          el('button', { class: 'icon-btn', 'aria-label': 'Copy the command', onclick: function () { WS.dom.copy(r.cmd).then(function () { WS.ui.toast.ok('Command copied'); }); } }, WS.icon('copy'))) : null) : null);
  }

  function paint() {
    var box = $('#groups');
    WS.dom.clear(box);
    var rows = WS.data.checklist.filter(FILTERS[filter][1]);
    var areas = [];
    rows.forEach(function (r) { if (areas.indexOf(r.area) < 0) areas.push(r.area); });
    areas.forEach(function (area) {
      box.appendChild(el('section', { class: 'req-group' }, el('h2', { text: area }),
        el('div', { class: 'req-list' }, rows.filter(function (r) { return r.area === area; }).map(row))));
    });
    $('#summary').textContent = rows.length + ' requirement' + (rows.length === 1 ? '' : 's') + ' shown  ·  ' +
      rows.filter(function (r) { return r.kind === 'live'; }).length + ' live demos  ·  ' +
      rows.filter(function (r) { return r.kind === 'terminal' || r.cmd; }).length + ' terminal commands';
  }

  Object.keys(FILTERS).forEach(function (k) {
    $('#filters').appendChild(el('button', { role: 'tab', 'aria-selected': String(k === filter), onclick: function () {
      filter = k;
      WS.dom.$$('#filters button').forEach(function (b) { b.setAttribute('aria-selected', String(b.textContent === FILTERS[k][0])); });
      paint();
    } }, FILTERS[k][0]));
  });
  paint();
}());
