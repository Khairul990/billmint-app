# BillQyro — Security & Production Audit Report

**Date:** June 22, 2026  
**Audit Scope:** Full-stack security review (Firebase rules, client-side code, deployment config)  
**Auditor:** BillQyro Automated Security Audit  

---

## Executive Summary

BillQyro demonstrates solid security design patterns overall — Firestore rules enforce user isolation, role escalation protection is implemented, and sensible storage size limits are in place. However, several **critical weaknesses** were identified in the admin access layer (client-side PIN with hardcoded fallback, localStorage-based unlock flags) and secret handling (`VITE_ADMIN_PIN` bundled into client code). The application currently lacks server-side enforcement for admin privileges and relies entirely on client-side checks for route protection.

---

## 1. Firebase Rules Audit

### 1.1 Firestore Rules (`firestore.rules`)

| Check | Result | Details |
|-------|--------|---------|
| Auth enforcement | ✅ Good | `isAuth()` helper used consistently across private paths |
| User isolation | ✅ Good | `isOwner(userId)` scopes access by `request.auth.uid` |
| Role escalation protection | ✅ Good | `usersList` blocks users from setting `role`, `isAdmin`, `plan`, `permissions`, `subscription`, `businessId` |
| Public invoice read | ✅ Acceptable | `publicInvoices` allows `read: if true` (by design for live links) |
| Update validation on public docs | ⚠️ Weak | `isValidPublicInvoiceData()` checks only affected keys, not values — unauthenticated users can set `paymentStatus` and `updatedAt` to arbitrary values |
| Hardcoded admin email | 🔴 **Critical** | `isAdmin()` uses `request.auth.token.email == 'khairul2052007@gmail.com'` — cannot be changed without redeploying rules |
| Unused helper | ⚠️ Warning | `isWorkspaceOwner()` function is defined but never referenced in any rule |
| Request size limits | ❌ Missing | No `request.resource.size` validation on any Firestore document |
| Rate limiting | ❌ Missing | No rate limiting on writes (spam / DoS vector) |
| Path validation | ⚠️ Partial | Path pattern uses `{userId}` but doesn't validate `userId == request.auth.uid` at the collection level — it relies on individual rules |
| Subcollection data validation | ❌ Missing | No schema validation on any document writes (e.g. `invoices/{userId}/items/{itemId}` accepts any fields) |

**Detailed Findings:**

- **CRITICAL:** The `isAdmin()` function at line 17 is hardcoded to a single Gmail address. If this email is compromised or needs to change, the Firestore rules file must be redeployed. There is no support for multiple admins or admin groups.
- **MEDIUM:** `isValidPublicInvoiceData()` (line 27-29) allows unauthenticated users to modify `paymentProofs`, `paymentStatus`, and `updatedAt` fields. A malicious actor could spam arbitrary payment proof references without authentication.
- **LOW:** The `isWorkspaceOwner()` helper (line 21-23) adds complexity without being used in any `match` block.

### 1.2 Firestore Rules — Collections Overview

| Collection | Read | Write | Notes |
|-----------|------|-------|-------|
| `invoices/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ✅ |
| `customers/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ✅ |
| `products/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ✅ |
| `expenses/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ✅ |
| `auditLogs/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ✅ |
| `errorLogs/{uid}/items/{id}` | Owner / Admin | Owner / Admin | ⚠️ Users can see their own error logs |
| `settings/{userId}` | Owner / Admin | Owner / Admin | ✅ |
| `usersList/{userId}` | Owner / Admin | Create/Update: Owner (restricted), Delete: Owner | ✅ Role escalation protected |
| `publicInvoices/{token}` | Anyone | Create/Delete: Auth, Update: Auth or public | ⚠️ Public update is a spam vector |
| `platformConfig/{id}` | Auth | Admin only | ✅ |
| `globalAdminSettings/{id}` | Auth | Admin only | ✅ |
| `subscription/{userId}` | Owner / Admin | Owner / Admin | ⚠️ No validation on subscription data |
| `premiumRequests/{id}` | Self / Admin | Create: Self, Update/Delete: Admin | ✅ |
| `payment_proofs/{id}` | Self / Admin | Create: Self, Update/Delete: Admin | ✅ |

---

## 2. Storage Rules Audit (`storage.rules`)

| Check | Result | Details |
|-------|--------|---------|
| Auth required for writes | ✅ Good | `request.auth != null` on all write paths |
| File size limits | ✅ Good | 5MB for payment proofs, 2MB for logos |
| Content type validation | ✅ Good | `image/.*` enforced for uploads |
| Public read for logos | ⚠️ Warning | `business_logos` allows `read: if true` — anyone can enumerate/fetch logos |
| Catch-all path | ⚠️ Weak | `/{allPaths=**}` grants read/write only to hardcoded admin email — prevents accidental exposure but is overly restrictive |
| File name validation | ❌ Missing | No sanitization or pattern check on uploaded filenames |
| Rate limiting | ❌ Missing | No write frequency limits |
| Per-user folder isolation | ❌ Missing | No path structure like `/{userId}/payment_proofs/{file}` |

**Detailed Findings:**

- **MEDIUM:** Business logos are publicly readable. While logos are typically public, this could leak branding information or allow hotlinking abuse.
- **LOW:** The catch-all rule at line 26-28 is restrictive to only one admin email but would block any legitimate unauthenticated reads of other storage paths.
- **LOW:** No path traversal protection in filename — a malicious filename like `../../evil.txt` might not be sanitized.

---

## 3. Admin Access Audit

### 3.1 PIN-Based Access (`AdminPINLogin.jsx`)

| Check | Result | Details |
|-------|--------|---------|
| PIN stored server-side | 🔴 **Critical** | PIN checked against `import.meta.env.VITE_ADMIN_PIN || '1234'` — if env var not set, fallback is the literal `'1234'` |
| Client-side exposure | 🔴 **Critical** | `VITE_ADMIN_PIN` is a `VITE_` prefixed variable, meaning it is **bundled into the client JS** and visible in DevTools |
| Session persistence | 🔴 **Critical** | `localStorage.setItem('billqyro_admin_unlocked', 'true')` — trivially bypassable via DevTools or script injection |
| Attempt limiting | ⚠️ Partial | 5-attempt limit is enforced, but only client-side — clearing localStorage resets attempts |
| Audit logging | ⚠️ Weak | Failed attempts logged to `localStorage` — not persistent or server-side |
| Default PIN | 🔴 **Critical** | Default PIN `'1234'` is the same for both `AdminPINLogin.jsx` and `AdminUnlock.jsx` |

### 3.2 Admin Email Verification (`adminAccess.js`)

| Check | Result | Details |
|-------|--------|---------|
| Client-side email check | 🔴 **Critical** | `isAdminUser()` checks email string on client — **easily spoofed in memory** |
| Source code acknowledgment | ✅ Good | Comment at line 27-30 explicitly acknowledges the issue and recommends Firebase Custom Auth Claims |
| Hardcoded owner email | ⚠️ Warning | Dev mode unconditionally grants admin to `khairul2052007@gmail.com` (line 40) |
| Production check | ⚠️ Partial | In production, uses `VITE_ADMIN_EMAIL`, but this is still a client-side env variable exposed in bundle |

### 3.3 Security Measures Summary

| Measure | Status | Risk |
|---------|--------|------|
| Server-side admin verification | ❌ Not implemented | 🔴 Critical |
| Firebase Custom Auth Claims | ❌ Not implemented | 🔴 Critical |
| Server-side session validation | ❌ Not implemented | 🔴 Critical |
| Rate-limited PIN attempts | ⚠️ Client-side only | 🟡 Medium |
| Audit trail for admin actions | ⚠️ Local storage only | 🟡 Medium |
| IP-based restrictions | ❌ Not implemented | 🟡 Medium |

---

## 4. Route Protection Audit

### 4.1 Route Access Matrix

| Route | Tab | Protected | Mechanism | Risk |
|-------|-----|-----------|-----------|------|
| `/` (Landing) | `landing` | Public | — | ✅ |
| `/login` | `login` | Public | — | ✅ |
| Dashboard | `dashboard` | Client-side auth | `isAuthenticated` state | ⚠️ Medium |
| Invoices | `invoices` | Client-side auth | `isAuthenticated` state | ⚠️ Medium |
| Settings | `settings` | Client-side auth | `isAuthenticated` state | ⚠️ Medium |
| Admin Panel | `/km-admin` | Admin check + PIN | `isAdminUser()` + localStorage unlock | 🔴 **Critical** |
| Public Invoice | `/invoice/{token}` | Public | Firestore rules | ✅ |
| Onboarding | `onboarding` | Client-side auth | `isAuthenticated` state | ⚠️ Medium |
| Privacy/Terms/Refund | Various | Public | — | ✅ |

### 4.2 Route Protection Findings

- **CRITICAL:** The `AdminRouteGuard` component (lines 158-185) relies entirely on client-side checks:
  1. `getAuthSession()` — reads from localStorage
  2. `isAdminUser(session)` — client-side email comparison
  3. `localStorage.getItem('billqyro_admin_unlocked')` — simple localStorage flag

- **MEDIUM:** All authenticated routes share the same protection pattern (`isAuthenticated` state boolean, set from localStorage/Firebase auth observer). A malicious script could set `isAuthenticated` to bypass.

- **MEDIUM:** Demo mode authentication uses localStorage flags (`billqyro_demo_session_active`, `billqyro_demo_logged_in`, `billqyro_demo_journey_mode`) — trivially bypassable.

- **LOW:** The app does not use URL-based routing (react-router) — all navigation is state-based (`currentTab`). This reduces CSRF surface but makes deep-linking inconsistent.

- **LOW:** Account blocked interceptor (line 1665) and payment due interceptor (line 1708) both check `isAdminUser` to exempt the admin. This means admin accounts cannot be blocked through the normal mechanism.

---

## 5. Secret Handling Audit

### 5.1 Environment Variables

| Variable | Bundled in Client? | Sensitivity | Risk |
|----------|-------------------|-------------|------|
| `VITE_FIREBASE_API_KEY` | ✅ Yes | Public by design (client SDK) | ✅ Acceptable |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_FIREBASE_APP_ID` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_FIREBASE_MEASUREMENT_ID` | ✅ Yes | Public | ✅ Acceptable |
| `VITE_ADMIN_EMAIL` | ✅ **Yes** | **Sensitive** | 🔴 **Critical** |
| `VITE_ADMIN_PIN` | ✅ **Yes** | **Secret** | 🔴 **Critical** |
| `VITE_APPCHECK_RECAPTCHA_KEY` | ✅ **Yes** | **Sensitive** | 🟡 Medium (commented out) |
| `VITE_APPCHECK_DEBUG_TOKEN` | ✅ **Yes** | **Debug secret** | 🟡 Medium (commented out) |

### 5.2 Firebase Config Exposure (`firebaseConfig.js`)

| Check | Result | Details |
|-------|--------|---------|
| Client-side config object | ✅ Acceptable | Firebase SDK requires this — API keys are public by design |
| Graceful fallback | ✅ Good | Checks `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` before initializing |
| App Check | ❌ Disabled | Commented out — no client attestation |
| Global `window` leak | ⚠️ Warning | `window.billqyro_firebaseReady = true` exposes Firebase ready state globally |
| Console warnings | ✅ Good | Falls back to LocalStorage mode gracefully |

### 5.3 Key Concerns

- **CRITICAL:** `VITE_ADMIN_PIN` is exposed in the client bundle. Anyone can find it by searching the compiled JS for string values. If the PIN is the same as the actual admin password or used elsewhere, this is a severe breach.
- **CRITICAL:** `VITE_ADMIN_EMAIL` is exposed in the client bundle. While an email is not a secret, it identifies the admin account, enabling targeted phishing or social engineering attacks.
- **MEDIUM:** Firebase App Check is commented out. Without it, there is no mechanism to verify that requests originate from the genuine BillQyro app, making the Firebase project vulnerable to abuse from external callers.

### 5.4 Cloud Functions (`cloudFunctions.js`)

| Check | Result | Details |
|-------|--------|---------|
| Functions deployed | ❌ **No** | All functions are **stubs** — they log to console and return mock `{ success: true }` |
| Payment verification | ❌ Mock | `verifyTransactionId` returns `{ isValid: true }` without actual bank API call |
| Email sending | ❌ Mock | `sendPaymentReceiptEmail` logs to console only |
| WhatsApp notifications | ❌ Mock | `sendWhatsAppNotification` logs to console only |
| Server-side validation | ❌ Not implemented | No backend exists to validate admin requests, payments, or user actions |

---

## 6. Deployment & Infrastructure Audit

### 6.1 Vercel Configuration (`vercel.json`)

| Check | Result | Details |
|-------|--------|---------|
| `X-Content-Type-Options: nosniff` | ✅ Good | Prevents MIME type sniffing |
| `X-Frame-Options: DENY` | ✅ Good | Prevents clickjacking |
| `Strict-Transport-Security` | ✅ Good | 1-year HSTS with subdomains |
| `Referrer-Policy` | ✅ Good | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ✅ Good | Restricts camera, mic, geolocation |
| `Content-Security-Policy` | ❌ **Missing** | No CSP header — XSS protection is absent |
| `CORS` headers | ❌ Missing | No CORS configuration |
| All-route rewrite | ⚠️ Warning | `/(.*)` → `/` means all URLs serve the SPA, including potential path-traversal attempts |
| API path protection | ⚠️ Partial | PWA workbox has `navigateFallbackDenylist: [/^\/api\//]` but this is client-side only |

### 6.2 Firebase Configuration (`firebase.json`)

| Check | Result | Details |
|-------|--------|---------|
| Firestore rules | ✅ Configured | Points to `firestore.rules` |
| Storage rules | ❌ Not configured | No `storage` rule entry — relies on Firebase Console defaults |
| Hosting | ❌ Not configured | No Firebase Hosting config (using Vercel instead) |
| Functions | ❌ Not configured | No Cloud Functions deployment |

### 6.3 Vite Build (`vite.config.js`)

| Check | Result | Details |
|-------|--------|---------|
| Console dropping | ✅ Good | `drop_console: true` in non-android builds |
| Sourcemaps | ⚠️ Warning | Sourcemaps are disabled only in `android` mode — production web builds may include sourcemaps |
| Code splitting | ✅ Good | Manual chunks for react, firebase, UI vendors |
| PWA workbox security | ✅ Good | `ignoreURLParametersMatching: [/^token/, /^secret/, /^auth/]` prevents cache poisoning via URL params |
| Minification | ⚠️ Partial | `mangle: false` (to avoid Windows Defender false positives) — slightly larger bundle but not a security issue |

---

## 7. Additional Security Observations

### 7.1 Potential XSS Vectors
- Invoice data (customer names, product descriptions) is rendered in the UI — ensure proper escaping
- Public invoice links render user-provided content — could be an XSS vector if not sanitized

### 7.2 Audit Logging
- `logAudit()` writes to IndexedDB locally and queues for Firebase sync — good pattern
- However, admin actions are only logged client-side — a sophisticated attacker could clear logs
- No server-side immutable audit trail exists

### 7.3 Demo Mode Sandbox
- Demo mode uses localStorage keys prefixed with `billqyro_demo_*`
- The `isDemoModeActive()` check reads from localStorage — can be bypassed
- Demo data can be cleared via `localStorage.removeItem()` calls

### 7.4 Supabase Dependency
- `@supabase/supabase-js` is in `package.json` but not observed in the audited files
- If Supabase is used elsewhere, its security configuration should be audited separately

---

## 8. Security Score

| Category | Score | Weight | Contribution |
|----------|-------|--------|-------------|
| Firestore Rules | 75/100 | 20% | 15.0 |
| Storage Rules | 70/100 | 10% | 7.0 |
| Admin Access | **15/100** | 25% | **3.75** |
| Route Protection | 45/100 | 15% | 6.75 |
| Secret Handling | **25/100** | 20% | **5.0** |
| Deployment Config | 65/100 | 10% | 6.5 |

### Overall Security Score: **44 / 100** ⚠️ (Poor)

**Breakdown:** The score is heavily dragged down by critical weaknesses in Admin Access (client-side PIN with hardcoded fallback, localStorage unlock, no server-side admin validation) and Secret Handling (admin PIN and email bundled into client JS bundle). Firestore rules and Storage rules are relatively well-implemented but have gaps.

---

## 9. Recommendations

### 🔴 Critical — Must Fix Immediately

1. **Replace client-side PIN with server-side admin verification**
   - Implement Firebase Custom Auth Claims: assign a custom `admin: true` claim via a Cloud Function or admin SDK
   - Verify claims using `getIdTokenResult()` on the client and enforce them in Firestore rules via `request.auth.token.admin == true`
   - Remove `VITE_ADMIN_PIN` entirely

2. **Stop bundling admin credentials in client code**
   - Move `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PIN` out of `VITE_` env vars (which are client-visible)
   - Use a backend endpoint or Cloud Function to verify admin status
   - Alternatively, use Firebase Custom Auth Claims (see above)

3. **Remove localStorage-based admin unlock**
   - Replace `localStorage.getItem('billqyro_admin_unlocked')` with a server-verified session or `getIdTokenResult().claims` check
   - Never store security-sensitive flags on the client

4. **Implement Firebase App Check**
   - Uncomment the App Check initialization in `firebaseConfig.js`
   - Configure reCAPTCHA Enterprise in Firebase Console
   - This prevents unauthorized callers from using your Firebase resources

5. **Deploy real Cloud Functions**
   - `sendPaymentReceiptEmail`, `verifyTransactionId`, `sendWhatsAppNotification` are all stubs
   - Deploy production functions with actual integration (email API, payment gateway, WhatsApp API)
   - Remove mock returns

### 🟡 High — Fix Soon

6. **Enforce admin via Firestore rules, not client code**
   - Replace hardcoded admin email in `firestore.rules` with a more flexible mechanism (custom claims or an admin document in Firestore)
   - Example: `match /adminUsers/{uid} { allow read: if isAuth(); }` and check `exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid))`

7. **Add Content-Security-Policy header**
   - Add `Content-Security-Policy` to `vercel.json` headers
   - Start with `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`

8. **Add request size limits to Firestore rules**
   - Add `request.resource.size < 1 * 1024 * 1024` (or appropriate limit) to write rules

9. **Add rate limiting protection**
   - While Firestore doesn't natively support rate limiting in rules, consider using Cloud Functions as a write proxy for sensitive collections
   - Alternatively, implement client-side debouncing with server-side verification

10. **Secure business_logos storage**
    - Evaluate whether logos need to be public; if not, require authentication for reads
    - Add per-user folder isolation (`/business_logos/{userId}/{fileName}`)

### 🟢 Medium — Should Address

11. **Add CSP to Vercel headers** — prevents XSS and data injection attacks
12. **Validate file names in Storage rules** — add pattern check like `fileName.matches('.*[^/]+$')`
13. **Remove `window.billqyro_firebaseReady`** — avoid leaking internal state to global scope
14. **Add storage rules to `firebase.json`** — ensure storage rules are deployed with `firebase deploy`
15. **Implement server-side audit logging** — log admin actions to a Firestore collection with immutable (append-only) rules
16. **Remove or secure the demo mode localStorage bypass** — demo mode authentication should require real Firebase Auth
17. **Disable sourcemaps in production** — set `sourcemap: false` in the production build config
18. **Address the unused `isWorkspaceOwner` function** — either implement it or remove it to reduce complexity

### Specific Code-Level Fixes

**`src/pages/admin/AdminPINLogin.jsx` — Line 12:**
```javascript
// BEFORE (CRITICAL):
const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

// AFTER:
// REMOVE THIS FILE ENTIRELY — use Firebase Custom Auth Claims instead
```

**`src/utils/adminAccess.js` — Lines 33-45:**
```javascript
// BEFORE (CRITICAL):
export function isAdminUser(user) {
  // ... client-side email check

// AFTER:
export async function isAdminUser(user) {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.admin === true;
  } catch {
    return false;
  }
}
```

**`firestore.rules` — Line 17:**
```javascript
// BEFORE:
function isAdmin() {
  return isAuth() && request.auth.token.email == 'khairul2052007@gmail.com';
}

// AFTER:
function isAdmin() {
  return isAuth() && request.auth.token.admin == true;
}
```

**`src/App.jsx` — Line 161:**
```javascript
// BEFORE (CRITICAL):
localStorage.getItem('billqyro_admin_unlocked') === 'true'

// AFTER:
// Remove localStorage flag — use getIdTokenResult().claims.admin
```

---

## 10. Conclusion

BillQyro has a **well-architected Firestore rules layer** with proper user isolation and role escalation protection, but its **admin access system is fundamentally broken** from a security standpoint. The reliance on client-side checks (localStorage flags, client-bundled PIN, email string comparison) means that any moderately skilled attacker can gain admin access.

The application must migrate to **Firebase Custom Auth Claims** for server-verified admin privileges and remove all `VITE_ADMIN_*` environment variables that expose secrets to the client bundle. Firebase App Check should be enabled immediately to protect Firebase resources from unauthorized callers.

**Immediate action items (ordered by priority):**
1. Deploy Cloud Functions to handle admin verification via Custom Auth Claims
2. Remove `VITE_ADMIN_PIN` and client-side PIN unlock
3. Enable Firebase App Check
4. Implement server-side admin enforcement in Firestore rules
5. Add Content-Security-Policy to Vercel deployment

---

*Report generated by BillQyro Automated Security Audit — June 22, 2026*
