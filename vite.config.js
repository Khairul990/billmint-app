import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: [
      { find: /^.*\/contexts\/(.*)$/, replacement: path.resolve(__dirname, 'src/context/$1') },
      { find: /^(\.\.?\/)+contexts$/, replacement: path.resolve(__dirname, 'src/context') },
      { find: '@/contexts', replacement: path.resolve(__dirname, 'src/context') }
    ]
  },
  plugins: [
    react({
      // pdfUtils.js contains JSX for the existing PDF document pipeline.
      // Keep the JSX handling scoped to that utility instead of changing the
      // loader for every .js file in the application.
      include: [/[\\/]src[\\/]utils[\\/]pdfUtils\.js$/, /\.[jt]sx?$/]
    }),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'app-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,json,webmanifest,ttf}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
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
        name: 'BillQyro — Smart Billing & Invoices',
        short_name: 'BillQyro',
        description: 'Smart billing, premium invoices, customer & payment management for growing businesses.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#04100C',
        background_color: '#04100C',
        lang: 'en',
        dir: 'ltr',
        categories: ['business', 'finance', 'productivity'],
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ],
        shortcuts: [
          { name: 'New Invoice', short_name: 'Invoice', url: '/?qy=create-invoice', icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Customers', url: '/?qy=customers', icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Due Ledger', url: '/?qy=due-ledger', icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Reports', url: '/?qy=reports', icons: [{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' }] }
        ],
        screenshots: [
          { src: 'dashboard-preview.png', sizes: '1024x640', type: 'image/png', form_factor: 'wide', label: 'BillQyro Dashboard' },
          { src: 'dashboard-mobile.png', sizes: '768x1376', type: 'image/png', form_factor: 'narrow', label: 'BillQyro Mobile Dashboard' }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', '.e2b-studio.app', 'localhost'],
    watch: {
      ignored: ['**/*.md', '**/dist/**', '**/.git/**', '**/dev-dist/**', '**/docs/**']
    }
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        hoistTransitiveImports: true,
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            // Node polyfills (buffer/global/process shims) are tiny but shared
            // by BOTH the entry graph (Capacitor, jszip) and the firebase SDK.
            // Without this rule Rollup folds them into vendor-firebase, which
            // drags the whole ~780KB SDK onto the boot path through a
            // two-symbol static import (observed live: `import{j as D0,B as ba}`).
            if (
              normalized.includes('vite-plugin-node-polyfills') ||
              normalized.includes('node_modules/buffer/') ||
              normalized.includes('node_modules/global/') ||
              normalized.includes('node_modules/process/')
            ) {
              return 'vendor-node-polyfills';
            }
            if (normalized.includes('tesseract')) {
              return 'vendor-ocr';
            }
            if (normalized.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (normalized.includes('qrcode')) {
              return 'vendor-qr';
            }
            // NOTE: '@react-pdf' and 'pdfjs-dist' previously mapped to a
            // forced 'vendor-pdf' chunk. That forced grouping created a
            // static edge from the entry bundle to the 2.7MB chunk even
            // though the PDF renderer is only loaded dynamically. Letting
            // Rollup place them naturally keeps them off the boot path.
          }
        }
      }
    },
    chunkSizeWarningLimit: 3000
  }
}))
