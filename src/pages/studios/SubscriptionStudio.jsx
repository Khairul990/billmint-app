import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Sparkles, CheckCircle2, TrendingUp, Download, Receipt, AlertTriangle, 
  Settings, Check, X, CreditCard, Building, Building2, Phone, Mail, 
  MessageSquare, Zap, Shield, FileText, Cloud, Clock, Upload, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Label } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Progress, ProgressRing } from '../../components/ui/Progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import DynamicQRCode from '../DynamicQRCode';

import { authEngine } from '../../services/authEngine';
import { paymentEngine } from '../../services/paymentEngine';
import { subscriptionEngine } from '../../services/subscriptionEngine';
import { adminEngine } from '../../services/adminEngine';
import { db, firebaseReady } from '../../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// ----------------------------------------------------------------------
// DATA MOCKS & DYNAMIC GENERATORS
// ----------------------------------------------------------------------
const getPricingPlans = (settings, currentPlanId) => [
  { id: 'free', name: 'Free', price: '₹0', interval: 'forever', features: ['15 Invoices/mo', 'Basic Templates', 'Offline Mode'], isCurrent: currentPlanId === 'free' || !currentPlanId },
  { id: 'Monthly', name: 'Monthly', price: `₹${settings?.priceMonthly || 499}`, interval: 'per month', features: ['Unlimited Invoices', 'Premium Templates', 'Priority Support', 'Remove Branding'], isCurrent: currentPlanId === 'Monthly' || currentPlanId === 'premium' },
  { id: 'Quarterly', name: 'Quarterly', price: `₹${settings?.priceQuarterly || 1299}`, interval: 'per quarter', features: ['Everything in Monthly', 'Save more'], isCurrent: currentPlanId === 'Quarterly' },
  { id: 'Yearly', name: 'Yearly', price: `₹${settings?.priceYearly || 4999}`, interval: 'per year', features: ['Everything in Quarterly', 'Team Access (5 users)', 'API Access'], isCurrent: currentPlanId === 'Yearly' },
  { id: 'Lifetime', name: 'Lifetime', price: `₹${settings?.priceLifetime || 14999}`, interval: 'one time', features: ['Pay once, use forever', 'Free updates for life', 'Dedicated Manager'], isCurrent: currentPlanId === 'Lifetime' },
];

const FEATURES_COMPARISON = [
  { name: 'Monthly Invoices', free: '15', monthly: 'Unlimited', yearly: 'Unlimited', lifetime: 'Unlimited' },
  { name: 'Customers', free: '5', monthly: 'Unlimited', yearly: 'Unlimited', lifetime: 'Unlimited' },
  { name: 'Remove Branding', free: false, monthly: true, yearly: true, lifetime: true },
  { name: 'Cloud Sync', free: false, monthly: true, yearly: true, lifetime: true },
  { name: 'API Access', free: false, monthly: false, yearly: true, lifetime: true },
];

// ----------------------------------------------------------------------
// SECTIONS
// ----------------------------------------------------------------------

const Section1PremiumHero = memo(({ currentPlanId, nextRenewal }) => (
  <div className="relative overflow-hidden rounded-3xl bg-theme-surface border border-theme-border-soft p-8 md:p-12 shadow-glass group mb-8">
    <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/10 via-theme-accent/5 to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/10 rounded-full blur-[80px] group-hover:bg-theme-accent/20 transition-colors pointer-events-none" />
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <Badge variant={currentPlanId !== 'free' && currentPlanId ? 'solid' : 'outline'} className="mb-4">
          <Sparkles className="w-3 h-3 mr-1" /> {currentPlanId !== 'free' && currentPlanId ? 'Active Subscription' : 'Free Plan Active'}
        </Badge>
        <h2 className="text-4xl md:text-5xl font-black text-theme-primary mb-2 tracking-tight capitalize">
          {currentPlanId === 'free' || !currentPlanId ? 'Free Plan' : `${currentPlanId} Plan`}
        </h2>
        <p className="text-sm text-theme-secondary font-medium max-w-md">
          {currentPlanId !== 'free' && currentPlanId
            ? 'You are on a premium plan, enabling unlimited invoices, premium templates, and priority support.'
            : 'You are on the Free plan. Upgrade to unlock unlimited invoices and cloud sync.'}
        </p>
      </div>
      {currentPlanId !== 'free' && currentPlanId && nextRenewal && (
        <div className="text-left md:text-right">
          <p className="text-xs text-theme-muted font-bold uppercase tracking-wider mb-1">Next Renewal</p>
          <p className="text-2xl font-black text-theme-primary mb-1">{nextRenewal}</p>
        </div>
      )}
    </div>
  </div>
));

const Section2UsageAnalytics = memo(({ invoicesUsed, limit }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={Math.min(100, (invoicesUsed / limit) * 100)} max={100} size={100} strokeWidth={6} label={`${Math.min(100, (invoicesUsed / limit) * 100).toFixed(0)}%`} sublabel="Invoices" />
      <p className="text-xs text-theme-secondary mt-4">{invoicesUsed} / {limit} Used</p>
    </Card>
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={45} max={100} size={100} strokeWidth={6} label="4.5GB" sublabel="Storage" />
      <p className="text-xs text-theme-secondary mt-4">4.5 / 10 GB Used</p>
    </Card>
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={12} max={100} size={100} strokeWidth={6} label="12%" sublabel="API Calls" />
      <p className="text-xs text-theme-secondary mt-4">1.2k / 10k Used</p>
    </Card>
    <Card className="flex flex-col justify-center p-6 hover:scale-[1.02] transition-transform relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16 text-theme-accent" /></div>
      <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Cloud Sync</h3>
      <p className="text-2xl font-black text-theme-primary mb-1">99.9%</p>
      <p className="text-[10px] text-theme-success font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> System Healthy
      </p>
      <div className="mt-4"><Progress value={99.9} /></div>
    </Card>
  </div>
));

const Section3PricingCards = memo(({ plans, onUpgradeClick }) => (
  <div className="mb-16">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-black text-theme-primary mb-2">Flexible Plans for Every Business</h2>
      <p className="text-xs text-theme-secondary">Choose the perfect plan to scale your invoicing workflow.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 auto-rows-fr">
      {plans.map((plan) => (
        <Card key={plan.id} className={`flex flex-col h-full group hover:-translate-y-2 transition-transform duration-300 relative ${plan.isCurrent ? 'border-theme-accent ring-1 ring-theme-accent shadow-[0_0_20px_var(--accent)]' : ''}`}>
          {plan.isCurrent && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-theme-accent text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md z-10 whitespace-nowrap">
              Current Plan
            </div>
          )}
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[40px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <CardHeader className="text-center border-b-0 pb-2">
            <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
            <div className="flex items-end justify-center gap-1 mt-4">
              <span className="text-2xl font-black text-theme-primary">{plan.price}</span>
              <span className="text-[10px] text-theme-secondary font-bold uppercase mb-1.5 tracking-wider">/{plan.interval}</span>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col pt-4">
            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-theme-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-theme-success" />
                  </div>
                  <span className="text-xs font-bold text-theme-secondary">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              variant={plan.isCurrent ? 'outline' : 'primary'} 
              className="w-full mt-auto"
              onClick={() => !plan.isCurrent && onUpgradeClick(plan)}
              disabled={plan.isCurrent}
            >
              {plan.isCurrent ? 'Current Plan' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

const Section4FeatureComparison = memo(() => (
  <div className="mb-16">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-black text-theme-primary mb-2">Compare Features</h2>
      <p className="text-xs text-theme-secondary">A detailed breakdown of everything included.</p>
    </div>
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead className="text-center">Free</TableHead>
            <TableHead className="text-center">Monthly</TableHead>
            <TableHead className="text-center">Yearly</TableHead>
            <TableHead className="text-center">Lifetime</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES_COMPARISON.map((feature, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-bold">{feature.name}</TableCell>
              {['free', 'monthly', 'yearly', 'lifetime'].map((plan) => (
                <TableCell key={plan} className="text-center">
                  {typeof feature[plan] === 'boolean' ? (
                    feature[plan] ? (
                      <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-theme-muted mx-auto" />
                    )
                  ) : (
                    <span className="text-xs font-bold text-theme-secondary">{feature[plan]}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
));

const Section5PaymentHistory = memo(({ history }) => (
  <Card className="mb-12">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and download your previous billing receipts.</CardDescription>
        </div>
        <Button variant="outline" size="sm" leftIcon={Download}>Export All</Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0 p-0 sm:p-6">
      <div className="divide-y divide-theme-border-soft">
        {history.length === 0 ? (
          <p className="text-xs text-theme-muted p-4 text-center">No payment history found.</p>
        ) : history.map((payment) => (
          <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-0 sm:py-4 gap-4 hover:bg-theme-surface-hover transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${payment.status === 'Approved' ? 'bg-theme-success/10 text-theme-success' : payment.status === 'Rejected' ? 'bg-theme-danger/10 text-theme-danger' : 'bg-theme-warning/10 text-theme-warning'}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-theme-primary">{payment.plan} ({payment.paymentMethod})</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-theme-secondary font-mono">{payment.transactionId}</span>
                  <span className="text-[10px] text-theme-muted">•</span>
                  <span className="text-[10px] text-theme-secondary">{new Date(payment.createdAt || payment.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-sm font-black text-theme-primary">₹{payment.amount || payment.paidAmount}</p>
                <Badge variant={payment.status === 'Approved' ? 'success' : payment.status === 'Rejected' ? 'danger' : 'warning'} className="mt-1">{payment.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

const Section7UpgradeJourney = memo(({ pendingReq, rejectedReq, currentPlanId }) => {
  let step = 1;
  let done = [false, false, false, false];
  
  if (currentPlanId && currentPlanId !== 'free') {
    step = 4;
    done = [true, true, true, true];
  } else if (pendingReq) {
    step = 3;
    done = [true, true, false, false];
  } else if (rejectedReq) {
    step = 2;
    done = [true, false, false, false];
  }

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-theme-primary mb-2">Upgrade Journey</h2>
        <p className="text-xs text-theme-secondary">How our seamless enterprise onboarding works.</p>
      </div>
      
      {pendingReq && (
        <div className="mb-8 p-5 bg-theme-warning/10 border border-theme-warning/30 rounded-2xl flex items-center gap-4">
          <Clock className="w-8 h-8 text-theme-warning shrink-0" />
          <div>
            <h4 className="text-sm font-black text-theme-primary">Upgrade Request Under Review</h4>
            <p className="text-xs text-theme-secondary mt-1">
              Your request for <strong>{pendingReq.plan}</strong> with Transaction ID <strong className="font-mono">{pendingReq.transactionId}</strong> is being verified. 
            </p>
          </div>
        </div>
      )}

      {rejectedReq && !pendingReq && (
        <div className="mb-8 p-5 bg-theme-danger/10 border border-theme-danger/30 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-theme-danger shrink-0" />
          <div>
            <h4 className="text-sm font-black text-theme-primary">Upgrade Request Rejected</h4>
            <p className="text-xs text-theme-secondary mt-1">
              Reason: <strong>{rejectedReq.rejectionReason || 'Invalid details'}</strong>
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-theme-border-soft -translate-y-1/2 z-0" />
        {[ 
          { s: 1, label: 'Choose Plan', active: step >= 1, done: done[0] },
          { s: 2, label: 'Payment', active: step >= 2, done: done[1] },
          { s: 3, label: 'Verification', active: step >= 3, done: done[2] },
          { s: 4, label: 'Activated', active: step >= 4, done: done[3] }
        ].map((item, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
              item.done ? 'bg-theme-success text-white shadow-[0_0_15px_var(--success)]' 
              : item.active ? 'bg-theme-accent text-white shadow-[0_0_15px_var(--accent)] ring-4 ring-theme-accent/20' 
              : 'bg-theme-surface border-2 border-theme-border-soft text-theme-muted'
            }`}>
              {item.done ? <Check className="w-4 h-4" /> : item.s}
            </div>
            <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${item.active ? 'text-theme-primary' : 'text-theme-muted'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// (Other pure UI sections removed for brevity or kept identical)
const Section8PremiumBenefits = memo(() => (
  <div className="mb-16">
    <h2 className="text-2xl font-black text-theme-primary mb-6">Enterprise Benefits</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: Shield, title: 'Bank-grade Security', desc: 'End-to-end encryption' },
        { icon: Zap, title: 'Priority Support', desc: '24/7 dedicated manager' },
        { icon: Cloud, title: 'Cloud Sync', desc: 'Real-time multi-device' },
        { icon: FileText, title: 'Premium PDFs', desc: 'Custom branding & fonts' },
      ].map((benefit, idx) => (
        <Card key={idx} className="p-6 text-center hover:-translate-y-1 transition-transform group border-transparent bg-gradient-to-br from-theme-surface to-theme-surface-hover">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-theme-accent/10 flex items-center justify-center mb-4 group-hover:bg-theme-accent/20 transition-colors">
            <benefit.icon className="w-6 h-6 text-theme-accent" />
          </div>
          <h3 className="text-xs font-black text-theme-primary mb-1">{benefit.title}</h3>
          <p className="text-[10px] text-theme-secondary">{benefit.desc}</p>
        </Card>
      ))}
    </div>
  </div>
));


const SubscriptionStudio = ({ settings, onUpdate }) => {
  const [globalRevenueSettings, setGlobalRevenueSettings] = useState(null);
  const [pendingReq, setPendingReq] = useState(null);
  const [rejectedReq, setRejectedReq] = useState(null);
  const [platformProofs, setPlatformProofs] = useState([]);
  const [revenueState, setRevenueState] = useState(null);
  
  // Form Modal State
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Monthly');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPlanId = settings?.planStatus || settings?.plan || 'free';
  const plans = getPricingPlans(globalRevenueSettings, currentPlanId);

  useEffect(() => {
    fetchPlatformRevenue();
    fetchPendingRequest();
  }, [settings]);

  const fetchPlatformRevenue = async () => {
    const userId = authEngine.getRealUserId() || 'local-user';
    const grs = await adminEngine.getRevenueSettings();
    setGlobalRevenueSettings(grs);
    
    const localInvoices = JSON.parse(localStorage.getItem(`billqyro_invoices_${userId}`) || '[]');
    const state = await paymentEngine.getUserRevenueState(userId, localInvoices, { plan: currentPlanId });
    setRevenueState(state);
    
    // Fetch all premium requests as history
    if (firebaseReady) {
      try {
        const q = query(collection(db, 'premiumRequests'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlatformProofs(docs.sort((a,b) => b.createdAt - a.createdAt));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchPendingRequest = async () => {
    if (!firebaseReady) return;
    const userId = authEngine.getRealUserId();
    if (!userId) return;
    
    try {
      const q = query(collection(db, 'premiumRequests'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => d.data());
      const pending = docs.find(d => d.status === 'Pending');
      const rejected = docs.find(d => d.status === 'Rejected');
      
      setPendingReq(pending || null);
      setRejectedReq(rejected || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgradeClick = (plan) => {
    if (pendingReq) {
      toast('You already have a pending upgrade request.');
      return;
    }
    setSelectedPlan(plan.id);
    const numericPrice = parseFloat(plan.price.replace(/[^0-9.]/g, ''));
    setPaidAmount(numericPrice ? numericPrice.toString() : '');
    setShowUpgradeForm(true);
  };

  const handleScreenshotChange = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotBase64(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim() || transactionId.length < 5) {
      toast.error('Please enter a valid Transaction ID.');
      return;
    }
    setLoading(true);
    try {
      await subscriptionEngine.submitPremiumRequest(
        selectedPlan, 
        parseFloat(paidAmount) || 0, 
        paymentMethod, 
        transactionId, 
        screenshotBase64
      );
      toast.success('Premium activation request submitted! Pending admin verification.');
      setShowUpgradeForm(false);
      fetchPendingRequest();
      fetchPlatformRevenue();
    } catch (error) {
      toast.error(error.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const invoicesLimit = globalRevenueSettings?.freeBillLimit || settings?.freeInvoiceLimit || 15;
  const invoicesUsed = revenueState?.totalBillsCreated || 0;

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      <Section1PremiumHero currentPlanId={currentPlanId} nextRenewal={settings?.expiresAt ? new Date(settings.expiresAt).toLocaleDateString() : null} />
      <Section2UsageAnalytics invoicesUsed={invoicesUsed} limit={invoicesLimit} />
      <Section3PricingCards plans={plans} onUpgradeClick={handleUpgradeClick} />
      <Section4FeatureComparison />
      <Section5PaymentHistory history={platformProofs} />
      <Section7UpgradeJourney pendingReq={pendingReq} rejectedReq={rejectedReq} currentPlanId={currentPlanId} />
      <Section8PremiumBenefits />

      {/* Upgrade Modal Form */}
      <AnimatePresence>
        {showUpgradeForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 md:p-8 shadow-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-theme-border-soft pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent-light text-theme-accent flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-theme-primary">Manual Premium Upgrade</h3>
                    <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Follow steps to unlock Premium</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowUpgradeForm(false)} className="p-1.5 text-theme-muted hover:text-theme-primary bg-theme-surface rounded-lg">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Instructions */}
                <div className="space-y-4 bg-theme-surface p-5 rounded-2xl border border-theme-border-soft">
                  <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider bg-theme-accent/10 px-2 py-1 rounded-full border border-theme-accent/20">Step 1: Transfer Payment</span>
                  <h4 className="text-xs font-black text-theme-primary mt-2">Send Amount to Administrator</h4>
                  
                  <div className="text-[11px] text-theme-muted leading-relaxed font-semibold space-y-3.5 border-t border-theme-border-soft/50 pt-3">
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-[8.5px] uppercase tracking-wider block text-theme-muted">Scan UPI QR Code</span>
                        <div className="mt-1">
                          <DynamicQRCode value={`upi://pay?pa=${globalRevenueSettings?.upiId || 'billqyro@okaxis'}&pn=BillQyro&am=${paidAmount}&cu=INR`} size={112} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[9px] text-theme-muted uppercase font-black block">UPI ID</span>
                          <span className="font-mono text-theme-accent font-extrabold select-all">{globalRevenueSettings?.upiId || 'billqyro@okaxis'}</span>
                        </div>
                        <div className="pt-1.5 border-t border-theme-border-soft/40">
                          <span className="text-[9px] text-theme-muted uppercase font-black block">Direct Bank Transfer</span>
                          <span className="block text-theme-primary font-bold">{globalRevenueSettings?.bankName || 'HDFC Bank'} | A/C: {globalRevenueSettings?.bankAccountNumber || '50200012345678'}</span>
                          <span className="block font-mono text-[10px]">IFSC: {globalRevenueSettings?.bankIfsc || 'HDFC0000123'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <span className="text-[9px] font-black uppercase text-theme-accent tracking-wider bg-theme-accent/10 px-2 py-1 rounded-full border border-theme-accent/20">Step 2: Submit Proof</span>
                  <h4 className="text-xs font-black text-theme-primary mt-2">Provide Verification Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <Label className="text-[9px] uppercase">Plan</Label>
                      <Input value={selectedPlan} disabled className="font-bold bg-theme-surface" />
                    </div>
                    <div>
                      <Label className="text-[9px] uppercase">Amount</Label>
                      <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[9px] uppercase">Payment Method</Label>
                    <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="bKash">bKash</option>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[9px] uppercase">Transaction / Ref ID</Label>
                    <Input type="text" placeholder="12-digit UTR/Ref" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
                  </div>

                  <div>
                    <Label className="text-[9px] uppercase">Screenshot (Optional)</Label>
                    <div
                      className={`relative border border-theme-border-soft border-dashed rounded-xl py-5 px-3 text-center cursor-pointer transition-all bg-theme-surface ${isDragging ? 'border-theme-accent bg-theme-accent/5' : 'hover:border-theme-accent'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleScreenshotChange(e.dataTransfer.files[0]); }}
                    >
                      <input type="file" accept="image/*" onChange={(e) => handleScreenshotChange(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <Upload className="w-4 h-4 text-theme-muted mx-auto mb-1" />
                      <span className="text-[10px] text-theme-muted">Upload screenshot</span>
                    </div>
                    {screenshotBase64 && (
                      <div className="mt-2 flex items-center gap-2 bg-theme-surface border border-theme-border-soft rounded-lg p-2 relative">
                        <img src={screenshotBase64} alt="Proof" className="w-8 h-8 object-cover rounded" />
                        <span className="text-[10px] truncate max-w-xs text-theme-primary font-bold">proof.png</span>
                        <button type="button" onClick={() => setScreenshotBase64('')} className="absolute right-2 text-rose-500 font-bold z-20">✕</button>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} variant="primary" className="w-full h-[44px] shadow-glass" leftIcon={loading ? null : Shield}>
                    {loading ? 'Submitting...' : 'Submit Activation Request'}
                  </Button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionStudio;
