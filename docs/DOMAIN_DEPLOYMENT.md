# Domain Preparation & Deployment Checklist

## Current Setup
- Hosting: Vercel (vercel.json configured)
- Build: Vite + React SPA
- Domain Target: billqyro.com

## DNS Configuration

```
Type: A     Name: @    Value: 76.76.21.21 (Vercel IP)
Type: CNAME Name: www  Value: billqyro.com
Type: CNAME Name: app  Value: billqyro.com
Optional: CNAME Name: i Value: billqyro.com (short links)
```

## Vercel Configuration

Current vercel.json needs security headers added:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

## SSL
- Vercel provides automatic SSL via Let's Encrypt
- Enable "HTTPS Only" in Vercel project settings

## Environment Variables (Vercel Production)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_ADMIN_EMAIL

## Deployment Steps

### Pre-deployment
- [ ] Fix .gitignore (DONE - .env entry fixed)
- [ ] Deploy Firebase rules: `firebase deploy --only firestore,storage`
- [ ] Run `npm run build` (verify no errors)
- [ ] Run `npm run lint` (fix warnings)
- [ ] Test with `npm run preview`

### Domain Setup
- [ ] Purchase billqyro.com (if not already)
- [ ] Add domain in Vercel Dashboard > Domains
- [ ] Configure DNS at registrar
- [ ] Wait for propagation (up to 48h)
- [ ] Verify SSL certificate

### Production Config
- [ ] Add env vars in Vercel Dashboard
- [ ] Ensure Firebase project is on Blaze plan
- [ ] Enable Firebase App Check

### Deployment
- [ ] Connect GitHub repo to Vercel
- [ ] Deploy: `vercel --prod`
- [ ] Verify at https://billqyro.com

### Post-deployment
- [ ] Test auth flow (signup/login/logout)
- [ ] Test public invoice link
- [ ] Test PDF generation
- [ ] Test payment proof upload
- [ ] Run Lighthouse audit
- [ ] Verify mobile responsiveness
- [ ] Enable daily Firestore backups
