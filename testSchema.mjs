import { z } from 'zod';

const invoiceSchema = z.object({
  id: z.string().nullish(),
  invoiceNumber: z.string().nullish(),
  date: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    qty: z.number().or(z.string()).optional(),
    rate: z.number().or(z.string()).optional(),
    quantity: z.number().or(z.string()).optional(),
    price: z.number().or(z.string()).optional(),
    total: z.number().or(z.string()).optional()
  }).passthrough()).optional(),
  subtotal: z.number().min(0).optional(),
  taxTotal: z.number().min(0).optional(),
  discountTotal: z.number().min(0).optional(),
  grandTotal: z.number().min(0).optional(),
  paymentStatus: z.string().optional().default('Unpaid'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

const existing = { id: '123', createdAt: '2023-01-01' };
const payload = {
  invoiceNumber: '123',
  date: '2023-01-01',
  billType: 'Invoice',
  customerName: 'Test',
  customerPhone: '',
  notes: '',
  subtotal: 100,
  taxAmount: 0,
  taxPercentage: 0,
  discountAmount: 0,
  shipping: 0,
  grandTotal: 100,
  oldDue: 0,
  balanceDue: 100,
  items: [{
    sNo: '1',
    itemService: 'Test',
    name: 'Test',
    description: '',
    qty: 1,
    rate: 100,
    amount: 100,
    customFields: {}
  }],
  selectedTemplate: 'minimal-classic',
  invoiceColumns: []
};

const merged = { ...existing, ...payload };

try {
  const result = invoiceSchema.parse(merged);
  console.log('Success:', result);
} catch (e) {
  console.error('Validation Error:', e.errors);
}
