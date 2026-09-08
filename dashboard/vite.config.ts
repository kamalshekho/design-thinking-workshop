/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The backend on its default port. Development is same-origin because the
 * Sign-in cookie is `SameSite=Strict`: a request to another origin would not
 * carry it, so there is no `VITE_API_BASE_URL` to point anywhere else.
 */
const API_TARGET = 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
  server: {
    port: 5174,
    // Mirrors `nginx.conf` location for location, so a request behaves the
    // same in development as in production. `changeOrigin` stays off on both
    // entries: nginx passes the browser's `Host` through, and so does Vite by
    // default.
    proxy: {
      // The live stream, matched before `/api` because Vite takes the first
      // key whose prefix fits. `proxyTimeout` is nginx's `proxy_read_timeout`
      // — an hour, so an idle stream is not cut. Nothing between Vite and the
      // browser buffers, which is what `proxy_buffering off` buys in nginx.
      '/api/v1/staff/events': {
        target: API_TARGET,
        proxyTimeout: 3_600_000,
      },
      '/api': {
        target: API_TARGET,
        proxyTimeout: 30_000,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
