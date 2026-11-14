*This project has been created as part of the 42 curriculum by rperez-t, jsteenpu, abaccari.*

# webserv_website

## Description

The website of the webserv project: a showcase that is **served by the server it presents**. Every page, request,
upload and error you see on it is real. It is a git submodule of `webserv` (`eval_helper/website/`), and this
repository is that folder: what is at its root is what the server sees.

Plain HTML, CSS and JavaScript. No framework, no build step, no package to install, no external font or CDN.
Every file is under 250 lines.

What it shows, page by page (route in the configuration, or file under `site/` for pages without a route):

| Page | Address | Feature of webserv it demonstrates |
|---|---|---|
| Home | `/` (`indexBonus.html` with a bonus config) | Static site, default file, live terminal with real responses |
| Subject checklist | `/pages/checklist.html` | Every requirement of the subject (mandatory and bonus) mapped to a live demo, a diagram, a config line or a terminal command |
| Read | `/pages/get.html` | GET, headers, redirects, directory listing, binary bodies |
| Create | `/post`, `/succesPost` | POST multipart uploads, progress, body-size limit |
| Delete | `/delete` | DELETE on `/uploads`, idempotency experiment |
| CRUD manager | `/pages/crud.html` | The whole REST cycle on the `/uploads` resource |
| CGI | `/cgi` (`/cgiPython` forwards here) | CGI by extension, environment, stdin/stdout pipes, the two Python scripts |
| How it works | `/pages/how.html` | poll() loop, request lifecycle, annotated config |
| Route explorer | `/pages/routes.html` | Every route of the config, with a live "Try it" |
| Error lab | `/pages/errors.html` | A real test for each of the 40 error codes: why it happens, where it is decided, a trigger and a terminal command |
| Servers | `/pages/servers.html`, `indexServer2/3.html` | Several servers and ports in one process |
| Stress test | `/pages/stress.html` | Stability under load, throughput and latency charts |
| Cookies and sessions | `/cookie-clicker` | One clicker: score in a server session when the server has one (bonus), in a cookie otherwise |
| Bonus | `/bonus` (`/cgiPerl` forwards here) | Python, Perl and shell CGI, session and cookie scripts (bonus configs only) |

`/cgiPython`, `/cgiPerl` and `/bonus/cookie-clicker.html` are one-line forwarding pages: the configs name those files,
so they stay, but the content moved to `/cgi`, `/bonus` and `/cookie-clicker`.

## Instructions

### Using it

`make` in `webserv` fetches it the first time (`git submodule update --init`). To use it on its own, clone it where the
configuration expects it:

```sh
git clone https://github.com/Rodolfo9898/webserv_website.git eval_helper/website
```

Start the server from the folder of `webserv` and open `http://localhost:4442`:

```sh
./webserv config/defaultConfig.conf                      # mandatory part
./webserv_bonus config/bonus/defaultConfig.conf          # bonus: sessions, cookies, more CGI
./webserv config/multiServerConfig.conf                  # ports 4444 and 4445 (see /pages/servers.html)
```

The configuration files say `entry ./eval_helper/website` for every route: that is the only place that has to change if
the website moves. The site adapts to the config it runs under: bonus links appear only when `/bonus` answers.

### What the server must provide

The site only needs standard behaviour, but three things are worth knowing:

- `.css`, `.js`, `.png` and `.ico` files must be served with their usual `Content-Type`; browsers refuse a stylesheet
  labelled `text/plain`. If the pages show up unstyled, check the content types first.
- Directory listing markup: links inside `.styled-list`, with hrefs that resolve to the file (`js/net/listing.js` is the only
  place that reads it).
- No external requests: fonts are the system stack, icons and the cookie are inline SVG, backgrounds are CSS and canvas.
  The only binary file is `favicon.ico`, the webserv logo.

### Layout of the code

| Folder | Content |
|---|---|
| `site/*.html`, `site/pages/`, `site/bonus/` | One small HTML file per page: head, `<main>` skeleton, one `<script>` |
| `site/errors/` | One page per HTTP error status, 40 in all (29 client, 11 server): `error400.html` ... `error511.html`, generated from the catalog in `js/data/errors4.js` and `errors5.js` |
| `site/cgi/` | Fragments printed around the output of the CGI scripts (`cgi*Begin*.html` and `cgi*End*.html`) |
| `site/css/` | `main.css` imports tokens, base, shell, components, and one stylesheet per page family |
| `site/js/boot.js` | The loader: reads `data-page` and loads the core, the shell and that page's modules, in order |
| `site/js/core/` | Namespace and event bus, DOM factory, icons, theme |
| `site/js/net/` | HTTP client with middleware, status strategies, feature detection, listing adapter, uploads repository |
| `site/js/ui/` | Layout shell, background canvas, inspector, traffic tap, dropzone, upload queue, file table, charts |
| `site/js/pages/` | One controller per page (and its view builders) |
| `site/js/data/` | `config.js` is a hand-kept mirror of the `.conf` files, `nav.js` is the site map |
| `uploads/` | Where the server saves what it receives. Only the `.placeholder` is in git (`.gitignore`) |

### Design patterns, and where they live

| Pattern | Where |
|---|---|
| Module / namespace | `core/kernel.js` (`WS.ns`), every file is an IIFE that registers itself |
| Observer (publish/subscribe) | `WS.bus`: `http:exchange` feeds the traffic tap and inspectors, `uploads:changed` refreshes the lists |
| Facade | `net/http.js` hides fetch and XHR behind `get/post/del/upload` |
| Chain of responsibility | HTTP middleware: recorder, error mapper, timing, timeout |
| Repository | `net/uploads-repo.js`: the uploads as a REST resource (list, read, create, remove, replace) |
| Adapter | `net/listing.js` turns the server's HTML listing into entities |
| Saga with compensation | `replace()` in the repository: the old bytes are put back if the new upload fails |
| Strategy | status descriptions, body viewers, route filters, clicker storage (cookie vs session) |
| Factory | `WS.dom.el()` builds every node; text is never injected as HTML |
| Singleton | theme, toast host, traffic tap |
| State machine | upload jobs: queued, uploading, done or failed, deleted |
| Worker pool | `pages/stress.js` |
| Template functions over data | `home-view.js`, `nav.js`, `config.js` |

### REST and CRUD

The `/uploads` route is the resource: `GET /uploads` is the collection, `GET /uploads/<name>` an item, `POST /succesPost`
creates one, `DELETE /uploads/<name>` removes one. The configuration enables only GET, POST and DELETE, so the UI
composes an update ("replace") from DELETE and POST, with a rollback. Adding `PUT` to a route's `method` list would make
a real update possible.

### Error pages

The configs set all 40 pages, one `errors` line per status, for example

```
errors /site/errors/error403.html [403] ;
```

To change a text, edit its catalog entry (`js/data/errors4.js`, `errors5.js`) and the matching static page: the HTML
file only repeats the title and the lead for browsers without JavaScript.

The error lab (`js/data/error-tests.js`) has one test per code. 18 codes are decided by webserv itself; the other 22
come from small CGI applications in the server repository (`cgi/errors/app.py`), each checking one real rule.
Requests a browser cannot write are sent raw by `cgi/errors/probe.py`. Some tests rely on fixtures:
`uploads/lab-folder/` (409), the `/loop-a` and `/loop-b` routes of the configs (508), and
`cgi/errors/not_executable.py` staying mode 644 (500).

### Keeping it in sync

Paths are written in the code, so a file moved here has to be changed there too:

- the `entry`, `defPage` and `errors` lines of `config/*.conf` name folders and files of `site/`: the server itself reads
  nothing by name;
- `js/data/config.js` copies what the `.conf` files declare (routes, ports, limits). Change a config, change that copy;
- the CGI scripts read `site/cgi/cgi*{Begin,End}*.html`: keep these file names, and keep the pairs balanced (the begin
  fragment opens `<main>` and a card, the end fragment closes them);
- the upload form posts the field `binary` to `/succesPost`, the CGI upload form posts `uploadedfile` to `/cgi-bin/post.py`;
- the cookie clicker uses `/cgi-bin/bonus/clicker.py` (GET returns `{session, score}`, POST `click=1` or `reset=1`); when it
  answers `session: false`, or is missing, the page keeps the score in the cookie `cookieCount` instead;

## Resources

- Git submodules - https://git-scm.com/book/en/v2/Git-Tools-Submodules
- HTTP semantics (methods, status codes) - https://www.rfc-editor.org/rfc/rfc9110
- CGI, the Common Gateway Interface - https://www.rfc-editor.org/rfc/rfc3875
- MDN: Fetch, XMLHttpRequest upload progress, CSS `@property`, `<dialog>`
- AI use: the redesign of this website (structure, styling, scripts) was produced with Claude Code, then checked with
  unit tests of the logic modules and a static check of links, modules and file sizes. See the commit history.
