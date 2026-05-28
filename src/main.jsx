import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Catch Vite dynamic import chunk failures and force a reload
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error caught, forcing reload to fetch new chunks.', event);
  if (!sessionStorage.getItem('billqyro_vite_preload_reloaded')) {
    sessionStorage.setItem('billqyro_vite_preload_reloaded', 'true');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
