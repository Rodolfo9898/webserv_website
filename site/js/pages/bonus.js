/*
 * bonus.js - the bonus hub: one card per bonus CGI script (taken from WS.data.cgi.bonusScripts), each with a plain
 * link (the script's own page) and a "Run here" button that fetches it and shows the raw exchange plus a
 * sandboxed preview. Also mounts the cookie jar and the Perl form (inline inspection or normal navigation).
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var $ = WS.dom.$;
  var out = WS.ui.inspector.mount($('#out'), 'Run a script to see its raw answer.');

  function show(ex) {
    out.show(ex);
    $('#out').scrollIntoView({ behavior: WS.ui.fx.reduced ? 'auto' : 'smooth', block: 'nearest' });
  }

  function run(script) {
    out.loading('GET ' + script.path);
    WS.net.http.get(script.path).then(show);
  }

  WS.data.cgi.bonusScripts.forEach(function (s) {
    $('#scripts').appendChild(el('article', { class: 'card spot script-card', 'data-reveal': true },
      el('div', { class: 'top' }, el('div', { class: 'ico-lg', style: { margin: '0' } }, WS.icon(s.lang === 'Shell' ? 'terminal' : 'code')), el('span', { class: 'chip bonus', text: s.lang })),
      el('h3', { text: s.title }),
      el('code', { class: 'path', text: s.path }),
      el('p', { text: s.blurb }),
      el('div', { class: 'row' },
        el('a', { class: 'btn sm primary', href: s.path }, WS.icon('arrow'), 'Open'),
        el('button', { class: 'btn sm', onclick: function () { run(s); } }, WS.icon('play'), 'Run here'))));
  });

  /* The Perl form works as a plain form; with the box ticked it is sent from the page instead. */
  $('#perl-form').addEventListener('submit', function (e) {
    if (!$('#perl-inline').checked) return;
    e.preventDefault();
    var query = new URLSearchParams(new FormData(e.target)).toString();
    out.loading('GET /cgi-bin/get.pl');
    WS.net.http.get('/cgi-bin/get.pl?' + query).then(show);
  });

  WS.ui.cookieJar.mount($('#jar'));
  WS.ui.fx.reveal(document);
}());
