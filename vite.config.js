import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'offline.html'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB limit
        navigateFallbackDenylist: [/^\/__/, /^\/api\//, /^\/publicInvoices\//],
        ignoreURLParametersMatching: [/^token/, /^secret/, /^auth/],
        cleanupOutdatedCaches: true
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
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  build: {
    minify: mode === 'android' ? false : 'terser',
    sourcemap: mode === 'android' ? false : undefined,
    terserOptions: mode === 'android' ? undefined : {
      compress: {
        drop_console: true,
      },
      mangle: false, // Prevents Windows Defender false positive detections
    },
    rollupOptions: {
      external: ['pako/lib/zlib/zstream.js', 'pako/lib/zlib/deflate.js', 'pako/lib/zlib/inflate.js', 'pako/lib/zlib/gzip.js', 'pako/lib/zlib/gunzip.js', 'pako/lib/zlib/raw.js', 'pako/lib/zlib/raw-deflate.js', 'pako/lib/zlib/raw-inflate.js', 'pako/lib/zlib/constants.js'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'ui-vendor': ['lucide-react', 'framer-motion', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}))
