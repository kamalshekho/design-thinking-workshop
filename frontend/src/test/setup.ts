import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '../mocks/server';

/**
 * Every test runs against the mocked backend from ../mocks/handlers.ts. A test
 * that needs a specific failure overrides one handler with `server.use(...)`
 * and the override is reset after it finishes.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
