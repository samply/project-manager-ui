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

#envsubst '${TEILER_DASHBOARD_SERVER_NAME} ${TEILER_ORCHESTRATOR_URL}'< /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo 'Start Teiler Dashboard in NGINX in foreground (non-daemon-mode)'
exec nginx -g 'daemon off;'
