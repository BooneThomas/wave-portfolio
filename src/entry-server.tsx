import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

/** Used at build time only, to write the page content into index.html. */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
