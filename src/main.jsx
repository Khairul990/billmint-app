import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker and handle updates
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content is available! Refresh to update?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
})

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
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
