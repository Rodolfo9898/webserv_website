/* post.js - the Create page: dropzone -> upload queue, plus the inspector for the last answer. */
(function () {
  'use strict';
  var $ = WS.dom.$;
  var last = WS.ui.inspector.mount($('#last'), 'Upload a file and the server answer shows up here.');
  var queue = WS.ui.uploadQueue.mount($('#queue'));
  WS.ui.dropzone.mount($('#dz'), { title: 'Drop files here', hint: 'POST /succesPost · field "binary"', onFiles: queue.add });
  WS.bus.on('http:exchange', function (ex) { if (ex.method === 'POST') last.show(ex); });
}());
