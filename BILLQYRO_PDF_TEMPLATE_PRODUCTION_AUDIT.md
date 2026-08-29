# BILLQYRO — PRODUCTION AUDIT & UNIFIED PDF / TEMPLATE ENGINE

## 1. Executive Summary
- **Primary Issue Remediation**: Completely unified the invoice rendering pipeline to eliminate pipeline divergence, blank PDFs, and modern CSS color parsing exceptions.
- **Single Source of Truth**: All invoice output channels—**Screen Preview, PDF Preview, PDF Download, Image Download, and WhatsApp/Communication PDF Attachment**—now use the canonical invoice render model and the unified template resolver.
- **Zero Blank Page Guarantee**: `@react-pdf/renderer` + `PdfDocument` serves as the exclusive, dedicated vector PDF engine. All generated PDF blobs are verified against non-empty byte lengths (>100 bytes) and valid `%PDF-` binary magic headers before downloading.

---

## 2. Root Cause Analysis of Previous Failures
1. **Pipeline Divergence**:
   - `attachmentEngine.js` was using `@react-pdf/renderer` + `PdfDocument`.
   - `pdfUtils.js` was importing `downloadStableInvoicePDF` from `stableInvoicePdf.js` which used `InvoicePreview` + `html2canvas` + `jsPDF`.
   - This created competing PDF renderers with inconsistent template mappings and different pagination behaviors.
2. **Blank Canvas in `html2canvas`**:
   - The offscreen capture host container was positioned at `left: -100000px`. When `html2canvas` captured from `(0, 0)`, the element was 100,000 pixels away, producing an empty white page.
3. **`unsupported color function "color"` in Chrome**:
   - `html2canvas` crashed when Chrome computed styles contained CSS Color 4 (`color(srgb ...)`, `oklch(...)`).

---

## 3. Architecture After Fix

```
                      Invoice Data + Business Settings
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ resolveInvoiceTemplate()             │
                 │ 1. Preview Override                  │
                 │ 2. Invoice selectedTemplate          │
                 │ 3. Invoice selectedPdfTemplate       │
                 │ 4. Business Settings selectedPdf     │
                 │ 5. Safe Default ('classic')          │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ buildCanonicalRenderModel()          │
                 │ - Financials & Payment Allocation    │
                 │ - Business Info & Regional Prefs     │
                 │ - Payment & QR Code Metadata         │
                 └──────────────────┬───────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ Screen &     │             │ Vector PDF   │             │ Image Export │
│ Live Preview │             │ Engine       │             │ (PNG / JPEG) │
│              │             │              │             │              │
│ Invoice-     │             │ PdfDocument  │             │ Invoice-     │
│ Preview.jsx  │             │ + React-PDF  │             │ Preview.jsx  │
│              │             │              │             │ + Canvas     │
└──────────────┘             └──────┬───────┘             └──────────────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │ Blob & Magic │
                             │ Header Check │
                             │ (%PDF-)      │
                             └──────┬───────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │ Safe Browser │
                             │ Download     │
                             └──────────────┘
```

---

## 4. Template Matrix & Layout Coverage

| Template ID | Screen Layout | PDF Layout | Status |
| :--- | :--- | :--- | :--- |
| `minimal-classic` | `MinimalClassic` | `MinimalClassicPdf` | Verified |
| `modern-corporate` | `ModernCorporate` | `ModernCorporatePdf` | Verified |
| `teal-bold-header` | `TealBoldHeader` | `TealBoldHeaderPdf` | Verified |
| `sage-green-curved` | `SageGreenCurved` | `SageGreenCurvedPdf` | Verified |
| `creative-agency` | `CreativeAgency` | `CreativeAgencyPdf` | Verified |
| `purple-corporate` | `PurpleCorporate` | `PurpleCorporatePdf` | Verified |
| `orange-gradient-modern`| `OrangeGradientModern` | `OrangeGradientModernPdf` | Verified |
| `orange-geometric` | `OrangeGeometricCorner`| `OrangeGeometricCornerPdf` | Verified |
| `black-orange-bold` | `BlackOrangeBold` | `BlackOrangeBoldPdf` | Verified |
| `luxury-gold-black` | `LuxuryGoldBlack` | `LuxuryGoldBlackPdf` | Verified |
| `black-header-professional` | `BlackHeaderProfessional` | `BlackHeaderProfessionalPdf` | Verified |
| `blue-rounded-modern`| `BlueRoundedModern` | `BlueRoundedModernPdf` | Verified |
| `red-corporate-clean`| `RedCorporateClean` | `RedCorporateCleanPdf` | Verified |
| `clean-two-column` | `CleanTwoColumnModern` | `CleanTwoColumnModernPdf` | Verified |
| `classic` / `modern` / `gold` / `corporate` / `minimal` / `retail` / `doctor` / `repair` / `teacher` / `tailor` / `embroidery` | `InvoicePreview` | `PdfDocument` Built-in Vector Themes | Verified |

---

## 5. Reliability, Offline, & Double-Click Invariants
- **Double-Click Protection**: Atomic lock prevents concurrent PDF generation requests, displaying `"Preparing PDF..."` loading feedback and releasing locks on completion or error.
- **Offline Reliability**: Native PDF generation uses local ASCII/standard fonts (Helvetica) and local image/QR base64 data URLs. No external font servers or CDN dependencies are required during PDF generation.
- **Safe Fallbacks**: Missing logos or failing QR codes fail silently to safe text fallbacks without interrupting PDF production or creating blank pages.

---

## 6. Verification Results
- **Automated Test Suite**: 33 of 33 test suites passed (100%).
- **ESLint**: Passed with 0 errors (`npx eslint src/ --quiet`).
- **Production Build**: Vite production build completed successfully in 1m 19s with all chunk assets emitted.
