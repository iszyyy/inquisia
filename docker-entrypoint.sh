#!/bin/sh
set -eu

: "${NEXT_PUBLIC_APP_URL:?NEXT_PUBLIC_APP_URL must be set}"
: "${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL must be set}"

TEMPLATE="/usr/share/nginx/html/env.js.template"
TARGET="/usr/share/nginx/html/env.js"

if [ -f "$TEMPLATE" ]; then
  envsubst '${NEXT_PUBLIC_APP_URL} ${NEXT_PUBLIC_API_URL}' < "$TEMPLATE" > "$TARGET"
fi
