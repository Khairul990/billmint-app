import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, Crown, Sparkles, Copy, Send, CheckCircle, Clock,
  QrCode, Smartphone, ShieldCheck, Loader2, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { adminEngine } from '../services/adminEngine';
import { subscriptionEngine } from '../services/subscriptionEngine';
import AnimatedPage from '../components/AnimatedPage';

/**
 * Upgrade Center — Pro subscription plans.
 * UPI-first manual flow: pick a plan → pay via UPI (QR / app link) →
 * submit the transaction reference + screenshot → the owner approves it
 * from the admin panel (/km-admin → Payments) and the premium status
 * activates with the plan's validity.
 */
const UpgradeCenter = ({ subscription, revenueStatus, businessSettings, setCurrentTab }) => {
  const [gs, setGs] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPremium = subscription?.planStatus === 'premium' ||
    subscription?.status === 'premium' ||
    (subscription?.planId && !['free'].includes(String(subscription.planId).toLowerCase()));

  useEffect(() => {
    (async () => {
      try {
        const settings = await adminEngine.getGlobalRevenueSettings();
        setGs(settings || {});
      } catch (e) {
        setGs({});
      }
    })();
  }, []);

  const plans = [
    { id: 'Monthly', label: 'Monthly', price: gs?.priceMonthly ?? 499, days: '30 days', tag: null },
    { id: 'Quarterly', label: 'Quarterly', price: gs?.priceQuarterly ?? 1299, days: '90 days', tag: null },
    { id: 'Yearly', label: 'Yearly', price: gs?.priceYearly ?? 4999, days: '12 months', tag: 'Best Value' },
    { id: 'Lifetime', label: 'Lifetime', price: gs?.priceLifetime ?? 14999, days: 'Forever', tag: 'One Time' }
  ];

  const upiId = gs?.upiId || '9903591839@ybl';
  const payeeName = gs?.bankAccountName || 'BillQyro Technologies';

  const upiLinkFor = (plan) =>
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent('BillQyro Pro ' + plan.label)}`;

  useEffect(() => {
    if (!selectedPlan) { setQrDataUrl(''); return; }
    QRCode.toDataURL(upiLinkFor(selectedPlan), { width: 220, margin: 1, color: { dark: '#1F1B1D', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan?.id, upiId]);

  const handleScreenshot = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image'); return; }
    const r = new FileReader();
    r.onload = () => {
      // Compress like the expense receipts — keep the payload small
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 900;
          const scale = Math.min(1, maxW / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          setScreenshotBase64(c.toDataURL('image/jpeg', 0.6));
          toast.success('Payment screenshot attached');
        } catch (err) { setScreenshotBase64(r.result); }
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utr.trim()) return toast.error('Enter the UPI Transaction Reference (UTR) from your payment app');
    if (!screenshotBase64) return toast.error('Attach the payment screenshot');
    setSubmitting(true);
    try {
      await subscriptionEngine.submitPremiumRequest(
        selectedPlan.id, selectedPlan.price, 'UPI', utr.trim(), screenshotBase64
      );
      setSubmitted(true);
      toast.success('Upgrade request submitted! The owner will verify it shortly.');
    } catch (err) {
      toast.error(err?.message || 'Could not submit the request. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const freeLimit = gs?.freeBillLimit ?? 10;

  return (
    <AnimatedPage>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          {setCurrentTab && (
            <button onClick={() => setCurrentTab('dashboard')} className="p-2 rounded-xl bg-theme-surface hover:bg-theme-border-soft transition-colors text-theme-primary" title="Back to Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-theme-primary tracking-tight flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Upgrade Center
            </h2>
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">Pro plans — unlimited billing, no platform dues</p>
          </div>
        </div>

        {/* Current status */}
        <div className={`card-premium p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isPremium ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${isPremium ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-theme-surface text-theme-muted border-theme-border-soft'}`}>
              {isPremium ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-black text-theme-primary">{isPremium ? 'Pro Active' : 'Free Plan'}</p>
              <p className="text-xs text-theme-muted font-semibold">
                {isPremium
                  ? (subscription?.renewalDate ? `Renews/expires: ${new Date(subscription.renewalDate).toLocaleDateString('en-IN')}` : 'Premium features unlocked')
                  : `${freeLimit} free bills · then platform dues apply`}
              </p>
            </div>
          </div>
          {revenueStatus?.platformDueAmount > 0 && (
            <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/30">
              Platform dues: ₹{Math.round(revenueStatus.platformDueAmount)}
            </span>
          )}
        </div>

        {submitted ? (
          <div className="card-premium p-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-theme-primary">Request Submitted</h3>
            <p className="text-xs text-theme-muted font-semibold mt-2 max-w-sm mx-auto">
              Your {selectedPlan.label} Pro payment proof is under review. Once the owner approves it, premium unlocks automatically on your next sync.
            </p>
            <button onClick={() => setCurrentTab ? setCurrentTab('dashboard') : null} className="btn-premium px-6 py-3 text-xs mt-6">Back to Dashboard</button>
          </div>
        ) : !selectedPlan ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map(plan => (
              <motion.button
                key={plan.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedPlan(plan)}
                className={`card-premium p-4 text-left relative ${plan.tag === 'Best Value' ? 'ring-2 ring-theme-accent' : ''}`}
              >
                {plan.tag && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-[image:var(--accent-gradient)] text-white">
                    {plan.tag}
                  </span>
                )}
                <p className="text-xs font-black text-theme-muted uppercase tracking-wider">{plan.label}</p>
                <p className="text-2xl font-black text-theme-primary mt-1.5 tabular-nums">₹{plan.price.toLocaleString('en-IN')}</p>
                <p className="text-[10px] font-bold text-theme-muted mt-1">{plan.days}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-theme-accent mt-3">
                  <Crown className="w-3 h-3" /> Choose {plan.label}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="card-premium p-5 space-y-5">
            {/* Selected plan summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-theme-primary">Pro — {selectedPlan.label}</p>
                <p className="text-[11px] text-theme-muted font-bold">{selectedPlan.days} · ₹{selectedPlan.price.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => { setSelectedPlan(null); setUtr(''); setScreenshotBase64(''); }} className="btn-premium-ghost !min-h-[30px] !px-3 text-[11px]">
                Change Plan
              </button>
            </div>

            {/* Step 1: Pay via UPI */}
            <div>
              <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[9px]">1</span> Pay via UPI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center bg-theme-surface border border-theme-border-soft rounded-2xl p-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="UPI QR" className="w-36 h-36 rounded-xl border border-theme-border-soft bg-white p-1 shrink-0" />
                ) : (
                  <div className="w-36 h-36 rounded-xl border border-theme-border-soft flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-theme-muted animate-pulse" />
                  </div>
                )}
                <div className="space-y-2.5 w-full">
                  <div className="flex items-center gap-2 bg-theme-card border border-theme-border-soft rounded-xl px-3 py-2.5">
                    <span className="text-xs font-bold text-theme-primary flex-1 truncate">{upiId}</span>
                    <button
                      onClick={() => { try { navigator.clipboard.writeText(upiId); toast.success('UPI ID copied'); } catch (e) { toast.error('Copy failed'); } }}
                      className="p-1.5 rounded-lg text-theme-muted hover:text-theme-accent"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    href={upiLinkFor(selectedPlan)}
                    className="btn-premium w-full py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Open UPI App (GPay / PhonePe / Paytm)
                  </a>
                  <p className="text-[10px] text-theme-muted font-semibold leading-relaxed">
                    Pay exactly <span className="text-theme-primary font-black">₹{selectedPlan.price.toLocaleString('en-IN')}</span> to <span className="text-theme-primary font-black">{upiId}</span> ({payeeName}), then submit the proof below.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Submit proof */}
            <form onSubmit={handleSubmit}>
              <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[9px]">2</span> Submit payment proof
              </p>
              <div className="space-y-3">
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="UPI Transaction Reference / UTR (e.g. 402312345678)"
                  className="input-premium w-full text-xs"
                />
                <label className="flex items-center justify-center gap-2 w-full px-3.5 py-4 bg-theme-surface border border-dashed border-theme-border-soft rounded-xl text-xs font-bold text-theme-muted hover:text-theme-accent hover:border-theme-accent/50 transition-all cursor-pointer">
                  <Send className="w-3.5 h-3.5" /> {screenshotBase64 ? 'Screenshot attached ✓ — tap to change' : 'Attach payment screenshot'}
                  <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                </label>
                {screenshotBase64 && (
                  <img src={screenshotBase64} alt="Proof preview" className="w-full max-h-32 object-contain rounded-xl border border-theme-border-soft bg-theme-surface" />
                )}
                <button type="submit" disabled={submitting} className="btn-premium w-full py-3.5 text-xs flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {submitting ? 'Submitting…' : 'Submit for Activation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Benefits */}
        <div className="card-premium p-5">
          <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider mb-4">What you get with Pro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Unlimited bills — no free-tier cap, no platform dues',
              'AI Bill Creator — one-click smart prefill from customer history',
              'Premium themes & full invoice customization',
              'Customer live portal & payment links',
              'Priority WhatsApp support from the owner',
              'Offline-first — everything still works without internet'
            ].map(b => (
              <div key={b} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </span>
                <p className="text-xs font-bold text-theme-primary leading-snug">{b}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-theme-border-soft">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            <p className="text-[10px] text-theme-muted font-semibold">Activation is manual & fair: pay via UPI, submit the UTR — the owner verifies and unlocks Pro. No card needed.</p>
          </div>
        </div>

        {revenueStatus?.lockStatus === 'locked' && (
          <div className="flex items-center gap-2 justify-center text-[10px] text-theme-muted font-bold">
            <Clock className="w-3 h-3" /> Billing is currently locked due to platform dues — upgrading to Pro clears them.
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
};

export default UpgradeCenter;
