# project-manager-ui

## Project setup
```
npm install
```

### Compiles and hot-reloads for development (Single SPA)
```
npm run serve
```

### Compiles and hot-reloads for development (Standalone)
```
npm run serve:standalone
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Docker

The image serves the standalone build with nginx. `docker/start.sh` reads these environment variables when the container starts:

| Variable | Required | Description |
|---|---|---|
| `VUE_APP_BACKEND_URL` | yes | URL of the project-manager backend. |
| `VUE_APP_FRONTEND_URL` | yes | Public URL of this frontend. A path (e.g. `https://host/requester/`) is used as `<base href>`. |
| `VUE_APP_OIDC_URL` | yes | Issuer URL of the login server (OIDC). |
| `VUE_APP_OIDC_CLIENT_ID` | yes | OIDC client ID of the frontend. |
| `CSP_ENFORCE` | no | `true`: the browser blocks everything the Content-Security-Policy doesn't allow. Default: report-only (violations only appear in the browser console). |

### No internet access needed

The browser only loads files from this frontend. The single-spa runtime (SystemJS, single-spa, import-map-overrides) is copied from `node_modules` into `vendor/` at build time instead of being loaded from a CDN, because bridgeheads often run in networks without internet access. `npm run build:standalone` fails if `index.html` references another host again.

### Content-Security-Policy

The policy is defined in [`docker/content-security-policy.template`](docker/content-security-policy.template): the page may only talk to itself, the backend and the login server. `start.sh` fills in the origins of `VUE_APP_BACKEND_URL` and `VUE_APP_OIDC_URL` (scheme, host and port only, because the OIDC endpoints are not below the issuer path). The dev server (`npm run serve:standalone`) sends the same policy as report-only, built from `public/config.json`.

Before setting `CSP_ENFORCE=true` on an instance, check the browser console with the default report-only header for `Content-Security-Policy` reports (login, dashboard, project view, documents, silent renew after the token lifetime).

### Devtools panel

The import-map-overrides panel (`{···}` button) is hidden. A developer can show it with `localStorage.setItem('devtools', true)` in the browser console; without that, stored overrides are removed on page load.

## Documentation

Design decisions and their reasoning are in [`docs/`](docs/):

- [Marking mandatory and optional fields in the draft form](docs/mandatory-fields.md)
