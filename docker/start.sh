#!/bin/sh

envsubst < /usr/share/nginx/html/keycloak.json > /usr/share/nginx/html/keycloak.temp.json
mv /usr/share/nginx/html/keycloak.temp.json /usr/share/nginx/html/keycloak.json

envsubst < /usr/share/nginx/html/config.json > /usr/share/nginx/html/config.temp.json
mv /usr/share/nginx/html/config.temp.json /usr/share/nginx/html/config.json

#envsubst '${TEILER_DASHBOARD_SERVER_NAME} ${TEILER_ORCHESTRATOR_URL}'< /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo 'Start Teiler Dashboard in NGINX in foreground (non-daemon-mode)'
exec nginx -g 'daemon off;'
