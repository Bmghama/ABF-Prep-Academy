import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ON NE CHARGE AUCUN CSS ICI POUR ÉVITER L'ERREUR VERCEL
// LE STYLE EST DÉJÀ GÉRÉ DANS TON INDEX.HTML VIA LE CDN TAILWIND

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
