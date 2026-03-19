#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-inquisia-frontend}"
IMAGE_NAME="${IMAGE_NAME:-${APP_NAME}:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-${APP_NAME}}"
HOST_PORT="${HOST_PORT:-3001}"
ENV_FILE="${ENV_FILE:-.env.production}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${NEXT_PUBLIC_APP_URL:?NEXT_PUBLIC_APP_URL must be set in ${ENV_FILE} or the shell environment}"
: "${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL must be set in ${ENV_FILE} or the shell environment}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found on this server." >&2
  exit 1
fi

echo "> Building ${IMAGE_NAME}"
docker build -t "$IMAGE_NAME" .

echo "> Replacing container ${CONTAINER_NAME}"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${HOST_PORT}:80" \
  -e NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -e NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  "$IMAGE_NAME"

cat <<MSG

Deployment complete.

Container: ${CONTAINER_NAME}
Image:     ${IMAGE_NAME}
Port:      127.0.0.1:${HOST_PORT}
App URL:   ${NEXT_PUBLIC_APP_URL}
API URL:   ${NEXT_PUBLIC_API_URL}

Point your host Nginx config at http://127.0.0.1:${HOST_PORT}.
Example:

  location / {
      proxy_pass http://127.0.0.1:${HOST_PORT};
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
  }

MSG
