FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public/env.js.template /usr/share/nginx/html/env.js.template

EXPOSE 80
