import { useState } from 'react';
import { generateNextInvoiceNumber } from '../utils/invoiceUtils';
import { toast } from 'react-hot-toast';
import { getCustomerLabelByType } from '../config/businessPresets';

const QuickBillModal = ({ isOpen, onClose, onSave, businessSettings, invoices }) => {
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.businessType || 'retail';
  const customerLabel = getCustomerLabelByType(wsType);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemService, setItemService] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  const handleSave = (downloadPdf = false) => {
    if (!customerName || !itemService || !rate) {
      toast.error('Customer name, item, and rate are required.');
      return;
    }
    
    const qty = parseFloat(quantity) || 1;
    const itemRate = parseFloat(rate) || 0;
    const amount = qty * itemRate;
    const paid = parseFloat(paidAmount) || 0;
    const balanceDue = amount - paid;
    const paymentStatus = paid >= amount ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Pending');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Construct the payload as expected by saveInvoice
    const payload = {
      id: 'inv-' + Date.now(),
      invoiceNumber: generateNextInvoiceNumber(invoices),
      date: today,
      dueDate: today,
      billType: businessSettings?.defaultBillingTemplate || 'custom',
      customerId: null, // Will create new customer if doesn't exist
      customerName,
      customerPhone,
      items: [{
        sn: 1,
        itemService: itemService,
        description: itemService, // generic fallback
        qty,
        rate: itemRate,
        amount
      }],
      taxPercentage: 0,
      discountAmount: 0,
      amountPaid: paid,
      balanceDue,
      notes,
      paymentStatus,
      orderStatus: 'Pending',
      subtotal: amount,
      taxAmount: 0,
      grandTotal: amount,
    };
    
    // Call the global save function
    onSave(payload, true); // true = save as new customer
    toast.success('Quick Bill Saved!');
    
    if (downloadPdf) {
      // PDF download will be triggered in App.js or we dispatch an event
      window.dispatchEvent(new CustomEvent('download-quick-bill-pdf', { detail: payload }));
    }
    
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setItemService('');
    setQuantity(1);
    setRate('');
    setPaidAmount('');
    setNotes('');
    
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="⚡ Quick Bill">
      <div className="space-y-4">
        {/* Customer Section */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">{customerLabel} Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">Phone (Optional)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
              placeholder="Phone"
            />
          </div>
        </div>

        {/* Item Section */}
        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1">Item / Service Name *</label>
          <input
            type="text"
            value={itemService}
            onChange={(e) => setItemService(e.target.value)}
            className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
            placeholder="What are you selling?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">Rate *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-theme-muted font-bold">{businessSettings?.currency || '₹'}</span>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">Total Amount</label>
            <div className="w-full px-3 py-2 bg-theme-surface dark:bg-theme-card border border-theme-border-soft rounded-lg text-sm font-bold text-theme-primary dark:text-theme-primary">
              {businessSettings?.currency || '₹'} {((parseFloat(quantity) || 1) * (parseFloat(rate) || 0)).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1">Amount Paid</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-theme-muted font-bold">{businessSettings?.currency || '₹'}</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-accent"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1">Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-semibold text-theme-primary dark:text-theme-primary"
            placeholder="Add a note..."
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSave(false)}
            className="w-full py-3 bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Only
          </button>
          <button
            onClick={() => handleSave(true)}
            className="w-full py-3 bg-theme-accent text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Save & PDF
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default QuickBillModal;
