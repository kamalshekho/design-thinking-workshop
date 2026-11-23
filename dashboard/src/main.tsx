import './styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { PrototypeSwitcher } from './components/shared/prototype-switcher';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// PROTOTYPE (issue #109): `npm run prototype` answers the API from memory.
if (import.meta.env.MODE === 'prototype') {
  await import('./prototype/stubBackend');
}

createRoot(root).render(
  <StrictMode>
    <App />
    <PrototypeSwitcher />
  </StrictMode>,
);
