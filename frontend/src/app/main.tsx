import '../styles/tokens.css';
import '../styles/base.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { LocaleProvider } from '../content/LocaleProvider';
import { App } from './App';

/**
 * With no VITE_API_BASE_URL set, requests are served by Mock Service Worker so
 * the form can be built and demonstrated before the backend exists.
 */
async function enableMocking(): Promise<void> {
  if (import.meta.env.PROD) return;
  if (import.meta.env.VITE_API_BASE_URL) return;

  const { worker } = await import('../mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing');

void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </StrictMode>,
  );
});
