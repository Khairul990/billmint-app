import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'app-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/api\//, /^\/publicInvoices\//, /\.html$/],
        ignoreURLParametersMatching: [/^token/, /^secret/, /^auth/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'BillQyro',
        short_name: 'BillQyro',
        description: 'Modern Billing & Invoicing Platform',
        theme_color: '#C81E5C',
        background_color: '#1F1B1D',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
    minify: mode === 'android' ? false : 'terser',
    terserOptions: mode === 'android' ? undefined : {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: mode === 'android' ? false : { properties: { regex: /^_private_/ } },
      format: { comments: false }
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        hoistTransitiveImports: true,
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 3000
  }
}))
