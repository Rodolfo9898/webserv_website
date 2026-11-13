/*
 * home.js - controller of the landing page. Renders the views, starts the live terminal, counts the stats,
 * and asks each server port whether it is up. Shared by index.html and indexBonus.html.
 */
(function () {
  'use strict';
  var V = WS.pages.homeView;
  var main = document.getElementById('home');

  main.appendChild(V.hero());
  main.appendChild(V.marquee());
  main.appendChild(V.stats());
  main.appendChild(V.section('Everything webserv can do, as something you can click', 'Each card opens a live demo that talks to this server.', V.features()));
  main.appendChild(V.section('What happens to a request', 'The same five steps for every route, every method.', V.lifecycle()));
  main.appendChild(V.section('Listening on several ports', 'The configs in the repository start up to four servers. Green means that port answers right now.', V.serverCards()));
  main.appendChild(V.cta());

  WS.ui.fx.reveal(main);
  WS.ui.layout.applyEdition(main);
  WS.dom.$$('[data-count]', main).forEach(function (n) { WS.ui.fx.countUp(n, Number(n.getAttribute('data-count')), 1400); });

  /* Live terminal: four real requests, looping. */
  var term = WS.ui.terminal.mount(document.getElementById('hero-term'), 'live  ·  real responses from ' + location.host);
  term.loop([
    { cmd: 'curl -i ' + location.host + '/', path: '/' },
    { cmd: 'curl -i ' + location.host + '/nothing-here', path: '/nothing-here' },
    { cmd: 'curl -i -X DELETE ' + location.host + '/', method: 'DELETE', path: '/' },
    { cmd: 'curl -i ' + location.host + '/old-home', path: '/old-home' }
  ], 2800);

  /* Which of the configured ports answer? (Other ports are other origins, so only reachability is known.) */
  WS.dom.$$('.srv-card', main).forEach(function (card) {
    WS.net.features.probe(Number(card.getAttribute('data-port'))).then(function (r) {
      card.classList.add(r.up ? 'up' : 'down');
      card.querySelector('.state span').textContent = r.up ? 'online · ' + Math.max(1, Math.round(r.ms)) + ' ms' : 'not running';
    });
  });
}());
