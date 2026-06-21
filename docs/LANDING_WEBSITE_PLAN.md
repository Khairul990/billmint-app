# Landing Website Foundation Plan

## Current State
- `src/pages/Landing.jsx` exists but is NOT shown to unauthenticated users (they go to Login directly)
- Home page has: Navbar > Hero > Features Grid (4 cards) > Footer
- No routing between pages — app uses currentTab state

## Proposed Pages

### 1. Home (Improve Landing.jsx)
```
Navbar: [Logo] [Features] [Pricing] [Templates] [About] [Contact] | [Login] [Get Started Free]
Hero: Headline + Subheadline + 2 CTAs + Product screenshot mockup
Trust Bar: No credit card / 14-day trial / 256-bit encrypted
Features Grid: 6-8 detailed feature cards
How It Works: 3-4 step process
Testimonials: Placeholder carousel
Stats Counter: 10K+ invoices / 500+ businesses / 99.9% uptime
FAQ: Accordion
Final CTA: Ready to simplify billing?
Footer: Links + Copyright
```

### 2. Features Page
Grid of 8 features: Smart Invoicing, Client Management, Financial Reports, PDF Generation, Live Invoice Links, Multi-Platform, Inventory, Multi-Workspace

### 3. Pricing Page
3 tiers: Free (15 invoices), Premium (unlimited), Enterprise (custom)

### 4. Templates Page
Grid of 8 invoice templates with previews

### 5. About Page
Story, mission, team placeholder

### 6. Contact Page
Form + contact info

### 7. Login Page (EXISTS - no changes needed)

### 8. Get Started Page
Sign-up flow preview with benefit summary

## Navigation Structure
Desktop: [HOME] [FEATURES] [PRICING] [TEMPLATES] [ABOUT] [CONTACT] | [LOGIN] [GET STARTED]
Mobile: Hamburger with same items stacked

## CTA Locations
1. Navbar right: "Log in" + "Get Started Free"
2. Hero: Primary + Secondary CTA
3. After Features: "See all features →"
4. After Pricing: "Choose your plan"
5. Footer: "Get Started Free"
6. End of every page: Generic CTA

## Mobile Layout
- Stack hero text/image vertically
- Single column for feature cards
- Vertical pricing cards
- Hamburger nav
- Full-width CTA buttons

## Implementation Order
1. Enable Landing.jsx as default for unauthenticated users (modify App.jsx routing)
2. Add page routing (react-router or custom tab system)
3. Build missing pages (Features, Pricing, Templates, About, Contact, Get Started)
4. Connect navigation
5. Mobile responsive testing
