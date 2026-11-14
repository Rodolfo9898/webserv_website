/*
 * error-tests.js - one real test per error code, read by the error lab.
 *
 *   by     'server': webserv decides the code itself.  'app': a small CGI application (cgi/errors/app.py)
 *          decides it, the way a real application behind a server would; webserv serves the configured page.
 *   why    what the request does wrong, and why that gives this code.
 *   where  the place in the webserv sources (or the script) that makes the decision.
 *   send   the request the Trigger button sends from the browser: { method, path, headers, body, show }.
 *   probe  true when the browser cannot send that request (a broken line, a forbidden header, a missing
 *          Content-Length...): cgi/errors/probe.py writes it on a raw socket and returns both sides.
 *   show   for a probe: the request it writes, as shown on the tile.
 *   good   a request that passes the same check, to compare (optional).
 *   open   true when simply opening the URL in a tab reproduces the error.
 *   cmd    the same test from a terminal. {host} is host:port, {hostsp} is "host port" (for nc).
 */
(function () {
  'use strict';
  var APP = '/cgi-bin/errors/app.py?case=';
  var JSON_HDR = { 'Content-Type': 'application/json' };

  WS.data.errorTests = {
    400: { by: 'server', probe: true, show: 'THIS IS NOT HTTP',
      why: 'A request line must be METHOD URI VERSION. "THIS IS NOT HTTP" has four words and no HTTP version, so the parser rejects it before any route is looked at.',
      where: 'RequestLineValidation', cmd: "printf 'THIS IS NOT HTTP\\r\\n\\r\\n' | nc {hostsp}" },

    401: { by: 'app', send: { method: 'GET', path: APP + '401' }, good: { headers: { 'X-Api-Key': 'lab-key' } }, open: true,
      why: 'The private notes need an API key and the request sends none. The app answers 401 with a WWW-Authenticate header that says how to log in. webserv never passes the Authorization header to a script (RFC 3875 allows a server to keep credentials from CGI), so the key travels in X-Api-Key.',
      where: 'cgi/errors/app.py: unauthorized()', cmd: "curl -i 'http://{host}" + APP + "401'" },

    402: { by: 'app', send: { method: 'GET', path: APP + '402' }, good: { path: APP + '402&receipt=PAID-42' }, open: true,
      why: 'The premium download needs a receipt from the shop. The request carries no receipt, so the download is refused until it is paid.',
      where: 'cgi/errors/app.py: payment_required()', cmd: "curl -i 'http://{host}" + APP + "402'" },

    403: { by: 'server', send: { method: 'GET', path: '/css/' }, open: true,
      why: '/css/ is a folder. Its route has directory listing off (treeVieuw off) and the folder has no index.html, so the server has nothing it may show. The folder exists, so it is not a 404: access to it is refused.',
      where: 'RouteResolver::fromFolder', cmd: 'curl -i http://{host}/css/' },

    404: { by: 'server', send: { method: 'GET', path: '/this-page-does-not-exist' }, open: true,
      why: 'The route / matches, but the folder it points to has no file with that name.',
      where: 'ResponseTargetCheck', cmd: 'curl -i http://{host}/this-page-does-not-exist' },

    405: { by: 'server', send: { method: 'DELETE', path: '/' },
      why: 'The route / allows only [GET]. The server knows DELETE (so it is not 501), but this route does not allow it. The answer lists what is allowed in an Allow header.',
      where: 'ResponseAllowedCheck', cmd: 'curl -i -X DELETE http://{host}/' },

    406: { by: 'app', send: { method: 'GET', path: APP + '406', headers: { Accept: 'text/csv' } }, good: { headers: { Accept: 'application/json' } },
      why: 'The report only exists as JSON. The Accept header asks for CSV and nothing else, so no version of the report fits what the client will take.',
      where: 'cgi/errors/app.py: not_acceptable()', cmd: "curl -i -H 'Accept: text/csv' 'http://{host}" + APP + "406'" },

    407: { by: 'app', probe: true, show: 'GET /cgi-bin/errors/app.py?case=407 HTTP/1.1\nHost: localhost\n(no X-Proxy-Key)', good: { method: 'GET', path: APP + '407', headers: { 'X-Proxy-Key': 'lab-proxy' } },
      why: 'The app plays a forward proxy that wants its own credentials before it relays anything. None are sent, so it answers 407 with a Proxy-Authenticate header. The key travels in X-Proxy-Key because webserv keeps Proxy-Authorization from scripts. Browsers drop a 407 that does not come from a proxy they were configured with, so the probe sends this one.',
      where: 'cgi/errors/app.py: proxy_auth_required()', cmd: "curl -i 'http://{host}" + APP + "407'" },

    408: { by: 'server', probe: true, slow: true, show: 'GET / HTTP/1.1\nHost: localhost\n(no blank line ends the head, then silence)',
      why: 'The probe starts a request and stops before the blank line that ends the head. The server waits IDLE_TIMEOUT (30 seconds) for the rest, then answers 408 and closes. A client that connects and sends nothing at all is simply dropped instead. The result takes about 30 seconds to arrive.',
      where: 'ClientTender::expire', cmd: "(printf 'GET / HTTP/1.1\\r\\nHost: localhost\\r\\n'; sleep 35) | nc {hostsp}" },

    409: { by: 'server', send: { method: 'POST', path: '/post', upload: 'lab-folder' },
      why: 'The upload folder already has a folder named lab-folder. Saving the uploaded file under that name would clash with it, so the upload is refused with 409.',
      where: 'UploadStore::store', cmd: "echo hello | curl -i -F 'file=@-;filename=lab-folder' http://{host}/post" },

    410: { by: 'app', send: { method: 'GET', path: APP + '410&item=summer-sale-2023' }, good: { path: APP + '410&item=winter-sale' }, open: true,
      why: 'The shop removed the summer-sale-2023 page for good, and remembers that it did. Unlike 404, the server knows the page existed and will not come back.',
      where: 'cgi/errors/app.py: gone()', cmd: "curl -i 'http://{host}" + APP + "410&item=summer-sale-2023'" },

    411: { by: 'server', probe: true, show: 'POST /post HTTP/1.1\nHost: localhost\nContent-Type: text/plain\n(no Content-Length, no Transfer-Encoding)',
      why: 'A POST has a body, and the server must know where it ends: Content-Length or chunked encoding. This request has neither. A browser always adds Content-Length, so the probe sends it raw.',
      where: 'HeadVerdict::framing', cmd: "printf 'POST /post HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' | nc {hostsp}" },

    412: { by: 'app', send: { method: 'POST', path: APP + '412', headers: { 'If-Match': '"v1"' }, body: 'new text' }, good: { headers: { 'If-Match': '"v2"' } },
      why: 'The editor only saves over the version the client last saw. The client says it saw v1, but the document is now at v2: someone else changed it in between, so the save is refused.',
      where: 'cgi/errors/app.py: precondition_failed()', cmd: "curl -i -X POST -H 'If-Match: \"v1\"' -d 'new text' 'http://{host}" + APP + "412'" },

    413: { by: 'server', probe: true, show: 'POST /post HTTP/1.1\nContent-Length: 18500000\n(followed by 18,500,000 bytes)',
      why: 'This server sets no bodySize, so the cap is MAX_BUF - 1 (18,499,999 bytes). The probe sends 18,500,000. The server counts the body as it arrives and refuses it at the cap. A server with bodySize 1000 refuses after 1000 bytes.',
      where: 'BodySink / RequestAnswerer::handle', cmd: "head -c 18500000 /dev/zero | curl -i -X POST -H 'Content-Type: application/octet-stream' --data-binary @- http://{host}/post" },

    414: { by: 'server', send: { method: 'GET', path: '/?q=' + new Array(9001).join('a') }, open: true,
      why: 'The request line may be at most 8192 bytes (MAX_REQUEST_LINE). This URL alone is over 9000, so the server refuses it before it reads the rest.',
      where: 'HeadVerdict::sizes', cmd: "curl -i \"http://{host}/?q=$(head -c 9000 /dev/zero | tr '\\0' a)\"" },

    415: { by: 'app', send: { method: 'POST', path: APP + '415', headers: { 'Content-Type': 'text/plain' }, body: 'name=Ada' }, good: { headers: JSON_HDR, body: '{"name":"Ada"}' },
      why: 'The API only takes JSON. The body is sent as text/plain, a format it cannot read.',
      where: 'cgi/errors/app.py: unsupported_media_type()', cmd: "curl -i -H 'Content-Type: text/plain' -d 'name=Ada' 'http://{host}" + APP + "415'" },

    416: { by: 'app', send: { method: 'GET', path: APP + '416', headers: { Range: 'bytes=500-600' } }, good: { headers: { Range: 'bytes=0-9' } },
      why: 'The file is 100 bytes long. The Range header asks for bytes 500 to 600, which lie past its end. The answer says how long the file really is (Content-Range: bytes */100). A range that fits gets 206.',
      where: 'cgi/errors/app.py: range_not_satisfiable()', cmd: "curl -i -H 'Range: bytes=500-600' 'http://{host}" + APP + "416'" },

    417: { by: 'server', probe: true, show: 'GET / HTTP/1.1\nHost: localhost\nExpect: a-cup-of-tea',
      why: 'The only expectation the server can meet is "100-continue". Any other value in Expect gets 417. Browsers may not set Expect, so the probe sends it.',
      where: 'HeadVerdict::framing', cmd: "curl -i -H 'Expect: a-cup-of-tea' http://{host}/" },

    418: { by: 'app', send: { method: 'GET', path: APP + '418&brew=coffee' }, good: { path: APP + '418&brew=tea' }, open: true,
      why: 'RFC 2324: a teapot asked to brew coffee answers 418. Asked for tea, it brews.',
      where: 'cgi/errors/app.py: teapot()', cmd: "curl -i 'http://{host}" + APP + "418&brew=coffee'" },

    421: { by: 'app', probe: true, show: 'GET /cgi-bin/errors/app.py?case=421 HTTP/1.1\nHost: shop.example', good: { method: 'GET', path: APP + '421' },
      why: 'The app only answers for the names this server is set up for (localhost, 127.0.0.1, test.com, rest.com, 1.com). The probe reaches the right address but asks for shop.example. A browser cannot change Host, so the probe sends it. The valid request is a normal one from this browser.',
      where: 'cgi/errors/app.py: misdirected()', cmd: "curl -i -H 'Host: shop.example' 'http://{host}" + APP + "421'" },

    422: { by: 'app', send: { method: 'POST', path: APP + '422', headers: JSON_HDR, body: '{"email":"not-an-email","age":-3}' }, good: { body: '{"email":"ada@example.com","age":36}' },
      why: 'The sign-up form gets valid JSON (so not 400 or 415), but its content makes no sense: an email without @, and a negative age.',
      where: 'cgi/errors/app.py: unprocessable()', cmd: "curl -i -H 'Content-Type: application/json' -d '{\"email\":\"not-an-email\",\"age\":-3}' 'http://{host}" + APP + "422'" },

    423: { by: 'app', send: { method: 'POST', path: APP + '423&file=report.docx', body: 'changes' }, good: { path: APP + '423&file=notes.txt' },
      why: 'On the shared drive, report.docx is open for editing by someone else, which locks it. Saving over it is refused until the lock is released.',
      where: 'cgi/errors/app.py: locked()', cmd: "curl -i -X POST -d changes 'http://{host}" + APP + "423&file=report.docx'" },

    424: { by: 'app', send: { method: 'POST', path: APP + '424&folder=bad/name', body: 'move' }, good: { path: APP + '424&folder=photos' },
      why: 'Two steps: create a folder, then move a file into it. The folder name has a slash, so the first step cannot be done, and the move that depends on it fails too.',
      where: 'cgi/errors/app.py: failed_dependency()', cmd: "curl -i -X POST -d move 'http://{host}" + APP + "424&folder=bad/name'" },

    425: { by: 'app', send: { method: 'POST', path: APP + '425', headers: { 'Early-Data': '1' }, body: 'pay 10' }, good: { headers: {} },
      why: 'Early-Data: 1 says the request came in TLS early data, which an attacker can replay. A payment must never run twice, so the app refuses to run it that early.',
      where: 'cgi/errors/app.py: too_early()', cmd: "curl -i -X POST -H 'Early-Data: 1' -d 'pay 10' 'http://{host}" + APP + "425'" },

    426: { by: 'app', send: { method: 'GET', path: APP + '426' }, open: true,
      why: 'The secure area only answers over TLS, and this request came over plain HTTP. webserv has no TLS, so there is no valid request here. A real server would also send "Upgrade: TLS/1.3", but webserv drops Upgrade from script output because it is a hop-by-hop header.',
      where: 'cgi/errors/app.py: upgrade_required()', cmd: "curl -i 'http://{host}" + APP + "426'" },

    428: { by: 'app', send: { method: 'POST', path: APP + '428', body: 'new text' }, good: { headers: { 'If-Match': '"v2"' } },
      why: 'The editor refuses blind writes: every save must say which version it changes (If-Match). This one says nothing, so it could overwrite someone else\'s work.',
      where: 'cgi/errors/app.py: precondition_required()', cmd: "curl -i -X POST -d 'new text' 'http://{host}" + APP + "428'" },

    429: { by: 'app', send: { method: 'GET', path: APP + '429' }, burst: 4,
      why: 'The rate limit is three requests per client every ten seconds. Trigger sends four in a row: the first three pass and the fourth is refused, with a Retry-After header that says when to come back.',
      where: 'cgi/errors/app.py: too_many_requests()', cmd: "for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\\n' 'http://{host}" + APP + "429'; done" },

    431: { by: 'server', probe: true, show: 'GET / HTTP/1.1\nHost: localhost\nX-Padding: xxx... (70,000 bytes)',
      why: 'The whole request head may be at most 65536 bytes (MAX_HEAD). One header of 70,000 bytes is over the limit on its own.',
      where: 'HeadVerdict::sizes', cmd: "curl -i -H \"X-Padding: $(head -c 70000 /dev/zero | tr '\\0' x)\" http://{host}/" },

    451: { by: 'app', send: { method: 'GET', path: APP + '451&book=forbidden-novel' }, good: { path: APP + '451&book=public-domain-poem' }, open: true,
      why: 'The library has a court order against this one title. The answer says the reason is legal, and links to the order (Link: rel="blocked-by").',
      where: 'cgi/errors/app.py: legal_reasons()', cmd: "curl -i 'http://{host}" + APP + "451&book=forbidden-novel'" },

    500: { by: 'server', send: { method: 'GET', path: '/cgi-bin/errors/not_executable.py' }, open: true,
      why: 'The script exists but is not executable (mode 644, on purpose). The server checks that before it starts a script. It cannot run it, which is the server\'s own failure, not the client\'s.',
      where: 'CgiScript::canRun', cmd: 'curl -i http://{host}/cgi-bin/errors/not_executable.py' },

    501: { by: 'server', send: { method: 'BREW', path: '/' },
      why: 'BREW is a well-formed method (upper-case letters), but the server only implements GET, POST and DELETE. A malformed method such as "brew" would get 400 instead.',
      where: 'ResponseImplementedCheck', cmd: 'curl -i -X BREW http://{host}/' },

    502: { by: 'server', send: { method: 'GET', path: '/cgi-bin/errors/crash.py' }, open: true,
      why: 'The script crashes before it writes a single byte. The server is fine, but the program behind it gave nothing it could turn into a response.',
      where: 'CgiExit::toStatus', cmd: 'curl -i http://{host}/cgi-bin/errors/crash.py' },

    503: { by: 'server', probe: true, show: '(about 1050 connections that never send anything)',
      why: 'The server keeps a margin of 16 below FD_SETSIZE (1024). From descriptor 1008 on, a new client is answered 503 straight away instead of being served. The probe opens connections until that happens, then closes them all.',
      where: 'Server (OVERLOAD_MARGIN)', cmd: "ulimit -n 4096; python3 -c \"import socket; s=[socket.create_connection(('127.0.0.1', {port})) for _ in range(1050)]; print(s[-1].recv(200).decode())\"" },

    504: { by: 'server', send: { method: 'GET', path: '/cgi-bin/errors/slow.py' }, open: true,
      why: 'The script never ends. A CGI script gets 5 seconds, then the server kills it and answers 504. Other clients are served normally meanwhile. The answer takes about 5 seconds.',
      where: 'CgiHandler::isRunning, CgiDeadline', cmd: 'curl -i http://{host}/cgi-bin/errors/slow.py' },

    505: { by: 'server', probe: true, show: 'GET / HTTP/2.0\nHost: localhost',
      why: 'The version is well-formed, but it is not 1.x. A malformed version such as HTTP/x would be 400 instead. A browser always writes its own version, so the probe sends it.',
      where: 'LineVersionRule', cmd: "printf 'GET / HTTP/2.0\\r\\nHost: localhost\\r\\n\\r\\n' | nc {hostsp}" },

    506: { by: 'app', send: { method: 'GET', path: APP + '506', headers: { 'Accept-Language': 'fr' } }, good: { headers: { 'Accept-Language': 'en' } },
      why: 'The app picks a page by language. The French entry is a setup mistake: it points back at the negotiation itself instead of at a file, so it would negotiate forever.',
      where: 'cgi/errors/app.py: variant_negotiates()', cmd: "curl -i -H 'Accept-Language: fr' 'http://{host}" + APP + "506'" },

    507: { by: 'app', send: { method: 'POST', path: APP + '507', body: new Array(2049).join('a') }, good: { body: 'a small file' },
      why: 'The upload area has 1 KB of room left. The request brings 2 KB, so it cannot be stored. The body itself is fine (2 KB is far below bodySize): the storage is full.',
      where: 'cgi/errors/app.py: insufficient_storage()', cmd: "head -c 2048 /dev/zero | curl -i --data-binary @- 'http://{host}" + APP + "507'" },

    508: { by: 'server', send: { method: 'GET', path: '/loop-a' }, open: true,
      why: 'The configuration redirects /loop-a to /loop-b and /loop-b back to /loop-a. Before sending a redirect, the server follows the chain. It comes back to a route it has already seen, so it answers 508 instead of sending the browser round in circles.',
      where: 'ResponseRedirectionBodyBuilder::loops', cmd: 'curl -i http://{host}/loop-a' },

    510: { by: 'app', send: { method: 'GET', path: APP + '510' }, good: { headers: { Man: '"urn:lab:signed"; ns=16' } }, open: true,
      why: 'The API only takes requests that declare its signing extension in a Man header (RFC 2774). This one declares none.',
      where: 'cgi/errors/app.py: not_extended()', cmd: "curl -i 'http://{host}" + APP + "510'" },

    511: { by: 'app', send: { method: 'GET', path: APP + '511' }, good: { headers: { 'X-Portal-Pass': 'accepted' } }, open: true,
      why: 'The app plays a captive portal, like hotel wifi: the network wants its terms accepted before anything else goes through. This request has not accepted them.',
      where: 'cgi/errors/app.py: network_auth_required()', cmd: "curl -i 'http://{host}" + APP + "511'" }
  };
}());
