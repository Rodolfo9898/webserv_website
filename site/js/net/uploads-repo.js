/*
 * uploads-repo.js - the uploaded files as a REST resource.
 *
 *   Collection   GET    /uploads            -> list()
 *   Item         GET    /uploads/<name>     -> read(entity)
 *   Create       POST   /succesPost         -> create(file)       (multipart, field "binary")
 *   Delete       DELETE /uploads/<name>     -> remove(entity)
 *   Update       the config exposes only GET, POST and DELETE (no PUT/PATCH), so "update" is a replace that the
 *                client composes from those verbs -> replace(entity, file)
 *
 * Patterns: Repository (pages never build URLs or parse listings), Proxy-style cache for sizes,
 * Saga with a compensating action for replace(), Observer ('uploads:changed' on the bus).
 */
(function () {
  'use strict';
  var BASE = '/uploads';
  var TARGET = '/succesPost';
  var sizes = {};

  function sanitize(name) {
    /* The server expects names without spaces, so the client fixes them instead of refusing the file. */
    return name.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]+/g, '');
  }

  function entity(item) {
    return { name: item.name, href: item.href, ext: WS.fmt.ext(item.name), kind: WS.ui.fileIcons.kind(item.name) };
  }

  function changed(result) { if (result.ok) WS.bus.emit('uploads:changed', result); return result; }

  /* READ the collection */
  function list() {
    return WS.net.http.get(BASE).then(function (ex) {
      if (!ex.ok) return { ok: false, ex: ex, data: [] };
      var items = WS.net.listing.parse(ex.text || '', BASE + '/').filter(function (i) { return !i.dir; }).map(entity);
      items.sort(function (a, b) { return a.name.localeCompare(b.name); });
      return { ok: true, ex: ex, data: items };
    });
  }

  /* READ one item */
  function read(item) { return WS.net.http.get(item.href); }

  /* Size without downloading the body: stop reading as soon as the headers say how long it is. */
  function size(item) {
    if (sizes[item.href] !== undefined) return Promise.resolve(sizes[item.href]);
    var ctrl = new AbortController();
    return fetch(item.href, { cache: 'no-store', signal: ctrl.signal }).then(function (res) {
      var len = res.headers.get('content-length');
      if (len !== null) { ctrl.abort(); return Number(len); }
      return res.blob().then(function (b) { return b.size; });
    }).then(function (n) { sizes[item.href] = n; return n; }, function () { return null; });
  }

  /* CREATE */
  function create(file, onProgress) {
    var safe = sanitize(file.name);
    var upload = safe === file.name ? file : new File([file], safe, { type: file.type });
    var form = new FormData();
    form.append('binary', upload, safe);
    return WS.net.http.upload(TARGET, form, onProgress, 'multipart/form-data  binary=' + safe).then(function (ex) {
      return changed({ ok: ex.ok, ex: ex, name: safe, renamed: safe !== file.name });
    });
  }

  /* DELETE */
  function remove(item) {
    delete sizes[item.href];
    return WS.net.http.del(item.href).then(function (ex) { return changed({ ok: ex.ok, ex: ex }); });
  }

  /* UPDATE (replace). A different name is a plain create-then-delete. The same name needs the old file out of the
     way first, so the old bytes are kept in memory and put back if the new upload fails (compensating action). */
  function replace(item, file, onProgress) {
    var safe = sanitize(file.name);
    var steps = [];
    function track(r) { steps.push(r.ex); return r; }

    if (safe !== item.name) {
      return create(file, onProgress).then(track).then(function (made) {
        if (!made.ok) return { ok: false, steps: steps, note: 'Upload failed, the old file was kept.' };
        return remove(item).then(track).then(function (gone) {
          return { ok: gone.ok, steps: steps, note: gone.ok ? 'Replaced ' + item.name + ' with ' + safe : 'Uploaded, but the old file could not be deleted.' };
        });
      });
    }
    return read(item).then(function (old) {
      var backup = old.blob || new Blob([old.text || ''], { type: old.contentType });
      return remove(item).then(track).then(function (gone) {
        if (!gone.ok) return { ok: false, steps: steps, note: 'The old file could not be deleted, nothing changed.' };
        return create(file, onProgress).then(track).then(function (made) {
          if (made.ok) return { ok: true, steps: steps, note: 'Replaced ' + item.name };
          return create(new File([backup], item.name, { type: backup.type })).then(track).then(function () {
            return { ok: false, steps: steps, note: 'New upload failed: the original was put back.' };
          });
        });
      });
    });
  }

  WS.ns('net.uploads', { BASE: BASE, TARGET: TARGET, sanitize: sanitize, list: list, read: read, size: size, create: create, remove: remove, replace: replace });
}());
