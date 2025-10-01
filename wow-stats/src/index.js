import React from 'react';
import { createRoot } from 'react-dom/client';
import WebApp from './components/web-page'

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>
);