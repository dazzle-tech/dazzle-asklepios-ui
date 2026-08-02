#!/bin/sh

envsubst \
  '$BACKEND_BASE_URL $TENANT_ID $TENANT_SECURITY_TOKEN' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'