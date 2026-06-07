# BillQyro Security Notes

## 1. Firebase Rules

### Firestore
The `firestore.rules` document establishes the access control policies for BillQyro's database.

- **Private Collections**: Each user has their own private subcollections for `invoices`, `customers`, `products`, `expenses`, `auditLogs`, and `errorLogs`. Access to these is strictly controlled by matching the `userId` document path variable against the authenticated user's `uid` (`request.auth.uid`).
- **Super Administrator**: The application uses a static email check (`khairul2052007@gmail.com`) for Super Admin rights. This bypasses the typical `request.auth.uid` check to allow the admin to read/write all platform data (e.g., `premiumRequests`, `usersList`). *Recommendation for Production: Transition to Firebase Custom Claims for `admin: true` instead of hardcoding the email string.*
- **Role Escalation Protection**: Standard users are blocked from injecting fields like `role`, `isAdmin`, or `plan` when writing to their `/usersList/{userId}` profile.
- **Public Invoices**: `publicInvoices/{token}` is globally readable because it powers the "Live Invoice Links". Unauthenticated users are allowed to `update` these documents specifically so they can attach `paymentProofs` or mark an invoice as `Paid` from the live view.

### Storage
The `storage.rules` secures Cloud Storage buckets used by BillQyro.

- **Payment Proofs**: Uploads are restricted to images (`image/.*`) and capped at 5MB to prevent storage abuse by malicious actors uploading huge files.
- **Business Logos**: Only authenticated users can upload logos to `/business_logos/`, restricted to images and capped at 2MB.

## 2. Sync Engine Hardening

- The sync engine queues offline actions (save, delete).
- Permanent deletes vs. soft deletes are now implemented. The client marks an entity as `isDeleted: true` for soft-delete (Trashing), but does not immediately wipe the record.
- Sync mechanisms contain exponential backoff and retry limits to prevent thrashing the server during weak network connections.

## 3. Recommended Production Steps
1. **Deploy Rules**: You must deploy these rules using the Firebase CLI: `firebase deploy --only firestore,storage`.
2. **Cloud Functions**: The stub for `src/services/cloudFunctions.js` serves as a placeholder. Moving sensitive operations (like sending emails or verifying payments) to true Cloud Functions prevents client-side tampering.
3. **App Check**: Implement Firebase App Check (reCAPTCHA Enterprise or Play Integrity) to ensure requests originate exclusively from the legitimate BillQyro PWA.
4. **Custom Claims**: Transition the `khairul2052007@gmail.com` admin check to Custom Claims for better security management.
