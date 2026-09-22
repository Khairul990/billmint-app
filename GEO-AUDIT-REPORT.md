# GEO Audit Report: BillQyro

**Audit Date:** September 21, 2026
**URL:** https://billqyro.com (canonical) / https://billqyro-app.vercel.app (live)
**Business Type:** SaaS (Offline-First Invoicing & Billing)
**Pages Analyzed:** 14 (index.html, dist/index.html, Landing.jsx, robots.txt, sitemap.xml, llms.txt, manifest.json, vercel.json, firebase.json, package.json, vite.config.js, PrivacyPolicy.jsx, TermsOfService.jsx, Support.jsx)

---

## Executive Summary

**Overall GEO Score: 32/100 (Critical)**

BillQyro has a genuinely strong product with deep domain expertise in billing/invoicing, bilingual support (English/Bengali), and comprehensive features. However, the site is **functionally invisible to AI crawlers** due to a critical build pipeline bug that strips all SEO content, structured data, and meta tags from the production build. The source `index.html` contains excellent SEO fallback content, 3 JSON-LD schemas, and complete Open Graph tags — **all absent from `dist/index.html`**. Combined with zero external platform presence, no author attribution, and a staging-domain canonical URL in production, BillQyro scores in the Critical range despite having the content to score 75+.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 42/100 | 25% | 10.5 |
| Brand Authority | 7/100 | 20% | 1.4 |
| Content E-E-A-T | 33/100 | 20% | 6.6 |
| Technical GEO | 55/100 | 15% | 8.25 |
| Schema & Structured Data | 35/100 | 10% | 3.5 |
| Platform Optimization | 20/100 | 10% | 2.0 |
| **Overall GEO Score** | | | **32/100 (Critical)** |

---

## Critical Issues (Fix Immediately)

### 1. Build Pipeline Strips All SEO Content from Production
- **Files:** `index.html` (source) vs `dist/index.html` (built)
- **Impact:** The Vite build process replaces the source HTML with a minimal version. ALL of the following are stripped:
  - `#seo-fallback` div (h1, h2, paragraphs, feature list, pricing, business types, contact info, links)
  - `<noscript>` fallback tag
  - `FAQPage` JSON-LD (5 Q&A pairs)
  - `Organization` JSON-LD (name, logo, email, contactPoint)
  - Expanded `SoftwareApplication` JSON-LD (url, image, author, featureList, downloadUrl, screenshot, AggregateOffer)
  - `twitter:site` meta tag
- **Impact Severity:** AI crawlers receive literally zero content. The entire product description, pricing, and features are invisible.
- **Fix:** Use `vite-plugin-html` or `html-vite-plugin` to preserve critical head elements and body content in the build output. Alternatively, move JSON-LD schemas to a static inject script that survives the build.

### 2. Zero Server-Side Rendering — AI Crawlers See Empty Shell
- **File:** `dist/index.html:260`
- **Impact:** `<div id="root"></div>` is the only body content in production. React SPA renders everything client-side. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do NOT execute JavaScript.
- **Fix:** Implement prerendering via `vite-plugin-prerender`, Vercel Edge Functions, or Prerender.io. Or migrate to Next.js/Remix for SSR/SSG.

### 3. Canonical URL Points to Vercel Staging in Production
- **Files:** `dist/index.html:33`, `dist/index.html:38`, `public/sitemap.xml`
- **Impact:** `<link rel="canonical" href="https://billqyro-app.vercel.app/">` and `<meta property="og:url">` both point to staging. Search engines and AI crawlers index the staging URL, diluting domain authority.
- **Fix:** Use environment variable or `define` in `vite.config.js` for build-time URL replacement: `billqyro-app.vercel.app` → `billqyro.com`.

### 4. Source `index.html` Has Rich Schemas — Build Destroys Them
- **Files:** `index.html:57-155` (source) vs `dist/index.html:56-70` (built)
- **Impact:** Source has 3 complete JSON-LD schemas. Built output has only a minimal SoftwareApplication. Organization and FAQPage schemas are entirely absent.
- **Fix:** See Issue #1 — fix the build pipeline to preserve structured data.

---

## High Priority Issues (Fix Within 1 Week)

### 5. `llms.txt` May Not Be Deployed
- **File:** `public/llms.txt` exists (33 lines, well-structured)
- **Impact:** Live site may return 404 for `/llms.txt`. AI systems cannot access the machine-readable product summary.
- **Fix:** Verify `dist/llms.txt` exists after `vite build`. Check Vite `publicDir` config.

### 6. Sitemap Contains Only 6 URLs — All on Staging Domain
- **File:** `public/sitemap.xml`
- **Impact:** Only homepage, terms, privacy, refund, data-deletion, support. Missing: help center, guides, features, pricing. All URLs point to `billqyro-app.vercel.app`.
- **Fix:** Update all URLs to `billqyro.com`, add `<lastmod>` dates, expand to include all public routes.

### 7. Organization Schema Has Empty `sameAs` Array
- **File:** `index.html:97`
- **Impact:** `"sameAs": []` — AI systems cannot cross-reference BillQyro with any external entity. Zero entity graph.
- **Fix:** Add LinkedIn, Twitter/X, YouTube, GitHub, Facebook, Product Hunt URLs.

### 8. No Author Attribution Anywhere
- **Impact:** `<meta name="author" content="BillQyro Technologies">` exists but no human name, founder bio, or team page. AI models prefer attributable sources.
- **Fix:** Create `About.jsx` with founder name, team bios, company mission.

### 9. No Social Media Links on Site
- **File:** `Landing.jsx` footer
- **Impact:** Zero social links. Brand appears non-existent to AI crawlers that cross-reference platforms.
- **Fix:** Add links to Twitter/X, LinkedIn, YouTube, Facebook in footer.

### 10. robots.txt AI Crawler Rules May Not Be Deployed
- **File:** `public/robots.txt`
- **Impact:** Source has GPTBot, ClaudeBot, PerplexityBot, Bytespider allow rules. Live deployment status unknown — may be stale.
- **Fix:** Commit and deploy updated robots.txt. Verify live deployment.

---

## Medium Priority Issues (Fix Within 1 Month)

### 11. SoftwareApplication Schema Degraded in Build
- **Impact:** Lost: url, image, author, featureList, downloadUrl, screenshot, AggregateOffer. Built version has only name, category, OS, description, single Offer.
- **Fix:** Part of build pipeline fix (Issue #1).

### 12. No FAQPage Schema in Production
- **Impact:** 5 high-value Q&A pairs (offline operation, security, invoice sharing, dues calculation, export) not visible to search engines.
- **Fix:** Part of build pipeline fix (Issue #1).

### 13. SPA Routing Uses Query Parameters
- **File:** `src/App.jsx`
- **Impact:** Routes like `/?qy=create-invoice`, `/?qy=customers` are invisible to crawlers. No indexable inner page URLs.
- **Fix:** Implement hash-based routing or history API with server-side support for key pages.

### 14. Legal Pages Reference "Our Company" Without Entity Name
- **Files:** `PrivacyPolicy.jsx`, `TermsOfService.jsx`, `RefundPolicy.jsx`
- **Impact:** No identifiable legal entity. May violate Indian consumer protection laws.
- **Fix:** Add company legal name (e.g., "BillQyro Technologies Pvt. Ltd.") to all legal pages.

### 15. OG Description Differs from Meta Description
- **Files:** `index.html:28` vs `index.html:37`
- **Impact:** Inconsistent messaging across platforms. Meta description mentions Bengali; OG description does not.
- **Fix:** Align both descriptions or use platform-appropriate variants.

### 16. No WebSite + SearchAction Schema
- **Impact:** Missed sitelinks search box in Google SERPs.
- **Fix:** Add `@type: "WebSite"` with `potentialAction: SearchAction`.

### 17. No BreadcrumbList on Inner Pages
- **Impact:** No navigation context for search engines on terms, privacy, support pages.
- **Fix:** Add BreadcrumbList JSON-LD to all pages deeper than homepage.

### 18. CSP Uses `unsafe-inline` + `unsafe-eval`
- **File:** `vercel.json:38`
- **Impact:** Weakens Content Security Policy. Not a direct GEO issue but affects security posture.
- **Fix:** Consider nonce-based CSP for stricter security.

---

## Low Priority Issues (Optimize When Possible)

### 19. Missing `X-XSS-Protection` Header
- **File:** `vercel.json`
- **Impact:** Minor (deprecated but useful for older browsers).

### 20. No Public Changelog or Version History
- **Impact:** Freshness signal missing. AI systems prefer products with visible update history.

### 21. No Competitor Comparison Content
- **Impact:** Missed opportunity for high-citability comparison pages (vs. Vyapar, vs. Zoho Invoice).

### 22. No Testimonials or Social Proof
- **Impact:** Zero user quotes, reviews, case studies, or usage statistics on landing page.

### 23. Security Claims Lack Citations
- **File:** `Landing.jsx` ("256-bit encryption")
- **Impact:** Unsupported claims reduce trustworthiness. Should cite Firebase SOC2 compliance.

### 24. No IndexNow Protocol
- **Impact:** Slower Bing/ChatGPT indexing of new content.

### 25. No `speakable` Property on Schema
- **Impact:** Voice/AI assistant optimization signal missing.

---

## Category Deep Dives

### AI Citability (42/100)

**Strengths:**
- Transparent, concrete pricing: ₹0 / ₹499/mo / ₹14,999 one-time — AI models love exact numbers
- 10 specific features listed with business context
- FAQ formula `Balance Due = max(0, Old Due + Current Invoice - Paid Now)` is highly citable
- Bilingual content (English + Bengali) expands reach
- `llms.txt` has clean one-liner summary
- Source has excellent SEO fallback content — if it survived the build

**Weaknesses:**
- **All content is invisible in production** — AI crawlers get empty `<div id="root"></div>`
- Zero blog, documentation, or comparison content
- No user stories, case studies, or real-world usage data
- No technical deep-dives (offline sync architecture, UPI integration)
- `llms.txt` is only 33 lines — could be much richer

**Score Breakdown:**
| Sub-category | Score |
|---|---|
| Content Quotability | 60/100 |
| llms.txt Quality | 55/100 |
| AI Crawler Access | 40/100 |
| Static Content Availability | 15/100 |
| Structured Data | 50/100 |

### Brand Authority (7/100)

**Platform Presence:**

| Platform | Status |
|---|---|
| Twitter/X | `@billqyro` in meta tag, no actual account linked |
| YouTube | None |
| Reddit | None |
| LinkedIn | None |
| Product Hunt | None |
| GitHub | None |
| G2/Capterra | None |
| Google Play Store | No `assetlinks.json` |
| Facebook | None |
| Wikipedia/Wikidata | None |

**Entity Signals:**
- Organization schema exists but has empty `sameAs` — zero entity graph
- `author` meta says "BillQyro Technologies" but no registered company, GSTIN, or CIN
- Legal pages use "our company" without naming an entity
- No physical address anywhere on site

**Score Breakdown:**
| Sub-category | Score |
|---|---|
| Platform Presence | 5/100 |
| Entity Recognition | 15/100 |
| Third-Party Mentions | 0/100 |
| Social Proof | 5/100 |

### Content E-E-A-T (33/100)

**Experience (32/100):**
- Interactive demo available (live sandbox)
- Bilingual support with locale alternates
- Use-case specific content (retail, tailoring, clinics, repair, coaching)
- 1000+ line HelpCenter with tutorials
- No user screenshots, testimonials, or "before/after" stories

**Expertise (38/100):**
- 5 technical FAQs with architecture details (IndexedDB, Firebase, sandboxed workspaces)
- Offline-first architecture well-explained
- Comprehensive feature documentation
- No founder bio, team credentials, or author attribution
- No blog or educational content

**Authoritativeness (22/100):**
- Organization and SoftwareApplication schema present (in source)
- FAQPage JSON-LD (in source)
- sitemap.xml exists (but wrong domain, only 6 URLs)
- robots.txt properly configured
- Zero external citations, backlinks, or third-party validation

**Trustworthiness (41/100):**
- HTTPS enforced
- Legal pages exist (Terms, Privacy, Refund, DataDeletion)
- Contact info (email + WhatsApp)
- No company name in legal pages
- No social proof or trust badges
- "256-bit encryption" claim unsourced

### Technical GEO (55/100)

**Strengths:**
- Excellent meta tag coverage in source (charset, viewport, theme-color, description, keywords, author, robots, canonical)
- Strong security headers (HSTS, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy)
- Excellent PWA configuration (dynamic manifest, service worker, caching strategies)
- Smart code splitting (Firebase, OCR, QR isolated into separate chunks)
- Mobile optimization complete (apple-mobile-web-app-capable, viewport-fit=cover)
- Vite + Vercel CDN with proper cache headers

**Weaknesses:**
- **Zero SSR** — the #1 GEO blocker
- Source-built mismatch destroys SEO content
- Canonical URL points to staging
- CSP uses `unsafe-inline` + `unsafe-eval`
- SPA query-param routing creates no indexable URLs
- Firebase SDK adds ~780KB to boot path

### Schema & Structured Data (35/100)

**Present (in source, stripped in build):**
- `SoftwareApplication` — rich in source, minimal in build
- `Organization` — present in source, absent in build
- `FAQPage` — 5 Q&A pairs in source, absent in build
- Open Graph (9 properties + locale alternates)
- Twitter Card (missing `twitter:site` in build)
- PWA Manifest (excellent — icons, shortcuts, screenshots)

**Missing:**
- `WebSite` + `SearchAction` schema
- `BreadcrumbList` on inner pages
- `Product/Offer` schema for pricing tiers
- `HowTo` schema for 4-step workflow
- `Article` / `BlogPosting` schema
- `AggregateRating` (no reviews collected)
- `speakable` property
- `knowsAbout` on Organization

### Platform Optimization (20/100)

**Strengths:**
- Professional OG image (1200x630, bilingual, shows product)
- robots.txt properly configured with AI crawler allow rules
- PWA with shortcuts and screenshots
- llms.txt exists with product summary

**Weaknesses:**
- Zero external platform presence (no social media, no YouTube, no Reddit, no LinkedIn, no Product Hunt)
- No `assetlinks.json` for Android deep linking
- Sitemap has only 6 URLs on wrong domain
- No backlink-worthy content (no blog, no documentation, no open-source tools)
- No cross-platform entity verification

---

## Quick Wins (Implement This Week)

1. **Fix the build pipeline** — Use `vite-plugin-html` to preserve JSON-LD schemas, SEO fallback content, and meta tags in `dist/index.html`. Expected impact: +25 GEO points (single highest-impact fix).

2. **Commit and deploy `public/robots.txt`** with AI crawler rules — immediate AI access improvement. Expected impact: +5 points.

3. **Verify `dist/llms.txt` deployment** — ensure the file exists in built output. Expected impact: +3 points.

4. **Fix canonical URL** — Add `define: { 'import.meta.env.BASE_URL': JSON.stringify('https://billqyro.com') }` to `vite.config.js` and use it in index.html. Expected impact: +5 points.

5. **Update `sitemap.xml`** — Change all URLs from `billqyro-app.vercel.app` to `billqyro.com`, add `<lastmod>` dates. Expected impact: +3 points.

---

## 30-Day Action Plan

### Week 1: Build Pipeline & Critical Fixes
- [ ] Install and configure `vite-plugin-html` to preserve SEO content in build
- [ ] Fix canonical URL to use `billqyro.com` (env variable or define)
- [ ] Verify `dist/robots.txt`, `dist/llms.txt`, `dist/sitemap.xml` exist after build
- [ ] Update sitemap.xml URLs from staging to production domain
- [ ] Add `<lastmod>` dates to sitemap entries
- [ ] Expand sitemap to include all public routes (help, guides, support)
- [ ] Deploy and verify all fixes on Vercel

### Week 2: Schema & Structured Data
- [ ] Verify Organization JSON-LD survives build (add sameAs links)
- [ ] Verify FAQPage JSON-LD survives build (5 Q&A pairs)
- [ ] Expand SoftwareApplication JSON-LD with missing properties
- [ ] Add `WebSite` + `SearchAction` schema
- [ ] Add `Product/Offer` schema for 3 pricing tiers
- [ ] Add `BreadcrumbList` to inner pages
- [ ] Add `twitter:site` and `twitter:creator` meta tags

### Week 3: Content & Trust
- [ ] Create `About.jsx` page with founder name, team, company mission, registration details
- [ ] Add company legal name to Privacy Policy, Terms, Refund Policy pages
- [ ] Add 3-5 testimonials or anonymized case studies to Landing.jsx
- [ ] Add social media links to footer (Twitter/X, LinkedIn, YouTube, Facebook)
- [ ] Populate `sameAs` array in Organization schema
- [ ] Add source citations for security claims (Firebase SOC2)
- [ ] Replace dynamic dates with static "Last updated" on legal pages

### Week 4: Platform & Authority
- [ ] Create Twitter/X account (@billqyro) and link to site
- [ ] Create LinkedIn Company Page
- [ ] Create YouTube channel with 2-3 product walkthrough videos
- [ ] Launch on Product Hunt
- [ ] Register on G2 and Capterra
- [ ] Create `public/.well-known/assetlinks.json` for Android App Links
- [ ] Add IndexNow key for Bing/ChatGPT indexing
- [ ] Start a blog with 2-3 high-value articles (e.g., "Best Free Invoice Software for Small Shops in India 2026")
- [ ] Consider prerendering solution for full SPA content visibility

---

## Appendix: Pages Analyzed

| URL | Title | GEO Issues |
|---|---|---|
| `index.html` (source) | BillQyro - Smart Billing. Premium Invoices. | 4 (build strips content) |
| `dist/index.html` (built) | BillQyro - Smart Billing. Premium Invoices. | 8 (missing schemas, staging canonical, no SEO fallback) |
| `src/pages/Landing.jsx` | Landing Page (1283 lines) | 5 (no social proof, no about, no citations) |
| `public/robots.txt` | robots.txt | 1 (may not be deployed) |
| `public/sitemap.xml` | sitemap.xml | 3 (wrong domain, only 6 URLs, no lastmod) |
| `public/llms.txt` | llms.txt | 2 (short, may not be deployed) |
| `public/manifest.json` | PWA Manifest | 0 (excellent) |
| `vercel.json` | Vercel Config | 2 (CSP weaknesses, no X-XSS-Protection) |
| `src/pages/PrivacyPolicy.jsx` | Privacy Policy | 2 (no company name, dynamic date) |
| `src/pages/TermsOfService.jsx` | Terms of Service | 2 (no company name, dynamic date) |
| `src/pages/RefundPolicy.jsx` | Refund Policy | 2 (no company name, dynamic date) |
| `src/pages/DataDeletion.jsx` | Data Deletion | 1 (disabled buttons) |
| `src/pages/Support.jsx` | Support Page | 0 |
| `src/pages/HelpCenter.jsx` | Help Center | 0 (strong internal content) |

---

## Estimated Score After Fixes

| Category | Current | After Week 1 | After Full Plan |
|---|---|---|---|
| AI Citability | 42 | 65 | 80 |
| Brand Authority | 7 | 15 | 55 |
| Content E-E-A-T | 33 | 45 | 70 |
| Technical GEO | 55 | 75 | 85 |
| Schema & Structured Data | 35 | 70 | 88 |
| Platform Optimization | 20 | 30 | 60 |
| **Overall** | **32** | **52** | **74** |

Implementing the full 30-day plan would realistically move BillQyro from **Critical (32)** to **Good (74)** — a 131% improvement in GEO readiness. The single highest-impact fix is resolving the build pipeline to preserve the excellent SEO content already written in the source `index.html`.
