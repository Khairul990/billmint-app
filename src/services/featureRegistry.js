// Central Feature Registry for BillQyro Enterprise V8

export const FEATURE_CATEGORIES = {
  INVOICE: 'invoice',
  CUSTOMERS: 'customers',
  PRODUCTS_INVENTORY: 'products',
  PAYMENTS: 'payments',
  LIVE_LINK: 'liveLink',
  TREASURY: 'treasury',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  SECURITY: 'security',
  APPEARANCE: 'appearance',
  BACKUP: 'backup',
  ADVANCED: 'advanced',
  OPERATIONS: 'operations'
};

// Default category states
export const DEFAULT_CATEGORY_STATE = {
  [FEATURE_CATEGORIES.INVOICE]: true,
  [FEATURE_CATEGORIES.CUSTOMERS]: true,
  [FEATURE_CATEGORIES.PRODUCTS_INVENTORY]: true,
  [FEATURE_CATEGORIES.PAYMENTS]: true,
  [FEATURE_CATEGORIES.LIVE_LINK]: true,
  [FEATURE_CATEGORIES.TREASURY]: true,
  [FEATURE_CATEGORIES.REPORTS]: true,
  [FEATURE_CATEGORIES.NOTIFICATIONS]: true,
  [FEATURE_CATEGORIES.SECURITY]: true,
  [FEATURE_CATEGORIES.APPEARANCE]: true,
  [FEATURE_CATEGORIES.BACKUP]: true,
  [FEATURE_CATEGORIES.ADVANCED]: true,
  [FEATURE_CATEGORIES.OPERATIONS]: true
};

// Feature Registry Definition
export const FEATURE_REGISTRY = {
  // --- INVOICE FEATURES ---
  'invoice': {
    id: 'invoice',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Invoicing Core',
    description: 'Core invoicing functionality.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'invoice.customColumns': {
    id: 'invoice.customColumns',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Custom Columns',
    description: 'Allow custom columns in invoice items.',
    defaultEnabled: false,
    dependencies: ['invoice'],
    settingsSchema: {
      columns: []
    },
    version: 1
  },
  'invoice.discount': {
    id: 'invoice.discount',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Discounts',
    description: 'Enable line-item or overall discounts.',
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
    name: 'Taxes',
    description: 'Enable tax calculation on invoices.',
    defaultEnabled: true,
    dependencies: ['invoice'],
    settingsSchema: {
      defaultTaxRate: 0,
      taxInclusive: false
    },
    version: 1
  },
  'invoice.paymentStatus': {
    id: 'invoice.paymentStatus',
    category: FEATURE_CATEGORIES.INVOICE,
    name: 'Payment Status Tracking',
    description: 'Track if an invoice is paid, partial, or overdue.',
    defaultEnabled: true,
    dependencies: ['invoice'],
    settingsSchema: {},
    version: 1
  },

  // --- CUSTOMER FEATURES ---
  'customer': {
    id: 'customer',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Management',
    description: 'Manage customers and clients.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'customer.ledger': {
    id: 'customer.ledger',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Ledger',
    description: 'Track individual customer balances and transaction history.',
    defaultEnabled: true,
    dependencies: ['customer'],
    settingsSchema: {},
    version: 1
  },
  'customer.portal': {
    id: 'customer.portal',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Portal',
    description: 'Allow customers to view their invoices online.',
    defaultEnabled: false,
    dependencies: ['customer'],
    settingsSchema: {
      allowPayment: false
    },
    version: 1
  },
  'customer.notifications': {
    id: 'customer.notifications',
    category: FEATURE_CATEGORIES.CUSTOMERS,
    name: 'Customer Notifications',
    description: 'Send automated reminders to customers.',
    defaultEnabled: false,
    dependencies: ['customer'],
    settingsSchema: {
      reminderDays: [3, 7]
    },
    version: 1
  },

  // --- PRODUCT FEATURES ---
  'product': {
    id: 'product',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Product Catalog',
    description: 'Manage products and services.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'product.inventory': {
    id: 'product.inventory',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Inventory Management',
    description: 'Enable advanced inventory features.',
    defaultEnabled: false,
    dependencies: ['product'],
    settingsSchema: {},
    version: 1
  },
  'product.stockTracking': {
    id: 'product.stockTracking',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Stock Tracking',
    description: 'Track stock quantities for items.',
    defaultEnabled: false,
    dependencies: ['product', 'product.inventory'],
    settingsSchema: {},
    version: 1
  },
  'product.lowStockAlert': {
    id: 'product.lowStockAlert',
    category: FEATURE_CATEGORIES.PRODUCTS_INVENTORY,
    name: 'Low Stock Alerts',
    description: 'Notify when stock falls below a threshold.',
    defaultEnabled: false,
    dependencies: ['product', 'product.inventory', 'product.stockTracking'],
    settingsSchema: {
      defaultThreshold: 5
    },
    version: 1
  },

  // --- PAYMENT FEATURES ---
  'payment': {
    id: 'payment',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Payments',
    description: 'Record and track payments.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'payment.partialPayment': {
    id: 'payment.partialPayment',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Partial Payments',
    description: 'Allow partial payments against invoices.',
    defaultEnabled: true,
    dependencies: ['payment'],
    settingsSchema: {},
    version: 1
  },
  'payment.paymentProof': {
    id: 'payment.paymentProof',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Payment Proof',
    description: 'Attach receipts or proof for payments.',
    defaultEnabled: false,
    dependencies: ['payment'],
    settingsSchema: {},
    version: 1
  },
  'payment.approval': {
    id: 'payment.approval',
    category: FEATURE_CATEGORIES.PAYMENTS,
    name: 'Payment Approval',
    description: 'Require admin approval for recorded payments.',
    defaultEnabled: false,
    dependencies: ['payment'],
    settingsSchema: {},
    version: 1
  },

  // --- LIVE LINK FEATURES ---
  'liveLink': {
    id: 'liveLink',
    category: FEATURE_CATEGORIES.LIVE_LINK,
    name: 'Live Link',
    description: 'Shareable live links for documents.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'liveLink.paymentRequest': {
    id: 'liveLink.paymentRequest',
    category: FEATURE_CATEGORIES.LIVE_LINK,
    name: 'Payment Requests',
    description: 'Request payment via live links.',
    defaultEnabled: false,
    dependencies: ['liveLink', 'payment'],
    settingsSchema: {},
    version: 1
  },
  'liveLink.whatsappProof': {
    id: 'liveLink.whatsappProof',
    category: FEATURE_CATEGORIES.LIVE_LINK,
    name: 'WhatsApp Proof',
    description: 'Submit payment proofs via WhatsApp integration.',
    defaultEnabled: false,
    dependencies: ['liveLink', 'liveLink.paymentRequest'],
    settingsSchema: {},
    version: 1
  },
  'liveLink.approvalWorkflow': {
    id: 'liveLink.approvalWorkflow',
    category: FEATURE_CATEGORIES.LIVE_LINK,
    name: 'Approval Workflow',
    description: 'Require approval for payments submitted via live link.',
    defaultEnabled: false,
    dependencies: ['liveLink', 'liveLink.paymentRequest', 'payment.approval'],
    settingsSchema: {},
    version: 1
  },

  // --- TREASURY FEATURES ---
  'treasury': {
    id: 'treasury',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Internal Treasury',
    description: 'Manage internal cashflow and bank accounts.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'treasury.moneyIn': {
    id: 'treasury.moneyIn',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Money In',
    description: 'Track incoming funds.',
    defaultEnabled: true,
    dependencies: ['treasury'],
    settingsSchema: {},
    version: 1
  },
  'treasury.moneyOut': {
    id: 'treasury.moneyOut',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Money Out',
    description: 'Track expenses and outgoing funds.',
    defaultEnabled: true,
    dependencies: ['treasury'],
    settingsSchema: {},
    version: 1
  },
  'treasury.ledger': {
    id: 'treasury.ledger',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Treasury Ledger',
    description: 'Master ledger for treasury accounts.',
    defaultEnabled: true,
    dependencies: ['treasury'],
    settingsSchema: {},
    version: 1
  },

  // --- OPERATIONS FEATURES ---
  'operations.orders': {
    id: 'operations.orders',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Orders',
    description: 'Manage sales and purchase orders.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.appointments': {
    id: 'operations.appointments',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Appointments',
    description: 'Schedule and manage appointments.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.delivery': {
    id: 'operations.delivery',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Delivery Tracking',
    description: 'Track delivery of goods or services.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.measurements': {
    id: 'operations.measurements',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Measurements',
    description: 'Record custom measurements for customers.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.designBook': {
    id: 'operations.designBook',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Design Book',
    description: 'Manage design catalogs and lookbooks.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.devices': {
    id: 'operations.devices',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Device Management',
    description: 'Track devices or assets.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.serviceJobs': {
    id: 'operations.serviceJobs',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Service Jobs',
    description: 'Manage repair or service tickets.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },
  'operations.projects': {
    id: 'operations.projects',
    category: FEATURE_CATEGORIES.OPERATIONS,
    name: 'Projects',
    description: 'Manage long-term projects and tasks.',
    defaultEnabled: false,
    dependencies: [],
    settingsSchema: {},
    version: 1
  },

  // --- INTERNAL BANK / TREASURY FEATURES ---
  'bank': {
    id: 'bank',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Internal Bank',
    description: 'Track money in, money out, balance and a running ledger.',
    defaultEnabled: true,
    dependencies: [],
    settingsSchema: {
      autoPostPayments: true,
      allowNegativeBalance: false
    },
    version: 1
  },
  'bank.credit': {
    id: 'bank.credit',
    category: FEATURE_CATEGORIES.TREASURY,
    name: 'Customer Credit',
    description: 'Manage per-customer credit limits and outstanding liability.',
    defaultEnabled: true,
    dependencies: ['bank', 'customer'],
    settingsSchema: {},
    version: 1
  }
};
