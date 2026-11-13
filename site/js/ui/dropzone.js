/*
 * dropzone.js - drag & drop / click-to-browse file picker. Calls onFiles(File[]); knows nothing about uploading.
 * Works with the keyboard too: the zone is a <label> around a real file input.
 */
(function () {
  'use strict';
  var el = WS.dom.el;

  /* Dropping a file outside a zone must not make the browser navigate to it. */
  ['dragover', 'drop'].forEach(function (type) {
    window.addEventListener(type, function (e) { if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') >= 0) e.preventDefault(); });
  });

  function mount(container, opts) {
    opts = opts || {};
    var input = el('input', { type: 'file', class: 'sr-only', 'aria-label': opts.label || 'Choose files', multiple: opts.multiple !== false, accept: opts.accept });
    var zone = el('label', { class: 'dropzone' }, input,
      el('div', { class: 'dz-icon' }, WS.icon('upload')),
      el('strong', { text: opts.title || 'Drop files here' }),
      el('span', { class: 'dim', text: opts.subtitle || 'or click to browse' }),
      opts.hint ? el('small', { text: opts.hint }) : null);

    function deliver(list) {
      var files = Array.prototype.slice.call(list || []);
      if (files.length && opts.onFiles) opts.onFiles(files);
    }

    zone.addEventListener('dragenter', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', function (e) { if (!zone.contains(e.relatedTarget)) zone.classList.remove('over'); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('over'); deliver(e.dataTransfer.files); });
    input.addEventListener('change', function () { deliver(input.files); input.value = ''; });

    container.appendChild(zone);
    return { zone: zone, input: input };
  }

  WS.ns('ui.dropzone', { mount: mount });
}());
