# BillQyro — Launch Checklist

## Phase 10: Domain & Production Launch Preparation

### Domain Setup
- [x] Domain registered: billqyro.com / billqyro.in / billqyro.site
- [ ] DNS configured with Vercel nameservers
- [ ] Vercel custom domain added
- [ ] SSL/TLS certificate provisioned (auto by Vercel)
- [ ] WWW redirect configured (billqyro.com → www.billqyro.com)
- [ ] CNAME records verified

### Vercel Deployment
- [x] Vercel project linked to GitHub repository
- [x] Production branch set (main/master)
- [x] Build command: `npm run build`
- [x] Output directory: `dist`
- [x] SPA rewrites configured in vercel.json
- [x] Security headers configured (CSP, HSTS, X-Frame-Options)
- [x] Environment variables set in Vercel dashboard
- [ ] Custom domain verified in Vercel

### Environment Variables (Vercel)
- [ ] `VITE_FIREBASE_API_KEY` set
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` set
- [ ] `VITE_FIREBASE_PROJECT_ID` set
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` set
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `VITE_FIREBASE_APP_ID` set
- [ ] `VITE_ADMIN_EMAIL` set (`khairul2052007@gmail.com`)
- [ ] `VITE_ADMIN_PIN` set (change from default `1234`!)
- [ ] `VITE_APPCHECK_RECAPTCHA_KEY` set (when App Check is enabled)
- [ ] `VITE_APPCHECK_DEBUG_TOKEN` set (for development)

### Firebase Console
- [x] Authentication providers enabled (Email/Password, Google)
- [x] Firestore database created
- [x] Firestore rules deployed
- [x] Storage bucket created
- [x] Storage rules deployed
- [ ] Firebase App Check enabled (reCAPTCHA Enterprise)
- [ ] Firebase Cloud Functions deployed (payment verification, email)
- [ ] Firebase Hosting configured (if using Firebase Hosting)
- [ ] Firestore indexes created for common queries

### Analytics & Monitoring
- [ ] Google Analytics 4 property created
- [ ] GA4 measurement ID added to environment
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry or similar)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
- [ ] Console error logging suppression (`drop_console: true` in build)

### Pre-Launch Testing
- [ ] Build passes with 0 errors
- [ ] Landing page loads on desktop
- [ ] Landing page loads on mobile
- [ ] Login/Auth flow works
- [ ] Dashboard loads with data
- [ ] Invoice creation works
- [ ] PDF generation works
- [ ] Live invoice links work
- [ ] Customer management works
- [ ] Settings save and persist
- [ ] Theme switching works (all 25 themes)
- [ ] Dark mode toggle works
- [ ] PWA can be installed
- [ ] Offline mode works
- [ ] All admin pages accessible
- [ ] Payment proof upload works
- [ ] Backup/restore works
- [ ] Sync status shows correctly

### Post-Launch
- [ ] Monitor Vercel deployment logs
- [ ] Check Firebase Console for errors
- [ ] Verify custom domain SSL
- [ ] Test live invoice links on mobile
- [ ] Verify OG meta tags render on social media (Twitter Card Validator, Facebook Debugger)
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Set up Google Search Console property
- [ ] Verify robots.txt is respected
- [ ] Monitor initial user signups
- [ ] Check for any 404 errors
- [ ] Verify all redirects work
