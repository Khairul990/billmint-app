import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './legacy-modernization.css'
import App from './App.jsx'
import AnnouncementSurface from './components/AnnouncementSurface.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { Toaster, toast } from 'react-hot-toast'
import { registerSW } from 'virtual:pwa-register'

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

window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error caught, forcing reload to fetch new chunks.', event)
  if (!sessionStorage.getItem('billqyro_vite_preload_reloaded')) {
    sessionStorage.setItem('billqyro_vite_preload_reloaded', 'true')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <AnnouncementSurface />
    </ThemeProvider>
  </StrictMode>,
)
