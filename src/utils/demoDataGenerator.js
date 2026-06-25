// demoDataGenerator.js
// Generates robust, realistic mock data spanning 6 months for the Demo Workspace.

const FIRST_NAMES = [
  'Rahim', 'Rafika', 'Suman', 'Ayan', 'Rahima', 'Rahul', 'Priya', 'Amit', 'Neha', 'Kabir',
  'Anjali', 'Vikram', 'Sneha', 'Rohan', 'Zara', 'Arjun', 'Meera', 'Karan', 'Pooja', 'Tariq',
  'Farhan', 'Aisha', 'Imran', 'Nadia', 'Kunal', 'Riya', 'Sameer', 'Fatima', 'Aditya', 'Sanya',
  'Arif', 'Zoya', 'Nitin', 'Divya', 'Sanjay', 'Kiran', 'Raj', 'Simran', 'Omar', 'Hassan'
];

const LAST_NAMES = [
  'Ahmed', 'Begum', 'Das', 'Roy', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Ali',
  'Khan', 'Jain', 'Verma', 'Chowdhury', 'Sen', 'Bose', 'Mukherjee', 'Hossain', 'Rahman', 'Siddiqui'
];

// Helper to generate realistic names
const getRandomName = (prefix = '') => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return prefix ? `${prefix} ${first} ${last}` : `${first} ${last}`;
};

// Generate realistic date within the last X days
const getRandomDate = (daysBack) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const pastDate = new Date(now - Math.floor(Math.random() * daysBack) * msPerDay);
  return pastDate.toISOString();
};

const getPersonaConfig = (persona) => {
  switch (persona) {
    case 'Doctor': return {
      productTemplates: [
        { name: 'General Consultation Fee', price: 500 },
        { name: 'Specialist Consultation', price: 1000 },
        { name: 'Blood Test - Basic Panel', price: 800 },
        { name: 'Full Body Checkup', price: 2500 },
        { name: 'Medicine Follow-up', price: 300 },
        { name: 'ECG Test', price: 600 },
        { name: 'Dental Cleaning', price: 1200 },
        { name: 'Vaccination', price: 450 }
      ],
      customerPrefix: 'Patient'
    };
    case 'Teacher': return {
      productTemplates: [
        { name: 'Monthly Tuition Fee - Science', price: 1500 },
        { name: 'Monthly Tuition Fee - Math', price: 1500 },
        { name: 'Admission Fee', price: 5000 },
        { name: 'Study Material / Books', price: 800 },
        { name: 'Exam Fee', price: 300 },
        { name: 'Special Crash Course', price: 2500 },
        { name: 'Library Fee', price: 200 }
      ],
      customerPrefix: 'Student'
    };
    case 'Embroidery': return {
      productTemplates: [
        { name: 'Custom Stitching - Blouse', price: 800 },
        { name: 'Saree Work - Zari', price: 3500 },
        { name: 'Panjabi Thread Work', price: 1200 },
        { name: 'Pattern Digitizing', price: 500 },
        { name: 'Lehenga Heavy Embroidery', price: 8000 },
        { name: 'Custom Design Order', price: 2500 },
        { name: 'Alteration - Saree', price: 300 }
      ],
      customerPrefix: 'Client'
    };
    case 'Tailor': return {
      productTemplates: [
        { name: 'Suit Alteration', price: 400 },
        { name: 'Custom Shirt Stitching', price: 600 },
        { name: 'Wedding Dress Stitching', price: 5000 },
        { name: 'Pant Stitching', price: 550 },
        { name: 'Fabric Charge', price: 1200 },
        { name: 'Express Service Charge', price: 300 },
        { name: 'Kurta Pyjama Stitch', price: 850 }
      ],
      customerPrefix: 'Client'
    };
    case 'Retail': return {
      productTemplates: [
        { name: 'Cotton T-Shirt (M)', price: 499 },
        { name: 'Denim Jeans (Blue)', price: 1299 },
        { name: 'Leather Belt', price: 699 },
        { name: 'Sneakers (Size 9)', price: 2499 },
        { name: 'Winter Jacket', price: 3500 },
        { name: 'Formal Shirt', price: 899 },
        { name: 'Sports Watch', price: 1500 }
      ],
      customerPrefix: ''
    };
    case 'Service': return {
      productTemplates: [
        { name: 'AC Repair & Gas Refill', price: 1800 },
        { name: 'Laptop Servicing - OS Install', price: 600 },
        { name: 'Plumbing Job - Leak Fix', price: 400 },
        { name: 'Electrical Wiring Repair', price: 850 },
        { name: 'Fridge Compressor Repair', price: 3200 },
        { name: 'Washing Machine Service', price: 1500 },
        { name: 'CCTV Installation', price: 2500 }
      ],
      customerPrefix: 'Client'
    };
    case 'Freelancer': return {
      productTemplates: [
        { name: 'Website Design - 5 Pages', price: 15000 },
        { name: 'SEO Optimization - Monthly', price: 8000 },
        { name: 'Logo Creation', price: 3500 },
        { name: 'Consulting Hour', price: 1500 },
        { name: 'Social Media Management', price: 10000 },
        { name: 'Content Writing (10 Articles)', price: 5000 },
        { name: 'UI/UX Mobile App Design', price: 25000 }
      ],
      customerPrefix: 'Client'
    };
    default: return {
      productTemplates: [
        { name: 'Premium Service Package', price: 5000 },
        { name: 'Basic Maintenance', price: 1000 },
        { name: 'Consultation Session', price: 1500 },
        { name: 'Add-on Support', price: 500 }
      ],
      customerPrefix: 'Customer'
    };
  }
};

export const generateSmartDemoData = (personaName) => {
  const config = getPersonaConfig(personaName);
  
  // 1. Generate 40 Products
  const products = [];
  for (let i = 0; i < 40; i++) {
    const template = config.productTemplates[i % config.productTemplates.length];
    // Add variations for realism
    const variationPrice = template.price + (Math.floor(Math.random() * 5) * 50);
    products.push({
      id: `demo-prod-${Date.now()}-${i}`,
      name: i < config.productTemplates.length ? template.name : `${template.name} - Variant ${Math.floor(i / config.productTemplates.length)}`,
      price: variationPrice,
      isTestData: true,
      createdAt: getRandomDate(180) // created within last 6 months
    });
  }

  // 2. Generate 100 Customers
  const customers = [];
  for (let i = 0; i < 100; i++) {
    customers.push({
      id: `demo-cust-${Date.now()}-${i}`,
      name: getRandomName(config.customerPrefix),
      phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
      email: `demo.contact.${i+1}@example.local`,
      address: `Apt ${Math.floor(Math.random()*100)}, Street ${Math.floor(Math.random()*20)}, Demo City`,
      businessType: personaName,
      isTestData: true,
      createdAt: getRandomDate(180)
    });
  }

  // 3. Generate 150 Invoices
  const invoices = [];
  for (let i = 0; i < 150; i++) {
    // 60% paid, 25% partial, 15% unpaid
    const statusRoll = Math.random();
    let status = 'paid';
    if (statusRoll > 0.85) status = 'unpaid';
    else if (statusRoll > 0.60) status = 'partial';

    // Pick 1 to 4 random products
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < numItems; j++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({ name: prod.name, price: prod.price, quantity });
      totalAmount += prod.price * quantity;
    }

    let amountPaid = totalAmount;
    let paymentStatus = 'Paid';
    if (status === 'unpaid') {
      amountPaid = 0;
      paymentStatus = 'Unpaid';
    } else if (status === 'partial') {
      amountPaid = Math.floor(totalAmount * (Math.random() * 0.5 + 0.2));
      paymentStatus = 'Partial';
    }

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const invoiceDate = getRandomDate(180).substring(0, 10); // Dashboard usually expects YYYY-MM-DD

    invoices.push({
      id: `demo-inv-${Date.now()}-${i}`,
      invoiceNumber: `DEMO-INV-2026-${(i + 1).toString().padStart(3, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      grandTotal: totalAmount,
      amountPaid: amountPaid,
      balanceDue: totalAmount - amountPaid,
      paymentStatus: paymentStatus,
      date: invoiceDate,
      dueDate: new Date(new Date(invoiceDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      items,
      isTestData: true
    });
  }

  // Sort invoices by date descending
  invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 4. Generate 25 Payment Proofs (tied to pending/partial invoices)
  const payments = [];
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus !== 'Paid').slice(0, 25);
  pendingInvoices.forEach((inv, i) => {
    payments.push({
      id: `demo-proof-${Date.now()}-${i}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.grandTotal - inv.amountPaid,
      method: ['UPI', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 3)],
      status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
      utr: `UTR${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      date: getRandomDate(14),
      isTestData: true
    });
  });

  return { products, customers, invoices, payments };
};

export const getDemoInvoice = (category) => {
  const config = getPersonaConfig(category || 'Retail');
  const items = config.productTemplates.slice(0, 3).map(pt => ({
    description: pt.name,
    qty: 1,
    rate: pt.price,
    amount: pt.price
  }));
  const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
  const titleCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Retail';

  return {
    id: 'demo-123',
    invoiceNumber: 'INV-1001',
    date: '01/01/2024',
    dueDate: '15/01/2024',
    customerName: getRandomName(config.customerPrefix),
    customerAddress: '123, Demo Street, City',
    customerPhone: '+91 98765 43210',
    customerEmail: 'customer@demo.local',
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    billType: category || 'retail',
    notes: 'Thank you for your business.',
    items: items,
    subtotal: subtotal,
    discountAmount: 0,
    taxPercentage: 0,
    taxAmount: 0,
    grandTotal: subtotal,
    amountPaid: subtotal / 2,
    balanceDue: subtotal / 2,
    businessSnapshot: {
        businessName: `${titleCategory} Demo Business`,
        ownerName: 'Admin',
        phone: '+91 98765 43210',
        email: 'admin@demo.local',
        address: '456, Business Park, City',
        gstNumber: '',
        currency: '₹',
        taxLabel: 'GST',
    },
    paymentSettingsSnapshot: {
        paymentQrEnabled: true,
        showQrInPreview: true,
        customerLiveLinkSettings: {
           enableLiveInvoiceLink: true,
           showPaymentQr: true,
           allowCustomerPdfDownload: true,
           allowPaymentProofSubmit: true,
           showPaidDueAmount: true,
           showContactButton: true,
           requireTransactionId: true,
           requirePaymentScreenshot: false,
           selectedLiveLinkTemplate: 'classic',
        }
    },
    regionalSettingsSnapshot: {
        country: 'India',
        currency: '₹',
        currencyCode: 'INR',
        language: 'English',
        taxLabel: 'GST',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'Indian',
    },
  };
};
