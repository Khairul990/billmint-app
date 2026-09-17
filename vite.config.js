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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
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
        name: 'BillQyro',
        short_name: 'BillQyro',
        description: 'Modern Billing & Invoicing Platform',
        theme_color: '#C81E5C',
        background_color: '#1F1B1D',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
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
