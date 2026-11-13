/*
 * status.js - what an HTTP status code means *in this server*.
 * Pattern: Strategy by lookup. An exact entry wins; otherwise the status class (1xx..5xx) supplies the strategy.
 */
(function () {
  'use strict';
  var FAMILIES = {
    0: ['No response', 'The request never got an answer: the server is down, unreachable, or the connection was cut.'],
    1: ['Informational', 'An interim answer; the real response follows.'],
    2: ['Success', 'The request was understood and handled.'],
    3: ['Redirection', 'The resource lives somewhere else; the client has to follow the Location header.'],
    4: ['Client error', 'The request is wrong in some way, so the server refuses to handle it.'],
    5: ['Server error', 'The request was fine but the server failed while handling it.']
  };
  var EXACT = {
    200: ['OK', 'The server found the resource and sent it back.'],
    201: ['Created', 'A new resource was created by the request.'],
    204: ['No Content', 'Done, and there is nothing to send back.'],
    301: ['Moved Permanently', 'The route has an HTTP redirection configured: the browser follows the Location header.'],
    302: ['Found', 'Temporary redirection: the browser follows the Location header.'],
    304: ['Not Modified', 'The cached copy is still good.'],
    400: ['Bad Request', 'The request line, a header or the body could not be parsed.'],
    403: ['Forbidden', 'The resource exists, but the server will not serve it (for example a directory with listing off).'],
    404: ['Not Found', 'No route matches the URL, or the file is not under the route root.'],
    405: ['Method Not Allowed', 'The route exists, but its method list does not include this verb.'],
    408: ['Request Timeout', 'The client took too long to finish sending the request.'],
    411: ['Length Required', 'A body was sent without a length.'],
    413: ['Payload Too Large', 'The body is bigger than the bodySize limit configured for the server.'],
    414: ['URI Too Long', 'The URL is longer than the server accepts.'],
    500: ['Internal Server Error', 'Something failed while handling a valid request, for example a CGI script that crashed.'],
    501: ['Not Implemented', 'The server does not implement this method.'],
    502: ['Bad Gateway', 'A CGI script produced an answer the server could not use.'],
    504: ['Gateway Timeout', 'A CGI script took too long, so the server stopped waiting for it.']
  };

  function describe(code) {
    var fam = Math.floor(code / 100);
    var f = FAMILIES[fam] || FAMILIES[0];
    var e = EXACT[code];
    return {
      code: code,
      family: fam,
      familyName: f[0],
      phrase: e ? e[0] : f[0],
      meaning: e ? e[1] : f[1],
      cls: 's' + (FAMILIES[fam] ? fam : 0)
    };
  }

  /* <span class="status s2">200 OK</span> */
  function badge(code, textOverride) {
    var d = describe(code);
    return WS.dom.el('span', { class: 'status ' + d.cls }, code === 0 ? 'No response' : code + ' ' + (textOverride || d.phrase));
  }

  WS.ns('net.status', { describe: describe, badge: badge, FAMILIES: FAMILIES, EXACT: EXACT });
}());
