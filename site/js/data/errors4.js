/*
 * errors4.js - catalog of the 4xx (client error) pages. One entry per status code:
 * E(code, name, accent colour, one-sentence lead, [hints]). error-page.js, the error lab and the page generator
 * all read this list, so a text lives in exactly one place.
 */
(function () {
  'use strict';
  var list = WS.data.errorCatalog = WS.data.errorCatalog || [];
  function E(code, name, color, lead, hints) { list.push({ code: code, name: name, color: color, lead: lead, hints: hints, kind: code >= 500 ? 'server' : 'client' }); }

  E(400, 'Bad request', '#fbbf24', 'The server could not understand the request it received.', ['The request line, a header or the body could not be parsed.', 'Hand-typed requests (telnet, nc) and broken clients are the usual cause.', 'Check the URL for illegal characters or spaces.']);
  E(401, 'Unauthorized', '#a78bfa', 'This resource needs credentials, and none (or wrong ones) were sent.', ['Authentication is missing or invalid.', 'A real 401 also carries a WWW-Authenticate header that tells the client how to log in.']);
  E(402, 'Payment required', '#e879f9', 'Reserved for digital payment schemes. The code has no standard behaviour yet.', ['Defined in HTTP but never given a standard use.', 'Some APIs use it for exhausted quotas or unpaid plans.']);
  E(403, 'Forbidden', '#a78bfa', 'The server understood the request but refuses to serve it.', ['Unlike 401, signing in will not help: the answer is no.', 'A directory with listing switched off, or a file the server may not read.']);
  E(404, 'Page not found', '#22d3ee', "The page you're looking for doesn't exist.", ['No route matches this URL, or the file is not in the folder the route points to.', 'Check the spelling of the address.', 'Routes only expose the folder their entry points to.']);
  E(405, 'Method not allowed', '#fb923c', 'The method you attempted to use is not allowed on this route.', ['The route exists, but its method list does not include this verb.', 'Each route declares its own list, for example [GET] or [GET,POST].', 'Uploads go through POST on /post, deletions through DELETE on /uploads.']);
  E(406, 'Not acceptable', '#fb923c', 'The server cannot produce a response that matches the Accept headers of the request.', ['The client asked for a format the server cannot provide.', 'Content negotiation failed: no available version fits.']);
  E(407, 'Proxy authentication required', '#a78bfa', 'A proxy between you and the server needs credentials first.', ['Like 401, but the challenge comes from the proxy, not the server.', 'Set the proxy login in your client or system settings.']);
  E(408, 'Request timeout', '#2dd4bf', 'The server gave up waiting for the request to arrive.', ['The client was too slow to finish sending, so the connection was cut.', 'A server that must never hang needs a limit like this on every connection.']);
  E(409, 'Conflict', '#60a5fa', 'The request clashes with the current state of the resource.', ['Typical for edit conflicts, or creating something that already exists.', 'Resolve the conflict, then send the request again.']);
  E(410, 'Gone', '#22d3ee', 'This resource used to exist and was removed on purpose.', ['Unlike 404, the server knows it is permanently gone.', 'Remove links to it and do not retry.']);
  E(411, 'Length required', '#fbbf24', 'The request has a body but does not say how long it is.', ['A POST needs a Content-Length (or chunked encoding) so the server knows where the body ends.', 'Browsers add it for you; hand-made requests often forget it.']);
  E(412, 'Precondition failed', '#fbbf24', 'A condition in the request headers was not met.', ['Conditional headers such as If-Match decided the request must not run.', 'Fetch the current version of the resource and try again.']);
  E(413, 'Payload too large', '#f472b6', 'The request body is bigger than this server accepts.', ['The body is bigger than the bodySize limit of this server.', 'Send a smaller body or file.', 'The server on port 4445 caps bodies at 1000 bytes.']);
  E(414, 'URI too long', '#fbbf24', 'The address in the request is longer than the server is willing to read.', ['Very long query strings are the usual cause.', 'Send the data in a POST body instead.']);
  E(415, 'Unsupported media type', '#fb923c', 'The server does not accept the format of the data you sent.', ['The Content-Type of the body is not one the route can handle.', 'An upload needs multipart/form-data.']);
  E(416, 'Range not satisfiable', '#fb923c', 'The requested byte range lies outside the file.', ['A Range header asked for bytes beyond the end of the resource.', 'Download managers and video players send such ranges.']);
  E(417, 'Expectation failed', '#fbbf24', 'The server cannot meet the Expect header of the request.', ['Clients send Expect: 100-continue before big uploads.', 'A server that does not support it answers 417.']);
  E(418, "I'm a teapot", '#e879f9', 'The server refuses to brew coffee because it is, permanently, a teapot.', ['An April Fools joke from RFC 2324 that became a beloved status code.', 'It means nothing in real servers, which is the fun of it.']);
  E(421, 'Misdirected request', '#22d3ee', 'The request reached a server that cannot answer for this host.', ['That server is not set up to produce responses for the name and scheme in the request.', 'Related to virtual hosts and reused connections.']);
  E(422, 'Unprocessable content', '#60a5fa', 'The request is well formed, but its content cannot be processed.', ['The syntax is fine, the meaning is not: for example a field with an invalid value.', 'Fix the data and send it again.']);
  E(423, 'Locked', '#60a5fa', 'The resource is locked and cannot be changed right now.', ['Part of WebDAV: another user or process holds a lock on it.', 'Wait for the lock to be released.']);
  E(424, 'Failed dependency', '#60a5fa', 'The request failed because another request it depends on failed.', ['Part of WebDAV: one step of a multi-part operation went wrong.', 'Fix the first failure and retry the whole operation.']);
  E(425, 'Too early', '#2dd4bf', 'The server will not risk processing a request that might be replayed.', ['Related to TLS early data (0-RTT), where requests can be replayed.', 'Retry once the handshake has finished.']);
  E(426, 'Upgrade required', '#fb923c', 'The client must switch to another protocol to continue.', ['The server names the protocol it wants in an Upgrade header, for example TLS.', 'Old or plain clients may be asked to upgrade.']);
  E(428, 'Precondition required', '#fbbf24', 'The server requires the request to be conditional.', ['This prevents the lost-update problem when several clients edit one resource.', 'Send an If-Match header with the version you saw.']);
  E(429, 'Too many requests', '#2dd4bf', 'You are sending requests faster than the server allows.', ['A rate limit was exceeded.', 'Wait, then slow down. A Retry-After header may say how long.']);
  E(431, 'Request header fields too large', '#fbbf24', 'The headers of the request are too big for the server.', ['One header, or all of them together, exceeds the limit.', 'Oversized cookies are the classic cause: clear them and retry.']);
  E(451, 'Unavailable for legal reasons', '#e879f9', 'The resource is blocked for legal reasons.', ['A court order or a law forbids serving it. The number nods to Fahrenheit 451.', 'Unlike 403, the server says the reason is legal.']);
}());
