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
  AlertCircle,
  Flame,
  Zap
} from 'lucide-react';
import ShineBorder from '../components/ShineBorder';
import { formatCurrency } from '../utils/invoiceUtils';
import { 
  getRealUserId, 
  submitPremiumRequest, 
  submitPlatformPaymentProof,
  getUserPaymentProofs,
  getUserRevenueState,
  getGlobalRevenueSettings,
  getAuthSession
} from '../services/dbEngine';
import { db, firebaseReady } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

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

  // Platform dues state
  const [activeRevenueTab, setActiveRevenueTab] = useState('premium'); // 'premium' or 'dues'
  const [revenueState, setRevenueState] = useState(null);
  const [platformProofs, setPlatformProofs] = useState([]);
  const [globalRevenueSettings, setGlobalRevenueSettings] = useState(null);
  
  // Platform dues form state
  const [platformPaidAmount, setPlatformPaidAmount] = useState('');
  const [platformPaymentMethod, setPlatformPaymentMethod] = useState('UPI');
  const [platformTxId, setPlatformTxId] = useState('');
  const [platformScreenshot, setPlatformScreenshot] = useState(null);
  const [platformScreenshotBase64, setPlatformScreenshotBase64] = useState('');
  const [platformNote, setPlatformNote] = useState('');
  const [submittingPlatformProof, setSubmittingPlatformProof] = useState(false);

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
    const userId = getRealUserId();
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

  const fetchPlatformRevenue = async () => {
    const userId = getRealUserId() || 'local-user';
    const grs = await getGlobalRevenueSettings();
    setGlobalRevenueSettings(grs);
    
    const localInvoices = JSON.parse(localStorage.getItem(`billqyro_invoices_${userId}`) || '[]');
    const state = await getUserRevenueState(userId, localInvoices, currentSubscription);
    setRevenueState(state);
    
    setPlatformPaidAmount(state.platformPendingAmount.toString());

    const proofs = await getUserPaymentProofs(userId);
    setPlatformProofs(proofs);
  };

  useEffect(() => {
    fetchPendingRequest();
    fetchPlatformRevenue();
  }, [currentSubscription]);

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

  const handlePlatformScreenshotChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setPlatformScreenshot(file);
      const reader = new FileReader();
      reader.onload = (event) => setPlatformScreenshotBase64(event.target.result);
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
      toast.success('Your premium activation request was submitted successfully!');
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

  const handlePlatformProofSubmit = async (e) => {
    e.preventDefault();
    if (!platformTxId.trim()) {
      toast.error('Please specify the Transaction Reference ID (UTR).');
      return;
    }
    const amt = parseFloat(platformPaidAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please specify a valid payment amount.');
      return;
    }

    setSubmittingPlatformProof(true);
    try {
      const userId = getRealUserId() || 'local-user';
      const session = getAuthSession();
      const userEmail = session?.userEmail || session?.email || 'local-user';

      await submitPlatformPaymentProof(
        userId,
        userEmail,
        amt,
        platformPaymentMethod,
        platformTxId,
        platformScreenshotBase64,
        platformNote
      );

      toast.success('Platform payment proof submitted successfully!');
      setPlatformTxId('');
      setPlatformScreenshot(null);
      setPlatformScreenshotBase64('');
      setPlatformNote('');
      fetchPlatformRevenue();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit proof. Please try again.');
    } finally {
      setSubmittingPlatformProof(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24 max-w-5xl mx-auto"
    >
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-black tracking-widest text-theme-accent bg-theme-accent-light dark:bg-theme-accent/10 dark:text-theme-accent px-3.5 py-1.5 rounded-full border border-theme-border-soft dark:border-theme-accent/30">
          Billing & Plans
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-theme-primary tracking-tight">
          Select Your Workspace Capacity
        </h2>
        <p className="text-xs md:text-sm text-theme-muted font-semibold max-w-md mx-auto">
          Scale your invoicing with real vector PDF compilers, offline IndexedDB storage, and snapshotted company billing templates.
        </p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex bg-theme-surface border border-theme-border-soft rounded-2xl p-1 max-w-sm mx-auto mt-4">
        <button
          onClick={() => setActiveRevenueTab('premium')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeRevenueTab === 'premium'
              ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft/60'
              : 'text-theme-muted hover:text-theme-primary'
          }`}
        >
          Premium Subscription
        </button>
        <button
          onClick={() => setActiveRevenueTab('dues')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeRevenueTab === 'dues'
              ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft/60'
              : 'text-theme-muted hover:text-theme-primary'
          }`}
        >
          BillQyro Usage & Dues
        </button>
      </div>

      {/* PENDING NOTIFICATION BANNER */}
      {pendingReq && activeRevenueTab === 'premium' && (
        <div className="p-5 bg-theme-warning/5 border border-theme-warning/30 rounded-3xl flex gap-3.5 animate-pulse shadow-sm">
          <div className="p-2.5 bg-theme-card rounded-xl text-theme-warning shadow-sm h-fit shrink-0">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-theme-warning tracking-wider">Awaiting Manual Activation</span>
            <h4 className="text-xs font-black text-theme-primary mt-0.5">Upgrade Request Under Review</h4>
            <p className="text-[11px] text-theme-muted font-semibold leading-relaxed mt-1">
              Your transfer of <strong className="text-theme-accent">{pendingReq.plan} ({pendingReq.paidAmount} {country === 'India' ? 'INR' : country === 'Bangladesh' ? 'BDT' : 'USD'})</strong> with Transaction ID <strong className="font-mono text-theme-primary">{pendingReq.transactionId}</strong> is currently being verified. Your workspace will automatically unlock upon administrator approval.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: PREMIUM PLANS */}
      {activeRevenueTab === 'premium' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-stretch">
          
          {/* FREE TIER CARD */}
          <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium flex flex-col justify-between relative overflow-hidden">
            {(!isPremium) && (
              <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-theme-surface text-theme-muted px-2.5 py-0.5 rounded-full border border-theme-border-soft">
                Active Plan
              </span>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-theme-primary text-sm uppercase tracking-wider">Free Starter</h3>
                <p className="text-[10px] text-theme-muted font-bold mt-1">BASIC TRANSITION BILLING</p>
              </div>
              
              <div className="border-t border-b border-theme-border-soft/60 py-4">
                <h4 className="text-3xl font-black text-theme-primary tracking-tight">
                  {formatCurrency(0, currencySymbol)}
                  <span className="text-xs text-theme-muted font-bold"> / lifetime</span>
                </h4>
              </div>
   
              <ul className="space-y-2.5 text-xs font-semibold text-theme-muted">
                {freeBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
   
            <div className="mt-8 pt-4 border-t border-theme-border-soft/60">
              <div className="w-full py-3.5 bg-theme-surface border border-theme-border-soft rounded-2xl text-center text-xs font-black text-theme-muted">
                {!isPremium ? 'Currently Active Starter' : 'Downgrade Unavailable'}
              </div>
            </div>
          </div>
   
          {/* PREMIUM MEMBERSHIP CARD */}
          <ShineBorder 
            duration={3} 
            gradient="from-theme-accent via-fuchsia-500 to-blue-500"
            className="h-full"
          >
            <div className="bg-[image:var(--accent-gradient)] h-full text-white rounded-[calc(1.5rem-2px)] p-6 shadow-premium flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>
              {isPremium && (
                <span className="absolute top-4 right-4 z-20 text-[9px] font-extrabold uppercase bg-theme-accent text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                  <Sparkles className="w-2.5 h-2.5" /> Active Plan
                </span>
              )}
     
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-theme-accent text-sm uppercase tracking-wider">Premium Growth</h3>
                    <span className="text-[8px] font-extrabold bg-theme-accent-light text-theme-accent border border-theme-border-soft px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS Tier</span>
                  </div>
                  {!isPremium && (
                    <span className="py-1 px-2.5 text-[9px] font-black uppercase tracking-wider bg-theme-warning/10 text-theme-warning border border-theme-warning/20 rounded-full flex items-center gap-1 shadow-sm">
                      <Flame size={12} /> Recommend
                    </span>
                  )}
                </div>
              
                <div className="border-t border-b border-white/5 py-4">
                  <h4 className="text-3xl font-black text-white tracking-tight">
                    {formatCurrency(country === 'India' ? 499 : country === 'Bangladesh' ? 600 : 9, currencySymbol)}
                    <span className="text-xs text-theme-accent font-bold"> / month</span>
                  </h4>
                  <p className="text-[9.5px] text-theme-muted font-medium mt-1">Or save more: {getPricing('Yearly').label}</p>
                </div>
   
                <ul className="space-y-2.5 text-xs font-semibold text-white/90">
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
                  <div className="w-full py-3.5 bg-white/10 border border-white/25 rounded-2xl text-center text-xs font-bold text-white flex flex-col gap-0.5">
                    <span>Premium Plan Active</span>
                    <span className="text-[9px] font-medium text-white/70 font-mono">Expires: {getExpiryDateString()}</span>
                  </div>
                ) : (
                  <button
                    disabled={!!pendingReq}
                    onClick={() => setShowUpgradeForm(true)}
                    className={`w-full py-4 text-white rounded-2xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      pendingReq 
                        ? 'bg-theme-card border border-theme-border-strong/50 text-theme-muted cursor-not-allowed' 
                        : 'bg-theme-accent hover:opacity-90 hover:shadow-lg hover:shadow-glow active:scale-[0.98]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{pendingReq ? 'Activation Request Pending' : 'Go Premium Now'}</span>
                  </button>
                )}
              </div>
            </div>
          </ShineBorder>
        </div>
      )}

      {/* TAB 2: PLATFORM DUES */}
      {activeRevenueTab === 'dues' && revenueState && (
        <div className="space-y-6 mt-6">
          {/* Usage Stats Card */}
          <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
            <h3 className="text-lg font-black text-theme-primary mb-4">Platform Usage & Dues</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Bills Created</span>
                <span className="text-2xl font-black text-theme-primary mt-1 tabular-nums">
                  {revenueState.totalBillsCreated}
                </span>
              </div>
              <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Free Bills Left</span>
                <span className="text-2xl font-black text-theme-primary mt-1 tabular-nums">
                  {Math.max(0, (globalRevenueSettings?.freeBillLimit || 10) - revenueState.totalBillsCreated)}
                </span>
              </div>
              <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Platform Due</span>
                <span className="text-2xl font-black text-rose-500 mt-1 tabular-nums">
                  ₹{revenueState.platformPendingAmount}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-theme-surface border border-theme-border-soft/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider block">Lock Status</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border mt-1 inline-block ${
                  revenueState.lockStatus === 'locked'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : revenueState.lockStatus === 'grace'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    : revenueState.lockStatus === 'warn'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {revenueState.lockStatus === 'locked' ? 'Locked (New Bill Creation Blocked)' : 
                   revenueState.lockStatus === 'grace' ? 'Grace Period Warning' : 
                   revenueState.lockStatus === 'warn' ? 'Pending Dues Warning' : 'Active / Clean'}
                </span>
              </div>
              
              {revenueState.platformPendingAmount > 0 && (
                <div className="text-xs text-theme-muted font-semibold leading-relaxed max-w-sm">
                  Please pay your platform due amount to the UPI ID: <strong className="font-mono text-theme-primary select-all">{globalRevenueSettings?.upiId || 'khairul2052007@okaxis'}</strong> (Payee Name: {globalRevenueSettings?.payeeName || 'BillQyro Platform'}) and upload proof details.
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof Submission Card */}
          {revenueState.platformPendingAmount > 0 && (
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="text-lg font-black text-theme-primary mb-4">Submit Platform Payment Proof</h3>
              <form onSubmit={handlePlatformProofSubmit} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Paid Amount (₹)</label>
                    <input 
                      type="number"
                      value={platformPaidAmount}
                      onChange={(e) => setPlatformPaidAmount(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Payment Method</label>
                    <select
                      value={platformPaymentMethod}
                      onChange={(e) => setPlatformPaymentMethod(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold transition-all cursor-pointer"
                    >
                      <option value="UPI">UPI</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">UTR / Transaction ID</label>
                  <input 
                    type="text"
                    placeholder="Enter 12-digit Reference Number"
                    value={platformTxId}
                    onChange={(e) => setPlatformTxId(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold transition-all"
                    required
                  />
                  <p className="text-[10px] text-theme-muted mt-1 font-semibold">Enter UTR, IMPS Ref, or Wallet ID details.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Note / Comments (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Cleared my ₹{revenueState.platformPendingAmount} due"
                    value={platformNote}
                    onChange={(e) => setPlatformNote(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary px-4 py-3 rounded-xl focus:outline-none focus:border-theme-accent text-sm font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Screenshot Proof (Optional)</label>
                  <div className="relative border border-theme-border-soft border-dashed rounded-xl p-6 text-center hover:border-theme-accent transition-colors bg-theme-surface">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePlatformScreenshotChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-5 h-5 mx-auto mb-2 text-theme-muted" />
                    <span className="text-[10px] text-theme-muted font-bold block">
                      {platformScreenshot ? platformScreenshot.name : 'Choose screenshot proof image'}
                    </span>
                  </div>
                  {platformScreenshotBase64 && (
                    <div className="mt-2.5 flex items-center gap-3 bg-theme-surface border border-theme-border-soft rounded-xl p-2">
                      <img src={platformScreenshotBase64} alt="Proof" className="w-12 h-12 object-cover rounded-lg border border-theme-border-soft" />
                      <span className="text-[10px] text-theme-muted truncate max-w-[200px]">{platformScreenshot?.name}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingPlatformProof}
                  className="w-full h-[48px] bg-theme-accent hover:opacity-90 text-white font-extrabold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {submittingPlatformProof ? 'Submitting...' : 'Submit Proof Details'}
                </button>
              </form>
            </div>
          )}

          {/* Platform Proofs History List */}
          <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
            <h3 className="text-lg font-black text-theme-primary mb-4">Dues Payment History</h3>
            {platformProofs.length === 0 ? (
              <p className="text-xs text-theme-muted font-bold italic py-4">No payment proofs submitted yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformProofs.map((proof) => (
                  <div key={proof.id} className="bg-theme-surface rounded-2xl p-4 border border-theme-border-soft/60 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-black text-theme-primary">₹{proof.amount}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          proof.status === 'Approved'
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                            : proof.status === 'Rejected'
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/20'
                        }`}>
                          {proof.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-theme-muted space-y-1 font-semibold">
                        <div>UTR: <span className="font-mono text-theme-primary select-all">{proof.transactionId}</span></div>
                        <div>Method: <span className="text-theme-primary">{proof.paymentMethod}</span></div>
                        <div>Date: <span>{new Date(proof.createdAt).toLocaleDateString()}</span></div>
                        {proof.adminNote && (
                          <div className="mt-2 text-rose-500 dark:text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                            Admin Note: {proof.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUAL UPGRADE STEPPED REQUEST FORM */}
      <AnimatePresence>
        {showUpgradeForm && activeRevenueTab === 'premium' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 md:p-8 shadow-premium max-w-2xl mx-auto space-y-6 mt-8"
          >
            <div className="flex justify-between items-center border-b border-theme-border-soft pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-accent-light text-theme-accent flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-theme-primary">Manual Premium Upgrade Request</h3>
                  <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Follow steps to unlock Premium growth features</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowUpgradeForm(false)}
                className="p-1.5 text-theme-muted hover:text-theme-primary bg-theme-surface rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* STEP 1: PAYMENT METHOD MANUAL DETAILS BY COUNTRY */}
              <div className="space-y-4 bg-theme-surface p-5 rounded-2xl border border-theme-border-soft">
                <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider">Step 1: Transfer Payment</span>
                <h4 className="text-xs font-black text-theme-primary">Send Transfer Amount to Administrator</h4>
                
                <div className="text-[11px] text-theme-muted leading-relaxed font-semibold space-y-3.5 border-t border-theme-border-soft/50 pt-3">
                  
                  {country === 'India' && (
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">Scan UPI QR Code</span>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('upi://pay?pa=billqyro@okaxis&pn=BillQyro%20SaaS&am=' + activePricing.amount + '&cu=INR&tn=SaaS%20Upgrade')}`}
                          alt="Admin UPI QR" 
                          className="w-28 h-28 object-contain rounded-xl border border-white mt-1 shadow-sm bg-theme-card p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">UPI Address</span>
                          <span className="font-mono text-theme-accent font-extrabold select-all break-all">billqyro@okaxis</span>
                        </div>
                        <div className="pt-1.5 border-t border-theme-border-soft/40">
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">Direct Bank Transfer</span>
                          <span className="block text-theme-primary font-bold">HDFC Bank | A/C: 50200012345678</span>
                          <span className="block font-mono text-[10px]">IFSC: HDFC0000123</span>
                          <span className="block text-[9.5px]">Name: BillQyro Invoicing SaaS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {country === 'Bangladesh' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="p-2 bg-theme-accent-light border border-theme-accent/20 text-theme-accent rounded-lg flex justify-between items-center">
                          <span className="font-black text-[9px] uppercase">bKash Personal / SendMoney</span>
                          <span className="font-mono font-black select-all">01700-123456</span>
                        </div>
                        <div className="p-2 bg-theme-warning/10 border border-theme-warning/20 text-theme-warning rounded-lg flex justify-between items-center">
                          <span className="font-black text-[9px] uppercase">Nagad Personal / SendMoney</span>
                          <span className="font-mono font-black select-all">01900-123456</span>
                        </div>
                        <div className="p-2 bg-theme-accent-light border border-theme-accent/20 text-theme-accent rounded-lg flex justify-between items-center">
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
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">Direct PayPal Transfer</span>
                        <span className="block text-theme-primary font-bold font-mono select-all">billing@billqyro.com</span>
                      </div>
                      <div className="pt-1.5 border-t border-theme-border-soft/40">
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">International Wire Transfer</span>
                        <span className="block text-theme-primary font-bold">Standard Chartered Bank | A/C: 123-456789-012</span>
                        <span className="block font-mono text-[10px]">SWIFT: SCBLUS33XXX</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* STEP 2: USER INPUT VERIFICATION INFO */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider block">Step 2: Submit Proof Details</span>
                <h4 className="text-xs font-black text-theme-primary">Provide Payment Verification Details</h4>
                
                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Selected Capacity Tier</label>
                  <select 
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-theme-surface text-theme-primary border border-theme-border-soft rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-theme-accent cursor-pointer"
                  >
                    <option value="Monthly">Monthly growth plan</option>
                    <option value="Yearly">Yearly corporate plan</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Transferred Amount</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-theme-surface text-theme-primary border border-theme-border-soft rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-theme-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Transfer Method</label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-theme-surface text-theme-primary border border-theme-border-soft rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-theme-accent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Transaction / Ref ID</label>
                  <input
                    type="text"
                    placeholder="Enter Reference/UTR number"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-theme-surface text-theme-primary border border-theme-border-soft rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-theme-accent"
                    required
                  />
                  <span className="text-[8.5px] text-theme-muted block mt-0.5 font-medium">Please enter your exact 12-digit Transaction ID.</span>
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Payment Screenshot Proof (Optional)</label>
                  <div 
                    className={`relative border border-theme-border-soft border-dashed rounded-xl py-5 px-3 text-center cursor-pointer transition-all bg-theme-surface ${
                      isDragging ? 'border-theme-accent bg-theme-accent-light/10' : 'hover:border-theme-accent'
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
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <Upload className="w-4 h-4 text-theme-muted" />
                      <span className="text-[10px] text-theme-muted">Drag transaction image or click to browse</span>
                    </div>
                  </div>

                  {screenshotBase64 && (
                    <div className="mt-2.5 flex items-center gap-3 bg-theme-surface border border-theme-border-soft rounded-xl p-2 relative group">
                      <img src={screenshotBase64} alt="Proof" className="w-12 h-12 object-cover rounded-lg border border-theme-border-soft" />
                      <div className="text-[10px] truncate max-w-xs pr-8">
                        <span className="text-theme-primary block font-bold">screenshot_proof.png</span>
                        <span className="text-[8.5px] text-theme-muted block font-mono">base64 encoded</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setScreenshotBase64('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold hover:scale-110 transition-transform cursor-pointer z-20"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-theme-accent text-white hover:opacity-90 rounded-2xl font-black uppercase tracking-wider shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
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
