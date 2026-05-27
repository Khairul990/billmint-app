import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Globe, 
  ChevronRight,
  TrendingUp,
  Sliders,
  Palette,
  Clock,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { getFirebaseUserId, submitPremiumRequest } from '../utils/storage';
import { db, firebaseReady } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Subscription = ({ currentSubscription, onUpgrade, businessSettings }) => {
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Monthly');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Live Pending Request Query
  const [pendingReq, setPendingReq] = useState(null);
  const [checkingPending, setCheckingPending] = useState(false);

  const country = businessSettings?.country || 'India';
  const currencySymbol = businessSettings?.currency || '₹';
  const isPremium = currentSubscription?.status === 'premium';

  // Expiration date text helpers
  const getExpiryDateString = () => {
    if (!currentSubscription?.expiresAt) return 'Unlimited';
    return new Date(currentSubscription.expiresAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Pricing Matrix based on Country
  const getPricing = (plan) => {
    if (country === 'India') {
      return plan === 'Yearly' ? { amount: 4999, label: '₹4,999 / year' } : { amount: 499, label: '₹499 / month' };
    } else if (country === 'Bangladesh') {
      return plan === 'Yearly' ? { amount: 6000, label: '৳6,000 / year' } : { amount: 600, label: '৳600 / month' };
    } else {
      return plan === 'Yearly' ? { amount: 90, label: '$90 / year' } : { amount: 9, label: '$9 / month' };
    }
  };

  const activePricing = getPricing(selectedPlan);

  useEffect(() => {
    // Auto-update prefilled amount on plan change
    setPaidAmount(activePricing.amount.toString());
  }, [selectedPlan]);

  // Set default payment method by country
  useEffect(() => {
    if (country === 'India') {
      setPaymentMethod('UPI');
    } else if (country === 'Bangladesh') {
      setPaymentMethod('bKash');
    } else {
      setPaymentMethod('Bank Transfer');
    }
  }, [country]);

  // Query pending upgrade requests from Firestore
  const fetchPendingRequest = async () => {
    if (!firebaseReady) return;
    const userId = getFirebaseUserId();
    if (!userId) return;
    
    setCheckingPending(true);
    try {
      const q = query(
        collection(db, 'premiumRequests'),
        where('userId', '==', userId),
        where('status', '==', 'Pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPendingReq(snap.docs[0].data());
      } else {
        setPendingReq(null);
      }
    } catch (e) {
      console.error('Failed to fetch pending requests:', e);
    } finally {
      setCheckingPending(false);
    }
  };

  useEffect(() => {
    fetchPendingRequest();
  }, [firebaseReady]);

  const freeBenefits = [
    `Create up to ${businessSettings?.freeInvoiceLimit || 15} invoices only`,
    'Standard basic PDF template',
    'Contains BillQyro branding watermark',
    'Standard local offline dashboard',
  ];

  const premiumBenefits = [
    'Unlimited invoice generation',
    'Premium detailed A4 & A5 templates',
    'Remove BillQyro watermarks & branding',
    'Upload custom corporate logos',
    'Modify branding invoice colors',
    'Advanced operating expenses tracking',
    'Direct WhatsApp due reminder panel',
    'Dedicated Cloud Backup Sync',
  ];

  // Base64 drag & drop image handlers
  const handleScreenshotChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setScreenshotBase64(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      alert('Please specify your Transaction Reference ID.');
      return;
    }

    setLoading(true);
    try {
      await submitPremiumRequest(selectedPlan, parseFloat(paidAmount) || activePricing.amount, paymentMethod, transactionId, screenshotBase64);
      alert('Upgrade request submitted successfully! Our administrators will verify your payment and activate premium within minutes.');
      setShowUpgradeForm(false);
      setTransactionId('');
      setScreenshotBase64('');
      fetchPendingRequest();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit premium request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto font-sans"
    >
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-black tracking-widest text-theme-accent bg-theme-accent-light dark:bg-theme-accent/10 dark:text-theme-accent px-3.5 py-1.5 rounded-full border border-theme-border-soft dark:border-theme-accent/30">
          Billing & Plans
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-theme-primary dark:text-theme-primary tracking-tight">
          Select Your Workspace Capacity
        </h2>
        <p className="text-xs md:text-sm text-theme-muted font-semibold max-w-md mx-auto">
          Scale your invoicing with real vector PDF compilers, offline IndexedDB storage, and snapshotted company billing templates.
        </p>
      </div>

      {/* PENDING NOTIFICATION BANNER */}
      {pendingReq && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 rounded-3xl flex gap-3.5 animate-pulse shadow-sm">
          <div className="p-2.5 bg-theme-card dark:bg-theme-card rounded-xl text-amber-500 shadow-sm h-fit">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-450 tracking-wider">Awaiting Manual Activation</span>
            <h4 className="text-xs font-black text-theme-primary dark:text-theme-primary dark:text-theme-secondary mt-0.5">Upgrade Request Under Review</h4>
            <p className="text-[11px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed mt-1">
              Your transfer of <strong className="text-theme-accent dark:text-theme-accent">{pendingReq.plan} ({pendingReq.paidAmount} {country === 'India' ? 'INR' : country === 'Bangladesh' ? 'BDT' : 'USD'})</strong> with Transaction ID <strong className="font-mono text-theme-primary dark:text-theme-muted">{pendingReq.transactionId}</strong> is currently being verified. Your workspace will automatically unlock upon administrator approval.
            </p>
          </div>
        </div>
      )}

      {/* DUAL PLAN CARDS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-stretch">
        
        {/* FREE TIER CARD */}
        <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex flex-col justify-between relative overflow-hidden">
          {(!isPremium) && (
            <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-theme-surface dark:bg-theme-card text-theme-muted dark:text-theme-muted px-2.5 py-0.5 rounded-full border border-theme-border-soft dark:border-theme-border-soft">
              Active Plan
            </span>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-theme-primary dark:text-theme-muted dark:text-slate-250 text-sm uppercase tracking-wider">Free Starter</h3>
              <p className="text-[10px] text-theme-muted font-bold mt-1">BASIC TRANSITION BILLING</p>
            </div>
            
            <div className="border-t border-b border-slate-50 dark:border-theme-border-soft/60 py-4">
              <h4 className="text-3xl font-black text-theme-primary dark:text-theme-primary dark:text-theme-primary tracking-tight">
                {formatCurrency(0, currencySymbol)}
                <span className="text-xs text-theme-muted font-bold"> / lifetime</span>
              </h4>
            </div>
 
            <ul className="space-y-2.5 text-xs font-semibold text-theme-muted dark:text-theme-muted">
              {freeBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
 
          <div className="mt-8 pt-4 border-t border-slate-50 dark:border-theme-border-soft/60">
            <div className="w-full py-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/40 border border-theme-border-soft dark:border-theme-border-soft rounded-2xl text-center text-xs font-black text-theme-muted">
              {!isPremium ? 'Currently Active Starter' : 'Downgrade Unavailable'}
            </div>
          </div>
        </div>
 
        {/* PREMIUM MEMBERSHIP CARD */}
        <div className="bg-[image:var(--accent-gradient)] text-white rounded-3xl p-6 shadow-premium flex flex-col justify-between relative overflow-hidden border border-theme-border-soft/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>
          {isPremium && (
            <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-theme-accent text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
              <Sparkles className="w-2.5 h-2.5" /> Active Plan
            </span>
          )}
 
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-theme-accent text-sm uppercase tracking-wider">Premium Growth</h3>
              <span className="text-[8px] font-extrabold bg-theme-accent-light text-theme-accent border border-theme-border-soft px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS Tier</span>
            </div>
            
            <div className="border-t border-b border-white/5 py-4">
              <h4 className="text-3xl font-black text-white tracking-tight">
                {formatCurrency(country === 'India' ? 499 : country === 'Bangladesh' ? 600 : 9, currencySymbol)}
                <span className="text-xs text-theme-accent font-bold"> / month</span>
              </h4>
              <p className="text-[9.5px] text-theme-muted font-medium mt-1">Or save more: {getPricing('Yearly').label}</p>
            </div>
 
            <ul className="space-y-2.5 text-xs font-semibold text-theme-accent/90">
              {premiumBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
 
          <div className="mt-8 pt-4 border-t border-white/5 relative z-10">
            {isPremium ? (
              <div className="w-full py-3.5 bg-indigo-950/30 border border-theme-border-soft rounded-2xl text-center text-xs font-bold text-theme-accent flex flex-col gap-0.5">
                <span>Premium Plan Active</span>
                <span className="text-[9px] font-medium text-theme-accent">Expires: {getExpiryDateString()}</span>
              </div>
            ) : (
              <button
                disabled={!!pendingReq}
                onClick={() => setShowUpgradeForm(true)}
                className={`w-full py-4 text-white rounded-2xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  pendingReq 
                    ? 'bg-slate-800 border border-slate-700/50 text-theme-muted cursor-not-allowed' 
                    : 'bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 hover:shadow-lg hover:shadow-glow active:scale-[0.98]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{pendingReq ? 'Activation Request Pending' : 'Go Premium Now'}</span>
              </button>
            )}
          </div>
        </div>
 
      </div>

      {/* MANUAL UPGRADE STEPPED REQUEST FORM */}
      <AnimatePresence>
        {showUpgradeForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="bg-theme-card dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-3xl p-6 md:p-8 shadow-premium max-w-2xl mx-auto space-y-6 mt-8"
          >
            <div className="flex justify-between items-center border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Manual Premium Upgrade Request</h3>
                  <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Follow steps to unlock Premium growth features</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowUpgradeForm(false)}
                className="p-1 text-theme-muted hover:text-theme-muted dark:hover:text-slate-200 bg-theme-app dark:bg-theme-surface dark:bg-theme-card rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* STEP 1: PAYMENT METHOD MANUAL DETAILS BY COUNTRY */}
              <div className="space-y-4 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface p-5 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft">
                <span className="text-[9px] font-black uppercase text-theme-accent dark:text-theme-accent tracking-wider">Step 1: Transfer Payment</span>
                <h4 className="text-xs font-black text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Send Transfer Amount to Administrator</h4>
                
                <div className="text-[11px] text-theme-muted dark:text-theme-muted leading-relaxed font-semibold space-y-3.5 border-t border-theme-border-soft/50 dark:border-theme-border-soft/50 pt-3">
                  
                  {country === 'India' && (
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">Scan UPI QR Code</span>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('upi://pay?pa=billqyro@okaxis&pn=BillQyro%20SaaS&am=' + activePricing.amount + '&cu=INR&tn=SaaS%20Upgrade')}`}
                          alt="Admin UPI QR" 
                          className="w-28 h-28 object-contain rounded-xl border border-white mt-1 shadow-sm bg-theme-card dark:bg-theme-card p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">UPI Address</span>
                          <span className="font-mono text-theme-accent dark:text-theme-accent font-extrabold select-all break-all">billqyro@okaxis</span>
                        </div>
                        <div className="pt-1.5 border-t border-theme-border-soft/40">
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">Direct Bank Transfer</span>
                          <span className="block text-theme-primary dark:text-theme-muted font-bold">HDFC Bank | A/C: 50200012345678</span>
                          <span className="block font-mono text-[10px]">IFSC: HDFC0000123</span>
                          <span className="block text-[9.5px]">Name: BillQyro Invoicing SaaS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {country === 'Bangladesh' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-lg flex justify-between items-center">
                          <span className="font-black text-[9px] uppercase">bKash Personal / SendMoney</span>
                          <span className="font-mono font-black select-all">01700-123456</span>
                        </div>
                        <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg flex justify-between items-center">
                          <span className="font-black text-[9px] uppercase">Nagad Personal / SendMoney</span>
                          <span className="font-mono font-black select-all">01900-123456</span>
                        </div>
                        <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-lg flex justify-between items-center">
                          <span className="font-black text-[9px] uppercase">Rocket Personal Number</span>
                          <span className="font-mono font-black select-all">01800-123456</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] italic text-theme-muted mt-1">Please use "Send Money" options inside BKash/Nagad app, then copy your Transaction ID.</p>
                    </div>
                  )}

                  {country === 'Other' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">International Paypal Link</span>
                        <a 
                          href="https://paypal.me/billqyro" 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-mono text-theme-accent dark:text-theme-accent font-extrabold hover:underline"
                        >
                          paypal.me/billqyro
                        </a>
                      </div>
                      <div className="pt-2 border-t border-theme-border-soft/40">
                        <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">Citibank SWIFT Wire</span>
                        <span className="block text-theme-primary dark:text-theme-muted font-bold">CitiBank New York</span>
                        <span className="block">A/C: 12345678-9012</span>
                        <span className="block font-mono text-[10px]">SWIFT Code: CITIUS33</span>
                        <span className="block text-[9.5px]">Beneficiary: BillQyro Invoicing Inc.</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-theme-accent-light border border-theme-border-soft rounded-xl flex gap-2.5 mt-4 text-theme-accent dark:text-theme-accent">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-[9.5px] leading-relaxed">
                      Make sure to note down the Transaction ID or reference sequence. Admin will match it to confirm your plan status.
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP 2: VERIFICATION REQUEST SUBMISSION FORM */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-theme-muted dark:text-theme-muted">
                <span className="text-[9px] font-black uppercase text-theme-accent dark:text-theme-accent tracking-wider block">Step 2: Submit Details</span>
                <h4 className="text-xs font-black text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Submit Verification Form</h4>
                
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-theme-border-soft dark:border-theme-border-soft/80">
                  <div>
                    <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Select Plan Duration</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                    >
                      <option value="Monthly">Monthly Plan ({getPricing('Monthly').label})</option>
                      <option value="Yearly">Yearly Plan ({getPricing('Yearly').label})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Payment Gateway / Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                    >
                      {country === 'India' && <option value="UPI">UPI Interface</option>}
                      {country === 'Bangladesh' && (
                        <>
                          <option value="bKash">bKash Account</option>
                          <option value="Nagad">Nagad Account</option>
                          <option value="Rocket">Rocket Wallet</option>
                        </>
                      )}
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Other">Other Method</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Transfer Amount Paid ({country === 'India' ? 'INR' : country === 'Bangladesh' ? 'BDT' : 'USD'})</label>
                  <input
                    type="text"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="e.g. 499"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-primary font-extrabold"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Transaction ID / Reference Number</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TXN9876543210AX or BK-89X72"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-primary font-mono font-black"
                  />
                </div>

                {/* Optional Screenshot Drag & Drop */}
                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Payment Screenshot Proof (Optional)</label>
                  <div
                    className={`relative border border-dashed rounded-xl p-3 text-center transition-all ${
                      isDragging ? 'border-theme-accent bg-theme-surface dark:bg-theme-surface' : 'border-theme-border-soft dark:border-theme-border-soft bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/40 hover:bg-theme-surface dark:bg-theme-card dark:hover:bg-slate-800/80'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleScreenshotChange(e.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleScreenshotChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <Upload className="w-4 h-4 text-theme-muted" />
                      <span className="text-[10px] text-theme-muted dark:text-theme-muted">Drag transaction image or click to browse</span>
                    </div>
                  </div>

                  {screenshotBase64 && (
                    <div className="mt-2.5 flex items-center gap-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft dark:border-theme-border-soft rounded-xl p-2 relative group">
                      <img src={screenshotBase64} alt="Proof" className="w-12 h-12 object-cover rounded-lg border border-theme-border-soft dark:border-theme-border-soft bg-theme-card dark:bg-theme-card" />
                      <div className="text-[10px] truncate max-w-xs pr-8">
                        <span className="text-theme-primary dark:text-theme-muted dark:text-theme-muted block font-bold">screenshot_proof.png</span>
                        <span className="text-[8.5px] text-slate-450 block font-mono">base64 encoded</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setScreenshotBase64('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold hover:scale-110 transition-transform"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-2xl font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-theme-accent" />
                      <span>Submit Activation Request</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Subscription;
