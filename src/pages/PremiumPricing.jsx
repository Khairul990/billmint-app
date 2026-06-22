import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Shield, Zap, Sparkles, ChevronDown, CreditCard, Building2, HeadphonesIcon, Clock, Star, Users, ArrowRight, Quote, BadgeCheck, BarChart3, Palette, Globe, Lock, Smartphone, Mail } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp, slideUp, fadeIn } from '../utils/animations';

const plans = [
  {
    id: 'free', name: 'Free', tagline: 'Perfect for getting started.',
    price: { monthly: 0, yearly: 0 }, unit: '/ forever',
    color: 'slate', icon: Shield,
    features: ['Up to 15 Invoices per month', 'Basic Templates', 'Local Storage Backup'],
    highlight: false, badge: null, btnText: 'Go to Dashboard', btnAction: 'dashboard'
  },
  {
    id: 'pay-per-bill', name: 'Pay Per Bill', tagline: 'Pay only for bills you create.',
    price: { monthly: 5, yearly: 5 }, unit: '/ bill',
    color: 'rose', icon: Zap,
    features: ['Unlimited Bills (Billed based on usage)', 'Access to Most Premium Features', 'Cloud Sync Enabled', 'Pay dues weekly or monthly'],
    highlight: true, badge: 'Most Popular', btnText: 'Start Pay Per Bill', btnAction: 'premium-upgrade'
  },
  {
    id: 'premium', name: 'Premium', tagline: 'Unlimited everything for power users.',
    price: { monthly: 149, yearly: 999 }, unit: '/ year',
    color: 'amber', icon: Sparkles,
    features: ['Unlimited Bills Included', 'Live Link Features', 'Advanced Reports & Due Ledger', 'Remove BillQyro Branding', 'Priority Support'],
    highlight: false, badge: 'Best Value', btnText: 'Upgrade to Premium', btnAction: 'premium-upgrade'
  }
];

const allFeatures = [
  { name: 'Invoices per month', free: '15/mo', ppb: 'Unlimited', prem: 'Unlimited' },
  { name: 'Invoice Templates', free: 'Basic', ppb: 'Premium', prem: 'Premium' },
  { name: 'Cloud Sync', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Live Link Features', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Advanced Reports', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Due Ledger', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Remove BillQyro Branding', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Priority Support', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'API Access', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Custom Branding', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <XCircle className="w-4 h-4 text-red-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Bulk Export', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { name: 'Multi-Currency', free: <XCircle className="w-4 h-4 text-red-400" />, ppb: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, prem: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
];

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately and you will only be charged for the difference.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, debit/credit cards (Visa, Mastercard, RuPay), net banking, PayPal, and popular digital wallets like Google Pay and PhonePe.' },
  { q: 'Is there a free trial for Premium?', a: 'Free plan is available forever with no time limit. You can explore Premium features via Pay Per Bill without any long-term commitment.' },
  { q: 'How does Pay Per Billing work?', a: 'You are charged ₹5 per bill generated. Dues are settled weekly or monthly based on your preference. No subscription lock-in.' },
  { q: 'Can I get a refund?', a: 'We offer a 30-day money-back guarantee on all annual Premium subscriptions. No questions asked.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted with 256-bit AES at rest and TLS 1.3 in transit. We follow industry best practices for data security.' },
  { q: 'Do you offer GST invoices?', a: 'Yes, all payments come with a proper GST invoice for your business records.' },
  { q: 'Can I collaborate with my team?', a: 'Team collaboration is available on Premium and Enterprise plans with role-based access controls.' }
];

const trustBadges = [
  { icon: Shield, label: 'Secure Payment', desc: '256-bit encrypted' },
  { icon: Clock, label: '30-Day Guarantee', desc: 'No questions asked' },
  { icon: HeadphonesIcon, label: '24/7 Support', desc: 'Priority channel' },
  { icon: Users, label: '10K+ Users', desc: 'Trusted worldwide' },
  { icon: BadgeCheck, label: 'GST Compliant', desc: 'Tax invoices included' },
  { icon: Lock, label: 'Data Privacy', desc: 'GDPR compliant' }
];

const testimonials = [
  { quote: 'BillQyro transformed how we manage invoices. The Pay Per Bill model is perfect for our growing business.', name: 'Rahul Sharma', role: 'Freelance Designer', plan: 'Pay Per Bill' },
  { quote: 'Upgraded to Premium and never looked back. Unlimited bills and priority support are game changers.', name: 'Priya Patel', role: 'Small Business Owner', plan: 'Premium' },
  { quote: 'The free plan got me started, and the transition to paid was seamless. Highly recommend!', name: 'Amit Kumar', role: 'Startup Founder', plan: 'Free' }
];

const paymentMethods = ['Visa', 'Mastercard', 'RuPay', 'UPI', 'PayPal', 'Stripe', 'Razorpay', 'Google Pay'];

const PremiumPricing = ({ setCurrentTab }) => {
  const [selectedPlan, setSelectedPlan] = useState('pay-per-bill');
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const getPrice = (p) => yearly ? p.price.yearly : p.price.monthly;
  const getUnit = (p) => {
    if (p.id === 'free') return '/ forever';
    if (p.id === 'pay-per-bill') return '/ bill';
    return yearly ? '/ year' : '/ mo';
  };
  const savingsPercent = Math.round((1 - 999 / (149 * 12)) * 100);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div variants={fadeInUp} className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Choose Your Power</h1>
          <p className="text-slate-400 text-lg">No hidden fees. Scale as you grow.</p>
          <div className="flex items-center justify-center gap-3 mt-6 bg-slate-800/50 rounded-2xl p-1 max-w-xs mx-auto border border-slate-700/50">
            <button onClick={() => setYearly(false)} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${!yearly ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white'}`}>Monthly</button>
            <button onClick={() => setYearly(true)} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${yearly ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white'}`}>Yearly <span className="text-[9px] text-emerald-400 ml-1">Save {savingsPercent}%</span></button>
          </div>
          {yearly && (
            <motion.p variants={fadeIn} initial="hidden" animate="visible" className="text-emerald-400 text-xs mt-3 font-medium">
              ✦ Save ₹789 per year with the Premium annual plan
            </motion.p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const Icon = plan.icon;
            const isRose = plan.color === 'rose';
            const isAmber = plan.color === 'amber';
            return (
              <motion.div key={plan.id} variants={slideUp} onClick={() => setSelectedPlan(plan.id)}
                className={`card-premium relative flex flex-col rounded-3xl p-6 lg:p-8 transition-all duration-300 cursor-pointer ${isSelected
                  ? isRose ? 'border-2 border-rose-500 shadow-2xl shadow-rose-500/20 -translate-y-1 scale-[1.02]' : isAmber ? 'border-2 border-amber-500 shadow-2xl shadow-amber-500/20 -translate-y-1 scale-[1.02]' : 'border-2 border-slate-500 shadow-2xl shadow-slate-500/20'
                  : 'border border-slate-700/50 hover:border-slate-500 hover:-translate-y-0.5'
                }`}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${isRose ? 'bg-rose-500 shadow-rose-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30'}`}>
                    {plan.badge}
                  </div>
                )}
                <h3 className={`text-xl font-bold text-white mb-1 flex items-center ${isSelected ? 'text-gradient-premium' : ''}`}>
                  <Icon className={`w-5 h-5 mr-2 ${isRose ? 'text-rose-400' : isAmber ? 'text-amber-400' : 'text-slate-400'}`} />
                  {plan.name}
                </h3>
                <p className="text-slate-400 text-sm mb-5 h-8">{plan.tagline}</p>
                <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-1">
                  {getPrice(plan) === 0 ? '₹0' : `₹${getPrice(plan).toLocaleString()}`}
                  <span className="text-base text-slate-500 font-medium">{getUnit(plan)}</span>
                </div>
                {plan.id === 'premium' && yearly && (
                  <p className="text-[10px] text-emerald-400 -mt-4 mb-6 font-medium">₹149/mo billed annually</p>
                )}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${isRose ? 'text-rose-400' : isAmber ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span className="text-sm text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setCurrentTab(plan.btnAction)}
                  className={`w-full py-4 rounded-xl font-bold transition-all cursor-pointer text-sm ${isSelected
                    ? isRose ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20' : isAmber ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-amber-500/20' : 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}>
                  {plan.btnText}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div variants={fadeInUp} className="card-premium rounded-3xl p-6 md:p-8 border border-slate-700/50">
          <div className="section-header mb-6 flex-wrap gap-3">
            <div>
              <h2 className="section-header-title text-white text-lg">Feature Comparison</h2>
              <p className="section-header-subtitle text-slate-500 text-xs mt-1">See what each plan includes in detail</p>
            </div>
            <span className="badge-premium bg-slate-800 text-slate-300 border-slate-600 text-[10px]">{allFeatures.length} features</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold">Feature</th>
                  <th className="p-3 font-bold text-center">Free</th>
                  <th className="p-3 font-bold text-center text-rose-400">Pay Per Bill</th>
                  <th className="p-3 font-bold text-center text-amber-400">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {allFeatures.map((feat, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-sm text-slate-300 font-medium">{feat.name}</td>
                    <td className="p-3 text-sm text-center text-slate-400">{feat.free}</td>
                    <td className="p-3 text-sm text-center text-slate-300">{feat.ppb}</td>
                    <td className="p-3 text-sm text-center text-slate-300">{feat.prem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="section-header mb-6">
            <div>
              <h2 className="section-header-title text-white text-lg">What Our Users Say</h2>
              <p className="section-header-subtitle text-slate-500 text-xs mt-1">Real feedback from real customers</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={staggerItem} className="card-premium p-6 border-slate-700/50 rounded-2xl flex flex-col">
                <Quote className="w-6 h-6 text-rose-500/40 mb-3" />
                <p className="text-sm text-slate-300 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/30">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.role} · <span className="text-rose-400">{t.plan}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="card-premium rounded-3xl p-6 md:p-8 border border-slate-700/50">
          <div className="section-header mb-6">
            <div>
              <h2 className="section-header-title text-white text-lg">Frequently Asked Questions</h2>
              <p className="section-header-subtitle text-slate-500 text-xs mt-1">Everything you need to know before choosing a plan</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="accordion-premium border-slate-700/50 rounded-2xl h-fit">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="accordion-premium-header w-full flex items-center justify-between p-4 text-sm text-white font-bold bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer rounded-2xl">
                  <span className="text-left pr-2">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="section-header mb-6">
            <div>
              <h2 className="section-header-title text-white text-lg">Trusted by Thousands</h2>
              <p className="section-header-subtitle text-slate-500 text-xs mt-1">Why businesses choose BillQyro</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div key={i} className="card-premium p-5 flex flex-col items-center text-center border-slate-700/50 rounded-2xl hover:border-slate-500 transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-400 mb-3"><Icon className="w-5 h-5" /></div>
                  <p className="text-sm font-bold text-white">{badge.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="section-header mb-6">
            <div>
              <h2 className="section-header-title text-white text-lg">Accepted Payment Methods</h2>
              <p className="section-header-subtitle text-slate-500 text-xs mt-1">Secure & fast checkout — all major payment methods supported</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {paymentMethods.map((pm, i) => (
              <div key={i} className="glass-strong px-5 py-3 rounded-xl border border-slate-700/50 text-sm font-bold text-slate-300 hover:border-rose-500/30 hover:text-white transition-all cursor-default">
                <CreditCard className="w-4 h-4 inline mr-2 text-rose-400" />
                {pm}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="card-premium rounded-3xl p-8 md:p-10 border border-slate-700/50 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20" />
          <div className="relative z-10">
            <Building2 className="w-10 h-10 text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Enterprise & Custom Plans</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-6">Need more seats, custom integrations, white-label solutions, or dedicated account management? We offer tailored enterprise plans for businesses of all sizes. Our team will work with you to build the perfect solution.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><Users className="w-3.5 h-3.5 text-violet-400" /> Unlimited team members</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><Globe className="w-3.5 h-3.5 text-violet-400" /> Custom domain</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><Lock className="w-3.5 h-3.5 text-violet-400" /> SSO / SAML</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><BarChart3 className="w-3.5 h-3.5 text-violet-400" /> Custom analytics</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><HeadphonesIcon className="w-3.5 h-3.5 text-violet-400" /> Dedicated support</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50"><Palette className="w-3.5 h-3.5 text-violet-400" /> White-label</div>
            </div>
            <button className="btn-premium bg-gradient-to-r from-violet-500 to-rose-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all cursor-pointer flex items-center gap-2 mx-auto">
              <Mail className="w-4 h-4" /> Contact Sales <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="card-premium rounded-3xl p-6 md:p-8 border border-slate-700/50 bg-gradient-to-r from-rose-500/5 to-amber-500/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-1">Ready to get started?</h2>
              <p className="text-slate-400 text-sm">Join 10,000+ businesses using BillQyro. No credit card required for Free plan.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => setCurrentTab('dashboard')} className="btn-premium-outline border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-6 py-3 text-xs font-bold rounded-xl cursor-pointer">Try Free</button>
              <button onClick={() => { setSelectedPlan('premium'); setCurrentTab('premium-upgrade'); }} className="btn-premium bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-3 text-xs font-bold rounded-xl shadow-lg cursor-pointer">Go Premium</button>
            </div>
          </div>
        </motion.div>

        <div className="divider-premium" />

        <div className="text-center space-y-2 pb-4">
          <p className="text-xs text-slate-600">All prices are in Indian Rupees (₹). Taxes may apply based on your location.</p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-700">
            <a href="#" className="hover:text-slate-500 transition-colors">Terms of Service</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-500 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-500 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumPricing;
