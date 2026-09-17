import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './legacy-modernization.css'
import './styles/androidPerformance.css'
import './styles/dashboard-reference.css'
import { initAndroidPerformance } from './services/androidPerformance.js'
import App from './App.jsx'
import AnnouncementSurface from './components/AnnouncementSurface.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { Toaster, toast } from 'react-hot-toast'
import { registerSW } from 'virtual:pwa-register'

// Apply Android-only rendering hints before the first React paint.
initAndroidPerformance()

const updateSW = registerSW({
  onNeedRefresh() {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">New version available!</span>
        <button onClick={() => { updateSW(true); toast.dismiss(t.id); }} className="px-3 py-1.5 bg-[image:var(--accent-gradient)] text-white text-xs font-bold rounded-lg hover:opacity-90">Update</button>
      </div>
    ), { duration: 10000 })
  },
  onOfflineReady() { console.log("App ready to work offline") },
})

let swRefreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!swRefreshing) {
      swRefreshing = true;
      window.location.reload();
    }
  });
}

window.addEventListener('vite:preloadError', (event) => {
  event?.preventDefault?.();
  console.warn('Vite preload error caught, refreshing to fetch latest assets.', event);
  const lastReload = parseInt(sessionStorage.getItem('billqyro_chunk_last_reload') || '0', 10);
  const now = Date.now();
  if (now - lastReload > 15000) {
    sessionStorage.setItem('billqyro_chunk_last_reload', String(now));
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <AnnouncementSurface />
    </ThemeProvider>
  </StrictMode>,
)
