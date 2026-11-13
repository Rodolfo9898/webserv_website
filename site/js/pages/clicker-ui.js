/*
 * clicker-ui.js - the cookie clicker view, independent of where the score is kept.
 * Pattern: Strategy. mount(root, store) takes a store with init(api) / click(api) / reset(api); the stores live in
 * clicker-stores.js. The cookie is drawn as inline SVG (no image file, no extra request).
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var MILESTONES = [10, 50, 100, 250, 500, 1000];

  var COOKIE = '<svg viewBox="0 0 200 200" aria-hidden="true"><defs>' +
    '<radialGradient id="ck-body" cx="34%" cy="28%" r="85%"><stop offset="0" stop-color="#f8cf7a"/><stop offset=".55" stop-color="#dc9b45"/><stop offset="1" stop-color="#a9691f"/></radialGradient>' +
    '<radialGradient id="ck-chip" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#6b3b1f"/><stop offset="1" stop-color="#2e170a"/></radialGradient>' +
    '<mask id="ck-bite"><rect width="200" height="200" fill="#fff"/><circle cx="168" cy="38" r="30" fill="#000"/><circle cx="188" cy="76" r="14" fill="#000"/></mask></defs>' +
    '<g mask="url(#ck-bite)"><circle cx="100" cy="102" r="92" fill="#7d4a14"/><circle cx="100" cy="98" r="90" fill="url(#ck-body)"/>' +
    '<circle cx="100" cy="98" r="84" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>' +
    '<g fill="url(#ck-chip)"><ellipse cx="62" cy="62" rx="14" ry="10" transform="rotate(-20 62 62)"/><ellipse cx="112" cy="50" rx="11" ry="8" transform="rotate(25 112 50)"/>' +
    '<ellipse cx="136" cy="104" rx="15" ry="10" transform="rotate(12 136 104)"/><ellipse cx="78" cy="118" rx="16" ry="11" transform="rotate(-8 78 118)"/>' +
    '<ellipse cx="44" cy="108" rx="9" ry="7"/><ellipse cx="108" cy="148" rx="13" ry="9" transform="rotate(18 108 148)"/><ellipse cx="150" cy="142" rx="8" ry="6"/><ellipse cx="96" cy="86" rx="8" ry="6"/></g>' +
    '<g fill="#fff" fill-opacity=".28"><circle cx="58" cy="57" r="3"/><circle cx="131" cy="99" r="3"/><circle cx="73" cy="113" r="3.5"/><circle cx="108" cy="46" r="2.5"/></g>' +
    '<g fill="#7d4a14" fill-opacity=".45"><circle cx="30" cy="80" r="2.4"/><circle cx="150" cy="70" r="2.4"/><circle cx="60" cy="150" r="2.4"/><circle cx="124" cy="166" r="2.4"/><circle cx="88" cy="30" r="2.4"/><circle cx="172" cy="120" r="2.4"/></g></g></svg>';

  function mount(root, store) {
    var score = 0;
    var seen = {};
    var count = el('span', { class: 'clicks', text: '0' });
    var status = el('p', { class: 'click-status' });
    var mode = el('span', { class: 'chip', text: 'looking for a session...' });
    var particles = el('div', { class: 'particles', 'aria-hidden': 'true' });
    var art = el('span', { class: 'cookie-art', html: COOKIE });
    var cookie = el('button', { class: 'cookie-btn', 'aria-label': 'Click the cookie' }, art, particles);
    var badges = el('div', { class: 'badges' });

    var api = {
      get: function () { return score; },
      set: function (n) { score = n; paint(); },
      status: function (text, ok) { status.textContent = text; status.className = 'click-status ' + (ok === false ? 'warn' : 'ok'); },
      mode: function (label, on) { mode.textContent = label; mode.className = 'chip ' + (on ? 'on' : 'bonus'); }
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
    var resetBtn = el('button', { class: 'btn ghost sm', onclick: function () { score = 0; paint(); store.reset(api); } }, WS.icon('refresh'), 'Reset score');

    root.appendChild(el('div', { class: 'clicker' }, mode, cookie,
      el('div', { class: 'counter' }, count, el('small', { text: 'cookies' })), badges, status, resetBtn));
    paint();
    store.init(api);
    return api;
  }

  WS.ns('pages.clickerUI', { mount: mount });
}());
