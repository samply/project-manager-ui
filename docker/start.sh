#!/bin/sh

envsubst < /usr/share/nginx/html/js/app.js > /usr/share/nginx/html/js/app.temp.js
mv /usr/share/nginx/html/js/app.temp.js /usr/share/nginx/html/js/app.js
#envsubst '${TEILER_DASHBOARD_SERVER_NAME} ${TEILER_ORCHESTRATOR_URL}'< /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo 'Start Teiler Dashboard in NGINX in foreground (non-daemon-mode)'
exec nginx -g 'daemon off;'
