*This project has been created as part of the 42 curriculum by rperez-t, jsteenpu, abaccari.*

# webserv_website

## Description

The website of the webserv project: the pages the default configuration of the server serves, the error pages, the HTML
fragments the CGI scripts print around their result, and the folder where the uploads land. It is a git submodule of
`webserv`, at `eval_helper/website/`, and this repository is that folder: what is at its root is what the server sees.

| Folder | What it is |
|---|---|
| `site/` | The pages (`index.html`, `pages/`), the error pages (`errors/`), the fragments of the CGI scripts (`cgi/`), the images and the file `siege/siegeFile` |
| `site/indexBonus.html`, `site/bonus/` | The bonus: the home page with one more button (`Go to the Bonus Page`), the page `/bonus` that links the examples of sessions and cookies (their scripts are in `cgi/bonus/` of `webserv`) and a cookie clicker whose score is kept in the session of the server. Only `config/bonus/*.conf` serve them; the mandatory configuration serves `index.html` |
| `uploads/` | Where the server saves the files it receives. Only the `.placeholder` is in git: the folder has to exist for the configuration to be accepted, and what is uploaded is ignored (`.gitignore`) |

## Instructions

### Using it

`make` in `webserv` fetches it the first time (`git submodule update --init`). To use it on its own, clone it where the
configuration expects it:

```sh
git clone https://github.com/Rodolfo9898/webserv_website.git eval_helper/website
```

The server is started from the folder of `webserv`, and the configuration files (`config/*.conf`) say `entry ./eval_helper/website`
for every route: that is the only place that has to change if the website moves.

### Moving a file

Paths are written in the code, so a file moved here has to be changed there too:

- the `entry`, `defPage` and `errors` lines of `config/*.conf` name folders and files of `site/` (`./eval_helper/website/site`,
  `/index.html`, `/site/errors/error400.html` ...): the server itself reads nothing by name;
- the pages link to each other by the names of the routes of the configuration (`/get`, `/post`, `/delete`, `/cgi` ...), and
  `pages/delete.html` lists and deletes through the route `/uploads`;
- the CGI scripts of `cgi/` read `site/cgi/cgi*{Begin,End}*.html`;
- the pages of `site/bonus/` call the scripts of `cgi/bonus/` by the address of the route `/cgi-bin` (`/cgi-bin/bonus/session.py`) and use the image `/Cookie.png`.

## Resources

- Git submodules - https://git-scm.com/book/en/v2/Git-Tools-Submodules
