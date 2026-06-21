# Legal Pack — BillQyro v1.0 Launch

## Privacy Policy Checklist

### Must Include
- [ ] What data is collected: email, business name, invoice data, customer data, payment proofs, photos, usage analytics
- [ ] How data is stored: Firebase Firestore, Firebase Storage, LocalStorage (offline cache)
- [ ] How data is shared: NOT shared with third parties except Firebase (Google Cloud infrastructure)
- [ ] User rights: Right to access, right to deletion, right to data export
- [ ] Data retention: Active data retained while account active; deleted data removed within 30 days
- [ ] Cookies/analytics: Firebase Analytics if enabled
- [ ] Children's privacy: Service not intended for users under 13
- [ ] International transfers: Data stored on Google Cloud servers (location may vary)
- [ ] Contact: Email for privacy concerns

### Implementation
- [ ] PrivacyPolicy.jsx page exists — verify content completeness
- [ ] Link in app footer (More menu → Privacy Policy)
- [ ] Link on login/registration page

## Terms & Conditions Checklist

### Must Include
- [ ] Acceptance of terms
- [ ] Account registration and security
- [ ] Free tier: 15 invoices limit, basic templates, local-only storage
- [ ] Premium tier: Unlimited invoices, live links, PDFs, cloud sync
- [ ] Pay-per-bill: ₹5 per bill beyond free limit (configurable by owner)
- [ ] Payment terms: Payment via UPI/bKash/Nagad/Bank Transfer, manual proof verification
- [ ] Refund policy: No automatic refunds; case-by-case review
- [ ] User responsibilities: No fraudulent invoicing, accurate business info
- [ ] Prohibited uses: Illegal goods/services, impersonation, spam
- [ ] Limitation of liability: BillQyro not liable for data loss or business interruption
- [ ] Account suspension: For non-payment, ToS violation, or owner/admin discretion
- [ ] Data ownership: User retains ownership of their invoice/customer data
- [ ] Termination: User can delete account anytime
- [ ] Changes to terms: 30-day notice for material changes
- [ ] Governing law: India
- [ ] Contact information

### Implementation
- [ ] TermsOfService.jsx page exists — verify content completeness
- [ ] Link in app footer
- [ ] Acceptance checkbox on signup

## Refund Policy Checklist

### Must Include
- [ ] Premium subscription: No automatic refunds; pro-rated refunds at owner's discretion
- [ ] Pay-per-bill: Pre-paid bill credits non-refundable
- [ ] Platform due overpayment: Refundable on request within 30 days
- [ ] Processing time: 7-14 business days for approved refunds
- [ ] How to request: Email support@billqyro.com with invoice details

### Implementation
- [ ] RefundPolicy.jsx page exists — verify content completeness

## Support Policy Checklist

### Must Include
- [ ] Support channels: In-app support ticket system, email (support@billqyro.com)
- [ ] Response times: Within 24 hours for premium users, 48 hours for free tier
- [ ] Scope: Technical issues, billing questions, account help
- [ ] Out of scope: Custom development, training, design services
- [ ] Abuse reporting: Report ToS violations to support@billqyro.com

### Implementation
- [ ] Support.jsx page exists (user-facing)
- [ ] SupportCenter.jsx exists (admin-facing)
- [ ] support@billqyro.com email alias configured
