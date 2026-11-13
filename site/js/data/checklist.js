/*
 * checklist.js (data) - every requirement of the subject, and where this website lets you see it.
 * kind: live (click it against the running server), explained (a diagram), config (a line of the .conf file),
 *       terminal (a browser cannot do it: a command to run instead).
 * This is a map, not a grade: it says where to look, the demo itself shows what the server does.
 */
(function () {
  'use strict';
  var rows = [];
  function R(area, bonus, kind, title, detail, links, cmd) { rows.push({ area: area, bonus: bonus, kind: kind, title: title, detail: detail, links: links, cmd: cmd || null }); }
  var HOW = ['How it works', '/pages/how.html'], STRESS = ['Stress test', '/pages/stress.html'], CGI = ['CGI', '/cgi'], ROUTES = ['Route explorer', '/pages/routes.html'];
  var ERR = ['Error lab', '/pages/errors.html'], CREATE = ['Create', '/post'], READ = ['Read', '/pages/get.html'], SERVERS = ['Servers', '/pages/servers.html'], CRUD = ['CRUD manager', '/pages/crud.html'];

  var S = 'Server and I/O', H = 'HTTP features', C = 'Configuration', G = 'CGI', B = 'Bonus';
  R(S, false, 'explained', 'A single poll() for every I/O, the listening socket included', 'Reads and writes are watched together, and nothing is read or written without readiness.', [HOW]);
  R(S, false, 'live', 'Non-blocking at all times, disconnections handled', 'Open many connections at once and the server keeps answering the others.', [STRESS]);
  R(S, false, 'live', 'Never crashes, stays available under load', 'Fire a burst of requests and watch throughput, latency and status codes.', [STRESS], 'siege -b -c25 -t10S http://localhost:4442/siege');
  R(S, false, 'terminal', 'A request never hangs indefinitely', 'An unfinished request (no blank line) must be closed or answered after the server timeout, never held forever.', [], "printf 'GET / HTTP/1.1\\r\\nHost: localhost\\r\\n' | nc localhost 4442");
  R(S, false, 'live', 'Compatible with standard web browsers', 'You are reading this page in one.', [['Home', '/']]);
  R(S, false, 'live', 'Accurate HTTP status codes', 'Every request in the labs shows its status, headers and body.', [READ, ERR]);
  R(S, false, 'config', 'Default error pages when none is configured', 'Five pages are selected by the configs; the other 35 are ready, each with the config line that switches it on.', [ERR]);
  R(S, false, 'explained', 'fork() only for CGI', 'The child process exists only to run a script.', [CGI]);

  R(H, false, 'live', 'A fully static website', 'This whole site is plain files served by webserv.', [['Home', '/']]);
  R(H, false, 'live', 'GET, POST and DELETE', 'One lab for each verb.', [READ, CREATE, ['Delete', '/delete']]);
  R(H, false, 'live', 'Clients can upload files', 'Drag and drop with live progress, then list, replace and delete.', [CREATE, CRUD]);

  R(C, false, 'live', 'Several interface:port pairs, several websites', 'Each Server block of a config listens on its own port with its own routes.', [SERVERS]);
  R(C, false, 'config', 'Maximum size of a request body', 'bodySize in a Server block. Over the limit the answer is 413.', [CREATE, ERR], 'head -c 5000 /dev/zero | curl -i -X POST --data-binary @- http://localhost:4442/post');
  R(C, false, 'live', 'Accepted methods per route', 'A verb outside the list gets 405. Try DELETE on the home route.', [ROUTES, ERR]);
  R(C, false, 'live', 'HTTP redirection', 'The route /old-home redirects to /. Press Try it and read the status.', [ROUTES]);
  R(C, false, 'config', 'URL to folder mapping', 'A route prefix is rooted in an entry folder: the explorer shows the mapping of every route.', [ROUTES, HOW]);
  R(C, false, 'live', 'Directory listing on or off', 'The routes /uploads and /get list their folders; the others do not.', [READ, ['Raw listing', '/uploads']]);
  R(C, false, 'live', 'Default file for a directory', 'Asking for / serves the route default page.', [['Home', '/']]);
  R(C, false, 'live', 'Uploads with a configured storage location', 'uploadPath decides where a POSTed file is saved.', [CREATE, CRUD]);

  R(G, false, 'live', 'CGI chosen by file extension', 'The extension after "allowed" turns a file into a program.', [CGI]);
  R(G, false, 'live', 'The full request is available to the script', 'Environment variables and standard input; the inline inspector shows the answer.', [CGI]);
  R(G, false, 'terminal', 'Chunked requests are un-chunked, the CGI sees EOF', 'A browser never sends a chunked body; curl does when asked.', [], "curl -i -F 'binary=@README.md' -H 'Transfer-Encoding: chunked' http://localhost:4442/succesPost");
  R(G, false, 'explained', 'CGI output without a Content-Length ends at EOF', 'Step 5 of the CGI journey.', [CGI]);
  R(G, false, 'explained', 'The script runs in the right directory', 'Step 3 of the CGI journey: relative paths keep working.', [CGI]);
  R(G, false, 'live', 'At least one CGI', 'Python: a GET script and a POST upload script.', [CGI]);

  R(B, true, 'live', 'Cookies and session management, with simple examples', 'A clicker whose score lives in a server session, and a cookie jar to play with.', [['Cookie clicker', '/cookie-clicker'], ['Bonus hub', '/bonus/index.html']]);
  R(B, true, 'live', 'Several CGI types', 'Python, Perl and a shell script behind the same mechanism.', [['Bonus hub', '/bonus/index.html']]);

  WS.ns('data.checklist', rows);
}());
