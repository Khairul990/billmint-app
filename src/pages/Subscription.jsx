import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award,
  ArrowRight,
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  Check, 
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CreditCard, 
  Database,
  Flame,
  FileText,
  Globe, 
  HeadphonesIcon,
  HelpCircle,
  Image as ImageIcon,
  Lock, 
  Palette,
  Percent,
  Receipt,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  ShieldCheck, 
  Sliders,
  Smartphone,
  Sparkles, 
  TrendingUp,
  Upload,
  Users,
  XCircle,
  Zap,
  ArrowLeft
} from 'lucide-react';
import ShineBorder from '../components/ShineBorder';
import { formatCurrency } from '../utils/invoiceUtils';
import { authEngine } from '../services/authEngine';
import { adminEngine } from '../services/adminEngine';
import { subscriptionEngine } from '../services/subscriptionEngine';
import { paymentEngine } from '../services/paymentEngine';
import { addNotification } from '../services/notificationsService';
import { db, firebaseReady } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import DynamicQRCode from '../components/DynamicQRCode';
import { toast } from 'react-hot-toast';
import { pageVariants, staggerContainer, staggerItem, fadeInUp } from '../utils/animations';
import PremiumEmptyState from '../components/PremiumEmptyState';

const Subscription = ({ currentSubscription, onUpgrade, businessSettings, setCurrentTab }) => {
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Monthly');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [pendingReq, setPendingReq] = useState(null);
  const [rejectedReq, setRejectedReq] = useState(null);
  const [checkingPending, setCheckingPending] = useState(false);

  const [activeRevenueTab, setActiveRevenueTab] = useState('premium');
  const [revenueState, setRevenueState] = useState(null);
  const [platformProofs, setPlatformProofs] = useState([]);
  const [globalRevenueSettings, setGlobalRevenueSettings] = useState(null);
  
  const [platformPaidAmount, setPlatformPaidAmount] = useState('');
  const [platformPaymentMethod, setPlatformPaymentMethod] = useState('UPI');
  const [platformTxId, setPlatformTxId] = useState('');
  const [platformScreenshot, setPlatformScreenshot] = useState(null);
  const [platformScreenshotBase64, setPlatformScreenshotBase64] = useState('');
  const [platformNote, setPlatformNote] = useState('');
  const [submittingPlatformProof, setSubmittingPlatformProof] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [billCount, setBillCount] = useState(20);
  const [billingHistory, setBillingHistory] = useState([]);

  const country = businessSettings?.country || 'India';
  const currencySymbol = businessSettings?.currency || '₹';
  const isPremium = currentSubscription?.status === 'premium';

  const getExpiryDateString = () => {
    if (!currentSubscription?.expiresAt) return 'Unlimited';
    return new Date(currentSubscription.expiresAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!currentSubscription?.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(currentSubscription.expiresAt);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getRenewalDate = () => {
    if (!currentSubscription?.expiresAt) return null;
    const expiry = new Date(currentSubscription.expiresAt);
    const renewal = new Date(expiry);
    renewal.setDate(renewal.getDate() + (selectedPlan === 'Yearly' ? 365 : 30));
    return renewal.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPricing = (plan) => {
    if (country === 'India') {
      return plan === 'Lifetime' ? { amount: globalRevenueSettings?.priceLifetime || 14999, label: `₹${globalRevenueSettings?.priceLifetime || 14999} / lifetime` }
        : plan === 'Yearly' ? { amount: globalRevenueSettings?.priceYearly || 4999, label: `₹${globalRevenueSettings?.priceYearly || 4999} / year` } 
        : plan === 'Quarterly' ? { amount: globalRevenueSettings?.priceQuarterly || 1299, label: `₹${globalRevenueSettings?.priceQuarterly || 1299} / quarter` }
        : { amount: globalRevenueSettings?.priceMonthly || 499, label: `₹${globalRevenueSettings?.priceMonthly || 499} / month` };
    } else if (country === 'Bangladesh') {
      return plan === 'Yearly' ? { amount: 6000, label: '৳6,000 / year' } : { amount: 600, label: '৳600 / month' };
    } else {
      return plan === 'Yearly' ? { amount: 90, label: '$90 / year' } : { amount: 9, label: '$9 / month' };
    }
  };

  const activePricing = getPricing(selectedPlan);
  const perBillRate = Math.round((activePricing.amount / (businessSettings?.freeInvoiceLimit || 15)) * 1.5);
  const payPerBillCost = billCount * perBillRate;
  const premiumPrice = activePricing.amount;
  const savings = Math.max(0, payPerBillCost - premiumPrice);

  const daysRemaining = getDaysRemaining();
  const renewalDateStr = getRenewalDate();

  useEffect(() => {
    setPaidAmount(activePricing.amount.toString());
  }, [selectedPlan]);

  useEffect(() => {
    if (country === 'India') {
      setPaymentMethod('UPI');
    } else if (country === 'Bangladesh') {
      setPaymentMethod('bKash');
    } else {
      setPaymentMethod('Bank Transfer');
    }
  }, [country]);

  useEffect(() => {
    const userId = authEngine.getRealUserId() || 'local-user';
    const stored = localStorage.getItem(`billqyro_billing_history_${userId}`);
    if (stored) {
      try {
        setBillingHistory(JSON.parse(stored));
      } catch {
        setBillingHistory([]);
      }
    } else {
      setBillingHistory([]);
    }
  }, [currentSubscription]);

  const addBillingHistoryEntry = (entry) => {
    const userId = authEngine.getRealUserId() || 'local-user';
    const updated = [
      {
        id: `hist_${Date.now()}`,
        date: new Date().toISOString(),
        plan: selectedPlan,
        amount: parseFloat(paidAmount) || activePricing.amount,
        currency: currencySymbol,
        method: paymentMethod,
        transactionId: transactionId,
        status: 'Pending',
      },
      ...billingHistory,
    ];
    localStorage.setItem(`billqyro_billing_history_${userId}`, JSON.stringify(updated));
    setBillingHistory(updated);
  };

  const fetchPendingRequest = async () => {
    if (!firebaseReady) return;
    const userId = authEngine.getRealUserId();
    if (!userId) return;
    
    setCheckingPending(true);
    try {
      const q = query(
        collection(db, 'premiumRequests'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => d.data());
      const pending = docs.find(d => d.status === 'Pending');
      const rejected = docs.find(d => d.status === 'Rejected');
      
      setPendingReq(pending || null);
      setRejectedReq(rejected || null);
    } catch (e) {
      console.error('Failed to fetch pending requests:', e);
    } finally {
      setCheckingPending(false);
    }
  };

  const fetchPlatformRevenue = async () => {
    const userId = authEngine.getRealUserId() || 'local-user';
    const grs = await adminEngine.getGlobalRevenueSettings();
    setGlobalRevenueSettings(grs);
    
    const localInvoices = JSON.parse(localStorage.getItem(`billqyro_invoices_${userId}`) || '[]');
    const state = await paymentEngine.getUserRevenueState(userId, localInvoices, currentSubscription);
    setRevenueState(state);
    
    setPlatformPaidAmount(state.platformPendingAmount.toString());

    const proofs = await paymentEngine.getUserPaymentProofs(userId);
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

  const planComparisonFeatures = [
    { name: 'Invoice Creation Limit', free: 'Up to 15/mo', premium: 'Unlimited' },
    { name: 'Invoice Templates', free: 'Basic Standard', premium: 'Premium A4 & A5' },
    { name: 'Watermark Removal', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'Custom Corporate Logo', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'Branding Colors', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'Expense Tracking', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'WhatsApp Reminders', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'Cloud Backup Sync', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'API Access', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { name: 'Priority Support', free: <XCircle className="w-4 h-4 text-rose-500" />, premium: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
  ];

  const faqItems = [
    { q: 'What payment methods do you accept?', a: 'We accept UPI, bKash, Nagad, Rocket, bank transfers, and PayPal depending on your region. All transactions are processed securely via encrypted gateways.' },
    { q: 'How long does premium activation take?', a: 'Premium activation typically takes 1\u201324 hours after payment verification. You will receive an email confirmation once your workspace is upgraded.' },
    { q: 'Can I switch between plans?', a: 'Yes, you can upgrade from Free to Premium at any time. Downgrade options are available upon request after your current billing cycle ends.' },
    { q: 'Is there a free trial for Premium?', a: 'You can explore all features with the Free plan indefinitely. Upgrade to Premium or use Pay Per Bill when you need unlimited access.' },
    { q: 'Can I get a refund if I upgrade?', a: 'We offer full refunds within 7 days of premium activation if you are not satisfied with the service. No questions asked.' },
    { q: 'What happens after my premium expires?', a: 'Your account will revert to the Free plan with limited features. All your data remains safe and accessible in your workspace.' },
  ];

  const benefits = [
    { icon: Zap, title: 'Unlimited Invoices', desc: 'Create as many professional invoices as you need with zero restrictions or caps.' },
    { icon: Palette, title: 'Premium Templates', desc: 'Access exclusive A4 & A5 templates with advanced customization options.' },
    { icon: Cloud, title: 'Cloud Backup Sync', desc: 'Your invoices and data are automatically backed up to the cloud securely.' },
    { icon: TrendingUp, title: 'Expense Tracking', desc: 'Track operating expenses and get detailed financial insights.' },
    { icon: Smartphone, title: 'WhatsApp Reminders', desc: 'Send automated due payment reminders directly via WhatsApp.' },
    { icon: HeadphonesIcon, title: 'Priority Support', desc: 'Get priority access to our support team for faster issue resolution.' },
  ];

  const trustBadges = [
    { icon: Shield, title: 'Secure Payments', desc: 'SSL encrypted transactions' },
    { icon: Lock, title: '256-bit Encryption', desc: 'Bank-grade data security' },
    { icon: Server, title: '99.9% Uptime', desc: 'Reliable cloud infrastructure' },
    { icon: Award, title: 'SOC 2 Compliant', desc: 'Industry security standards' },
    { icon: Database, title: 'Data Backup', desc: 'Automated daily backups' },
    { icon: Clock, title: 'Instant Activation', desc: 'Quick premium activation' },
  ];

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
      toast.error('Please specify your Transaction Reference ID.');
      return;
    }

    // Prevent duplicate submission if already pending
    if (pendingReq) {
      toast.error('You already have a pending activation request.');
      return;
    }

    setLoading(true);
    try {
      await subscriptionEngine.submitPremiumRequest(selectedPlan, parseFloat(paidAmount) || activePricing.amount, paymentMethod, transactionId, screenshotBase64);
      toast.success('Your premium activation request was submitted successfully!');
      addNotification('Premium Request', `Your request for ${selectedPlan} plan has been submitted and is pending verification.`, 'info');
      addBillingHistoryEntry({
        plan: selectedPlan,
        amount: parseFloat(paidAmount) || activePricing.amount,
        method: paymentMethod,
        transactionId,
        status: 'Pending',
      });
      setShowUpgradeForm(false);
      setTransactionId('');
      setScreenshotBase64('');
      fetchPendingRequest();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit premium request. Please try again.');
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
      const userId = authEngine.getRealUserId() || 'local-user';
      const session = authEngine.getAuthSession();
      const userEmail = session?.userEmail || session?.email || 'local-user';

      await paymentEngine.submitPlatformPaymentProof(
        userId,
        userEmail,
        amt,
        platformPaymentMethod,
        platformTxId,
        platformScreenshotBase64,
        platformNote
      );

      toast.success('Platform payment proof submitted successfully!');
      addNotification('Platform Proof', 'Your payment proof has been submitted to the platform admin.', 'info');
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
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-24 max-w-5xl mx-auto"
    >
      {/* Back to Settings Button */}
      {setCurrentTab && (
        <button
          onClick={() => setCurrentTab('settings')}
          className="btn-premium flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-xl font-bold text-xs mb-4 shadow-sm w-fit transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-theme-muted" /> Back to Settings Studio
        </button>
      )}

      {/* PREMIUM HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-600 p-6 md:p-8 shadow-premium">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest mb-3">
            <Award className="w-3 h-3" /> Billing & Plans
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mt-2">
            {isPremium ? 'Your Premium Workspace' : 'Scale Your Business'}
          </h2>
          <p className="text-sm md:text-base text-white/80 font-semibold max-w-xl mx-auto mt-2">
            {isPremium
              ? 'Enjoy unlimited access to all premium features with cloud sync and priority support.'
              : 'Choose the perfect plan that grows with your business. No hidden fees, cancel anytime.'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-300" /> {isPremium ? 'Unlimited invoices' : '15 free invoices'}</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-300" /> {isPremium ? 'Cloud backup' : 'Offline mode'}</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-300" /> Priority support</span>
            {isPremium && (
              <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"><Sparkles className="w-3 h-3 text-amber-300" /> Premium Active</span>
            )}
          </div>
        </div>
      </div>

      {/* CURRENT PLAN STATUS */}
      {isPremium && (
        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-theme-primary">Premium Growth Plan</h3>
                  <span className="badge-premium text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                </div>
                <p className="text-xs text-theme-muted font-semibold mt-0.5">
                  {currentSubscription?.plan || 'Monthly'} plan &middot; Expires {getExpiryDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {daysRemaining !== null && (
                <div className="bg-theme-surface border border-theme-border-soft rounded-xl px-3.5 py-2 text-center min-w-[80px]">
                  <p className="text-lg font-black text-theme-primary tabular-nums">{daysRemaining}</p>
                  <p className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">Days Left</p>
                </div>
              )}
              <button onClick={() => { if (pendingReq) { toast('You already have a pending upgrade request.'); return; } setShowUpgradeForm(true); }} className="btn-premium text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Renew
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex bg-theme-surface border border-theme-border-soft rounded-2xl p-1 max-w-sm mx-auto mt-4 glass">
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

      {pendingReq && activeRevenueTab === 'premium' && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="p-5 bg-theme-warning/5 border border-theme-warning/30 rounded-3xl flex gap-3.5 animate-pulse shadow-sm"
        >
          <div className="p-2.5 bg-theme-card rounded-xl text-theme-warning shadow-sm h-fit shrink-0">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-theme-warning tracking-wider badge-premium">Awaiting Manual Activation</span>
            <h4 className="text-xs font-black text-theme-primary mt-0.5">Upgrade Request Under Review</h4>
            <p className="text-[11px] text-theme-muted font-semibold leading-relaxed mt-1">
              Your transfer of <strong className="text-theme-accent">{pendingReq.plan} ({pendingReq.paidAmount} {country === 'India' ? 'INR' : country === 'Bangladesh' ? 'BDT' : 'USD'})</strong> with Transaction ID <strong className="font-mono text-theme-primary">{pendingReq.transactionId}</strong> is currently being verified. Your workspace will automatically unlock upon administrator approval.
            </p>
          </div>
        </motion.div>
      )}

      {rejectedReq && !pendingReq && activeRevenueTab === 'premium' && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="p-5 bg-rose-500/5 border border-rose-500/30 rounded-3xl flex gap-3.5 shadow-sm mb-4"
        >
          <div className="p-2.5 bg-theme-card rounded-xl text-rose-500 shadow-sm h-fit shrink-0">
            <AlertCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider badge-premium">Activation Rejected</span>
            <h4 className="text-xs font-black text-theme-primary mt-0.5">Your Upgrade Request Was Declined</h4>
            <p className="text-[11px] text-theme-muted font-semibold leading-relaxed mt-1">
              Reason: <strong className="text-rose-500">{rejectedReq.rejectionReason || 'Invalid payment details provided.'}</strong>
            </p>
            <button onClick={() => setRejectedReq(null)} className="mt-2 text-[10px] font-bold text-theme-primary underline underline-offset-2">Dismiss</button>
          </div>
        </motion.div>
      )}

      {activeRevenueTab === 'premium' && (<>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-stretch"
        >
          <motion.div variants={staggerItem} className="card-premium bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium flex flex-col justify-between relative overflow-hidden">
            {(!isPremium) && (
              <span className="badge-premium absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-theme-surface text-theme-muted px-2.5 py-0.5 rounded-full border border-theme-border-soft">
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
            <p className="text-[10px] text-theme-accent font-bold mt-3 text-center">Best for freelancers starting out</p>
          </motion.div>
   
          <motion.div variants={staggerItem} className="h-full">
            <ShineBorder
              duration={3}
              gradient="from-violet-600 via-fuchsia-500 to-amber-500"
              className="h-full"
            >
                <div className="bg-gradient-to-br from-white via-violet-50 to-white dark:from-slate-900 dark:via-violet-950 dark:to-slate-900 h-full text-theme-primary dark:text-white rounded-[calc(1.5rem-2px)] p-6 shadow-premium flex flex-col justify-between relative overflow-hidden card-premium">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
                {isPremium && (
                  <span className="badge-premium absolute top-4 right-4 z-20 text-[9px] font-extrabold uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-400/30 dark:border-white/20">
                    <Sparkles className="w-2.5 h-2.5" /> Active Plan
                  </span>
                )}
       
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-amber-600 dark:text-amber-400 text-sm uppercase tracking-wider">Premium Growth</h3>
                      <span className="badge-premium text-[8px] font-extrabold bg-amber-500/10 dark:bg-white/10 text-amber-600 dark:text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS Tier</span>
                    </div>
                    {!isPremium && (
                      <span className="badge-premium py-1 px-2.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1 shadow-sm">
                        <Flame size={12} /> Most Popular
                      </span>
                    )}
                  </div>
                
                  <div className="border-t border-b border-theme-border-soft dark:border-white/10 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">From</span>
                    </div>
                    <h4 className="text-3xl font-black text-theme-primary dark:text-white tracking-tight">
                      {formatCurrency(country === 'India' ? 499 : country === 'Bangladesh' ? 600 : 9, currencySymbol)}
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold"> / month</span>
                    </h4>
                    <p className="text-[9.5px] text-amber-600/70 dark:text-amber-300/70 font-medium mt-1">Or save more: <span className="text-amber-600 dark:text-amber-400 font-bold">{getPricing('Yearly').label}</span></p>
                  </div>
   
                  <ul className="space-y-3 text-xs font-semibold text-theme-primary/90 dark:text-white/90">
                    {premiumBenefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 group">
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-amber-500/30">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                          <span className="group-hover:text-theme-primary dark:group-hover:text-white transition-colors">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
       
                <div className="mt-8 pt-4 border-t border-theme-border-soft dark:border-white/10 relative z-10">
                  {isPremium ? (
                    <div className="w-full py-3.5 bg-theme-surface/80 dark:bg-white/10 border border-theme-border-soft dark:border-white/25 rounded-2xl text-center text-xs font-bold text-theme-primary dark:text-white flex flex-col gap-0.5 backdrop-blur-sm">
                      <span>Premium Plan Active</span>
                      <span className="text-[9px] font-medium text-theme-muted dark:text-white/70 font-mono">Expires: {getExpiryDateString()}</span>
                    </div>
                  ) : (
                    <button
                      disabled={!!pendingReq}
                      onClick={() => setShowUpgradeForm(true)}
                      className={`btn-premium w-full py-4 text-white rounded-2xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        pendingReq
                          ? 'bg-theme-card border border-theme-border-strong/50 text-theme-muted cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-600/25 hover:shadow-xl hover:shadow-amber-600/30 active:scale-[0.98]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{pendingReq ? 'Activation Request Pending' : 'Go Premium Now'}</span>
                    </button>
                  )}
                </div>
            <p className="text-[10px] text-amber-600 font-bold mt-3 text-center">Perfect for growing businesses</p>
              </div>
            </ShineBorder>
          </motion.div>
        </motion.div>

        {isPremium && (
          <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-theme-primary">Renewal Information</h3>
                <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Your subscription renewal details at a glance</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col items-center text-center">
                <CalendarDays className="w-5 h-5 text-theme-muted mb-2" />
                <p className="text-[10px] uppercase font-black text-theme-muted tracking-wider">Expires On</p>
                <p className="text-sm font-black text-theme-primary mt-1">{getExpiryDateString()}</p>
              </div>
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col items-center text-center">
                <Clock className="w-5 h-5 text-theme-muted mb-2" />
                <p className="text-[10px] uppercase font-black text-theme-muted tracking-wider">Days Remaining</p>
                <p className={`text-2xl font-black mt-1 tabular-nums ${daysRemaining <= 7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {daysRemaining !== null ? daysRemaining : 'N/A'}
                </p>
              </div>
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col items-center text-center">
                <RefreshCw className="w-5 h-5 text-theme-muted mb-2" />
                <p className="text-[10px] uppercase font-black text-theme-muted tracking-wider">Next Renewal</p>
                <p className="text-sm font-black text-theme-primary mt-1">{renewalDateStr || 'Auto-renew'}</p>
                <button onClick={() => { if (pendingReq) { toast('You already have a pending upgrade request.'); return; } setShowUpgradeForm(true); }} className="btn-premium mt-2 text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Extend Plan
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Pricing Calculator</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Compare Pay Per Bill vs Premium to see your savings</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-1.5">Monthly Bills</label>
              <input
                type="number"
                value={billCount}
                onChange={(e) => setBillCount(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                min={0}
                max={500}
                className="input-premium w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-3 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent"
              />
              <p className="text-[9px] text-theme-muted font-medium mt-1">Slide to your expected monthly volume</p>
            </div>
            <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black text-theme-muted tracking-wider">Pay Per Bill</p>
              <p className="text-2xl font-black text-theme-primary mt-1 tabular-nums">{currencySymbol}{payPerBillCost.toFixed(0)}</p>
              <p className="text-[9px] text-theme-muted font-medium mt-0.5">at {currencySymbol}{perBillRate}/invoice</p>
            </div>
            <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black text-theme-muted tracking-wider">Premium ({selectedPlan})</p>
              <p className="text-2xl font-black text-theme-primary mt-1 tabular-nums">{currencySymbol}{premiumPrice}</p>
              <p className="text-[9px] text-theme-muted font-medium mt-0.5">unlimited invoices</p>
            </div>
            <div className="stat-premium bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">You Save</p>
              <p className="text-2xl font-black text-emerald-500 mt-1 tabular-nums">{currencySymbol}{savings}</p>
              <p className="text-[9px] text-emerald-600/70 font-medium mt-0.5">{savings > 0 ? `${((savings / payPerBillCost) * 100).toFixed(0)}% cheaper with Premium` : 'Premium is cost-effective'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-theme-primary">Plan Comparison</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">See what each plan includes in detail</p>
            </div>
            <span className="badge-premium text-[9px] bg-theme-surface text-theme-muted border-theme-border-soft font-bold px-3 py-1">{planComparisonFeatures.length} features</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-premium w-full">
              <thead>
                <tr className="border-b border-theme-border-soft/60">
                  <th className="p-3 pl-0 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left">Feature</th>
                  <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-center">Free</th>
                  <th className="p-3 text-[10px] font-black text-theme-accent uppercase tracking-wider text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-soft/30">
                {planComparisonFeatures.map((feat, i) => (
                  <tr key={i} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="p-3 pl-0 text-xs text-theme-primary font-bold">{feat.name}</td>
                    <td className="p-3 text-xs text-center text-theme-muted font-semibold">{feat.free}</td>
                    <td className="p-3 text-xs text-center text-theme-primary font-semibold">{feat.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Why Upgrade to Premium?</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Unlock the full power of BillQyro for your business</p>
            </div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((bene, i) => {
              const BeneIcon = bene.icon;
              return (
                <motion.div key={i} variants={staggerItem} className="card-premium bg-theme-card p-5 rounded-2xl border border-theme-border-soft hover:border-theme-accent/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                    <BeneIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-theme-primary mb-1">{bene.title}</h4>
                  <p className="text-[11px] text-theme-muted font-semibold leading-relaxed">{bene.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {!isPremium && (
          <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-theme-accent-light text-theme-accent flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-theme-primary">Usage & Limits</h3>
                <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Your current free plan usage overview</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-theme-muted" /> Invoice Usage
                  </span>
                  <span className="text-[10px] font-bold text-theme-muted tabular-nums">
                    {Math.min(revenueState?.totalBillsCreated || 0, globalRevenueSettings?.freeBillLimit || businessSettings?.freeInvoiceLimit || 15)} / {globalRevenueSettings?.freeBillLimit || businessSettings?.freeInvoiceLimit || 15}
                  </span>
                </div>
                <div className="progress-premium">
                  <div
                    className="progress-premium-bar"
                    style={{ width: `${Math.min(100, ((revenueState?.totalBillsCreated || 0) / (globalRevenueSettings?.freeBillLimit || businessSettings?.freeInvoiceLimit || 15)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-theme-muted" /> Storage
                  </span>
                  <span className="text-[10px] font-bold text-theme-muted">Local Only</span>
                </div>
                <div className="progress-premium">
                  <div className="progress-premium-bar" style={{ width: '60%' }}></div>
                </div>
                <p className="text-[9px] text-theme-muted font-medium mt-1">Upgrade for cloud backup & sync</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-theme-muted" /> Premium Features
                  </span>
                  <span className="text-[10px] font-bold text-theme-muted">Locked</span>
                </div>
                <div className="progress-premium">
                  <div className="progress-premium-bar bg-theme-muted/30" style={{ width: '0%' }}></div>
                </div>
                <p className="text-[9px] text-theme-muted font-medium mt-1">Go Premium to unlock all features</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Billing History</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Your complete subscription payment records</p>
            </div>
          </div>
          {billingHistory.length === 0 ? (
            <PremiumEmptyState
              icon={Receipt}
              title="No billing history yet"
              description="Your premium payment records will appear here once you make your first upgrade"
              className="min-h-[200px]"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium w-full">
                <thead>
                  <tr className="border-b border-theme-border-soft/60">
                    <th className="p-3 pl-0 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left">Date</th>
                    <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left">Plan</th>
                    <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left">Amount</th>
                    <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left">Method</th>
                    <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-left hidden sm:table-cell">Transaction ID</th>
                    <th className="p-3 text-[10px] font-black text-theme-muted uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border-soft/30">
                  {billingHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-theme-surface/50 transition-colors">
                      <td className="p-3 pl-0 text-xs text-theme-primary font-semibold whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-3 text-xs text-theme-primary font-bold">{entry.plan}</td>
                      <td className="p-3 text-xs text-theme-primary font-black tabular-nums">{entry.currency}{entry.amount}</td>
                      <td className="p-3 text-xs text-theme-muted font-semibold">{entry.method}</td>
                      <td className="p-3 text-xs text-theme-muted font-mono font-semibold hidden sm:table-cell">{entry.transactionId}</td>
                      <td className="p-3 text-center">
                        <span className={`badge-premium text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          entry.status === 'Approved'
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                            : entry.status === 'Rejected'
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/20'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Trust & Security</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trustBadges.map((badge, i) => {
              const BadgeIcon = badge.icon;
              return (
                <motion.div key={i} variants={staggerItem} className="card-premium bg-theme-card p-5 rounded-2xl border border-theme-border-soft flex flex-col items-center text-center hover:border-emerald-500/30 transition-all group">
                  <div className="w-11 h-11 rounded-2xl bg-theme-surface flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <BadgeIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-theme-primary">{badge.title}</p>
                  <p className="text-[10px] text-theme-muted font-semibold mt-1">{badge.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* MONTHLY SAVINGS CALCULATOR */}
        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Monthly Savings Calculator</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">See how much you save with Premium vs Pay Per Bill</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Bills per Month</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={billCount}
                  onChange={(e) => setBillCount(parseInt(e.target.value))}
                  className="input-premium flex-1 accent-theme-accent"
                />
                <span className="stat-premium !p-2 min-w-[60px] text-center text-lg font-black text-theme-primary tabular-nums">{billCount}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-premium !p-4 text-center">
                <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Pay Per Bill</p>
                <p className="text-xl font-black text-rose-500 tabular-nums">{currencySymbol}{(payPerBillCost).toFixed(0)}</p>
                <p className="text-[9px] text-theme-muted font-medium mt-1">{currencySymbol}{perBillRate} per bill</p>
              </div>
              <div className="stat-premium !p-4 text-center border-theme-accent/30">
                <p className="text-2xs font-bold text-theme-accent uppercase tracking-premium-wide mb-1">Premium Cost</p>
                <p className="text-xl font-black text-theme-primary tabular-nums">{currencySymbol}{premiumPrice}</p>
                <p className="text-[9px] text-theme-muted font-medium mt-1">per month</p>
              </div>
              <div className="stat-premium !p-4 text-center bg-emerald-500/5 border-emerald-500/20">
                <p className="text-2xs font-bold text-emerald-600 uppercase tracking-premium-wide mb-1">You Save</p>
                <p className="text-xl font-black text-emerald-600 tabular-nums">{currencySymbol}{savings.toFixed(0)}</p>
                <p className="text-[9px] text-emerald-600/70 font-medium mt-1">{savings > 0 ? `${Math.round((savings / payPerBillCost) * 100)}% less` : 'Equal cost'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="card-premium bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-theme-accent-light text-theme-accent flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-theme-primary">Frequently Asked Questions</h3>
              <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Everything you need to know about billing & upgrading</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="accordion-premium border border-theme-border-soft rounded-2xl overflow-hidden bg-theme-surface/30"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`accordion-premium-header w-full flex items-center justify-between p-4 text-xs font-black text-theme-primary transition-all duration-200 cursor-pointer rounded-2xl ${
                    openFaq === i
                      ? 'bg-theme-accent-light/30 text-theme-accent'
                      : 'bg-theme-surface/50 hover:bg-theme-surface'
                  }`}
                >
                  <span className="flex items-center gap-3 text-left pr-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                      openFaq === i
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm'
                        : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
                    }`}>
                      <HelpCircle className="w-3 h-3" />
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                    openFaq === i ? 'rotate-180 text-theme-accent' : 'text-theme-muted'
                  }`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1">
                        <div className="w-6 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-3"></div>
                        <p className="text-[11px] text-theme-muted font-semibold leading-relaxed pl-9">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </>
      )}

      {activeRevenueTab === 'dues' && revenueState && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6 mt-6"
        >
          <motion.div variants={staggerItem} className="card-premium bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
            <h3 className="section-header text-lg font-black text-theme-primary mb-4">Platform Usage & Dues</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Bills Created</span>
                <span className="text-2xl font-black text-theme-primary mt-1 tabular-nums">
                  {revenueState.totalBillsCreated}
                </span>
              </div>
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Free Bills Left</span>
                <span className="text-2xl font-black text-theme-primary mt-1 tabular-nums">
                  {Math.max(0, (globalRevenueSettings?.freeBillLimit || 10) - revenueState.totalBillsCreated)}
                </span>
              </div>
              <div className="stat-premium bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 flex flex-col">
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Platform Due</span>
                <span className="text-2xl font-black text-rose-500 mt-1 tabular-nums">
                  ₹{revenueState.platformPendingAmount}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-theme-surface border border-theme-border-soft/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-xs text-theme-muted font-bold uppercase tracking-wider block">Lock Status</span>
                <span className={`badge-premium text-xs font-black px-2.5 py-0.5 rounded-lg border mt-1 inline-block ${
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
          </motion.div>

          {revenueState.platformPendingAmount > 0 && (
            <motion.div variants={staggerItem} className="card-premium bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
              <h3 className="section-header text-lg font-black text-theme-primary mb-4">Submit Platform Payment Proof</h3>
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
                    placeholder={`e.g. Cleared my ₹${revenueState.platformPendingAmount} due`}
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
                  className="btn-premium w-full h-[48px] bg-theme-accent hover:opacity-90 text-white font-extrabold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {submittingPlatformProof ? 'Submitting...' : 'Submit Proof Details'}
                </button>
              </form>
            </motion.div>
          )}

          <motion.div variants={staggerItem} className="card-premium bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
            <h3 className="section-header text-lg font-black text-theme-primary mb-4">Dues Payment History</h3>
            {platformProofs.length === 0 ? (
              <PremiumEmptyState
                icon={Upload}
                title="No payment proofs yet"
                description="Submit your first platform payment proof to record your dues payment history"
                className="min-h-[200px]"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformProofs.map((proof) => (
                  <div key={proof.id} className="bg-theme-surface rounded-2xl p-4 border border-theme-border-soft/60 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-black text-theme-primary">₹{proof.amount}</span>
                        <span className={`badge-premium text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
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
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {showUpgradeForm && activeRevenueTab === 'premium' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card-premium bg-theme-card border border-theme-border-soft rounded-3xl p-6 md:p-8 shadow-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
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
              
              <div className="space-y-4 bg-theme-surface p-5 rounded-2xl border border-theme-border-soft">
                <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider badge-premium">Step 1: Transfer Payment</span>
                <h4 className="text-xs font-black text-theme-primary">Send Transfer Amount to Administrator</h4>
                
                <div className="text-[11px] text-theme-muted leading-relaxed font-semibold space-y-3.5 border-t border-theme-border-soft/50 pt-3">
                  
                  {country === 'India' && (
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">Scan UPI QR Code</span>
                        <div className="mt-1">
                          <DynamicQRCode value={'upi://pay?pa=billqyro@okaxis&pn=BillQyro%20SaaS&am=' + activePricing.amount + '&cu=INR&tn=SaaS%20Upgrade'} size={112} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">UPI Address</span>
                          <span className="font-mono text-theme-accent font-extrabold select-all break-all">{globalRevenueSettings?.upiId || 'billqyro@okaxis'}</span>
                        </div>
                        <div className="pt-1.5 border-t border-theme-border-soft/40">
                          <span className="text-[9px] text-theme-muted uppercase font-black tracking-wide block">Direct Bank Transfer</span>
                          <span className="block text-theme-primary font-bold">{globalRevenueSettings?.bankName || 'HDFC Bank'} | A/C: {globalRevenueSettings?.bankAccountNumber || '50200012345678'}</span>
                          <span className="block font-mono text-[10px]">IFSC: {globalRevenueSettings?.bankIfsc || 'HDFC0000123'}</span>
                          <span className="block text-[9.5px]">Name: {globalRevenueSettings?.bankAccountName || 'BillQyro Invoicing SaaS'}</span>
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

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider block badge-premium">Step 2: Submit Proof Details</span>
                <h4 className="text-xs font-black text-theme-primary">Provide Payment Verification Details</h4>
                
                <div>
                  <label className="block mb-1 text-theme-muted text-[9px] uppercase tracking-wide">Selected Capacity Tier</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-theme-surface text-theme-primary border border-theme-border-soft rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-theme-accent cursor-pointer"
                  >
                    <option value="Monthly">Monthly growth plan</option>
                    <option value="Quarterly">Quarterly business plan</option>
                    <option value="Yearly">Yearly corporate plan</option>
                    <option value="Lifetime">Lifetime access</option>
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
                  className="btn-premium w-full py-3.5 bg-theme-accent text-white hover:opacity-90 rounded-2xl font-black uppercase tracking-wider shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Subscription;
