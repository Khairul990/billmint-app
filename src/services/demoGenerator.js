export const generateDemoWorkspace = () => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  if (!isSandbox) {
    console.error('Cannot generate demo data outside of Sandbox mode.');
    return false;
  }

  // 1. Generate Customers
  const generatedCustomers = Array.from({ length: 50 }, (_, i) => ({
    id: `demo-cust-${Date.now()}-${i}`,
    name: `Test Customer ${i + 1}`,
    phone: `+91 98000 ${String(i).padStart(5, '0')}`,
    email: `customer${i + 1}@test.com`,
    address: `${i + 1} Demo Street, Test City, TS - 000000`,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  }));
  localStorage.setItem('billqyro_demo_customers', JSON.stringify(generatedCustomers));

  // 2. Generate Products
  const generatedProducts = Array.from({ length: 30 }, (_, i) => ({
    id: `demo-prod-${Date.now()}-${i}`,
    name: `Premium Product ${i + 1}`,
    price: Math.floor(Math.random() * 5000) + 100,
    description: 'Auto-generated test product',
    createdAt: new Date().toISOString()
  }));
  localStorage.setItem('billqyro_demo_products', JSON.stringify(generatedProducts));

  // 3. Generate Invoices
  const statuses = ['Paid', 'Pending', 'Unpaid', 'Overdue'];
  const generatedInvoices = Array.from({ length: 100 }, (_, i) => {
    const cust = generatedCustomers[Math.floor(Math.random() * generatedCustomers.length)];
    const prod1 = generatedProducts[Math.floor(Math.random() * generatedProducts.length)];
    const prod2 = generatedProducts[Math.floor(Math.random() * generatedProducts.length)];
    const qty1 = Math.floor(Math.random() * 5) + 1;
    const qty2 = Math.floor(Math.random() * 3) + 1;
    
    const subtotal = (prod1.price * qty1) + (prod2.price * qty2);
    const taxAmount = subtotal * 0.18;
    const grandTotal = subtotal + taxAmount;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amountPaid = status === 'Paid' ? grandTotal : (status === 'Pending' ? grandTotal / 2 : 0);
    const balanceDue = grandTotal - amountPaid;

    // Distribute dates over the last 90 days
    const pastDate = new Date(Date.now() - Math.random() * (90 * 24 * 60 * 60 * 1000));
    const dueDate = new Date(pastDate.getTime() + (7 * 24 * 60 * 60 * 1000));

    return {
      id: `demo-inv-${Date.now()}-${i}`,
      invoiceNumber: `INV-DEMO-${String(i + 1).padStart(4, '0')}`,
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
      ],
      taxPercentage: 18,
      subtotal,
      taxAmount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentStatus: status,
      syncStatus: 'synced',
      publicToken: `demo_token_${i}`,
      paymentHistory: amountPaid > 0 ? [{
        id: 'ph-' + Date.now() + i,
        date: pastDate.toISOString().split('T')[0],
        amount: amountPaid,
        method: 'UPI',
        reviewer: 'Sandbox AutoGen'
      }] : []
    };
  });
  
  // Sort descending by date
  generatedInvoices.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  localStorage.setItem('billqyro_demo_invoices', JSON.stringify(generatedInvoices));

  // 4. Update Dashboard metrics by saving settings
  const settings = JSON.parse(localStorage.getItem('billqyro_demo_settings') || '{}');
  settings.nextInvoiceNumber = 101;
  localStorage.setItem('billqyro_demo_settings', JSON.stringify(settings));

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('billqyro_sync'));
  return true;
};

export const resetSandboxData = () => {
  localStorage.removeItem('billqyro_demo_invoices');
  localStorage.removeItem('billqyro_demo_customers');
  localStorage.removeItem('billqyro_demo_products');
  localStorage.removeItem('billqyro_demo_expenses');
  localStorage.removeItem('billqyro_demo_payments'); // For test payment proofs
  
  const userId = localStorage.getItem('billqyro_real_user_id') || 'local-user';
  localStorage.removeItem(`billqyro_notifications_${userId}`);
  
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('billqyro_notifications_updated'));
  window.dispatchEvent(new Event('billqyro_sync'));
};
