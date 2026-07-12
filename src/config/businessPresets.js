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
    defaultProductLabel: 'Product',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['pcs', 'kg', 'gram', 'litre', 'ml', 'packet', 'box', 'dozen'],
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
    defaultProductLabel: 'Item',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['kg', 'gram', 'litre', 'ml', 'packet', 'pcs', 'dozen', 'box'],
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
    defaultProductLabel: 'Service / Part',
    defaultPortalLabel: 'Client Portal',
    defaultUnits: ['hour', 'project', 'day', 'visit', 'service', 'piece'],
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
    defaultProductLabel: 'Treatment / Med',
    defaultPortalLabel: 'Patient Portal',
    defaultUnits: ['consultation', 'strip', 'bottle', 'injection', 'procedure', 'test'],
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
    defaultProductLabel: 'Class / Fee',
    defaultPortalLabel: 'Student Portal',
    defaultUnits: ['month', 'semester', 'class', 'course', 'year'],
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
    defaultProductLabel: 'Apparel / Stitch',
    defaultPortalLabel: 'Client Portal',
    defaultUnits: ['piece', 'pair', 'meter', 'suit'],
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
    defaultProductLabel: 'Design / Item',
    defaultPortalLabel: 'Client Portal',
    defaultUnits: ['piece', 'design', 'meter', 'saree'],
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
    defaultProductLabel: 'Service',
    defaultPortalLabel: 'Client Portal',
    defaultUnits: ['hour', 'project', 'milestone', 'day', 'retainer'],
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
    defaultProductLabel: 'Food Item',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['plate', 'portion', 'bowl', 'piece', 'glass', 'cup'],
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
    defaultProductLabel: 'Product / Service',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['pcs', 'kg', 'gram', 'litre', 'ml', 'hour', 'project', 'box'],
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
    defaultProductLabel: 'Service',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['hour', 'page', 'service', 'document'],
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
    defaultProductLabel: 'Item',
    defaultPortalLabel: 'Billing Portal',
    defaultUnits: ['pcs', 'kg', 'gram', 'litre', 'ml', 'hour', 'project', 'box'],
    dashboardKpis: ['dailySales', 'totalInvoices', 'topCustomers'],
    quickActions: ['addInvoice']
  },
  {
    id: 'coaching',
    label: 'Coaching Center',
    shortDesc: 'For institutes and coaching',
    iconName: 'BookOpen',
    recommendedModules: ['students', 'fees', 'reports', 'billing'],
    optionalModules: ['attendance', 'dueLedger'],
    hiddenModules: ['products', 'patients', 'prescription', 'appointments', 'measurements', 'designBook', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'customers'],
    defaultCustomerLabel: 'Students',
    defaultInvoiceLabel: 'Monthly Fee',
    defaultProductLabel: 'Course',
    defaultPortalLabel: 'Student Portal',
    defaultUnits: ['month', 'semester', 'course'],
    dashboardKpis: ['totalStudents', 'pendingFees'],
    quickActions: ['addStudent', 'collectFee']
  },
  {
    id: 'tuition',
    label: 'Tuition Teacher',
    shortDesc: 'For private tutors',
    iconName: 'GraduationCap',
    recommendedModules: ['students', 'fees', 'billing'],
    optionalModules: ['attendance'],
    hiddenModules: ['products', 'patients', 'prescription', 'appointments', 'measurements', 'designBook', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'customers'],
    defaultCustomerLabel: 'Students',
    defaultInvoiceLabel: 'Monthly Fee',
    defaultProductLabel: 'Subject',
    defaultPortalLabel: 'Student Portal',
    defaultUnits: ['month', 'class'],
    dashboardKpis: ['totalStudents', 'pendingFees'],
    quickActions: ['addStudent', 'collectFee']
  },
  {
    id: 'clinic',
    label: 'Clinic',
    shortDesc: 'For medical clinics',
    iconName: 'Stethoscope',
    recommendedModules: ['billing', 'patients', 'appointments', 'reports'],
    optionalModules: ['prescription', 'dueLedger'],
    hiddenModules: ['products', 'students', 'measurements', 'designBook', 'fees', 'attendance', 'orders', 'delivery', 'devices', 'serviceJobs', 'clients', 'projects', 'customers'],
    defaultCustomerLabel: 'Patients',
    defaultInvoiceLabel: 'Treatment Bill',
    defaultProductLabel: 'Treatment',
    defaultPortalLabel: 'Patient Portal',
    defaultUnits: ['consultation', 'procedure'],
    dashboardKpis: ['appointmentsToday', 'patientsCount'],
    quickActions: ['addPatient', 'addBill']
  },
  {
    id: 'distributor',
    label: 'Distributor',
    shortDesc: 'For wholesalers and dealers',
    iconName: 'Truck',
    recommendedModules: ['billing', 'customers', 'products', 'dueLedger', 'orders', 'reports'],
    optionalModules: ['expenses', 'delivery'],
    hiddenModules: ['patients', 'students', 'prescription', 'appointments', 'measurements', 'designBook', 'fees', 'attendance', 'devices', 'serviceJobs', 'clients', 'projects'],
    defaultCustomerLabel: 'Dealers',
    defaultInvoiceLabel: 'Supply Bill',
    defaultProductLabel: 'Product',
    defaultPortalLabel: 'Dealer Portal',
    defaultUnits: ['box', 'carton', 'pcs'],
    dashboardKpis: ['dailySales', 'totalInvoices', 'dueAmount'],
    quickActions: ['addInvoice', 'addProduct']
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
  if (t.includes('teacher') || t.includes('tuition') || t.includes('coaching')) return 'Students';
  if (t.includes('tailor') || t.includes('embroidery') || t.includes('designer') || t.includes('fashion')) return 'Customers';
  if (t.includes('service') || t.includes('repair')) return 'Clients';
  if (t.includes('freelance')) return 'Clients';
  if (t.includes('distributor')) return 'Dealers';
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
  if (t.includes('teacher') || t.includes('tuition') || t.includes('coaching')) return 'Monthly Fee';
  if (t.includes('doctor') || t.includes('clinic')) return 'Treatment Bill';
  if (t.includes('tailor') || t.includes('embroidery') || t.includes('designer') || t.includes('fashion')) return 'Invoice';
  if (t.includes('service') || t.includes('repair')) return 'Service Bill';
  if (t.includes('distributor')) return 'Supply Bill';
  if (t.includes('service') || t.includes('repair')) return 'Repair Tickets';
  return 'Bills';
};

/**
 * Returns true if the business type is an education-related business.
 */
export const isEducationBusiness = (type) => {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('teacher') || 
         t.includes('tuition') || 
         t.includes('coaching') || 
         t.includes('school') ||
         t.includes('academy') ||
         t.includes('training center');
};

/**
 * Returns the default product label for a given business type.
 */
export const getProductLabelByType = (type) => {
  const preset = BUSINESS_PRESETS.find(p => p.id === type);
  return preset?.defaultProductLabel || 'Product';
};

/**
 * Returns the default portal label for a given business type.
 */
export const getPortalLabelByType = (type) => {
  const preset = BUSINESS_PRESETS.find(p => p.id === type);
  if (preset && preset.defaultPortalLabel) return preset.defaultPortalLabel;
  const t = type?.toLowerCase() || '';
  if (t.includes('retail') || t.includes('tailor')) return 'Customer Portal';
  if (t.includes('coaching') || t.includes('tuition') || t.includes('teacher')) return 'Student Portal';
  if (t.includes('clinic') || t.includes('doctor')) return 'Patient Portal';
  if (t.includes('service') || t.includes('freelance')) return 'Client Portal';
  if (t.includes('distributor')) return 'Dealer Portal';
  return 'Customer Portal';
};

export const getIconForCustomer = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('clinic') || t.includes('doctor')) return 'Stethoscope';
  if (t.includes('coaching') || t.includes('tuition') || t.includes('teacher')) return 'GraduationCap';
  if (t.includes('tailor')) return 'Scissors';
  if (t.includes('retail') || t.includes('grocery')) return 'ShoppingBag';
  if (t.includes('service') || t.includes('repair')) return 'Wrench';
  if (t.includes('distributor')) return 'Truck';
  if (t.includes('freelance')) return 'Briefcase';
  return 'User';
};

export const getIconForInvoice = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('clinic') || t.includes('doctor')) return 'HeartPulse';
  if (t.includes('coaching') || t.includes('tuition') || t.includes('teacher')) return 'BookOpen';
  if (t.includes('tailor')) return 'Scissors';
  if (t.includes('retail') || t.includes('grocery')) return 'ShoppingCart';
  if (t.includes('service') || t.includes('repair')) return 'Tool';
  if (t.includes('distributor')) return 'Package';
  return 'FileText';
};

/**
 * Returns the default measurement units for a given business type.
 */
export const getUnitsByType = (type) => {
  const preset = BUSINESS_PRESETS.find(p => p.id === type);
  return preset?.defaultUnits || ['pcs', 'kg', 'gram', 'litre', 'hour'];
};

/**
 * Returns the default category wording for a given business type.
 */
export const getCategoryWording = (billType) => {
  switch (billType) {
    case 'grocery': return { items: 'Items', qty: 'Qty', price: 'Unit Price', noteLabel: 'Product Notes & Terms' };
    case 'repair': return { items: 'Services', qty: 'Unit', price: 'Labour + Parts', noteLabel: 'Repair Notes & Terms' };
    case 'retail': return { items: 'Products', qty: 'Qty', price: 'Unit Price', noteLabel: 'Sales Notes & Terms' };
    case 'custom': return { items: 'Services', qty: 'Qty', price: 'Rate', noteLabel: 'Notes & Terms' };
    case 'doctor': return { items: 'Treatments', qty: 'Qty', price: 'Fee', noteLabel: 'Medical Notes' };
    case 'tailor': return { items: 'Garments', qty: 'Qty', price: 'Stitching Charge', noteLabel: 'Tailoring Notes' };
    case 'embroidery': return { items: 'Designs', qty: 'Qty', price: 'Embroidery Rate', noteLabel: 'Embroidery Notes' };
    case 'teacher': return { items: 'Subjects', qty: 'Months', price: 'Fee', noteLabel: 'Tuition Notes' };
    case 'service': return { items: 'Services', qty: 'Qty', price: 'Rate', noteLabel: 'Service Notes & Terms' };
    case 'freelance': return { items: 'Services', qty: 'Hours/Qty', price: 'Rate', noteLabel: 'Project Notes & Terms' };
    case 'restaurant': return { items: 'Food Item', qty: 'Qty', price: 'Price', noteLabel: 'Restaurant Notes' };
    case 'cybercafe': return { items: 'Service/Doc', qty: 'Qty/Pages', price: 'Rate', noteLabel: 'Service Notes' };
    default: return { items: 'Description', qty: 'Qty', price: 'Rate', noteLabel: 'Notes & Terms' };
  }
};
