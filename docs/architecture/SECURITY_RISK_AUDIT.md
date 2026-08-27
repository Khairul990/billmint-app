# BillQyro Security Risk Audit

## Scope
Audit of Firestore authorization paths with emphasis on invoice, payment-proof, admin, and user/workspace boundaries.

## Critical finding fixed in this change
`payment_proofs` previously allowed an authenticated owner to update an existing proof. That could permit client-side manipulation of proof state after creation. Updates are now restricted to `superAdmin` users; creation remains available to the authenticated owner or to an unauthenticated public-invoice submission with pending status.

## Existing protections observed
- Private invoice/customer/product collections are scoped by authenticated `userId`.
- `usersList` blocks normal-user changes to role, admin, plan, permissions, subscription, and business identity fields.
- Subscription writes are admin-only.
- Public invoice customer updates are restricted to payment-proof/status/update timestamp fields, with payment status constrained to `Pending Verification`.

## Remaining verification required
- Validate the deployed Firestore rules in Firebase Emulator/production before merge.
- Verify every payment write path uses the canonical payment engine and cannot forge paid amounts.
- Verify workspace-level isolation where records contain both `userId` and `workspaceId`.
- Verify storage rules for payment proofs and uploaded documents.
- Verify owner/admin authorization is backed by Firebase custom claims rather than frontend flags.
- Add automated negative authorization tests for cross-user reads/writes and financial-field tampering.

## Merge gate
Do not merge this security change until Firestore rules validation, full test suite, lint, and production build pass.
