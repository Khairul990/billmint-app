# Empire Connection Info: BillQyro

This file documents the safe connection between the BillQyro application and the Khair Murafiq Empire Control Room (`KM_Control_Room`).

## Website Identity
- **Website Name:** BillQyro
- **Website ID:** billqyro
- **Website Type:** Billing SaaS
- **Live Website Link:** https://billqyro-app.vercel.app/
- **GitHub Repo Link:** [Add URL here]
- **Vercel Project Name:** billqyro

## Empire Agent Details
- **Control Room Agent Status:** Enabled (`EMPIRE_AGENT_ENABLED = true`)
- **Agent File Path:** `src/services/empireAgent.js`
- **Firebase Project Note:** BillQyro maintains its own Firebase configuration for auth/storage. The Empire Agent safely writes metadata telemetry to the `control_website_events`, `control_website_health`, and `control_website_errors` collections.

## Safe Events List
The Empire Agent transmits the following sanitized events:
- `app_opened`: Sent when the app initializes.
- `page_view`: Sent when navigating pages.
- `health_ping`: Periodic health reporting.
- `invoice_created`: `{ feature: "invoice", action: "created", privateDataIncluded: false }`
- `customer_added`: `{ feature: "customer", action: "added", privateDataIncluded: false }`
- `product_added`: `{ feature: "product", action: "added", privateDataIncluded: false }`
- `pdf_downloaded`: `{ feature: "pdf", action: "downloaded", privateDataIncluded: false }`

## ⚠️ PRIVACY WARNING: DO NOT SEND PRIVATE DATA
**Under no circumstances should the Empire Agent transmit:**
- Customer names, phone numbers, addresses, or emails
- Invoice IDs, amounts, payment info, or financial data
- Product details or internal database IDs
- Passwords, API Keys, Secrets, or Tokens
- Service Account JSONs or Firebase Admin credentials

*The metadata payload must remain strictly anonymous and feature-focused.*

## How to add this website in KM_Control_Room
1. Start the **KM_Control_Room** application locally or open the live dashboard.
2. Navigate to **Website Control Room** (Projects).
3. Click **Add Website**.
4. Enter the exact identity matching this project:
   - **Website Name:** BillQyro
   - **Website ID:** billqyro (CRITICAL: Must match exactly)
   - **Type:** Billing SaaS
5. Click **Save Website**.
6. The Control Room will now actively listen to any incoming telemetry from this site and display it on the Dashboard and Project Cards automatically.
