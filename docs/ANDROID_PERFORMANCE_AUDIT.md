# BillQyro — Step 2.19 Android Performance & APK Readiness Audit

## Goal
Prepare the existing BillQyro PWA for a lightweight Android APK without changing Firebase as the primary data system or breaking the current web/PWA workflow.

## Initial Findings

### 1. Heavy PDF dependencies
The repository contains multiple browser-side PDF/image dependencies including `jspdf`, `html2canvas`, `@react-pdf/renderer`, and `pdfjs-dist`. The canonical `pdfCacheEngine.js` already dynamically imports the PDF generators only when a PDF cache miss requires generation.

A redundant static import of `stableInvoicePdf.js` existed in `src/utils/pdfUtils.js`. That module itself imports `jspdf`, `html2canvas`, React rendering utilities, and `InvoicePreview`. The redundant import was removed so the shared PDF utility no longer eagerly pulls the legacy generator into its dependency graph.

### 2. OCR is already deferred
Payment screenshot OCR uses a dynamic `import('tesseract.js')`, which is appropriate for Android because the OCR engine is not required during normal application startup.

### 3. Route-level lazy loading is already strong
`src/App.jsx` uses `React.lazy()` for the majority of application pages. This should be preserved. The next optimization pass should verify that large feature dependencies are also loaded only when their feature is opened.

### 4. PWA build configuration
The Vite configuration already enables CSS splitting, production minification, dynamic imports, and separate chunks for PDF, OCR, Firebase, and QR-related dependencies. These settings should be retained and measured rather than replaced blindly.

### 5. Android-specific readiness
The package already contains Capacitor Android tooling and an Android build script. APK work should therefore focus on performance, native configuration, branding, and device behavior rather than introducing a second application architecture.

## Safety Rules

- Firebase remains the primary source of truth.
- PostgreSQL dual-write remains controlled by existing feature flags.
- No Firebase configuration changes during the APK optimization pass.
- No deletion of existing local/offline data.
- No replacement of the existing PDF pipeline until parity is demonstrated.
- No production cutover to PostgreSQL.

## Next Optimization Targets

1. Measure the initial JavaScript/chunk graph after the PDF dependency deferral.
2. Identify remaining eagerly loaded heavy libraries.
3. Reduce unnecessary startup work in `App.jsx` and global providers.
4. Audit animation and visual effects for low-end Android devices.
5. Audit large images, fonts, canvas usage, charts, and PDF preview rendering.
6. Add Android-safe viewport, keyboard, back-navigation, and status-bar handling.
7. Verify memory behavior for Dashboard, Invoice creation, PDF generation, Reports, and long lists.
8. Produce an Android production build and run stress/regression checks before release.

## Release Target

The final APK must be a packaged version of the optimized BillQyro application, not a separate simplified product. The landing page can later expose the signed APK as a direct download while the PWA remains available.
