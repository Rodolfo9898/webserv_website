/*
 * crud.js - controller of the CRUD manager: wires the dropzone to the upload queue, the file table to the repository,
 * and lights up the verb card that matches every request the page makes (Observer on the traffic bus).
 */
(function () {
  'use strict';
  var $ = WS.dom.$;

  var queue = WS.ui.uploadQueue.mount($('#queue'));
  WS.ui.dropzone.mount($('#dz'), { title: 'Drop files to create them', hint: 'POST /succesPost · field "binary"', onFiles: queue.add });
  WS.ui.fileTable.mount($('#files'));
  var last = WS.ui.inspector.mount($('#last'), 'Create, view or delete a file and the exchange shows up here.');

  function flash(letter) {
    var card = $('.verb.' + letter);
    if (!card) return;
    card.classList.add('fire');
    setTimeout(function () { card.classList.remove('fire'); }, 900);
  }

  WS.bus.on('http:exchange', function (ex) {
    last.show(ex);
    if (ex.method === 'POST') flash('c');
    else if (ex.method === 'DELETE') flash('d');
    else if (ex.method === 'GET') flash('r');
  });
  WS.bus.on('uploads:replaced', function () { flash('u'); });
}());
