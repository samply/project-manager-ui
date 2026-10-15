#!/bin/sh

set -eu

# A trailing slash makes the configured URL an HTML directory base. This lets
# relative assets work even when the user opens /requester without a slash.
FRONTEND_BASE_URL="${VUE_APP_FRONTEND_URL:-/}"
case "$FRONTEND_BASE_URL" in
  */) ;;
  *) FRONTEND_BASE_URL="$FRONTEND_BASE_URL/" ;;
esac

envsubst < /usr/share/nginx/html/config.json > /usr/share/nginx/html/config.temp.json
mv /usr/share/nginx/html/config.temp.json /usr/share/nginx/html/config.json

sed "s|<base href=\"/\">|<base href=\"$FRONTEND_BASE_URL\">|" \
  /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.temp.html
mv /usr/share/nginx/html/index.temp.html /usr/share/nginx/html/index.html

# Content-Security-Policy: the page may only talk to itself, the backend and
# the login server (OIDC). Report-only until CSP_ENFORCE=true.
origin() {
  printf '%s' "$1" | sed -E 's|^([A-Za-z][A-Za-z0-9+.-]*://[^/?#]+).*|\1|'
}
BACKEND_ORIGIN="$(origin "${VUE_APP_BACKEND_URL:-}")"
OIDC_ORIGIN="$(origin "${VUE_APP_OIDC_URL:-}")"
export BACKEND_ORIGIN OIDC_ORIGIN

case "${CSP_ENFORCE:-false}" in
  true) CSP_HEADER_NAME="Content-Security-Policy" ;;
  *) CSP_HEADER_NAME="Content-Security-Policy-Report-Only" ;;
esac
CSP="$(grep -v '^#' /samply/content-security-policy.template \
  | envsubst '${BACKEND_ORIGIN} ${OIDC_ORIGIN}' | tr -s ' \n' ' ' | sed 's/^ *//; s/ *$//')"
export CSP_HEADER_NAME CSP

# Only these variables: nginx's own ($uri, ...) must stay untouched.
envsubst '${CSP_HEADER_NAME} ${CSP}' < /samply/nginx.conf.template > /etc/nginx/conf.d/default.conf

#envsubst '${TEILER_DASHBOARD_SERVER_NAME} ${TEILER_ORCHESTRATOR_URL}'< /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo 'Start Teiler Dashboard in NGINX in foreground (non-daemon-mode)'
exec nginx -g 'daemon off;'
