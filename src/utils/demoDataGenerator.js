// demoDataGenerator.js
// Generates rich, realistic, category-aware mock data for the Demo Workspace.
//
// Design goals (phase 22):
//  - Every business category from businessPresets gets a tailored catalog
//    (products/services, price ranges, customer label, expense profile).
//  - Realistic Bengali-Muslim customer names (Md./Mst. prefixes, common
//    surnames) with Howrah/Kolkata localities and plausible +91 phones.
//  - Volume + spread: customers across 18 months, invoices across the last
//    6 months with a realistic paid/partial/unpaid mix and overdue cases,
//    a payments ledger, and a full expenses history.
//  - Sandbox-only: everything lands in billqyro_demo_* keys; real accounts
//    always start clean.

// ─── Name pools (Bengali-Muslim, romanized) ───────────────────────────────
const MALE_FIRST = [
  'Arif', 'Sohel', 'Imran', 'Rafiq', 'Jubayer', 'Sabbir', 'Nayeem', 'Mizanur',
  'Khalilur', 'Saiful', 'Anwar', 'Tariqul', 'Rakib', 'Mehedi', 'Ashraful',
  'Nurul', 'Faisal', 'Habibur', 'Sajid', 'Moinuddin', 'Abdul', 'Rezaul',
  'Jahid', 'Salman', 'Aminur', 'Tohidul', 'Sekendar', 'Babul', 'Liton', 'Rupon'
];
const FEMALE_FIRST = [
  'Fatema', 'Ayesha', 'Rahima', 'Sultana', 'Parvin', 'Khadiza', 'Nazma',
  'Momena', 'Sabina', 'Rabeya', 'Hasina', 'Johra', 'Mafida', 'Amina',
  'Sanjida', 'Tahmina', 'Rima', 'Sultana', 'Nargis', 'Halima', 'Umme', 'Maksuda'
];
const SURNAMES = [
  'Hossain', 'Rahman', 'Islam', 'Ahmed', 'Khan', 'Sheikh', 'Molla', 'Sardar',
  'Biswas', 'Mondal', 'Mallick', 'Laskar', 'Haque', 'Chowdhury', 'Siddiqui',
  'Akhtar', 'Bagwan', 'Pathan', 'Qureshi', 'Dafadar'
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomName = () => {
  const male = Math.random() < 0.58;
  const prefix = male ? (Math.random() < 0.55 ? 'Md. ' : '') : (Math.random() < 0.6 ? 'Mst. ' : '');
  const first = male ? rand(MALE_FIRST) : rand(FEMALE_FIRST);
  return `${prefix}${first} ${rand(SURNAMES)}`;
};

const AREAS = [
  'Dhulagor, Howrah', 'Salkia, Howrah', 'Shibpur, Howrah', 'Bally, Howrah',
  'Makardah, Howrah', 'Bagnan', 'Uluberia', 'Santragachhi', 'Serampore',
  'Metiabruz, Kolkata', 'Behala, Kolkata', 'Garia, Kolkata', 'Tangra, Kolkata',
  'Park Circus, Kolkata', 'Topsia, Kolkata', 'Salt Lake, Kolkata', 'Rajarhat',
  'Maheshtala', 'Budge Budge', 'Panchla'
];
const AREA_HINTS = ['Road', 'Lane', 'Para', 'Bazar Road', 'Station Road', 'Main Road'];

const getRandomPhone = () => `+91 9${randInt(0, 9)}${randInt(10000000, 99999999)}`;
const getRandomArea = () => `${randInt(1, 120)}, ${rand(AREA_HINTS)}, ${rand(AREAS)}`;

const getRandomDate = (daysBack) =>
  new Date(Date.now() - Math.floor(Math.random() * daysBack) * 86400000).toISOString();
const getDateString = (daysBackMax, daysBackMin = 0) =>
  new Date(Date.now() - randInt(daysBackMin, daysBackMax) * 86400000).toISOString().substring(0, 10);

// ─── Category catalogue ────────────────────────────────────────────────────
// Keys mirror businessPresets ids (+ General fallback).
const CATALOGUES = {
  retail: {
    businessName: 'Noor General Store',
    customerPrefix: 'Customer',
    products: [
      ['Parachute Coconut Oil 200ml', 68], ['Aashirvaad Atta 5kg', 245], ['Fortune Sunflower Oil 1L', 142],
      ['Tata Salt 1kg', 28], ['Surf Excel 1kg', 128], ['Colgate Strong Teeth 200g', 92],
      ['Clinic Plus Shampoo 340ml', 215], ['Lipton Green Tea 100g', 185], ['Britannia Good Day 200g', 35],
      ['Amul Butter 500g', 255], ['MDH Garam Masala 100g', 118], ['Dettol Handwash 750ml', 165],
      ['Harpic Toilet Cleaner 1L', 189], ['Vim Dishwash Bar 4x150g', 60], ['Maggi Noodles 12-Pack', 168]
    ],
    expenses: [['Shop Rent (Monthly)', 8000, 'rent'], ['Electricity Bill', 1850, 'utilities'], ['Supplier Purchase (Wholesale)', 22000, 'inventory'], ['Transport / Van Hire', 650, 'transport']]
  },
  grocery: {
    businessName: 'Rahman Grocery & Provisions',
    customerPrefix: 'Customer',
    products: [
      ['Miniket Rice 1kg', 52], ['Sonamukhi Sugar 1kg', 46], ['Masoor Dal 1kg', 88],
      ['Mustard Oil 1L (Loose)', 158], ['Potato 1kg', 24], ['Onion 1kg', 38],
      ['Tomato 1kg', 32], ['Eggs (Dozen)', 84], ['Paneer 200g', 95],
      ['Tea Leaf (CTC) 250g', 78], ['Biscuit Assorted Pack', 20], ['Iodised Salt 1kg', 26]
    ],
    expenses: [['Shop Rent', 6500, 'rent'], ['Cold Storage Charges', 900, 'utilities'], ['Daily Vegetable Purchase', 4200, 'inventory'], ['Helper Salary', 5500, 'salary']]
  },
  service: {
    businessName: 'Smart Care Service Point',
    customerPrefix: 'Customer',
    products: [
      ['Mobile Screen Replacement (Generic)', 1250], ['Battery Replacement', 650],
      ['Software Flashing / OS Install', 350], ['Charging Port Repair', 450],
      ['Water Damage Treatment', 850], ['Laptop RAM Upgrade (8GB)', 1900],
      ['Laptop SSD Install (256GB)', 2300], ['Virus Removal & Tune-up', 400],
      ['Printer Head Cleaning', 550], ['CCTV Camera Installation (per unit)', 1600],
      ['Home Service Visit Charge', 250], ['Data Recovery (per GB)', 120]
    ],
    expenses: [['Shop Rent', 7000, 'rent'], ['Spare Parts Purchase', 8500, 'inventory'], ['Tools & Equipment', 2400, 'equipment'], ['Internet Bill', 599, 'utilities']]
  },
  doctor: {
    businessName: 'Dr. Kabir Health Clinic',
    customerPrefix: 'Patient',
    products: [
      ['General Consultation', 400], ['Specialist Consultation', 700],
      ['Follow-up Visit', 200], ['Blood Test — Basic Panel', 700],
      ['Full Body Checkup', 2400], ['ECG', 500], ['Dressing & Minor Procedure', 350],
      ['Nebulisation Session', 250], ['Vaccination (per dose)', 480], ['Diabetes Panel', 900]
    ],
    expenses: [['Chamber Rent', 12000, 'rent'], ['Receptionist Salary', 8000, 'salary'], ['Medical Supplies', 5400, 'inventory'], ['Electricity', 1600, 'utilities']]
  },
  teacher: {
    businessName: 'Al-Amin Coaching Classes',
    customerPrefix: 'Student',
    products: [
      ['Monthly Tuition — Class VI-VIII', 800], ['Monthly Tuition — Class IX-X', 1200],
      ['Monthly Tuition — Class XI-XII (Science)', 1600], ['Admission Fee', 500],
      ['Exam Fee (Half-Yearly)', 300], ['Study Material Set', 450],
      ['Crash Course — Madhyamik', 3500], ['Crash Course — HS Physics', 4000], ['Library Fee (Monthly)', 150]
    ],
    expenses: [['Room Rent (Tuition)', 5500, 'rent'], ['Whiteboard & Stationery', 800, 'equipment'], ['Printed Notes', 1600, 'inventory'], ['Electricity', 900, 'utilities']]
  },
  tuition: {
    businessName: 'Rahima Begum Tuition Point',
    customerPrefix: 'Student',
    products: [
      ['Monthly Tuition — Class I-V', 500], ['Monthly Tuition — Class VI-VIII', 700],
      ['Monthly Tuition — Class IX-X', 1000], ['Admission Fee', 300],
      ['Test Paper Set', 120], ['Special Math Batch (Monthly)', 900]
    ],
    expenses: [['Room Rent', 3500, 'rent'], ['Stationery', 500, 'equipment'], ['Printed Sheets', 700, 'inventory']]
  },
  coaching: {
    businessName: 'Bright Future Coaching Centre',
    customerPrefix: 'Student',
    products: [
      ['Monthly Fee — Foundation (IX-X)', 1300], ['Monthly Fee — Target (XI-XII)', 1800],
      ['Admission & Registration', 800], ['Test Series (Monthly)', 400],
      ['Doubt-Clearing Batch', 600], ['Study Material (Physics)', 550], ['Study Material (Math)', 550]
    ],
    expenses: [['Centre Rent', 9000, 'rent'], ['Teacher Honorarium', 12000, 'salary'], ['Furniture EMI', 2200, 'equipment'], ['Electricity', 1400, 'utilities']]
  },
  tailor: {
    businessName: 'Nur Tailors & Fashion',
    customerPrefix: 'Customer',
    products: [
      ['Blouse Stitching', 450], ['Salwar Kameez Set', 750],
      ['Kurti Stitching', 550], ['Pant Stitching', 350],
      ['Shirt Stitching', 400], ['Frock (Kids)', 500],
      ['Alteraion — Blouse', 120], ['Alteration — Pants', 100],
      ['Churidar Stitching', 400], ['Three-Piece Set', 950], ['Designer Blouse', 850]
    ],
    expenses: [['Shop Rent', 5000, 'rent'], ['Thread, Needles & Notions', 800, 'inventory'], ['Machine Servicing', 600, 'equipment'], ['Helper Salary', 4500, 'salary']]
  },
  embroidery: {
    businessName: 'Zari & Zardozi Embroidery House',
    customerPrefix: 'Customer',
    products: [
      ['Hand Embroidery — Blouse', 1200], ['Zardozi Work — Per Motif', 450],
      ['Machine Embroidery — Per Design', 300], ['Bridal Dupatta Embroidery', 4500],
      ['Lehenga Border Work', 3200], ['Kasida Work — Per Meter', 550],
      ['Patch Work — Per Piece', 220], ['Stone & Sequence Work', 800]
    ],
    expenses: [['Workshop Rent', 6500, 'rent'], ['Zari Thread & Materials', 4800, 'inventory'], ['Karigar Salary', 14000, 'salary'], ['Electricity', 1300, 'utilities']]
  },
  freelance: {
    businessName: 'Sk Digital Studio',
    customerPrefix: 'Client',
    products: [
      ['Logo Design (Basic)', 2500], ['Logo Design (Premium + Brand Guide)', 6000],
      ['Business Card Design', 800], ['Social Media Post (per design)', 350],
      ['Monthly Social Media Management', 8000], ['Website Landing Page', 7500],
      ['Product Photography (per 10)', 2000], ['Video Editing (per minute)', 900],
      ['Printing & Delivery (A4 Flyer x100)', 1200]
    ],
    expenses: [['Software Subscriptions', 1400, 'utilities'], ['Co-working Space', 3500, 'rent'], ['Equipment Upgrade', 6500, 'equipment'], ['Internet Bill', 799, 'utilities']]
  },
  restaurant: {
    businessName: 'Kolkata Biryani House',
    customerPrefix: 'Customer',
    products: [
      ['Chicken Biryani (Full)', 220], ['Mutton Biryani (Full)', 340],
      ['Egg Biryani (Full)', 160], ['Chicken Chaap', 180],
      ['Mughlai Paratha', 120], ['Beef Rezala (Full)', 300],
      ['Fish Fry (Bhetki)', 190], ['Falooda', 130],
      ['Cold Coffee', 110], ['Soft Drinks', 40], ['Home Delivery Charge', 40]
    ],
    expenses: [['Restaurant Rent', 18000, 'rent'], ['Raw Materials (Meat/Rice)', 26000, 'inventory'], ['Cook Salary', 15000, 'salary'], ['LPG Cylinder', 1150, 'utilities'], ['Delivery Partner Commission', 3200, 'marketing']]
  },
  cybercafe: {
    businessName: 'City Cyber Cafe & CSC',
    customerPrefix: 'Customer',
    products: [
      ['Form Filling (Government)', 60], ['Photocopy (per page)', 3],
      ['Lamination (A4)', 25], ['Passport Photo Print (8 copies)', 60],
      ['Online Payment Service', 30], ['Computer Use (per hour)', 40],
      ['Resume Typing & Print', 150], ['Aadhaar/PAN Printout', 20], ['Scan (per page)', 15]
    ],
    expenses: [['Shop Rent', 4500, 'rent'], ['Printer Ink & Paper', 2200, 'inventory'], ['Electricity', 1200, 'utilities'], ['Internet Bill', 899, 'utilities']]
  },
  clinic: {
    businessName: 'City Dental & Nursing Home',
    customerPrefix: 'Patient',
    products: [
      ['Dental Checkup', 300], ['Scaling & Polishing', 1200],
      ['Tooth Filling (Composite)', 1500], ['Root Canal Treatment', 4000],
      ['Tooth Extraction', 800], ['Crown (Zirconia)', 6500],
      ['Nursing Charge (per day)', 900], ['Dressing', 250], ['ECG', 450]
    ],
    expenses: [['Clinic Rent', 16000, 'rent'], ['Nurse Salary', 11000, 'salary'], ['Medical Consumables', 7500, 'inventory'], ['Equipment AMC', 2500, 'equipment']]
  },
  distributor: {
    businessName: 'Hossain Distribution Agency',
    customerPrefix: 'Client',
    products: [
      ['FMCG Carton — Mixed (Wholesale)', 2400], ['Beverage Crate (24 pcs)', 480],
      ['Snacks Carton (Assorted)', 1150], ['Toiletries Carton', 1900],
      ['Delivery — Local Route', 300], ['Delivery — Outer Route', 600],
      ['Cold Chain Box Rental', 250]
    ],
    expenses: [['Godown Rent', 9500, 'rent'], ['Van Fuel', 3800, 'transport'], ['Loader Wages', 5200, 'salary'], ['Vehicle Maintenance', 1900, 'transport']]
  },
  billing_only: {
    businessName: 'Quick Bill Solutions',
    customerPrefix: 'Customer',
    products: [
      ['Service Invoice (Standard)', 500], ['Service Invoice (Bulk x10)', 4200],
      ['Invoice Printing (per 100)', 350], ['GST Filing Assistance', 1200],
      ['Digital Bill Setup (One-time)', 2500]
    ],
    expenses: [['Office Rent', 6000, 'rent'], ['Internet & Phone', 1100, 'utilities'], ['Printing Supplies', 900, 'inventory']]
  },
  custom: {
    businessName: 'My Dream Business (Demo)',
    customerPrefix: 'Customer',
    products: [
      ['Product A', 500], ['Product B', 1200], ['Service A', 800],
      ['Service B — Premium', 2000], ['Consultation', 600], ['Delivery Charge', 100]
    ],
    expenses: [['Office Rent', 6000, 'rent'], ['Electricity', 1200, 'utilities'], ['Marketing', 2500, 'marketing']]
  }
};
// Friendly aliases → catalogue keys
const ALIAS = { General: 'custom', Embroidery: 'embroidery', Doctor: 'doctor', Teacher: 'teacher', Retail: 'retail' };

const getPersonaConfig = (persona) => {
  const key = ALIAS[persona] || persona || 'custom';
  const cat = CATALOGUES[key] || CATALOGUES.custom;
  return {
    businessName: cat.businessName,
    customerPrefix: cat.customerPrefix,
    productTemplates: cat.products.map(([name, price]) => ({ name, price })),
    expenseTemplates: cat.expenses
  };
};

// ─── Generator ─────────────────────────────────────────────────────────────
export const generateSmartDemoData = (personaName) => {
  const config = getPersonaConfig(personaName);

  // 1) Products — the real catalogue with stock & cost price (28-32 items)
  const products = [];
  const catalog = [...config.productTemplates];
  while (catalog.length < 10) catalog.push({ name: `${config.customerPrefix} Item ${catalog.length + 1}`, price: randInt(200, 1500) });
  catalog.forEach((template, i) => {
    const dup = Math.random() < 0.45 ? 1 : 2; // some items in two grades
    for (let d = 0; d < dup; d++) {
      const suffix = d === 0 ? '' : [' (Premium)', ' (Economy)'][d];
      // Price jitter stays proportional to the base price so ₹3 photocopies
      // never end up with negative or absurd values.
      const jitter = Math.max(1, Math.round(template.price * 0.06)) * randInt(-2, 2);
      products.push({
        id: `demo-prod-${Date.now()}-${i}-${d}`,
        name: `${template.name}${suffix}`,
        price: Math.max(1, template.price + (d === 1 ? randInt(100, 400) : 0) + jitter),
        costPrice: Math.max(10, Math.round(template.price * (0.62 + Math.random() * 0.15))),
        stock: randInt(3, 90),
        lowStockAlert: 5,
        category: config.customerPrefix === 'Patient' || config.customerPrefix === 'Student' || config.customerPrefix === 'Client' ? 'Service' : 'General',
        isTestData: true,
        createdAt: getRandomDate(540)
      });
    }
  });

  // 2) Customers — 55 realistic regulars (18-month history)
  const customers = [];
  for (let i = 0; i < 55; i++) {
    const name = getRandomName();
    const isRegular = Math.random() < 0.4;
    customers.push({
      id: `demo-cust-${Date.now()}-${i}`,
      name,
      phone: getRandomPhone(),
      email: Math.random() < 0.3 ? `${name.toLowerCase().replace(/[^a-z]+/g, '.').slice(0, 22)}@gmail.com` : '',
      address: getRandomArea(),
      openingBalance: Math.random() < 0.25 ? randInt(200, 2500) : 0,
      notes: isRegular ? 'Regular ' + config.customerPrefix.toLowerCase() + ' — priority service.' : '',
      businessType: personaName,
      isTestData: true,
      createdAt: getRandomDate(540)
    });
  }

  // 3) Invoices — 90 across the last 6 months, realistic status mix
  const invoices = [];
  for (let i = 0; i < 90; i++) {
    const roll = Math.random();
    let status = 'paid';
    if (roll > 0.82) status = 'unpaid';
    else if (roll > 0.62) status = 'partial';

    const numItems = randInt(1, 4);
    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < numItems; j++) {
      const prod = rand(products);
      const quantity = randInt(1, 3);
      items.push({ name: prod.name, price: prod.price, quantity });
      totalAmount += prod.price * quantity;
    }
    // Round to a clean rupee amount
    totalAmount = Math.round(totalAmount);

    let amountPaid = totalAmount;
    let paymentStatus = 'Paid';
    if (status === 'unpaid') { amountPaid = 0; paymentStatus = 'Unpaid'; }
    else if (status === 'partial') {
      amountPaid = Math.round(totalAmount * (Math.random() * 0.5 + 0.25));
      paymentStatus = 'Partial';
    }

    const customer = rand(customers);
    const daysBack = Math.floor(Math.pow(Math.random(), 1.4) * 175); // denser recent
    const invoiceDate = getDateString(daysBack);
    const dueDays = randInt(5, 15);
    const isOverdue = status !== 'paid' && daysBack > dueDays + 10;

    invoices.push({
      id: `demo-inv-${Date.now()}-${i}`,
      invoiceNumber: `DEMO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      grandTotal: totalAmount,
      amountPaid: amountPaid,
      balanceDue: totalAmount - amountPaid,
      paymentStatus: paymentStatus + (isOverdue ? ' (Overdue)' : ''),
      status,
      date: invoiceDate,
      dueDate: new Date(new Date(invoiceDate).getTime() + dueDays * 86400000).toISOString().substring(0, 10),
      createdAt: new Date(invoiceDate).toISOString(),
      updatedAt: new Date(invoiceDate).toISOString(),
      items,
      notes: Math.random() < 0.2 ? 'Thank you for your business! — ' + config.businessName : '',
      isTestData: true
    });
  }
  invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 4) Payment proofs — tied to unpaid/partial invoices
  const payments = [];
  const pendingInvoices = invoices.filter((inv) => inv.paymentStatus !== 'Paid').slice(0, 22);
  pendingInvoices.forEach((inv, i) => {
    payments.push({
      id: `demo-proof-${Date.now()}-${i}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.grandTotal - inv.amountPaid,
      method: rand(['UPI', 'UPI', 'Cash', 'Bank Transfer']),
      status: rand(['pending', 'pending', 'approved', 'rejected']),
      utr: `UTR${randInt(100000000000, 999999999999)}`,
      date: getRandomDate(20),
      isTestData: true
    });
  });

  // 5) Expenses — 6 months of overhead history
  const expenses = [];
  const EXP_KEYS = ['rent', 'utilities', 'inventory', 'salary', 'transport', 'equipment', 'marketing'];
  const EXP_LABELS = { rent: 'Rent', utilities: 'Utilities', inventory: 'Inventory & Supplies', salary: 'Salary & Wages', transport: 'Transport', equipment: 'Equipment', marketing: 'Marketing' };
  for (let month = 5; month >= 0; month--) {
    config.expenseTemplates.forEach(([label, base, kind]) => {
      if (kind === 'inventory' && month % 2 === 1) return; // inventory every other month
      const d = new Date();
      d.setMonth(d.getMonth() - month);
      d.setDate(randInt(1, 12));
      expenses.push({
        id: `demo-exp-${Date.now()}-${month}-${label.replace(/\W+/g, '')}`,
        category: EXP_LABELS[kind] || 'Other',
        description: `${label} — ${d.toLocaleString('en-IN', { month: 'short' })}`,
        amount: Math.round(base * (0.9 + Math.random() * 0.25)),
        date: d.toISOString().substring(0, 10),
        kind,
        isTestData: true
      });
    });
    if (Math.random() < 0.5) {
      const d = new Date();
      d.setMonth(d.getMonth() - month);
      d.setDate(randInt(13, 26));
      expenses.push({
        id: `demo-exp-${Date.now()}-${month}-extra`,
        category: EXP_LABELS[rand(EXP_KEYS)],
        description: 'Miscellaneous business expense',
        amount: randInt(150, 1800),
        date: d.toISOString().substring(0, 10),
        kind: 'other',
        isTestData: true
      });
    }
  }

  // 6) Demo business settings (name & identity follow the category)
  const settings = {
    businessName: config.businessName,
    ownerName: 'Demo Owner',
    phone: '+91 9000000000',
    email: 'demo@billqyro.com',
    address: rand(AREAS) + ', West Bengal',
    currency: '₹',
    themeColor: 'brand-premium',
    isTestData: true
  };

  return { products, customers, invoices, payments, expenses, settings };
};

// Compact single-invoice sample used by template previews.
export const getDemoInvoice = (category) => {
  const config = getPersonaConfig(category || 'Retail');
  const items = config.productTemplates.slice(0, 3).map((t) => ({ name: t.name, price: t.price, quantity: randInt(1, 2) }));
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const titleCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Retail';
  return {
    invoiceNumber: `DEMO-${Date.now().toString().slice(-6)}`,
    items,
    grandTotal: total,
    amountPaid: Math.round(total * 0.6),
    balanceDue: total - Math.round(total * 0.6),
    customerName: `${config.customerPrefix} — ${titleCategory} Demo`,
    date: new Date().toISOString().substring(0, 10),
    isTestData: true
  };
};
