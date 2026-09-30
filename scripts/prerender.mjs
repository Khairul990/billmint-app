import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const landingRootHtml = `
<header class="max-w-6xl mx-auto px-5 py-5 flex justify-between items-center">
  <div class="text-2xl font-bold text-slate-900">BillQyro</div>
  <nav class="flex gap-4">
    <a href="/about" class="text-slate-600 hover:text-emerald-600 no-underline">About</a>
    <a href="/support" class="text-slate-600 hover:text-emerald-600 no-underline">Support</a>
    <a href="/terms" class="text-slate-600 hover:text-emerald-600 no-underline">Terms</a>
    <a href="/privacy" class="text-slate-600 hover:text-emerald-600 no-underline">Privacy</a>
  </nav>
</header>
<main class="max-w-6xl mx-auto px-5 py-10">
  <section class="text-center py-10">
    <h1 class="text-4xl font-extrabold text-slate-900 leading-tight">BillQyro — Smart Billing. Premium Invoices.</h1>
    <p class="text-lg text-slate-600 max-w-3xl mx-auto my-4">
      BillQyro is a free, offline-first invoicing and billing platform for small businesses in India and Bangladesh. Create professional PDF invoices, track customer balances, collect UPI payments, and manage your business from anywhere. বাংলা ও ইংরেজি — ফ্রি ইনভয়েস তৈরি করুন মিনিটেই।
    </p>
    <div class="flex gap-4 justify-center mt-6">
      <a href="/#login" class="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold no-underline shadow-lg">Create Free Account</a>
      <a href="https://billqyro.com/downloads/BillQyro-Android.apk" class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold no-underline">Download Android App</a>
    </div>
  </section>

  <section class="my-10">
    <h2 class="text-2xl font-bold text-slate-900 mb-5">Key Features</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">PDF Invoice Generation</h3>
        <p class="text-slate-500 mt-2">Instant A4 & A5 PDF invoice generation with custom business branding and logo.</p>
      </div>
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">Customer Ledger & Balance Tracking</h3>
        <p class="text-slate-500 mt-2">Automatic calculation of old dues, current invoice balance, and lifetime customer ledgers.</p>
      </div>
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">UPI Payment Collection</h3>
        <p class="text-slate-500 mt-2">Dynamic UPI QR code generation on invoices for instant customer payment collection.</p>
      </div>
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">Inventory & Product Catalog</h3>
        <p class="text-slate-500 mt-2">Track stock levels, low-stock alerts, product categories, and pricing presets.</p>
      </div>
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">Expense & Profit Reports</h3>
        <p class="text-slate-500 mt-2">Log operational expenses and generate net profit and loss financial statements.</p>
      </div>
      <div class="border border-slate-200 p-5 rounded-2xl">
        <h3 class="font-semibold text-lg">WhatsApp Reminders & Bengali Voice Billing</h3>
        <p class="text-slate-500 mt-2">Send automated payment reminders on WhatsApp and use Bengali voice commands to create bills.</p>
      </div>
    </div>
  </section>

  <section class="my-10">
    <h2 class="text-2xl font-bold text-slate-900 mb-5">Transparent Pricing</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="border border-slate-300 p-6 rounded-2xl text-center">
        <h3 class="text-xl font-bold">Starter</h3>
        <p class="text-3xl font-extrabold my-3">₹0 <span class="text-sm font-normal text-slate-500">/ free forever</span></p>
        <p class="text-slate-600">50 invoices, 25 customers, basic templates, offline mode</p>
      </div>
      <div class="border-2 border-emerald-500 p-6 rounded-2xl text-center">
        <h3 class="text-xl font-bold">Pro</h3>
        <p class="text-3xl font-extrabold my-3">₹499 <span class="text-sm font-normal text-slate-500">/ month</span></p>
        <p class="text-slate-600">500 invoices, 200 customers, premium themes, priority support</p>
      </div>
      <div class="border border-slate-300 p-6 rounded-2xl text-center">
        <h3 class="text-xl font-bold">Lifetime</h3>
        <p class="text-3xl font-extrabold my-3">₹14,999 <span class="text-sm font-normal text-slate-500">/ one-time</span></p>
        <p class="text-slate-600">Unlimited everything, lifetime updates, custom branding</p>
      </div>
    </div>
  </section>

  <section class="my-10">
    <h2 class="text-2xl font-bold text-slate-900 mb-5">Frequently Asked Questions</h2>
    <div class="flex flex-col gap-4">
      <div class="border border-slate-200 p-4 rounded-xl">
        <h3 class="font-semibold text-slate-900">How does BillQyro operate offline?</h3>
        <p class="text-slate-600 mt-1">BillQyro uses an IndexedDB local-first architecture. You can generate invoices, look up customer balances, and create estimates without internet. Changes sync with Firebase when you reconnect.</p>
      </div>
      <div class="border border-slate-200 p-4 rounded-xl">
        <h3 class="font-semibold text-slate-900">Is multi-workspace data isolated securely?</h3>
        <p class="text-slate-600 mt-1">Yes. Every workspace operates in a strictly segregated sandbox. Invoices, customers, bank transactions, and reports are partitioned by workspace ID with server-side security rules.</p>
      </div>
      <div class="border border-slate-200 p-4 rounded-xl">
        <h3 class="font-semibold text-slate-900">Can customers view and pay invoices without creating an account?</h3>
        <p class="text-slate-600 mt-1">Yes. Each invoice comes with a secure Live Link. Customers can open it in any browser to view line items, scan payment QR codes, and upload transaction proof.</p>
      </div>
    </div>
  </section>

  <section class="my-10 text-center">
    <h2 class="text-2xl font-bold text-slate-900">Supported Business Types</h2>
    <p class="text-slate-600 mt-2">Retail shops, tailoring units, medical clinics, electronics repair, coaching centers, cyber cafes, and service agencies.</p>
  </section>
</main>
<footer class="border-t border-slate-200 py-8 max-w-6xl mx-auto my-10 text-center text-slate-500 text-sm">
  <p>© ${new Date().getFullYear()} BillQyro Technologies. All rights reserved.</p>
  <p class="mt-2">
    <a href="/support" class="text-slate-600 mx-2">Help Center</a> |
    <a href="/about" class="text-slate-600 mx-2">About Us</a> |
    <a href="/terms" class="text-slate-600 mx-2">Terms</a> |
    <a href="/privacy" class="text-slate-600 mx-2">Privacy</a> |
    <a href="/refund" class="text-slate-600 mx-2">Refund Policy</a> |
    <a href="/data-deletion" class="text-slate-600 mx-2">Data Deletion</a>
  </p>
</footer>
`.trim();

const publicPages = [
  {
    route: 'about',
    breadcrumbName: 'About Us',
    title: 'About BillQyro - Smart Billing & Invoices',
    description: 'BillQyro provides offline-first billing, invoicing, and customer management software for small businesses in India and Bangladesh.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>About BillQyro</h1><p>BillQyro is created by BillQyro Technologies to empower small business owners with offline-first billing, UPI payments, and automated customer ledger management.</p><p><a href="/">Return to Home</a></p></main>`
  },
  {
    route: 'support',
    breadcrumbName: 'Help Center',
    title: 'BillQyro Help Center & Customer Support',
    description: 'Get support for BillQyro invoicing app. Contact support@billqyro.com or WhatsApp +91 94777 38769.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>BillQyro Help Center</h1><p>Need help with invoicing, UPI payments, or backup sync? Email us at support@billqyro.com or WhatsApp +91 94777 38769.</p><p><a href="/">Return to Home</a></p></main>`
  },
  {
    route: 'terms',
    breadcrumbName: 'Terms of Service',
    title: 'Terms of Service - BillQyro',
    description: 'BillQyro Terms of Service. Learn about user rights, privacy, software usage, and account security.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>Terms of Service</h1><p>Read the official terms governing the use of BillQyro web app and mobile application services.</p><p><a href="/">Return to Home</a></p></main>`
  },
  {
    route: 'privacy',
    breadcrumbName: 'Privacy Policy',
    title: 'Privacy Policy - BillQyro',
    description: 'BillQyro Privacy Policy. Read how we protect your customer data, business ledgers, and encryption standards.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>Privacy Policy</h1><p>BillQyro respects your business data privacy. All customer data and invoices remain locally stored or encrypted in sync.</p><p><a href="/">Return to Home</a></p></main>`
  },
  {
    route: 'refund',
    breadcrumbName: 'Refund Policy',
    title: 'Refund Policy - BillQyro',
    description: 'BillQyro Refund Policy for Pro subscription plans and lifetime license upgrades.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>Refund Policy</h1><p>Information on 7-day money-back guarantee for BillQyro Pro and Lifetime subscription plans.</p><p><a href="/">Return to Home</a></p></main>`
  },
  {
    route: 'data-deletion',
    breadcrumbName: 'Data Deletion Policy',
    title: 'Data Deletion Policy - BillQyro',
    description: 'Request complete account and business data deletion from BillQyro servers.',
    html: `<main class="max-w-4xl mx-auto my-10 p-5 font-sans"><h1>Data Deletion Request</h1><p>Users can permanently delete their account and associated workspace data at any time from workspace settings or by emailing support@billqyro.com.</p><p><a href="/">Return to Home</a></p></main>`
  }
];

function prerender() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html not found!');
    process.exit(1);
  }

  const rawIndexContent = fs.readFileSync(indexPath, 'utf8');
  const rootTargetRegex = /<div id="root">[\s\S]*?<\/div>/;

  // 1. Generate sub-route prerender HTML files FIRST with BreadcrumbList JSON-LD schema
  for (const page of publicPages) {
    const pageDir = path.join(distDir, page.route);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    const breadcrumbSchema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://billqyro.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": page.breadcrumbName,
          "item": `https://billqyro.com/${page.route}`
        }
      ]
    });

    const breadcrumbScriptTag = `\n    <!-- JSON-LD Structured Data: BreadcrumbList -->\n    <script type="application/ld+json">\n    ${breadcrumbSchema}\n    </script>\n  </head>`;

    let pageHtml = rawIndexContent
      .replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`)
      .replace(/<link rel="canonical" href=".*?"\s*\/?>/i, `<link rel="canonical" href="https://billqyro.com/${page.route}">`)
      .replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="https://billqyro.com/${page.route}">`)
      .replace(/<\/head>/i, breadcrumbScriptTag)
      .replace(rootTargetRegex, `<div id="root">${page.html}</div>`);

    fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf8');
    console.log(`Successfully pre-rendered dist/${page.route}/index.html with BreadcrumbList schema`);
  }

  // dist/index.html remains the pristine SPA shell with React root
  console.log('Static routes pre-rendered successfully without polluting root index.html');
}

prerender();
