export const DEMO_BUSINESS = {
  businessName: 'ABC Coaching Center',
  ownerName: 'Khairul Basar',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'khairul@abccoaching.com',
  address: '123, Education Lane, Near City Mall, Kolkata - 700001, West Bengal, India',
  gstNumber: '29ABCDE1234F1Z5',
  logoUrl: '',
  country: 'India',
  currency: '\u20B9',
  currencyCode: 'INR',
  language: 'English',
  taxLabel: 'GST',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'Indian',
  businessCategory: 'education'
};

export const DEMO_CUSTOMER = {
  name: 'Rahim Sheikh',
  phone: '+91 98765 00001',
  email: 'rahim.s@email.com',
  address: '456, Lake Road, Kolkata - 700016'
};

export const DEMO_INVOICE = {
  invoiceNumber: 'INV-10024',
  date: '15/06/2026',
  dueDate: '15/07/2026',
  customer: DEMO_CUSTOMER,
  items: [
    { description: 'Mathematics Tuition - Monthly Fee (June 2026)', qty: 1, rate: 500, amount: 500 },
    { description: 'Science Tuition - Monthly Fee (June 2026)', qty: 1, rate: 500, amount: 500 },
    { description: 'Study Materials & Practice Sheets', qty: 1, rate: 200, amount: 200 },
    { description: 'Lab Fee - Science Practicals', qty: 1, rate: 150, amount: 150 }
  ],
  subtotal: 1350,
  taxLabel: 'GST',
  taxRate: 18,
  taxAmount: 243,
  discount: 0,
  grandTotal: 1593,
  amountPaid: 0,
  balanceDue: 1593,
  paymentStatus: 'Pending',
  currency: '\u20B9',
  notes: 'Thank you for choosing ABC Coaching Center. Kindly pay before the due date.',
  terms: 'Fees once paid are non-refundable. Late payment may incur additional charges.'
};

export const DEMO_PAYMENT = {
  upiId: 'abccoaching@ybl',
  paymentMethod: 'UPI',
  payeeName: 'ABC Coaching Center',
  paymentNote: 'Use Invoice INV-10024 as payment reference',
  qrEnabled: true
};

export const getDemoData = (section) => {
  switch (section) {
    case 'business': return DEMO_BUSINESS;
    case 'customer': return DEMO_CUSTOMER;
    case 'invoice': return DEMO_INVOICE;
    case 'payment': return DEMO_PAYMENT;
    default: return DEMO_BUSINESS;
  }
};
