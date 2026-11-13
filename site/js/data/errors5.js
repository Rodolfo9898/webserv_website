/* errors5.js - catalog of the 5xx (server error) pages. Same shape as errors4.js. */
(function () {
  'use strict';
  var list = WS.data.errorCatalog = WS.data.errorCatalog || [];
  function E(code, name, color, lead, hints) { list.push({ code: code, name: name, color: color, lead: lead, hints: hints, kind: code >= 500 ? 'server' : 'client' }); }

  E(500, 'Something went wrong on the server', '#f87171', 'The request was fine, but the server failed while handling it.', ['A CGI script that crashed, failed to start or printed garbage ends here.', 'The server itself keeps running: try again, or try another page.']);
  E(501, 'Not implemented', '#fb7185', 'The server does not support what is needed to answer this request.', ['Unlike 405, the method is not implemented at all.', 'A server may implement only a subset of HTTP methods.']);
  E(502, 'Bad gateway', '#f97316', 'A gateway or CGI program answered with something the server could not use.', ['On a server that runs CGI, a script with invalid output is the typical cause.', 'The configs currently serve the 500 page for 502.']);
  E(503, 'Service unavailable', '#fbbf24', 'The server is up but cannot take requests right now.', ['Overload or maintenance, usually temporary.', 'A Retry-After header may say when to come back.']);
  E(504, 'Gateway timeout', '#ef4444', 'A gateway or CGI program took too long to answer.', ['A script that never ends must not hang the server: it is cut off after a limit.', 'Try again, or look for an infinite loop in the script.', 'The configs currently serve the 500 page for 504.']);
  E(505, 'HTTP version not supported', '#c084fc', 'The server does not support the HTTP version used in the request.', ['The request line named a protocol version the server refuses.', 'Most servers of this kind speak HTTP/1.0 and 1.1.']);
  E(506, 'Variant also negotiates', '#f472b6', 'The server is misconfigured: its content negotiation refers to itself.', ['A rare configuration error in transparent content negotiation.', 'Only the server owner can fix it.']);
  E(507, 'Insufficient storage', '#f472b6', 'The server has no room left to store what you sent.', ['Part of WebDAV: the disk or a quota is full.', 'Free up space in the upload folder, then retry.']);
  E(508, 'Loop detected', '#fb7185', 'The server found an infinite loop while processing the request.', ['Part of WebDAV: think of two resources that each depend on the other.', 'The request can never finish, so the server stops it.']);
  E(510, 'Not extended', '#fb923c', 'The request needs an extension that the client did not declare.', ['Part of an experimental HTTP extension framework (RFC 2774).', 'Almost never seen in practice.']);
  E(511, 'Network authentication required', '#a78bfa', 'You must log in to the network before getting online.', ['Captive portals in hotels, airports and cafes send it.', 'Open any web page to reach the login screen.']);
}());
