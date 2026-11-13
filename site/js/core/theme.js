/*
 * theme.js - Singleton that owns the colour scheme (dark default, light on request).
 * The inline one-liner in each <head> sets data-theme before first paint; this module keeps it in sync afterwards.
 */
(function () {
  'use strict';
  var KEY = 'theme';
  var current = WS.store.get(KEY, 'dark');

  function apply(theme) {
    current = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = current;
    WS.store.set(KEY, current);
    WS.bus.emit('theme:changed', current);
  }

  WS.ns('theme', {
    get: function () { return current; },
    set: apply,
    toggle: function () { apply(current === 'dark' ? 'light' : 'dark'); },
    /* Canvas code cannot read CSS variables by itself: resolve them once per theme. */
    cssVar: function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  });
  document.documentElement.dataset.theme = current;
}());
