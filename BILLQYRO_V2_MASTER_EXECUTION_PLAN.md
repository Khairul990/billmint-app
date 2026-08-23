# BILLQYRO V2 — MASTER EXECUTION PLAN

## Enterprise 20-Phase Upgrade & Completion Blueprint

This is the single master execution document for the BillQyro project.
An AI/developer MUST read this entire file before beginning major work.

---

## 00 — MASTER DIRECTIVE

You are working on an existing BillQyro Enterprise V8 project.

BillQyro is a premium, offline-first, multi-tenant billing and business-management platform.

DO NOT rebuild the application from scratch.
DO NOT replace working architecture merely because another implementation is easier.

Your mission is to understand the real repository, preserve working business logic, improve the product systematically, and execute Phase 01 through Phase 20.

The final product must be:
- premium
- modular
- category-aware
- offline-first
- secure
- mobile/PWA friendly
- maintainable
- extensible
- architecture-documented

The final system should feel like one unified premium SaaS product.

---

## 01 — MANDATORY PROJECT DISCOVERY

Before modifying production code, inspect the actual repository and current Git/GitHub state.

Read and verify, where present:

- docs/architecture/
- docs/architecture/atlas/
- architecture.json
- MASTER_MAP.md
- ARCHITECTURE.md
- DOMAIN_MAP.md
- FEATURE_MAP.md
- DATA_MODEL.md
- DATA_FLOW.md
- OFFLINE_SYNC.md
- MODULE_MAP.md
- THEME_MAP.md
- SECURITY_MAP.md
- USER_FLOW.md
- AI_CHANGE_PROTOCOL.md
- HTML_DESIGN_MAP.md
- design-reference/
- featureRegistry.js
- businessPresets.js

Inspect:
- src/pages/
- src/components/
- src/services/
- src/contexts/
- src/hooks/
- src/config/
- src/utils/

Documentation is a map, not permission to invent facts.

Compare documentation against actual source code.
If documentation conflicts with source:
1. record the mismatch
2. preserve working behavior
3. use actual implementation as current truth
4. update documentation after the change

---

## 02 — ARCHITECTURE SAFETY

The normal business-data path is:

UI
→ Domain Engine
→ Local Repository / IndexedDB
→ Sync Queue
→ Firebase / Firestore

Respect the existing offline-first architecture.

Business logic belongs in services/engines.
UI components must not become alternative databases or financial engines.

Critical systems requiring extra care:
- dbEngine.js
- localDb.js
- offlineEngine.js
- App.jsx
- invoiceEngine.js
- bankEngine.js
- featureRegistry.js
- Firebase security rules

Do not casually rewrite them.

---

## 03 — ABSOLUTE NON-DESTRUCTIVE RULES

Never:
- delete working features
- delete user data
- perform silent destructive migrations
- create duplicate billing engines
- create duplicate payment ledgers
- bypass offline sync without documenting the exception
- copy mock JavaScript from reference HTML into production
- hardcode theme colors when theme variables exist
- expose secrets in frontend code
- weaken Firebase ownership/security rules
- allow customers to directly mark invoices as Paid
- break existing feature toggles
- break mobile/PWA behavior
- break PDF generation
- break WhatsApp sharing
- break workspaces

If a destructive change is genuinely necessary, STOP and request approval.

Normal UI/design decisions do not require approval.

---

## 04 — SYSTEM ATLAS RULE

The System Atlas is the permanent architectural map.

After every structural change, regenerate/update the Atlas and relevant documentation.

The Atlas should map, where applicable:
- systems
- domains
- modules
- features
- engines/services
- routes/pages
- components
- contexts
- hooks
- utilities
- data stores
- Firestore collections
- IndexedDB stores
- themes
- templates
- studios
- settings
- relationships
- flows
- risk
- design references

It should behave like a Google Maps-style architectural map:
- districts
- buildings/nodes
- roads/relationships
- zoom
- pan
- search
- locate
- breadcrumbs
- minimap
- details
- map layers

Never fabricate relationships merely to make the map look complete.

---

## 05 — DESIGN DIRECTION

Evolve BillQyro toward a restrained premium SaaS identity.

Use:
- strong hierarchy
- premium typography
- consistent spacing
- refined cards
- excellent tables
- polished forms
- clear data visualization
- subtle motion
- elegant depth
- responsive layouts
- accessible contrast
- consistent icons

Avoid:
- excessive neon
- random gradients
- visual clutter
- oversized empty cards
- unnecessary animation
- inconsistent spacing
- inconsistent icons
- blindly copying reference HTML

The existing Theme Engine remains the runtime source of truth.

---

# PHASE 01 — FULL REPOSITORY AUDIT

Goal: establish a verified understanding of the current application.

Tasks:
- scan repository
- verify routes/pages
- verify engines/services
- verify components
- verify contexts/hooks
- verify business presets
- verify feature registry
- verify IndexedDB schema
- verify Firestore model
- verify PDF architecture
- verify payment architecture
- verify admin architecture
- verify subscription architecture
- verify offline/sync architecture
- identify stubs/orphans
- identify duplicate logic
- identify high-risk areas

Deliver:
- updated architecture documents
- audit report
- risk register

Definition of Done:
The documented architecture matches actual source sufficiently for safe development.

---

# PHASE 02 — PREMIUM DESIGN SYSTEM

Upgrade:
- typography
- spacing
- colors
- theme tokens
- cards
- buttons
- inputs
- selects
- tables
- badges
- tabs
- drawers
- modals
- tooltips
- empty states
- loading states
- error states
- notifications
- responsive behavior
- animations

Preserve existing theme switching.

All new styles must integrate with the Theme Engine.

Definition of Done:
Major screens share one coherent premium design system.

---

# PHASE 03 — APPLICATION SHELL

Upgrade:
- Sidebar
- Topbar
- Mobile navigation
- Breadcrumbs
- Workspace selector
- global search
- notifications
- network/offline indicator
- account menu
- page headers
- command/action areas

Navigation must react to enabled modules and business category.

Definition of Done:
The application feels like one coherent premium product.

---

# PHASE 04 — LANDING PAGE + LOGIN + ONBOARDING

Landing page:
- hero
- value proposition
- business categories
- feature overview
- dashboard preview
- billing preview
- retail preview
- customer portal
- offline-first explanation
- pricing
- security
- FAQ
- CTA

Login:
- premium authentication UI
- responsive mobile experience
- proper loading/error states

Onboarding:
1. identify business
2. choose category
3. recommend modules
4. enable/disable modules
5. configure business
6. enter workspace

Do not force irrelevant features on a category.

---

# PHASE 05 — DASHBOARD COMMAND CENTER

Transform Dashboard into a business command center.

Possible metrics:
- today's sales
- total collection
- outstanding due
- expenses
- current balance
- invoices
- payments
- revenue
- recent activity
- customer activity
- inventory alerts
- staff alerts

Widgets must be category/module aware.

Use real analytics engines and real data.
No fake production values.

---

# PHASE 06 — BILLING / INVOICE STUDIO

Redesign billing while preserving invoiceEngine.

Improve:
- customer selection
- product/service selection
- item editor
- quantity
- price
- discount
- tax
- payment
- Old Due
- current invoice total
- amount paid
- balance due
- due date
- payment method
- notes
- PDF preview
- save
- WhatsApp
- Live Link

Financial rule:

Previous Due
+
Current Invoice Total
-
Payment Applied
=
Total Outstanding

Keep previous/Old Due conceptually distinct from current invoice amount.
Do not corrupt historical balances.

---

# PHASE 07 — CATEGORY-AWARE BUSINESS SYSTEM

Create one core application with configurable category behavior.

Potential categories:

RETAIL / SHOP
- products
- inventory
- barcode
- QR
- sales
- orders
- customers
- payments
- expenses
- reports

TAILOR
- customers
- measurements
- orders
- delivery
- payments
- staff
- expenses
- reports

CLINIC / MEDICAL
- patients
- appointments
- services
- payments
- expenses
- reports

EDUCATION
- students
- courses
- batches
- fees
- payments
- dues
- reports

SERVICE / REPAIR
- jobs
- customers
- devices
- status
- payments
- expenses
- reports

Use existing businessPresets/feature architecture where possible.
Do not create separate applications.

---

# PHASE 08 — RETAIL / SHOPPING SYSTEM

Improve:
- product catalog
- SKU
- categories
- pricing
- stock
- inventory movement
- sales
- orders
- customers
- payments
- low-stock alerts
- barcode
- QR
- scanning
- reports

Barcode scanning should support phone camera where feasible and external scanner input where feasible.

Use an abstraction layer so future scanner providers can be added.
Do not claim hardware support without testing.

---

# PHASE 09 — CUSTOMER + STAFF SYSTEM

CUSTOMERS:
- customer profile
- invoice history
- payment history
- Old Due
- current due
- total outstanding
- ledger
- portal
- payment recording

STAFF:
- use staffEngine
- profile
- role
- salary/earning
- staff billing
- paid
- advance
- remaining payable
- ledger
- history

Do not duplicate financial calculations inside components.

---

# PHASE 10 — INTERNAL BANK / FINANCIAL LEDGER

Treat this as the business's internal financial ledger, not a real bank.

Core dashboard:
- current balance
- total collected
- total income
- total expense
- withdrawals
- credits
- debits

Transactions:
- customer collection
- invoice payment
- staff payment
- expense
- withdrawal
- adjustment/credit where supported

Every transaction should have:
- amount
- type
- date
- source
- category
- reason/note
- reference
- linked entity where applicable

Financial values must be deterministic and auditable.

---

# PHASE 11 — REPORTS & ANALYTICS

Create a unified reporting experience.

Where supported:
- sales
- collection
- due
- expenses
- revenue/profit views
- payments
- customer reports
- staff reports
- inventory reports
- category-specific reports

Provide:
- filters
- date ranges
- summaries
- charts
- tables
- print
- CSV export where supported

Do not create a second source of truth for dashboard metrics.

---

# PHASE 12 — SETTINGS COMMAND CENTER

Centralize:
- Business
- Theme
- Billing
- Invoice
- PDF
- Payments
- Customers
- Staff
- Products
- Inventory
- Barcode
- QR
- Reports
- Notifications
- WhatsApp
- Portal
- Security
- Backup
- Workspaces
- Modules

Every optional module should have ON/OFF behavior.

OFF:
- hide/disable relevant UI
- stop optional workflows
- preserve data

ON:
- restore relevant UI/workflows
- preserve existing data

Never delete data because a feature is disabled.

Use:
- featureRegistry
- featureControlEngine
- settingsEngine

---

# PHASE 13 — STUDIOS / CUSTOMIZATION SYSTEM

Unify existing Studios, including verified studios such as:
- Theme Studio
- Feature Control Studio
- PDF Template Studio
- Live Link Studio
- Subscription Studio
- Settings Studio
- category/business studios
- other verified studios

Every Studio must:
- have a clear purpose
- use shared design system
- save through correct engine
- respect permissions
- preserve data
- expose relevant settings

Do not create redundant studios.

---

# PHASE 14 — ADMIN + PLATFORM CONTROL

Improve existing Admin architecture.

Where supported:
- users
- businesses
- plans
- subscriptions
- premium requests
- platform revenue
- feature controls
- announcements
- maintenance
- system health
- audit logs
- security
- testing/demo environment

Admin must use actual authorization.
Never treat a frontend PIN as the only security boundary.
Never expose real secrets in frontend variables.

---

# PHASE 15 — CUSTOMER PORTAL + PAYMENTS

Improve Public Invoice / Customer Portal:
- invoice view
- total
- paid
- balance
- due date
- payment instructions
- payment proof
- invoice download
- payment status

Payment proof:
- submitted
- pending
- approved/rejected

Customers must not directly set their invoice to Paid.
Trusted gateway confirmation may be used where architecture supports it.

---

# PHASE 16 — OFFLINE + DATA + SECURITY HARDENING

Preserve and harden:

IndexedDB
→ syncQueue
→ Firebase

Test:
- online save
- offline save
- reconnect
- retry
- failed sync
- duplicate operations
- workspace isolation
- user isolation
- multi-device behavior

Audit:
- Firebase rules
- authentication
- workspace access
- public invoice access
- payment proof permissions
- admin permissions
- audit logging
- local storage boundaries

Do not weaken security to simplify development.

---

# PHASE 17 — PDF + WHATSAPP + COMMUNICATION

PDF flow:

Invoice data
→ template
→ PDF engine
→ react-pdf
→ blob
→ download/share

Test:
- local
- production
- desktop
- Android
- templates
- logo
- fonts
- currency
- tax
- totals

Fix production-only failures properly.
Do not solve PDF issues only by increasing arbitrary timeouts.

Communication:
- WhatsApp
- email where supported
- PDF URL
- Live Link
- dynamic customer name
- invoice number
- total
- paid
- balance
- due date

Use UTF-8-safe encoding.
Do not allow corrupted replacement characters in user-facing templates.

---

# PHASE 18 — FULL QA + REGRESSION

Run:
- lint
- build
- tests
- production build
- manual regression

Test:
- login
- logout
- workspace
- onboarding
- dashboard
- invoice creation
- invoice editing
- Old Due
- payments
- bank
- expenses
- staff
- products
- inventory
- PDF
- WhatsApp
- customer portal
- feature toggles
- settings
- admin
- subscription
- offline mode
- mobile
- desktop

Check console and network errors.
No critical regression may remain.

---

# PHASE 19 — ARCHITECTURE + DOCUMENTATION FINALIZATION

Regenerate/update where applicable:

- ARCHITECTURE.md
- MASTER_MAP.md
- DATA_MODEL.md
- DOMAIN_MAP.md
- FEATURE_MAP.md
- DATA_FLOW.md
- OFFLINE_SYNC.md
- MODULE_MAP.md
- THEME_MAP.md
- SECURITY_MAP.md
- USER_FLOW.md
- HTML_DESIGN_MAP.md
- AI_CHANGE_PROTOCOL.md
- architecture.json
- Atlas data

Ensure:
- obsolete files are not documented
- new files are mapped
- relationships are accurate
- risk levels are current
- routes/modules/features are current
- themes/templates/studios are current

---

# PHASE 20 — PRODUCTION RELEASE

Final verification:
- clean build
- production environment
- Firebase configuration
- security rules
- PDF
- storage
- authentication
- PWA
- mobile
- desktop
- performance
- no critical console errors
- no exposed secrets
- architecture docs current
- Atlas current

Create final release report.

Do not claim production-ready if a critical blocker remains.

---

# EXECUTION PROTOCOL

For every phase:

1. Read relevant architecture documentation.
2. Inspect actual source files.
3. Identify dependencies.
4. Create an internal checklist.
5. Implement safely.
6. Test.
7. Fix regressions.
8. Update documentation.
9. Update Atlas if structure changed.
10. Produce a phase report.
11. Continue to the next phase.

Do NOT stop for routine cosmetic decisions.

STOP only for:
- destructive migration
- data loss risk
- authentication/security break
- irreversible financial-model change
- unrecoverable architecture conflict

---

# DEFINITION OF DONE

A phase is complete only when:
- implementation exists
- existing behavior is preserved
- relevant tests pass
- build passes where applicable
- mobile is considered
- architecture is updated
- Atlas is updated when necessary
- no known critical regression remains
- report is truthful

Never fabricate completion.

If incomplete, report:

STATUS: NOT COMPLETED
REASON: ...
REMAINING WORK: ...

---

# PHASE REPORT FORMAT

## Phase X — Name

STATUS:
COMPLETED / PARTIAL / BLOCKED

### Completed
- ...

### Files Changed
- ...

### Systems Affected
- ...

### Tests
- ...

### Architecture Updated
- Yes/No

### Atlas Updated
- Yes/No

### Risks
- ...

### Remaining
- ...

Then continue to the next phase unless a true blocker requires user approval.

---

# FINAL ACCEPTANCE CHECKLIST

[ ] Repository audited
[ ] Architecture verified
[ ] Premium design system
[ ] App shell
[ ] Landing page
[ ] Login
[ ] Onboarding
[ ] Dashboard
[ ] Billing Studio
[ ] Old Due
[ ] Customer system
[ ] Staff system
[ ] Internal Bank
[ ] Payment system
[ ] Retail system
[ ] Barcode/QR architecture
[ ] Category system
[ ] Reports
[ ] Settings Command Center
[ ] Feature ON/OFF
[ ] Studios
[ ] Customer Portal
[ ] Admin Panel
[ ] Security
[ ] Offline sync
[ ] PDF production verified
[ ] WhatsApp verified
[ ] Mobile/PWA
[ ] QA
[ ] Architecture Atlas
[ ] Documentation
[ ] Production build
[ ] Final release audit

---

# FINAL MASTER COMMAND

READ THIS ENTIRE FILE FIRST.

Then inspect the actual BillQyro repository.

Do not rebuild the application.
Do not invent architecture.
Do not blindly trust old documentation.

Understand the current implementation first.

Execute Phase 01 → Phase 20 sequentially.

After each phase:
- test
- document
- update Atlas
- report honestly
- continue

The objective is not merely to change the UI.

The objective is to make BillQyro a coherent, premium, category-aware,
offline-first, secure, maintainable and extensible business platform
without destroying the working foundation already built.

START WITH PHASE 01.
