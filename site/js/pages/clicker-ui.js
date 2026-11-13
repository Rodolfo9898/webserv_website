/*
 * clicker-ui.js - the cookie clicker view, independent of where the score is kept.
 * Pattern: Strategy. mount(root, store) takes a store with init(api) / click(api) / reset(api); the classic page
 * passes a browser-cookie store, the bonus page a server-session store. The view only paints and animates.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var MILESTONES = [10, 50, 100, 250, 500, 1000];

  function mount(root, store) {
    var score = 0;
    var seen = {};
    var count = el('span', { class: 'clicks', text: '0' });
    var status = el('p', { class: 'click-status' });
    var particles = el('div', { class: 'particles', 'aria-hidden': 'true' });
    var cookie = el('button', { class: 'cookie-btn', 'aria-label': 'Click the cookie' }, el('img', { src: '/assets/cookie.png', alt: '', draggable: 'false' }), particles);
    var badges = el('div', { class: 'badges' });

    var api = {
      get: function () { return score; },
      set: function (n) { score = n; paint(); },
      status: function (text, ok) { status.textContent = text; status.className = 'click-status ' + (ok === false ? 'warn' : 'ok'); }
    };

    function paint() {
      count.textContent = WS.fmt.number(score);
      WS.dom.clear(badges);
      MILESTONES.forEach(function (m) {
        var on = score >= m;
        if (on && !seen[m] && score - m < 2 && seen.ready) WS.ui.toast.ok('Milestone: ' + m + ' cookies!');
        seen[m] = on;
        badges.appendChild(el('span', { class: 'chip' + (on ? ' on' : ' off') }, WS.icon(on ? 'check' : 'lock'), String(m)));
      });
      seen.ready = true;
    }

    function pop(x, y) {
      var p = el('span', { class: 'plus', text: '+1', style: { left: x + 'px', top: y + 'px' } });
      particles.appendChild(p);
      setTimeout(function () { p.remove(); }, 900);
    }

    cookie.addEventListener('click', function (e) {
      var r = cookie.getBoundingClientRect();
      pop(e.clientX ? e.clientX - r.left : r.width / 2, e.clientY ? e.clientY - r.top : r.height / 3);
      score++;
      paint();
      store.click(api);
    });
    var resetBtn = el('button', { class: 'btn ghost sm', onclick: function () { score = 0; paint(); store.reset(api); } }, WS.icon('refresh'), 'Reset');

    root.appendChild(el('div', { class: 'clicker' }, cookie,
      el('div', { class: 'counter' }, count, el('small', { text: 'cookies' })), badges, status, resetBtn));
    paint();
    store.init(api);
    return api;
  }

  WS.ns('pages.clickerUI', { mount: mount });
}());
