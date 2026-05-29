import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileDown, 
  CheckCircle2, 
  Copy, 
  Check, 
  Info, 
  Upload, 
  AlertCircle, 
  Landmark, 
  Wallet, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  Megaphone
} from 'lucide-react';
import { downloadInvoicePDF } from '../utils/pdfUtils';
import { saveInvoicePublicly } from '../utils/storage';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/invoiceUtils';

const PublicInvoice = ({ initialInvoice }) => {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [copiedText, setCopiedText] = useState('');
  
  // Sync state if initialInvoice resolves later (async)
  useEffect(() => {
    console.log('[DEBUG] PublicInvoice - initialInvoice updated:', initialInvoice);
    setInvoice(initialInvoice);
  }, [initialInvoice]);
  
  // "I Have Paid" Form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payMethod, setPayMethod] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setPayAmount(String(invoice.balanceDue || invoice.grandTotal || ''));
      // Pre-select default payment method if available
      const payPrefs = invoice.paymentSettingsSnapshot;
      if (payPrefs?.paymentMethod) {
        setPayMethod(payPrefs.paymentMethod);
      } else {
        setPayMethod('Manual');
      }
    }
  }, [invoice]);

  if (!invoice) {
    const requestedToken = window.location.pathname.split('/').pop() || 'N/A';
    return (
      <div className="min-h-screen bg-theme-app flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <AlertCircle className="w-16 h-16 text-theme-danger mb-4 animate-bounce" />
        <h1 className="text-2xl font-black mb-2 text-white">Invoice Not Found</h1>
        <p className="text-theme-muted text-sm max-w-md mb-8">
          The invoice link you followed may have expired, been deleted, or contains an incorrect public token.
        </p>
        
        {/* Dynamic Diagnostics Box for Developer Debugging */}
        <div className="w-full max-w-lg bg-theme-card border border-slate-800 rounded-3xl p-5 text-left font-mono text-[11px] text-theme-muted space-y-2.5 shadow-2xl">
          <div className="font-extrabold text-theme-accent border-b border-slate-800 pb-2 uppercase text-[10px] tracking-wider flex items-center justify-between">
            <span>System Diagnostics (DEBUG)</span>
            <span className="bg-theme-accent-dark text-theme-accent px-2 py-0.5 rounded-full text-[8px] font-black">Live</span>
          </div>
          <div>
            <span className="text-theme-muted">Requested Token:</span>{' '}
            <span className="text-theme-accent select-all font-bold">{requestedToken}</span>
          </div>
          <div>
            <span className="text-theme-muted">Firebase Ready:</span>{' '}
            <span className={window.billqyro_firebaseReady ? "text-theme-accent font-bold" : "text-theme-danger font-bold"}>
              {window.billqyro_firebaseReady ? 'TRUE (Connected)' : 'FALSE (Offline fallback mode)'}
            </span>
          </div>
          {window.billqyro_lastError && (
            <div className="border-t border-slate-800 pt-2.5 mt-2.5">
              <span className="text-theme-danger font-bold block mb-1">Query Error / Status:</span>
              <pre className="whitespace-pre-wrap bg-theme-app p-3 rounded-xl border border-rose-950/40 text-rose-300 select-all font-semibold max-h-40 overflow-y-auto leading-relaxed">{window.billqyro_lastError}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Destructure Snapshots (TASK 11)
  const business = invoice.businessSnapshot || {
    businessName: 'BillQyro Store',
    logoUrl: '',
    ownerName: 'Manager',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    gstNumber: '',
    currency: '₹',
    taxLabel: 'GSTIN'
  };

  const paymentPrefs = invoice.paymentSettingsSnapshot || {
    paymentQrEnabled: false,
    paymentMethod: 'Manual',
    upiId: '',
    bkashNumber: '',
    nagadNumber: '',
    rocketNumber: '',
    payeeName: business.businessName,
    paymentNote: '',
    customPaymentLink: '',
    customerLiveLinkSettings: {
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

  const liveLinkPrefs = paymentPrefs.customerLiveLinkSettings || {
    enableLiveInvoiceLink: true,
    showPaymentQr: true,
    allowCustomerPdfDownload: true,
    allowPaymentProofSubmit: true,
    showPaidDueAmount: true,
    showContactButton: true,
    requireTransactionId: true,
    requirePaymentScreenshot: false
  };

  const regionalPrefs = invoice.regionalSettingsSnapshot || {
    country: business.country || 'India',
    currency: business.currency || '₹',
    currencyCode: 'INR',
    language: 'English',
    taxLabel: business.taxLabel || 'Tax',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian'
  };

  const currencySymbol = regionalPrefs.currency || '₹';
  const taxLabelText = regionalPrefs.taxLabel || 'Tax';
  const country = regionalPrefs.country || 'India';

  // Format currency helpers using active numberFormat
  const formatVal = (val) => formatCurrency(val, currencySymbol, regionalPrefs.numberFormat || 'Indian');

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Generate UPI pay link (TASK 4)
  const dueAmount = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal;
  const upiLink = `upi://pay?pa=${paymentPrefs.upiId}&pn=${encodeURIComponent(paymentPrefs.payeeName || business.businessName)}&am=${dueAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    paymentPrefs.paymentMethod === 'UPI' ? upiLink : (
      paymentPrefs.paymentMethod === 'bKash' ? `bKash: ${paymentPrefs.bkashNumber}, Invoice: ${invoice.invoiceNumber}, Amount: ${dueAmount}` : (
        paymentPrefs.paymentMethod === 'Nagad' ? `Nagad: ${paymentPrefs.nagadNumber}, Invoice: ${invoice.invoiceNumber}, Amount: ${dueAmount}` :
        paymentPrefs.customPaymentLink || 'Manual QR'
      )
    )
  )}`;

  // Handle Screenshot conversion to Base64
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit. Please upload a smaller screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshot(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit proof (TASK 5)
  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!payMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Please specify a valid payment amount.');
      return;
    }
    if (liveLinkPrefs.requireTransactionId && !txnId.trim()) {
      toast.error('Transaction ID is required for verification.');
      return;
    }
    if (liveLinkPrefs.requirePaymentScreenshot && !screenshot) {
      toast.error('Please upload a payment screenshot proof.');
      return;
    }

    setIsSubmitting(true);

    const newProof = {
      id: 'proof-' + Date.now(),
      method: payMethod,
      amount: parseFloat(payAmount),
      transactionId: txnId.trim(),
      screenshot: screenshot,
      screenshotUrl: screenshot,
      note: customerNote.trim(),
      notes: customerNote.trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };

    // Update locally and in cloud
    const updatedInvoice = {
      ...invoice,
      paymentStatus: 'Payment Submitted', // Trigger status badge color: purple/blue
      paymentProofs: [...(invoice.paymentProofs || []), newProof]
    };

    const res = await saveInvoicePublicly(updatedInvoice);
    setIsSubmitting(false);

    if (res.status === 'success') {
      setInvoice(updatedInvoice);
      setShowPaymentForm(false);
      setTxnId('');
      setScreenshot('');
      setCustomerNote('');
      toast.success('Payment proof successfully submitted! Our team will verify and update your invoice shortly.', { duration: 5000 });
    } else {
      toast.error('Failed to submit proof. Please check your network connection.');
    }
  };

  const handleDownloadPDF = () => {
    downloadInvoicePDF(invoice, business, true)
      .then((ok) => {
        if (ok) {
          toast.success('Invoice PDF downloaded successfully!');
        } else {
          toast.error('Failed to generate PDF invoice.');
        }
      });
  };

  // Status badge style helper (TASK 10)
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent/10 dark:text-theme-accent border border-theme-border-soft dark:border-theme-accent/20';
      case 'Partially Paid':
        return 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent/10 dark:text-theme-accent border border-theme-border-soft dark:border-theme-accent/20';
      case 'Payment Submitted':
      case 'Submitted':
      case 'Pending Verification':
        return 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent/10 dark:text-theme-accent border border-theme-border-soft dark:border-theme-accent/20';
      case 'Pending':
      case 'Unpaid':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-theme-warning/30 dark:border-amber-900';
      case 'Overdue':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-theme-danger/30 dark:border-rose-900';
      case 'Cancelled':
        return 'bg-theme-surface dark:bg-theme-card text-theme-muted dark:bg-theme-card dark:text-theme-muted border border-theme-border-soft dark:border-theme-border-soft';
      default:
        return 'bg-theme-surface dark:bg-theme-card text-slate-650';
    }
  };

  return (
    <div className="min-h-screen bg-theme-app dark:bg-theme-surface dark:bg-theme-app py-10 px-4 md:px-6 flex flex-col items-center justify-between font-sans antialiased text-theme-primary dark:text-theme-primary dark:text-slate-250">
      
      {/* Top Floating Control Bar */}
      <div className="max-w-4xl w-full flex items-center justify-between gap-4 mb-6 z-10 bg-theme-card dark:bg-theme-card/70 dark:bg-theme-card/70 p-4 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-theme-accent to-theme-accent-dark text-white flex items-center justify-center font-bold text-sm shadow-md shadow-glow">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              business.businessName.charAt(0) || 'B'
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary dark:text-theme-primary truncate max-w-[150px] sm:max-w-xs">{business.businessName}</h1>
            <span className="text-[10px] font-bold text-theme-muted block uppercase tracking-wider">SECURE DIGITAL BILL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveLinkPrefs.allowCustomerPdfDownload && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft dark:bg-theme-card dark:hover:bg-slate-700 text-theme-primary dark:text-theme-muted dark:text-slate-250 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}

          {liveLinkPrefs.allowPaymentProofSubmit && invoice.paymentStatus !== 'Paid' && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center justify-center gap-2 py-2 px-5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
            >
              <Wallet className="w-4 h-4" />
              <span>{showPaymentForm ? 'View Invoice' : 'I Have Paid'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-6 items-start relative">

        {/* --- LEFT: DYNAMIC INVOICE DISPLAY CARD (Strictly Read-Only) --- */}
        <div className="w-full lg:flex-1 bg-theme-card dark:bg-theme-card rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium p-6 md:p-8 space-y-6 relative overflow-hidden">
          
          {/* Elegant top color band */}
          <div className="absolute top-0 left-0 w-full h-2.5 bg-[image:var(--accent-gradient)]"></div>

          {/* Invoice Meta header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-theme-primary dark:text-theme-primary tracking-tight flex items-center gap-2">
                <span>Invoice</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusBadgeStyle(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus}
                </span>
              </h2>
              <p className="text-xs text-theme-muted dark:text-theme-muted font-bold uppercase tracking-wider">
                ID: {invoice.invoiceNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-theme-muted text-right sm:text-right">
              <div>
                <span className="text-[10px] text-theme-muted block uppercase font-black">Issue Date</span>
                <span className="text-theme-primary dark:text-theme-muted dark:text-theme-muted">{invoice.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-theme-muted block uppercase font-black">Due Date</span>
                <span className="text-slate-750 dark:text-theme-muted font-bold">{invoice.dueDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Business & Customer Address segment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-550 dark:text-theme-muted">
            <div className="space-y-2 p-4 bg-theme-app dark:bg-theme-surface/50 dark:bg-theme-app/20 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft">
              <span className="text-[10px] text-theme-muted uppercase font-black tracking-widest block">Invoiced From</span>
              <strong className="text-theme-primary dark:text-theme-primary text-sm block">{business.businessName}</strong>
              {business.ownerName && <p className="text-[11px]">Owner: {business.ownerName}</p>}
              {business.phone && <p className="text-[11px]">Phone: {business.phone}</p>}
              {business.email && <p className="text-[11px] truncate">Email: {business.email}</p>}
              {business.address && <p className="text-[10px] text-theme-muted leading-relaxed mt-1 whitespace-pre-wrap">{business.address}</p>}
              {business.gstNumber && <p className="text-[10px] font-black text-theme-accent mt-2 uppercase">{taxLabelText}: {business.gstNumber}</p>}
            </div>

            <div className="space-y-2 p-4 bg-theme-app dark:bg-theme-surface/50 dark:bg-theme-app/20 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft">
              <span className="text-[10px] text-theme-muted uppercase font-black tracking-widest block">Invoiced To</span>
              <strong className="text-theme-primary dark:text-theme-primary text-sm block">{invoice.customerName}</strong>
              {invoice.customerPhone && <p className="text-[11px]">Phone: {invoice.customerPhone}</p>}
              {invoice.customerEmail && <p className="text-[11px] truncate">Email: {invoice.customerEmail}</p>}
              {invoice.customerAddress && <p className="text-[10px] text-theme-muted leading-relaxed mt-1 whitespace-pre-wrap">{invoice.customerAddress}</p>}
            </div>
          </div>

          {/* Items Table Display (Strictly Read-Only) */}
          <div className="border border-theme-border-soft dark:border-theme-border-soft rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#071B3A] text-white text-[10px] uppercase font-black tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-[60px]">S.N.</th>
                    {invoice.billType === 'grocery' ? (
                      <>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4 text-center">Unit</th>
                        <th className="py-3.5 px-4 text-center w-[80px]">Qty</th>
                        <th className="py-3.5 px-4 text-right w-[110px]">Price</th>
                      </>
                    ) : invoice.billType === 'repair' ? (
                      <>
                        <th className="py-3.5 px-4">Service</th>
                        <th className="py-3.5 px-4">Problem Details</th>
                        <th className="py-3.5 px-4 text-center w-[80px]">Qty</th>
                        <th className="py-3.5 px-4 text-right w-[110px]">Labour + Parts</th>
                      </>
                    ) : invoice.billType === 'retail' ? (
                      <>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Variant</th>
                        <th className="py-3.5 px-4 text-center w-[70px]">Qty</th>
                        <th className="py-3.5 px-4 text-right w-[100px]">Price</th>
                        <th className="py-3.5 px-4 text-right w-[100px]">Discount</th>
                      </>
                    ) : invoice.billType === 'custom' ? (
                      <>
                        <th className="py-3.5 px-4">Item / Service</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4 text-center w-[80px]">Qty</th>
                        <th className="py-3.5 px-4 text-right w-[110px]">Rate</th>
                      </>
                    ) : (
                      // embroidery (default)
                      <>
                        <th className="py-3.5 px-4 w-[110px]">Design No</th>
                        <th className="py-3.5 px-4 w-[120px]">Work Type</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4 text-center w-[70px]">Qty</th>
                        <th className="py-3.5 px-4 text-right w-[100px]">Rate</th>
                      </>
                    )}
                    <th className="py-3.5 px-4 text-right w-[120px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-theme-primary dark:text-theme-muted">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-theme-app dark:bg-theme-surface/50 dark:hover:bg-slate-850/30">
                      <td className="py-3 px-4 text-center text-theme-muted font-bold">{idx + 1}</td>
                      {invoice.billType === 'grocery' ? (
                        <>
                          <td className="py-3 px-4 text-theme-primary dark:text-theme-primary font-extrabold">{item.description || 'Product'}</td>
                          <td className="py-3 px-4 text-center">{item.size || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : invoice.billType === 'repair' ? (
                        <>
                          <td className="py-3 px-4 text-theme-primary dark:text-theme-primary font-extrabold">{item.designNo || 'Service'}</td>
                          <td className="py-3 px-4">{item.description || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : invoice.billType === 'retail' ? (
                        <>
                          <td className="py-3 px-4 text-theme-primary dark:text-theme-primary font-extrabold">{item.productName || 'Product'}</td>
                          <td className="py-3 px-4">{item.sizeVariant || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.price)}</td>
                          <td className="py-3 px-4 text-right text-theme-danger">-{formatVal(item.discount)}</td>
                        </>
                      ) : invoice.billType === 'custom' ? (
                        <>
                          <td className="py-3 px-4 text-theme-primary dark:text-theme-primary font-extrabold">{item.itemService || 'Item'}</td>
                          <td className="py-3 px-4">{item.description || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : (
                        // embroidery
                        <>
                          <td className="py-3 px-4 text-theme-primary dark:text-theme-primary font-extrabold">{item.designNo || 'N/A'}</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black">{item.workType || 'Embroidery'}</span></td>
                          <td className="py-3 px-4">{item.description || 'Stitching Service'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      )}
                      <td className="py-3 px-4 text-right font-black text-theme-primary dark:text-theme-primary">{formatVal(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes block */}
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start pt-4 border-t border-theme-border-soft dark:border-theme-border-soft/80">
            <div className="w-full sm:w-[50%] p-4 bg-theme-app dark:bg-theme-surface dark:bg-theme-app/20 border border-theme-border-soft/40 dark:border-theme-border-soft rounded-2xl text-xs font-semibold text-theme-muted">
              <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block mb-1.5">Invoice Notes & Terms</span>
              <p className="whitespace-pre-wrap leading-relaxed">{invoice.notes || 'Thank you for your business!'}</p>
              {invoice.terms && (
                <div className="mt-3 pt-3 border-t border-theme-border-soft dark:border-theme-border-soft dark:border-slate-850">
                  <span className="text-[9px] text-theme-muted font-black uppercase block mb-1">Terms</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-[40%] text-xs font-semibold text-theme-muted space-y-2">
              <div className="flex justify-between py-1.5 border-b border-theme-border-soft dark:border-slate-850">
                <span className="text-theme-muted">Subtotal</span>
                <span className="text-slate-850 dark:text-theme-secondary">{formatVal(invoice.subtotal)}</span>
              </div>
              
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-theme-border-soft dark:border-slate-850">
                  <span className="text-theme-muted">Discount</span>
                  <span className="text-theme-danger">-{formatVal(invoice.discountAmount)}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-theme-border-soft dark:border-slate-850">
                  <span className="text-theme-muted">{taxLabelText} ({invoice.taxPercentage}%)</span>
                  <span className="text-slate-850 dark:text-theme-secondary">{formatVal(invoice.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2.5 bg-theme-surface dark:bg-theme-surface dark:bg-theme-accent/10 px-3.5 rounded-xl text-theme-primary dark:text-theme-primary font-extrabold text-sm border border-theme-border-soft dark:border-theme-accent/20">
                <span>Grand Total</span>
                <span>{formatVal(invoice.grandTotal)}</span>
              </div>

              {liveLinkPrefs.showPaidDueAmount && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-theme-border-soft dark:border-slate-850 px-1 text-theme-accent dark:text-theme-accent">
                    <span>Amount Paid</span>
                    <span className="font-extrabold">{formatVal(invoice.amountPaid || 0)}</span>
                  </div>

                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between py-2 border-b border-rose-100 dark:border-rose-900 px-1 text-theme-danger dark:text-rose-450 font-black text-xs">
                      <span>Outstanding Balance Due</span>
                      <span>{formatVal(invoice.balanceDue)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Secure lock footer */}
          <div className="text-center pt-4 border-t border-theme-border-soft dark:border-theme-border-soft/80 text-[10px] text-theme-muted font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-theme-accent" />
            <span>Securely Compiled by BillQyro Invoicing SaaS</span>
          </div>

        </div>

        {/* --- RIGHT PANEL: SECURE INTERACTIVE CHECKOUT GATEWAY --- */}
        {invoice.paymentStatus !== 'Paid' && (
          <div className="w-full lg:w-[350px] shrink-0 space-y-6">

            {/* PAYMENT BOX GATEWAY (TASK 4) */}
            {!showPaymentForm ? (
              <div className="bg-theme-card text-white rounded-3xl border border-slate-800 shadow-premium p-6 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-theme-accent-light rounded-full blur-2xl pointer-events-none"></div>
                
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light border border-theme-border-soft px-2.5 py-1 rounded-full w-fit">
                    Payment Hub
                  </span>
                  <h3 className="text-lg font-black mt-2">Instant Invoicing Gateway</h3>
                  <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">CHOOSE YOUR SETTLEMENT METHOD</p>
                </div>

                {liveLinkPrefs.showPaymentQr && paymentPrefs.paymentQrEnabled && (
                  <div className="bg-theme-card dark:bg-theme-card p-3 rounded-2xl max-w-[180px] mx-auto shadow-md border border-slate-850">
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan to Pay QR" 
                      className="w-full h-auto object-contain rounded-lg bg-theme-card dark:bg-theme-card" 
                    />
                    <span className="text-[8px] text-theme-muted font-bold uppercase block text-center mt-1.5">Scan to pay now</span>
                  </div>
                )}

                {/* Country payment instructions */}
                <div className="space-y-4 pt-2">
                  
                  {/* INDIA UPI INSTRUCTIONS */}
                  {paymentPrefs.paymentMethod === 'UPI' && (
                    <div className="space-y-2">
                      <a
                        href={upiLink}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Pay with UPI Apps</span>
                      </a>
                      
                      <div className="flex items-center justify-between p-2.5 bg-theme-card dark:bg-theme-surface/5 border border-white/10 rounded-xl text-xs font-bold mt-1">
                        <span className="text-theme-muted">UPI ID: <strong className="text-white ml-1">{paymentPrefs.upiId}</strong></span>
                        <button
                          onClick={() => handleCopy(paymentPrefs.upiId, 'UPI ID')}
                          className="text-theme-accent hover:text-theme-accent cursor-pointer shrink-0 ml-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* BANGLADESH MOBILE FINANCIAL SERVICES */}
                  {(paymentPrefs.paymentMethod === 'bKash' || paymentPrefs.paymentMethod === 'Nagad' || paymentPrefs.paymentMethod === 'Rocket') && (
                    <div className="space-y-3.5">
                      
                      {/* Stylized MFS numbers */}
                      {[
                        { name: 'bKash', num: paymentPrefs.bkashNumber, color: 'border-pink-500/20 bg-pink-500/5 text-pink-400' },
                        { name: 'Nagad', num: paymentPrefs.nagadNumber, color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
                        { name: 'Rocket', num: paymentPrefs.rocketNumber, color: 'border-theme-border-soft bg-theme-accent-light text-theme-accent' }
                      ].map((mfs) => {
                        if (!mfs.num) return null;
                        return (
                          <div key={mfs.name} className={`flex items-center justify-between p-3 border rounded-xl text-xs font-black ${mfs.color}`}>
                            <span className="uppercase">{mfs.name}: <strong className="text-white font-extrabold ml-1.5">{mfs.num}</strong></span>
                            <button
                              type="button"
                              onClick={() => handleCopy(mfs.num, mfs.name + ' Number')}
                              className="text-theme-muted hover:text-white shrink-0 ml-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      <div className="p-3 bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl text-[10px] text-theme-muted leading-relaxed space-y-1">
                        <span className="font-extrabold text-white block uppercase tracking-wider mb-1">Manual Transfer Steps:</span>
                        <p>1. Open wallet app (bKash/Nagad).</p>
                        <p>2. Select Send Money / Cash Out to active number.</p>
                        <p>3. Enter Reference invoice number: <strong className="text-white">{invoice.invoiceNumber}</strong></p>
                        <p>4. Input outstanding total: <strong className="text-white">{formatVal(dueAmount)}</strong></p>
                        <p>5. Copy Transaction ID and click "I Have Paid" below.</p>
                      </div>

                    </div>
                  )}

                  {/* OTHER CUSTOM BANK TRANSFERS */}
                  {paymentPrefs.paymentMethod === 'Manual' && (
                    <div className="space-y-3">
                      {paymentPrefs.customPaymentLink && (
                        <div className="p-3 bg-theme-card dark:bg-theme-surface/5 border border-white/10 rounded-xl text-xs font-bold leading-relaxed text-theme-muted">
                          <span className="text-[9px] text-theme-muted uppercase font-black block mb-1">Payment instructions</span>
                          <p>{paymentPrefs.customPaymentLink}</p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl text-[10px] text-theme-muted space-y-1 leading-relaxed">
                        <span className="font-extrabold text-white block uppercase tracking-wider">Instructions:</span>
                        <p>Complete transfer of total funds. Note reference ID or take screenshot, then submit verify proof below.</p>
                      </div>
                    </div>
                  )}

                  {/* Payment footnote */}
                  {paymentPrefs.paymentNote && (
                    <p className="text-[10px] text-theme-muted font-bold italic text-center leading-relaxed">
                      * {paymentPrefs.paymentNote}
                    </p>
                  )}

                  {/* Direct payment proof link */}
                  {liveLinkPrefs.allowPaymentProofSubmit && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-theme-card dark:bg-theme-surface/5 hover:bg-theme-card dark:bg-theme-card/10 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all border border-white/10 cursor-pointer hover:border-white/20 active:scale-98"
                    >
                      <span>I Have Completed Payment</span>
                      <ArrowRight className="w-4 h-4 text-theme-accent" />
                    </button>
                  )}

                </div>
              </div>
            ) : (
              // SUBMIT PAYMENT PROOF SCREEN (TASK 5)
              <div className="bg-theme-card dark:bg-theme-card rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium p-6 space-y-4 animate-scaleUp text-xs font-semibold text-theme-muted">
                <div className="flex items-center gap-2.5 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Submit Payment Proof</h3>
                    <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider block">Verify your transfer</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-4">
                  
                  <div>
                    <label className="block mb-1 text-theme-muted font-bold uppercase text-[9px] tracking-wider">Settlement Method *</label>
                    <select
                      required
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                    >
                      {country === 'India' && <option value="UPI">UPI Transfer</option>}
                      {country === 'Bangladesh' && (
                        <>
                          <option value="bKash">bKash wallet</option>
                          <option value="Nagad">Nagad wallet</option>
                          <option value="Rocket">Rocket wallet</option>
                        </>
                      )}
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                      <option value="Cash">Manual Cash Settlement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-theme-muted font-bold uppercase text-[9px] tracking-wider">Paid Amount *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-theme-muted font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-primary font-extrabold"
                      />
                    </div>
                    <span className="text-[8px] text-theme-muted mt-1 block">Specify exact amount sent (supports partial settlements)</span>
                  </div>

                  <div>
                    <label className="block mb-1 text-theme-muted font-bold uppercase text-[9px] tracking-wider">
                      Transaction / Reference ID {liveLinkPrefs.requireTransactionId && '*'}
                    </label>
                    <input
                      type="text"
                      required={liveLinkPrefs.requireTransactionId}
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      placeholder="e.g. TXN10003028"
                      className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-slate-805 dark:text-theme-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-theme-muted font-bold uppercase text-[9px] tracking-wider">
                      Upload screenshot proof {liveLinkPrefs.requirePaymentScreenshot && '*'}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          required={liveLinkPrefs.requirePaymentScreenshot}
                          onChange={handleScreenshotChange}
                          className="hidden"
                          id="payment-proof-upload"
                        />
                        <label
                          htmlFor="payment-proof-upload"
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card hover:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl cursor-pointer transition-all text-theme-primary dark:text-theme-muted dark:text-theme-muted"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Choose Screenshot</span>
                        </label>
                      </div>
                      {screenshot && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-theme-border-soft bg-theme-surface dark:bg-theme-card flex items-center justify-center shadow-sm relative group shrink-0">
                          <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-theme-muted font-bold uppercase text-[9px] tracking-wider">Notes / Memo (Optional)</label>
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Add any details for the verification clerk..."
                      rows="2"
                      className="w-full px-4 py-2 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-slate-850 dark:text-theme-secondary resize-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1 py-3 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft dark:bg-theme-card dark:hover:bg-slate-700 text-theme-primary dark:text-theme-muted dark:text-slate-250 font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <span>Verify & Submit</span>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* Quick Contact Button */}
            {liveLinkPrefs.showContactButton && (business.phone || business.email) && (
              <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-3.5 text-xs font-semibold text-theme-muted">
                <span className="text-[10px] text-theme-muted font-black uppercase tracking-wider block">Need help with invoice?</span>
                <p className="text-theme-muted font-medium">Contact our account representative directly for corrections or billing questions.</p>
                <div className="grid grid-cols-1 gap-2 pt-1.5">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-theme-accent-light hover:bg-theme-accent-light text-theme-accent font-bold rounded-xl transition-all cursor-pointer dark:bg-theme-accent-light dark:text-theme-accent"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {business.phone}</span>
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}?subject=Inquiry%20Invoice%20${invoice.invoiceNumber}`}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-theme-accent-light hover:bg-theme-accent-light text-theme-accent font-bold rounded-xl transition-all cursor-pointer dark:bg-theme-accent-light dark:text-theme-accent"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Representative</span>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Floating Watermark */}
      <div className="mt-10 text-center text-[10px] font-black text-theme-muted uppercase tracking-widest leading-none z-10 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
        <span>BillQyro Billing Platform</span>
      </div>

    </div>
  );
};

export default PublicInvoice;
