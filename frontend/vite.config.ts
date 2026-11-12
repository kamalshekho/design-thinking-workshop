/// <reference types="vitest/config" />
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Mock Service Worker answers the API in development only (`src/app/main.tsx`),
 * and the dev server serves its script from `public/`. A build copies all of
 * `public/` into the output, so this removes the script again: a production
 * image has no use for it.
 */
function dropMockServiceWorker(): Plugin {
  let outDir = '';
  return {
    name: 'drop-mock-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await rm(resolve(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), dropMockServiceWorker()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
