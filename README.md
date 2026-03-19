# Inquisia Frontend

Frontend for Inquisia, an academic project management platform.

## Deployment

### Assumptions
- This repository builds a static Vite frontend, not a server-rendered Next.js app.
- The production container serves the built frontend with Nginx.
- A host-level Nginx instance will sit in front of the container for TLS and public-domain routing.
- Runtime configuration is injected through `env.js`, so you can set production URLs without rebuilding the image for every environment.

### Required environment variables
Copy `.env.example` to `.env.production` and set the production values:

```bash
cp .env.example .env.production
```

Required variables:
- `NEXT_PUBLIC_APP_URL` — the public browser URL for this frontend, for example `https://app.example.com`
- `NEXT_PUBLIC_API_URL` — the public backend base URL, for example `https://api.example.com`

Optional local-development fallback:
- `VITE_API_URL` — used by Vite in local development if you are not relying on runtime `env.js`

### Docker deployment
Build and run locally with Docker:

```bash
docker build -t inquisia-frontend:latest .
docker run -d \
  --name inquisia-frontend \
  --restart unless-stopped \
  -p 127.0.0.1:3001:80 \
  -e NEXT_PUBLIC_APP_URL="https://app.example.com" \
  -e NEXT_PUBLIC_API_URL="https://api.example.com" \
  inquisia-frontend:latest
```

The container listens on port `80`, and the example above publishes it to `127.0.0.1:3001` for a host Nginx reverse proxy.

### Ubuntu deployment script
A simple deployment script is included for Ubuntu servers:

```bash
chmod +x deploy.sh
./deploy.sh
```

Supported script variables:
- `APP_NAME`
- `IMAGE_NAME`
- `CONTAINER_NAME`
- `HOST_PORT`
- `ENV_FILE`

Example:

```bash
HOST_PORT=3005 ENV_FILE=.env.production ./deploy.sh
```

### Host Nginx reverse proxy example
Use a host Nginx server block to proxy traffic to the Docker container:

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Notes
- The Docker image renders `/env.js` on container startup from `public/env.js.template`.
- Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` in the environment when promoting between staging and production.
- If the backend uses cookies, make sure the API domain, CORS policy, and cookie settings are aligned with the frontend domain behind Nginx.
