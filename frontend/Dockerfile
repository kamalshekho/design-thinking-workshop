# Build the static form, then serve it from nginx together with the API proxy.
#
# Build this image where the working tree is complete — the build copies
# public/ as it exists on disk, and a fresh checkout does not carry everything
# that belongs there.
FROM docker.io/library/node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM docker.io/nginxinc/nginx-unprivileged:1.31-alpine
# The base image lags behind Alpine's security fixes; the release scan fails
# on any high or critical one that already has a fix.
USER root
RUN apk upgrade --no-cache
USER 101
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
