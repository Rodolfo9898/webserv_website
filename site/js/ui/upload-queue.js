/*
 * upload-queue.js - the list of files being created (POST), one row per file.
 * Each job is a small state machine: queued -> uploading -> done | failed -> (deleted).
 * Two uploads run at a time; the repository does the HTTP, this module only paints state.
 */
(function () {
  'use strict';
  var el = WS.dom.el;
  var CONCURRENCY = 2;

  function mount(container, opts) {
    opts = opts || {};
    var list = el('div', { class: 'queue' });
    container.appendChild(list);
    var waiting = [];
    var running = 0;

    function addJob(file) {
      var safe = WS.net.uploads.sanitize(file.name);
      var bar = el('i');
      var progress = el('div', { class: 'progress' }, bar);
      var status = el('span', { class: 'chip', text: 'queued' });
      var actions = el('div', { class: 'job-actions' });
      var node = el('div', { class: 'job' },
        el('div', { class: 'job-icon' }, WS.icon(WS.ui.fileIcons.icon(safe))),
        el('div', { class: 'job-main' },
          el('div', { class: 'row between' }, el('strong', { class: 'truncate', text: safe }), status),
          el('small', { text: WS.fmt.bytes(file.size) + (safe !== file.name ? '  ·  renamed from "' + file.name + '" (the server wants names without spaces)' : '') }),
          progress, actions));
      list.insertBefore(node, list.firstChild);
      var job = { file: file, safe: safe, node: node, state: 'queued' };

      function set(state, label, cls) {
        job.state = state;
        status.textContent = label;
        status.className = 'chip ' + (cls || '');
        progress.classList.toggle('done', state === 'done');
        progress.classList.toggle('fail', state === 'failed');
      }
      job.set = set;
      job.setProgress = function (f) { progress.style.setProperty('--p', Math.round(f * 100) + '%'); if (job.state === 'uploading') status.textContent = Math.round(f * 100) + '%'; };
      job.actions = actions;
      return job;
    }

    function finish(job, result) {
      var ex = result.ex;
      var d = WS.net.status.describe(ex.status);
      WS.dom.clear(job.actions);
      if (result.ok) {
        job.setProgress(1);
        job.set('done', 'created · ' + ex.status, 'on');
        var item = { name: job.safe, href: WS.net.uploads.BASE + '/' + encodeURIComponent(job.safe) };
        job.actions.appendChild(el('a', { class: 'btn sm', href: item.href }, WS.icon('arrow'), 'Open'));
        job.actions.appendChild(el('button', { class: 'btn sm danger', onclick: function () {
          WS.net.uploads.remove(item).then(function (r) {
            if (r.ok) { job.set('deleted', 'deleted · ' + r.ex.status, 'off'); WS.dom.clear(job.actions); } else WS.ui.toast.error('Delete failed: ' + r.ex.status);
          });
        } }, WS.icon('trash'), 'Delete'));
        WS.ui.toast.ok(job.safe + ' uploaded');
      } else {
        job.set('failed', (ex.status || 'ERR') + ' ' + (ex.status ? d.phrase : 'no response'), 'off');
        job.actions.appendChild(el('button', { class: 'btn sm', onclick: function () { job.set('queued', 'queued'); job.setProgress(0); waiting.push(job); pump(); } }, WS.icon('refresh'), 'Retry'));
        WS.ui.toast.error(job.safe + ': ' + (ex.error || d.meaning));
      }
      if (opts.onSettled) opts.onSettled(job, result);
    }

    function start(job) {
      running++;
      job.set('uploading', '0%');
      WS.net.uploads.create(job.file, job.setProgress)
        .then(function (result) { finish(job, result); })
        .then(function () { running--; pump(); }, function () { running--; pump(); });
    }

    function pump() {
      while (running < CONCURRENCY && waiting.length) start(waiting.shift());
    }

    return {
      add: function (files) { files.forEach(function (f) { waiting.push(addJob(f)); }); pump(); },
      busy: function () { return running > 0 || waiting.length > 0; }
    };
  }

  WS.ns('ui.uploadQueue', { mount: mount });
}());
