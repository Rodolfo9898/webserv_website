/* file-icons.js - maps a file name to an icon and a kind. Strategy table keyed by extension. */
(function () {
  'use strict';
  var KINDS = {
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'],
    text: ['txt', 'md', 'json', 'csv', 'log', 'html', 'css', 'js', 'py', 'pl', 'sh', 'c', 'cpp', 'h', 'hpp', 'xml', 'yml', 'yaml', 'conf'],
    archive: ['zip', 'tar', 'gz', 'tgz', 'rar', '7z']
  };
  var ICON = { image: 'image', text: 'text', archive: 'box', file: 'file' };

  function kind(name) {
    var ext = WS.fmt.ext(name);
    var found = 'file';
    Object.keys(KINDS).forEach(function (k) { if (KINDS[k].indexOf(ext) >= 0) found = k; });
    return found;
  }

  WS.ns('ui.fileIcons', {
    kind: kind,
    icon: function (name) { return ICON[kind(name)]; },
    isImage: function (name) { return kind(name) === 'image'; }
  });
}());
