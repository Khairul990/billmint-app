import { z } from 'zod';

export const invoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().min(0.01, 'Quantity must be > 0'),
    price: z.number().min(0, 'Price cannot be negative'),
    total: z.number()
  })).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  taxTotal: z.number().min(0).optional(),
  discountTotal: z.number().min(0).optional(),
  grandTotal: z.number().min(0),
  paymentStatus: z.enum(['Paid', 'Partially Paid', 'Unpaid', 'Pending']).optional().default('Unpaid'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

export const customerSchema = z.object({
  id: z.string().min(1, 'Customer ID is required'),
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional()
}).passthrough();

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  stockQty: z.number().min(0).optional(),
  category: z.string().optional(),
  description: z.string().optional()
}).passthrough();

export const validatePayload = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    console.error('Validation Error:', error);
    return { success: false, errors: error.errors };
  }
};
