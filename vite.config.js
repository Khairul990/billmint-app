import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'
import { fileURLToPath } from 'url'

const SITE_URL = 'https://billqyro.com'
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
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'app-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,jpg,webp,json,webmanifest,ttf}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/api\//, /^\/publicInvoices\//, /\.html$/],
        ignoreURLParametersMatching: [/^token/, /^secret/, /^auth/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bq-html-shell',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] }
            }
          },
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
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
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
        enabled: false,
        type: 'module',
      }
    }),
    createHtmlPlugin({
      minify: {
        removeComments: false,
        collapseWhitespace: false,
      },
      inject: {
        data: {
          canonicalUrl: SITE_URL + '/',
          ogUrl: SITE_URL + '/',
          ogImageUrl: SITE_URL + '/og-image.jpg',
          twitterSite: '@billqyro',
          orgSchema: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://billqyro.com/#organization",
            "name": "BillQyro Technologies",
            "url": "https://billqyro.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://billqyro.com/icon-512x512.png",
              "width": 512,
              "height": 512
            },
            "description": "Creators of BillQyro — smart billing and premium invoicing for growing businesses in India and Bangladesh.",
            "email": "support@billqyro.com",
            "telephone": "+919477738769",
            "sameAs": [
              "https://twitter.com/billqyro",
              "https://linkedin.com/company/billqyro",
              "https://youtube.com/@billqyro",
              "https://github.com/billqyro"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+919477738769",
              "contactType": "customer support",
              "availableLanguage": ["English", "Bengali"]
            },
            "areaServed": [
              { "@type": "Country", "name": "India" },
              { "@type": "Country", "name": "Bangladesh" }
            ],
            "knowsAbout": [
              "Invoicing Software",
              "Billing Management",
              "UPI Payments",
              "PDF Invoice Generation",
              "Customer Ledger",
              "Offline-First Business Apps",
              "Small Business Finance",
              "Inventory Management"
            ]
          }),
          faqSchema: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does BillQyro operate offline?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "BillQyro uses IndexedDB local-first architecture. You can generate invoices, look up customer balances, and create estimates without internet. Changes sync with Firebase when you reconnect."
                }
              },
              {
                "@type": "Question",
                "name": "Is multi-workspace data isolated securely?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Every workspace operates in a strictly segregated sandbox. Invoices, customers, bank transactions, and reports are partitioned by workspace ID with server-side security rules."
                }
              },
              {
                "@type": "Question",
                "name": "Can customers view and pay invoices without creating an account?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Each invoice comes with a secure Live Link. Customers can open it in any browser to view line items, scan payment QR codes, and upload transaction proof."
                }
              },
              {
                "@type": "Question",
                "name": "How are old dues and balances calculated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "BillQyro enforces: Balance Due = max(0, Old Due + Current Invoice - Paid Now). Lifetime customer dues and dashboard totals stay 100% consistent."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export reports and financial statements?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Export Sales Summaries, Profit and Loss Statements, Due Ledgers, Inventory Valuation Reports, and Customer Statements into Excel or PDF."
                }
              }
            ]
          }),
          softwareAppSchema: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://billqyro.com/#software",
            "name": "BillQyro",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web, Android",
            "url": "https://billqyro.com",
            "description": "Smart billing and invoicing platform for small businesses. Offline-first with UPI payments, PDF invoices, customer ledger, and WhatsApp reminders.",
            "image": "https://billqyro.com/og-image.jpg",
            "screenshot": "https://billqyro.com/dashboard-preview.png",
            "author": {
              "@type": "Organization",
              "@id": "https://billqyro.com/#organization",
              "name": "BillQyro Technologies"
            },
            "datePublished": "2026-01-01",
            "softwareVersion": "2.6",
            "featureList": [
              "Offline-first billing",
              "UPI QR payments",
              "PDF invoice generation with A4/A5 templates",
              "Customer ledger with balance tracking",
              "WhatsApp payment reminders",
              "Multi-business categories",
              "Voice billing in Bengali",
              "Product inventory management",
              "Expense tracking and profit/loss reports",
              "Live invoice sharing links",
              "Multi-workspace support",
              "Backup and restore"
            ],
            "downloadUrl": "https://billqyro.com/downloads/BillQyro-Android.apk",
            "installUrl": "https://billqyro.com",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "14999",
              "priceCurrency": "INR",
              "offerCount": "3",
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Starter",
                  "price": "0",
                  "priceCurrency": "INR",
                  "description": "Free plan: 50 invoices, 25 customers",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Pro",
                  "price": "499",
                  "priceCurrency": "INR",
                  "description": "500 invoices, 200 customers, premium themes",
                  "availability": "https://schema.org/InStock",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": "499",
                    "priceCurrency": "INR",
                    "billingDuration": "P1M"
                  }
                },
                {
                  "@type": "Offer",
                  "name": "Lifetime",
                  "price": "14999",
                  "priceCurrency": "INR",
                  "description": "Unlimited everything, one-time payment",
                  "availability": "https://schema.org/InStock"
                }
              ]
            }
          }),
          seoFallback: `<h1>BillQyro — Smart Billing. Premium Invoices.</h1>
      <p>BillQyro is a free, offline-first invoicing and billing platform for small businesses in India and Bangladesh. Create professional PDF invoices, track customer balances, collect UPI payments, and manage your business from anywhere.</p>
      <h2>Features</h2>
      <ul>
        <li>PDF invoice generation with A4/A5 templates</li>
        <li>Customer ledger with balance tracking</li>
        <li>UPI QR code payment collection</li>
        <li>Product and inventory management</li>
        <li>Expense tracking and profit/loss reports</li>
        <li>WhatsApp payment reminders</li>
        <li>Offline-first — works without internet</li>
        <li>Multi-workspace support</li>
        <li>Live invoice sharing links</li>
        <li>Voice billing in Bengali</li>
      </ul>
      <h2>Pricing</h2>
      <p>Starter: Free (50 invoices, 25 customers). Pro: 499 INR per month (500 invoices, 200 customers). Lifetime: 14,999 INR one-time (unlimited).</p>
      <h2>Supported Business Types</h2>
      <p>Retail, tailoring, clinics, repair shops, coaching centers, and service businesses.</p>
      <p>Contact: support@billqyro.com | WhatsApp: +91 94777 38769</p>
      <p><a href="/support">Help Center</a> | <a href="/terms">Terms</a> | <a href="/privacy">Privacy</a> | <a href="/refund">Refund Policy</a></p>`
        }
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
            if (normalized.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (normalized.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (normalized.includes('jspdf') || normalized.includes('html2canvas') || normalized.includes('@react-pdf')) {
              return 'vendor-pdf';
            }
            if (normalized.includes('qrcode')) {
              return 'vendor-qr';
            }
            if (normalized.includes('react') || normalized.includes('react-dom')) {
              return 'vendor-react';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 3000
  }
}))
