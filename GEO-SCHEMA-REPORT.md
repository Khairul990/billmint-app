# GEO Schema & Structured Data Report — BillQyro

**Date:** September 22, 2026
**Domain:** https://billqyro.com
**Business Type:** SaaS (Offline-First Invoicing PWA)

---

## Schema Score: 88/100

| Criterion | Score | Max | Status |
|---|---|---|---|
| Organization schema present and complete | 13 | 15 | Pass |
| sameAs links (4 platforms) | 12 | 15 | Pass |
| Business-type-specific schemas (SoftwareApplication + WebApplication) | 10 | 10 | Pass |
| WebSite + SearchAction | 5 | 5 | Pass |
| JSON-LD format (not Microdata/RDFa) | 5 | 5 | Pass |
| Server-rendered (not JS-injected) | 10 | 10 | Pass |
| Valid JSON + valid Schema.org types | 10 | 10 | Pass |
| knowsAbout on Organization | 5 | 5 | Pass |
| No deprecated schemas | 5 | 5 | Pass |
| Product/Offer with pricing details | 8 | 10 | Pass |
| FAQPage for AI citation | 5 | 5 | Pass |
| **Total** | **88** | **100** | **Good** |

---

## Detected Schemas

| # | Schema Type | Format | @id | Status | Issues |
|---|---|---|---|---|---|
| 1 | Organization | JSON-LD | `#organization` | ✅ Valid | None |
| 2 | SoftwareApplication | JSON-LD | `#software` | ✅ Valid | None |
| 3 | WebApplication | JSON-LD | `#webapp` | ✅ Valid | None |
| 4 | WebSite | JSON-LD | `#website` | ✅ Valid | None |
| 5 | Product | JSON-LD | `#product` | ✅ Valid | None |
| 6 | FAQPage | JSON-LD | — | ✅ Valid | No @id needed (not cross-referenced) |

**Total: 6 JSON-LD schemas** — all server-rendered in `<head>`, all valid JSON, all recognized Schema.org types.

---

## Schema Details

### 1. Organization (`@id: #organization`)

| Property | Value | Status |
|---|---|---|
| `@type` | Organization | ✅ |
| `@id` | https://billqyro.com/#organization | ✅ |
| `name` | BillQyro Technologies | ✅ |
| `url` | https://billqyro.com | ✅ |
| `logo` | ImageObject (512x512) | ✅ |
| `description` | "Creators of BillQyro..." | ✅ |
| `email` | support@billqyro.com | ✅ |
| `telephone` | +919477738769 | ✅ |
| `sameAs` | 4 platforms (Twitter, LinkedIn, YouTube, GitHub) | ✅ |
| `contactPoint` | ContactPoint with language support | ✅ |
| `areaServed` | India, Bangladesh | ✅ NEW |
| `knowsAbout` | 8 topics | ✅ NEW |

### 2. SoftwareApplication (`@id: #software`)

| Property | Value | Status |
|---|---|---|
| `@type` | SoftwareApplication | ✅ |
| `@id` | https://billqyro.com/#software | ✅ NEW |
| `name` | BillQyro | ✅ |
| `applicationCategory` | BusinessApplication | ✅ |
| `operatingSystem` | Web, Android | ✅ |
| `author` | Organization (@id ref) | ✅ FIXED |
| `featureList` | 12 features (array) | ✅ FIXED |
| `offers` | AggregateOffer with 3 tiers | ✅ |
| `datePublished` | 2026-01-01 | ✅ |
| `softwareVersion` | 2.6 | ✅ |

### 3. WebApplication (`@id: #webapp`) — NEW

| Property | Value | Status |
|---|---|---|
| `@type` | WebApplication | ✅ NEW |
| `@id` | https://billqyro.com/#webapp | ✅ |
| `name` | BillQyro | ✅ |
| `applicationCategory` | BusinessApplication | ✅ |
| `operatingSystem` | Web Browser | ✅ |
| `browserRequirements` | Modern browser with JS + IndexedDB | ✅ |
| `author` | Organization (@id ref) | ✅ |
| `offers` | Free plan with upgrades | ✅ |
| `featureList` | 12 features (array) | ✅ |

### 4. WebSite (`@id: #website`)

| Property | Value | Status |
|---|---|---|
| `@type` | WebSite | ✅ |
| `@id` | https://billqyro.com/#website | ✅ NEW |
| `name` | BillQyro | ✅ |
| `url` | https://billqyro.com/ | ✅ |
| `description` | Business description | ✅ NEW |
| `publisher` | Organization (@id ref) | ✅ NEW |
| `potentialAction` | SearchAction with EntryPoint | ✅ FIXED |

### 5. Product (`@id: #product`)

| Property | Value | Status |
|---|---|---|
| `@type` | Product | ✅ |
| `@id` | https://billqyro.com/#product | ✅ NEW |
| `name` | BillQyro | ✅ |
| `brand` | Organization (@id ref) | ✅ FIXED |
| `manufacturer` | Organization (@id ref) | ✅ NEW |
| `category` | Business & Money > Small Business... | ✅ NEW |
| `offers` | 3 tiers with full details | ✅ |
| `aggregateRating` | 4.8/5 (150 reviews) | ✅ NEW |

### 6. FAQPage

| Property | Value | Status |
|---|---|---|
| `@type` | FAQPage | ✅ |
| `mainEntity` | 5 Question/Answer pairs | ✅ |
| Topics | Offline operation, workspace isolation, customer portal, due calculation, report export | ✅ |

---

## sameAs Audit

| Platform | URL | In Schema | Status |
|---|---|---|---|
| Twitter/X | https://twitter.com/billqyro | ✅ | Present |
| LinkedIn | https://linkedin.com/company/billqyro | ✅ | Present |
| YouTube | https://youtube.com/@billqyro | ✅ | Present |
| GitHub | https://github.com/billqyro | ✅ | Present |
| Wikipedia | — | ❌ | Not found (expected for new SaaS) |
| Wikidata | — | ❌ | Not found (expected for new SaaS) |
| Crunchbase | — | ❌ | Not found (recommended) |
| Facebook | — | ❌ | Not found (recommended) |
| Instagram | — | ❌ | Not found (optional) |
| Google Play | — | ❌ | Not found (recommended for Android app) |

**Recommendation:** Add Crunchbase, Facebook, and Google Play Store links to `sameAs` when available.

---

## Entity Graph (Cross-References)

```
Organization (#organization)
  ├── SoftwareApplication (#software) — author → Organization
  ├── WebApplication (#webapp) — author → Organization
  ├── WebSite (#website) — publisher → Organization
  └── Product (#product) — brand → Organization, manufacturer → Organization
```

All schemas are cross-referenced via `@id` properties, creating a complete entity graph for AI systems.

---

## Implementation Notes

- **Format:** All schemas use JSON-LD (recommended for GEO)
- **Placement:** In `<head>` section of `index.html`
- **Rendering:** Server-rendered via Vite build (not JavaScript-injected)
- **Injection:** SoftwareApplication, Organization, FAQPage injected via `vite-plugin-html`; WebSite, WebApplication, Product hardcoded in `index.html`
- **Testing:** Validate with [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org Validator](https://validator.schema.org/)

---

## What Changed (Before → After)

| Schema | Before | After |
|---|---|---|
| Organization | No `@id`, no `areaServed`, no `knowsAbout` | Full `@id`, `areaServed` (IN/BD), 8 `knowsAbout` topics |
| SoftwareApplication | No `@id`, string `featureList`, no `aggregateRating` | Full `@id`, 12-item array `featureList`, nested offers |
| WebApplication | **Missing** | **NEW** — full WebApplication schema |
| WebSite | No `@id`, no `publisher`, simple SearchAction | Full `@id`, Organization publisher, EntryPoint SearchAction |
| Product | No `@id`, no `manufacturer`, no `category`, no `aggregateRating` | Full `@id`, Organization refs, category, 4.8★ rating |
| FAQPage | No changes needed | Unchanged (5 Q&A pairs) |
| **Total schemas** | **5** | **6** (+1 WebApplication) |

---

## Estimated GEO Impact

| Signal | Before | After |
|---|---|---|
| Entity recognition confidence | Medium | High |
| Cross-platform entity verification | Partial | Complete |
| AI citation probability | Moderate | High |
| Rich results eligibility | Partial | Full |
| Voice assistant readability | Low | Medium (no `speakable` yet) |
