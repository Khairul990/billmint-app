# Branding Pack Plan

## App Screenshots Needed

| Screenshot | Content | Tool |
|-----------|---------|------|
| Dashboard | Full dashboard with revenue chart, stats, quick actions | DevTools full-page screenshot |
| Invoice List | Invoice list with status badges | DevTools |
| Create Invoice | Invoice form with items table | DevTools |
| Customer List | Customer list with search/filter | DevTools |
| Settings | Business settings / theme picker | DevTools |
| Reports | Revenue reports with charts | DevTools |
| Mobile App | Android screenshots (multiple) | Emulator |
| Live Link | PublicInvoice.jsx payment page | DevTools |
| PDF Preview | Generated PDF invoice | PDF renderer |

## Feature Screenshots (for landing page)

| Feature | Content |
|---------|---------|
| Smart Invoicing | Invoice form with populated items + template preview |
| Client Management | Customer list + profile view |
| Financial Insights | Reports page with revenue bar chart |
| PDF Generation | PDF preview/download dialog |
| Live Invoice Links | PublicInvoice page with payment hub |
| Inventory | Products/services list with stock |
| Multi-Workspace | Workspace switcher UI |
| Templates | Template Marketplace grid |

## Demo Invoice Set

```
INV-DEMO-001: Soheb Mollik - Embroidery ×2, Stitching ×3 - ₹2,510
INV-DEMO-002: Ravi Kumar - Design ×5, Repair ×1 - ₹4,200
INV-DEMO-003: Fatima Begum - Tailoring ×4, Fabric ×2 - ₹1,850
INV-DEMO-004: Arun Singh - Items ×8 - ₹6,300
INV-DEMO-005: Priya Sharma - Consultations ×3 - ₹3,000
```

## Demo Customer Set

```
Soheb Mollik | +91 98765 43210 | soheb@example.com
Ravi Kumar   | +91 87654 32109 | ravi@example.com
Fatima Begum | +91 76543 21098 | fatima@example.com
Priya Sharma | +91 65432 10987 | priya@example.com
Arun Singh   | +91 54321 09876 | arun@example.com
```

## Demo Live Link Set

| Invoice | Public Token | URL |
|---------|-------------|-----|
| INV-DEMO-001 | demo-inv-1001 | app.billqyro.com/i/demo-inv-1001 |
| INV-DEMO-002 | demo-inv-1002 | app.billqyro.com/i/demo-inv-1002 |
| INV-DEMO-003 | demo-inv-1003 | app.billqyro.com/i/demo-inv-1003 |

Store static demo data in `src/config/demoInvoices.js` and `src/config/demoCustomers.js`.
