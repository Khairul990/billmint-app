// Central Feature Registry for BillQyro Enterprise V8

export const FEATURE_CATEGORIES = {
  INVOICE: 'invoice',
  CUSTOMERS: 'customers',
  PRODUCTS_INVENTORY: 'products',
  PAYMENTS: 'payments',
  TREASURY: 'treasury',
  REPORTS: 'reports',
  LIVE_LINK: 'liveLink',
  STAFF: 'staff',
  NOTIFICATIONS: 'notifications',
  SECURITY: 'security',
  APPEARANCE: 'appearance',
  BACKUP: 'backup',
  ADVANCED: 'advanced',
  OPERATIONS: 'operations',
  OUTSOURCE: 'outsource'
};

// Default category states for new workspaces
export const DEFAULT_CATEGORY_STATE = {
  [FEATURE_CATEGORIES.INVOICE]: true,
  [FEATURE_CATEGORIES.CUSTOMERS]: true,
  [FEATURE_CATEGORIES.PRODUCTS_INVENTORY]: true,
  [FEATURE_CATEGORIES.PAYMENTS]: true,
  [FEATURE_CATEGORIES.TREASURY]: true,
  [FEATURE_CATEGORIES.REPORTS]: true,
  [FEATURE_CATEGORIES.LIVE_LINK]: true,
  [FEATURE_CATEGORIES.STAFF]: false,
  [FEATURE_CATEGORIES.NOTIFICATIONS]: true,
  [FEATURE_CATEGORIES.SECURITY]: true,
  [FEATURE_CATEGORIES.APPEARANCE]: true,
  [FEATURE_CATEGORIES.BACKUP]: true,
  [FEATURE_CATEGORIES.ADVANCED]: false,
  [FEATURE_CATEGORIES.OPERATIONS]: false,
  [FEATURE_CATEGORIES.OUTSOURCE]: true
};

// Feature Registry Definition
export const FEATURE_REGISTRY = {
  // --- INVOICE CORE (Always required) ---
  'invoice': {
    id: 'invoice',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Invoicing & Billing Core',
    description: 'Create, manage, and print invoices and estimates.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'invoice.estimates': {
    id: 'invoice.estimates',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Estimates & Quotations',
    description: 'Create quotations that convert into invoices.',
    defaultEnabled: true,
    dependencies: ['invoice'],
    settingsSchema: {},
    version: 1
  },
  'invoice.discount': {
    id: 'invoice.discount',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Discounts',
    description: 'Enable line-item or overall discounts on bills.',
    defaultEnabled: true,
    dependencies: ['invoice'],
    settingsSchema: {
      allowLineItemDiscount: true,
      allowGlobalDiscount: true
    },
    version: 1
  },
  'invoice.tax': {
    id: 'invoice.tax',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Taxes & GST/VAT',
    description: 'Calculate item taxes, GST, or VAT on bills.',
    defaultEnabled: true,
    dependencies: ['invoice'],
    settingsSchema: {
      defaultTaxRate: 0,
      taxInclusive: false
    },
    version: 1
  },
  'invoice.customColumns': {
    id: 'invoice.customColumns',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Custom Invoice Columns',
    description: 'Add custom fields and columns to item rows.',
    defaultEnabled: false,
    dependencies: ['invoice'],
    settingsSchema: {
      columns: []
    },
    version: 1
  },

  // --- CUSTOMER FEATURES ---
  'customer': {
    id: 'customer',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customers & CRM',
    description: 'Customer directory, contact profiles, and purchase histories.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'customer.ledger': {
    id: 'customer.ledger',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Ledger',
    description: 'Track individual customer running balances, payments, and dues.',
    defaultEnabled: true,
    dependencies: ['customer'],
    settingsSchema: {},
    version: 1
  },
  'customer.portal': {
    id: 'customer.portal',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Portal',
    description: 'Provide an authenticated online portal for customers.',
    defaultEnabled: false,
    dependencies: ['customer'],
    settingsSchema: {},
    version: 1
  },

  // --- PRODUCT & INVENTORY FEATURES ---
  'product': {
    id: 'product',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Product Catalog',
    description: 'Manage items, services, SKUs, pricing, and units.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'product.inventory': {
    id: 'product.inventory',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Inventory Management',
    description: 'Track in-stock quantities, reorder levels, and adjustments.',
    defaultEnabled: true,
    dependencies: ['product'],
    settingsSchema: {},
    version: 1
  },
  'product.stockTracking': {
    id: 'product.stockTracking',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Stock Tracking & Auto-Deduct',
    description: 'Auto-deduct stock on bill creation and restore on bill deletion.',
    defaultEnabled: true,
    dependencies: ['product', 'product.inventory'],
    settingsSchema: {},
    version: 1
  },
  'product.lowStockAlert': {
    id: 'product.lowStockAlert',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Low Stock Alerts',
    description: 'Show dashboard warnings when inventory falls below minimum threshold.',
    defaultEnabled: false,
    dependencies: ['product', 'product.inventory', 'product.stockTracking'],
    settingsSchema: {
      defaultThreshold: 5
    },
    version: 1
  },

  // --- PAYMENTS ---
  'payment': {
    id: 'payment',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Payment Tracking',
    description: 'Record incoming payments, payment modes, and receipts.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'payment.partialPayment': {
    id: 'payment.partialPayment',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Partial Payments & Installments',
    description: 'Allow partial deposits and balance installments.',
    defaultEnabled: true,
    dependencies: ['payment'],
    settingsSchema: {},
    version: 1
  },
  'payment.paymentProof': {
    id: 'payment.paymentProof',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Payment Proofs & QR',
    description: 'Dynamic UPI / banking QR codes and screenshot verification.',
    defaultEnabled: true,
    dependencies: ['payment'],
    settingsSchema: {},
    version: 1
  },

  // --- TREASURY & EXPENSES ---
  'treasury': {
    id: 'treasury',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Treasury & Bank Ledger',
    description: 'Internal cash register, double-entry bank accounts, and balances.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'treasury.moneyOut': {
    id: 'treasury.moneyOut',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Expenses Tracking',
    description: 'Record business overheads, vendor bills, and operational expenses.',
    defaultEnabled: true,
    dependencies: ['treasury'],
    settingsSchema: {},
    version: 1
  },

  // --- REPORTS & ANALYTICS ---
  'reports': {
    id: 'reports',
    category: FEATURE_CATEGORIES.REPORTS,
    name: 'Reports & Analytics',
    description: 'Financial metrics, revenue trends, customer charts, and CSV exports.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- LIVE LINK ---
  'liveLink': {
    id: 'liveLink',
    category: FEATURE_CATEGORIES.LIVE_LINK,
    name: 'Live Document Link',
    description: 'Instant shareable links for customers with payment verification.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- STAFF & PAYABLES ---
  'staff': {
    id: 'staff',
    category: FEATURE_CATEGORIES.STAFF,
    name: 'Staff & Team Management',
    description: 'Track staff profiles, assigned jobs, commissions, and salaries.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'staff.ledger': {
    id: 'staff.ledger',
    category: FEATURE_CATEGORIES.STAFF,
    name: 'Staff Ledger',
    description: 'Track staff advances, earnings, and payout transactions.',
    defaultEnabled: false,
    dependencies: ['staff'],
    settingsSchema: {},
    version: 1
  },

  // --- NOTIFICATIONS ---
  'notifications': {
    id: 'notifications',
    category: FEATURE_CATEGORIES.NOTIFICATIONS,
    name: 'Automated Reminders',
    description: 'Payment reminders and status updates.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- SECURITY & BACKUP ---
  'security': {
    id: 'security',
    category: FEATURE_CATEGORIES.SECURITY,
    name: 'Security & PIN Lockout',
    description: 'Admin PIN protection, rate limiting, and activity audit trails.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'backup': {
    id: 'backup',
    category: FEATURE_CATEGORIES.BACKUP,
    name: 'Data Backup & Offline Sync',
    description: 'Full JSON backups, IndexedDB local persistence, and cloud sync.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- ADVANCED & OPERATIONS ---
  'advanced': {
    id: 'advanced',
    category: FEATURE_CATEGORIES.ADVANCED,
    name: 'Advanced Studio & Automation',
    description: 'Custom PDF layouts, workflow automations, and role permissions.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations': {
    id: 'operations',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Specialized Industry Portals',
    description: 'Workflows for Tailoring, Cyber Cafe, Clinic, Repair, and Delivery.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- OUTSOURCE & VENDORS ---
  'outsource': {
    id: 'outsource',
    category: FEATURE_CATEGORIES.OUTSOURCE || 'outsource',
    name: 'Outsource & Freelancer Hub',
    description: 'Manage external freelancers, vendors, outsource job costing, advances, and profit margins.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'outsource.vendors': {
    id: 'outsource.vendors',
    category: FEATURE_CATEGORIES.OUTSOURCE || 'outsource',
    name: 'Vendor Directory & 360 Profiles',
    description: 'Vendor contact information, default rates, and lifetime job statistics.',
    defaultEnabled: true,
    dependencies: ['outsource'],
    settingsSchema: {},
    version: 1
  },
  'outsource.jobs': {
    id: 'outsource.jobs',
    category: FEATURE_CATEGORIES.OUTSOURCE || 'outsource',
    name: 'Outsource Job Costing',
    description: 'Assign jobs, agreed costs, milestones, and client invoice linkage.',
    defaultEnabled: true,
    dependencies: ['outsource'],
    settingsSchema: {},
    version: 1
  },
  'outsource.payments': {
    id: 'outsource.payments',
    category: FEATURE_CATEGORIES.OUTSOURCE || 'outsource',
    name: 'Vendor Payouts & Advances',
    description: 'Record partial/final payments and sync directly with Internal Bank.',
    defaultEnabled: true,
    dependencies: ['outsource'],
    settingsSchema: {},
    version: 1
  },
  'outsource.profit': {
    id: 'outsource.profit',
    category: FEATURE_CATEGORIES.OUTSOURCE || 'outsource',
    name: 'Job Profitability & Margin Analysis',
    description: 'Calculate gross profit and margins between client invoice revenue and outsource cost.',
    defaultEnabled: true,
    dependencies: ['outsource'],
    settingsSchema: {},
    version: 1
  }
};

// Quick Business Setup Presets
export const BUSINESS_SETUP_PRESETS = [
  {
    id: 'just_billing',
    name: 'Just Billing',
    description: 'Ultra-clean setup with only invoicing, manual line items, payments, and reports. No products or complex menus.',
    icon: 'FileText',
    badge: 'Simple',
    enabledCategories: ['invoice', 'payments', 'reports', 'backup', 'security'],
    disabledCategories: ['customers', 'products', 'staff', 'treasury', 'liveLink', 'notifications', 'advanced', 'operations'],
    featureOverrides: {
      'invoice': true,
      'invoice.estimates': true,
      'invoice.discount': true,
      'invoice.tax': true,
      'payment': true,
      'payment.partialPayment': true,
      'reports': true,
      'backup': true,
      'security': true,
      'customer': false,
      'customer.ledger': false,
      'product': false,
      'product.inventory': false,
      'product.stockTracking': false,
      'product.lowStockAlert': false,
      'staff': false,
      'staff.ledger': false,
      'treasury': false,
      'treasury.moneyOut': false,
      'liveLink': false,
      'advanced': false,
      'operations': false
    }
  },
  {
    id: 'billing_customers',
    name: 'Billing + Customers',
    description: 'Ideal for freelance, consulting, and service providers who track client balances without inventory.',
    icon: 'Users',
    badge: 'Popular',
    enabledCategories: ['invoice', 'customers', 'payments', 'reports', 'backup', 'security', 'notifications'],
    disabledCategories: ['products', 'staff', 'treasury', 'liveLink', 'advanced', 'operations'],
    featureOverrides: {
      'invoice': true,
      'invoice.estimates': true,
      'customer': true,
      'customer.ledger': true,
      'payment': true,
      'payment.partialPayment': true,
      'payment.paymentProof': true,
      'reports': true,
      'backup': true,
      'security': true,
      'product': false,
      'product.inventory': false,
      'product.stockTracking': false,
      'product.lowStockAlert': false,
      'staff': false,
      'staff.ledger': false,
      'treasury': false,
      'advanced': false,
      'operations': false
    }
  },
  {
    id: 'retail',
    name: 'Retail / Inventory',
    description: 'Full-featured setup for shops, stores, and boutiques with product catalogs, stock tracking, and dues.',
    icon: 'ShoppingBag',
    badge: 'Retail',
    enabledCategories: ['invoice', 'customers', 'products', 'payments', 'treasury', 'reports', 'liveLink', 'backup', 'security', 'notifications'],
    disabledCategories: ['staff', 'advanced', 'operations'],
    featureOverrides: {
      'invoice': true,
      'invoice.estimates': true,
      'customer': true,
      'customer.ledger': true,
      'product': true,
      'product.inventory': true,
      'product.stockTracking': true,
      'product.lowStockAlert': true,
      'payment': true,
      'payment.partialPayment': true,
      'payment.paymentProof': true,
      'treasury': true,
      'treasury.moneyOut': true,
      'reports': true,
      'liveLink': true,
      'backup': true,
      'security': true,
      'staff': false,
      'advanced': false,
      'operations': false
    }
  },
  {
    id: 'service',
    name: 'Service Business',
    description: 'Tailored for repair shops, clinics, salons, tailoring, and agencies with expenses and service workflows.',
    icon: 'Briefcase',
    badge: 'Services',
    enabledCategories: ['invoice', 'customers', 'payments', 'treasury', 'reports', 'operations', 'backup', 'security'],
    disabledCategories: ['products', 'staff', 'advanced'],
    featureOverrides: {
      'invoice': true,
      'invoice.estimates': true,
      'customer': true,
      'customer.ledger': true,
      'payment': true,
      'payment.partialPayment': true,
      'payment.paymentProof': true,
      'treasury': true,
      'treasury.moneyOut': true,
      'reports': true,
      'operations': true,
      'product': false,
      'product.inventory': false,
      'product.stockTracking': false,
      'product.lowStockAlert': false,
      'staff': false,
      'advanced': false
    }
  },
  {
    id: 'custom',
    name: 'Custom Setup',
    description: 'Fully customizable configuration. Hand-pick each module and sub-feature according to your exact needs.',
    icon: 'Sliders',
    badge: 'Expert',
    enabledCategories: [],
    disabledCategories: [],
    featureOverrides: {}
  }
];
