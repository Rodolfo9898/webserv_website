/* how.js - mounts the three explainers of the "How it works" page. */
(function () {
  'use strict';
  WS.pages.howLoop.mount(WS.dom.$('#loop'));
  WS.pages.howSteps.lifecycle(WS.dom.$('#life'));
  WS.pages.howSteps.config(WS.dom.$('#cfg'));
}());
