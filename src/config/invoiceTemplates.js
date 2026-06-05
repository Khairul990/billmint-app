export const invoiceTemplates = [
  {
    id: 'retail',
    name: 'নরমাল দোকান',
    nameEn: 'Retail Shop',
    icon: 'Store',
    color: 'blue',
    fields: [
      { id: 'item', label: 'পণ্যের নাম', labelEn: 'Item Name', type: 'text', required: true },
      { id: 'quantity', label: 'পরিমাণ', labelEn: 'Quantity', type: 'number', required: true },
      { id: 'rate', label: 'দাম', labelEn: 'Unit Price', type: 'number', required: true },
      { id: 'amount', label: 'মোট', labelEn: 'Total', type: 'calculated', formula: 'quantity * rate' }
    ],
    defaultItem: {
      item: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
  },
  {
    id: 'clinic',
    name: 'ডাক্তার/ক্লিনিক',
    nameEn: 'Clinic/Doctor',
    icon: 'Stethoscope',
    color: 'green',
    fields: [
      { id: 'patientName', label: 'রোগীর নাম', labelEn: 'Patient Name', type: 'text', required: true },
      { id: 'service', label: 'সেবা/রোগ নির্ণয়', labelEn: 'Service/Diagnosis', type: 'text', required: true },
      { id: 'fee', label: 'পরামর্শ ফি', labelEn: 'Consultation Fee', type: 'number', required: true },
      { id: 'medicine', label: 'ওষুধ (ঐচ্ছিক)', labelEn: 'Medicine', type: 'text', required: false },
      { id: 'amount', label: 'মোট', labelEn: 'Total', type: 'calculated', formula: 'fee' } // updated formula based on fee logic or just a number input
    ],
    defaultItem: {
      patientName: '',
      service: '',
      fee: 0,
      medicine: '',
      amount: 0
    }
  },
  {
    id: 'embroidery',
    name: 'এমব্রয়ডারি/দর্জি',
    nameEn: 'Embroidery/Tailoring',
    icon: 'Shirt',
    color: 'purple',
    fields: [
      { id: 'design', label: 'ডিজাইন নাম', labelEn: 'Design Name', type: 'text', required: true },
      { id: 'size', label: 'সাইজ', labelEn: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'], required: true },
      { id: 'color', label: 'রঙ', labelEn: 'Color', type: 'text', required: true },
      { id: 'stitches', label: 'সেলাই সংখ্যা', labelEn: 'Stitch Count', type: 'number', required: false },
      { id: 'fabric', label: 'কাপড়ের ধরন', labelEn: 'Fabric Type', type: 'text', required: false },
      { id: 'rate', label: 'দাম', labelEn: 'Price', type: 'number', required: true },
      { id: 'amount', label: 'মোট', labelEn: 'Total', type: 'calculated', formula: 'rate' }
    ],
    defaultItem: {
      design: '',
      size: 'M',
      color: '',
      stitches: 0,
      fabric: '',
      rate: 0,
      amount: 0
    }
  },
  {
    id: 'repair',
    name: 'রিপেয়ার/সার্ভিস',
    nameEn: 'Repair/Service',
    icon: 'Wrench',
    color: 'orange',
    fields: [
      { id: 'itemType', label: 'জিনিসের ধরন', labelEn: 'Item Type', type: 'text', required: true },
      { id: 'issue', label: 'সমস্যা', labelEn: 'Issue/Problem', type: 'text', required: true },
      { id: 'parts', label: 'পার্টস খরচ', labelEn: 'Parts Cost', type: 'number', required: false },
      { id: 'labor', label: 'লেবার খরচ', labelEn: 'Labor Cost', type: 'number', required: true },
      { id: 'amount', label: 'মোট', labelEn: 'Total', type: 'calculated', formula: 'parts + labor' }
    ],
    defaultItem: {
      itemType: '',
      issue: '',
      parts: 0,
      labor: 0,
      amount: 0
    }
  },
  {
    id: 'mall',
    name: 'শপিংমল',
    nameEn: 'Shopping Mall',
    icon: 'ShoppingBag',
    color: 'red',
    fields: [
      { id: 'barcode', label: 'বারকোড', labelEn: 'Barcode', type: 'text', required: false },
      { id: 'product', label: 'পণ্যের নাম', labelEn: 'Product Name', type: 'text', required: true },
      { id: 'quantity', label: 'পরিমাণ', labelEn: 'Quantity', type: 'number', required: true },
      { id: 'mrp', label: 'MRP', labelEn: 'MRP', type: 'number', required: true },
      { id: 'discount', label: 'ছাড় %', labelEn: 'Discount %', type: 'number', required: false },
      { id: 'amount', label: 'মোট', labelEn: 'Total', type: 'calculated', formula: 'quantity * mrp * (1 - discount/100)' }
    ],
    defaultItem: {
      barcode: '',
      product: '',
      quantity: 1,
      mrp: 0,
      discount: 0,
      amount: 0
    }
  },
  {
    id: 'custom',
    name: 'কাস্টম',
    nameEn: 'Custom',
    icon: 'Palette',
    color: 'gray',
    fields: [], // User will build their own
    customizable: true,
    defaultItem: {
      description: '',
      amount: 0
    }
  }
];
