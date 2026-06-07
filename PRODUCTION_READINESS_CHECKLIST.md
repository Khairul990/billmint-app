# BillQyro Production Readiness Checklist

This document tracks the final steps required before deploying BillQyro to production and opening it to real users.

## 1. Firebase Backend Security
- [x] **Firestore Rules**: Deploy `firestore.rules` via Firebase CLI (`firebase deploy --only firestore`).
- [x] **Storage Rules**: Deploy `storage.rules` via Firebase CLI (`firebase deploy --only storage`).
- [ ] **Custom Auth Claims**: Move the hardcoded Super Admin check (`khairul2052007@gmail.com`) in `adminAccess.js` and `firestore.rules` to use Firebase Custom Auth Claims via a Node.js admin script or Cloud Function.
- [ ] **Cloud Functions Implementation**: Convert the stubs in `src/services/cloudFunctions.js` into actual server-side Firebase Cloud Functions (Node.js). Required for:
  - Securely triggering emails via SendGrid or Postmark.
  - Verifying payment transaction IDs against bank APIs or payment gateways.
- [ ] **Firebase App Check**: Enable App Check (reCAPTCHA Enterprise / Play Integrity) in the Firebase Console and initialize it in `firebaseConfig.js` to block unauthorized API access.

## 2. PWA and Offline Capability
- [x] **Service Worker Security**: `vite.config.js` is configured with `navigateFallbackDenylist` to prevent caching of sensitive API routes and tokens.
- [x] **Sync Engine Hardening**: Exponential backoff and retry limits implemented in `dbEngine.js`.
- [x] **Soft Delete**: `isDeleted` flags added to prevent accidental data loss.

## 3. Legal and Compliance
- [x] **Terms of Service**: Implemented at `/settings` -> Data & Privacy.
- [x] **Privacy Policy**: Implemented.
- [x] **Refund Policy**: Implemented.
- [x] **Data Deletion Instructions**: Implemented.
- [x] **Right to be Forgotten**: The "Wipe All Local Data" button and `deleteAccount` API are fully functional for GDPR compliance.

## 4. Performance & Build Optimization
- [ ] **Bundle Splitting**: Ensure the `vite.config.js` `manualChunks` successfully splits `firebase-vendor` and `ui-vendor` to keep the main bundle under 500KB.
- [ ] **Lighthouse Score**: Run a Google Lighthouse audit in Chrome DevTools to ensure high scores for Performance, Accessibility, Best Practices, and SEO.

## 5. Domain & Hosting Setup
- [ ] **Custom Domain**: Connect your domain to Vercel or Firebase Hosting.
- [ ] **Environment Variables**: Ensure `.env.production` (or Vercel Environment Variables) contains the correct production Firebase keys and `VITE_ADMIN_EMAIL`.

## Developer Sign-off
Before launch, the Super Admin MUST run:
```bash
npm run build
firebase deploy
```
And perform a final end-to-end test of the Live Invoice Payment Flow.
