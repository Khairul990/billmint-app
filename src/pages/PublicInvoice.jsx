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
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black mb-2">Invoice Not Found</h1>
        <p className="text-slate-400 text-sm max-w-md">
          The invoice link you followed may have expired, been deleted, or contains an incorrect public token.
        </p>
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

  const currencySymbol = business.currency || '₹';
  const taxLabelText = business.taxLabel || 'Tax';
  const country = business.country || 'India';

  // Format currency helpers
  const formatVal = (val) => `${currencySymbol}${parseFloat(val || 0).toFixed(2)}`;

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
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
      case 'Partially Paid':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
      case 'Payment Submitted':
      case 'Submitted':
      case 'Pending Verification':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900';
      case 'Pending':
      case 'Unpaid':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
      case 'Overdue':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 dark:border-rose-900';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-650';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-6 flex flex-col items-center justify-between font-sans antialiased text-slate-800 dark:text-slate-250">
      
      {/* Top Floating Control Bar */}
      <div className="max-w-4xl w-full flex items-center justify-between gap-4 mb-6 z-10 bg-white/70 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/10">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              business.businessName.charAt(0) || 'B'
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-xs">{business.businessName}</h1>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">SECURE DIGITAL BILL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveLinkPrefs.allowCustomerPdfDownload && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}

          {liveLinkPrefs.allowPaymentProofSubmit && invoice.paymentStatus !== 'Paid' && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center justify-center gap-2 py-2 px-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
            >
              <Wallet className="w-4 h-4" />
              <span>{showPaymentForm ? 'View Invoice' : 'I Have Paid'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-6 items-start relative">

        {/* --- LEFT: DYNAMIC INVOICE DISPLAY CARD (Strictly Read-Only) --- */}
        <div className="w-full lg:flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium p-6 md:p-8 space-y-6 relative overflow-hidden">
          
          {/* Elegant top color band */}
          <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500"></div>

          {/* Invoice Meta header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-b border-slate-50 dark:border-slate-800/80 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Invoice</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusBadgeStyle(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                ID: {invoice.invoiceNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 text-right sm:text-right">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-black">Issue Date</span>
                <span className="text-slate-700 dark:text-slate-350">{invoice.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-black">Due Date</span>
                <span className="text-slate-750 dark:text-slate-300 font-bold">{invoice.dueDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Business & Customer Address segment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-550 dark:text-slate-300">
            <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Invoiced From</span>
              <strong className="text-slate-900 dark:text-white text-sm block">{business.businessName}</strong>
              {business.ownerName && <p className="text-[11px]">Owner: {business.ownerName}</p>}
              {business.phone && <p className="text-[11px]">Phone: {business.phone}</p>}
              {business.email && <p className="text-[11px] truncate">Email: {business.email}</p>}
              {business.address && <p className="text-[10px] text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap">{business.address}</p>}
              {business.gstNumber && <p className="text-[10px] font-black text-indigo-500 mt-2 uppercase">{taxLabelText}: {business.gstNumber}</p>}
            </div>

            <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Invoiced To</span>
              <strong className="text-slate-900 dark:text-white text-sm block">{invoice.customerName}</strong>
              {invoice.customerPhone && <p className="text-[11px]">Phone: {invoice.customerPhone}</p>}
              {invoice.customerEmail && <p className="text-[11px] truncate">Email: {invoice.customerEmail}</p>}
              {invoice.customerAddress && <p className="text-[10px] text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap">{invoice.customerAddress}</p>}
            </div>
          </div>

          {/* Items Table Display (Strictly Read-Only) */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      {invoice.billType === 'grocery' ? (
                        <>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-extrabold">{item.description || 'Product'}</td>
                          <td className="py-3 px-4 text-center">{item.size || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : invoice.billType === 'repair' ? (
                        <>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-extrabold">{item.designNo || 'Service'}</td>
                          <td className="py-3 px-4">{item.description || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : invoice.billType === 'retail' ? (
                        <>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-extrabold">{item.productName || 'Product'}</td>
                          <td className="py-3 px-4">{item.sizeVariant || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.price)}</td>
                          <td className="py-3 px-4 text-right text-rose-500">-{formatVal(item.discount)}</td>
                        </>
                      ) : invoice.billType === 'custom' ? (
                        <>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-extrabold">{item.itemService || 'Item'}</td>
                          <td className="py-3 px-4">{item.description || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      ) : (
                        // embroidery
                        <>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-extrabold">{item.designNo || 'N/A'}</td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black">{item.workType || 'Embroidery'}</span></td>
                          <td className="py-3 px-4">{item.description || 'Stitching Service'}</td>
                          <td className="py-3 px-4 text-center">{item.qty}</td>
                          <td className="py-3 px-4 text-right">{formatVal(item.rate)}</td>
                        </>
                      )}
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">{formatVal(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes block */}
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start pt-4 border-t border-slate-50 dark:border-slate-800/80">
            <div className="w-full sm:w-[50%] p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-150/40 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-500">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Invoice Notes & Terms</span>
              <p className="whitespace-pre-wrap leading-relaxed">{invoice.notes || 'Thank you for your business!'}</p>
              {invoice.terms && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">Terms</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-[40%] text-xs font-semibold text-slate-500 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-850 dark:text-slate-200">{formatVal(invoice.subtotal)}</span>
              </div>
              
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-rose-500">-{formatVal(invoice.discountAmount)}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">Tax ({invoice.taxPercentage}%)</span>
                  <span className="text-slate-850 dark:text-slate-200">{formatVal(invoice.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2.5 bg-indigo-50/50 dark:bg-indigo-950/25 px-3.5 rounded-xl text-slate-900 dark:text-white font-extrabold text-sm border border-indigo-100/50 dark:border-indigo-900/50">
                <span>Grand Total</span>
                <span>{formatVal(invoice.grandTotal)}</span>
              </div>

              {liveLinkPrefs.showPaidDueAmount && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850 px-1 text-emerald-600 dark:text-emerald-400">
                    <span>Amount Paid</span>
                    <span className="font-extrabold">{formatVal(invoice.amountPaid || 0)}</span>
                  </div>

                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between py-2 border-b border-rose-100 dark:border-rose-900 px-1 text-rose-600 dark:text-rose-450 font-black text-xs">
                      <span>Outstanding Balance Due</span>
                      <span>{formatVal(invoice.balanceDue)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Secure lock footer */}
          <div className="text-center pt-4 border-t border-slate-50 dark:border-slate-800/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Securely Compiled by BillQyro Invoicing SaaS</span>
          </div>

        </div>

        {/* --- RIGHT PANEL: SECURE INTERACTIVE CHECKOUT GATEWAY --- */}
        {invoice.paymentStatus !== 'Paid' && (
          <div className="w-full lg:w-[350px] shrink-0 space-y-6">

            {/* PAYMENT BOX GATEWAY (TASK 4) */}
            {!showPaymentForm ? (
              <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-premium p-6 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full w-fit">
                    Payment Hub
                  </span>
                  <h3 className="text-lg font-black mt-2">Instant Invoicing Gateway</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">CHOOSE YOUR SETTLEMENT METHOD</p>
                </div>

                {liveLinkPrefs.showPaymentQr && paymentPrefs.paymentQrEnabled && (
                  <div className="bg-white p-3 rounded-2xl max-w-[180px] mx-auto shadow-md border border-slate-850">
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan to Pay QR" 
                      className="w-full h-auto object-contain rounded-lg bg-white" 
                    />
                    <span className="text-[8px] text-slate-400 font-bold uppercase block text-center mt-1.5">Scan to pay now</span>
                  </div>
                )}

                {/* Country payment instructions */}
                <div className="space-y-4 pt-2">
                  
                  {/* INDIA UPI INSTRUCTIONS */}
                  {paymentPrefs.paymentMethod === 'UPI' && (
                    <div className="space-y-2">
                      <a
                        href={upiLink}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Pay with UPI Apps</span>
                      </a>
                      
                      <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold mt-1">
                        <span className="text-slate-400">UPI ID: <strong className="text-white ml-1">{paymentPrefs.upiId}</strong></span>
                        <button
                          onClick={() => handleCopy(paymentPrefs.upiId, 'UPI ID')}
                          className="text-indigo-400 hover:text-indigo-350 cursor-pointer shrink-0 ml-2"
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
                        { name: 'Rocket', num: paymentPrefs.rocketNumber, color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400' }
                      ].map((mfs) => {
                        if (!mfs.num) return null;
                        return (
                          <div key={mfs.name} className={`flex items-center justify-between p-3 border rounded-xl text-xs font-black ${mfs.color}`}>
                            <span className="uppercase">{mfs.name}: <strong className="text-white font-extrabold ml-1.5">{mfs.num}</strong></span>
                            <button
                              type="button"
                              onClick={() => handleCopy(mfs.num, mfs.name + ' Number')}
                              className="text-slate-350 hover:text-white shrink-0 ml-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-slate-450 leading-relaxed space-y-1">
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
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold leading-relaxed text-slate-300">
                          <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">Payment instructions</span>
                          <p>{paymentPrefs.customPaymentLink}</p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-slate-400 space-y-1 leading-relaxed">
                        <span className="font-extrabold text-white block uppercase tracking-wider">Instructions:</span>
                        <p>Complete transfer of total funds. Note reference ID or take screenshot, then submit verify proof below.</p>
                      </div>
                    </div>
                  )}

                  {/* Payment footnote */}
                  {paymentPrefs.paymentNote && (
                    <p className="text-[10px] text-slate-500 font-bold italic text-center leading-relaxed">
                      * {paymentPrefs.paymentNote}
                    </p>
                  )}

                  {/* Direct payment proof link */}
                  {liveLinkPrefs.allowPaymentProofSubmit && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all border border-white/10 cursor-pointer hover:border-white/20 active:scale-98"
                    >
                      <span>I Have Completed Payment</span>
                      <ArrowRight className="w-4 h-4 text-teal-400" />
                    </button>
                  )}

                </div>
              </div>
            ) : (
              // SUBMIT PAYMENT PROOF SCREEN (TASK 5)
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium p-6 space-y-4 animate-scaleUp text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Submit Payment Proof</h3>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Verify your transfer</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-4">
                  
                  <div>
                    <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider">Settlement Method *</label>
                    <select
                      required
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white font-bold"
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
                    <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider">Paid Amount *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white font-extrabold"
                      />
                    </div>
                    <span className="text-[8px] text-slate-400 mt-1 block">Specify exact amount sent (supports partial settlements)</span>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      Transaction / Reference ID {liveLinkPrefs.requireTransactionId && '*'}
                    </label>
                    <input
                      type="text"
                      required={liveLinkPrefs.requireTransactionId}
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      placeholder="e.g. TXN10003028"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-805 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
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
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all text-slate-700 dark:text-slate-350"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Choose Screenshot</span>
                        </label>
                      </div>
                      {screenshot && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm relative group shrink-0">
                          <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider">Notes / Memo (Optional)</label>
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Add any details for the verification clerk..."
                      rows="2"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-850 dark:text-slate-200 resize-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-premium space-y-3.5 text-xs font-semibold text-slate-500">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Need help with invoice?</span>
                <p className="text-slate-400 font-medium">Contact our account representative directly for corrections or billing questions.</p>
                <div className="grid grid-cols-1 gap-2 pt-1.5">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all cursor-pointer dark:bg-indigo-950/20 dark:text-indigo-400"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {business.phone}</span>
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}?subject=Inquiry%20Invoice%20${invoice.invoiceNumber}`}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all cursor-pointer dark:bg-indigo-950/20 dark:text-indigo-400"
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
      <div className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none z-10 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        <span>BillQyro Billing Platform</span>
      </div>

    </div>
  );
};

export default PublicInvoice;
