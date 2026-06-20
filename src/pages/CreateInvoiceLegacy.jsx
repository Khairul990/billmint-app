import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Settings, 
  LayoutTemplate, 
  Save, 
  ArrowLeft, ArrowRight,
  Users, 
  Layers, 
  Percent, 
  Coins, 
  Calculator, 
  Copy, 
  Check, 
  HelpCircle,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Loader2, Download,
  Send,
  BarChart3,
  Search,
  X,
  BookOpen,
  FileDown,
  UserPlus,
  Info,
  Maximize2,
  Printer,
  Link,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useGeneratePDF from '../hooks/useGeneratePDF';
import { calculateTotals, generateNextInvoiceNumber, getNextDesignNumber, autoIncrementString, formatCurrency } from '../utils/invoiceUtils';
import InvoicePreview from '../components/InvoicePreview';
import BottomSheet from '../components/BottomSheet';
import AddCustomerSheet from '../components/AddCustomerSheet';
import { ensureInvoicePublicToken, logAudit } from '../services/dbEngine';

const ALL_FIELDS_BY_TEMPLATE = {
  embroidery: [
    { key: 'designNo', label: 'Design / Item Code' },
    { key: 'workType', label: 'Work Type' },
    { key: 'description', label: 'Description' },
    { key: 'size', label: 'Size' },
    { key: 'qty', label: 'Quantity' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
  ],
  grocery: [
    { key: 'description', label: 'Product Name' },
    { key: 'size', label: 'Unit' },
    { key: 'qty', label: 'Quantity' },
    { key: 'rate', label: 'Unit Price' },
    { key: 'amount', label: 'Amount' },
  ],
  repair: [
    { key: 'serviceName', label: 'Service / Item' },
    { key: 'problemDetails', label: 'Problem / Details' },
    { key: 'partsCost', label: 'Parts Cost' },
    { key: 'labourCharge', label: 'Labour Charge' },
    { key: 'qty', label: 'Quantity' },
    { key: 'amount', label: 'Amount' },
  ],
  retail: [
    { key: 'productName', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'sizeVariant', label: 'Size / Variant' },
    { key: 'qty', label: 'Quantity' },
    { key: 'price', label: 'Price' },
    { key: 'discount', label: 'Discount' },
    { key: 'amount', label: 'Amount' },
  ],
  custom: [
    { key: 'itemService', label: 'Item / Service' },
    { key: 'description', label: 'Description' },
    { key: 'qty', label: 'Quantity' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
  ],
};

/**
 * Premium Responsive Invoice Builder Page
 */
const CreateInvoice = ({
  invoices = [],
  customers = [],
  products = [],
  businessSettings,
  onSaveInvoice,
  setCurrentTab,
  editingInvoice = null,
  onDownloadPDF,
  onQuickBillOpen
}) => {
  const currencySymbol = businessSettings?.currency || '₹';
  const { generatePDF, isGenerating } = useGeneratePDF();

  // --- STATE FOR MAIN INVOICE ---
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billType, setBillType] = useState(businessSettings?.defaultBillingTemplate || 'custom');
  const [pdfVisibleFields, setPdfVisibleFields] = useState(businessSettings?.pdfVisibleFields?.[businessSettings?.defaultBillingTemplate || 'custom'] || []);
  const [showTopActions, setShowTopActions] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);


  const getExpandedGridCols = () => {
    if (billType === 'grocery')
      return '50px minmax(220px,2fr) 100px 90px 120px 140px 100px';
    if (billType === 'repair')
      return '50px minmax(180px,1.5fr) minmax(180px,1.5fr) 110px 110px 80px 140px 100px';
    if (billType === 'retail')
      return '50px minmax(180px,1.5fr) 120px 100px 80px 120px 110px 140px 100px';
    if (billType === 'custom')
      return '50px minmax(180px,1.5fr) minmax(220px,2fr) 90px 120px 140px 100px';
    // embroidery (default)
    return '50px 140px 150px minmax(200px,2fr) 90px 80px 110px 130px 100px';
  };

  const getGridCols = () => {
    // Fixed widths: No(50) | ...fields... | Amount(140) | Actions(95)
    if (billType === 'grocery')
      // No | ProductName | Unit | Qty | UnitPrice | Amount | Actions
      return '50px minmax(280px,2fr) 110px 95px 140px 150px 100px';
    if (billType === 'repair')
      // No | ServiceName | ProblemDetails | PartsCost | LabourCharge | Qty | Amount | Actions
      return '50px minmax(200px,1.5fr) minmax(200px,1.5fr) 130px 130px 95px 150px 100px';
    if (billType === 'retail')
      // No | ProductName | Category | SizeVariant | Qty | Price | Discount | Amount | Actions
      return '50px minmax(200px,1.5fr) 130px 120px 95px 130px 120px 150px 100px';
    if (billType === 'custom')
      // No | ItemService | Description | Qty | Rate | Amount | Actions
      return '50px minmax(200px,1.5fr) minmax(280px,2fr) 95px 140px 150px 100px';
    // embroidery (default)
    // No | DesignNo | WorkType | Description | Size | Qty | Rate | Amount | Actions
    return '50px 160px 180px minmax(280px,2fr) 100px 95px 140px 150px 100px';
  };
  
  // Client details
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Line items
  const [items, setItems] = useState([]);
  
  // Totals & configuration overrides
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentProofs, setPaymentProofs] = useState(editingInvoice?.paymentProofs || []);

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofs([...paymentProofs, { url: reader.result, date: new Date().toISOString() }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProof = (index) => {
    setPaymentProofs(paymentProofs.filter((_, i) => i !== index));
  };
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [saveCustomer, setSaveCustomer] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [orderStatus, setOrderStatus] = useState('Pending');

  // --- STATE FOR SMART RATE MODAL ---
  const [showSmartRate, setShowSmartRate] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [smartCharges, setSmartCharges] = useState({
    repair: 0,
    punching: 0,
    embroidery: 0,
    other: 0
  });

  // Load editing details or generate fresh defaults
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setDate(editingInvoice.date);
      setDueDate(editingInvoice.dueDate);
      setSelectedCustomerId(editingInvoice.customerId || '');
      setCustomerName(editingInvoice.customerName || '');
      setCustomerPhone(editingInvoice.customerPhone || '');
      setCustomerEmail(editingInvoice.customerEmail || '');
      setCustomerAddress(editingInvoice.customerAddress || '');
      setTaxPercentage(editingInvoice.taxPercentage !== undefined ? editingInvoice.taxPercentage : 18);
      setDiscountAmount(editingInvoice.discountAmount || 0);
      setAmountPaid(editingInvoice.amountPaid || 0);
      setNotes(editingInvoice.notes || '');
      setTerms(editingInvoice.terms || '');
      setPaymentStatus(editingInvoice.paymentStatus || 'Pending');
      setOrderStatus(editingInvoice.orderStatus || 'Pending');
      setBillType(editingInvoice.billType || businessSettings?.defaultBillingTemplate || 'custom');
      if(editingInvoice.pdfVisibleFields) setPdfVisibleFields(editingInvoice.pdfVisibleFields);

      // Populate items ensuring they have smartRate details
      const parsedItems = (editingInvoice.items || []).map((item, idx) => ({
        sn: item.sn || idx + 1,
        designNo: item.designNo || '',
        workType: item.workType || 'Embroidery',
        description: item.description || item.name || '',
        size: item.size || '',
        qty: item.qty || item.quantity || 1,
        rate: item.rate || item.price || 0,
        amount: item.amount || (item.qty || 1) * (item.rate || 0),
        smartRate: item.smartRate || { repair: 0, punching: 0, embroidery: 0, other: 0 }
      }));
      setItems(parsedItems);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const due = futureDate.toISOString().split('T')[0];

      setDate(today);
      setDueDate(due);
      setInvoiceNumber(generateNextInvoiceNumber(invoices));
      setTaxPercentage(businessSettings?.defaultTax !== undefined ? businessSettings.defaultTax : 18);
      setDiscountAmount(0);
      setAmountPaid(0);
      setNotes(businessSettings?.defaultNotes || 'Thank you for choosing BillQyro! Payment is expected within due date.');
      setTerms(businessSettings?.terms || '');
      setPaymentStatus('Pending');
      setOrderStatus('Pending');
      setBillType(businessSettings?.defaultBillingTemplate || 'custom');
      setPdfVisibleFields(businessSettings?.pdfVisibleFields?.[businessSettings?.defaultBillingTemplate || 'custom'] || []);

      // Prefill first row
      setItems([
        {
          sn: 1,
          designNo: '',
          workType: 'Embroidery',
          description: '',
          size: '',
          qty: 1,
          rate: 0,
          amount: 0,
          smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 }
        }
      ]);
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
    }
  }, [editingInvoice, invoices, businessSettings]);

  // Compute Subtotal, Tax and Grand Total from items
  const { subtotal, taxAmount, grandTotal } = calculateTotals(items, taxPercentage, discountAmount);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  // Auto-sync Payment Status when totals or amountPaid change
  useEffect(() => {
    if (amountPaid >= grandTotal && grandTotal > 0) {
      setPaymentStatus('Paid');
    } else if (amountPaid === 0) {
      setPaymentStatus('Pending');
    } else if (amountPaid > 0 && amountPaid < grandTotal) {
      setPaymentStatus('Partially Paid');
    }
  }, [amountPaid, grandTotal]);

  // --- CRM AUTO-COMPLETE SELECTOR ---
  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    
    if (custId === '') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      return;
    }

    const client = customers.find(c => c.id === custId);
    if (client) {
      setCustomerName(client.name);
      setCustomerPhone(client.phone || '');
      setCustomerEmail(client.email || '');
      setCustomerAddress(client.address || '');
    }
  };

  // --- PRODUCT PREFILL SELECTOR ---
  const handleProductSelect = (index, productId) => {
    if (productId === '') return;
    
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const updated = [...items];
      updated[index].description = prod.name;
      updated[index].rate = prod.price;
      updated[index].amount = updated[index].qty * prod.price;
      setItems(updated);
    }
  };

  // --- ITEM ROW UPDATE ---
  const calculateItemAmount = (item) => {
    const qty = parseFloat(item.qty) || 0;
    if (billType === 'retail') {
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;
      return Math.max(0, (qty * price) - discount);
    } else if (billType === 'repair') {
      const parts = parseFloat(item.partsCost) || 0;
      const labour = parseFloat(item.labourCharge) || 0;
      return qty * (parts + labour);
    } else {
      const rate = parseFloat(item.rate !== undefined ? item.rate : (item.unitPrice !== undefined ? item.unitPrice : item.price)) || 0;
      return qty * rate;
    }
  };

  const handleItemChange = (index, field, value) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') return;
    const updated = [...items];
    const isNumField = ['qty', 'rate', 'price', 'unitPrice', 'discount', 'partsCost', 'labourCharge'].includes(field);
    const val = isNumField ? (value === '' ? '' : (parseFloat(value) || 0)) : value;
    
    updated[index][field] = val;
    updated[index].amount = calculateItemAmount(updated[index]);
    setItems(updated);
  };

  // --- ADD ITEM ROW ---
  const addItemRow = () => {
    if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') return;
    const nextDesignNo = items.length > 0 ? autoIncrementString(items[items.length - 1].designNo, items) : '';
    setItems([
      ...items,
      {
        sn: items.length + 1,
        designNo: nextDesignNo,
        workType: 'Embroidery',
        description: '',
        size: '',
        qty: 1,
        rate: 0,
        amount: 0,
        productName: '',
        unit: 'Piece',
        unitPrice: 0,
        category: '',
        sizeVariant: '',
        price: 0,
        discount: 0,
        serviceName: '',
        problemDetails: '',
        partsCost: 0,
        labourCharge: 0,
        itemService: '',
        smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 }
      }
    ]);
  };

  const addQuickFillItem = (workType, description, rate) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') return;
    const lastItem = items[items.length - 1];
    if (items.length > 0 && !lastItem.description && !lastItem.designNo && lastItem.rate === 0) {
      const updated = [...items];
      updated[items.length - 1] = {
        ...lastItem,
        workType,
        description,
        rate,
        amount: lastItem.qty * rate
      };
      setItems(updated);
    } else {
      const nextDesignNo = items.length > 0 ? autoIncrementString(items[items.length - 1].designNo, items) : '';
      setItems([
        ...items,
        {
          sn: items.length + 1,
          designNo: nextDesignNo,
          workType,
          description,
          size: '',
          qty: 1,
          rate,
          amount: 1 * rate,
          smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 }
        }
      ]);
    }
  };

  // --- DUPLICATE ROW ---
  const handleDuplicateItem = (index) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') return;
    const original = items[index];
    const nextDesignNo = autoIncrementString(original.designNo, items);
    const duplicated = {
      ...original,
      sn: items.length + 1,
      designNo: nextDesignNo,
      // Deep copy smartRate
      smartRate: original.smartRate ? { ...original.smartRate } : { repair: 0, punching: 0, embroidery: 0, other: 0 }
    };
    setItems([...items, duplicated]);
  };

  // --- REMOVE ROW ---
  const removeItemRow = (index) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') return;
    if (items.length === 1) return;
    const updated = items.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      sn: idx + 1
    }));
    setItems(updated);
  };

  // --- OPEN SMART RATE MODAL ---
  const openSmartRateCalculator = (index) => {
    setActiveItemIndex(index);
    const item = items[index];
    setSmartCharges(item.smartRate || { repair: 0, punching: 0, embroidery: 0, other: 0 });
    setShowSmartRate(true);
  };

  // --- PAYMENT STATUS ACTIONS ---
  const handleMarkAsPaid = () => {
    setPaymentStatus('PAID');
    setAmountPaid(grandTotal);
    logAudit('invoice_payment_marked_paid', 'invoice', editingInvoice?.id || 'new');
    toast.success('Marked as PAID. Invoice is now locked.');
  };

  const handleMarkAsUnpaid = () => {
    if (window.confirm('Are you sure you want to unlock this invoice and mark as Unpaid? This action will be audited.')) {
      setPaymentStatus('Pending');
      setAmountPaid(0);
      logAudit('invoice_payment_marked_unpaid', 'invoice', editingInvoice?.id || 'new');
      toast.success('Invoice unlocked and marked as Pending.');
    }
  };

  const handleVoidInvoice = () => {
    const reason = window.prompt('Reason for voiding this invoice:');
    if (reason !== null) {
      setPaymentStatus('VOID');
      setOrderStatus('Cancelled');
      logAudit('invoice_voided', 'invoice', editingInvoice?.id || 'new', null, { reason });
      toast.success('Invoice VOIDED and locked.');
    }
  };

  // --- APPLY SMART RATE VALUES ---
  const applySmartRate = () => {
    if (activeItemIndex === null) return;
    const totalRate = (parseFloat(smartCharges.repair) || 0) + 
                      (parseFloat(smartCharges.punching) || 0) + 
                      (parseFloat(smartCharges.embroidery) || 0) + 
                      (parseFloat(smartCharges.other) || 0);

    const updated = [...items];
    updated[activeItemIndex].rate = totalRate;
    updated[activeItemIndex].amount = updated[activeItemIndex].qty * totalRate;
    updated[activeItemIndex].smartRate = { ...smartCharges };
    setItems(updated);

    setShowSmartRate(false);
    setActiveItemIndex(null);
  };

  // --- SAVE OPERATION ---
  const handleSave = (statusOverride) => {
    if (!customerName) {
      alert('Please add customer name before saving the invoice.');
      return;
    }

    // Parse and sanitize items, defaulting empty quantities to 1 and empty rates to 0
    const cleanedItems = items.filter(item => 
      (item.description && item.description.trim() !== '') || 
      (item.designNo && item.designNo.trim() !== '') || 
      (parseFloat(item.rate) > 0)
    ).map(item => {
      const qty = parseFloat(item.qty);
      const rate = parseFloat(item.rate !== undefined ? item.rate : (item.unitPrice !== undefined ? item.unitPrice : item.price));
      return {
        ...item,
        qty: isNaN(qty) ? 1 : qty,
        rate: isNaN(rate) ? 0 : rate,
        amount: (isNaN(qty) ? 1 : qty) * (isNaN(rate) ? 0 : rate)
      };
    });

    if (cleanedItems.length === 0) {
      alert('Please add at least one invoice item description or code.');
      return;
    }

    // Check for negative quantities or rates
    const hasNegative = cleanedItems.some(item => item.qty < 0 || item.rate < 0);
    if (hasNegative) {
      alert('Quantity and rate cannot be negative values.');
      return;
    }
    const businessSnapshot = editingInvoice?.businessSnapshot || {
      businessName: businessSettings?.businessName || '',
      logoUrl: businessSettings?.logoUrl || '',
      ownerName: businessSettings?.ownerName || '',
      phone: businessSettings?.phone || '',
      whatsapp: businessSettings?.whatsapp || '',
      email: businessSettings?.email || '',
      address: businessSettings?.address || '',
      gstNumber: businessSettings?.gstNumber || ''
    };

    const paymentSettingsSnapshot = editingInvoice?.paymentSettingsSnapshot || {
      paymentQrEnabled: businessSettings?.paymentQrEnabled || false,
      paymentMethod: businessSettings?.paymentMethod || 'Manual',
      upiId: businessSettings?.upiId || '',
      bkashNumber: businessSettings?.bkashNumber || '',
      nagadNumber: businessSettings?.nagadNumber || '',
      rocketNumber: businessSettings?.rocketNumber || '',
      payeeName: businessSettings?.payeeName || businessSettings?.businessName || '',
      paymentNote: businessSettings?.paymentNote || '',
      customPaymentLink: businessSettings?.customPaymentLink || '',
      customerLiveLinkSettings: businessSettings?.customerLiveLinkSettings || {
        enableLiveInvoiceLink: true,
        showPaymentQr: true,
        allowCustomerPdfDownload: true,
        allowPaymentProofSubmit: true,
        showPaidDueAmount: true,
        showContactButton: true,
        requireTransactionId: true,
        requirePaymentScreenshot: false
      }
    };

    const regionalSettingsSnapshot = editingInvoice?.regionalSettingsSnapshot || {
      country: businessSettings?.country || 'India',
      currency: businessSettings?.currency || '₹',
      currencyCode: businessSettings?.currencyCode || (businessSettings?.country === 'Bangladesh' ? 'BDT' : businessSettings?.country === 'Other' ? 'USD' : 'INR'),
      language: businessSettings?.language || 'English',
      taxLabel: businessSettings?.taxLabel || (businessSettings?.country === 'Bangladesh' ? 'VAT' : businessSettings?.country === 'Other' ? 'Tax' : 'GST'),
      dateFormat: businessSettings?.dateFormat || 'DD/MM/YYYY',
      numberFormat: businessSettings?.numberFormat || 'Indian'
    };

    const payload = {
      id: editingInvoice ? editingInvoice.id : 'inv-' + Date.now(),
      invoiceNumber,
      date,
      dueDate,
      billType,
      customerId: selectedCustomerId || null,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items: cleanedItems,
      taxPercentage: parseFloat(taxPercentage) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      amountPaid: parseFloat(amountPaid) || 0,
      balanceDue: parseFloat(balanceDue) || 0,
      notes,
      terms,
      paymentStatus: typeof statusOverride === 'string' ? statusOverride : paymentStatus,
      orderStatus,
      subtotal,
      taxAmount,
      grandTotal,
      publicToken: editingInvoice?.publicToken || null,
      paymentHistory: editingInvoice?.paymentHistory || [],
      paymentProofs: paymentProofs,
      businessSnapshot,
      paymentSettingsSnapshot,
      regionalSettingsSnapshot
    };

    // Also pass saveCustomer flag so the parent can save the customer if requested
    onSaveInvoice(payload, saveCustomer && !selectedCustomerId);
  };


  const handleShareWhatsApp = () => {
    if (!customerPhone) {
      toast.error('Please enter customer phone number.');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');
    const activeCurrency = businessSettings?.currency || '₹';
    const msg = `Hello ${customerName || 'Customer'},

Here is your invoice *${invoiceNumber || 'Draft'}* for ${activeCurrency}${grandTotal}.
Amount Paid: ${activeCurrency}${amountPaid}
Balance Due: *${activeCurrency}${balanceDue}*

Thank you for your business!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!customerEmail) {
      toast.error('Please enter customer email.');
      return;
    }
    const activeCurrency = businessSettings?.currency || '₹';
    const subject = `Invoice ${invoiceNumber || 'Draft'} from ${businessSettings?.businessName || 'Business'}`;
    const body = `Hello ${customerName || 'Customer'},

Please find the details of your invoice ${invoiceNumber || 'Draft'}.

Total Amount: ${activeCurrency}${grandTotal}
Amount Paid: ${activeCurrency}${amountPaid}
Balance Due: ${activeCurrency}${balanceDue}

Thank you for your business!`;
    window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePdfClick = () => {
    generatePDF({ 
      items, invoiceNumber, date, dueDate, customerName, customerPhone, customerEmail, customerAddress, customerId, paymentType, paymentStatus, orderStatus, subtotal, taxPercentage, taxAmount, discountAmount, grandTotal, amountPaid, balanceDue, notes, terms, billType, businessSnapshot: businessSettings, paymentSettingsSnapshot: businessSettings, regionalSettingsSnapshot: businessSettings 
    }, businessSettings);
  };

  const [showBanner, setShowBanner] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  const handleDownloadPDF = () => {
    if (!customerName) {
      toast.error('Please add customer name before downloading PDF.');
      return;
    }
    const cleanedItems = items.filter(item => 
      (item.description && item.description.trim() !== '') || 
      (item.designNo && item.designNo.trim() !== '') || 
      (parseFloat(item.rate) > 0)
    ).map(item => {
      const qty = parseFloat(item.qty);
      const rate = parseFloat(item.rate !== undefined ? item.rate : (item.unitPrice !== undefined ? item.unitPrice : item.price));
      return {
        ...item,
        qty: isNaN(qty) ? 1 : qty,
        rate: isNaN(rate) ? 0 : rate,
        amount: (isNaN(qty) ? 1 : qty) * (isNaN(rate) ? 0 : rate)
      };
    });
    if (cleanedItems.length === 0) {
      toast.error('Please add at least one item before downloading PDF.');
      return;
    }
    if (onDownloadPDF) {
      onDownloadPDF({ 
        id: editingInvoice?.id || 'inv-temp', 
        invoiceNumber, 
        date, 
        dueDate, 
        customerName, 
        customerPhone, 
        customerEmail, 
        customerAddress, 
        items: cleanedItems, 
        taxPercentage, 
        discountAmount, 
        amountPaid, 
        notes, 
        terms, 
        paymentStatus, 
        orderStatus, 
        subtotal, 
        taxAmount, 
        grandTotal, 
        balanceDue 
      });
    }
  };

  const handleCopyLiveLink = async () => {
    const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
    if (!isLiveLinkEnabled) {
      toast.error('Live Link is disabled. Enable it from Settings.');
      return;
    }
    try {
      const token = await ensureInvoicePublicToken(editingInvoice);
      if (!token) {
        toast.error('Could not create live link. Please save invoice and try again.');
        return;
      }
      const liveLink = `${window.location.origin}/invoice/${token}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(liveLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = liveLink;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Live invoice link copied!');
    } catch (err) {
      toast.error('Could not create live link. Please save invoice and try again.');
    }
  };

  const handleSendWhatsAppReminder = () => {
    const regionalPrefs = editingInvoice?.regionalSettingsSnapshot || {
      currency: currencySymbol,
      numberFormat: businessSettings?.numberFormat || 'Indian'
    };
    const totalStr = formatCurrency(grandTotal, regionalPrefs.currency || currencySymbol, regionalPrefs.numberFormat);
    const msg = `Hi ${customerName},\nHere is your invoice ${invoiceNumber} for ${totalStr}.`;
    window.open(`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <motion.div 
      className="space-y-5 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Help Banner */}
      {showBanner && (
        <div className="bg-theme-accent-light border border-theme-border-soft rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative shadow-sm">
          <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 text-theme-accent hover:text-theme-accent">
            <X className="w-4 h-4" />
          </button>
          <div className="flex gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-theme-accent shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-theme-accent tracking-tight">Need a quick PDF?</h3>
              <p className="text-xs text-theme-accent/80 font-medium leading-relaxed mt-0.5">
                Fill the required fields marked with <span className="text-theme-danger font-black mx-1">*</span>, tap <span className="font-black">Preview</span>, and download your bill.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & PAGE TITLE */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-theme-primary">{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h1>
          <p className="text-sm font-bold text-theme-muted mt-1">Configure and generate a new bill</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowTopActions(!showTopActions)}
            className="flex items-center gap-2 px-4 py-2.5 bg-theme-surface hover:bg-theme-border-soft text-theme-primary font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
          >
            <span>Invoice Actions</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTopActions ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showTopActions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-56 bg-theme-card border border-theme-border-soft shadow-premium rounded-2xl p-2 z-50 flex flex-col gap-1"
              >
                <button onClick={() => { setShowTopActions(false); handleSave('Draft'); }} className="w-full text-left px-3 py-2 text-[13px] font-bold text-theme-primary hover:bg-theme-border-soft rounded-lg flex items-center gap-2 transition-all">
                  <Save className="w-4 h-4 text-theme-muted" /> Save Draft
                </button>
                <button onClick={() => { setShowTopActions(false); setShowPreview(true); }} className="w-full text-left px-3 py-2 text-[13px] font-bold text-theme-primary hover:bg-theme-border-soft rounded-lg flex items-center gap-2 transition-all">
                  <Eye className="w-4 h-4 text-theme-muted" /> Preview PDF
                </button>
                <button onClick={() => { setShowTopActions(false); handleDownloadPDF(); }} className="w-full text-left px-3 py-2 text-[13px] font-bold text-theme-primary hover:bg-theme-border-soft rounded-lg flex items-center gap-2 transition-all">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-theme-muted" /> : <Download className="w-4 h-4 text-theme-muted" />} Download PDF
                </button>
                
                <div className="h-px bg-theme-border-soft my-1" />
                
                <button onClick={() => { setShowTopActions(false); setIsLivePreviewOpen(true); }} className="w-full text-left px-3 py-2 text-[13px] font-bold text-theme-primary hover:bg-theme-border-soft rounded-lg flex items-center gap-2 transition-all">
                  <Eye className="w-4 h-4 text-theme-accent" /> Live Preview
                </button>

                <div className="h-px bg-theme-border-soft my-1" />
                
                <button 
                  disabled={!editingInvoice}
                  onClick={() => { setShowTopActions(false); if(editingInvoice) handleCopyLiveLink(); }}
                  className={`w-full text-left px-3 py-2 text-[13px] font-bold flex items-center gap-2 rounded-lg transition-all ${editingInvoice ? 'text-theme-primary hover:bg-theme-border-soft' : 'text-theme-muted cursor-not-allowed opacity-50'}`}
                >
                  <Link className="w-4 h-4 text-theme-muted" /> Copy Live Link
                </button>
                <button 
                  disabled={!editingInvoice || !customerPhone}
                  onClick={() => { setShowTopActions(false); if(editingInvoice && customerPhone) handleSendWhatsAppReminder(); }}
                  className={`w-full text-left px-3 py-2 text-[13px] font-bold flex items-center gap-2 rounded-lg transition-all ${editingInvoice && customerPhone ? 'text-theme-primary hover:bg-theme-border-soft' : 'text-theme-muted cursor-not-allowed opacity-50'}`}
                >
                  <Send className="w-4 h-4 text-theme-muted" /> Send WhatsApp Reminder
                </button>
                
                <div className="h-px bg-theme-border-soft my-1" />
                
                <button onClick={() => { setShowTopActions(false); handleSave(); }} className="w-full text-left px-3 py-2 text-[13px] font-bold text-theme-button-text bg-theme-accent hover:opacity-90 rounded-lg flex items-center gap-2 transition-all shadow-sm">
                  <Check className="w-4 h-4" /> Save Invoice
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MAIN LAYOUT: CENTERED FORM */}
      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
        
        {/* CENTERED COLUMN: WIZARD STEPS */}
        <div className="w-full space-y-5">
          
          {/* STEP 1: CONFIGURATION & CRM */}
          <div className="space-y-5">
          
          {/* Bill Type / Business Type Selector */}
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-theme-accent" />
                <div>
                  <h3 className="text-sm font-extrabold text-theme-primary">Step 1: Bill Template</h3>
                  <p className="text-[10px] text-theme-muted font-bold">Select your business template</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfSettings(true)}
                className="px-3 py-1.5 bg-theme-surface hover:bg-theme-border-soft text-theme-primary font-bold text-[10px] rounded-xl flex items-center gap-1.5 transition-all border border-theme-border-soft shrink-0"
              >
                <LayoutTemplate className="w-3 h-3 text-theme-accent" />
                PDF Fields
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {[
                { id: 'embroidery', emoji: '🧵', label: 'Embroidery', sub: 'Fashion' },
                { id: 'grocery',   emoji: '🛒', label: 'Grocery',   sub: 'Mudi Shop' },
                { id: 'repair',    emoji: '🔧', label: 'Repair',    sub: 'Service' },
                { id: 'retail',    emoji: '🛍️', label: 'Retail',    sub: 'Shopping' },
                { id: 'custom',    emoji: '📝', label: 'Custom',    sub: 'Bill' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    if (items.length > 1 || (items[0] && (items[0].amount > 0 || items[0].description)))
                      if(!window.confirm('Changing template may reset some column data. Continue?')) return;
                    setBillType(type.id);
                    setPdfVisibleFields(businessSettings?.pdfVisibleFields?.[type.id] || []);
                  }}
                  className={`py-3 px-2 rounded-2xl text-center leading-tight transition-all border-2 ${
                    billType === type.id
                    ? 'bg-theme-accent text-white border-theme-accent shadow-md shadow-theme-accent/20 scale-100'
                    : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:bg-theme-surface/80 hover:border-theme-accent/50 hover:text-theme-primary'
                  }`}
                >
                  <div className="text-xl md:text-2xl mb-1">{type.emoji}</div>
                  <div className="text-[11px] font-extrabold">{type.label}</div>
                  <div className={`text-[9px] font-bold ${ billType === type.id ? 'text-white/80' : 'text-theme-muted/70'}`}>{type.sub}</div>
                </button>
              ))}
            </div>

            {/* Live column preview chips */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-theme-border-soft">
              <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider py-1 mr-1">Columns:</span>
              {(
                billType === 'embroidery' ? ['Design No','Work Type','Description','Size','Qty','Rate','Amount'] :
                billType === 'grocery'   ? ['Product Name','Unit','Qty','Unit Price','Amount'] :
                billType === 'repair'    ? ['Service/Item','Problem Details','Parts Cost','Labour','Qty','Amount'] :
                billType === 'retail'    ? ['Product Name','Category','Size/Variant','Qty','Price','Discount','Amount'] :
                                          ['Item/Service','Description','Qty','Rate','Amount']
              ).map((col, i) => (
                <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  col === 'Amount'
                    ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20'
                    : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
                }`}>{col}</span>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary border-b border-theme-border-soft pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-accent" />
              <span>Invoicing Metadata</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-theme-muted">
              <div>
                <label className="block mb-1.5 text-theme-muted">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold uppercase"
                />
                <p className="text-[10px] text-theme-muted mt-1.5 leading-tight">
                  Invoice number is generated automatically, but you can edit it if needed.
                </p>
              </div>
              <div>
                <label className="block mb-1.5 text-theme-muted">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-theme-muted">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>
            </div>
          </div>

          {/* Customer CRM Selector */}
          <div id="crm-section" className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-4 relative scroll-mt-6">
            <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary flex items-center gap-2">
                  <User className="w-4 h-4 text-theme-accent" />
                  <span>Step 2: Client & Customer</span>
                </h3>
                <p className="text-[10px] text-theme-muted font-bold mt-1">Customer details will appear on the invoice PDF.</p>
              </div>
              
              <span className="text-[10px] bg-theme-accent-light text-theme-accent font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:block">
                SaaS CRM Integrated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-theme-muted">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-theme-muted">Select Customer from CRM (Automatic Prefill)</label>
                  <button
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-theme-accent bg-theme-accent-light hover:bg-theme-accent-light px-2.5 py-1 rounded-lg transition-colors border border-theme-border-soft"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add Customer
                  </button>
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold"
                >
                  <option value="">-- Manual Client Entry --</option>
                  {customers.map((c) => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[10px] text-theme-warning mt-1.5 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> No customers found. Add customer details manually below.
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-theme-muted">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Acme Embroidery"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-theme-muted">Phone Number * <span className="font-normal text-[10px]">(WhatsApp Ready)</span></label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-theme-muted">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@customer.com"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-theme-muted">Billing Address *</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Garment Street..."
                  rows="2"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary leading-relaxed text-xs"
                />
              </div>

              {!selectedCustomerId && (
                <div className="sm:col-span-2 flex items-center gap-2 mt-1 bg-theme-surface dark:bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <input
                    type="checkbox"
                    id="saveCustomer"
                    checked={saveCustomer}
                    onChange={(e) => setSaveCustomer(e.target.checked)}
                    className="w-4 h-4 text-theme-accent rounded border-theme-border-soft focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="saveCustomer" className="text-xs font-bold text-theme-accent cursor-pointer select-none">
                    Save this customer for future invoices
                  </label>
                </div>
              )}
            </div>
          </div>
          </div>

        {/* STEP 2: ITEMS */}
        <div className="space-y-5">
          {/* Premium Smart Item Table */}
          <div id="items-section" className="bg-theme-card dark:bg-theme-card rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium overflow-hidden scroll-mt-6">
            {/* Table Header Bar */}
            <div className="bg-theme-surface border-b border-theme-border-soft px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-theme-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-theme-primary">Step 3: Invoice Items Sheet</h3>
                  <p className="text-[10px] text-theme-muted font-bold">Qty × Rate = Amount (auto-calculated)</p>
                </div>
                <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-theme-accent/10 text-theme-accent border border-theme-accent/20 hidden md:block ml-2">⚡ Smart Rates On</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowPdfSettings(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-card dark:bg-theme-card/50 hover:bg-theme-card/80 dark:hover:bg-theme-card text-theme-primary rounded-lg text-xs font-bold transition-colors border border-theme-border-soft cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-theme-muted" />
                  <span>Customize PDF</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[image:var(--accent-gradient)] text-theme-button-text hover:opacity-90 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer border-0"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Sheet</span>
                </motion.button>
              </div>
            </div>

            <div className="p-4 md:p-5 space-y-4">

            <div className="flex gap-2 flex-wrap pb-3 mb-1 border-b border-theme-border-soft dark:border-theme-border-soft">
              <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider py-1.5 mr-1">Quick Fill:</span>
              <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3 py-1.5 bg-theme-accent-light text-theme-accent border border-theme-border-soft hover:bg-theme-accent-light rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">🧵 Embroidery Work</button>
              <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3 py-1.5 bg-theme-warning/5 text-amber-700 border border-amber-100 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">🔧 Repair Work</button>
              <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3 py-1.5 bg-theme-accent-light text-theme-accent border border-theme-border-soft hover:bg-theme-accent-light rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">📝 Custom Design</button>
            </div>

            {/* Desktop Headers + Items */}
            {/* WIZARD STEP 1 NEXT BUTTON */}
            <div className="flex justify-end pt-4">
              <button onClick={() => setCurrentStep(2)} className="bg-[image:var(--accent-gradient)] text-white px-6 py-3 rounded-xl font-black shadow-md shadow-theme-glow flex items-center gap-2 hover:scale-105 transition-all">
                Next: Items <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* STEP 2: ITEMS SECTION */}
          <div className={currentStep === 2 ? 'block space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <div className="flex items-center justify-between bg-theme-card border border-theme-border-soft rounded-3xl p-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2 text-theme-primary"><Layers className="w-4 h-4 text-theme-accent" /> Items & Services</h3>
                <p className="text-[10px] text-theme-muted font-bold">Add products or services to this bill</p>
              </div>
              <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-theme-muted hover:text-theme-primary flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 -mx-1 px-1">
              <div className="lg:min-w-[900px] flex flex-col">
                {/* Column headers - desktop only */}
                <div className="hidden lg:grid gap-2 text-[10px] font-black text-theme-muted uppercase tracking-wider px-3 pb-2 mb-0 border-b-2 border-theme-border-soft dark:border-theme-border-soft" style={{ gridTemplateColumns: getGridCols() }}>
                  <div className="text-center">#</div>
                  {billType === 'grocery' ? (
                    <>
                      <div>Product Name</div>
                      <div className="text-center">Unit</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Unit Price</div>
                    </>
                  ) : billType === 'repair' ? (
                    <>
                      <div>Service / Item</div>
                      <div>Problem / Details</div>
                      <div className="text-right">Parts Cost</div>
                      <div className="text-right">Labour</div>
                      <div className="text-center">Qty</div>
                    </>
                  ) : billType === 'retail' ? (
                    <>
                      <div>Product Name</div>
                      <div>Category</div>
                      <div className="text-center">Size/Variant</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Price</div>
                      <div className="text-right">Discount</div>
                    </>
                  ) : billType === 'custom' ? (
                    <>
                      <div>Item / Service</div>
                      <div>Description</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  ) : (
                    <>
                      <div>Design / Item Code</div>
                      <div>Work Type</div>
                      <div>Description</div>
                      <div className="text-center">Size</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  )}
                  <div className="text-right">Amount</div>
                  <div className="text-center">Actions</div>
                </div>

                <div className="space-y-2 lg:space-y-1.5">
                  {items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex flex-col lg:grid items-center gap-2 px-3 py-3 lg:py-2 bg-theme-card dark:bg-theme-card lg:bg-theme-app dark:bg-theme-surface/60 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft lg:border-theme-border-soft dark:border-theme-border-soft/80 shadow-sm lg:shadow-none"
                      style={{ gridTemplateColumns: getGridCols() }}
                    >
                  
                  {/* Mobile: Item header with number + delete */}
                  <div className="flex justify-between items-center lg:hidden mb-1">
                    <span className="text-xs font-black text-theme-primary dark:text-theme-muted bg-theme-surface dark:bg-theme-card px-3 py-1 rounded-full">Item #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        className="flex items-center gap-1 text-[10px] font-bold text-theme-accent bg-theme-accent-light border border-theme-border-soft py-1.5 px-3 rounded-lg"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicate</span>
                      </button>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(index)}
                          className="flex items-center gap-1 text-[10px] font-bold text-theme-danger bg-theme-danger/5 border border-rose-100 py-1.5 px-3 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* S.N. (Desktop only) */}
                  <div className="hidden lg:flex items-center justify-center min-h-[48px]">
                    <span className="text-[13px] font-extrabold text-theme-muted w-8 h-8 flex items-center justify-center bg-theme-surface dark:bg-theme-card rounded-full">{index + 1}</span>
                  </div>

                  {/* Design No - embroidery only */}
                  {(billType === 'embroidery') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Design / Item Code</label>
                      <input
                        type="text"
                        value={item.designNo || ''}
                        onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                        placeholder="e.g. SO-5"
                        className="w-full px-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm uppercase tracking-wide transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Service Name */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Service / Item Name</label>
                      <input
                        type="text"
                        value={item.serviceName || ''}
                        onChange={(e) => handleItemChange(index, 'serviceName', e.target.value)}
                        placeholder="e.g. Mobile Screen"
                        className="w-full px-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Retail: Product Name */}
                  {billType === 'retail' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Product Name</label>
                      <input
                        type="text"
                        value={item.productName || ''}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        placeholder="e.g. Denim Jeans"
                        className="w-full px-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Custom: Item / Service */}
                  {billType === 'custom' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Item / Service</label>
                      <input
                        type="text"
                        value={item.itemService || ''}
                        onChange={(e) => handleItemChange(index, 'itemService', e.target.value)}
                        placeholder="e.g. Design Work"
                        className="w-full px-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Work Type - embroidery only */}
                  {billType === 'embroidery' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Work Type</label>
                      <select
                        value={item.workType || 'Embroidery'}
                        onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                        className="w-full px-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[13px] transition-all appearance-auto truncate"
                      >
                        <option value="Embroidery">Embroidery</option>
                        <option value="Stitching">Stitching</option>
                        <option value="Printing">Printing</option>
                        <option value="Design Work">Design Work</option>
                        <option value="Repair">Repair</option>
                        <option value="Other Service">Other Service</option>
                      </select>
                    </div>
                  )}

                  {/* Retail: Category */}
                  {billType === 'retail' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Category</label>
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        placeholder="e.g. Clothing"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Problem / Details */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Problem / Details</label>
                      <input
                        type="text"
                        value={item.problemDetails || ''}
                        onChange={(e) => handleItemChange(index, 'problemDetails', e.target.value)}
                        placeholder="e.g. Screen Cracked"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Description / Product Name - grocery, embroidery */}
                  {(billType !== 'repair' && billType !== 'retail' && billType !== 'custom') && (
                    <div className="space-y-1.5">
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">
                        {billType === 'grocery' ? 'Product Name' : 'Description'}
                      </label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder={
                          billType === 'grocery' ? "e.g. Basmati Rice 1kg" :
                          "e.g. Embroidery Work on Shirt"
                        }
                        className="w-full px-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                      {/* Catalog Helper */}
                      <select
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        defaultValue=""
                        className="text-[9px] bg-theme-surface dark:bg-theme-card border-0 text-theme-muted py-1 px-2 rounded-lg focus:outline-none cursor-pointer w-full hover:bg-theme-border-soft transition-colors"
                      >
                        <option value="">📦 Quick Prefill from Catalog...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({currencySymbol}{p.price})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom: Description */}
                  {billType === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Description</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="e.g. Custom design on 4x4 cloth"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Size / Unit - not for repair/retail/custom */}
                  {(billType !== 'repair' && billType !== 'retail' && billType !== 'custom') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">
                        {billType === 'grocery' ? 'Unit' : 'Size'}
                      </label>
                      {billType === 'grocery' ? (
                        <select
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          className="w-full px-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[13px] transition-all"
                        >
                          <option value="">Select</option>
                          <option value="Kg">Kg</option>
                          <option value="Gram">Gram</option>
                          <option value="Litre">Litre</option>
                          <option value="Ml">Ml</option>
                          <option value="Packet">Packet</option>
                          <option value="Piece">Piece</option>
                          <option value="Box">Box</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          placeholder="e.g. L/XL"
                          className="w-full px-2 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                        />
                      )}
                    </div>
                  )}

                  {/* Retail: Size/Variant */}
                  {billType === 'retail' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Size / Variant</label>
                      <input
                        type="text"
                        value={item.sizeVariant || ''}
                        onChange={(e) => handleItemChange(index, 'sizeVariant', e.target.value)}
                        placeholder="e.g. 32 inch"
                        className="w-full px-2 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-sm transition-all placeholder:text-theme-muted placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Parts Cost */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Parts Cost</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-sm">{currencySymbol}</span>
                        <input
                          type="number" min="0"
                          value={item.partsCost ?? ''}
                          onChange={(e) => handleItemChange(index, 'partsCost', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted"
                        />
                      </div>
                    </div>
                  )}

                  {/* Repair: Labour Charge */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Labour Charge</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-sm">{currencySymbol}</span>
                        <input
                          type="number" min="0"
                          value={item.labourCharge ?? ''}
                          onChange={(e) => handleItemChange(index, 'labourCharge', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-3 min-h-[48px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qty */}
                  <div>
                    <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Quantity</label>
                    <input
                      type="number"
                      min="0.01" step="any"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full px-2 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all"
                    />
                  </div>

                  {/* Rate / Unit Price - not for repair or retail */}
                  {(billType !== 'repair' && billType !== 'retail') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">
                        {billType === 'grocery' ? 'Unit Price' : 'Rate per item'}
                      </label>
                      <div className="flex gap-1 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted font-extrabold text-sm select-none">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0" step="any"
                            value={item.rate ?? ''}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted"
                          />
                        </div>
                        {billType !== 'grocery' && (
                          <button
                            type="button"
                            onClick={() => openSmartRateCalculator(index)}
                            title="Calculate using sub-charges"
                            className="bg-theme-accent-light text-theme-accent hover:bg-theme-accent-light w-10 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 hidden lg:flex border border-theme-border-soft"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Retail: Price & Discount */}
                  {billType === 'retail' && (
                    <>
                      <div>
                        <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Price ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-sm">{currencySymbol}</span>
                          <input type="number" min="0" step="any"
                            value={item.price ?? ''}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-sm transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-danger uppercase tracking-wide">Discount ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-danger font-bold text-sm">-</span>
                          <input type="number" min="0" step="any"
                            value={item.discount ?? ''}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-6 pr-3 py-3.5 min-h-[52px] bg-theme-card dark:bg-theme-card border border-rose-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 focus:border-rose-400 text-theme-danger font-extrabold text-sm transition-all placeholder:text-rose-200"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Row Total - Amount (auto-calculated, read-only) */}
                  <div className="flex flex-col justify-center">
                    <label className="lg:hidden block mb-1 text-[10px] font-bold text-theme-accent uppercase tracking-wide">Amount (auto-calculated)</label>
                    <div className="min-h-[52px] flex items-center justify-end px-4 py-2 bg-[image:var(--accent-gradient)]/30 border border-theme-border-soft/60 shadow-inner rounded-xl w-full">
                      <div className="text-right">
                        <span className="block text-theme-accent font-black text-[15px] leading-tight tabular-nums">
                          {currencySymbol}{(item.amount ?? (item.qty * (item.rate || 0))).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-theme-accent font-bold uppercase tracking-wider hidden lg:block">
                          {billType === 'retail'
                            ? `${item.qty || 0}×${currencySymbol}${item.price || 0}-${currencySymbol}${item.discount || 0}`
                            : billType === 'repair'
                            ? `${item.qty || 0}×(${currencySymbol}${item.partsCost || 0}+${currencySymbol}${item.labourCharge || 0})`
                            : `${item.qty || 0}×${currencySymbol}${item.rate || 0}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Desktop) */}
                  <div className="hidden lg:flex items-center justify-center gap-1.5 min-h-[52px]">
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(index)}
                      title="Duplicate item"
                      className="flex flex-col items-center gap-1 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light/80 transition-all p-2 rounded-xl group"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wide group-hover:text-theme-accent">Copy</span>
                    </button>
                    
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        title="Remove item"
                        className="flex flex-col items-center gap-1 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5/80 transition-all p-2 rounded-xl group"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-wide group-hover:text-theme-danger">Del</span>
                      </button>
                    ) : (
                      <div className="w-10 h-10" />
                    )}
                  </div>

                  {/* Mobile: Smart Rate button at bottom */}
                  {billType !== 'grocery' && billType !== 'repair' && billType !== 'retail' && (
                    <div className="lg:hidden pt-2 border-t border-theme-border-soft dark:border-theme-border-soft">
                      <button
                        type="button"
                        onClick={() => openSmartRateCalculator(index)}
                        className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-theme-accent bg-theme-accent-light border border-theme-border-soft py-2 rounded-xl transition-colors"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Open Smart Rate Calculator</span>
                      </button>
                    </div>
                  )}

                </div>
              ))}
                </div>
              </div>
            </div>
            </div>{/* end inner p-5 wrapper */}
            {/* Items footer: Add Item + mini totals */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-4 md:px-5 py-3 border-t border-theme-border-soft dark:border-theme-border-soft gap-3 bg-theme-app dark:bg-theme-surface/50">
              <button
                onClick={addItemRow}
                className="flex items-center gap-2 text-xs font-extrabold text-white transition-all w-fit px-5 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl shadow-md shadow-glow hover:shadow-lg hover:shadow-theme-glow hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item Line</span>
              </button>

              <div className="bg-theme-card dark:bg-theme-card p-3 rounded-2xl w-full sm:w-64 space-y-1.5 shadow-sm border border-theme-border-soft dark:border-theme-border-soft">
                <div className="flex justify-between text-xs font-semibold text-theme-muted">
                  <span>Items Total:</span>
                  <span className="font-extrabold text-theme-primary dark:text-theme-muted">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-semibold text-theme-danger">
                    <span>Discount:</span>
                    <span>-{currencySymbol}{discountAmount}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-semibold text-theme-muted">
                    <span>Tax:</span>
                    <span>+{currencySymbol}{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-theme-button-text bg-[image:var(--accent-gradient)] rounded-xl px-3 py-2 mt-1 shadow-glow border-0">
                  <span>Grand Total</span>
                  <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BILLING / TAX / TOTALS - Compact */}
        <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border-soft pb-3">
            <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
              <Calculator className="w-4 h-4 text-theme-accent" />
              <span>Billing / Tax / Totals</span>
            </h3>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent border border-theme-accent/20">Auto-calculated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 text-xs font-semibold text-theme-muted">
            <div className="flex flex-col gap-2">
              <label className="block text-theme-muted">Payment Status</label>
              {(paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID') ? (
                <div className="w-full px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-theme-primary font-extrabold opacity-70 flex justify-between items-center">
                  <span>{paymentStatus.toUpperCase()}</span>
                  {paymentStatus !== 'VOID' && (
                    <button onClick={handleMarkAsUnpaid} className="text-[10px] text-theme-danger hover:underline">Mark Unpaid</button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-extrabold">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                  <button type="button" onClick={handleMarkAsPaid} className="px-3 py-2.5 bg-green-500/10 text-green-600 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-green-500/20">Mark PAID</button>
                </div>
              )}
              {editingInvoice && paymentStatus !== 'VOID' && (
                <button type="button" onClick={handleVoidInvoice} className="text-left text-[10px] font-bold text-theme-danger hover:underline w-max">Void Invoice</button>
              )}
            </div>
            <div>
              <label className="block mb-1 text-theme-muted">Order Status</label>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-extrabold">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-theme-muted flex items-center gap-1">
                <Percent className="w-3 h-3" />
                <span>GST/Tax Rate (%)</span>
              </label>
              <input type="number" min="0" max="100" value={taxPercentage} disabled={paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID'} onChange={(e) => setTaxPercentage(e.target.value)} className={`w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold ${paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID' ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block mb-1 text-theme-muted flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>Flat Discount ({currencySymbol})</span>
              </label>
              <input type="number" min="0" value={discountAmount} disabled={paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID'} onChange={(e) => setDiscountAmount(e.target.value)} className={`w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold ${paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus === 'VOID' ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block mb-1 text-theme-muted">Amount Paid ({currencySymbol})</label>
              <input type="number" min="0" max={grandTotal} value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-black" />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex justify-between items-center bg-theme-app dark:bg-theme-surface p-2.5 rounded-xl h-[42px]">
                <span className="text-[10px] uppercase font-bold text-theme-muted">Balance</span>
                <span className={`text-sm font-black ${balanceDue > 0 ? 'text-theme-warning' : 'text-theme-accent'}`}>{currencySymbol}{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms inline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Customer Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business!" rows="1" className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary text-xs" />
            </div>
            <div>
              <label className="block mb-1 text-[10px] font-bold text-theme-muted uppercase tracking-wide">Terms & Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="1. Payment is due within 30 days..." rows="1" className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary text-xs" />
            </div>
          </div>

          {/* Grand Total row */}
          <div className="flex items-center justify-between border-t border-theme-border-soft pt-3">
            <div className="flex gap-4 text-[11px] text-theme-muted flex-wrap">
              <span>Subtotal: <strong className="text-theme-primary">{currencySymbol}{subtotal.toFixed(2)}</strong></span>
              {discountAmount > 0 && <span className="text-theme-danger">Discount: -{currencySymbol}{parseFloat(discountAmount).toFixed(2)}</span>}
              <span>Tax ({taxPercentage}%): <strong className="text-theme-primary">{currencySymbol}{taxAmount.toFixed(2)}</strong></span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-extrabold text-theme-primary">Grand Total</span>
              <span className="text-lg font-black text-theme-accent">{currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* INVOICE ACTIONS - Compact */}
        <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => handleSave('Draft')} className="h-[44px] bg-theme-surface dark:bg-theme-card text-theme-primary rounded-xl font-bold hover:bg-theme-border-soft transition-all flex items-center justify-center gap-2 text-[12px] border border-theme-border-soft/50 shadow-sm">
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button onClick={() => setShowPreview(true)} className="h-[44px] bg-theme-surface dark:bg-theme-card text-theme-primary rounded-xl font-bold hover:bg-theme-border-soft transition-all flex items-center justify-center gap-2 text-[12px] border border-theme-border-soft/50 shadow-sm">
              <Eye className="w-3.5 h-3.5" /> Preview PDF
            </button>
            <button onClick={handlePdfClick} disabled={isGenerating} className="h-[44px] bg-theme-surface dark:bg-theme-card border border-theme-accent text-theme-accent rounded-xl font-bold hover:bg-theme-accent-light transition-all flex items-center justify-center gap-2 text-[12px] shadow-sm cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={() => handleSave()} className="h-[44px] bg-[image:var(--accent-gradient)] text-theme-button-text rounded-xl font-bold hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 text-[12px] cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Save Invoice
            </button>
            <button onClick={() => { if(editingInvoice) handleCopyLiveLink(); }} disabled={!editingInvoice} className={`h-[44px] rounded-xl font-bold flex items-center justify-center gap-2 text-[12px] transition-all shadow-sm border ${editingInvoice ? 'bg-theme-surface border-theme-border-soft text-theme-primary hover:bg-theme-border-soft cursor-pointer' : 'bg-theme-surface/50 border-theme-border-soft/40 text-theme-muted cursor-not-allowed'}`}>
              <Link className="w-3.5 h-3.5" /> Copy Live Link
            </button>
            <button onClick={() => { if(editingInvoice && customerPhone) handleSendWhatsAppReminder(); }} disabled={!editingInvoice || !customerPhone} className={`h-[44px] rounded-xl font-bold flex items-center justify-center gap-2 text-[12px] transition-all shadow-sm border ${(editingInvoice && customerPhone) ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 cursor-pointer' : 'bg-theme-surface/50 border-theme-border-soft/40 text-theme-muted cursor-not-allowed'}`}>
              <Send className="w-3.5 h-3.5" /> WhatsApp Reminder
            </button>
          </div>
        </div>
        </div>
        {/* CLOSE CENTERED COLUMN */}
      </div>

      {/* LIVE PREVIEW MODAL */}
      <AnimatePresence>
        {isLivePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsLivePreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-theme-card rounded-3xl shadow-2xl border border-theme-border-soft overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-theme-accent-light px-5 py-4 flex items-center justify-between border-b border-theme-accent/20 shrink-0">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-theme-accent" />
                  <h3 className="text-sm font-bold text-theme-accent uppercase tracking-wider">Live Invoice Preview</h3>
                  <span className="text-[10px] font-black bg-theme-accent text-white px-2.5 py-1 rounded-full shadow-glow ml-2">Auto-updating</span>
                </div>
                <button
                  onClick={() => setIsLivePreviewOpen(false)}
                  className="p-1.5 hover:bg-theme-border-soft rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-theme-primary" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-gray-50/50 dark:bg-black/20">
                <div className="mx-auto w-full max-w-[800px] scale-[0.85] sm:scale-95 md:scale-100 origin-top p-4 md:p-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <InvoicePreview 
                      invoice={{ 
                        invoiceNumber, date, dueDate, customerName, customerPhone, 
                        customerEmail, customerAddress, items, taxPercentage, discountAmount, 
                        amountPaid, notes, terms, paymentStatus, orderStatus, billType, 
                        pdfVisibleFields, businessSnapshot: businessSettings 
                      }} 
                      currencySymbol={currencySymbol} 
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-theme-app dark:bg-theme-surface p-4 flex gap-3 border-t border-theme-border-soft shrink-0 justify-end">
                <button
                  onClick={() => setIsLivePreviewOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-theme-primary hover:bg-theme-border-soft rounded-xl transition-all border border-theme-border-soft"
                >
                  Close
                </button>
                <button
                  onClick={handlePdfClick} disabled={isGenerating}
                  className="px-5 py-2.5 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGenerating ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* SMART COMPOSITE RATE MODAL */}
      {showSmartRate && activeItemIndex !== null && (
        <div className="fixed inset-0 bg-theme-card/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl max-w-md w-full shadow-2xl border border-theme-border-soft dark:border-theme-border-soft overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Smart Rate Composite</span>
                </h4>
                <span className="text-[10px] bg-theme-card dark:bg-theme-card/20 text-white font-bold py-1 px-2.5 rounded-full">
                  Item #{activeItemIndex + 1}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-bold mt-1.5">
                Design: {items[activeItemIndex]?.designNo || 'N/A'} • {items[activeItemIndex]?.workType || 'Standard'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-theme-muted font-bold leading-relaxed">
                Embroidery jobs typically sum multiple service adders. Enter sub-charges to automatically sum the composite row rate.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-theme-muted">
                <div>
                  <label className="block mb-1 text-theme-muted">Embroidery Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.embroidery || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, embroidery: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Punching Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.punching || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, punching: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Repair Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.repair || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, repair: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Other/Misc Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.other || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, other: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>
              </div>

              {/* Real-time Composite Tally */}
              <div className="bg-theme-surface dark:bg-theme-surface rounded-2xl p-4 border border-theme-border-soft flex justify-between items-center mt-6">
                <div>
                  <span className="text-[10px] text-theme-muted font-extrabold uppercase block leading-none">Composite Rate</span>
                  <span className="text-xs text-theme-accent font-bold mt-1 block">Live Summed Total</span>
                </div>
                <span className="text-2xl font-black text-theme-accent">
                  {currencySymbol}
                  {((parseFloat(smartCharges.repair) || 0) + 
                    (parseFloat(smartCharges.punching) || 0) + 
                    (parseFloat(smartCharges.embroidery) || 0) + 
                    (parseFloat(smartCharges.other) || 0)).toFixed(2)}
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-theme-app dark:bg-theme-surface p-4 flex gap-3 border-t border-theme-border-soft dark:border-theme-border-soft">
              <button
                type="button"
                onClick={() => {
                  setShowSmartRate(false);
                  setActiveItemIndex(null);
                }}
                className="flex-1 py-3 text-xs font-extrabold text-theme-muted hover:text-theme-primary dark:text-theme-primary hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-all"
              >
                Cancel / Discard
              </button>
              
              <button
                type="button"
                onClick={applySmartRate}
                className="flex-1 py-3 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Composite Rate</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}
      <AnimatePresence>
        {isSheetExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-card/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-theme-card dark:bg-theme-card md:rounded-3xl shadow-2xl w-full h-full md:w-[98vw] md:max-w-[1550px] md:h-[90vh] flex flex-col overflow-hidden"
            >
            {/* Modal Header */}
            <div className="bg-theme-surface border-b border-theme-border-soft px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-theme-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-theme-primary">Invoice Items Sheet</h3>
                  <p className="text-xs text-theme-muted font-medium">Template: <span className="text-theme-accent font-bold capitalize">{billType}</span> | Add products or services.</p>
                </div>
              </div>
              <button onClick={() => setIsSheetExpanded(false)} className="p-2 hover:bg-theme-card dark:bg-theme-card/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-theme-muted" />
              </button>
            </div>

            {/* Quick Fill & Body */}
            <div className="flex-1 overflow-y-auto bg-theme-app dark:bg-theme-surface">
              <div className="p-4 md:p-6 space-y-6 max-w-full">
                
                <div className="flex gap-2 flex-wrap pb-4 border-b border-theme-border-soft/60">
                  <span className="text-[11px] text-theme-muted font-black uppercase tracking-widest py-1.5 mr-2">Quick Fill:</span>
                  <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-theme-accent border border-theme-border-soft hover:border-theme-accent hover:bg-theme-accent-light shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🧵 Embroidery</button>
                  <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-amber-700 border border-theme-warning/30 hover:border-amber-400 hover:bg-theme-warning/5 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🔧 Repair</button>
                  <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-theme-accent border border-theme-border-soft hover:border-theme-accent hover:bg-theme-accent-light shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">📝 Custom Design</button>
                </div>

                <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="min-w-max w-full flex flex-col px-1">
                    {/* Table Headers */}
                    <div className="hidden lg:grid gap-3 text-[11px] font-black text-theme-muted uppercase tracking-widest px-4 pb-3 border-b-2 border-theme-border-soft" style={{ gridTemplateColumns: getExpandedGridCols() }}>
                  <div className="text-center">#</div>
                  {billType === 'grocery' ? (
                    <>
                      <div>Product Name</div>
                      <div className="text-center">Unit</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Unit Price</div>
                    </>
                  ) : billType === 'repair' ? (
                    <>
                      <div>Service / Item</div>
                      <div>Problem / Details</div>
                      <div className="text-right">Parts Cost</div>
                      <div className="text-right">Labour</div>
                      <div className="text-center">Qty</div>
                    </>
                  ) : billType === 'retail' ? (
                    <>
                      <div>Product Name</div>
                      <div>Category</div>
                      <div className="text-center">Size/Variant</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Price</div>
                      <div className="text-right">Discount</div>
                    </>
                  ) : billType === 'custom' ? (
                    <>
                      <div>Item / Service</div>
                      <div>Description</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  ) : (
                    <>
                      <div>Design / Item Code</div>
                      <div>Work Type</div>
                      <div>Description</div>
                      <div className="text-center">Size</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  )}
                  <div className="text-right">Amount</div>
                  <div className="text-center">Actions</div>
                </div>

                {/* Expanded Items Map */}
                <div className="space-y-3 lg:space-y-2">
                  {items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex flex-col lg:grid items-center gap-3 lg:gap-3 px-4 py-4 lg:py-2.5 bg-theme-card dark:bg-theme-card rounded-2xl border border-theme-border-soft shadow-sm hover:border-theme-border-soft transition-colors"
                      style={{ gridTemplateColumns: getExpandedGridCols() }}
                    >
                      {/* Mobile Header */}
                      <div className="flex justify-between items-center w-full lg:hidden mb-2 pb-2 border-b border-theme-border-soft dark:border-theme-border-soft">
                        <span className="text-sm font-black text-theme-primary dark:text-theme-muted bg-theme-surface dark:bg-theme-card px-3 py-1 rounded-xl">Item #{index + 1}</span>
                      </div>

                      {/* Desktop S.N. */}
                      <div className="hidden lg:flex items-center justify-center min-h-[52px]">
                        <span className="text-sm font-extrabold text-theme-muted w-9 h-9 flex items-center justify-center bg-theme-surface dark:bg-theme-card rounded-full">{index + 1}</span>
                      </div>

                      {/* ITEM FIELDS */}
                      {(billType === 'embroidery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Design / Item Code</label>
                          <input
                            type="text"
                            value={item.designNo || ''}
                            onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                            placeholder="e.g. D-101"
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* ... Other specific fields ... */}
                      {(billType === 'embroidery' || billType === 'repair' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">{billType === 'embroidery' ? 'Work Type' : billType === 'repair' ? 'Service' : 'Item / Service'}</label>
                          {billType === 'embroidery' ? (
                            <select
                              value={item.workType || 'Embroidery'}
                              onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                              className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[14px] transition-all appearance-auto truncate"
                            >
                              <option value="Embroidery">Embroidery</option>
                              <option value="Stitching">Stitching</option>
                              <option value="Printing">Printing</option>
                              <option value="Design Work">Design Work</option>
                              <option value="Repair">Repair</option>
                              <option value="Other Service">Other Service</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.serviceName || item.itemService || ''}
                              onChange={(e) => handleItemChange(index, billType === 'repair' ? 'serviceName' : 'itemService', e.target.value)}
                              placeholder={billType === 'repair' ? "e.g. Screen Replacement" : "e.g. Logo Design"}
                              className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                            />
                          )}
                        </div>
                      )}

                      {(billType === 'retail' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Product Name</label>
                          <input
                            type="text"
                            value={item.productName || item.description || ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'productName' : 'description', e.target.value)}
                            placeholder="e.g. T-Shirt / Rice"
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Description */}
                      {(billType === 'embroidery' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Description</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Size */}
                      {(billType === 'embroidery' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">{billType === 'grocery' ? 'Unit' : 'Size'}</label>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                            placeholder={billType === 'grocery' ? "Kg" : "L/XL"}
                            className="w-full px-3 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Qty */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ''}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-black text-[15px] transition-all"
                          />
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Rate / Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate ?? item.price ?? ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'price' : 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-[15px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Amount</label>
                        <div className="w-full pl-4 pr-4 py-3 min-h-[52px] bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-[14px] flex items-center justify-end shadow-inner">
                          <span className="text-theme-accent font-black text-[15px] tracking-tight">{currencySymbol}{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full flex lg:justify-center items-center gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-theme-border-soft dark:border-theme-border-soft lg:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate item"
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-theme-accent bg-theme-accent-light border border-theme-border-soft hover:bg-theme-accent-light rounded-[14px] transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="lg:hidden text-xs font-bold">Duplicate</span>
                        </button>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            title="Remove item"
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-theme-danger bg-theme-danger/5 border border-rose-100 hover:bg-rose-100 rounded-[14px] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="lg:hidden text-xs font-bold">Remove</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                  
                  {/* Add Row Button Inside Modal */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={addItemRow}
                      className="w-full lg:w-auto px-5 py-3.5 border-2 border-dashed border-theme-border-soft hover:border-theme-accent text-theme-accent hover:text-theme-accent bg-theme-surface dark:bg-theme-surface hover:bg-theme-accent-light rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Item Line
                    </motion.button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-theme-card dark:bg-theme-card border-t border-theme-border-soft px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex gap-6 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-1">Items Total</p>
                  <p className="text-xl font-extrabold text-theme-primary dark:text-theme-primary">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-theme-accent/70 uppercase tracking-wider mb-1">Grand Total</p>
                  <p className="text-2xl font-black text-theme-accent">{currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft text-theme-primary dark:text-theme-muted rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-8 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl font-black text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply & Close
                </motion.button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}
      <AnimatePresence>
        {showPdfSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-card/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-theme-card dark:bg-theme-card rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">Customize PDF Fields</h3>
                  <p className="text-[11px] text-theme-muted font-bold mt-0.5 capitalize">Template: {billType}</p>
                </div>
                <button onClick={() => setShowPdfSettings(false)} className="p-2 hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-colors">
                  <X className="w-5 h-5 text-theme-muted" />
                </button>
              </div>
              <p className="text-xs text-theme-muted leading-relaxed">
                Select which columns will be <strong>visible in the PDF invoice</strong>. Uncheck to hide a column from the printed bill.
              </p>
              <div className="space-y-3">
                {(() => {

                  const fields = ALL_FIELDS_BY_TEMPLATE[billType] || ALL_FIELDS_BY_TEMPLATE['custom'];
                  return fields.map((field) => {
                    const isChecked = pdfVisibleFields.length === 0 || pdfVisibleFields.includes(field.key);
                    return (
                      <label key={field.key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-app dark:bg-theme-surface cursor-pointer border border-theme-border-soft dark:border-theme-border-soft transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPdfVisibleFields(prev => prev.length === 0
                                ? fields.filter(f => f.key !== field.key).map(f => f.key).concat(field.key)
                                : [...prev, field.key]
                              );
                            } else {
                              const allKeys = fields.map(f => f.key);
                              const currentVisible = pdfVisibleFields.length === 0 ? allKeys : pdfVisibleFields;
                              setPdfVisibleFields(currentVisible.filter(k => k !== field.key));
                            }
                          }}
                          className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-theme-primary dark:text-theme-muted">{field.label}</span>
                        {field.key === 'amount' && (
                          <span className="ml-auto text-[9px] font-bold text-theme-muted uppercase">Always shown</span>
                        )}
                      </label>
                    );
                  });
                })()}
              </div>
              <div className="flex gap-3 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft">
                <button
                  onClick={() => setPdfVisibleFields((ALL_FIELDS_BY_TEMPLATE[billType] || ALL_FIELDS_BY_TEMPLATE['custom']).map(f => f.key))}
                  className="flex-1 py-2.5 text-xs font-bold text-theme-muted hover:bg-theme-app dark:bg-theme-surface rounded-xl border border-theme-border-soft transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => setShowPdfSettings(false)}
                  className="flex-1 py-2.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 text-xs font-black rounded-xl shadow-md transition-all"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-theme-card/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-theme-app dark:bg-theme-surface w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 max-h-[92vh] flex flex-col"
            >
              {/* Modal Top Actions Header Bar */}
              <div className="bg-theme-card dark:bg-theme-card border-b border-theme-border-soft dark:border-theme-border-soft px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-theme-accent" />
                  <span className="font-extrabold text-theme-primary dark:text-theme-primary text-sm">
                    {invoiceNumber || 'Draft'} - Live Preview Mode
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all cursor-pointer"
                    title="Print Invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (onDownloadPDF) {
                        onDownloadPDF({
                          invoiceNumber,
                          date,
                          dueDate,
                          customerName: customerName || 'Client Name',
                          customerPhone,
                          customerEmail,
                          customerAddress,
                          items,
                          taxPercentage,
                          discountAmount,
                          amountPaid,
                          notes,
                          terms,
                          paymentStatus,
                          orderStatus,
                          subtotal,
                          taxAmount,
                          grandTotal,
                          balanceDue
                        });
                      }
                    }}
                    className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-app dark:bg-theme-surface rounded-xl transition-all cursor-pointer"
                    title="Download PDF"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <div className="w-px h-6 bg-theme-surface dark:bg-theme-card mx-1"></div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-theme-muted hover:text-theme-primary dark:text-theme-primary hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Preview Wrapper */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-theme-app dark:bg-theme-surface">
                <InvoicePreview 
                  invoice={{
                    invoiceNumber,
                    date,
                    dueDate,
                    customerName: customerName || 'Client Name',
                    customerPhone,
                    customerEmail,
                    customerAddress,
                    items,
                    taxPercentage,
                    discountAmount,
                    amountPaid,
                    notes,
                    terms,
                    paymentStatus,
                    orderStatus,
                    subtotal,
                    taxAmount,
                    grandTotal,
                    balanceDue
                  }}
                  businessSettings={businessSettings}
                />
              </div>
              
              {/* Print Only Embedded Capture Zone */}
              <div className="hidden print:block print:absolute print:inset-0 bg-theme-card dark:bg-theme-card">
                <InvoicePreview 
                  invoice={{
                    invoiceNumber,
                    date,
                    dueDate,
                    customerName: customerName || 'Client Name',
                    customerPhone,
                    customerEmail,
                    customerAddress,
                    items,
                    taxPercentage,
                    discountAmount,
                    amountPaid,
                    notes,
                    terms,
                    paymentStatus,
                    orderStatus,
                    subtotal,
                    taxAmount,
                    grandTotal,
                    balanceDue
                  }}
                  businessSettings={businessSettings}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MOBILE STICKY BOTTOM ACTION BAR (PHASE 3) --- */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 p-3 bg-theme-card dark:bg-theme-card/90 backdrop-blur-md border-t border-theme-border-soft dark:border-theme-border-soft shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-30 flex gap-2 pb-safe-bottom transition-all">
        <button
          onClick={() => handleSave('Draft')}
          className="flex-1 py-3 bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted rounded-xl font-bold hover:bg-theme-border-soft transition-all flex items-center justify-center gap-1.5 text-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Draft</span>
        </button>
        <button
          onClick={() => handleSave()}
          className="flex-[1.5] py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
        >
          <Check className="w-4 h-4" />
          <span>Save Bill</span>
        </button>
        <button
          onClick={() => setIsMoreActionsOpen(true)}
          className="w-12 h-12 flex justify-center items-center bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted rounded-xl font-bold"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* MORE ACTIONS BOTTOM SHEET */}
      <BottomSheet isOpen={isMoreActionsOpen} onClose={() => setIsMoreActionsOpen(false)} title="More Actions">
        <div className="space-y-3 pb-4">
          <button
            onClick={() => {
              setIsMoreActionsOpen(false);
              setShowPreview(true);
            }}
            className="w-full py-4 bg-theme-app dark:bg-theme-surface text-theme-primary dark:text-theme-muted rounded-xl font-bold hover:bg-theme-surface dark:bg-theme-card transition-all flex items-center gap-3 px-4 text-sm border border-theme-border-soft dark:border-theme-border-soft"
          >
            <Eye className="w-5 h-5 text-theme-accent" />
            <span>Preview Invoice</span>
          </button>
          
          <button
            onClick={() => {
              setIsMoreActionsOpen(false);
              if (!editingInvoice) {
                toast.error('Please save invoice before downloading PDF.');
                return;
              }
              if(onDownloadPDF) onDownloadPDF({ id: editingInvoice.id, invoiceNumber, date, dueDate, customerName, customerPhone, customerEmail, customerAddress, items, taxPercentage, discountAmount, amountPaid, notes, terms, paymentStatus, orderStatus, subtotal, taxAmount, grandTotal, balanceDue }); 
            }}
            className="w-full py-4 bg-theme-app dark:bg-theme-surface text-theme-primary dark:text-theme-muted rounded-xl font-bold hover:bg-theme-surface dark:bg-theme-card transition-all flex items-center gap-3 px-4 text-sm border border-theme-border-soft dark:border-theme-border-soft"
          >
            <Download className="w-5 h-5 text-theme-accent" />
            <span>Download PDF</span>
          </button>

          {editingInvoice && (
            <button
              onClick={async () => {
                setIsMoreActionsOpen(false);
                const isLiveLinkEnabled = businessSettings?.customerLiveLinkSettings?.enableLiveInvoiceLink !== false;
                if (!isLiveLinkEnabled) {
                  toast.error('Live Link is disabled. Enable it from Settings.');
                  return;
                }
                try {
                  const token = await ensureInvoicePublicToken(editingInvoice);
                  if (!token) return;
                  const liveLink = `${window.location.origin}/invoice/${token}`;
                  const regionalPrefs = editingInvoice?.regionalSettingsSnapshot || {
                    currency: currencySymbol,
                    numberFormat: businessSettings?.numberFormat || 'Indian'
                  };
                  const totalStr = formatCurrency(grandTotal, regionalPrefs.currency || currencySymbol, regionalPrefs.numberFormat);
                  const msg = `Your invoice is ready.\nInvoice No: ${invoiceNumber}\nTotal: ${totalStr}\nView & Pay: ${liveLink}`;
                  window.open(`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                } catch (err) {
                  toast.error('Could not create live link. Please save invoice and try again.');
                }
              }}
              className="w-full py-4 bg-theme-accent-light text-theme-accent rounded-xl font-bold hover:bg-theme-accent-light transition-all flex items-center gap-3 px-4 text-sm border border-theme-border-soft"
            >
              <Send className="w-5 h-5 text-theme-accent" />
              <span>Share on WhatsApp</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <AddCustomerSheet 
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={(newCustomer) => {
          // Add to local list and select it
          if (onSaveInvoice) {
            // Need to save the customer. 
            // Wait, CreateInvoice doesn't take onSaveCustomer prop!
            // But we can trigger saveCustomer inline when invoice is saved by setting state
            setCustomerName(newCustomer.name);
            setCustomerPhone(newCustomer.phone);
            setCustomerEmail(newCustomer.email);
            setCustomerAddress(newCustomer.address);
            setSelectedCustomerId('');
            setSaveCustomer(true);
            setIsAddCustomerOpen(false);
            toast.success('Customer details prefilled! Will be saved when you save the bill.');
          }
        }}
      />

    </motion.div>
  );
};

export default CreateInvoice;
