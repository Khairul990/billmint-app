import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Settings, 
  LayoutTemplate, 
  Save, 
  ArrowLeft, 
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
  Download,
  Send,
  BarChart3,
  Search,
  X,
  BookOpen,
  UserPlus,
  Info,
  Maximize2
} from 'lucide-react';
import { calculateTotals, generateNextInvoiceNumber, getNextDesignNumber, autoIncrementString } from '../utils/invoiceUtils';

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
  onDownloadPDF
}) => {
  const currencySymbol = businessSettings?.currency || '₹';

  // --- STATE FOR MAIN INVOICE ---
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billType, setBillType] = useState(businessSettings?.defaultBillingTemplate || 'custom');
  const [pdfVisibleFields, setPdfVisibleFields] = useState(businessSettings?.pdfVisibleFields?.[businessSettings?.defaultBillingTemplate || 'custom'] || []);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);


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
    const updated = [...items];
    const isNumField = ['qty', 'rate', 'price', 'unitPrice', 'discount', 'partsCost', 'labourCharge'].includes(field);
    const val = isNumField ? (value === '' ? '' : (parseFloat(value) || 0)) : value;
    
    updated[index][field] = val;
    updated[index].amount = calculateItemAmount(updated[index]);
    setItems(updated);
  };

  // --- ADD ITEM ROW ---
  const addItemRow = () => {
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
      alert('Please add customer name and at least one invoice item.');
      return;
    }

    const cleanedItems = items.filter(item => 
      item.description.trim() !== '' || 
      item.designNo.trim() !== '' || 
      item.rate > 0
    );

    if (cleanedItems.length === 0) {
      alert('Please add item description and rate before saving invoice.');
      return;
    }

    const invalidItem = cleanedItems.some(item => (!item.description && !item.designNo) || item.qty <= 0 || item.rate < 0);
    if (invalidItem) {
      alert('Please add item description and rate before saving invoice.');
      return;
    }

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
    };

    // Also pass saveCustomer flag so the parent can save the customer if requested
    onSaveInvoice(payload, saveCustomer && !selectedCustomerId);
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

  return (
    <motion.div 
      className="space-y-6 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Help Banner */}
      {showBanner && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative shadow-sm">
          <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600">
            <X className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-indigo-800 font-bold text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Create your bill in 3 simple steps
            </h3>
            <p className="text-indigo-600 text-xs mt-1 font-medium">Select or add customer, add invoice items, then save or download PDF.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 pr-6 sm:pr-0">
            <button type="button" onClick={() => setCurrentTab('guide')} className="px-3 py-1.5 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-all flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              View Guide
            </button>
            <button type="button" onClick={() => document.getElementById('crm-section')?.scrollIntoView({behavior: 'smooth'})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Add Customer
            </button>
            <button type="button" onClick={() => document.getElementById('items-section')?.scrollIntoView({behavior: 'smooth'})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => setCurrentTab('invoices')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>
        
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {editingInvoice ? 'Edit Billing Sheet' : 'Create Invoicing Sheet'}
          </h2>
          <button 
            onClick={() => setCurrentTab('guide')}
            className="text-indigo-500 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 mt-1 transition-colors w-fit"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need help? Learn how to create a bill
          </button>
        </div>
        
        {/* Search Bar for Create Invoice Header */}
        <div className="relative flex-1 max-w-sm hidden md:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search items, customers..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Invoices</span>
          </div>
          <span className="text-xl font-black text-slate-800">{invoices.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Paid Invoices</span>
          </div>
          <span className="text-xl font-black text-slate-800">{invoices.filter(i => i.paymentStatus === 'Paid').length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Pending Dues</span>
          </div>
          <span className="text-xl font-black text-slate-800">{invoices.filter(i => i.balanceDue > 0).length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Clients</span>
          </div>
          <span className="text-xl font-black text-slate-800">{customers.length}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* COLUMN 1 & 2: INVOICE CONFIGURATION */}
        <div className="w-full lg:w-[70%] space-y-6">
          
          {/* Bill Type / Business Type Selector */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0f2349] rounded-3xl p-5 md:p-6 border border-slate-700/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Bill Type</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Select your business template</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfSettings(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-bold text-[10px] rounded-xl flex items-center gap-1.5 transition-all border border-white/10 shrink-0"
              >
                <LayoutTemplate className="w-3 h-3" />
                PDF Fields
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
                    ? 'bg-gradient-to-br from-teal-400 to-emerald-500 border-teal-400 text-white shadow-lg shadow-teal-500/30 scale-105'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-102'
                  }`}
                >
                  <div className="text-xl mb-0.5">{type.emoji}</div>
                  <div className="text-[11px] font-extrabold">{type.label}</div>
                  <div className={`text-[9px] font-bold ${ billType === type.id ? 'text-white/70' : 'text-slate-500'}`}>{type.sub}</div>
                </button>
              ))}
            </div>

            {/* Live column preview chips */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider py-1 mr-1">Columns:</span>
              {(
                billType === 'embroidery' ? ['Design No','Work Type','Description','Size','Qty','Rate','Amount'] :
                billType === 'grocery'   ? ['Product Name','Unit','Qty','Unit Price','Amount'] :
                billType === 'repair'    ? ['Service/Item','Problem Details','Parts Cost','Labour','Qty','Amount'] :
                billType === 'retail'    ? ['Product Name','Category','Size/Variant','Qty','Price','Discount','Amount'] :
                                          ['Item/Service','Description','Qty','Rate','Amount']
              ).map((col, i) => (
                <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  col === 'Amount'
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-white/10 text-slate-400 border border-white/10'
                }`}>{col}</span>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Invoicing Metadata</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block mb-1.5 text-slate-400">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                  Invoice number is generated automatically, but you can edit it if needed.
                </p>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-400">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Customer CRM Selector */}
          <div id="crm-section" className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4 relative scroll-mt-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Client & Customer CRM</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Customer details will appear on the invoice PDF.</p>
              </div>
              
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:block">
                SaaS CRM Integrated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-slate-400">Select Customer from CRM (Automatic Prefill)</label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-bold"
                >
                  <option value="">-- Manual Client Entry --</option>
                  {customers.map((c) => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1.5 font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" /> No customers found. Add customer details manually below.
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-slate-400">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Acme Embroidery"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-400">Phone Number * <span className="font-normal text-[10px]">(WhatsApp Ready)</span></label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@customer.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-slate-400">Billing Address *</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Garment Street..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed text-xs"
                />
              </div>

              {!selectedCustomerId && (
                <div className="sm:col-span-2 flex items-center gap-2 mt-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <input
                    type="checkbox"
                    id="saveCustomer"
                    checked={saveCustomer}
                    onChange={(e) => setSaveCustomer(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="saveCustomer" className="text-xs font-bold text-indigo-900 cursor-pointer select-none">
                    Save this customer for future invoices
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Premium Smart Item Table */}
          <div id="items-section" className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden scroll-mt-6">
            {/* Table Header Bar */}
            <div className="bg-gradient-to-r from-[#071B3A] to-[#0d2b55] px-5 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Invoice Items Sheet</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Qty × Rate = Amount (auto-calculated)</p>
                </div>
                <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 hidden md:block ml-2">⚡ Smart Rates On</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowPdfSettings(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/10 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>Customize PDF</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Sheet</span>
                </motion.button>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-4">

            <div className="flex gap-2 flex-wrap pb-3 mb-1 border-b border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider py-1.5 mr-1">Quick Fill:</span>
              <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">🧵 Embroidery Work</button>
              <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">🔧 Repair Work</button>
              <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">📝 Custom Design</button>
            </div>

            {/* Desktop Headers + Items */}
            <div className="w-full overflow-x-auto pb-4 -mx-1 px-1">
              <div className="min-w-[900px] flex flex-col">
                {/* Column headers - desktop only */}
                <div className="hidden lg:grid gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 pb-2 mb-0 border-b-2 border-slate-100" style={{ gridTemplateColumns: getGridCols() }}>
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
                      className="flex flex-col lg:grid items-center gap-2 px-3 py-3 lg:py-2 bg-white lg:bg-slate-50/60 rounded-2xl border border-slate-100 lg:border-slate-100/80 shadow-sm lg:shadow-none"
                      style={{ gridTemplateColumns: getGridCols() }}
                    >
                  
                  {/* Mobile: Item header with number + delete */}
                  <div className="flex justify-between items-center lg:hidden mb-1">
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full">Item #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 py-1.5 px-3 rounded-lg"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicate</span>
                      </button>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(index)}
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 py-1.5 px-3 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* S.N. (Desktop only) */}
                  <div className="hidden lg:flex items-center justify-center min-h-[48px]">
                    <span className="text-[13px] font-extrabold text-slate-400 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full">{index + 1}</span>
                  </div>

                  {/* Design No - embroidery only */}
                  {(billType === 'embroidery') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Design / Item Code</label>
                      <input
                        type="text"
                        value={item.designNo || ''}
                        onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                        placeholder="e.g. SO-5"
                        className="w-full px-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm uppercase tracking-wide transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Service Name */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Service / Item Name</label>
                      <input
                        type="text"
                        value={item.serviceName || ''}
                        onChange={(e) => handleItemChange(index, 'serviceName', e.target.value)}
                        placeholder="e.g. Mobile Screen"
                        className="w-full px-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Retail: Product Name */}
                  {billType === 'retail' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Product Name</label>
                      <input
                        type="text"
                        value={item.productName || ''}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        placeholder="e.g. Denim Jeans"
                        className="w-full px-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Custom: Item / Service */}
                  {billType === 'custom' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Item / Service</label>
                      <input
                        type="text"
                        value={item.itemService || ''}
                        onChange={(e) => handleItemChange(index, 'itemService', e.target.value)}
                        placeholder="e.g. Design Work"
                        className="w-full px-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Work Type - embroidery only */}
                  {billType === 'embroidery' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Work Type</label>
                      <select
                        value={item.workType || 'Embroidery'}
                        onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                        className="w-full px-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[13px] transition-all appearance-auto truncate"
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
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</label>
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        placeholder="e.g. Clothing"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Problem / Details */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Problem / Details</label>
                      <input
                        type="text"
                        value={item.problemDetails || ''}
                        onChange={(e) => handleItemChange(index, 'problemDetails', e.target.value)}
                        placeholder="e.g. Screen Cracked"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Description / Product Name - grocery, embroidery */}
                  {(billType !== 'repair' && billType !== 'retail' && billType !== 'custom') && (
                    <div className="space-y-1.5">
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
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
                        className="w-full px-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                      {/* Catalog Helper */}
                      <select
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        defaultValue=""
                        className="text-[9px] bg-slate-100 border-0 text-slate-500 py-1 px-2 rounded-lg focus:outline-none cursor-pointer w-full hover:bg-slate-200 transition-colors"
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
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="e.g. Custom design on 4x4 cloth"
                        className="w-full px-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Size / Unit - not for repair/retail/custom */}
                  {(billType !== 'repair' && billType !== 'retail' && billType !== 'custom') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {billType === 'grocery' ? 'Unit' : 'Size'}
                      </label>
                      {billType === 'grocery' ? (
                        <select
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          className="w-full px-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[13px] transition-all"
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
                          className="w-full px-2 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                        />
                      )}
                    </div>
                  )}

                  {/* Retail: Size/Variant */}
                  {billType === 'retail' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Size / Variant</label>
                      <input
                        type="text"
                        value={item.sizeVariant || ''}
                        onChange={(e) => handleItemChange(index, 'sizeVariant', e.target.value)}
                        placeholder="e.g. 32 inch"
                        className="w-full px-2 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  )}

                  {/* Repair: Parts Cost */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Parts Cost</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currencySymbol}</span>
                        <input
                          type="number" min="0"
                          value={item.partsCost ?? ''}
                          onChange={(e) => handleItemChange(index, 'partsCost', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Repair: Labour Charge */}
                  {billType === 'repair' && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Labour Charge</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currencySymbol}</span>
                        <input
                          type="number" min="0"
                          value={item.labourCharge ?? ''}
                          onChange={(e) => handleItemChange(index, 'labourCharge', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-3 min-h-[48px] bg-white border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qty */}
                  <div>
                    <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                    <input
                      type="number"
                      min="0.01" step="any"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full px-2 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all"
                    />
                  </div>

                  {/* Rate / Unit Price - not for repair or retail */}
                  {(billType !== 'repair' && billType !== 'retail') && (
                    <div>
                      <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {billType === 'grocery' ? 'Unit Price' : 'Rate per item'}
                      </label>
                      <div className="flex gap-1 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-sm select-none">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0" step="any"
                            value={item.rate ?? ''}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300"
                          />
                        </div>
                        {billType !== 'grocery' && (
                          <button
                            type="button"
                            onClick={() => openSmartRateCalculator(index)}
                            title="Calculate using sub-charges"
                            className="bg-teal-50 text-teal-600 hover:bg-teal-100 w-10 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 hidden lg:flex border border-teal-100"
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
                        <label className="lg:hidden block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Price ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currencySymbol}</span>
                          <input type="number" min="0" step="any"
                            value={item.price ?? ''}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-3.5 min-h-[52px] bg-white border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-sm transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="lg:hidden block mb-1 text-[10px] font-bold text-rose-400 uppercase tracking-wide">Discount ({currencySymbol})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-sm">-</span>
                          <input type="number" min="0" step="any"
                            value={item.discount ?? ''}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-6 pr-3 py-3.5 min-h-[52px] bg-white border border-rose-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-rose-500/20 hover:border-rose-400 focus:border-rose-400 text-rose-600 font-extrabold text-sm transition-all placeholder:text-rose-200"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Row Total - Amount (auto-calculated, read-only) */}
                  <div className="flex flex-col justify-center">
                    <label className="lg:hidden block mb-1 text-[10px] font-bold text-teal-500 uppercase tracking-wide">Amount (auto-calculated)</label>
                    <div className="min-h-[52px] flex items-center justify-end px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50/30 border border-teal-200/60 shadow-inner rounded-xl w-full">
                      <div className="text-right">
                        <span className="block text-teal-700 font-black text-[15px] leading-tight tabular-nums">
                          {currencySymbol}{(item.amount ?? (item.qty * (item.rate || 0))).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider hidden lg:block">
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
                      className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all p-2 rounded-xl group"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wide group-hover:text-indigo-600">Copy</span>
                    </button>
                    
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        title="Remove item"
                        className="flex flex-col items-center gap-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50/80 transition-all p-2 rounded-xl group"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-wide group-hover:text-rose-500">Del</span>
                      </button>
                    ) : (
                      <div className="w-10 h-10" />
                    )}
                  </div>

                  {/* Mobile: Smart Rate button at bottom */}
                  {billType !== 'grocery' && billType !== 'repair' && billType !== 'retail' && (
                    <div className="lg:hidden pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openSmartRateCalculator(index)}
                        className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 py-2 rounded-xl transition-colors"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-5 md:px-6 py-4 border-t border-slate-100 gap-4 bg-slate-50/50">
              <button
                onClick={addItemRow}
                className="flex items-center gap-2 text-xs font-extrabold text-white transition-all w-fit px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item Line</span>
              </button>

              <div className="bg-white p-3 rounded-2xl w-full sm:w-64 space-y-1.5 shadow-sm border border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Items Total:</span>
                  <span className="font-extrabold text-slate-700">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-semibold text-rose-500">
                    <span>Discount:</span>
                    <span>-{currencySymbol}{discountAmount}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Tax:</span>
                    <span>+{currencySymbol}{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl px-3 py-2 mt-1">
                  <span>Grand Total</span>
                  <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: TALLY, SUB-CHARGES & OVERRIDES */}
        <div className="w-full lg:w-[30%] space-y-6">
          
          {/* Overrides & Payment */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-500" />
              <span>Billing Overrides</span>
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-slate-500">
              
              {/* Payment status (Automatic suggestions active) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Payment Status</label>
                  <span className="text-[9px] text-indigo-500 font-extrabold tracking-wide uppercase">
                    Auto-Synchronizing
                  </span>
                </div>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block mb-1.5 text-slate-400">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Ready">Ready</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Tax percentage */}
              <div>
                <label className="block mb-1.5 text-slate-400 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-300" />
                  <span>GST/Tax Rate (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block mb-1.5 text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-slate-300" />
                  <span>Flat Discount ({currencySymbol})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block mb-1.5 text-slate-400">Customer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business!"
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 leading-relaxed text-xs"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block mb-1.5 text-slate-400">Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="1. Payment is due within 30 days..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tally calculations & Amount Paid details */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Tally Sheet</span>
            </h3>
            
            <div className="space-y-3.5 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Discount</span>
                  <span className="font-bold">-{currencySymbol}{parseFloat(discountAmount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax ({taxPercentage}%)</span>
                <span className="text-slate-800 font-bold">{currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-slate-900">
                <span className="text-sm font-extrabold text-slate-800">Grand Total</span>
                <span className="text-lg font-black text-indigo-600">
                  {currencySymbol}{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Amount Paid input */}
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <label className="block text-[10px] text-slate-400 uppercase font-black">Amount Paid ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-indigo-900 font-black text-sm text-right"
                />
              </div>

              {/* Balance Due calculation */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Balance Outstanding</span>
                <span className={`text-sm font-black ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {currencySymbol}{balanceDue.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => handleSave('Draft')}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-[14px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => {}}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-[14px]"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>
              <button
                onClick={() => { 
                  if (!editingInvoice) {
                    alert('Please save invoice before downloading PDF.');
                    return;
                  }
                  if(onDownloadPDF) onDownloadPDF({ id: editingInvoice.id, invoiceNumber, date, dueDate, customerName, customerPhone, customerEmail, customerAddress, items, taxPercentage, discountAmount, amountPaid, notes, terms, paymentStatus, orderStatus, subtotal, taxAmount, grandTotal, balanceDue }); 
                }}
                className="w-full py-4 bg-white border border-teal-500 text-teal-600 rounded-xl font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2 text-[14px] shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => handleSave()}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 text-[14px]"
              >
                <Check className="w-4 h-4" />
                <span>Save Invoice</span>
              </button>
              <button
                onClick={() => {
                  const msg = `Hi ${customerName},\nHere is your invoice ${invoiceNumber} for ${currencySymbol}${grandTotal.toFixed(2)}.`;
                  window.open(`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#1ebd5a] shadow-md transition-all flex items-center justify-center gap-2 text-[14px]"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SMART COMPOSITE RATE MODAL */}
      {showSmartRate && activeItemIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Smart Rate Composite</span>
                </h4>
                <span className="text-[10px] bg-white/20 text-white font-bold py-1 px-2.5 rounded-full">
                  Item #{activeItemIndex + 1}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-bold mt-1.5">
                Design: {items[activeItemIndex]?.designNo || 'N/A'} • {items[activeItemIndex]?.workType || 'Standard'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                Embroidery jobs typically sum multiple service adders. Enter sub-charges to automatically sum the composite row rate.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                <div>
                  <label className="block mb-1 text-slate-400">Embroidery Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.embroidery || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, embroidery: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">Punching Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.punching || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, punching: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">Repair Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.repair || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, repair: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">Other/Misc Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.other || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, other: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-black text-right"
                  />
                </div>
              </div>

              {/* Real-time Composite Tally */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 flex justify-between items-center mt-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block leading-none">Composite Rate</span>
                  <span className="text-xs text-indigo-500 font-bold mt-1 block">Live Summed Total</span>
                </div>
                <span className="text-2xl font-black text-indigo-600">
                  {currencySymbol}
                  {((parseFloat(smartCharges.repair) || 0) + 
                    (parseFloat(smartCharges.punching) || 0) + 
                    (parseFloat(smartCharges.embroidery) || 0) + 
                    (parseFloat(smartCharges.other) || 0)).toFixed(2)}
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSmartRate(false);
                  setActiveItemIndex(null);
                }}
                className="flex-1 py-3 text-xs font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel / Discard
              </button>
              
              <button
                type="button"
                onClick={applySmartRate}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white md:rounded-3xl shadow-2xl w-full h-full md:w-[98vw] md:max-w-[1550px] md:h-[90vh] flex flex-col overflow-hidden"
            >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#071B3A] to-[#0d2b55] px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Invoice Items Sheet</h3>
                  <p className="text-xs text-slate-300 font-medium">Template: <span className="text-teal-400 font-bold capitalize">{billType}</span> | Add products or services.</p>
                </div>
              </div>
              <button onClick={() => setIsSheetExpanded(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            {/* Quick Fill & Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-4 md:p-6 space-y-6 max-w-full">
                
                <div className="flex gap-2 flex-wrap pb-4 border-b border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest py-1.5 mr-2">Quick Fill:</span>
                  <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3.5 py-1.5 bg-white text-teal-700 border border-teal-200 hover:border-teal-400 hover:bg-teal-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🧵 Embroidery</button>
                  <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3.5 py-1.5 bg-white text-amber-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🔧 Repair</button>
                  <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3.5 py-1.5 bg-white text-indigo-700 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">📝 Custom Design</button>
                </div>

                <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="min-w-max w-full flex flex-col px-1">
                    {/* Table Headers */}
                    <div className="hidden lg:grid gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 pb-3 border-b-2 border-slate-200" style={{ gridTemplateColumns: getExpandedGridCols() }}>
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
                      className="flex flex-col lg:grid items-center gap-3 lg:gap-3 px-4 py-4 lg:py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-200 transition-colors"
                      style={{ gridTemplateColumns: getExpandedGridCols() }}
                    >
                      {/* Mobile Header */}
                      <div className="flex justify-between items-center w-full lg:hidden mb-2 pb-2 border-b border-slate-100">
                        <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">Item #{index + 1}</span>
                      </div>

                      {/* Desktop S.N. */}
                      <div className="hidden lg:flex items-center justify-center min-h-[52px]">
                        <span className="text-sm font-extrabold text-slate-400 w-9 h-9 flex items-center justify-center bg-slate-100 rounded-full">{index + 1}</span>
                      </div>

                      {/* ITEM FIELDS */}
                      {(billType === 'embroidery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Design / Item Code</label>
                          <input
                            type="text"
                            value={item.designNo || ''}
                            onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                            placeholder="e.g. D-101"
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* ... Other specific fields ... */}
                      {(billType === 'embroidery' || billType === 'repair' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">{billType === 'embroidery' ? 'Work Type' : billType === 'repair' ? 'Service' : 'Item / Service'}</label>
                          {billType === 'embroidery' ? (
                            <select
                              value={item.workType || 'Embroidery'}
                              onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                              className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[14px] transition-all appearance-auto truncate"
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
                              className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                            />
                          )}
                        </div>
                      )}

                      {(billType === 'retail' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Product Name</label>
                          <input
                            type="text"
                            value={item.productName || item.description || ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'productName' : 'description', e.target.value)}
                            placeholder="e.g. T-Shirt / Rice"
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Description */}
                      {(billType === 'embroidery' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Size */}
                      {(billType === 'embroidery' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">{billType === 'grocery' ? 'Unit' : 'Size'}</label>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                            placeholder={billType === 'grocery' ? "Kg" : "L/XL"}
                            className="w-full px-3 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Qty */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ''}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-black text-[15px] transition-all"
                          />
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Rate / Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate ?? item.price ?? ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'price' : 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-[15px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Amount</label>
                        <div className="w-full pl-4 pr-4 py-3 min-h-[52px] bg-slate-50 border border-slate-200 rounded-[14px] flex items-center justify-end shadow-inner">
                          <span className="text-teal-600 font-black text-[15px] tracking-tight">{currencySymbol}{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full flex lg:justify-center items-center gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate item"
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-[14px] transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="lg:hidden text-xs font-bold">Duplicate</span>
                        </button>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            title="Remove item"
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-[14px] transition-colors"
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
                      className="w-full lg:w-auto px-5 py-3.5 border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors shadow-sm cursor-pointer"
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
            <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex gap-6 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Items Total</p>
                  <p className="text-xl font-extrabold text-slate-800">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-teal-600/70 uppercase tracking-wider mb-1">Grand Total</p>
                  <p className="text-2xl font-black text-teal-600">{currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-black text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">Customize PDF Fields</h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5 capitalize">Template: {billType}</p>
                </div>
                <button onClick={() => setShowPdfSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select which columns will be <strong>visible in the PDF invoice</strong>. Uncheck to hide a column from the printed bill.
              </p>
              <div className="space-y-3">
                {(() => {
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
                  const fields = ALL_FIELDS_BY_TEMPLATE[billType] || ALL_FIELDS_BY_TEMPLATE['custom'];
                  return fields.map((field) => {
                    const isChecked = pdfVisibleFields.length === 0 || pdfVisibleFields.includes(field.key);
                    return (
                      <label key={field.key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100 transition-colors">
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
                        <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                        {field.key === 'amount' && (
                          <span className="ml-auto text-[9px] font-bold text-slate-300 uppercase">Always shown</span>
                        )}
                      </label>
                    );
                  });
                })()}
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPdfVisibleFields(fields.map(f => f.key))}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => setShowPdfSettings(false)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default CreateInvoice;
