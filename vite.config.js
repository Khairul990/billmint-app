import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/api\//, /^\/publicInvoices\//],
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
        theme_color: '#071B3A',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
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
