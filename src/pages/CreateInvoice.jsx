import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Users, 
  Layers, 
  Printer, 
  Download, 
  FileText,
  Percent,
  Coins
} from 'lucide-react';
import { calculateTotals, generateNextInvoiceNumber } from '../utils/invoiceUtils';

/**
 * Responsive Invoice Builder Page
 * @param {Array} invoices - existing invoices (to check next number)
 * @param {Array} customers - saved customers list
 * @param {Array} products - saved products list
 * @param {Object} businessSettings - current business details
 * @param {Function} onSaveInvoice - save event handler
 * @param {Function} setCurrentTab - state update dispatcher
 * @param {Object} editingInvoice - current invoice if editing, null otherwise
 * @param {Function} onDownloadPDF - PDF download callback
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

  // --- COMPONENT STATE ---
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Customer info
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Invoice Items
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0, total: 0 }]);
  
  // Taxes and Discounts
  const [taxPercentage, setTaxPercentage] = useState(businessSettings?.defaultTax || 18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('Thank you for choosing BillMint! Payment is expected within due date.');
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // Load editing invoice details or auto-generate next invoice code
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setDate(editingInvoice.date);
      setDueDate(editingInvoice.dueDate);
      setSelectedCustomerId(editingInvoice.customerId || '');
      setCustomerName(editingInvoice.customerName);
      setCustomerPhone(editingInvoice.customerPhone || '');
      setCustomerEmail(editingInvoice.customerEmail || '');
      setCustomerAddress(editingInvoice.customerAddress || '');
      setItems(editingInvoice.items || []);
      setTaxPercentage(editingInvoice.taxPercentage);
      setDiscountAmount(editingInvoice.discountAmount);
      setNotes(editingInvoice.notes || '');
      setPaymentStatus(editingInvoice.paymentStatus);
    } else {
      // Set default dates (today and 14-days due)
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const due = futureDate.toISOString().split('T')[0];

      setDate(today);
      setDueDate(due);
      setInvoiceNumber(generateNextInvoiceNumber(invoices));
      setTaxPercentage(businessSettings?.defaultTax || 18);
      
      // Clear fields
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setItems([{ name: '', quantity: 1, price: 0, total: 0 }]);
      setDiscountAmount(0);
      setPaymentStatus('Pending');
    }
  }, [editingInvoice, invoices, businessSettings]);

  // --- CUSTOMER POPULATION BRIDGE ---
  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    
    if (custId === '') {
      // Clear for manual entry
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

  // --- PRODUCT POPULATION BRIDGE ---
  const handleProductSelect = (index, productId) => {
    if (productId === '') return;
    
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const updated = [...items];
      updated[index].name = prod.name;
      updated[index].price = prod.price;
      updated[index].total = updated[index].quantity * prod.price;
      setItems(updated);
    }
  };

  // --- LINE ITEMS MANAGEMENT ---
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field === 'quantity') {
      const qty = parseFloat(value) || 0;
      updated[index].quantity = qty;
      updated[index].total = qty * updated[index].price;
    } else if (field === 'price') {
      const prc = parseFloat(value) || 0;
      updated[index].price = prc;
      updated[index].total = updated[index].quantity * prc;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // --- REAL-TIME CALCULATIONS ---
  const { subtotal, taxAmount, grandTotal } = calculateTotals(items, taxPercentage, discountAmount);

  // --- SAVE OPERATION ---
  const handleSave = () => {
    if (!customerName) {
      alert('Please specify a customer name.');
      return;
    }

    const invalidItem = items.some(item => !item.name || item.quantity <= 0 || item.price < 0);
    if (invalidItem) {
      alert('Please fill out all item names and set valid quantities and prices.');
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
      notes,
      paymentStatus,
      subtotal,
      taxAmount,
      grandTotal,
    };

    onSaveInvoice(payload);
    setCurrentTab('invoices');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentTab('invoices')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>
        
        <h2 className="hidden sm:block text-base font-extrabold text-slate-800 tracking-tight">
          {editingInvoice ? 'Modify Transaction' : 'New Invoicing Sheet'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: BUILDER CONFIG */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Basic serial metadata */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3">Invoice Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block mb-1 text-slate-400">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold uppercase"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: CRM customer selector */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Client Information</h3>
              
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Autocomplete CRM</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Select Customer from CRM</label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-bold"
                >
                  <option value="">-- Type Client Details Manually --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@client.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Billing Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Suite 101, Tech Park..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic line items */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Line Items</h3>
              
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>Inventory Items catalog</span>
              </div>
            </div>

            {/* Desktop Headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">
              <div className="col-span-5">Name & Description</div>
              <div className="col-span-2">Quick Catalog</div>
              <div className="col-span-1.5 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1.5 text-right">Total</div>
            </div>

            <div className="space-y-4 sm:space-y-3">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-3 p-4 sm:p-2 bg-slate-50/50 sm:bg-transparent rounded-2xl sm:rounded-none border border-slate-100 sm:border-0 relative"
                >
                  {/* Delete button for mobile floating */}
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItemRow(index)}
                      className="sm:hidden absolute top-3 right-3 text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Name field */}
                  <div className="col-span-5 text-xs font-semibold text-slate-500">
                    <label className="sm:hidden block mb-1 text-slate-400">Item Description</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="e.g. Development consultation"
                      className="w-full px-3 py-2 bg-white sm:bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                    />
                  </div>

                  {/* Select Product Lookup */}
                  <div className="col-span-2 text-xs font-semibold text-slate-500">
                    <label className="sm:hidden block mb-1 text-slate-400">Inventory prefill</label>
                    <select
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      defaultValue=""
                      className="w-full px-2 py-2 bg-white sm:bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-500"
                    >
                      <option value="">-- Prefill --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qty field */}
                  <div className="col-span-1.5 text-xs font-semibold text-slate-500 sm:text-center">
                    <label className="sm:hidden block mb-1 text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-2 bg-white sm:bg-slate-50 border border-slate-100 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                    />
                  </div>

                  {/* Price field */}
                  <div className="col-span-2 text-xs font-semibold text-slate-500 sm:text-right">
                    <label className="sm:hidden block mb-1 text-slate-400">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 bg-white sm:bg-slate-50 border border-slate-100 rounded-xl sm:text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                    />
                  </div>

                  {/* Total field (Computed read-only) */}
                  <div className="col-span-1.5 flex items-center justify-between sm:justify-end text-xs font-black text-slate-700 py-2 sm:py-0 border-t sm:border-0 border-slate-100 mt-2 sm:mt-0">
                    <span className="sm:hidden text-slate-400 font-bold">Line Total:</span>
                    <span>{currencySymbol}{item.total.toFixed(2)}</span>

                    {/* Desktop delete button */}
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItemRow(index)}
                        className="hidden sm:block ml-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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

        {/* RIGHT COLUMN: TAX, STATUS & REALTIME MATH TALLY */}
        <div className="space-y-6">
          
          {/* Section 4: Taxes, Discounts and status */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3">Financial Overrides</h3>
            
            <div className="space-y-4 text-xs font-semibold text-slate-500">
              
              {/* Payment status */}
              <div>
                <label className="block mb-1 text-slate-400">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {/* Tax percentage */}
              <div>
                <label className="block mb-1 text-slate-400 flex items-center gap-1">
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
                <label className="block mb-1 text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-slate-300" />
                  <span>Flat Discount Amount</span>
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
                <label className="block mb-1 text-slate-400">Notes / Remarks</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for client..."
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Real-time math tally */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3">Tally Sheet</h3>
            
            <div className="space-y-3 text-xs font-semibold text-slate-500">
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
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-100/50 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Invoice Sheet</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreateInvoice;
