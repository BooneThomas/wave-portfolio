import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/instrument-sans/index.css';
import './styles/global.css';
import App from './App';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The production build is prerendered (see scripts/prerender.mjs), so hydrate when markup exists.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
