import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import {
  Phone,
  Mail,
  FileDown,
  CheckCircle2,
  Copy,
  Info,
  Upload,
  AlertCircle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Lock,
  MessageCircle,
  Share2,
  Fingerprint,
  Sparkles,
  Globe,
  Banknote,
  Download, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Printer, 
  FileText
} from 'lucide-react';
import { getPublicInvoice } from '../services/dbEngine';
import { downloadInvoicePDF } from '../utils/pdfUtils';
import DynamicQRCode from '../components/DynamicQRCode';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/invoiceUtils';
import { getInvoiceColumns, getItemValue } from '../utils/invoiceSchema';
import { doc, updateDoc, arrayUnion, collection, addDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebaseConfig';
import { sendPaymentReceiptEmail, verifyTransactionId } from '../services/cloudFunctions';

// Sanitize string input to prevent XSS in payment proofs
const sanitizeInput = (str) => {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').replace(/[<>"'\\]/g, '').trim();
};

const PublicInvoice = ({ initialInvoice }) => {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [copiedText, setCopiedText] = useState('');
  
  // Attach real-time listener to keep invoice up-to-date (cache-busting)
  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    setInvoice(initialInvoice);
    if (initialInvoice && initialInvoice.publicToken) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        const docRef = doc(db, 'publicInvoices', initialInvoice.publicToken);
        unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists() && mounted) {
            setInvoice(prev => ({ ...prev, ...snap.data() }));
          }
        });
      }).catch(err => console.warn('Failed to attach realtime listener', err));
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [initialInvoice]);
  
  // "I Have Paid" Form states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payAmount, setPayAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(true);

  const handleScreenshotChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setScreenshotFile(file);
      if (screenshot) URL.revokeObjectURL(screenshot);
      setScreenshot(URL.createObjectURL(file));
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!screenshotFile) {
      toast.error('Please upload a screenshot proof.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!invoice.id) {
        throw new Error("Missing invoice ID");
      }

      const sanitizedPayerName = sanitizeInput(payerName);
      const sanitizedPayerPhone = sanitizeInput(payerPhone).slice(0, 20);
      const sanitizedTxnId = sanitizeInput(txnId).slice(0, 100);
      const sanitizedNote = sanitizeInput(customerNote).slice(0, 500);
      const sanitizedMethod = ['UPI', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Cash'].includes(payMethod) ? payMethod : 'Bank Transfer';
      const sanitizedAmount = Math.max(0, Math.min(parseFloat(payAmount) || 0, 999999999));

      let screenshotURL = '';
      const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';

      if (isSandbox) {
        // Prepare base64 for sandbox ONLY
        const reader = new FileReader();
        reader.readAsDataURL(screenshotFile);
        await new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = () => reject(new Error('Failed to read screenshot file'));
        });
        screenshotURL = reader.result;
        
        // --- SANDBOX MODE LOCAL STORAGE OVERRIDE ---
        let demos = JSON.parse(localStorage.getItem('billqyro_demo_invoices') || '[]');
        const idx = demos.findIndex(d => d.id === invoice.id || d.publicToken === invoice.publicToken);
        if (idx === -1) throw new Error('Invoice not found in Sandbox');
        
        if (demos[idx].paymentStatus === 'Paid' || demos[idx].paymentStatus === 'Pending Verification') {
          throw new Error('This invoice has already been paid or has a pending verification.');
        }

        const proof = {
          id: 'demo-proof-' + Date.now(),
          invoiceId: invoice.id,
          publicInvoiceId: invoice.id,
          ownerId: invoice.userId || invoice.createdByUid || invoice.ownerId || 'unknown',
          customerName: invoice.customerName || 'Demo Customer',
          payerName: sanitizedPayerName,
          payerPhone: sanitizedPayerPhone,
          amount: sanitizedAmount,
          transactionId: sanitizedTxnId,
          note: sanitizedNote,
          screenshotUrl: screenshotURL, // Base64 for sandbox
          paymentMethod: sanitizedMethod,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        const existingProofs = JSON.parse(localStorage.getItem('billqyro_demo_payments') || '[]');
        localStorage.setItem('billqyro_demo_payments', JSON.stringify([proof, ...existingProofs]));

        demos[idx].paymentStatus = 'Pending Verification';
        demos[idx].paymentProofs = demos[idx].paymentProofs || [];
        demos[idx].paymentProofs.push({
          screenshotUrl: screenshotURL,
          method: payMethod,
          amount: payAmount,
          txnId: sanitizedTxnId,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('billqyro_demo_invoices', JSON.stringify(demos));
        setInvoice({ ...invoice, paymentStatus: 'Pending Verification' });
      } else {
        // --- PRODUCTION FIREBASE EXECUTION ---
        
        // Prevent upload abuse by checking local status BEFORE uploading
        if (invoice.paymentStatus === 'Paid' || invoice.paymentStatus === 'Pending Verification') {
          toast.error('This invoice has already been paid or has a pending verification.');
          setIsSubmitting(false);
          return;
        }

        toast.loading('Uploading payment proof...', { id: 'uploadToast' });
        
        let uploadedUrl = '';
        const docId = invoice.publicToken || invoice.id;
        try {
          const timestamp = Date.now();
          const safeFilename = screenshotFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
          // Use docId to match the firestore document for server-side rule verification
          const storageRef = ref(storage, `paymentProofs/${docId}/${timestamp}_${safeFilename}`);
          
          const uploadResult = await uploadBytes(storageRef, screenshotFile);
          uploadedUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadErr) {
          toast.dismiss('uploadToast');
          throw new Error('Failed to upload image to secure storage: ' + uploadErr.message);
        }

        const invoiceRef = doc(db, 'publicInvoices', docId);

        // Atomic transaction to prevent duplicate submissions
        await runTransaction(db, async (transaction) => {
          const pInvDoc = await transaction.get(invoiceRef);
          if (!pInvDoc.exists()) {
            throw new Error('Invoice not found');
          }

          const pData = pInvDoc.data();
          // Prevent duplicate submissions: reject if already paid or pending verification
          if (pData.paymentStatus === 'Paid' || pData.paymentStatus === 'Pending Verification') {
            throw new Error('This invoice has already been paid or has a pending verification.');
          }

          transaction.set(doc(collection(db, 'payment_proofs')), {
            invoiceId: invoice.id,
            publicInvoiceId: invoice.id,
            ownerId: invoice.userId || invoice.createdByUid || invoice.ownerId || 'unknown',
            customerName: invoice.customerName || 'Unknown Customer',
            payerName: sanitizedPayerName,
            payerPhone: sanitizedPayerPhone,
            amount: sanitizedAmount,
            transactionId: sanitizedTxnId,
            note: sanitizedNote,
            screenshotUrl: uploadedUrl,
            paymentMethod: sanitizedMethod,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          transaction.update(invoiceRef, {
            paymentStatus: 'Pending Verification',
            paymentProofs: arrayUnion({
              screenshotUrl: uploadedUrl,
              method: payMethod,
              amount: payAmount,
              txnId: sanitizedTxnId,
              submittedAt: new Date().toISOString()
            })
          });
        });
      }

      if (txnId) {
        try {
          await verifyTransactionId(txnId, invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal);
        } catch (e) {
          console.warn('Transaction verification unavailable:', e.message);
        }
      }
      
      if (invoice.customerEmail) {
        try {
          await sendPaymentReceiptEmail(invoice.id, invoice.customerEmail);
        } catch (e) {
          console.warn('Email receipt notification unavailable:', e.message);
        }
      }
      
      toast.success('Payment proof submitted! The owner will verify shortly.', { id: 'uploadToast' });
      setShowPaymentModal(false);
      setInvoice(prev => ({ ...prev, paymentStatus: 'Pending Verification' }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit proof.', { id: 'uploadToast' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="min-h-screen bg-theme-app flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-20 h-20 rounded-2xl bg-theme-danger/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-theme-danger" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-theme-primary">Invoice Not Found</h1>
          <p className="text-theme-muted text-sm max-w-md mb-8 leading-relaxed">
            The invoice link may have expired, been deleted, or contains an incorrect reference. Please contact the sender for a new link.
          </p>
          <a href="/" className="btn-premium">
            Go to BillQyro
          </a>
        </div>
      </motion.div>
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

  const activeTemplate = liveLinkPrefs.selectedLiveLinkTemplate || 'classic';

  const getTemplateStyles = () => {
    switch (activeTemplate) {
      case 'modern':
        return {
          container: "bg-theme-card dark:bg-theme-card rounded-3xl border-0 shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden",
          header: "border-b-2 border-indigo-100 dark:border-indigo-900/50 pb-6",
          addressBox: "bg-indigo-50/50 dark:bg-indigo-950/20 border-0 rounded-2xl p-5",
          tableHeader: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
          totalsBox: "bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5"
        };
      case 'mobile':
        return {
          container: "bg-theme-card text-white rounded-[2rem] border-4 border-theme-border-soft shadow-2xl p-5 space-y-5 relative overflow-hidden",
          header: "border-b border-theme-border-soft pb-5",
          addressBox: "bg-theme-surface border border-theme-border-strong rounded-2xl p-4",
          tableHeader: "bg-theme-surface text-theme-primary",
          totalsBox: "bg-theme-surface border border-theme-border-strong rounded-2xl p-4",
          textOverride: "text-theme-primary"
        };
      case 'retail':
        return {
          container: "bg-[#fcfbf7] dark:bg-amber-950/20 rounded-none border-x-0 border-y-4 border-dashed border-theme-border-strong dark:border-theme-border-strong shadow-sm p-6 md:p-8 space-y-6 relative overflow-hidden font-mono",
          header: "border-b-2 border-dashed border-theme-border-strong dark:border-theme-border-strong pb-6 sm:text-center flex-col sm:items-center",
          addressBox: "bg-transparent border-0 border-b border-dashed border-theme-border-soft dark:border-theme-border-soft rounded-none p-2",
          tableHeader: "bg-theme-app dark:bg-theme-surface text-theme-primary dark:text-theme-primary border-y-2 border-dashed border-theme-border-strong dark:border-theme-border-strong",
          totalsBox: "bg-transparent border-0 rounded-none p-2"
        };
      case 'corporate':
        return {
          container: "bg-theme-card rounded-xl border border-theme-border-soft shadow-lg p-8 md:p-10 space-y-8 relative overflow-hidden font-sans",
          header: "border-b-4 border-theme-border-soft pb-8",
          addressBox: "bg-theme-surface/50 border-l-4 border-theme-border-soft rounded-r-xl rounded-l-none p-5",
          tableHeader: "bg-theme-surface text-theme-primary",
          totalsBox: "bg-theme-surface/50 border border-theme-border-strong rounded-xl p-6"
        };
      case 'boutique':
        return {
          container: "bg-rose-50/30 dark:bg-rose-950/20 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-xl p-6 md:p-10 space-y-8 relative overflow-hidden font-serif",
          header: "border-b border-rose-200 dark:border-rose-900/50 pb-8 sm:text-center flex-col sm:items-center",
          addressBox: "bg-white/60 dark:bg-theme-card/60 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 shadow-sm",
          tableHeader: "bg-rose-900 dark:bg-rose-950 text-rose-50",
          totalsBox: "bg-white/60 dark:bg-theme-card/60 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 shadow-sm"
        };
      case 'clinic':
        return {
          container: "bg-theme-card rounded-2xl border-t-8 border-t-blue-500 border-x border-b border-theme-border-soft shadow-lg p-6 md:p-8 space-y-6 relative overflow-hidden",
          header: "border-b border-blue-100 dark:border-blue-900/30 pb-6",
          addressBox: "bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5",
          tableHeader: "bg-blue-600 dark:bg-blue-800 text-white",
          totalsBox: "bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5"
        };
      case 'repair':
        return {
          container: "bg-theme-surface rounded-xl border-l-8 border-l-yellow-500 border-y border-r border-theme-border-strong shadow-md p-6 md:p-8 space-y-6 relative overflow-hidden",
          header: "border-b border-theme-border-strong pb-6",
          addressBox: "bg-theme-card border border-theme-border-soft rounded-lg p-4 shadow-sm",
          tableHeader: "bg-theme-app text-yellow-500 border-b-2 border-yellow-500",
          totalsBox: "bg-theme-card border border-theme-border-soft rounded-lg p-4 shadow-sm"
        };
      case 'cartoon':
        return {
          container: "bg-[#ffffff] text-[#1a1f36] rounded-lg border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 md:p-10 space-y-6 relative overflow-hidden font-sans",
          header: "bg-[#4a6cf7] -mx-6 md:-mx-10 -mt-6 md:-mt-10 mb-6 p-6 md:p-8 text-white rounded-t-lg flex-row sm:items-center",
          addressBox: "bg-transparent border-0 p-0",
          tableHeader: "bg-[#f5f7fa] text-[#697386] rounded-md",
          totalsBox: "bg-[#ffffff] border border-[#e3e8ee] rounded-xl p-4 shadow-sm"
        };
      case 'classic':
      default:
        return {
          container: "bg-theme-card dark:bg-theme-card rounded-3xl border border-theme-border-soft dark:border-theme-border-soft shadow-premium p-6 md:p-8 space-y-6 relative overflow-hidden",
          header: "border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-6",
          addressBox: "bg-theme-app dark:bg-theme-surface/50 dark:bg-theme-app/20 border border-theme-border-soft dark:border-theme-border-soft rounded-2xl p-4",
          tableHeader: "bg-[#071B3A] text-white",
          totalsBox: "bg-theme-app dark:bg-theme-surface dark:bg-theme-app/20 border border-theme-border-soft/40 dark:border-theme-border-soft rounded-2xl p-4"
        };
    }
  };

  const tplStyles = getTemplateStyles();

  // Generate UPI pay link (TASK 4)
  const dueAmount = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal;
  const verifStr = invoice.verificationCode ? ` [Code: ${invoice.verificationCode}]` : '';
  const txnNote = `Invoice ${invoice.invoiceNumber}${verifStr}`;
  const upiLink = `upi://pay?pa=${paymentPrefs.upiId}&pn=${encodeURIComponent(paymentPrefs.payeeName || business.businessName)}&am=${dueAmount}&cu=INR&tn=${encodeURIComponent(txnNote)}`;
  const qrText = paymentPrefs.paymentMethod === 'UPI' ? upiLink : (
    paymentPrefs.paymentMethod === 'bKash' ? `bKash: ${paymentPrefs.bkashNumber}, Invoice: ${invoice.invoiceNumber}, Amount: ${dueAmount}${invoice.verificationCode ? `, Code: ${invoice.verificationCode}` : ''}` : (
      paymentPrefs.paymentMethod === 'Nagad' ? `Nagad: ${paymentPrefs.nagadNumber}, Invoice: ${invoice.invoiceNumber}, Amount: ${dueAmount}${invoice.verificationCode ? `, Code: ${invoice.verificationCode}` : ''}` :
      paymentPrefs.customPaymentLink || 'Manual QR'
    )
  );

  const handleDownloadPDF = () => {
    downloadInvoicePDF(invoice, business, true)
      .then((ok) => {
        if (ok) {
          toast.success('Invoice PDF downloaded successfully!');
        } else {
          toast.error('Failed to generate PDF invoice.');
        }
      })
      .catch((err) => {
        toast.error(`PDF Error: ${err?.toString() || 'Unknown error'}`);
      });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber} - ${business.businessName}`,
          text: `Invoice #${invoice.invoiceNumber} from ${business.businessName}. Amount: ${formatVal(dueAmount)}`,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy(window.location.href, 'Invoice link');
        }
      }
    } else {
      handleCopy(window.location.href, 'Invoice link');
    }
  };

  // Status badge style helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Partially Paid':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-sm';
      case 'Verified':
      case 'Payment Submitted':
      case 'Submitted':
        return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 shadow-sm';
      case 'Pending Verification':
        return 'badge-warning animate-pulse';
      case 'Pending':
      case 'Unpaid':
        return 'bg-theme-surface text-theme-muted border border-theme-border-soft';
      case 'Overdue':
        return 'badge-danger';
      case 'Cancelled':
        return 'bg-theme-surface dark:bg-theme-card text-theme-muted dark:bg-theme-card dark:text-theme-muted border border-theme-border-soft dark:border-theme-border-soft';
      default:
        return 'bg-theme-surface dark:bg-theme-card text-theme-primary';
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
    <div className="min-h-screen bg-theme-app dark:bg-theme-surface dark:bg-theme-app py-4 md:py-10 px-4 md:px-6 flex flex-col items-center justify-between font-sans antialiased text-theme-primary dark:text-theme-primary dark:text-theme-primary">

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes qrScan {
          0% { top: 0; opacity: 1; }
          50% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes waPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        .qr-scan-line {
          position: absolute;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent);
          animation: qrScan 2s ease-in-out infinite;
          z-index: 1;
        }
        .animate-wa-pulse {
          animation: waPulse 2s infinite;
        }
      `}</style>

      {/* ===== TOP PREMIUM HEADER WITH BUSINESS BRANDING ===== */}
      <header className="max-w-5xl w-full mb-4 md:mb-5 z-10">
        <div className="card-premium glass-strong flex items-center justify-between gap-2 md:gap-3 p-3 md:p-4 rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="logo-frame shrink-0">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="font-extrabold text-sm text-theme-primary">
                  {business.businessName?.charAt(0) || 'B'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                <h1 className="font-extrabold text-xs md:text-sm text-theme-primary truncate">{business.businessName}</h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 uppercase tracking-wider shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Secure Bill
                </span>
              </div>
              <p className="text-[8px] md:text-[9px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-theme-accent" />
                Digital Invoice &middot; {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {liveLinkPrefs.allowCustomerPdfDownload && (
              <button onClick={handleDownloadPDF} className="btn-premium-outline px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-[11px]">
                <FileDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
            <button onClick={handleShare} className="btn-premium-outline px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-[11px]">
              <Share2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {liveLinkPrefs.allowPaymentProofSubmit && invoice.paymentStatus !== 'Paid' && invoice.paymentStatus !== 'Pending Verification' && (
              <button onClick={() => setShowPaymentModal(true)} className="btn-premium px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-[11px]">
                <Wallet className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="text-[10px] md:text-[11px]">Pay Now</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl w-full flex flex-col gap-4 md:gap-5 items-center">

        {/* ===== LEFT: INVOICE DISPLAY CARD ===== */}
        <div className="w-full lg:flex-1 space-y-3 md:space-y-4">

          {/* Status Banner */}
          {invoice.paymentStatus === 'Paid' && (
            <div className="card-premium overflow-hidden bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-3 shadow-lg shadow-emerald-500/5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 animate-bounce">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-extrabold text-emerald-600">Paid in Full</p>
                <p className="text-[9px] md:text-[10px] text-emerald-500/70 font-semibold">This invoice has been settled. Thank you!</p>
              </div>
            </div>
          )}
          {invoice.paymentStatus === 'Pending Verification' && (
            <div className="card-premium overflow-hidden bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-3 shadow-lg shadow-amber-500/5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 animate-pulse">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-extrabold text-amber-600">Payment Under Review</p>
                <p className="text-[9px] md:text-[10px] text-amber-500/70 font-semibold">Your payment is being verified. We'll update you shortly.</p>
              </div>
            </div>
          )}

          {/* Premium Invoice Card */}
          <div className={`card-premium overflow-hidden ${tplStyles.container}`}>
            {activeTemplate === 'classic' && <div className="h-2 bg-gradient-to-r from-theme-accent to-theme-accent-dark w-full"></div>}

            <div className="p-3 md:p-6 space-y-4 md:space-y-5">

              {/* Invoice Header */}
              <div className={`flex flex-col sm:flex-row justify-between items-start gap-2 md:gap-3 pb-3 md:pb-4 border-b border-theme-border-soft ${tplStyles.header}`}>
                <div>
                  <div className="flex items-center gap-2 md:gap-2.5">
                    <h2 className="text-lg md:text-2xl font-black text-theme-primary tracking-tight">Invoice</h2>
                    <span className={`badge-premium ${getStatusBadgeStyle(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-theme-muted font-bold mt-0.5">#{invoice.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-1 text-[10px] md:text-xs font-semibold text-theme-muted">
                  <div><span className="text-[8px] md:text-[9px] uppercase font-black block">Date</span><span className="text-theme-primary font-bold">{invoice.date}</span></div>
                  <div><span className="text-[8px] md:text-[9px] uppercase font-black block">Due</span><span className="text-theme-primary font-bold">{invoice.dueDate || 'N/A'}</span></div>
                </div>
              </div>

              {/* Business & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className={`p-3 md:p-3.5 rounded-xl border border-theme-border-soft/60 bg-theme-app/50 ${tplStyles.addressBox}`}>
                  <p className="text-[8px] md:text-[9px] text-theme-muted uppercase font-black tracking-widest mb-1 md:mb-1.5">From</p>
                  <p className="text-xs md:text-sm font-extrabold text-theme-primary">{business.businessName}</p>
                  {business.ownerName && <p className="text-[10px] md:text-[11px] text-theme-muted">{business.ownerName}</p>}
                  {business.phone && <p className="text-[10px] md:text-[11px] text-theme-muted mt-0.5">{business.phone}</p>}
                  {business.email && <p className="text-[10px] md:text-[11px] text-theme-muted truncate">{business.email}</p>}
                  {business.address && <p className="text-[9px] md:text-[10px] text-theme-muted/70 mt-1 leading-relaxed">{business.address}</p>}
                  {business.gstNumber && <p className="text-[8px] md:text-[9px] font-black text-theme-accent uppercase mt-1 md:mt-1.5">{taxLabelText}: {business.gstNumber}</p>}
                </div>
                <div className={`p-3 md:p-3.5 rounded-xl border border-theme-border-soft/60 bg-theme-app/50 ${tplStyles.addressBox}`}>
                  <p className="text-[8px] md:text-[9px] text-theme-muted uppercase font-black tracking-widest mb-1 md:mb-1.5">Bill To</p>
                  <p className="text-xs md:text-sm font-extrabold text-theme-primary">{invoice.customerName}</p>
                  {invoice.customerPhone && <p className="text-[10px] md:text-[11px] text-theme-muted">{invoice.customerPhone}</p>}
                  {invoice.customerEmail && <p className="text-[10px] md:text-[11px] text-theme-muted truncate">{invoice.customerEmail}</p>}
                  {invoice.customerAddress && <p className="text-[9px] md:text-[10px] text-theme-muted/70 mt-1 leading-relaxed">{invoice.customerAddress}</p>}
                </div>
              </div>

              {/* Items Table - Dynamic Sync */}
              <div className="border border-theme-border-soft rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] md:text-xs text-left">
                    <thead className={`text-[8px] md:text-[9px] uppercase font-black tracking-wider ${tplStyles.tableHeader}`}>
                      <tr>
                        {getInvoiceColumns(invoice, business).map(col => (
                          <th key={col.id} className={`py-2 md:py-3 px-2 md:px-3 text-${col.align}`} style={{ width: col.width }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft/50">
                      {(invoice.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-theme-app/50">
                          {getInvoiceColumns(invoice, business).map(col => {
                            if (col.id === 'sn') return <td key={col.id} className={`py-2 md:py-2.5 px-2 md:px-3 text-${col.align} text-theme-muted font-bold`}>{idx + 1}</td>;
                            
                            const val = getItemValue(item, col.id, invoice.billType);
                            
                            // Special formatting for specific columns
                            if (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') {
                              return (
                                <td key={col.id} className={`py-2 md:py-2.5 px-2 md:px-3 text-${col.align} ${col.id === 'amount' ? 'font-black text-theme-primary' : col.id === 'discount' && val > 0 ? 'text-theme-danger' : 'font-semibold'}`}>
                                  {col.id === 'discount' && val > 0 ? '-' : ''}{formatVal(val)}
                                </td>
                              );
                            }
                            if (col.id === 'col1') {
                              return <td key={col.id} className={`py-2 md:py-2.5 px-2 md:px-3 text-${col.align} font-extrabold text-theme-primary`}>{val}</td>;
                            }
                            
                            return (
                              <td key={col.id} className={`py-2 md:py-2.5 px-2 md:px-3 text-${col.align}`}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Notes */}
              <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-between items-start pt-1 md:pt-2">
                <div className={`w-full sm:w-1/2 text-[10px] md:text-xs text-theme-muted ${tplStyles.totalsBox}`}>
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mb-1">Notes</p>
                  <p className="leading-relaxed text-[10px] md:text-[11px]">{invoice.notes || 'Thank you for your business!'}</p>
                  {invoice.terms && (
                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-theme-border-soft">
                      <p className="text-[8px] md:text-[9px] font-black uppercase mb-1">Terms</p>
                      <p className="leading-relaxed text-[10px] md:text-[11px]">{invoice.terms}</p>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-[45%] space-y-1 md:space-y-1.5">
                  <div className="flex justify-between py-1 md:py-1.5 text-[10px] md:text-xs border-b border-theme-border-soft">
                    <span className="text-theme-muted font-semibold">Subtotal</span>
                    <span className="text-theme-primary font-bold">{formatVal(invoice.subtotal)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between py-1 md:py-1.5 text-[10px] md:text-xs border-b border-theme-border-soft">
                      <span className="text-theme-muted font-semibold">Discount</span>
                      <span className="text-theme-danger font-bold">-{formatVal(invoice.discountAmount)}</span>
                    </div>
                  )}
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between py-1 md:py-1.5 text-[10px] md:text-xs border-b border-theme-border-soft">
                      <span className="text-theme-muted font-semibold">{taxLabelText} ({invoice.taxPercentage}%)</span>
                      <span className="text-theme-primary font-bold">{formatVal(invoice.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-3 md:px-3.5 bg-theme-accent/5 border border-theme-accent/20 rounded-xl text-xs md:text-sm">
                    <span className="font-extrabold text-theme-primary">Grand Total</span>
                    <span className="font-black text-theme-accent text-sm md:text-base">{formatVal(invoice.grandTotal)}</span>
                  </div>
                  {liveLinkPrefs.showPaidDueAmount && invoice.amountPaid > 0 && (
                    <div className="flex justify-between py-1 md:py-1.5 text-[10px] md:text-xs border-b border-theme-border-soft">
                      <span className="text-emerald-600 font-bold">Amount Paid</span>
                      <span className="text-emerald-600 font-extrabold">{formatVal(invoice.amountPaid)}</span>
                    </div>
                  )}
                  {liveLinkPrefs.showPaidDueAmount && invoice.balanceDue > 0 && (
                    <div className="flex justify-between py-1.5 md:py-2 px-2.5 md:px-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[10px] md:text-xs">
                      <span className="text-rose-600 font-black">Balance Due</span>
                      <span className="text-rose-600 font-black text-xs md:text-sm">{formatVal(invoice.balanceDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Secure Footer */}
              <div className="text-center pt-3 md:pt-4 border-t border-theme-border-soft text-[8px] md:text-[9px] text-theme-muted font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 md:gap-2">
                <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-theme-accent" />
                <span>Digitally compiled by BillQyro &middot; Your data is protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: PAYMENT / STATUS SIDEBAR ===== */}
        {invoice.paymentStatus === 'Paid' ? (
          <div className="w-full max-w-2xl shrink-0 space-y-3 md:space-y-4 mt-4">
            <div className="card-premium overflow-hidden border border-emerald-500/25 shadow-lg p-4 md:p-5 space-y-3 md:space-y-4 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 md:w-11 h-10 md:h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-extrabold text-theme-primary">Invoice Settled</h3>
                  <p className="text-[8px] md:text-[9px] text-theme-muted font-bold uppercase tracking-wider">Payment Completed</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 md:p-4 text-center">
                <p className="text-xl md:text-2xl font-black text-emerald-500">{formatVal(invoice.amountPaid || invoice.grandTotal)}</p>
                <p className="text-[8px] md:text-[9px] text-theme-muted font-bold uppercase tracking-wider mt-1">Amount Paid</p>
              </div>
              {invoice.paymentHistory?.length > 0 && (
                <div className="space-y-1 md:space-y-1.5">
                  <p className="text-[8px] md:text-[9px] text-theme-muted font-black uppercase tracking-wider mb-2">Payment Timeline</p>
                  <div className="relative border-l border-theme-border-soft ml-2 pl-3 space-y-3 mt-2">
                    {invoice.paymentHistory.map((ph, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-theme-surface shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
                        <div className="flex flex-col gap-0.5 bg-theme-surface rounded-xl p-2 md:p-2.5 border border-theme-border-soft">
                          <div className="flex items-center justify-between text-[10px] md:text-xs">
                            <span className="text-theme-primary font-bold">{ph.date || 'Completed'}</span>
                            <span className="text-emerald-600 font-extrabold">{formatVal(ph.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] md:text-[9px]">
                            <span className="text-theme-muted font-semibold">{ph.method || 'Transfer'} {ph.transactionId && ph.transactionId !== 'N/A' && `• Txn: ${ph.transactionId}`}</span>
                            {ph.reviewer && <span className="text-theme-muted/60 italic border-l border-theme-border-soft pl-1.5 ml-1.5">Verified by {ph.reviewer}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {liveLinkPrefs.showContactButton && (business.phone || business.email) && (
                <div className="pt-2 md:pt-2.5 border-t border-theme-border-soft">
                  <p className="text-[8px] md:text-[9px] text-theme-muted font-bold mb-1.5 md:mb-2">Need help?</p>
                  <div className="flex gap-2">
                    {business.phone && <a href={`tel:${business.phone}`} className="btn-premium-outline flex-1 py-1.5 md:py-2 text-[10px] md:text-xs"><Phone className="w-3 md:w-3.5 h-3 md:h-3.5 inline mr-1" />Call</a>}
                    {business.email && <a href={`mailto:${business.email}?subject=Receipt%20${invoice.invoiceNumber}`} className="btn-premium-outline flex-1 py-1.5 md:py-2 text-[10px] md:text-xs"><Mail className="w-3 md:w-3.5 h-3 md:h-3.5 inline mr-1" />Email</a>}
                  </div>
                </div>
              )}
              {/* Premium Trust Badge */}
              <div className="bg-emerald-500/5 rounded-xl p-2.5 md:p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[8px] md:text-[9px] text-emerald-600 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Payment Verified & Secured</span>
                </div>
                <p className="text-[7px] md:text-[8px] text-emerald-600/60 mt-0.5 font-semibold">256-bit encrypted transaction</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl shrink-0 space-y-3 md:space-y-4 mt-4">

            {/* Amount Due Card with Premium Gradient */}
            <div className={`card-premium-elevated rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden ${invoice.paymentStatus === 'Unpaid' || invoice.paymentStatus === 'Pending' || invoice.paymentStatus === 'Overdue' ? 'animate-gradient-shift bg-gradient-to-br from-theme-accent via-theme-accent-dark to-purple-700' : 'bg-gradient-to-br from-theme-accent to-theme-accent-dark'}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/70">Amount Due</p>
                <p className="text-5xl md:text-6xl font-black mt-1 tracking-tight leading-none">{formatVal(dueAmount)}</p>
                <p className="text-[10px] text-white/60 mt-2 font-bold">Invoice #{invoice.invoiceNumber}</p>
                {(invoice.paymentStatus === 'Unpaid' || invoice.paymentStatus === 'Pending' || invoice.paymentStatus === 'Overdue') && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Awaiting Payment
                  </div>
                )}
              </div>
              {invoice.verificationCode && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Fingerprint className="w-3 h-3 text-white/70" />
                    <p className="text-[8px] uppercase tracking-widest font-black text-white/70">Reference Code</p>
                  </div>
                  <p className="text-xl md:text-2xl font-black tracking-[0.15em] text-white">{invoice.verificationCode}</p>
                  <p className="text-[7px] text-white/50 mt-1.5 font-semibold">Include this code in your payment note</p>
                </div>
              )}
              {/* Premium Trust Indicator */}
              <div className="relative z-10 mt-4 flex items-center gap-2 text-white/50 text-[7px] font-semibold">
                <Lock className="w-2.5 h-2.5" />
                <span>Secured by 256-bit encryption</span>
              </div>
            </div>

            {/* Payment Hub / Proof Form */}
            {!showPaymentModal ? (
              <div className="card-premium overflow-hidden">
                <div className="p-4 md:p-5 space-y-4 md:space-y-5">
                  <button onClick={() => setPaymentSectionOpen(prev => !prev)} className="w-full flex items-center gap-2.5 pb-3 border-b border-theme-border-soft cursor-pointer text-left group premium-focus rounded-lg">
                    <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 group-hover:bg-theme-accent/20 transition-colors">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs md:text-sm font-extrabold text-theme-primary">Payment Hub</h3>
                      <p className="text-[8px] md:text-[9px] text-theme-muted font-bold uppercase tracking-wider">Choose your payment method</p>
                    </div>
                    <svg className={`w-4 h-4 text-theme-muted transition-transform duration-300 shrink-0 ${paymentSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${paymentSectionOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-4 md:space-y-5">

                  {/* Step 1: Pay */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-8 h-8 rounded-xl bg-theme-accent text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md shadow-theme-accent/30">1</span>
                      <div className="w-0.5 h-full min-h-[20px] bg-gradient-to-b from-theme-accent/40 to-theme-border-soft mt-1"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-[11px] font-extrabold text-theme-primary">Pay using a method below</p>
                      <p className="text-[8px] md:text-[9px] text-theme-muted font-semibold mt-0.5 flex items-center gap-1">
                        <Wallet className="w-2.5 h-2.5 md:w-3 md:h-3 text-theme-accent" />
                        Complete payment and get a Transaction ID
                      </p>
                    </div>
                  </div>

                  {liveLinkPrefs.showPaymentQr && paymentPrefs.paymentQrEnabled && qrText && (
                    <div className="qr-premium mx-auto relative overflow-hidden flex flex-col items-center">
                      <div className="qr-scan-line"></div>
                      <DynamicQRCode value={qrText} size={200} />
                      <p className="text-[9px] text-theme-muted font-bold uppercase text-center mt-2">Scan to Pay</p>
                      <p className="text-[7px] text-theme-muted/60 text-center">Use any UPI / banking app</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {paymentPrefs.paymentMethod === 'UPI' && (
                      <div className="space-y-2">
                        <a href={upiLink} className="btn-premium w-full py-3 text-[11px] md:text-xs">
                          <Wallet className="w-4 h-4" />
                          Pay with UPI
                        </a>
                        <div className="flex items-center justify-between px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-[10px] md:text-xs font-bold premium-focus">
                          <span className="text-theme-muted truncate mr-2">UPI: <strong className="text-theme-primary">{paymentPrefs.upiId}</strong></span>
                          <button onClick={() => handleCopy(paymentPrefs.upiId, 'UPI ID')} className="text-theme-accent hover:text-theme-accent/70 cursor-pointer shrink-0 ml-2"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                    {(paymentPrefs.paymentMethod === 'bKash' || paymentPrefs.paymentMethod === 'Nagad' || paymentPrefs.paymentMethod === 'Rocket') && (
                      <div className="space-y-2">
                        {[
                          { name: 'bKash', num: paymentPrefs.bkashNumber, color: 'border-pink-500/20 bg-pink-500/5 text-pink-500' },
                          { name: 'Nagad', num: paymentPrefs.nagadNumber, color: 'border-orange-500/20 bg-orange-500/5 text-orange-500' },
                          { name: 'Rocket', num: paymentPrefs.rocketNumber, color: 'border-theme-border-soft bg-theme-accent-light text-theme-accent' }
                        ].map(mfs => !mfs.num ? null : (
                          <div key={mfs.name} className={`flex items-center justify-between px-3 py-2.5 border rounded-xl text-[10px] md:text-xs font-black ${mfs.color} premium-focus`}>
                            <span className="uppercase">{mfs.name}: <strong className="text-theme-primary font-extrabold ml-1">{mfs.num}</strong></span>
                            <button type="button" onClick={() => handleCopy(mfs.num, mfs.name)} className="text-theme-muted hover:text-theme-primary cursor-pointer shrink-0 ml-2"><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <div className="bg-theme-surface border border-theme-border-soft rounded-xl px-3 py-2.5 text-[9px] md:text-[10px] text-theme-muted leading-relaxed space-y-0.5">
                          <p className="font-extrabold text-theme-primary uppercase tracking-wider text-[8px] md:text-[9px] mb-1">How to pay:</p>
                          <p>1. Open your {paymentPrefs.paymentMethod} app</p>
                          <p>2. Send money to the number above</p>
                          <p>3. Use invoice <strong className="text-theme-primary">{invoice.invoiceNumber}</strong> as reference</p>
                          <p>4. Copy the Transaction ID after payment</p>
                        </div>
                      </div>
                    )}
                    {paymentPrefs.paymentMethod === 'Manual' && (
                      <div className="space-y-2">
                        {paymentPrefs.customPaymentLink && (
                          <div className="px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-[10px] md:text-xs font-bold text-theme-muted leading-relaxed">
                            <p className="text-[8px] md:text-[9px] text-theme-muted uppercase font-black mb-1">Payment Instructions</p>
                            <p className="text-theme-primary">{paymentPrefs.customPaymentLink}</p>
                          </div>
                        )}
                        <div className="px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-[9px] md:text-[10px] text-theme-muted leading-relaxed">
                          <p className="font-extrabold text-theme-primary uppercase tracking-wider text-[8px] md:text-[9px] mb-1">Instructions:</p>
                          <p>Transfer the amount due to the business account. Note the transaction ID and submit proof below.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {paymentPrefs.paymentNote && (
                    <div className="bg-theme-accent/5 border border-theme-accent/10 rounded-xl px-3 py-2">
                      <p className="text-[8px] md:text-[9px] text-theme-accent italic text-center leading-relaxed font-semibold">{paymentPrefs.paymentNote}</p>
                    </div>
                  )}

                    </div>
                  </div>

                  {/* Step 2: Confirm */}
                  <div className="flex items-start gap-3 pt-1">
                    <span className="w-8 h-8 rounded-xl bg-theme-accent text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md shadow-theme-accent/30">2</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-[11px] font-extrabold text-theme-primary">Confirm your payment</p>
                      <p className="text-[8px] md:text-[9px] text-theme-muted font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-theme-accent" />
                        Submit proof with Transaction ID
                      </p>
                    </div>
                  </div>

                  {liveLinkPrefs.allowPaymentProofSubmit && (
                    <button onClick={() => setShowPaymentModal(true)} className="btn-premium w-full py-3 md:py-3.5 text-[11px] md:text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Paid</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Premium Trust Badge Section */}
                  <div className="divider-premium"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-theme-surface/50">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="text-[7px] text-theme-muted font-semibold">SSL Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-theme-surface/50">
                      <Lock className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="text-[7px] text-theme-muted font-semibold">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-theme-surface/50">
                      <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="text-[7px] text-theme-muted font-semibold">Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-theme-surface/50">
                      <Banknote className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[7px] text-theme-muted font-semibold">Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-premium overflow-hidden">
                <div className="p-4 md:p-5 space-y-4 md:space-y-5">
                  <div className="flex items-center gap-3 pb-3 md:pb-4 border-b border-theme-border-soft">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-extrabold text-theme-primary">Confirm Payment</h3>
                      <p className="text-[8px] md:text-[9px] text-theme-muted font-bold uppercase tracking-wider">Step 2: Submit Proof</p>
                    </div>
                  </div>
                  <div className="bg-theme-accent/5 border border-theme-accent/15 rounded-xl p-3 md:p-4 text-center">
                    <p className="text-[8px] md:text-[9px] text-theme-muted font-black uppercase">Amount to Verify</p>
                    <p className="text-lg md:text-xl font-black text-theme-primary mt-0.5">{formatVal(dueAmount)}</p>
                  </div>
                  <form onSubmit={handleSubmitProof} className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Full Name (Optional)</label>
                      <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Your name" className="input-premium premium-focus" />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Phone (Optional)</label>
                      <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)} placeholder="Your phone number" className="input-premium premium-focus" />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Payment Method *</label>
                      <select required value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input-premium premium-focus">
                        {country === 'India' && <option value="UPI">UPI Transfer</option>}
                        {country === 'Bangladesh' && <><option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option></>}
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Amount Paid *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 md:pl-3.5 flex items-center text-theme-muted font-bold text-[11px] md:text-xs">{currencySymbol}</span>
                        <input type="number" step="0.01" required value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" className="input-premium premium-focus pl-7 md:pl-8" />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Transaction ID {liveLinkPrefs.requireTransactionId ? '*' : '(Optional)'}</label>
                      <input type="text" required={liveLinkPrefs.requireTransactionId} value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="e.g. TXN10003028" className="input-premium premium-focus" />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Screenshot {liveLinkPrefs.requirePaymentScreenshot ? '*' : '(Optional)'}</label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input type="file" accept="image/*" required={liveLinkPrefs.requirePaymentScreenshot} onChange={handleScreenshotChange} className="hidden" id="payment-proof-upload" />
                          <label htmlFor="payment-proof-upload" className="w-full flex items-center justify-center gap-2 py-3 md:py-3.5 bg-theme-surface border-2 border-dashed border-theme-border-soft rounded-xl cursor-pointer hover:bg-theme-app/80 hover:border-theme-accent/40 transition-all text-theme-muted text-[10px] md:text-xs font-bold premium-focus">
                            <Upload className="w-4 h-4" />
                            <span>{screenshot ? 'Change Screenshot' : 'Upload Screenshot'}</span>
                          </label>
                        </div>
                        {screenshot && (
                          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-theme-accent/30 bg-theme-surface shrink-0 shadow-sm group">
                            <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => { setScreenshot(null); setScreenshotFile(null); }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted font-bold uppercase text-[8px] md:text-[9px] tracking-wider">Note (Optional)</label>
                      <textarea value={customerNote} onChange={e => setCustomerNote(e.target.value)} placeholder="Any details for the verification" rows="2" className="input-premium premium-focus resize-none" />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 pt-1 md:pt-2">
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-premium-outline flex-1 py-2.5 md:py-3 text-[11px] md:text-xs">Back</button>
                      <button type="submit" disabled={isSubmitting} className="btn-premium flex-1 py-2.5 md:py-3 text-[11px] md:text-xs disabled:opacity-50">
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <span>Submit Proof</span>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payment Status Info */}
            {invoice.paymentStatus === 'Pending Verification' && (
              <div className="card-premium overflow-hidden bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 md:p-4 flex items-start gap-2.5 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-extrabold text-amber-600">Payment Under Review</p>
                  <p className="text-[9px] md:text-[10px] text-amber-600/70 font-semibold mt-0.5">Your payment proof has been received and is being verified by the business owner.</p>
                </div>
              </div>
            )}

            {/* Contact Business with WhatsApp */}
            {liveLinkPrefs.showContactButton && (business.whatsapp || business.phone || business.email) && !showPaymentModal && (
              <div className="card-premium overflow-hidden p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2 md:mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                    <Phone className="w-3 h-3" />
                  </div>
                  <p className="text-[8px] md:text-[9px] text-theme-muted font-black uppercase tracking-wider">Need Help?</p>
                </div>
                <p className="text-[9px] md:text-[10px] text-theme-muted font-semibold mb-2.5 md:mb-3">Contact the business for questions about this invoice.</p>
                <div className="flex gap-2">
                  {business.whatsapp && (
                    <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I have a question about Invoice ' + invoice.invoiceNumber)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold rounded-xl transition-all cursor-pointer text-[10px] md:text-xs animate-wa-pulse premium-focus">
                      <MessageCircle className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      WhatsApp
                    </a>
                  )}
                  {business.phone && !business.whatsapp && (
                    <a href={`tel:${business.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 md:py-2.5 bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent font-bold rounded-xl transition-all cursor-pointer text-[10px] md:text-xs premium-focus">
                      <Phone className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      Call
                    </a>
                  )}
                  {business.email && (
                    <a href={`mailto:${business.email}?subject=Invoice%20${invoice.invoiceNumber}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 md:py-2.5 bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent font-bold rounded-xl transition-all cursor-pointer text-[10px] md:text-xs premium-focus">
                      <Mail className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      Email
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        </div>

        {/* ===== STICKY PAY BUTTON (Mobile Only) ===== */}
        {invoice.paymentStatus !== 'Paid' && invoice.paymentStatus !== 'Pending Verification' && (
          <div className="lg:hidden no-print fixed bottom-0 left-0 right-0 z-50 bg-theme-card/95 backdrop-blur-xl border-t border-theme-border-soft px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] safe-area-bottom">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[8px] text-theme-muted font-bold uppercase tracking-wider">Amount Due</p>
                <p className="text-lg font-black text-rose-500">{formatVal(dueAmount)}</p>
              </div>
              {liveLinkPrefs.allowPaymentProofSubmit ? (
                <button onClick={() => setShowPaymentModal(true)} className="btn-premium px-6 py-3 text-sm">
                  <Wallet className="w-4 h-4" />
                  Pay Now
                </button>
              ) : (
                <a href={`https://wa.me/${business.whatsapp?.replace(/\D/g, '') || business.phone?.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I want to pay for Invoice ' + invoice.invoiceNumber)}`} target="_blank" rel="noopener noreferrer" className="btn-premium px-6 py-3 text-sm bg-emerald-500 shadow-lg shadow-emerald-500/25" style={{ backgroundImage: 'none', background: '#10B981' }}>
                  <MessageCircle className="w-4 h-4" />
                  Pay via WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* ===== TRUST FOOTER ===== */}
        <footer className={`mt-6 md:mt-8 w-full max-w-5xl ${invoice.paymentStatus !== 'Paid' && invoice.paymentStatus !== 'Pending Verification' ? 'pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0' : ''}`}>
        <div className="card-premium overflow-hidden bg-gradient-to-r from-theme-card/80 via-theme-card to-theme-card/80 backdrop-blur-sm rounded-2xl border border-theme-border-soft/60 p-4 md:p-5 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 px-2.5 md:px-3 py-2 md:py-2.5 bg-theme-surface/50 rounded-xl border border-theme-border-soft/40">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-theme-primary leading-tight">BillQyro</p>
                <p className="text-[7px] md:text-[8px] text-theme-muted font-semibold">Billing Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 md:px-3 py-2 md:py-2.5 bg-theme-surface/50 rounded-xl border border-theme-border-soft/40">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-theme-primary leading-tight">256-bit</p>
                <p className="text-[7px] md:text-[8px] text-theme-muted font-semibold">Encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 md:px-3 py-2 md:py-2.5 bg-theme-surface/50 rounded-xl border border-theme-border-soft/40">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-theme-primary leading-tight">Invoice</p>
                <p className="text-[7px] md:text-[8px] text-theme-muted font-semibold">#{invoice.invoiceNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 md:px-3 py-2 md:py-2.5 bg-theme-surface/50 rounded-xl border border-theme-border-soft/40">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-theme-accent shrink-0" />
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-theme-primary leading-tight">Date</p>
                <p className="text-[7px] md:text-[8px] text-theme-muted font-semibold">{invoice.date}</p>
              </div>
            </div>
          </div>
          <p className="text-[7px] md:text-[8px] text-theme-muted/60 font-semibold text-center">Digitally compiled by BillQyro &middot; Your data is protected &middot; Secure checkout</p>
        </div>
      </footer>

    </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .bg-theme-card, .card-premium { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px !important; color: black !important; }
        }
      `}} />
    </motion.div>
  );
};

export default PublicInvoice;
