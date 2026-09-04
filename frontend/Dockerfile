# Build the static form, then serve it from nginx together with the API proxy.
#
# Build this image where the working tree is complete — the build copies
# public/ as it exists on disk, and a fresh checkout does not carry everything
# that belongs there.
FROM docker.io/library/node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM docker.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# .htpasswd is mounted at runtime, never baked into the image.
EXPOSE 80
