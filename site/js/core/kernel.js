/*
 * kernel.js - the foundation every other module stands on.
 *  - WS.ns        namespace helper (Module pattern: modules attach themselves, nobody pollutes window)
 *  - WS.bus       Observer / publish-subscribe, so modules talk without knowing each other
 *  - WS.store     Facade over localStorage / sessionStorage with an in-memory fallback
 */
(function (root) {
  'use strict';
  var WS = root.WS = root.WS || {};

  WS.ns = function (path, value) {
    var parts = path.split('.');
    var node = WS;
    for (var i = 0; i < parts.length - 1; i++) node = node[parts[i]] = node[parts[i]] || {};
    var leaf = parts[parts.length - 1];
    if (value !== undefined) node[leaf] = value;
    return node[leaf];
  };

  WS.ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  /* Observer: bus.on('topic', fn) returns an unsubscribe function. */
  WS.ns('bus', (function () {
    var topics = {};
    function on(topic, fn) {
      (topics[topic] = topics[topic] || []).push(fn);
      return function off() { topics[topic] = (topics[topic] || []).filter(function (f) { return f !== fn; }); };
    }
    function once(topic, fn) {
      var off = on(topic, function (payload) { off(); fn(payload); });
      return off;
    }
    function emit(topic, payload) {
      (topics[topic] || []).slice().forEach(function (fn) {
        try { fn(payload); } catch (e) { console.error('[bus:' + topic + ']', e); }
      });
    }
    return { on: on, once: once, emit: emit };
  }()));

  /* Storage facade: same API whatever the backend (blocked storage must never break a page). */
  function makeStore(kind) {
    var memory = {};
    var backend = null;
    try { backend = root[kind]; backend.setItem('ws.t', '1'); backend.removeItem('ws.t'); } catch (e) { backend = null; }
    return {
      get: function (key, fallback) {
        var raw = backend ? backend.getItem('ws.' + key) : memory[key];
        if (raw === null || raw === undefined) return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
      },
      set: function (key, value) {
        var raw = JSON.stringify(value);
        if (backend) backend.setItem('ws.' + key, raw); else memory[key] = raw;
      },
      remove: function (key) { if (backend) backend.removeItem('ws.' + key); else delete memory[key]; }
    };
  }
  WS.ns('store', makeStore('localStorage'));
  WS.ns('session', makeStore('sessionStorage'));

  /* Tiny helper used everywhere a Promise should wait. */
  WS.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
}(window));
