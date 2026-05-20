import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
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
  Calendar
} from 'lucide-react';
import { calculateTotals, generateNextInvoiceNumber, getNextDesignNumber } from '../utils/invoiceUtils';

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
  editingInvoice = null
}) => {
  const currencySymbol = businessSettings?.currency || '₹';

  // --- STATE FOR MAIN INVOICE ---
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
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
      setPaymentStatus(editingInvoice.paymentStatus || 'Pending');
      setOrderStatus(editingInvoice.orderStatus || 'Pending');

      // Populate items ensuring they have smartRate details
      const parsedItems = (editingInvoice.items || []).map((item, idx) => ({
        sn: item.sn || idx + 1,
        designNo: item.designNo || `SO-${idx + 5}`,
        workType: item.workType || 'Embroidery',
        description: item.description || item.name || '',
        size: item.size || 'Standard',
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
      setNotes('Thank you for choosing BillMint! Payment is expected within due date.');
      setPaymentStatus('Pending');
      setOrderStatus('Pending');

      // Prefill first row
      const firstDesignNo = getNextDesignNumber(invoices, 0);
      setItems([
        {
          sn: 1,
          designNo: firstDesignNo,
          workType: 'Embroidery',
          description: '',
          size: 'Standard',
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
      setPaymentStatus('Unpaid');
    } else if (amountPaid > 0 && amountPaid < grandTotal) {
      setPaymentStatus('Pending');
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
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field === 'qty') {
      const val = parseFloat(value) || 0;
      updated[index].qty = val;
      updated[index].amount = val * updated[index].rate;
    } else if (field === 'rate') {
      const val = parseFloat(value) || 0;
      updated[index].rate = val;
      updated[index].amount = updated[index].qty * val;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  // --- ADD ITEM ROW ---
  const addItemRow = () => {
    const nextSO = getNextDesignNumber(invoices, items.length);
    setItems([
      ...items,
      {
        sn: items.length + 1,
        designNo: nextSO,
        workType: 'Embroidery',
        description: '',
        size: 'Standard',
        qty: 1,
        rate: 0,
        amount: 0,
        smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 }
      }
    ]);
  };

  // --- DUPLICATE ROW ---
  const handleDuplicateItem = (index) => {
    const original = items[index];
    const nextSO = getNextDesignNumber(invoices, items.length);
    const duplicated = {
      ...original,
      sn: items.length + 1,
      designNo: nextSO,
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
  const handleSave = () => {
    if (!customerName) {
      alert('Please specify a customer name.');
      return;
    }

    const invalidItem = items.some(item => !item.description || item.qty <= 0 || item.rate < 0);
    if (invalidItem) {
      alert('Please complete description, quantity, and rates for all items.');
      return;
    }

    const payload = {
      id: editingInvoice ? editingInvoice.id : 'inv-' + Date.now(),
      invoiceNumber,
      date,
      dueDate,
      customerId: selectedCustomerId || null,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      taxPercentage: parseFloat(taxPercentage) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      amountPaid: parseFloat(amountPaid) || 0,
      balanceDue: parseFloat(balanceDue) || 0,
      notes,
      paymentStatus,
      orderStatus,
      subtotal,
      taxAmount,
      grandTotal,
    };

    onSaveInvoice(payload);
    setCurrentTab('invoices');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => setCurrentTab('invoices')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>
        
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          {editingInvoice ? 'Edit Billing Sheet' : 'Create Invoicing Sheet'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 & 2: INVOICE CONFIGURATION */}
        <div className="lg:col-span-2 space-y-6">
          
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
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Client & Customer CRM</span>
              </h3>
              
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
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
                <label className="block mb-1.5 text-slate-400">Phone Number (WhatsApp Ready)</label>
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
                <label className="block mb-1.5 text-slate-400">Billing Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Garment Street..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          {/* Premium Smart Item Table */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Invoice Items Sheet</span>
              </h3>
              
              <span className="text-[10px] text-slate-400 font-bold">
                Smart Rates Enabled
              </span>
            </div>

            {/* Desktop Headers */}
            <div className="hidden lg:grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">
              <div className="col-span-1 text-center">S.N.</div>
              <div className="col-span-2">Design No</div>
              <div className="col-span-2">Work Type</div>
              <div className="col-span-3">Description / Catalog</div>
              <div className="col-span-1 text-center">Size</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-1.5 text-right">Rate</div>
              <div className="col-span-0.5"></div> {/* Action spacing */}
            </div>

            <div className="space-y-4 lg:space-y-3">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-3 p-4 lg:p-2 bg-slate-50/50 lg:bg-transparent rounded-2xl lg:rounded-none border border-slate-100 lg:border-0 relative"
                >
                  
                  {/* Serial Number & Floating Delete for Mobile */}
                  <div className="flex justify-between items-center lg:hidden">
                    <span className="text-xs font-black text-slate-800">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItemRow(index)}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* S.N. (Desktop only) */}
                  <div className="hidden lg:flex items-center justify-center col-span-1 text-xs font-extrabold text-slate-400">
                    {index + 1}
                  </div>

                  {/* Design No */}
                  <div className="col-span-2 text-xs font-semibold text-slate-500">
                    <label className="lg:hidden block mb-1 text-slate-400">Design No</label>
                    <input
                      type="text"
                      value={item.designNo}
                      onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                      placeholder="SO-5"
                      className="w-full px-3 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-extrabold uppercase"
                    />
                  </div>

                  {/* Work Type */}
                  <div className="col-span-2 text-xs font-semibold text-slate-500">
                    <label className="lg:hidden block mb-1 text-slate-400">Work Type</label>
                    <select
                      value={item.workType}
                      onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                      className="w-full px-2.5 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-bold"
                    >
                      <option value="Embroidery">Embroidery</option>
                      <option value="Punching">Punching</option>
                      <option value="Repair">Repair</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Description & Catalog lookup combined */}
                  <div className="col-span-3 text-xs font-semibold text-slate-500 space-y-1">
                    <label className="lg:hidden block mb-1 text-slate-400">Description / Prefill</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Embroidery Work on Suits"
                      className="w-full px-3 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                    />
                    
                    {/* Catalog Helper link */}
                    <div className="flex items-center gap-1">
                      <select
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        defaultValue=""
                        className="text-[9px] bg-slate-100 border-0 text-slate-500 py-0.5 px-1.5 rounded focus:outline-none cursor-pointer w-full"
                      >
                        <option value="">-- Quick Prefill Catalog --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({currencySymbol}{p.price})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-1 text-xs font-semibold text-slate-500">
                    <label className="lg:hidden block mb-1 text-slate-400">Size</label>
                    <input
                      type="text"
                      value={item.size}
                      onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                      placeholder="A4 / 4x4"
                      className="w-full px-2 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-bold"
                    />
                  </div>

                  {/* Qty */}
                  <div className="col-span-1 text-xs font-semibold text-slate-500">
                    <label className="lg:hidden block mb-1 text-slate-400">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full px-2 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-extrabold"
                    />
                  </div>

                  {/* Rate & Smart Rate button */}
                  <div className="col-span-1.5 text-xs font-semibold text-slate-500">
                    <label className="lg:hidden block mb-1 text-slate-400">Rate ({currencySymbol})</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="w-full px-2 py-2 bg-white lg:bg-slate-50 border border-slate-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-extrabold"
                      />
                      <button
                        type="button"
                        onClick={() => openSmartRateCalculator(index)}
                        title="Calculate using sub-charges"
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-xl transition-colors shrink-0"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row Total & Action Buttons */}
                  <div className="col-span-1 flex items-center justify-between lg:justify-end text-xs font-black text-slate-700 py-3 lg:py-0 border-t lg:border-0 border-slate-100 mt-2 lg:mt-0 gap-3">
                    <span className="lg:hidden text-slate-400 font-semibold">Row Amount:</span>
                    <span className="text-slate-800 font-extrabold">
                      {currencySymbol}{item.amount ? item.amount.toFixed(2) : (item.qty * item.rate).toFixed(2)}
                    </span>

                    {/* Desktop duplicate and delete actions */}
                    <div className="hidden lg:flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        title="Duplicate Row"
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          title="Delete Row"
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Actions helper */}
                  <div className="lg:hidden flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(index)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSmartRateCalculator(index)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 py-1.5 px-3 rounded-lg"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Smart Rate</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

            <button
              onClick={addItemRow}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-4 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item Line</span>
            </button>
          </div>
        </div>

        {/* COLUMN 3: TALLY, SUB-CHARGES & OVERRIDES */}
        <div className="space-y-6">
          
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
                <label className="block mb-1.5 text-slate-400">Notes / Conditions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms and conditions..."
                  rows="3"
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

            <div className="pt-2">
              <button
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-100/50 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Transaction</span>
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

    </div>
  );
};

export default CreateInvoice;
