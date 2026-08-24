export const categories = [
  { id: 'getting-started', name: 'Getting Started', nameBn: 'শুরু করা', icon: 'Rocket', color: 'indigo', description: 'Business profile, workspace configuration & your first setup', universal: true },
  { id: 'invoices', name: 'Creating Invoices', nameBn: 'ইনভয়েস তৈরি', icon: 'FileText', color: 'blue', description: 'Invoicing calculations, taxes, discounts, previous dues & PDF exports', featureId: 'invoice' },
  { id: 'customers', name: 'Managing Customers', nameBn: 'কাস্টমার ব্যবস্থাপনা', icon: 'Users', color: 'green', description: 'CRM directory, customer profiles & balance ledger', featureId: 'customer' },
  { id: 'products', name: 'Products & Inventory', nameBn: 'পণ্য যোগ', icon: 'Package', color: 'purple', description: 'Stock tracking, pricing, and service catalog', featureId: 'product' },
  { id: 'payment', name: 'Payment & Collection', nameBn: 'পেমেন্ট ও আদায়', icon: 'DollarSign', color: 'orange', description: 'Payment logging, partial dues, receipts & due tracking', featureId: 'payment' },
  { id: 'reports', name: 'Reports & Analytics', nameBn: 'রিপোর্ট ও বিশ্লেষণ', icon: 'BarChart3', color: 'teal', description: 'Sales metrics, profit & loss, cash flow and top clients', featureId: 'reports' },
  { id: 'workspaces', name: 'Workspaces & Isolation', nameBn: 'ওয়ার্কস্পেস', icon: 'Building2', color: 'cyan', description: 'Multi-business management, scoped data & staff roles', universal: true },
  { id: 'settings', name: 'Settings & Customization', nameBn: 'সেটিংস', icon: 'Settings', color: 'gray', description: 'Settings Studio 2.0, branding, printers & module toggles', universal: true },
  { id: 'themes', name: 'Theme Engine', nameBn: 'থিম', icon: 'Palette', color: 'pink', description: '15+ semantic fintech themes, high-contrast dark & light modes', universal: true },
  { id: 'backup', name: 'Backup & Security', nameBn: 'ব্যাকআপ ও নিরাপত্তা', icon: 'Shield', color: 'red', description: 'IndexedDB offline storage, cloud sync & JSON export/import', universal: true },
  { id: 'live-payment', name: 'Live Payment Links', nameBn: 'লাইভ পেমেন্ট লিংক', icon: 'Link', color: 'cyan', premium: true, description: 'Public portal links, QR codes & customer payment proofs', featureId: 'liveLink' },
];

export const learningRoadmap = [
  {
    level: '01',
    levelTitle: 'LEVEL 01 — GET STARTED',
    subtitle: 'Master initial setup, customer directory, and first billing creation.',
    steps: [
      { id: 'lr-1', num: '01', title: 'Business Setup', desc: 'Add company logo, tax IDs, and default currency.', tab: 'settings', universal: true, time: '2 min' },
      { id: 'lr-2', num: '02', title: 'Add Customers', desc: 'Create client directory with contacts and addresses.', tab: 'customers', featureId: 'customer', time: '1 min' },
      { id: 'lr-3', num: '03', title: 'Create First Invoice', desc: 'Add line items, taxes, discounts, and save PDF.', tab: 'create-invoice', featureId: 'invoice', time: '3 min' },
    ]
  },
  {
    level: '02',
    levelTitle: 'LEVEL 02 — GET PAID',
    subtitle: 'Record transactions, monitor customer credit, and share links.',
    steps: [
      { id: 'lr-4', num: '04', title: 'Record Payments', desc: 'Log cash, bank, or UPI collections on invoices.', tab: 'invoices', featureId: 'payment', time: '2 min' },
      { id: 'lr-5', num: '05', title: 'Track Customer Dues', desc: 'Inspect overdue aging buckets in balance ledger.', tab: 'due-ledger', featureId: 'treasury', time: '2 min' },
      { id: 'lr-6', num: '06', title: 'Share Live Invoices', desc: 'Send interactive web links with WhatsApp sharing.', tab: 'invoices', featureId: 'liveLink', time: '2 min' },
    ]
  },
  {
    level: '03',
    levelTitle: 'LEVEL 03 — RUN YOUR BUSINESS',
    subtitle: 'Control operational expenses, collections, and financial analytics.',
    steps: [
      { id: 'lr-7', num: '07', title: 'Manage Expenses', desc: 'Categorize business spending and vendor payments.', tab: 'expenses', featureId: 'treasury.moneyOut', time: '2 min' },
      { id: 'lr-8', num: '08', title: 'Treasury & Bank', desc: 'Track cash on hand, bank balances, and reconciliations.', tab: 'bank', featureId: 'treasury', time: '2 min' },
      { id: 'lr-9', num: '09', title: 'Reports & Analytics', desc: 'Inspect P&L margins, tax totals, and sales trends.', tab: 'reports', featureId: 'reports', time: '3 min' },
    ]
  },
  {
    level: '04',
    levelTitle: 'LEVEL 04 — ADVANCED',
    subtitle: 'Multi-workspace sandboxing, custom themes, and encrypted backups.',
    steps: [
      { id: 'lr-10', num: '10', title: 'Workspaces Isolation', desc: 'Partition multiple businesses under one account.', tab: 'settings', universal: true, time: '2 min' },
      { id: 'lr-11', num: '11', title: 'Themes & Aesthetics', desc: 'Customize contrast with 15+ semantic palettes.', tab: 'settings', universal: true, time: '1 min' },
      { id: 'lr-12', num: '12', title: 'Backup & Security', desc: 'Export encrypted JSON backups for offline safety.', tab: 'settings', universal: true, time: '2 min' },
      { id: 'lr-13', num: '13', title: 'Staff Roles & Access', desc: 'Manage role-based ledger access and permissions.', tab: 'staff-ledger', featureId: 'staff.ledger', time: '2 min' },
    ]
  }
];

export const visualWorkflows = [
  {
    id: 'vw-invoice',
    title: 'Create Your First Invoice',
    tag: 'Core Invoicing',
    featureId: 'invoice',
    tab: 'create-invoice',
    description: 'Build professional bills with automatic line item math, previous customer dues, and high-res PDF generation.',
    steps: ['01 Select customer profile', '02 Add line items & price', '03 Review taxes & totals', '04 Save invoice', '05 Download or Share'],
    preview: {
      client: 'Acme Corporation',
      item: 'Premium Design Service (x2)',
      total: '₹14,500',
      status: 'Ready'
    }
  },
  {
    id: 'vw-payment',
    title: 'Payment & Collection',
    tag: 'Treasury & Ledger',
    featureId: 'payment',
    tab: 'invoices',
    description: 'Record full or partial collections across cash, UPI, bank, or card with immediate ledger synchronization.',
    steps: ['01 Locate invoice in ledger', '02 Click Record Payment', '03 Enter collected amount', '04 Select payment mode', '05 Balance updates live'],
    preview: {
      collected: '₹10,000 via UPI',
      remaining: '₹4,500 Outstanding',
      badge: 'Partially Paid'
    }
  },
  {
    id: 'vw-customers',
    title: 'Customer Ledger & CRM',
    tag: 'Client Intelligence',
    featureId: 'customer',
    tab: 'customers',
    description: 'Track client purchase histories, total billed amounts, credit limits, and aging overdue invoices.',
    steps: ['01 Open Customers directory', '02 Search client profile', '03 View transaction ledger', '04 Download statement', '05 Send due reminder'],
    preview: {
      client: 'Rajesh Textiles',
      billed: '₹48,000 Billed',
      due: '₹6,000 Due',
      badge: 'Active Customer'
    }
  },
  {
    id: 'vw-reports',
    title: 'Reports & Business Analytics',
    tag: 'Executive Insights',
    featureId: 'reports',
    tab: 'reports',
    description: 'Monitor real-time revenue curves, collection percentages, net profit margins, and top paying accounts.',
    steps: ['01 Open Reports & Analytics', '02 Select date range', '03 Inspect Sales summary', '04 Review Profit & Loss', '05 Export spreadsheet'],
    preview: {
      revenue: '₹1,24,000 Revenue',
      margin: '78.4% Margin',
      collection: '92% Collected'
    }
  }
];

export const coreCapabilities = [
  {
    id: 'cap-create',
    action: 'CREATE',
    title: 'Instant Professional Invoices',
    desc: 'Create, customize, and export high-resolution bills and POS slips in seconds.',
    icon: 'FileText',
    featureId: 'invoice',
    tab: 'create-invoice'
  },
  {
    id: 'cap-collect',
    action: 'COLLECT',
    title: 'Track Payments & Collections',
    desc: 'Log cash, UPI, and bank receipts with automated due ledger reconciliation.',
    icon: 'DollarSign',
    featureId: 'payment',
    tab: 'invoices'
  },
  {
    id: 'cap-manage',
    action: 'MANAGE',
    title: 'Customer Directory & CRM',
    desc: 'Keep complete customer transaction ledgers and contact books organized.',
    icon: 'Users',
    featureId: 'customer',
    tab: 'customers'
  },
  {
    id: 'cap-share',
    action: 'SHARE',
    title: 'Live Portal Links & WhatsApp',
    desc: 'Send interactive web invoice links and one-tap WhatsApp payment reminders.',
    icon: 'Share2',
    featureId: 'liveLink',
    tab: 'invoices'
  },
  {
    id: 'cap-analyze',
    action: 'ANALYZE',
    title: 'Real-Time Financial Reports',
    desc: 'Gain deep visibility into sales volume, profit margins, and tax summaries.',
    icon: 'BarChart3',
    featureId: 'reports',
    tab: 'reports'
  },
  {
    id: 'cap-protect',
    action: 'PROTECT',
    title: 'Workspace Isolation & Backup',
    desc: 'Offline-first IndexedDB persistence with multi-business security boundaries.',
    icon: 'Shield',
    universal: true,
    tab: 'settings'
  }
];

export const productTourSteps = [
  {
    step: 1,
    title: 'Dashboard & Workspace Overview',
    subtitle: 'Your Central Financial Command Center',
    desc: 'The Dashboard gives you a live bird’s-eye view of your sales revenue, pending customer dues, recent transactions, and quick action shortcuts.',
    tab: 'dashboard',
    highlightLabel: 'Metric Cards & Revenue Summary'
  },
  {
    step: 2,
    title: 'Creating an Invoice',
    subtitle: 'Fast, Error-Free Billing Engine',
    desc: 'Click "+ Create Invoice" from anywhere. Select your customer, add products or custom services, apply taxes or discounts, and preview in real time.',
    tab: 'create-invoice',
    highlightLabel: '+ Create Invoice Button'
  },
  {
    step: 3,
    title: 'Customer Directory & Dues',
    subtitle: 'Complete CRM & Credit Ledger',
    desc: 'Manage your client directory with individual ledger accounts. BillQyro automatically carries over previous unpaid dues to new invoices.',
    tab: 'customers',
    highlightLabel: 'Customer Profiles & Balance Badges'
  },
  {
    step: 4,
    title: 'Recording Payments',
    subtitle: 'Instant Ledger Synchronization',
    desc: 'Log cash, bank, or UPI payments with one click. Invoices automatically update to Paid or Partially Paid without manual calculations.',
    tab: 'invoices',
    highlightLabel: 'Record Payment Action'
  },
  {
    step: 5,
    title: 'Live Links & WhatsApp Sharing',
    subtitle: 'Modern Digital Customer Portal',
    desc: 'Share tokenized live payment links with clients so they can view line items and upload payment proofs from any mobile device.',
    tab: 'invoices',
    highlightLabel: 'Live Link & WhatsApp Share'
  },
  {
    step: 6,
    title: 'Executive Reports & Analytics',
    subtitle: 'Comprehensive Financial Intelligence',
    desc: 'Inspect total revenue, collection rates, net profit margins, and product sales distributions with exportable spreadsheets.',
    tab: 'reports',
    highlightLabel: 'Sales & Profit Margin Analytics'
  }
];

export const quickStartSteps = [
  {
    step: '01',
    title: 'Set up your business',
    description: 'Add your business name, logo, contact details, currency, and billing preferences in Settings.',
    duration: '~2 min',
    tab: 'settings',
    icon: 'Building',
    universal: true
  },
  {
    step: '02',
    title: 'Add your clients',
    description: 'Register customer profiles or import contacts with phone numbers and billing addresses.',
    duration: '~1 min',
    tab: 'customers',
    icon: 'Users',
    featureId: 'customer'
  },
  {
    step: '03',
    title: 'Create your first invoice',
    description: 'Add line items, calculate taxes/discounts, and review previous customer balance automatically.',
    duration: '~2 min',
    tab: 'create-invoice',
    icon: 'FileText',
    featureId: 'invoice'
  },
  {
    step: '04',
    title: 'Record a payment',
    description: 'Log full or partial payments across cash, UPI, bank, or card with immediate ledger updates.',
    duration: '~1 min',
    tab: 'invoices',
    icon: 'CreditCard',
    featureId: 'payment'
  },
  {
    step: '05',
    title: 'Share the invoice',
    description: 'Generate high-res PDFs, download PNG receipts, or send interactive Live Invoice links via WhatsApp.',
    duration: '~1 min',
    tab: 'invoices',
    icon: 'Share2',
    featureId: 'liveLink'
  },
  {
    step: '06',
    title: 'Track your collections',
    description: 'Monitor due amounts, overdue aging buckets, and customer payment histories in Collections.',
    duration: '~2 min',
    tab: 'due-ledger',
    icon: 'BookOpen',
    featureId: 'treasury'
  },
  {
    step: '07',
    title: 'Review reports',
    description: 'Inspect total revenue, collection rates, net margins, and exportable financial summaries.',
    duration: '~2 min',
    tab: 'reports',
    icon: 'BarChart3',
    featureId: 'reports'
  }
];

export const troubleshootingItems = [
  {
    id: 'pdf-download-issue',
    problem: 'Invoice PDF not downloading or blank',
    cause: 'Browser pop-up blockers or high-resolution canvas memory limit on older mobile browsers.',
    solution: 'Ensure pop-ups are allowed for BillQyro. You can also click "Download PNG" or "Print" directly from the Invoice Preview modal.',
    category: 'Billing',
    tag: 'PDF Studio',
    featureId: 'invoice'
  },
  {
    id: 'payment-not-appearing',
    problem: 'Payment recorded but invoice balance is unchanged',
    cause: 'Browser tab was in background during offline queue flush or transaction concurrency lock.',
    solution: 'Click the Cloud Sync status indicator in the header to trigger a manual sweep, or pull-to-refresh the Invoices page to reconcile state.',
    category: 'Finance',
    tag: 'Payments',
    featureId: 'payment'
  },
  {
    id: 'customer-balance-discrepancy',
    problem: 'Customer balance due does not match previous invoices',
    cause: 'A deleted invoice had unlinked payment records or custom opening balance was modified.',
    solution: 'Open Customers > Customer Ledger. The ledger recalculates strictly from active non-deleted invoices: Balance = Opening Due + Invoices - Payments.',
    category: 'CRM',
    tag: 'Ledger',
    featureId: 'treasury'
  },
  {
    id: 'cloud-sync-delayed',
    problem: 'Changes on mobile are not immediately showing on desktop',
    cause: 'IndexedDB background worker is waiting for a stable network connection or Firebase authentication token refresh.',
    solution: 'Verify you are logged into the exact same workspace ID on both devices. Click "Sync Now" in the workspace switcher.',
    category: 'System',
    tag: 'Cloud Sync',
    universal: true
  },
  {
    id: 'theme-not-saving',
    problem: 'Theme reverts back to default after page refresh',
    cause: 'Browser localStorage is restricted or third-party cookies/storage are disabled.',
    solution: 'Enable local storage permissions in your browser settings. BillQyro persists active theme tokens in scoped workspace cache.',
    category: 'Appearance',
    tag: 'Theme Engine',
    universal: true
  },
  {
    id: 'whatsapp-link-error',
    problem: 'WhatsApp reminder link opens blank or incomplete',
    cause: 'Customer phone number is missing country code (+91, +880, +1, etc.) or contains punctuation.',
    solution: 'Edit the customer profile to include the standard international calling code without hyphens or spaces.',
    category: 'Communication',
    tag: 'WhatsApp',
    featureId: 'payment'
  }
];

export const featureExplorer = [
  {
    id: 'feat-billing',
    title: 'Financial Ledger & Invoices',
    what: 'Complete order slips, multi-tax calculations, custom line discounts, and automated balance tracking.',
    why: 'Prevents calculation errors and guarantees that invoices, receipts, and customer dues remain 100% mathematically synchronized.',
    how: 'Navigate to Invoices and click "+ New Invoice". Choose your client, add items, and export instantly.',
    featureId: 'invoice'
  },
  {
    id: 'feat-ledger',
    title: 'Customer Ledger & Collections',
    what: 'Double-entry style balance history tracking every billed item, partial payment, and aging overdue amount.',
    why: 'Provides full transparent dispute resolution and clear credit history for every customer.',
    how: 'Go to Customers > click "Ledger" on any client card to view full transaction ledger and statement.',
    featureId: 'treasury'
  },
  {
    id: 'feat-livelink',
    title: 'Live Invoice Links & Client Portal',
    what: 'Secure, tokenized digital invoice web pages where clients can view their bills and upload payment receipts.',
    why: 'Faster payment collection without needing to email static PDF attachments back and forth.',
    how: 'Click "More" on any invoice > "Copy Portal Link", and send it directly to your customer.',
    featureId: 'liveLink'
  },
  {
    id: 'feat-workspaces',
    title: 'Multi-Workspace Isolation',
    what: 'Complete logical partitioning for multiple businesses, retail branches, or service organizations under one account.',
    why: 'Zero data cross-contamination between different stores, clinics, institutes, or enterprise units.',
    how: 'Click the workspace selector in the top-left sidebar header to switch or create workspaces.',
    universal: true
  },
  {
    id: 'feat-themes',
    title: '15+ Semantic Fintech Themes',
    what: 'High-contrast dark modes, executive slate, emerald wealth, royal violet, and luxury fintech palettes.',
    why: 'Optimal readability under diverse lighting conditions with 100% WCAG-compliant contrast tokens.',
    how: 'Go to Settings > Appearance & Theme or click the theme switcher in the navigation bar.',
    universal: true
  },
  {
    id: 'feat-offline',
    title: 'Offline-First & Auto Cloud Sync',
    what: 'Full IndexedDB local database persistence that functions seamlessly without an active internet connection.',
    why: 'Guarantees that cashiers and managers can create invoices during network outages with zero downtime.',
    how: 'Use BillQyro normally. When your device reconnects, transactions are safely flushed to cloud storage.',
    universal: true
  }
];

export const guides = [
  {
    id: 'create-first-invoice',
    category: 'invoices',
    title: 'কীভাবে প্রথম ইনভয়েস তৈরি করবেন',
    titleEn: 'How to Create Your First Invoice',
    difficulty: 'beginner',
    duration: '2 mins',
    icon: 'FileText',
    featureId: 'invoice',
    steps: [
      {
        title: 'Dashboard থেকে শুরু করুন',
        titleEn: 'Start from Dashboard',
        description: 'Dashboard এ গিয়ে "+ NEW BILL" বাটনে ক্লিক করুন',
        descriptionEn: 'Go to Dashboard or Invoices and click "+ New Invoice" button',
        image: '/guides/step1.png',
      },
      {
        title: 'কাস্টমার নির্বাচন করুন',
        titleEn: 'Select Customer',
        description: 'বিদ্যমান কাস্টমার সিলেক্ট করুন অথবা নতুন যোগ করুন',
        descriptionEn: 'Select existing customer or type a new customer name',
        image: '/guides/step2.png',
      },
      {
        title: 'পণ্য/সেবা যোগ করুন',
        titleEn: 'Add Products/Services',
        description: 'আইটেম লিস্টে পণ্য যোগ করুন এবং দাম নির্ধারণ করুন',
        descriptionEn: 'Add items to the bill, set quantities, unit prices, taxes and discounts',
        image: '/guides/step3.png',
      },
      {
        title: 'ইনভয়েস সেভ করুন',
        titleEn: 'Save and Export Invoice',
        description: 'প্রিভিউ দেখে ইনভয়েস সেভ করুন এবং PDF ডাউনলোড করুন',
        descriptionEn: 'Preview the final bill, save, download PDF or share via WhatsApp',
        image: '/guides/step4.png',
      },
    ],
    videoUrl: null,
    relatedGuides: ['add-customer', 'add-product', 'track-payments'],
  },
  {
    id: 'add-customer',
    category: 'customers',
    title: 'কীভাবে কাস্টমার যোগ করবেন',
    titleEn: 'How to Add a Customer',
    difficulty: 'beginner',
    duration: '1 min',
    icon: 'UserPlus',
    featureId: 'customer',
    steps: [
      {
        title: 'Customers পেজে যান',
        titleEn: 'Go to Customers Page',
        description: 'সাইডবার থেকে "Customers" ক্লিক করুন',
        descriptionEn: 'Click "Customers" from the sidebar navigation',
      },
      {
        title: '"+ Add Customer" ক্লিক করুন',
        titleEn: 'Click "+ Add Customer"',
        description: 'নাম, ফোন নম্বর, ঠিকানা পূরণ করুন',
        descriptionEn: 'Fill in client name, phone number, email and billing address',
      },
      {
        title: 'সেভ করুন',
        titleEn: 'Save Profile',
        description: '"Save Customer" বাটনে ক্লিক করুন',
        descriptionEn: 'Click "Save" to register the customer profile instantly',
      },
    ],
    relatedGuides: ['create-first-invoice', 'track-payments'],
  },
  {
    id: 'track-payments',
    category: 'payment',
    title: 'পেমেন্ট স্ট্যাটাস কীভাবে ট্র্যাক করবেন',
    titleEn: 'How to Record Payments and Dues',
    difficulty: 'beginner',
    duration: '2 mins',
    icon: 'DollarSign',
    featureId: 'payment',
    steps: [
      {
        title: 'Invoices এ যান',
        titleEn: 'Open Invoices or Collections',
        description: 'আপনার সব তৈরি করা ইনভয়েস লিস্ট দেখুন',
        descriptionEn: 'Navigate to Invoices and find the relevant invoice',
      },
      {
        title: 'পেমেন্ট রেকর্ড করুন',
        titleEn: 'Record Payment',
        description: 'ইনভয়েস কার্ড বা কাস্টমার লেজার থেকে "Record Payment" করুন',
        descriptionEn: 'Click Record Payment, enter the collected amount and payment method',
      },
      {
        title: 'ব্যালান্স চেক করুন',
        titleEn: 'Verify Balance Calculation',
        description: 'Dashboard ও লেজারে অটোমেটিক বাকি টাকা আপডেট হবে',
        descriptionEn: 'The system automatically updates Paid and Balance Due across all screens',
      },
    ],
    relatedGuides: ['create-first-invoice', 'whatsapp-reminders'],
  },
  {
    id: 'change-theme',
    category: 'themes',
    title: 'কীভাবে থিম পরিবর্তন করবেন',
    titleEn: 'How to Customize Application Theme',
    difficulty: 'beginner',
    duration: '1 min',
    icon: 'Palette',
    universal: true,
    steps: [
      {
        title: 'Settings > Appearance এ যান',
        titleEn: 'Go to Settings > Appearance & Theme',
        description: 'সেটিংস পেজে গিয়ে Appearance & Theme ট্যাব ক্লিক করুন',
        descriptionEn: 'Open Settings Studio 2.0 and select Appearance & Theme',
      },
      {
        title: 'পছন্দের থিম সিলেক্ট করুন',
        titleEn: 'Choose from 15+ Themes',
        description: 'ডার্ক বা লাইট মোডের যে কোনো থিম বেছে নিন',
        descriptionEn: 'Click any palette to preview and apply colors across all buttons, cards and charts',
      },
    ],
    relatedGuides: ['business-profile'],
  },
  {
    id: 'live-payment-link',
    category: 'live-payment',
    title: 'লাইভ পেমেন্ট লিংক কীভাবে কাজ করে',
    titleEn: 'How Live Payment Links Work',
    difficulty: 'intermediate',
    duration: '3 mins',
    icon: 'Link',
    featureId: 'liveLink',
    premium: true,
    steps: [
      {
        title: 'ইনভয়েস তৈরি করুন',
        titleEn: 'Create Invoice',
        description: 'স্বাভাবিক নিয়মে ইনভয়েস তৈরি করুন',
        descriptionEn: 'Create and save your invoice as usual',
      },
      {
        title: 'লিংক কপি করুন',
        titleEn: 'Copy Portal Link',
        description: 'ইনভয়েসের More মেনু থেকে "Copy Portal Link" ক্লিক করুন',
        descriptionEn: 'Open the More menu on the invoice card and select "Copy Portal Link"',
      },
      {
        title: 'কাস্টমারকে লিংক পাঠান',
        titleEn: 'Send Link to Customer',
        description: 'WhatsApp/SMS/Email এর মাধ্যমে লিংক শেয়ার করুন',
        descriptionEn: 'Share link via WhatsApp, Email, or direct message',
      },
      {
        title: 'কাস্টমার পেমেন্ট করবে',
        titleEn: 'Customer Verification',
        description: 'কাস্টমার পেমেন্ট করে স্ক্রিনশট ও ট্রানজাকশন আইডি সাবমিট করবে',
        descriptionEn: 'Client opens the portal, pays via UPI/Bank, and uploads payment proof',
      },
      {
        title: 'অ্যাপ্রুভ করুন',
        titleEn: 'Approve Payment Proof',
        description: 'Payments স্ক্রিনে গিয়ে পেমেন্ট ভেরিফাই করে অ্যাপ্রুভ করুন',
        descriptionEn: 'Open Payments > Review payment screenshot and click Approve to settle balance',
      },
    ],
    relatedGuides: ['track-payments', 'whatsapp-reminders'],
  },
  {
    id: 'add-product',
    category: 'products',
    title: 'কীভাবে পণ্য যোগ করবেন',
    titleEn: 'How to Manage Products & Services',
    difficulty: 'beginner',
    duration: '1 min',
    icon: 'Package',
    featureId: 'product',
    steps: [
      {
        title: 'Products পেজে যান',
        titleEn: 'Go to Products Page',
        description: 'সাইডবার থেকে "Products & Services" ক্লিক করুন',
        descriptionEn: 'Click "Products & Services" from the navigation sidebar',
      },
      {
        title: '"+ Add Product" ক্লিক করুন',
        titleEn: 'Click "+ Add Product"',
        description: 'পণ্যর নাম, দাম, ও স্টক পূরণ করুন',
        descriptionEn: 'Enter item name, SKU, sale price, cost price and current stock count',
      },
      {
        title: 'সেভ করুন',
        titleEn: 'Save Item',
        description: '"Save" বাটনে ক্লিক করুন',
        descriptionEn: 'Click "Save" to make the product instantly searchable during invoice creation',
      },
    ],
    relatedGuides: ['create-first-invoice'],
  },
  {
    id: 'business-profile',
    category: 'settings',
    title: 'বিজনেস প্রোফাইল সম্পূর্ণ করুন',
    titleEn: 'Complete Business Profile & Branding',
    difficulty: 'beginner',
    duration: '2 mins',
    icon: 'Building',
    universal: true,
    steps: [
      {
        title: 'Settings এ যান',
        titleEn: 'Open Settings Studio 2.0',
        description: 'সাইডবার থেকে "Settings" এ ক্লিক করুন',
        descriptionEn: 'Navigate to Settings > Business Profile',
      },
      {
        title: 'Business Information দিন',
        titleEn: 'Upload Logo & Details',
        description: 'আপনার বিজনেসের নাম, লোগো, ঠিকানা, ফোন ও ট্যাক্স আইডি দিন',
        descriptionEn: 'Upload your company logo and enter business name, GST/Tax number, email, and address',
      },
      {
        title: 'সেভ করুন',
        titleEn: 'Save Changes',
        description: 'সব তথ্য দিয়ে সেভ করুন। এটি সব ইনভয়েস PDF এ স্বয়ংক্রিয়ভাবে যুক্ত হবে',
        descriptionEn: 'Click Save. Your branding will immediately reflect on all printed bills and public links',
      },
    ],
    relatedGuides: ['create-first-invoice', 'change-theme'],
  },
  {
    id: 'backup-data',
    category: 'backup',
    title: 'কীভাবে ডাটা ব্যাকআপ নিবেন',
    titleEn: 'How to Export and Backup Data',
    difficulty: 'intermediate',
    duration: '2 mins',
    icon: 'Shield',
    universal: true,
    steps: [
      {
        title: 'Settings > Data & Backup যান',
        titleEn: 'Go to Settings > Data & Backup',
        description: 'সেটিংস পেজ থেকে Data & Backup ট্যাবে যান',
        descriptionEn: 'Open Settings Studio and select the Data & Backup tab',
      },
      {
        title: 'Export Database ক্লিক করুন',
        titleEn: 'Export Database (.billqyro)',
        description: 'আপনার সব ডাটা এনক্রিপ্টেড ব্যাকআপ ফাইল হিসেবে ডাউনলোড হবে',
        descriptionEn: 'Click Export Database to download your complete workspace data as a secure JSON backup',
      },
      {
        title: 'Import Database (প্রয়োজন হলে)',
        titleEn: 'Restore Backup',
        description: 'আগের ডাউনলোড করা ফাইল দিয়ে ডাটা যে কোনো ডিভাইসে রিস্টোর করুন',
        descriptionEn: 'Use the Import file selector to restore full state onto any device in seconds',
      },
    ],
    relatedGuides: ['business-profile'],
  },
  {
    id: 'whatsapp-reminders',
    category: 'payment',
    title: 'হোয়াটসঅ্যাপ রিমাইন্ডার পাঠানো',
    titleEn: 'Sending WhatsApp Payment Reminders',
    difficulty: 'beginner',
    duration: '1 min',
    icon: 'MessageCircle',
    featureId: 'payment',
    steps: [
      {
        title: 'Invoice লিস্টে যান',
        titleEn: 'Open Invoices List',
        description: 'যেকোনো Due ইনভয়েস খুঁজুন',
        descriptionEn: 'Locate any invoice with an outstanding balance in the Invoices ledger',
      },
      {
        title: 'More মেনু ওপেন করুন',
        titleEn: 'Open More Menu',
        description: 'ইনভয়েস কার্ডে থাকা More (...) বাটনে ক্লিক করে WhatsApp Share বা Send Due Reminder নির্বাচন করুন',
        descriptionEn: 'Click More (...) and select "Share on WhatsApp" or "Send Due Reminder"',
      },
      {
        title: 'মেসেজ সেন্ড করুন',
        titleEn: 'Send Formatted Reminder',
        description: 'ইনভয়েসের লিংক এবং বকেয়া টাকার হিসাবসহ প্রি-ফরম্যাটেড মেসেজ চলে যাবে',
        descriptionEn: 'WhatsApp opens with a clean, professional payment breakdown ready to send in one tap',
      },
    ],
    relatedGuides: ['track-payments', 'live-payment-link'],
  }
];

export const faqs = [
  {
    question: 'How do I create and send my first invoice in BillQyro?',
    answer: 'Click "+ New Invoice" in the top bar or sidebar. Select an existing client or enter a new customer name, add your bill items with quantities and prices, configure taxes/discounts if needed, and click Save. You can instantly print, download as PDF, or share via WhatsApp.',
    category: 'Invoices',
    featureId: 'invoice'
  },
  {
    question: 'How is the Outstanding Balance / Balance Due calculated?',
    answer: 'BillQyro computes Balance Due strictly via: Balance Due = max(0, Previous Customer Due + Current Invoice Total - Valid Payments). Overpayments and duplicate submissions are safely handled without negative artifacts.',
    category: 'Finance',
    featureId: 'treasury'
  },
  {
    question: 'Can I use BillQyro offline without an internet connection?',
    answer: 'Yes! BillQyro is architected offline-first using browser IndexedDB. You can create invoices, manage customers, and log payments without internet. Once connectivity is restored, your records automatically synchronize with the cloud.',
    category: 'System',
    universal: true
  },
  {
    question: 'How does multi-workspace isolation work?',
    answer: 'Every workspace (e.g. Retail, Healthcare, Tailoring, Cyber Cafe) operates inside an isolated sandbox. Settings, customers, invoices, and reports are completely partitioned to guarantee zero data leakage across different business units.',
    category: 'Workspaces',
    universal: true
  },
  {
    question: 'How do I record partial payments on an invoice?',
    answer: 'Open the invoice in Invoices or Collections, click Record Payment, and enter the partial amount collected. The system automatically marks the invoice as "Partially Paid" and updates the remaining balance in real time.',
    category: 'Payments',
    featureId: 'payment'
  },
  {
    question: 'How do Live Payment Links work for customers?',
    answer: 'Every invoice has a unique, secure public token. When you copy and share the Live Portal Link, your client can open a private interactive view on their phone, review bill line items, and upload UPI/bank payment receipts.',
    category: 'Billing',
    featureId: 'liveLink'
  },
  {
    question: 'How do I change my business logo and currency symbol?',
    answer: 'Open Settings Studio 2.0 > Business Profile. You can upload a company logo, update your business address and GST/Tax ID, and change your currency symbol ($, ₹, ৳, €, £, etc.). All changes immediately apply to all PDF invoices.',
    category: 'Settings',
    universal: true
  },
  {
    question: 'How do I backup and restore my database?',
    answer: 'Go to Settings > Data & Backup, and click "Export Database". Your full dataset downloads as an encrypted .billqyro JSON backup. You can import this file anytime to restore your data on any device.',
    category: 'Security',
    universal: true
  },
  {
    question: 'Can I customize invoice PDF templates?',
    answer: 'Yes! You can choose from multiple PDF layouts (Modern Minimal, Classic Enterprise, Thermal POS, Compact Receipt) in Settings > Invoice & Billing, as well as toggle customer notes, payment instructions, and QR codes.',
    category: 'Modules',
    featureId: 'invoice'
  }
];
