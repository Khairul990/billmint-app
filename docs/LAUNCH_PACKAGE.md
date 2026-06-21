# Launch Package Checklists

## Privacy Policy Checklist
- [ ] Cover: data collected (email, invoices, payment proofs), storage (Firebase, localStorage), sharing (none except payment), user rights (deletion, export), cookies/analytics
- [ ] Add link in app footer and login screen
- [ ] Data deletion endpoint / admin panel user wipe
- [ ] Firebase Rules enforce user isolation
- [ ] GDPR consent checkbox on signup

## Terms of Service Checklist
- [ ] Acceptable use policy (no fraudulent invoicing)
- [ ] Payment terms: ₹5/bill pay-per-bill, ₹999/year premium
- [ ] Refund policy
- [ ] Limitation of liability
- [ ] Account suspension grounds
- [ ] User retains ownership of their invoice data
- [ ] Grace period and lock enforcement provisions

## Support Checklist
- [ ] Verify SupportCenter.jsx is functional
- [ ] User-facing "Contact Support" page writing to supportTickets
- [ ] support@billqyro.com email alias monitored
- [ ] In-app FAQ covering: upgrade, limits, payment proof
- [ ] Admin notification for new support tickets

## Release Checklist
- [ ] Production Firebase project with indexes
- [ ] Vercel env vars configured
- [ ] Firebase Rules deployed (firebase deploy --only firestore,storage)
- [ ] Remove console.log that leaks user data (review adminAccess.js)
- [ ] Externalize hardcoded admin email to env-only
- [ ] Test full payment flow: Free > exceed limit > lock > submit proof > approve > unlock
- [ ] Test offline behavior (localStorage fallback)
- [ ] Verify AppHealthCenter removed or made functional
- [ ] Add robots.txt (disallow admin panel)
- [ ] npm run build — fix all warnings
- [ ] robots.txt: Disallow /km-admin, /admin

## Launch Checklist
- [ ] Verify Landing page has CTA linking to app
- [ ] Custom domain configured (app.billqyro.com)
- [ ] UPI ID khairul2052007@okaxis verified active
- [ ] Monitoring setup (UptimeRobot / BetterStack)
- [ ] Daily Firestore backups enabled
- [ ] CHANGELOG.md prepared
- [ ] Test at 320px width (smallest mobile)
- [ ] Firestore indexes pre-warmed for common queries
