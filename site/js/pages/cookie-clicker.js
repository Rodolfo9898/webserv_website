/*
 * cookie-clicker.js - the one clicker of the site. clicker-stores.js picks where the score lives (a server session
 * when the server has one, a browser cookie otherwise); this controller adds the cookie jar and the last exchange
 * with the session script, so the difference is visible.
 */
(function () {
  'use strict';
  var $ = WS.dom.$;
  var last = WS.ui.inspector.mount($('#last'), 'On a server with sessions, every click shows its request to the session script here.');
  WS.bus.on('http:exchange', function (ex) { if (ex.path.indexOf(WS.pages.clickerStores.API) === 0) last.show(ex); });

  WS.pages.clickerUI.mount($('#game'), WS.pages.clickerStores.auto());
  WS.ui.cookieJar.mount($('#jar'));
}());
