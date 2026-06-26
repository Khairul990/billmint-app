export const ALL_MODULES = [
  { id: 'billing', name: 'Invoicing & Billing', desc: 'Create, send, and manage invoices' },
  { id: 'customers', name: 'Customers (CRM)', desc: 'Manage client details and history' },
  { id: 'products', name: 'Products & Inventory', desc: 'Track stock and item details' },
  { id: 'dueLedger', name: 'Due Ledger', desc: 'Track pending balances and ledgers' },
  { id: 'expenses', name: 'Expenses Tracking', desc: 'Log and monitor business overheads' },
  { id: 'reports', name: 'Reports & Analytics', desc: 'View financial insights and summaries' },
  { id: 'patients', name: 'Patient Records', desc: 'Manage health records and history' },
  { id: 'students', name: 'Student Directory', desc: 'Manage student enrollments and details' },
  { id: 'prescription', name: 'E-Prescriptions', desc: 'Digital prescription management' },
  { id: 'appointments', name: 'Appointments', desc: 'Schedule and manage bookings' },
  { id: 'measurements', name: 'Measurements', desc: 'Client measurement tracking' },
  { id: 'designBook', name: 'Design Book', desc: 'Manage design references and styles' },
  { id: 'fees', name: 'Fee Collection', desc: 'Track student tuition fees' },
  { id: 'attendance', name: 'Attendance', desc: 'Track daily attendance' },
  { id: 'orders', name: 'Order Management', desc: 'Track custom orders and delivery' },
  { id: 'delivery', name: 'Delivery Tracking', desc: 'Monitor dispatch and delivery status' },
  { id: 'paymentProofs', name: 'Payment Proofs', desc: 'Verify customer payment screenshots' },
  { id: 'devices', name: 'Device Management', desc: 'Track items submitted for repair' },
  { id: 'serviceJobs', name: 'Service Jobs', desc: 'Manage active repair tasks' },
  { id: 'clients', name: 'Client Roster', desc: 'Manage agency client relationships' },
  { id: 'projects', name: 'Projects', desc: 'Track project milestones and billing' },
  { id: 'payments', name: 'Payment Tracking', desc: 'Monitor incoming payments' }
];

export const BUSINESS_PRESETS = [
  {
    id: 'retail',
    label: 'Retail Shop',
    shortDesc: 'For stores, boutiques, and retail',
    iconName: 'ShoppingBag',
    recommendedModules: ['billing', 'customers', 'products', 'dueLedger', 'reports'],
    optionalModules: ['expenses', 'paymentProofs'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'payments'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Invoice',
    dashboardKpis: ['dailySales', 'totalInvoices', 'dueAmount', 'productsCount'],
    quickActions: ['addInvoice', 'addProduct', 'addCustomer']
  },
  {
    id: 'grocery',
    label: 'Grocery / General Store',
    shortDesc: 'For FMCG and daily needs',
    iconName: 'Store',
    recommendedModules: ['billing', 'customers', 'products', 'dueLedger', 'reports'],
    optionalModules: ['expenses', 'paymentProofs'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'payments'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Bill',
    dashboardKpis: ['dailySales', 'totalInvoices', 'dueAmount', 'productsCount'],
    quickActions: ['addInvoice', 'addProduct', 'addCustomer']
  },
  {
    id: 'service',
    label: 'Service & Repair',
    shortDesc: 'For mechanics, plumbers, and technicians',
    iconName: 'Wrench',
    recommendedModules: ['customers', 'devices', 'serviceJobs', 'delivery', 'billing', 'dueLedger', 'reports'],
    optionalModules: ['products', 'expenses', 'paymentProofs'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'clients', 'projects'],
    defaultCustomerLabel: 'Clients',
    defaultInvoiceLabel: 'Service Invoice',
    dashboardKpis: ['activeJobs', 'completedJobs', 'dueAmount', 'dailySales'],
    quickActions: ['addJob', 'addInvoice', 'addClient']
  },
  {
    id: 'doctor',
    label: 'Doctor / Clinic',
    shortDesc: 'For clinics, hospitals, and pharmacies',
    iconName: 'Stethoscope',
    recommendedModules: ['billing', 'customers', 'patients', 'appointments', 'reports'],
    optionalModules: ['prescription', 'dueLedger', 'expenses'],
    hiddenModules: ['products', 'students', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'paymentProofs'],
    defaultCustomerLabel: 'Patients',
    defaultInvoiceLabel: 'Bill',
    dashboardKpis: ['appointmentsToday', 'patientsCount', 'dailyRevenue', 'dueAmount'],
    quickActions: ['addPatient', 'addAppointment', 'addBill']
  },
  {
    id: 'teacher',
    label: 'Teacher / Tuition / Coaching',
    shortDesc: 'For coaching centers and tutors',
    iconName: 'GraduationCap',
    recommendedModules: ['students', 'fees', 'reports', 'billing'],
    optionalModules: ['attendance', 'dueLedger', 'expenses'],
    hiddenModules: ['products', 'patients', 'prescription', 'appointments', 'measurements', 'designBook', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'customers', 'paymentProofs'],
    defaultCustomerLabel: 'Students',
    defaultInvoiceLabel: 'Fee Receipt',
    dashboardKpis: ['totalStudents', 'pendingFees', 'collectedFees', 'attendanceToday'],
    quickActions: ['addStudent', 'collectFee', 'markAttendance']
  },
  {
    id: 'tailor',
    label: 'Tailor / Fashion',
    shortDesc: 'For tailors and fashion designers',
    iconName: 'Scissors',
    recommendedModules: ['customers', 'orders', 'measurements', 'delivery', 'dueLedger', 'billing', 'reports'],
    optionalModules: ['products', 'expenses', 'paymentProofs'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'designBook', 'fees', 'attendance', 'devices', 'serviceJobs', 'clients', 'projects'],
    defaultCustomerLabel: 'Clients',
    defaultInvoiceLabel: 'Invoice',
    dashboardKpis: ['pendingOrders', 'completedOrders', 'dueAmount', 'dailySales'],
    quickActions: ['addOrder', 'addMeasurement', 'addCustomer']
  },
  {
    id: 'embroidery',
    label: 'Embroidery / Designer',
    shortDesc: 'For embroidery and textile design',
    iconName: 'Palette',
    recommendedModules: ['customers', 'orders', 'designBook', 'delivery', 'dueLedger', 'billing', 'reports'],
    optionalModules: ['expenses', 'paymentProofs'],
    hiddenModules: ['products', 'patients', 'students', 'prescription', 'appointments', 'measurements', 'fees', 'attendance', 'devices', 'serviceJobs', 'clients', 'projects'],
    defaultCustomerLabel: 'Clients',
    defaultInvoiceLabel: 'Invoice',
    dashboardKpis: ['activeDesigns', 'pendingOrders', 'dueAmount', 'dailySales'],
    quickActions: ['addDesign', 'addOrder', 'addCustomer']
  },
  {
    id: 'freelance',
    label: 'Freelancer / Agency',
    shortDesc: 'For consultants and digital agencies',
    iconName: 'Briefcase',
    recommendedModules: ['clients', 'projects', 'billing', 'payments', 'reports'],
    optionalModules: ['dueLedger', 'expenses'],
    hiddenModules: ['products', 'patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'customers', 'paymentProofs'],
    defaultCustomerLabel: 'Clients',
    defaultInvoiceLabel: 'Invoice',
    dashboardKpis: ['activeProjects', 'unpaidInvoices', 'totalRevenue', 'clientsCount'],
    quickActions: ['addProject', 'addInvoice', 'addClient']
  },
  {
    id: 'restaurant',
    label: 'Restaurant / Food',
    shortDesc: 'For cafes, restaurants, and food stalls',
    iconName: 'Coffee',
    recommendedModules: ['billing', 'products', 'reports'],
    optionalModules: ['customers', 'expenses', 'paymentProofs', 'dueLedger'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Receipt',
    dashboardKpis: ['dailySales', 'totalOrders', 'topItems', 'expenses'],
    quickActions: ['addOrder', 'addExpense', 'viewReports']
  },
  {
    id: 'custom',
    label: 'Custom Business',
    shortDesc: 'Configure your own modules',
    iconName: 'Settings',
    recommendedModules: ['billing', 'customers', 'reports'],
    optionalModules: ['products', 'dueLedger', 'expenses', 'paymentProofs', 'orders', 'delivery'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'devices', 'serviceJobs', 'clients', 'projects'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Invoice',
    dashboardKpis: ['dailySales', 'totalInvoices', 'dueAmount', 'productsCount'],
    quickActions: ['addInvoice', 'addCustomer', 'viewReports']
  },
  {
    id: 'cybercafe',
    label: 'Cyber Cafe / CSC',
    shortDesc: 'For digital service centers',
    iconName: 'Monitor',
    recommendedModules: ['reports'],
    optionalModules: [],
    hiddenModules: ['billing', 'customers', 'products', 'dueLedger', 'expenses', 'patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'payments', 'paymentProofs'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Bill',
    dashboardKpis: [],
    quickActions: []
  },
  {
    id: 'billing_only',
    label: 'Billing Only',
    shortDesc: 'Simple mode: Just create bills',
    iconName: 'FileText',
    recommendedModules: ['billing', 'customers', 'reports'],
    optionalModules: [],
    hiddenModules: ['products', 'dueLedger', 'expenses', 'paymentProofs', 'patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'payments'],
    defaultCustomerLabel: 'Customers',
    defaultInvoiceLabel: 'Bill',
    dashboardKpis: ['dailySales', 'totalInvoices', 'topCustomers'],
    quickActions: ['addInvoice']
  }
];

/**
 * Returns the customer/client label for a given business type.
 * Falls back to a manual mapping when the type doesn't match a preset exactly.
 */
export const getCustomerLabelByType = (type) => {
  if (!type) return 'Customers';
  const preset = BUSINESS_PRESETS.find(p => p.id === type);
  if (preset) return preset.defaultCustomerLabel;
  const t = type.toLowerCase();
  if (t.includes('doctor') || t.includes('clinic')) return 'Patients';
  if (t.includes('teacher') || t.includes('tuition')) return 'Students';
  if (t.includes('tailor') || t.includes('embroidery') || t.includes('designer') || t.includes('fashion')) return 'Clients';
  if (t.includes('service') || t.includes('repair')) return 'Device Owners';
  if (t.includes('freelance')) return 'Clients';
  return 'Customers';
};

/**
 * Returns the invoice/bill label for a given business type.
 */
export const getInvoiceLabelByType = (type) => {
  if (!type) return 'Bills';
  const preset = BUSINESS_PRESETS.find(p => p.id === type);
  if (preset && preset.defaultInvoiceLabel) {
    if (type === 'teacher') return 'Fee Slips';
    if (type === 'doctor') return 'Consultation Bills';
    if (type === 'tailor' || type === 'embroidery') return 'Order Slips';
    if (type === 'service' || type === 'repair') return 'Repair Tickets';
    return preset.defaultInvoiceLabel;
  }
  const t = type.toLowerCase();
  if (t.includes('teacher') || t.includes('tuition') || t.includes('coaching')) return 'Fee Slips';
  if (t.includes('doctor') || t.includes('clinic')) return 'Consultation Bills';
  if (t.includes('tailor') || t.includes('embroidery') || t.includes('designer') || t.includes('fashion')) return 'Order Slips';
  if (t.includes('service') || t.includes('repair')) return 'Repair Tickets';
  return 'Bills';
};
