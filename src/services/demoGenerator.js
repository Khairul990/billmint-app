// Demo / Sandbox data generator.
// Produces a realistic, premium-feeling sample workspace so visitors can tour
// the full platform from the landing page without registering.

const DEMO_CUSTOMERS = [
  { name: 'Arjun Sharma', phone: '+91 98300 41201', address: '12B Park Street, Kolkata, WB 700016' },
  { name: 'Priya Chatterjee', phone: '+91 98311 22045', address: '45 Rashbehari Avenue, Kolkata, WB 700029' },
  { name: 'Rahul Verma', phone: '+91 99540 88123', address: '7 MG Road, Bengaluru, KA 560001' },
  { name: 'Sneha Iyer', phone: '+91 99030 55219', address: '23 Anna Salai, Chennai, TN 600002' },
  { name: 'Imran Khan', phone: '+91 98200 73064', address: '91 Linking Road, Mumbai, MH 400050' },
  { name: 'Ananya Das', phone: '+91 98301 66720', address: '8 Salt Lake Sector 2, Kolkata, WB 700091' },
  { name: 'Vikram Mehta', phone: '+91 99100 30517', address: '14 Connaught Place, New Delhi, DL 110001' },
  { name: 'Kavya Reddy', phone: '+91 90100 44832', address: '31 Banjara Hills, Hyderabad, TS 500034' },
  { name: 'Sourav Gangopadhyay', phone: '+91 98304 12908', address: '56 Gariahat Road, Kolkata, WB 700019' },
  { name: 'Meera Nair', phone: '+91 94470 28145', address: '19 Marine Drive, Kochi, KL 682031' },
  { name: 'Rohan Patil', phone: '+91 90280 71539', address: '72 FC Road, Pune, MH 411005' },
  { name: 'Tanya Bose', phone: '+91 98312 90455', address: '3 Hindustan Park, Kolkata, WB 700029' }
];

const DEMO_PRODUCTS = [
  { name: 'Silk Embroidery Blouse (Custom Stitch)', price: 2450 },
  { name: 'Designer Kurti Set (2 Piece)', price: 1899 },
  { name: 'Bridal Lehenga Alteration', price: 5600 },
  { name: 'Shirt Stitching (Premium Cotton)', price: 850 },
  { name: 'Trouser Fitting & Alteration', price: 420 },
  { name: 'Zardosi Hand Work (per motif)', price: 1250 },
  { name: 'Screen Printing Service (A3 sheet)', price: 95 },
  { name: 'Laptop Deep-Cleaning Service', price: 750 },
  { name: 'Smartphone Screen Replacement (Labour)', price: 1150 },
  { name: 'CCTV Camera Installation (per unit)', price: 1650 },
  { name: 'AC Servicing & Gas Refill', price: 2200 },
  { name: 'Monthly Tuition Fee (Class 9-10)', price: 1500 },
  { name: 'Physics Crash Course (8 Sessions)', price: 4800 },
  { name: 'Consultation Fee (Follow-up)', price: 500 },
  { name: 'Home Delivery Charge', price: 60 },
  { name: 'Gift Wrapping (Premium)', price: 120 }
];

const DEMO_PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer'];

const pick = (arr, i) => arr[i % arr.length];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const round50 = (n) => Math.round(n / 50) * 50;

export const generateDemoWorkspace = () => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  if (!isSandbox) {
    console.error('Cannot generate demo data outside of Sandbox mode.');
    return false;
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // 1. Customers (18 realistic records)
  const generatedCustomers = Array.from({ length: 18 }, (_, i) => {
    const c = pick(DEMO_CUSTOMERS, i);
    return {
      id: `demo-cust-${now}-${i}`,
      name: c.name,
      phone: c.phone,
      email: `${c.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      address: c.address,
      createdAt: new Date(now - rand(10, 180) * DAY).toISOString()
    };
  });

  // 2. Products / Services (full catalog)
  const generatedProducts = DEMO_PRODUCTS.map((p, i) => ({
    id: `demo-prod-${now}-${i}`,
    name: p.name,
    price: p.price,
    description: 'Sample catalog item',
    stock: rand(4, 60),
    createdAt: new Date(now - rand(5, 120) * DAY).toISOString()
  }));

  // 3. Invoices (24, spread over the last 90 days)
  const statuses = ['Paid', 'Paid', 'Paid', 'Pending', 'Unpaid', 'Overdue'];
  const generatedInvoices = Array.from({ length: 24 }, (_, i) => {
    const cust = generatedCustomers[rand(0, generatedCustomers.length - 1)];
    const prod1 = generatedProducts[rand(0, generatedProducts.length - 1)];
    const prod2 = generatedProducts[rand(0, generatedProducts.length - 1)];
    const prod3 = generatedProducts[rand(0, generatedProducts.length - 1)];
    const qty1 = rand(1, 4);
    const qty2 = rand(1, 3);
    const qty3 = rand(1, 2);

    const subtotal = round50(prod1.price * qty1 + prod2.price * qty2 + prod3.price * qty3);
    const taxAmount = 0;
    const grandTotal = subtotal + taxAmount;

    const status = pick(statuses, i);
    const amountPaid = status === 'Paid' ? grandTotal : (status === 'Pending' ? round50(grandTotal / 2) : 0);
    const balanceDue = grandTotal - amountPaid;

    const pastDate = new Date(now - rand(0, 90) * DAY - rand(0, DAY));
    const dueDate = new Date(pastDate.getTime() + 7 * DAY);

    return {
      id: `demo-inv-${now}-${i}`,
      invoiceNumber: `INV-${String(1001 + i)}`,
      date: pastDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      createdAt: pastDate.toISOString(),
      updatedAt: pastDate.toISOString(),
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      items: [
        { sn: 1, description: prod1.name, qty: qty1, rate: prod1.price, amount: prod1.price * qty1 },
        { sn: 2, description: prod2.name, qty: qty2, rate: prod2.price, amount: prod2.price * qty2 },
        ...(qty3 && prod3.id !== prod2.id ? [{ sn: 3, description: prod3.name, qty: qty3, rate: prod3.price, amount: prod3.price * qty3 }] : [])
      ],
      taxPercentage: 0,
      subtotal,
      taxAmount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentStatus: status,
      syncStatus: 'synced',
      publicToken: `demo_token_${i}`,
      paymentHistory: amountPaid > 0 ? [{
        id: `ph-${now}-${i}`,
        date: pastDate.toISOString().split('T')[0],
        amount: amountPaid,
        method: pick(DEMO_PAYMENT_METHODS, i),
        reviewer: 'Sandbox AutoGen'
      }] : []
    };
  });
  generatedInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 4. Expenses (12, for the dashboard expense widgets)
  const expenseCategories = ['Rent', 'Electricity', 'Raw Materials', 'Transport', 'Staff Salary', 'Marketing', 'Maintenance'];
  const generatedExpenses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now - rand(0, 75) * DAY);
    return {
      id: `demo-exp-${now}-${i}`,
      title: pick(expenseCategories, i),
      category: pick(expenseCategories, i),
      amount: round50(rand(300, 9000)),
      date: d.toISOString().split('T')[0],
      createdAt: d.toISOString(),
      paymentMethod: pick(DEMO_PAYMENT_METHODS, i + 1),
      notes: 'Sample expense entry',
      syncStatus: 'synced'
    };
  });
  localStorage.setItem('billqyro_demo_expenses', JSON.stringify(generatedExpenses));

  localStorage.setItem('billqyro_demo_customers', JSON.stringify(generatedCustomers));
  localStorage.setItem('billqyro_demo_products', JSON.stringify(generatedProducts));
  localStorage.setItem('billqyro_demo_invoices', JSON.stringify(generatedInvoices));

  // 5. Settings — mark setup complete so demo visitors land directly on the dashboard
  const settings = JSON.parse(localStorage.getItem('billqyro_demo_settings') || '{}');
  Object.assign(settings, {
    nextInvoiceNumber: 1025,
    setupCompleted: true,
    profileSetupCompleted: true,
    businessSetupCompleted: true,
    ownerName: 'Demo Owner',
    businessName: 'BillQyro Demo Studio',
    businessType: 'Tailoring & Boutique',
    businessPhone: '+91 98300 00000',
    businessEmail: 'demo@billqyro.app',
    businessAddress: 'Park Street, Kolkata, WB 700016',
    currency: 'INR',
    themeColor: settings.themeColor || 'brand-premium'
  });
  localStorage.setItem('billqyro_demo_settings', JSON.stringify(settings));

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('billqyro_sync'));
  return true;
};

export const resetSandboxData = () => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  if (!isSandbox) {
    console.error('Cannot reset sandbox data outside of Sandbox mode.');
    return false;
  }
  localStorage.removeItem('billqyro_demo_customers');
  localStorage.removeItem('billqyro_demo_products');
  localStorage.removeItem('billqyro_demo_invoices');
  localStorage.removeItem('billqyro_demo_expenses');
  localStorage.removeItem('billqyro_demo_settings');
  return true;
};
