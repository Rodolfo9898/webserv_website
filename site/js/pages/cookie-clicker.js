/*
 * cookie-clicker.js - the classic clicker: the score lives in a browser cookie (cookieCount, 365 days), so the
 * browser sends it back to the server with every request. Strategy for clicker-ui.js.
 */
(function () {
  'use strict';
  var NAME = 'cookieCount';

  function saved() {
    var hit = WS.ui.cookieJar.read().filter(function (c) { return c.name === NAME; })[0];
    return hit ? parseInt(hit.value, 10) || 0 : 0;
  }

  var store = {
    init: function (api) {
      api.set(saved());
      api.status('The score is kept in the cookie "' + NAME + '", valid for 365 days. Reload the page: it is still here.', true);
    },
    click: function (api) { WS.ui.cookieJar.write(NAME, api.get(), 365); },
    reset: function (api) { WS.ui.cookieJar.erase(NAME); api.set(0); }
  };

  WS.pages.clickerUI.mount(WS.dom.$('#game'), store);
  WS.ui.cookieJar.mount(WS.dom.$('#jar'));
}());
