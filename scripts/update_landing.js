const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Landing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. HERO SECTION
content = content.replace(
  /{tr\('Professional invoices, faster collections and full customer dues control — now with voice billing in Bengali. Built for clinics, tuition centres, shops and studios; works even when the network disappears.', 'প্রফেশনাল ইনভয়েস, দ্রুত আদায় আর বকেয়ার পূর্ণ নিয়ন্ত্রণ — এখন বাংলায় ভয়েস বিলিং সহ। ক্লিনিক, টিউশন, দোকান ও স্টুডিওর জন্য তৈরি; নেটওয়ার্ক চলে গেলেও কাজ থামবে না\.'\)}/g,
  `{tr('Offline-first billing and customer management designed specifically for South Asian small businesses. Create professional PDFs, collect dues via UPI/bKash, and track everything without needing constant internet.', 'সাউথ এশিয়ান ছোট ব্যবসার জন্য তৈরি অফলাইন-ফার্স্ট বিলিং ও কাস্টমার ম্যানেজমেন্ট। প্রফেশনাল পিডিএফ বানান, ইউপিআই/বিকাশ দিয়ে টাকা নিন এবং ইন্টারনেট ছাড়াই সব হিসাব রাখুন।')}`
);

// Fix CTA Hierarchy - reduce to 2 buttons, move Android APK down
content = content.replace(
  /<button onClick=\{\(\) => scrollTo\('login'\)\} className="bq26-beam w-full sm:w-auto">\s*<span className="bg-\[var\(--bq26-btn\)\] hover:bg-\[var\(--bq26-btn-hover\)\] text-\[var\(--bq26-btn-text\)\] px-8 py-3\.5 text-base font-bold flex items-center justify-center gap-2 transition-colors">\s*\{tr\('Create Free Account', 'ফ্রি অ্যাকাউন্ট খুলুন'\)\}\s*<ArrowRight className="w-4 h-4" \/>\s*<\/span>\s*<\/button>\s*<button\s*onClick=\{launchLiveDemo\}\s*className="w-full sm:w-auto px-6 py-3\.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-\[rgba\(11,143,120,0\.35\)\] text-\[var\(--bq26-emerald-bright\)\] hover:bg-\[rgba\(11,143,120,0\.1\)\] transition-all"\s*title=\{tr\('Explore the full platform with sample data — no signup required', 'নমুনা ডেটা দিয়ে পুরো প্ল্যাটফর্ম দেখুন — রেজিস্টার লাগবে না'\)\}\s*>\s*<Zap className="w-4 h-4" \/>\s*\{tr\('Try Live Demo', 'লাইভ ডেমো দেখুন'\)\}\s*<\/button>\s*<a\s*href="\/downloads\/BillQyro-Android\.apk"\s*download\s*className="w-full sm:w-auto px-6 py-3\.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-\[rgba\(11,143,120,0\.35\)\] text-\[var\(--bq26-emerald-bright\)\] hover:bg-\[rgba\(11,143,120,0\.1\)\] transition-all"\s*title=\{tr\('Install the BillQyro Android app on your phone', 'BillQyro অ্যান্ড্রয়েড অ্যাপ ফোনে ইনস্টল করুন'\)\}\s*>\s*<Smartphone className="w-4 h-4" \/>\s*\{tr\('Android App \(APK\)', 'অ্যান্ড্রয়েড অ্যাপ \(APK\)'\)\}\s*<\/a>/g,
  `<button onClick={() => scrollTo('login')} className="bq26-beam w-full sm:w-auto">
                <span className="bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 transition-colors">
                  {tr('Create Free Account', 'ফ্রি অ্যাকাউন্ট খুলুন')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                onClick={launchLiveDemo}
                className="w-full sm:w-auto px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-[rgba(11,143,120,0.35)] text-[var(--bq26-emerald-bright)] hover:bg-[rgba(11,143,120,0.1)] transition-all"
                title={tr('Explore the full platform with sample data — no signup required', 'নমুনা ডেটা দিয়ে পুরো প্ল্যাটফর্ম দেখুন — রেজিস্টার লাগবে না')}
              >
                <Zap className="w-4 h-4" />
                {tr('Watch Demo', 'ডেমো দেখুন')}
              </button>`
);

// Trust strip update with APK link
content = content.replace(
  /<span className="flex items-center gap-1\.5"><Check className="w-3\.5 h-3\.5 text-\[var\(--bq26-emerald-bright\)\]" \/> \{tr\('Works offline', 'অফলাইনেও চলে'\)\}<\/span>/g,
  `<span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)]" /> {tr('Works offline', 'অফলাইনেও চলে')}</span>
              <span className="text-[var(--bq26-line-soft)] hidden sm:inline">|</span>
              <a href="/downloads/BillQyro-Android.apk" download className="flex items-center gap-1.5 text-[var(--bq26-emerald-bright)] hover:underline">
                <Smartphone className="w-3.5 h-3.5" /> {tr('Download Android App', 'অ্যান্ড্রয়েড অ্যাপ ডাউনলোড')}
              </a>`
);

fs.writeFileSync(filePath, content);
console.log('Hero section updated successfully.');
