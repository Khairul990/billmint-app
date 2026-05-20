import React, { useState } from 'react';
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
  Palette
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

const Subscription = ({ currentSubscription, onUpgrade, businessSettings }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const currencySymbol = businessSettings?.currency || '₹';
  const isPremium = currentSubscription?.status === 'premium';

  const freeBenefits = [
    'Create up to 5 invoices only',
    'Standard basic PDF template',
    'Contains BillMint branding watermark',
    'Standard local offline dashboard',
  ];

  const premiumBenefits = [
    'Unlimited invoice generation',
    'Premium detailed invoice templates',
    'Remove BillMint watermarks & branding',
    'Upload custom corporate logos',
    'Modify branding invoice colors',
    'Advanced operating expenses tracking',
    'Direct WhatsApp due reminder panel',
    'Dedicated Cloud Backup Sync',
  ];

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !expiry || !cvv) {
      alert('Please fill out all billing information fields.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onUpgrade('premium');
      setLoading(false);
      setShowCheckout(false);
      alert('Congratulations! Your account has been upgraded to BillMint Premium!');
    }, 1500);
  };

  const handleDowngrade = () => {
    if (confirm('Are you sure you want to cancel your Premium Plan and revert to Free tier? Your settings and templates will be restricted.')) {
      onUpgrade('free');
      alert('Your subscription has been reverted to the Free plan.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          Billing & Plans
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
          Select Your Workspace Capacity
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-semibold max-w-md mx-auto">
          Scale your invoicing with real vector PDF compilers, automatic SO counters, and personalized company templates.
        </p>
      </div>

      {/* DUAL PLAN CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-stretch">
        
        {/* FREE TIER CARD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium flex flex-col justify-between relative overflow-hidden">
          {(!isPremium) && (
            <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              Active Plan
            </span>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider">Free Starter</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">BASIC TRANSITION BILLING</p>
            </div>
            
            <div className="border-t border-b border-slate-50 py-4">
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">
                {formatCurrency(0, currencySymbol)}
                <span className="text-xs text-slate-400 font-bold"> / lifetime</span>
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              {freeBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-50">
            <button
              disabled={!isPremium}
              onClick={handleDowngrade}
              className={`w-full py-3.5 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                !isPremium 
                  ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-default' 
                  : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              {!isPremium ? 'Currently Active Starter' : 'Downgrade to Starter'}
            </button>
          </div>
        </div>

        {/* PREMIUM MEMBERSHIP CARD */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-6 shadow-premium flex flex-col justify-between relative overflow-hidden border border-indigo-950/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          {isPremium && (
            <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Active Plan
            </span>
          )}

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-indigo-300 text-sm uppercase tracking-wider">Premium Growth</h3>
              <span className="text-[8px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS Tier</span>
            </div>
            
            <div className="border-t border-b border-white/5 py-4">
              <h4 className="text-3xl font-black text-white tracking-tight">
                {formatCurrency(499, currencySymbol)}
                <span className="text-xs text-indigo-200 font-bold"> / month</span>
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs font-semibold text-indigo-100/90">
              {premiumBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 relative z-10">
            {isPremium ? (
              <div className="w-full py-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl text-center text-xs font-bold text-indigo-300">
                Premium Plan Active
              </div>
            ) : (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Go Premium Now</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SIMULATED CHECKOUT PANEL */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-premium max-w-md mx-auto space-y-6 mt-8"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mt-3">Secure Invoicing Gateway</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SECURE AES-256 CHECKOUT</p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs font-semibold text-slate-500">
              
              <div>
                <label className="block mb-1 text-slate-400">Cardholder Full Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Credit Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => {
                    // Auto-format card numbers
                    const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g);
                    setCardNumber(val ? val.join(' ') : '');
                  }}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-400">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength="5"
                    value={expiry}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setExpiry(val.length >= 2 ? val.slice(0,2) + '/' + val.slice(2,4) : val);
                    }}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">CVV / Security Code</label>
                  <input
                    type="password"
                    required
                    maxLength="3"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold text-center tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 bg-gradient-to-r from-slate-900 to-indigo-950 hover:to-indigo-900 text-white rounded-2xl font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Pay {formatCurrency(499, currencySymbol)} & Activate</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Subscription;
