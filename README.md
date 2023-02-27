# screen/ -- Self-hosted Screenshot Hosting & Annotating

screen/ is a web-app to host and share screenshots. It's like Imgur plus Skitch,
but in the browser, and for companies. The use case is enterprise-wide
screenshots, in which you want to share screenshots widely but not expose
confidential information to the public. Additionally, it provides basic
annotation tools in a web UI, something that other image hosting products --
even the screenshot-oriented ones -- don't do.

The inspiration is Google's internal screen/ tool, hence the name. It's
somewhat unbelievable that such as useful tool used by, probably, every
Googler doesn't have an external equivalent. If something like this already
exists out there I was unable to find it. Maybe because of the name.
(Keywords: CorpEng)

## Features

- Four methods of uploading a screenshot: companion browser extension,
  drag-and-drop, paste, and file upload
- Saves screenshot source URL when the chrome extension is used and shows the
  URL when the screenshot is viewed. This is a significant enhancement to
  screenshot productivity which other solutions lack.
- Common annotation tools: lines, arrows, highlghter, boxes, circles, text,
  and blur
- Simple Permissions Mode -- ACLs are not supported; anybody can upload a
  screenshot, the uploader can edit it, and anybody can view it. Once SSO is
  supported then this will support a role that does or does not have access
  to screen/, but complexities like sharing are unlikely to be supported.
- Screenshot IDs are 64 bit partially-random numbers; while sharing is "public",
  discoverability by a curious employee via enumeration attacks is unlikely.
- Advanced Authentication Support (planned) - In line with being for enterprise
  use, screen/ will support various SSO providers.
- Companion chrome extension for capturing screenshots in the browser.

## Vision & Target Audience

While the inspiration might come from inside Google, this is not meant to be a
Google-scale solution. The target audience for this is tech-forward companies
which need screenshots (which often happens in bug investigations, but also for
so many other reasons) and can self-host their own software. Ideal company size
is less than a few thousand -- hundred-thousand-person-plus companies with high
usage will likely need something more robust. (Though I fully expect that this
will be able to sustain a few QPS of uploads and tens of QPS of downloads, which
should cover all but the largest companies.)

## Status

This is a proof-of-concept with the goal of gaining interest, users, and
contributors. You can easily download and execute screen/ locally to test how
works: you can upload screenshots, annotate them, and share the URL with others.
With that being said,there are some key features missing, namely authentication.
While you could host this behind a firewall, you want authentication to ensure
that only the uploader can annotate their screenshots.

## Installation & Execution

1. Clone or download this repository
1. Install from requirements.txt
1. Create Google OAuth client and download `client_secrets.json` file
1. Create `server/config/config.env` with your
   [configuration parameters](#configuration-parameters).
1. Optionally, install the chrome extension by opening up `chrome://extensions`,
   enabling developer mode, and then `Load unpacked` from the
   `extension/chrome-extension` directory
1. From the `server` directory, execute `python -m flask initdb`
1. From the `server` directory, execute `python -m flask --debug run -p 8000`
1. Visit [http://localhost:8000](http://localhost:8000)

### Configuration Parameters

Configuration parameters can be set through one or more of the following
mechanisms:

1. Environment variables set in the shell before executing python, and/or
1. Environment variables possibly loaded from `config/config.env`, and/or
1. Environment variables possibly loaded from `config/config_debug.env`, **if**
   flask debug mode is set

Environment variables loaded from `.env` files are in the
[dotenv format](https://hexdocs.pm/dotenvy/dotenv-file-format.html).

Earlier mechanisms are overwritten by later mechanisms; a config value set in
the shell environment is overridden by one set in `config.env` which is
overridden by one set in `config_debug.env`. Typically one will rely on loading
config values from both `dotenv` files in development and will then use Docker's
`dotenv` support (`--env-file`) to load the `config.env` file in production.

All environment variable names below should be prefaced with `FLASK_`. Boolean
values should be lowercase `true` or `false`.

- `DB_FILE` - (Relative) path to sqlite file. Must be created first with
  `python -m flask initdb`; the docker image will do this for you on its first
  execution.
- OIDC-specific settings as
  [documented here](https://flask-oidc.readthedocs.io/en/latest/#settings-reference),
  and specifically including:
  - `OIDC_CLIENT_SECRETS` - Relative path to `client_secrets.json` file.
  - `OIDC_COOKIE_SECURE` - `false` if you're developing locally without SSL;
    should be `true` or non-existent when deployed.
  - `OIDC_GOOGLE_APPS_DOMAIN` - The domain from which you want to limit logins.
- `SECRET_KEY` - A large random string, used by
  [Flask for session cookies](https://flask.palletsprojects.com/en/2.2.x/config/#SECRET_KEY).
- File Storage Configuration
  - `STORAGE_SERVICE` - `LOCAL` or `S3` or `GCS`.
  - `STORAGE_CLOUD_LOCAL_CACHE` - Set to `true` to if you're using a cloud
    storage provider (`S3` or `GCS`) and you wish to _also_ use the local
    storage provider for caching purposes, in which case `STORAGE_LOCAL_DIR`
    must be a valid local directory. Defaults to `false`.
  - `STORAGE_LOCAL_DIR` - Local directory for screenshot storage. Required if
    `STORAGE_SERVICE` is `LOCAL` or if `STORAGE_SERVICE` is a cloud service
    (`S3` or `GCS`) and `STORAGE_CLOUD_LOCAL_CACHE` is `true`.
  - `STORAGE_S3_BUCKET` - S3 bucket name. Required for S3.
  - `STORAGE_S3_KEY` - S3 authorization key. Required for S3.
  - `STORAGE_S3_SECRET` - S3 authorization secret key. Required for S3.
  - `STORAGE_GCS_BUCKET` - GCS bucket name. Required for GCS.
  - `STORAGE_GCS_SAKE` - Relative path to service account key export `json`
    file. Required for GCS.

## Screenshots

### Screenshot View as screenshot uploader

![Screenshot 2023-02-14 22 10 21](https://user-images.githubusercontent.com/761381/218946855-0bbb3446-9782-49ea-90a7-c277705b4e9d.png)

## Todo

1. ~~Implement SSO-based authentication~~
1. Create thumbnails on upload
1. Convert non-PNGs to PNGs on upload
1. Overwrite the image when blurring
   ([Issue #2](https://github.com/jamesshannon/screen/issues/2))
1. ~~Cloud-based StorageService library to store images in AWS / GCP~~
1. Homepage section which shows your recently created images
1. LRU-based request caching, including invalidating another process' cache
1. ~~Docker-based deployment~~
1. Unit tests
1. PII detection to mark a screenshot as non-public
1. Support for copying short urls (e.g., screen/abc or go/screen/abc)

## Attributions

Icons came from flaticon, specifically:

- Highlighter - <a href="https://www.flaticon.com/free-icons/marker"
  title="marker icons">Marker icons created by mavadee - Flaticon</a>
- Diagonal Line, Arrow <a href="https://www.flaticon.com/free-icons/stripe"
  title="stripe icons">Stripe icons created by Lyolya - Flaticon</a>
- Eraser, Circle, Rectangle, Text, Screenshot <a
  href="https://www.flaticon.com/free-icons/eraser" title="eraser icons">Eraser
  icons created by Freepik - Flaticon</a>
- Website <a href="https://www.flaticon.com/free-icons/domain" title="domain
  icons">Domain icons created by Lizel Arina - Flaticon</a>
- Upload Image <a href="https://www.flaticon.com/free-icons/upload"
  title="upload icons">Upload icons created by Ilham Fitrotul Hayat -
  Flaticon</a>
- Drag File <a href="https://www.flaticon.com/free-icons/drag" title="drag
  icons">Drag icons created by Smashicons - Flaticon</a>
- Clipboard <a href="https://www.flaticon.com/free-icons/paste" title="paste
  icons">Paste icons created by Pixel perfect - Flaticon</a>
