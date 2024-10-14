#!/bin/sh

envsubst < /usr/share/nginx/html/app.js > /usr/share/nginx/html/app.temp.js
mv /usr/share/nginx/html/app.temp.js /usr/share/nginx/html/app.js
#envsubst '${TEILER_DASHBOARD_SERVER_NAME} ${TEILER_ORCHESTRATOR_URL}'< /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo 'Start Teiler Dashboard in NGINX in foreground (non-daemon-mode)'
exec nginx -g 'daemon off;'
