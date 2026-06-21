# BillQyro Security Hardening Report

## Environment Variables
- [x] `.gitignore` fixed (was `. e n v` with spaces — now properly `.env`)
- [x] `.env` removed from git tracking (`git rm --cached .env`)
- [x] `.env.example` updated with App Check vars
- [ ] **RECOMMENDED**: Rotate Firebase API keys (they were in git history)

## Firestore Rules (firestore.rules)
- [x] All user collections (`invoices/{userId}/items/*`) — owner + admin only
- [x] `usersList` — role escalation protection (blocks `role`, `isAdmin`, `plan` fields)
- [x] `publicInvoices/{token}` — read:true (by design), update restricted to `paymentProofs`/`paymentStatus`
- [x] `payment_proofs` — owner create/read, admin update/delete
- [x] Added `isValidPublicInvoiceData()` function to validate public invoice field updates
- [ ] **RECOMMENDED**: Move hardcoded admin email to Firebase Custom Auth Claims

## Storage Rules (storage.rules)
- [x] `business_logos` — authenticated write, 2MB limit, images only
- [x] `payment_proofs` — NOW requires auth (was public write), 5MB limit, images only
- [x] Catch-all — admin email only

## Client-Side Security
- [x] XSS sanitization added to PublicInvoice payment proof inputs
- [x] Input validation: payment method whitelist, amount bounds (0-999M), string length limits
- [x] adminAccess.js: production mode uses env var only, dev mode has hardcoded fallback
- [x] Firebase App Check readiness documented in firebaseConfig.js

## Security Audit Summary

| Area | Status | Risk | Notes |
|------|--------|------|-------|
| .env in git | FIXED | HIGH | API keys were exposed. Rotate keys. |
| Storage payment_proofs | FIXED | HIGH | Was public write. Now requires auth. |
| XSS in payment proofs | FIXED | MEDIUM | Input sanitization added |
| Hardcoded admin email | EXISTS | MEDIUM | Works for MVP. Switch to Custom Claims for production. |
| App Check | PLANNED | LOW | Code ready, needs Firebase Console setup |
| Public invoice read | BY DESIGN | LOW | Required for live link feature |
| Workspace isolation | GOOD | NONE | User data is per-user in subcollections |
