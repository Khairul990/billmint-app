import React, { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Sparkles,
  MessageCircle, Mail, ChevronDown, Smartphone, Printer, CreditCard,
  BarChart3, Zap, Lock, Check, Sun, Moon, Star,
  FileSpreadsheet, Link2, Layers, Landmark, Scissors, Stethoscope,
  GraduationCap, Wrench, ShoppingBag, Languages, Crown, Infinity as InfinityIcon, WifiOff, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Logo from '../components/Logo';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import AdBanner from '../components/AdBanner';
import PwaInstallPrompt from '../components/PwaInstallPrompt';

// Auth/portal forms are only needed when the visitor opens the login modal —
// lazy keeps their whole subtree (incl. dbEngine/portalEngine) off the boot path.
const Login = lazyWithRetry(() => import('./Login'));
const CustomerPortalLogin = lazyWithRetry(() => import('../components/portal/CustomerPortalLogin'));
import ScrollReveal from '../components/ScrollReveal';
import AnimatedNumber from '../components/AnimatedNumber';

// Authentic customer testimonials from real business categories
const testimonials = [
  {
    name: 'Khairul Murafiq',
    business: 'KB Embroidery Designer, Kolkata',
    quote: 'BillQyro has completely transformed our embroidery studio. Managing customer orders, advance payments, and WhatsApp receipts is now 10x faster.',
    rating: 5,
    avatarUrl: null,
  },
  {
    name: 'Ananya Roy',
    business: 'Roy Boutique & Tailors, Howrah',
    quote: 'বাংলায় ভয়েস বিলিং ফিচারটি সত্যিই অসাধারণ! সেলাইয়ের কাজ করতে করতেই মুখে বলে কাস্টমারের অর্ডার তৈরি করে ফেলতে পারি।',
    rating: 5,
    avatarUrl: null,
  },
  {
    name: 'Dr. S. K. Banerjee',
    business: 'Care Diagnostic & Clinic, Asansol',
    quote: 'অফলাইন বিলিং একদম চমৎকার। আমাদের এলাকায় নেটওয়ার্ক চলে গেলেও রোগীদের ফি আদায় ও রসিদ তৈরি এক সেকেন্ডের জন্য থামে না।',
    rating: 5,
    avatarUrl: null,
  },
  {
    name: 'Tariq Hossain',
    business: 'Tariq Electronics & Repair, Siliguri',
    quote: 'জব-শিট ট্র্যাকিং আর পার্টসের হিসাব রাখা আগের চেয়ে অনেক সহজ হয়েছে। কাস্টমাররা ডিজিটাল লাইভ লিংক পেলেই সাথে সাথে UPI-তে পেমেন্ট করে দেয়।',
    rating: 5,
    avatarUrl: null,
  },
];

const TestimonialCard = ({ name, business, quote, rating = 5, avatarUrl }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="bq26-tile rounded-2xl p-6 flex flex-col justify-between"
  >
    <div>
      <div className="flex items-center gap-1 text-amber-400 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium italic">
        "{quote}"
      </p>
    </div>
    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--bq26-line-soft)]">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B8F78] to-[var(--bq26-emerald-bright)] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {name ? name[0] : '?'}
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-[var(--bq26-text)]">{name}</p>
        <p className="text-[10px] text-[var(--bq26-muted)] font-semibold">{business}</p>
      </div>
    </div>
  </motion.div>
);

const DashboardPreviewSection = ({ tr }) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [demoToast, setDemoToast] = useState(null);
  const [chartRange, setChartRange] = useState('30D');

  // Live Auto-Updating Random Data State
  const [liveMetrics, setLiveMetrics] = useState({
    revenue: 12400,
    inflow: 2400,
    collected: 9800,
    due: 335,
    growth: 82.47,
  });

  const [weeklyBars, setWeeklyBars] = useState([
    { day: tr('Mon', 'সোম'), val: 42, amt: '₹4.2k' },
    { day: tr('Tue', 'মঙ্গল'), val: 68, amt: '₹6.8k' },
    { day: tr('Wed', 'বুধ'), val: 55, amt: '₹5.5k' },
    { day: tr('Thu', 'বৃহ'), val: 84, amt: '₹8.4k' },
    { day: tr('Fri', 'শুক্র'), val: 62, amt: '₹6.2k' },
    { day: tr('Sat', 'শনি'), val: 95, amt: '₹9.5k' },
    { day: tr('Sun', 'রবি'), val: 78, amt: '₹7.8k' },
  ]);

  const showToast = (msg) => {
    setDemoToast(msg);
    setTimeout(() => setDemoToast(null), 2800);
  };

  // Simulated live real-time random activity ticker
  useEffect(() => {
    const liveEvents = [
      { msg: tr('⚡ New payment ₹1,200 received via UPI QR!', '⚡ UPI QR-এ নতুন ₹১,২০০ পেমেন্ট জমা হল!'), addRev: 1200, addCol: 1200 },
      { msg: tr('🧾 New invoice #INV-0043 created', '🧾 নতুন ইনভয়েস #INV-0043 তৈরি হল'), addRev: 850, addCol: 0 },
      { msg: tr('📲 WhatsApp receipt sent to Customer', '📲 কাস্টমারকে WhatsApp রিমাইন্ডার পাঠানো হল'), addRev: 0, addCol: 0 },
      { msg: tr('⚡ Paid ₹450 cleared for Order #118', '⚡ অর্ডার #১১৮-এর ₹৪৫০ পেমেন্ট ক্লিয়ার হল'), addRev: 450, addCol: 450 },
      { msg: tr('✅ Bank auto-reconciled: ₹2,100 credited', '✅ ব্যাংক সিঙ্ক: ₹২,১০০ ক্রেডিট সম্পূর্ণ'), addRev: 2100, addCol: 2100 },
    ];

    let step = 0;
    const interval = setInterval(() => {
      const evt = liveEvents[step % liveEvents.length];
      step++;

      setLiveMetrics((prev) => {
        const newRev = prev.revenue + evt.addRev > 35000 ? 12400 : prev.revenue + evt.addRev;
        const newCol = prev.collected + evt.addCol > 28000 ? 9800 : prev.collected + evt.addCol;
        const newInflow = prev.inflow + evt.addCol > 15000 ? 2400 : prev.inflow + evt.addCol;
        return {
          ...prev,
          revenue: newRev,
          collected: newCol,
          inflow: newInflow,
          growth: +(prev.growth + (Math.random() * 0.4 - 0.1)).toFixed(2),
        };
      });

      // Update a random bar height slightly for visual dynamic movement
      setWeeklyBars((prev) =>
        prev.map((b, idx) =>
          idx === step % 7 ? { ...b, val: Math.min(98, Math.max(30, b.val + (Math.floor(Math.random() * 15) - 7))) } : b
        )
      );

      setDemoToast(evt.msg);
      setTimeout(() => setDemoToast(null), 2500);
    }, 4200);

    return () => clearInterval(interval);
  }, [tr]);

  const navItems = [
    { id: 'dashboard', label: tr('Dashboard', 'ড্যাশবোর্ড'), icon: BarChart3 },
    { id: 'invoices', label: tr('Invoices', 'ইনভয়েস'), icon: FileSpreadsheet },
    { id: 'estimates', label: tr('Estimates', 'এস্টিমেট'), icon: Layers },
    { id: 'customers', label: tr('Customers', 'কাস্টমার'), icon: MessageCircle },
    { id: 'payments', label: tr('Payments', 'পেমেন্ট'), icon: CreditCard },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      id="dashboard-preview"
      className="relative py-12 px-4 sm:px-6 lg:px-8 z-10"
    >
      <div className="max-w-[1180px] mx-auto">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="bq26-kicker">{tr('Live Application Cockpit', 'লাইভ অ্যাপ্লিকেশন ককপিট')}</p>
          <h2 className="bq26-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--bq26-text)] mt-1.5">
            {tr('See BillQyro in ', 'BillQyro-কে বাস্তবে ')}
            <span className="bq26-grad-text">{tr('Action', 'কাজ করতে দেখুন')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--bq26-text-soft)] font-medium mt-2">
            {tr(
              'Real-time billing desk command center — live auto-updating financial intelligence.',
              'রিয়েল-টাইম বিলিং ডেসকের কমান্ড সেন্টার — লাইভ অটো-আপডেটিং আর্থিক ইন্টেলিজেন্স সহ।'
            )}
          </p>
        </div>

        {/* Outer Browser Window Frame */}
        <div className="bq26-cockpit rounded-2xl sm:rounded-3xl border border-[var(--bq26-line)] shadow-2xl overflow-hidden max-w-[1140px] mx-auto relative bg-[var(--bq26-bg)]">
          
          {/* Toast Notification Alert */}
          <AnimatePresence>
            {demoToast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute top-14 right-4 z-30 bg-gradient-to-r from-[#0B8F78] to-[var(--bq26-emerald-bright)] text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{demoToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Window Chrome Header */}
          <div className="bg-[var(--bq26-sunken-strong)] px-3.5 py-2.5 border-b border-[var(--bq26-line-soft)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            </div>
            
            <div className="flex items-center gap-2 bg-[var(--bq26-sunken)] text-[var(--bq26-muted)] px-3 py-0.5 rounded-full text-[11px] font-mono font-medium border border-[var(--bq26-line-soft)] max-w-xs truncate">
              <Lock className="w-3 h-3 text-[var(--bq26-emerald-bright)] shrink-0" />
              <span className="truncate">https://billqyro.app/dashboard/{activeNav}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--bq26-emerald-bright)] bg-[rgba(11,143,120,0.12)] border border-[rgba(11,143,120,0.25)] px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[var(--bq26-emerald-bright)] animate-pulse" />
              <span>{tr('LIVE ENGINE SYNCED', 'লাইভ ইঞ্জিন সিঙ্কড')}</span>
            </div>
          </div>

          {/* App Body Grid (Left Sidebar + Main Dashboard Workspace) */}
          <div className="flex flex-col lg:flex-row min-h-[460px]">
            
            {/* LEFT MINI SIDEBAR */}
            <div className="w-full lg:w-52 bg-[var(--bq26-sunken-strong)] p-3 border-r border-[var(--bq26-line-soft)] flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                {/* Brand */}
                <div className="flex items-center gap-2 px-2 pt-1">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0B8F78] to-[var(--bq26-emerald-bright)] flex items-center justify-center text-white font-black text-[10px]">BQ</div>
                  <div>
                    <span className="font-black text-xs text-[var(--bq26-text)]">BillQyro</span>
                    <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase tracking-tight">Smart Billing</p>
                  </div>
                </div>

                {/* Active Workspace Switcher */}
                <div className="bg-[var(--bq26-sunken)] p-2 rounded-xl border border-[var(--bq26-line-soft)] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--bq26-text)] truncate text-[10px]">KB.Embroidery Designer</span>
                  </div>
                  <span className="text-[8px] font-bold text-[var(--bq26-emerald-bright)] flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--bq26-emerald-bright)] animate-pulse" />
                    Cloud Active
                  </span>
                </div>

                {/* Create Invoice Action Button */}
                <button
                  onClick={() => showToast(tr('Created new invoice draft!', 'নতুন ইনভয়েস ড্রাফট তৈরি করা হয়েছে!'))}
                  className="w-full py-2 px-2.5 rounded-xl bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>{tr('+ Create Invoice', '+ ইনভয়েস বানান')}</span>
                </button>

                {/* Navigation Menu */}
                <div className="space-y-0.5 pt-1">
                  <p className="text-[8px] font-extrabold text-[var(--bq26-muted)] uppercase tracking-widest px-2 mb-1">MAIN MENU</p>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-[rgba(11,143,120,0.15)] text-[var(--bq26-emerald-bright)] border border-[rgba(11,143,120,0.25)]'
                            : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] hover:bg-[var(--bq26-sunken)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Profile at Bottom */}
              <div className="pt-3 border-t border-[var(--bq26-line-soft)] flex items-center gap-2 px-1.5">
                <div className="w-6 h-6 rounded-full bg-[var(--bq26-emerald-bright)] text-white text-[10px] font-black flex items-center justify-center">K</div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[var(--bq26-text)] truncate">Khairul</p>
                  <p className="text-[8px] font-medium text-[var(--bq26-muted)] truncate">khairul2052007@gmail</p>
                </div>
              </div>
            </div>

            {/* MAIN WORKSPACE CONTENT AREA */}
            <div className="flex-1 p-3.5 sm:p-5 space-y-4 overflow-y-auto">
              
              {/* TOP HEADER BAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--bq26-line-soft)]">
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-[var(--bq26-muted)]">Dashboard</span>
                  <span className="text-[var(--bq26-muted)]">/</span>
                  <span className="text-[var(--bq26-text)]">Financial Overview</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 bg-[var(--bq26-sunken)] px-2.5 py-1 rounded-lg border border-[var(--bq26-line-soft)] text-[11px] text-[var(--bq26-muted)] min-w-[180px]">
                    <span>🔍</span>
                    <span>Search Invoices, customers...</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--bq26-muted)] bg-[var(--bq26-sunken)] px-2 py-0.5 rounded border border-[var(--bq26-line-soft)]">7:28 AM</span>
                </div>
              </div>

              {/* GREETING HERO BANNER */}
              <div className="bg-[var(--bq26-sunken)] p-4 sm:p-4.5 rounded-xl border border-[var(--bq26-line-soft)] space-y-2 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[var(--bq26-emerald-bright)] bg-[rgba(11,143,120,0.12)] border border-[rgba(11,143,120,0.25)] px-2.5 py-0.5 rounded-full">
                    • KB.EMBROIDERY DESIGNER · LIVE DEMO SYNCED
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => showToast(tr('Order form opened!', 'অর্ডার ফর্ম খোলা হয়েছে!'))}
                      className="px-3 py-1 rounded-lg bg-[var(--bq26-btn)] text-white text-[11px] font-black hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      + Create Order
                    </button>
                    <button
                      onClick={() => showToast(tr('Payment record modal opened!', 'পেমেন্ট রেকর্ড উইন্ডো খোলা হয়েছে!'))}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bq26-panel)] border border-[var(--bq26-line-soft)] text-[var(--bq26-text)] text-[11px] font-bold hover:bg-[var(--bq26-sunken-strong)] transition-all cursor-pointer"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="bq26-display text-xl sm:text-2xl font-bold text-[var(--bq26-text)]">
                    Good Morning, Khairul 👋
                  </h3>
                  <p className="text-[11px] text-[var(--bq26-text-soft)] font-medium mt-0.5">
                    Your business at a glance — Real-time revenue intelligence, collection flow, and customer ledger.
                  </p>
                </div>
              </div>

              {/* FINANCIAL INTELLIGENCE CARDS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                
                {/* HERO REVENUE CARD (2 Columns) */}
                <div className="lg:col-span-2 bg-[var(--bq26-sunken)] p-4 sm:p-4.5 rounded-xl border border-[var(--bq26-line-soft)] space-y-3">
                  <div className="flex justify-between items-center pb-1.5 border-b border-[var(--bq26-line-soft)]">
                    <span className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">TOTAL REVENUE (THIS MONTH)</span>
                    <span className="text-[9px] font-bold text-[var(--bq26-emerald-bright)] animate-pulse">● LIVE UPDATING</span>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase">MONTH REVENUE</p>
                      <p className="text-xl sm:text-2xl font-black text-[var(--bq26-emerald-bright)] font-numbers mt-0.5">
                        <AnimatedNumber value={liveMetrics.revenue} prefix="₹" />.00
                      </p>
                      <p className="text-[9px] font-bold text-[var(--bq26-muted)] mt-0.5">Today's Invoiced Volume: ₹{liveMetrics.inflow}.00 · 8 active invoices</p>
                    </div>

                    <div className="bg-[var(--bq26-panel)] p-2.5 rounded-xl border border-[var(--bq26-line-soft)] text-[11px] space-y-1 min-w-[140px]">
                      <div className="flex justify-between"><span className="text-[var(--bq26-muted)]">Net Cash Flow</span><span className="font-bold font-numbers">₹{(liveMetrics.revenue * 1.35).toFixed(0)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--bq26-muted)]">Growth</span><span className="font-black text-[var(--bq26-emerald-bright)]">↗ {liveMetrics.growth}%</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[var(--bq26-line-soft)] text-center sm:text-left">
                    <div className="bg-[var(--bq26-panel)] p-2.5 rounded-lg border border-[var(--bq26-line-soft)]">
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">TODAY'S INFLOW</p>
                      <p className="text-xs font-black text-[var(--bq26-emerald-bright)] font-numbers mt-0.5">₹{liveMetrics.inflow}.00</p>
                    </div>
                    <div className="bg-[var(--bq26-panel)] p-2.5 rounded-lg border border-[var(--bq26-line-soft)]">
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">TODAY'S OUTFLOW</p>
                      <p className="text-xs font-black text-rose-400 font-numbers mt-0.5">₹0.00</p>
                    </div>
                    <div className="bg-[var(--bq26-panel)] p-2.5 rounded-lg border border-[var(--bq26-line-soft)]">
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">COLLECTION REALIZED</p>
                      <p className="text-xs font-black text-[var(--bq26-teal)] font-numbers mt-0.5">116%</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN STACK */}
                <div className="space-y-3">
                  
                  {/* Total Collected */}
                  <div className="bg-[var(--bq26-sunken)] p-3.5 rounded-xl border border-[var(--bq26-line-soft)] flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">TOTAL COLLECTED</p>
                      <p className="text-lg font-black text-[var(--bq26-emerald-bright)] font-numbers mt-0.5">₹{liveMetrics.collected}.00</p>
                      <p className="text-[8px] text-[var(--bq26-muted)]">12 confirmed payments received</p>
                    </div>
                    <span className="text-[8px] font-black uppercase text-[var(--bq26-emerald-bright)] bg-[rgba(11,143,120,0.12)] border border-[rgba(11,143,120,0.25)] px-2 py-0.5 rounded-full">
                      116% SETTLED
                    </span>
                  </div>

                  {/* Still to Collect */}
                  <div className="bg-[var(--bq26-sunken)] p-3.5 rounded-xl border border-[var(--bq26-line-soft)] flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">STILL TO COLLECT</p>
                      <p className="text-lg font-black text-rose-400 font-numbers mt-0.5">₹{liveMetrics.due}.00</p>
                      <p className="text-[8px] text-[var(--bq26-muted)]">All invoices within terms</p>
                    </div>
                    <button
                      onClick={() => showToast(tr('WhatsApp reminder sent to customer!', 'কাস্টমারকে WhatsApp রিমাইন্ডার পাঠানো হয়েছে!'))}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      Collect →
                    </button>
                  </div>

                  {/* Operating Capital */}
                  <div className="bg-[var(--bq26-sunken)] p-3.5 rounded-xl border border-[var(--bq26-line-soft)] flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-[var(--bq26-muted)] uppercase">OPERATING CAPITAL</p>
                      <p className="text-lg font-black text-[var(--bq26-text)] font-numbers mt-0.5">₹14,993.00</p>
                      <p className="text-[8px] text-[var(--bq26-muted)]">Liquid operating funds</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[rgba(11,143,120,0.12)] text-[var(--bq26-emerald-bright)] flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </div>

              {/* REVENUE & COLLECTION TREND CHART */}
              <div className="bg-[var(--bq26-sunken)] p-4 rounded-xl border border-[var(--bq26-line-soft)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[11px] font-black text-[var(--bq26-text)] flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-[var(--bq26-teal)]" />
                    Revenue & Collection Trend
                  </h4>
                  
                  <div className="flex items-center gap-1 bg-[var(--bq26-panel)] p-0.5 rounded-lg border border-[var(--bq26-line-soft)]">
                    {['7D', '30D', 'Month', 'Year'].map((rng) => (
                      <button
                        key={rng}
                        onClick={() => setChartRange(rng)}
                        className={`px-2.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                          chartRange === rng
                            ? 'bg-[var(--bq26-btn)] text-white'
                            : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'
                        }`}
                      >
                        {rng}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end gap-2 h-28 pt-4 pb-1">
                  {weeklyBars.map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bq26-sunken-strong)] text-[var(--bq26-text)] text-[8px] font-black font-numbers px-1.5 py-0.5 rounded border border-[var(--bq26-line-soft)] pointer-events-none whitespace-nowrap z-20">
                        {bar.amt}
                      </div>
                      <motion.div
                        animate={{ height: `${bar.val}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`w-full rounded-t transition-all ${
                          i === 5
                            ? 'bg-gradient-to-t from-[var(--bq26-btn)] to-[var(--bq26-emerald-bright)] shadow-[0_0_12px_rgba(11,143,120,0.4)]'
                            : 'bg-[rgba(11,143,120,0.25)] group-hover:bg-[rgba(11,143,120,0.4)]'
                        }`}
                      />
                      <span className="text-[8px] font-bold text-[var(--bq26-muted)]">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </motion.section>
  );
};

const WHATSAPP_NUMBER = '919477738769'; // BillQyro support (user-provided)

const Landing = ({ onLoginSuccess }) => {
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business'); // 'business' | 'customer'
  // Landing light/dark presentation mode — independent of the app account
  // theme so the marketing page can always look its best for the visitor.
  const [landingMode, setLandingMode] = useState(() => {
    try { return localStorage.getItem('billqyro_landing_mode') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const toggleLandingMode = () => {
    setLandingMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('billqyro_landing_mode', next); } catch { /* ignore */ }
      return next;
    });
  };
  const [cockpitTab, setCockpitTab] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState('retail');
  const autoCycleRef = useRef(true);

  // ── Bilingual support (English / বাংলা) ──────────────────────────────────
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('billqyro_landing_lang') === 'bn' ? 'bn' : 'en'; } catch { return 'en'; }
  });
  const tr = (en, bn) => (lang === 'bn' ? bn : en);
  const toggleLang = () => {
    const next = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    try { localStorage.setItem('billqyro_landing_lang', next); } catch { /* ignore */ }
  };

  // Launch the full interactive demo journey (sandbox data, no signup needed).
  // Mirrors the flag sequence used by the admin Owner Test Lab so App.jsx
  // routes the visitor through DemoLogin into the seeded demo workspace.
  const launchLiveDemo = async () => {
    try {
      const demoKeys = [
        'billqyro_demo_customers', 'billqyro_demo_invoices', 'billqyro_demo_products',
        'billqyro_demo_expenses', 'billqyro_demo_payments', 'billqyro_demo_reports',
        'billqyro_demo_settings', 'billqyro_demo_logged_in'
      ];
      demoKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('billqyro_demo_session_active', 'true');
      localStorage.setItem('billqyro_demo_journey_mode', 'true');
      const { generateDemoWorkspace } = await import('../services/demoGenerator.js');
      // Seed the sandbox with the category the visitor was exploring — the
      // demo workspace mirrors that business type end to end.
      generateDemoWorkspace(activeCategory);
      window.location.href = '/';
    } catch (e) {
      console.warn('Demo launch failed', e);
      localStorage.removeItem('billqyro_demo_session_active');
      localStorage.removeItem('billqyro_demo_journey_mode');
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Demo → signup conversion: when a demo visitor taps "Create free account"
  // we land here with the hint flag set — jump to the signup form. The Login
  // panel is lazy-loaded, so it reads the flag itself on mount (see Login.jsx).
  useEffect(() => {
    try {
      if (localStorage.getItem('billqyro_open_signup') === '1') {
        const t = setTimeout(() => {
          const el = document.getElementById('login');
          if (el) {
            const y = window.pageYOffset + el.getBoundingClientRect().top - 84;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 600);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-cycle the hero cockpit preview until the visitor interacts with it.
  useEffect(() => {
    const cycle = ['dashboard', 'invoice', 'qr'];
    const id = setInterval(() => {
      if (!autoCycleRef.current) return;
      setCockpitTab((t) => cycle[(cycle.indexOf(t) + 1) % cycle.length]);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const selectCockpitTab = (tab) => {
    autoCycleRef.current = false;
    setCockpitTab(tab);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = window.pageYOffset + el.getBoundingClientRect().top - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Spotlight hover for bento tiles (CSS variable driven, no re-render).
  const handleTileMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--bq26-mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--bq26-my', `${e.clientY - rect.top}px`);
  };

  const businessCategories = [
    {
      id: 'retail',
      name: tr('Retail & Supermarket', 'রিটেইল ও সুপারমার্কেট'),
      icon: ShoppingBag,
      tag: tr('Inventory & POS', 'ইনভেন্টরি ও POS'),
      desc: tr('Barcode scanning, product variants, real-time stock alert thresholds, and rapid itemized billing.', 'বারকোড স্ক্যানিং, প্রোডাক্ট ভ্যারিয়েন্ট, রিয়েল-টাইম স্টক অ্যালার্ট আর দ্রুত আইটেমাইজড বিলিং।'),
      highlight: tr('Auto-decrementing inventory & GST/VAT breakdowns', 'অটো-কমতে ইনভেন্টরি ও GST/VAT বিশ্লেষণ'),
      fields: ['SKU / Barcode', tr('Stock alerts', 'স্টক অ্যালার্ট'), 'GST / VAT', tr('Variants', 'ভ্যারিয়েন্ট')]
    },
    {
      id: 'tailor',
      name: tr('Tailoring & Boutiques', 'টেইলারিং ও বুটিক'),
      icon: Scissors,
      tag: tr('Custom Orders', 'কাস্টম অর্ডার'),
      desc: tr('Custom measurements, cloth swatch tracking, stitching stages, delivery dates, and advance payment logging.', 'কাস্টম মাপ, কাপড়ের নমুনা ট্র্যাকিং, সেলাইয়ের ধাপ, ডেলিভারির তারিখ আর অ্যাডভান্স পেমেন্টের হিসাব।'),
      highlight: tr('Order status lifecycle & measurement cards', 'অর্ডার স্ট্যাটাস লাইফসাইকেল ও মাপের কার্ড'),
      fields: [tr('Measurements', 'মাপ'), tr('Stitch stages', 'সেলাইয়ের ধাপ'), tr('Delivery date', 'ডেলিভারির তারিখ'), tr('Advance due', 'অ্যাডভান্স বাকি')]
    },
    {
      id: 'clinic',
      name: tr('Clinics & Healthcare', 'ক্লিনিক ও হেলথকেয়ার'),
      icon: Stethoscope,
      tag: tr('Patient CRM', 'পেশেন্ট CRM'),
      desc: tr('Patient history records, consultation fees, prescription attachments, and automated follow-up dues.', 'রোগীর ইতিহাস, কনসালটেশন ফি, প্রেসক্রিপশন অ্যাটাচমেন্ট আর অটোমেটিক ফলো-আপ বাকি।'),
      highlight: tr('Clinical disclaimer headers & patient ledger', 'ক্লিনিকাল ডিসক্লেইমার হেডার ও পেশেন্ট লেজার'),
      fields: [tr('Patient history', 'রোগীর ইতিহাস'), tr('Consult fee', 'কনসালটেশন ফি'), tr('Follow-ups', 'ফলো-আপ'), 'Rx']
    },
    {
      id: 'repair',
      name: tr('Repair & Electronics', 'রিপেয়ার ও ইলেকট্রনিক্স'),
      icon: Wrench,
      tag: tr('Service Jobs', 'সার্ভিস জব'),
      desc: tr('Job-sheet numbers, problem diagnostics, replacement parts billing, labour estimates, and service warranty tracking.', 'জব-শিট নম্বর, সমস্যার ডায়াগনোসিস, পার্টস বিলিং, লেবার এস্টিমেট আর ওয়ারেন্টি ট্র্যাকিং।'),
      highlight: tr('Job-sheet lifecycle & parts breakdown', 'জব-শিট লাইফসাইকেল ও পার্টস ব্রেকডাউন'),
      fields: [tr('Job sheet #', 'জব-শিট নং'), tr('Diagnosis', 'ডায়াগনোসিস'), tr('Parts + labour', 'পার্টস + লেবার'), tr('Warranty', 'ওয়ারেন্টি')]
    },
    {
      id: 'education',
      name: tr('Coaching & Education', 'কোচিং ও শিক্ষা'),
      icon: GraduationCap,
      tag: tr('Fee Management', 'ফি ম্যানেজমেন্ট'),
      desc: tr('Batch tracking, monthly tuition fee schedules, student admission records, and parent payment receipts.', 'ব্যাচ ট্র্যাকিং, মাসিক টিউশন ফি, শিক্ষার্থীর ভর্তির রেকর্ড আর অভিভাবকের পেমেন্ট রসিদ।'),
      highlight: tr('Monthly fee dues & student directory', 'মাসিক ফি বাকি ও শিক্ষার্থী ডিরেক্টরি'),
      fields: [tr('Batches', 'ব্যাচ'), tr('Monthly fees', 'মাসিক ফি'), tr('Admissions', 'ভর্তি'), tr('Receipts', 'রসিদ')]
    }
  ];

  const activeCat = businessCategories.find((c) => c.id === activeCategory) || businessCategories[0];

  const workflowSteps = [
    {
      step: '01',
      icon: FileSpreadsheet,
      title: tr('Create & Itemize', 'তৈরি ও আইটেম যোগ'),
      desc: tr('Add items in seconds with auto-complete product catalog, dynamic discounts, and regional tax computations.', 'অটো-কমপ্লিট প্রোডাক্ট ক্যাটালগ, ডাইনামিক ডিসকাউন্ট আর রিজিওনাল ট্যাক্স হিসাব দিয়ে সেকেন্ডেই আইটেম যোগ করুন।')
    },
    {
      step: '02',
      icon: Link2,
      title: tr('Live Link / PDF', 'লাইভ লিংক / PDF'),
      desc: tr('Generate pixel-perfect A4/A5 PDF documents and shareable encrypted web links for client self-service.', 'নিখুঁত A4/A5 PDF আর শেয়ারযোগ্য এনক্রিপ্টেড ওয়েব লিংক তৈরি করুন — কাস্টমার নিজেই দেখে নিতে পারবে।')
    },
    {
      step: '03',
      icon: QrCode,
      title: tr('Collect via UPI / QR', 'UPI / QR-এ আদায়'),
      desc: tr('Clients scan dynamic QR codes, submit digital transaction proof, or pay on delivery with real-time feedback.', 'কাস্টমার QR স্ক্যান করে টাকা পাঠায়, ডিজিটাল প্রমাণ জমা দেয় — সবকিছুর রিয়েল-টাইম আপডেট পাবেন।')
    },
    {
      step: '04',
      icon: Landmark,
      title: tr('Reconcile & Ledger', 'রিকনসিলিয়েশন ও লেজার'),
      desc: tr('One-click proof approval automatically updates Customer Ledger, Cash Book, and Executive Dashboard.', 'এক ক্লিকে প্রমাণ অনুমোদন করলেই কাস্টমার লেজার, ক্যাশ বুক আর ড্যাশবোর্ড নিজে থেকেই আপডেট হয়ে যায়।')
    }
  ];

  const faqs = [
    {
      q: tr('How does BillQyro operate offline?', 'BillQyro অফলাইনে কীভাবে চলে?'),
      a: tr('BillQyro utilizes an IndexedDB local-first architecture. You can generate invoices, look up customer balances, and create estimates without an active internet connection. As soon as you reconnect, changes synchronize bidirectionally with Firebase.', 'BillQyro ব্যবহার করে IndexedDB লোকাল-ফার্স্ট আর্কিটেকচার। ইন্টারনেট ছাড়াই ইনভয়েস তৈরি, কাস্টমারের ব্যালেন্স দেখা আর এস্টিমেট বানানো যায়। নেটওয়ার্ক ফিরলেই সব পরিবর্তন Firebase-এর সাথে দুই দিকে সিঙ্ক হয়ে যায়।')
    },
    {
      q: tr('Is multi-workspace data isolated securely?', 'মাল্টি-ওয়ার্কস্পেসের ডেটা কি নিরাপদে আলাদা থাকে?'),
      a: tr('Yes. Every workspace operates in a strictly segregated sandbox. Invoices, customers, bank transactions, and reports are partitioned by workspace ID and authenticated credentials with server-side security rules.', 'হ্যাঁ। প্রতিটি ওয়ার্কস্পেস সম্পূর্ণ আলাদা স্যান্ডবক্সে চলে। ইনভয়েস, কাস্টমার, ব্যাংক লেনদেন আর রিপোর্ট — সব ওয়ার্কস্পেস আইডি ও অথেনটিকেশন অনুযায়ী সার্ভার-সাইড নিয়মে পৃথক থাকে।')
    },
    {
      q: tr('Can customers view and pay invoices without creating an account?', 'কাস্টমার কি অ্যাকাউন্ট খুলে না ইনভয়েস দেখতে ও টাকা দিতে পারে?'),
      a: tr('Yes. Each invoice comes with a secure, unique Live Link. Customers can open the link in any mobile or desktop browser to view invoice line items, scan payment QR codes, and upload transaction proof directly.', 'হ্যাঁ। প্রতিটি ইনভয়েসের সাথে একটা নিরাপদ, ইউনিক লাইভ লিংক থাকে। কাস্টমার যেকোনো ব্রাউজারে লিংকটা খুলে ইনভয়েস দেখতে পারে, QR স্ক্যান করে টাকা দিতে পারে, সরাসরি লেনদেনের প্রমাণও আপলোড করতে পারে।')
    },
    {
      q: tr('How are old dues and balances calculated?', 'পুরনো বাকি ও ব্যালেন্স কীভাবে হিসাব হয়?'),
      a: tr('BillQyro enforces canonical mathematical invariants across all screens: Balance Due = max(0, Old Due + Current Invoice - Paid Now). Lifetime customer dues and dashboard totals stay 100% consistent.', 'সব স্ক্রিনে BillQyro একটাই অটল গাণিতিক নিয়ম মানে: বাকি = max(0, পুরনো বাকি + বর্তমান বিল − এখন প্রদত্ত)। কাস্টমারের লাইফটাইম বাকি আর ড্যাশবোর্ডের টোটাল সবসময় ১০০% মিলে থাকে।')
    },
    {
      q: tr('Can I export reports and financial statements?', 'রিপোর্ট ও আর্থিক বিবরণী কি এক্সপোর্ট করা যায়?'),
      a: tr('Yes. Export Sales Summaries, Profit & Loss Statements, Due Ledgers, Inventory Valuation Reports, and Customer Statements into structured Excel spreadsheets or PDF archives at any time.', 'হ্যাঁ। সেলস সামারি, লাভ-ক্ষতি বিবরণী, বাকির লেজার, ইনভেন্টরি ভ্যালুয়েশন আর কাস্টমার স্টেটমেন্ট — যেকোনো সময় সুবিন্যস্ত Excel বা PDF আকারে এক্সপোর্ট করুন।')
    }
  ];

  const navLinks = [
    ['platform', tr('Platform', 'প্ল্যাটফর্ম')],
    ['why-billqyro', tr('Why BillQyro', 'কেন BillQyro')],
    ['categories', tr('Categories', 'ক্যাটাগরি')],
    ['workflow', tr('Workflow', 'ওয়ার্কফ্লো')],
    ['pricing', tr('Pricing', 'প্রাইসিং')],
    ['faq', tr('FAQ', 'সাধারণ প্রশ্ন')]
  ];

  return (
    <div className={`bq26-root min-h-screen flex flex-col relative ${landingMode === 'dark' ? 'bq26-dark' : ''}`} data-theme="emerald-royal">
      {/* ── Cinematic aurora backdrop ─────────────────────────────────── */}
      <div aria-hidden="true" className="bq26-aurora" />
      <div aria-hidden="true" className="bq26-grid" />
      <div aria-hidden="true" className="bq26-noise" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--bq26-bg)] via-transparent to-transparent z-[1] pointer-events-none" />

      {/* ===== SPONSORED BANNER (admin-controlled slot) ===== */}
      <AdBanner />

      {/* ===== GLOBAL NAVIGATION ===== */}
      <nav className="fixed w-full top-3 z-50 flex justify-center px-4 sm:px-8 lg:px-12">
        <div className={`w-full max-w-[1536px] rounded-full px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between transition-all duration-300 bq26-nav ${isScrolled ? '' : '!bg-transparent !border-transparent !shadow-none'}`}>
          <Logo type="horizontal" forceWhiteText={landingMode === 'dark'} textColorClass="text-[var(--bq26-text)]" />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="bq26-nav-link">{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleLandingMode}
              title={landingMode === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle landing theme"
              className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-[var(--bq26-line)] text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] hover:border-[rgba(11,143,120,0.35)] transition-all cursor-pointer"
            >
              {landingMode === 'dark' ? <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
            </button>
            <button
              onClick={toggleLang}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 h-10 sm:h-8 px-3 sm:px-2.5 rounded-full border border-[var(--bq26-line)] text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] hover:border-[rgba(11,143,120,0.35)] text-[11px] font-black transition-all cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button onClick={() => scrollTo('login')} className="hidden sm:block bq26-nav-link">
              {tr('Sign In', 'সাইন ইন')}
            </button>
            <button onClick={() => scrollTo('login')} className="bq26-beam">
              <span className="bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] px-5 py-2 text-xs font-black tracking-tight flex items-center gap-1.5 transition-colors">
                {tr('Get Started Free', 'ফ্রি শুরু করুন')}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[var(--bq26-text)] focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-4 right-4 bq26-glass-strong rounded-2xl p-4 space-y-1 z-50 shadow-2xl"
          >
            {navLinks.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm font-bold text-[var(--bq26-text)] py-2.5 border-b border-[var(--bq26-line-soft)]">{label}</button>
            ))}
            <button onClick={() => scrollTo('login')} className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#0B8F78] to-[#0B8F78] text-white text-sm font-black">{tr('Sign In / Register', 'সাইন ইন / রেজিস্টার')}</button>
              <a href="/downloads/BillQyro-Android.apk" download className="block w-full mt-2 py-3 rounded-xl border border-[rgba(11,143,120,0.35)] text-[var(--bq26-emerald-bright)] text-sm font-black flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4" />
                {tr('Download Android App', 'অ্যান্ড্রয়েড অ্যাপ ডাউনলোড')}
              </a>
          </motion.div>
        )}
      </nav>

      {/* ===== SECTION 1: HERO ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} className="relative min-h-[94vh] flex items-center pt-32 pb-16 px-4 sm:px-8 lg:px-12 z-10">
        <div className="max-w-[1536px] mx-auto w-full flex flex-col lg:flex-row items-center gap-14 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bq26-glass"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--bq26-emerald-bright)] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--bq26-emerald-bright)]">
                {tr('OFFLINE-FIRST BILLING PLATFORM', 'অফলাইন-ফার্স্ট বিলিং প্ল্যাটফর্ম')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bq26-display text-[2.75rem] sm:text-6xl lg:text-[4.6rem] font-bold text-[var(--bq26-text)] max-w-4xl"
            >
              {tr('Smart billing.', 'স্মার্ট বিলিং।')} <br />
              <span className="bq26-grad-text">{tr('Premium control.', 'প্রিমিয়াম নিয়ন্ত্রণ।')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="text-base sm:text-lg text-[var(--bq26-text-soft)] max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              {tr('Professional invoices, faster collections and full customer dues control — now with voice billing in Bengali. Built for clinics, tuition centres, shops and studios; works even when the network disappears.', 'প্রফেশনাল ইনভয়েস, দ্রুত আদায় আর বকেয়ার পূর্ণ নিয়ন্ত্রণ — এখন বাংলায় ভয়েস বিলিং সহ। ক্লিনিক, টিউশন, দোকান ও স্টুডিওর জন্য তৈরি; নেটওয়ার্ক চলে গেলেও কাজ থামবে না।')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start"
            >
              <button onClick={() => scrollTo('login')} className="bq26-beam w-full sm:w-auto">
                <span className="bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 transition-colors">
                  {tr('Create Free Account', 'ফ্রি অ্যাকাউন্ট খুলুন')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                onClick={launchLiveDemo}
                className="w-full sm:w-auto px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-[rgba(11,143,120,0.35)] text-[var(--bq26-emerald-bright)] hover:bg-[rgba(11,143,120,0.1)] transition-all"
                title={tr('Explore the full platform with sample data — no signup required', 'নমুনা ডেটা দিয়ে পুরো প্ল্যাটফর্ম দেখুন — রেজিস্টার লাগবে না')}
              >
                <Zap className="w-4 h-4" />
                {tr('Try Live Demo', 'লাইভ ডেমো দেখুন')}
              </button>
              <a
                href="/downloads/BillQyro-Android.apk"
                download
                className="w-full sm:w-auto px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-[rgba(11,143,120,0.35)] text-[var(--bq26-emerald-bright)] hover:bg-[rgba(11,143,120,0.1)] transition-all"
                title={tr('Install the BillQyro Android app on your phone', 'BillQyro অ্যান্ড্রয়েড অ্যাপ ফোনে ইনস্টল করুন')}
              >
                <Smartphone className="w-4 h-4" />
                {tr('Android App (APK)', 'অ্যান্ড্রয়েড অ্যাপ (APK)')}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-[var(--bq26-muted)] text-xs font-bold"
            >
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)]" /> {tr('Free forever plan', 'চিরকাল ফ্রি প্ল্যান')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)]" /> {tr('No credit card', 'ক্রেডিট কার্ড লাগবে না')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)]" /> {tr('Works offline', 'অফলাইনেও চলে')}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--bq26-line-soft)]"
            >
              {[
                { v: '6+', en: 'Business categories', bn: 'ব্যবসার ক্যাটাগরি' },
                { v: '40+', en: 'Pro pages & studios', bn: 'প্রো পেজ ও স্টুডিও' },
                { v: '🎙️', en: 'Voice billing (BN/EN)', bn: 'ভয়েস বিলিং (বাংলা/EN)' },
                { v: '100%', en: 'Offline-first & secure', bn: 'অফলাইন-ফার্স্ট ও সুরক্ষিত' }
              ].map((st, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black bq26-display text-[var(--bq26-emerald-bright)] tabular-nums">{st.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--bq26-muted)] mt-0.5">{tr(st.en, st.bn)}</div>
                </div>
              ))}
            </motion.div>
          </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-4 bq26-glass rounded-2xl p-4 max-w-sm mx-auto lg:mx-0"
            >
              <div className="bg-white p-2 rounded-xl shrink-0">
                <QRCodeSVG value="https://billqyro.com/downloads/BillQyro-Android.apk" size={84} level="M" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--bq26-text)] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[var(--bq26-emerald-bright)]" />
                  {tr('Scan to install on your phone', 'স্ক্যান করে ফোনে ইনস্টল করুন')}
                </p>
                <p className="text-[11px] font-semibold text-[var(--bq26-muted)] leading-snug mt-1">
                  {tr('Point your phone camera at the code to download the app', 'ফোনের ক্যামেরা কোডের দিকে ধরুন — অ্যাপ নেমে যাবে')}
                </p>
              </div>
            </motion.div>

          {/* ── Hero Interactive Cockpit ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-xl relative"
          >
            <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-[rgba(11,143,120,0.06)] blur-3xl -z-10 pointer-events-none" />

            {/* Floating notification chips */}
            <div aria-hidden="true" className="bq26-chip -left-4 top-14 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float">
              <span className="w-6 h-6 rounded-xl bg-[rgba(11,143,120,0.12)] text-[var(--bq26-emerald)] flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Payment Received</p>
                <p className="text-[9px] font-bold text-[var(--bq26-emerald-bright)]">UPI · just now</p>
              </div>
            </div>
            <div aria-hidden="true" className="bq26-chip -right-5 top-44 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float-slow">
              <span className="w-6 h-6 rounded-xl bg-[rgba(217,119,6,0.12)] text-[var(--bq26-gold)] flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Revenue +18%</p>
                <p className="text-[9px] font-bold text-[var(--bq26-gold)]">this week</p>
              </div>
            </div>
            <div aria-hidden="true" className="bq26-chip -bottom-5 left-12 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float" style={{ animationDelay: '1.2s' }}>
              <span className="w-6 h-6 rounded-xl bg-[rgba(20,184,166,0.12)] text-[var(--bq26-teal)] flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Invoice shared</p>
                <p className="text-[9px] font-bold text-[var(--bq26-teal)]">via WhatsApp</p>
              </div>
            </div>

            {/* Cockpit card */}
            <div className="bq26-cockpit rounded-[1.75rem] p-4 sm:p-5 relative overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--bq26-line-soft)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--bq26-gold)]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--bq26-emerald-bright)]/70" />
                </div>
                <div className="text-[10px] font-bold text-[var(--bq26-muted)] px-2.5 py-0.5 rounded-full border border-[var(--bq26-line-soft)]">
                  billqyro.app · {tr('Live Cockpit', 'লাইভ ককপিট')}
                </div>
                <div className="w-8" />
              </div>

              {/* Cockpit tabs */}
              <div className="grid grid-cols-3 gap-1.5 mb-4 p-1 rounded-xl bg-[var(--bq26-sunken-strong)] border border-[var(--bq26-line-soft)]">
                {[
                  ['dashboard', tr('Dashboard', 'ড্যাশবোর্ড'), BarChart3],
                  ['invoice', tr('Invoice', 'ইনভয়েস'), FileSpreadsheet],
                  ['qr', tr('UPI QR', 'UPI QR'), QrCode]
                ].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => selectCockpitTab(id)}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black transition-colors ${cockpitTab === id ? 'text-white' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {cockpitTab === id && <motion.span layoutId="cockpit-pill" className="absolute inset-0 rounded-lg bg-[var(--bq26-btn)]" transition={{ type: 'spring', damping: 28, stiffness: 320 }} />}
                    <Icon className="w-3 h-3 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                ))}
              </div>

              {/* Cockpit viewport */}
              <div className="min-h-[248px] sm:min-h-[264px]">
                <AnimatePresence mode="wait">
                  {cockpitTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-[var(--bq26-sunken)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr("Today's Revenue", 'আজকের আয়')}</p>
                          <p className="text-base font-black text-[var(--bq26-text)] font-numbers mt-0.5"><AnimatedNumber value={48250} prefix="₹" /></p>
                        </div>
                        <div className="bg-[var(--bq26-sunken)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr('Collections', 'কালেকশন')}</p>
                          <p className="text-base font-black text-[var(--bq26-emerald-bright)] font-numbers mt-0.5"><AnimatedNumber value={42000} prefix="₹" /></p>
                        </div>
                        <div className="bg-[var(--bq26-sunken)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr('Due', 'বাকি')}</p>
                          <p className="text-base font-black text-[var(--bq26-gold)] font-numbers mt-0.5"><AnimatedNumber value={6250} prefix="₹" /></p>
                        </div>
                      </div>
                      {/* Revenue bars */}
                      <div className="bg-[var(--bq26-sunken)] rounded-xl border border-[var(--bq26-line-soft)] p-3.5">
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[10px] font-black text-[var(--bq26-text)]">{tr('Weekly collections', 'সাপ্তাহিক কালেকশন')}</p>
                          <span className="text-[9px] font-black text-[var(--bq26-emerald-bright)] flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18%</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-16">
                          {[38, 52, 44, 68, 59, 82, 95].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                              className={`flex-1 rounded-t-md ${i === 6 ? 'bg-gradient-to-t from-[var(--bq26-btn)] to-[var(--bq26-emerald-bright)]' : 'bg-[rgba(11,143,120,0.18)]'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {cockpitTab === 'invoice' && (
                    <motion.div key="inv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-2.5">
                      <div className="flex justify-between items-start bg-[var(--bq26-sunken)] rounded-xl border border-[var(--bq26-line-soft)] p-3.5">
                        <div>
                          <span className="text-[9px] font-black text-[var(--bq26-emerald-bright)] bg-[rgba(11,143,120,0.12)] px-2 py-0.5 rounded-md">INV-2026-0042</span>
                          <p className="text-sm font-black text-[var(--bq26-text)] mt-1.5">Apex Industrial Solutions</p>
                          <p className="text-[10px] text-[var(--bq26-muted)] font-medium">{tr('3 line items · Standard B2B', '৩টি আইটেম · স্ট্যান্ডার্ড B2B')}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[rgba(11,143,120,0.1)] text-[var(--bq26-emerald-bright)] border border-[rgba(11,143,120,0.2)]">{tr('Paid', 'পেইড')}</span>
                      </div>
                      {[
                        ['Commercial Consultation', '2 × ₹2,500', '₹5,000'],
                        ['Design Implementation', '1 × ₹12,000', '₹12,000'],
                        ['GST (18%)', '', '₹3,060']
                      ].map(([item, qty, amt]) => (
                        <div key={item} className="flex justify-between items-center bg-[var(--bq26-sunken-soft)] rounded-lg border border-[var(--bq26-line-soft)] px-3.5 py-2 text-[11px]">
                          <span className="font-bold text-[var(--bq26-text-soft)]">{item}</span>
                          <span className="flex items-center gap-4">
                            <span className="text-[var(--bq26-muted)] font-numbers hidden sm:inline">{qty}</span>
                            <span className="font-black text-[var(--bq26-text)] font-numbers">{amt}</span>
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-3.5 pt-2 text-xs font-bold">
                        <span className="text-[var(--bq26-muted)]">{tr('Total settled', 'মোট আদায়')}</span>
                        <span className="text-[var(--bq26-text)] font-black font-numbers text-sm">₹18,400.00</span>
                      </div>
                    </motion.div>
                  )}

                  {cockpitTab === 'qr' && (
                    <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex items-center gap-4 bg-[var(--bq26-sunken)] rounded-xl border border-[var(--bq26-line-soft)] p-4">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 bq26-qr-cell rounded-xl border border-[rgba(11,143,120,0.2)] p-2 grid grid-cols-7 grid-rows-7 gap-[2px]">
                        {[
                          1,1,1,0,1,1,1, 1,0,1,0,0,0,1, 1,1,0,1,0,1,1, 0,0,1,1,1,0,0,
                          1,0,0,1,0,0,1, 1,1,0,0,1,1,1, 0,1,1,0,1,0,1, 1,0,1,1,0,1,1,
                          1,1,0,1,1,0,1, 0,0,1,0,1,1,0, 1,1,0,1,0,0,1, 0,1,1,0,1,1,0,
                          1,0,1,1,0,1,1, 1,1,0,0,1,0,1, 0,1,0,1,1,0,0, 1,0,1,0,1,1,1
                        ].map((on, i) => <span key={i} className={on ? 'bg-[var(--bq26-emerald)] rounded-[1px]' : ''} />)}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-black text-[var(--bq26-text)]">{tr('Scan & pay with any UPI app', 'যেকোনো UPI অ্যাপে স্ক্যান করে টাকা দিন')}</p>
                        <p className="text-[10px] text-[var(--bq26-muted)] font-bold">GPay · PhonePe · Paytm · BHIM</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2.5 py-1 rounded-lg bg-[rgba(11,143,120,0.12)] border border-[rgba(11,143,120,0.25)] text-[var(--bq26-emerald-bright)] text-sm font-black font-numbers">₹4,200</span>
                          <span className="flex items-center gap-1 text-[9px] font-black text-[var(--bq26-emerald-bright)] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {tr('Verified proof', 'প্রমাণ যাচাই')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1.5 text-[var(--bq26-muted)]">
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">{tr('Scroll', 'স্ক্রল')}</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </motion.section>

      {/* ===== SECTION: DASHBOARD PREVIEW ===== */}
      <DashboardPreviewSection tr={tr} />

      {/* ===== CATEGORY MARQUEE ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} aria-label={tr('Business categories', 'ব্যবসার ক্যাটাগরি')} className="pb-16 px-4 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-[1536px] mx-auto">
          <div className="bq26-marquee-shell bq-marquee rounded-full py-3">
            <div className="bq-marquee-track gap-3 pr-3">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-3 pr-3" aria-hidden={dup === 1}>
                  {[tr('Tailoring & Boutiques', 'টেইলারিং ও বুটিক'), tr('Retail & Supermarkets', 'রিটেইল ও সুপারমার্কেট'), tr('Clinics & Healthcare', 'ক্লিনিক ও হেলথকেয়ার'), tr('Repair & Electronics', 'রিপেয়ার ও ইলেকট্রনিক্স'), tr('Coaching & Education', 'কোচিং ও শিক্ষা'), tr('Embroidery Studios', 'এমব্রয়ডারি স্টুডিও'), tr('Cyber Cafes', 'সাইবার ক্যাফে'), tr('Salons & Parlours', 'সেলুন ও পার্লার'), tr('Wholesale Trading', 'হোলসেল ট্রেডিং'), tr('Freelancers', 'ফ্রিল্যান্সার')].map((cat) => (
                    <span key={cat + dup} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--bq26-line)] bg-[var(--bq26-panel)] px-4 py-1.5 text-[11px] font-black text-[var(--bq26-text-soft)] tracking-wide">
                      <Sparkles className="w-3 h-3 text-[var(--bq26-emerald)]" />
                      {cat}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== SECTION: WHY BILLQYRO (BENTO GRID) ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="why-billqyro" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto">
            <div className="max-w-3xl mb-12">
              <p className="bq26-kicker">{tr('The BillQyro Difference', 'BillQyro-এর পার্থক্য')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('One system for the work that happens ', 'বিক্রির পরের সব কাজের জন্য ')}
                <span className="bq26-grad-text">{tr('after the sale.', 'একটাই সিস্টেম।')}</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--bq26-text-soft)] font-medium leading-relaxed mt-4">
                {tr('Billing is only the beginning. BillQyro connects invoices, payments, customer balances, live links, reports and workspace controls into one disciplined operating layer.', 'বিলিং তো শুধু শুরু। BillQyro ইনভয়েস, পেমেন্ট, কাস্টমার ব্যালেন্স, লাইভ লিংক, রিপোর্ট আর ওয়ার্কস্পেস কন্ট্রোল — সব জুড়ে দেয় একটা সুশৃঙ্খল অপারেটিং লেয়ারে।')}
              </p>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {/* Big tile: cockpit illustration */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6 md:col-span-2 lg:row-span-2 flex flex-col justify-between min-h-[300px] lg:min-h-[420px]">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[rgba(11,143,120,0.1)] border border-[rgba(11,143,120,0.2)] text-[var(--bq26-emerald-bright)] flex items-center justify-center mb-5"><Layers className="w-5 h-5" /></div>
                  <h3 className="bq26-display text-xl font-bold text-[var(--bq26-text)]">{tr('Everything stays connected', 'সবকিছু একসাথে যুক্ত')}</h3>
                  <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2 max-w-sm">
                    {tr('Invoice totals, payments, customer dues and reporting are designed around the same financial source of truth. Approve a payment once — every ledger updates itself.', 'ইনভয়েসের টোটাল, পেমেন্ট, কাস্টমারের বাকি আর রিপোর্ট — সব একই আর্থিক সত্য ঘিরে তৈরি। একবার পেমেন্ট অনুমোদন করলেই সব লেজার নিজে নিজে আপডেট হয়।')}
                  </p>
                </div>
                <div className="space-y-1.5 mt-6">
                  {[
                    [tr('Invoice INV-0042 created', 'ইনভয়েস INV-0042 তৈরি'), '₹18,400', '+'],
                    [tr('UPI payment received', 'UPI পেমেন্ট পেলাম'), '₹10,000', '+'],
                    [tr('Customer ledger updated', 'কাস্টমার লেজার আপডেট'), 'auto', '✓']
                  ].map(([label, val, sign]) => (
                    <div key={label} className="flex items-center justify-between bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)] rounded-xl px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--bq26-text-soft)]">
                        <span className={`w-1.5 h-1.5 rounded-full ${sign === '+' ? 'bg-[var(--bq26-emerald-bright)]' : 'bg-[var(--bq26-teal)]'}`} />
                        {label}
                      </span>
                      <span className="text-[11px] font-black font-numbers text-[var(--bq26-emerald-bright)]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(11,143,120,0.1)] text-[var(--bq26-emerald-bright)] flex items-center justify-center mb-4"><Zap className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Counter-speed billing', 'কাউন্টারের গতিতে বিল')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Optimistic local saves and focused workflows keep everyday billing responsive.', 'অপটিমিস্টিক লোকাল সেভ আর ফোকাসড ওয়ার্কফ্লো — রোজকার বিলিং ঝটপট।')}</p>
              </div>

              {/* Live links */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(20,184,166,0.1)] text-[var(--bq26-teal)] flex items-center justify-center mb-4"><Link2 className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Live customer links', 'লাইভ কাস্টমার লিংক')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Encrypted web links where customers view, verify and pay — no app install.', 'এনক্রিপ্টেড ওয়েব লিংকে কাস্টমার দেখে, যাচাই করে, টাকা দেয় — অ্যাপ ইনস্টল লাগে না।')}</p>
              </div>

              {/* Offline */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(217,119,6,0.1)] text-[var(--bq26-gold)] flex items-center justify-center mb-4"><WifiOff className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Offline-first engine', 'অফলাইন-ফার্স্ট ইঞ্জিন')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Network drops never stop the counter. Everything syncs when you reconnect.', 'নেটওয়ার্ক গেলেও কাউন্টার থামে না। নেট ফিরলেই সব সিঙ্ক।')}</p>
              </div>

              {/* Security */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(11,143,120,0.1)] text-[var(--bq26-emerald-bright)] flex items-center justify-center mb-4"><ShieldCheck className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Workspace isolation', 'ওয়ার্কস্পেস আইসোলেশন')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Multi-tenant sandboxing, encrypted link tokens and audit-oriented controls.', 'মাল্টি-টেন্যান্ট স্যান্ডবক্স, এনক্রিপ্টেড লিংক টোকেন আর অডিট-ভিত্তিক কন্ট্রোল।')}</p>
              </div>

              {/* Wide tile: reports w/ sparkline */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6 md:col-span-2 flex items-center justify-between gap-5">
                <div className="max-w-[60%]">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(20,184,166,0.1)] text-[var(--bq26-teal)] flex items-center justify-center mb-4"><BarChart3 className="w-5 h-5" /></div>
                  <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Reports that reconcile', 'মিলে-যাওয়া রিপোর্ট')}</h3>
                  <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Sales, P&L, due ledgers and inventory valuation — exportable to Excel and PDF.', 'সেলস, লাভ-ক্ষতি, বাকির লেজার আর ইনভেন্টরি ভ্যালুয়েশন — Excel ও PDF-এ এক্সপোর্ট।')}</p>
                </div>
                <svg viewBox="0 0 120 64" className="w-32 sm:w-40 h-auto shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="bq26-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--bq26-emerald)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--bq26-emerald)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,52 L15,44 L30,48 L45,34 L60,38 L75,24 L90,28 L105,14 L120,8 L120,64 L0,64 Z" fill="url(#bq26-spark)" />
                  <path d="M0,52 L15,44 L30,48 L45,34 L60,38 L75,24 L90,28 L105,14 L120,8" fill="none" stroke="var(--bq26-emerald)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="120" cy="8" r="3.5" fill="var(--bq26-teal)" />
                </svg>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== STATS BAND ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} className="relative py-14 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bq26-glass rounded-[2rem] px-6 py-9 grid grid-cols-2 lg:grid-cols-4 gap-8 bq26-edge-light">
            {[
              { value: 10, suffix: '+', label: tr('Business categories', 'ব্যবসার ধরন') },
              { value: 4, suffix: '', label: tr('Step billing flow', 'ধাপের বিলিং ফ্লো') },
              { value: 100, suffix: '%', label: tr('Offline capable', 'অফলাইন-সক্ষম') },
              { value: 0, prefix: '₹', label: tr('To get started', 'দিয়ে শুরু') }
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="bq26-display text-4xl sm:text-5xl font-bold bq26-grad-text font-numbers">
                  <AnimatedNumber value={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bq26-muted)] mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== SECTION: BUSINESS CATEGORIES (interactive) ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="categories" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="bq26-kicker">{tr('Industry-Tailored Workspaces', 'ইন্ডাস্ট্রি-অনুযায়ী ওয়ার্কস্পেস')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('Configured for your exact workflow', 'আপনার ব্যবসার হুবহু ওয়ার্কফ্লো অনুযায়ী কনফিগার করা')}
              </h2>
              <p className="text-sm text-[var(--bq26-text-soft)] font-medium mt-3">
                {tr('Pick a category and watch the workspace adapt — dynamic fields, labels and modules change with it.', 'একটা ক্যাটাগরি বেছে নিন — ডায়নামিক ফিল্ড, লেবেল আর মডিউল সেই অনুযায়ী বদলে যায়।')}
              </p>
            </div>

            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
              {/* Category selector */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                {businessCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`relative shrink-0 lg:shrink flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isActive
                        ? 'border-[rgba(11,143,120,0.4)] bg-[rgba(11,143,120,0.1)]'
                        : 'border-[var(--bq26-line-soft)] bg-[rgba(248,250,252,0.9)] hover:border-[rgba(11,143,120,0.25)]'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[rgba(11,143,120,0.18)] text-[var(--bq26-emerald-bright)]' : 'bg-[var(--bq26-sunken)] text-[var(--bq26-muted)]'}`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-black truncate ${isActive ? 'text-[var(--bq26-text)]' : 'text-[var(--bq26-text-soft)]'}`}>{cat.name}</span>
                        <span className="block text-[10px] font-bold text-[var(--bq26-muted)]">{cat.tag}</span>
                      </span>
                      {isActive && <motion.span layoutId="cat-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--bq26-emerald-bright)] shrink-0 hidden lg:block" />}
                    </button>
                  );
                })}
              </div>

              {/* Category preview */}
              <div className="bq26-tile rounded-3xl p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--bq26-emerald-bright)]">{activeCat.tag}</span>
                        <h3 className="bq26-display text-2xl font-bold text-[var(--bq26-text)] mt-1">{activeCat.name}</h3>
                      </div>
                      <span className="w-12 h-12 rounded-2xl bg-[rgba(11,143,120,0.1)] border border-[rgba(11,143,120,0.25)] text-[var(--bq26-emerald-bright)] flex items-center justify-center shrink-0">
                        {React.createElement(activeCat.icon, { className: 'w-6 h-6' })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--bq26-text-soft)] leading-relaxed mt-4">{activeCat.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {activeCat.fields.map((f) => (
                        <span key={f} className="px-3 py-1.5 rounded-full bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)] text-[10px] font-black text-[var(--bq26-text-soft)]">{f}</span>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-[var(--bq26-line-soft)] flex items-center gap-2 text-[11px] font-bold text-[var(--bq26-emerald-bright)]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {activeCat.highlight}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: WORKFLOW TIMELINE ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="workflow" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="bq26-kicker">{tr('End-to-End Lifecycle', 'সম্পূর্ণ লাইফসাইকেল')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('A streamlined 4-step flow', 'সহজ ৪ ধাপের ফ্লো')}
              </h2>
              <p className="text-sm text-[var(--bq26-text-soft)] font-medium mt-3">
                {tr('From fast draft creation to verified bank reconciliation.', 'দ্রুত ড্রাফট তৈরি থেকে যাচাইকৃত ব্যাংক রিকনসিলিয়েশন পর্যন্ত।')}
              </p>
            </div>

            <div className="relative">
              <div aria-hidden="true" className="bq26-rail" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {workflowSteps.map((ws) => {
                  const Icon = ws.icon;
                  return (
                    <div key={ws.step} className="relative pl-14 lg:pl-0">
                      <div className="absolute left-0 lg:relative lg:left-auto flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--bq26-sunken-strong)] border border-[rgba(11,143,120,0.35)] text-[var(--bq26-emerald-bright)] shadow-[0_0_24px_-6px_rgba(11,143,120,0.5)] z-10">
                        <Icon className="w-[18px] h-[18px]" />
                      </div>
                      <div className="bq26-tile rounded-2xl p-5 h-full">
                        <span className="text-2xl font-black font-numbers text-[rgba(11,143,120,0.25)]">{ws.step}</span>
                        <h3 className="text-sm font-black text-[var(--bq26-text)] mt-1.5">{ws.title}</h3>
                        <p className="text-xs text-[var(--bq26-muted)] font-medium leading-relaxed mt-2">{ws.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: PAYMENTS ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="payments" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 space-y-5 order-2 lg:order-1">
              <p className="bq26-kicker">{tr('Frictionless Payment Rails', 'ঘর্ষণহীন পেমেন্ট রেল')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)]">
                {tr('Instant UPI QR & ', 'তাৎক্ষণিক UPI QR ও ')}
                <span className="bq26-grad-text">{tr('real-time proof verification', 'রিয়েল-টাইম প্রমাণ যাচাই')}</span>
              </h2>
              <p className="text-sm text-[var(--bq26-text-soft)] font-medium leading-relaxed">
                {tr('Share live digital invoices with your customers. They scan standard UPI QR codes, transfer funds, and upload confirmation receipts. You verify and approve with a single tap.', 'কাস্টমারকে লাইভ ডিজিটাল ইনভয়েস পাঠান। তারা UPI QR স্ক্যান করে টাকা পাঠায়, কনফার্মেশন রসিদ আপলোড করে। আপনি এক ট্যাপে যাচাই করে অনুমোদন দেন।')}
              </p>
              <div className="space-y-3 pt-2">
                {[
                  [CreditCard, tr('Dynamic QR codes on web links & PDF documents', 'ওয়েব লিংক ও PDF-এ ডাইনামিক QR কোড')],
                  [ShieldCheck, tr('Idempotent proof verification prevents duplicate credits', 'আইডেম্পোটেন্ট প্রমাণ-যাচাই — ডুপ্লিকেট ক্রেডিট অসম্ভব')],
                  [MessageCircle, tr('One-click WhatsApp invoice dispatch', 'এক ক্লিকে WhatsApp-এ ইনভয়েস পাঠানো')],
                  [Printer, tr('A4 / A5 thermal-friendly print layouts', 'A4 / A5 থার্মাল-বান্ধব প্রিন্ট লেআউট')]
                ].map(([Icon, text]) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)] flex items-center justify-center text-[var(--bq26-emerald-bright)] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[var(--bq26-text-soft)]">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment mock */}
            <div className="flex-1 w-full max-w-md order-1 lg:order-2">
              <div className="bq26-cockpit rounded-[2rem] p-6 relative">
                <div className="text-center p-5 rounded-2xl bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)]">
                  <div className="w-36 h-36 mx-auto bq26-qr-cell rounded-2xl border border-[rgba(11,143,120,0.25)] p-2.5 grid grid-cols-8 grid-rows-8 gap-[2px]">
                    {[
                      1,1,1,1,0,1,1,0, 1,0,0,1,0,0,1,1, 1,1,0,0,1,1,0,1, 0,1,1,0,0,1,1,0,
                      1,0,1,1,1,0,0,1, 0,1,0,1,0,1,1,0, 1,1,1,0,1,0,1,1, 0,0,1,1,0,1,1,1
                    ].map((on, i) => <span key={i} className={on ? 'bg-[rgba(11,143,120,0.8)] rounded-[1px]' : ''} />)}
                  </div>
                  <p className="text-xs font-black text-[var(--bq26-text)] mt-4">{tr('Scan with GPay / PhonePe / Paytm', 'GPay / PhonePe / Paytm দিয়ে স্ক্যান করুন')}</p>
                  <p className="text-[10px] text-[var(--bq26-muted)] font-numbers mt-1">UPI ID: business@bank</p>
                </div>
                <div className="flex justify-between items-center mt-4 px-1.5">
                  <span className="text-xs font-bold text-[var(--bq26-muted)]">{tr('Invoice amount', 'ইনভয়েসের অঙ্ক')}</span>
                  <span className="font-black text-[var(--bq26-text)] font-numbers text-lg">₹4,200.00</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: PRICING ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="pricing" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="bq26-kicker">{tr('Simple, Honest Pricing', 'সহজ, সৎ প্রাইসিং')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('Start free. Upgrade when you grow.', 'ফ্রি শুরু করুন। বড় হলে আপগ্রেড।')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
              {/* Free */}
              <div className="bq26-tile rounded-3xl p-7 flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--bq26-muted)]">{tr('Starter', 'স্টার্টার')}</p>
                <div className="flex items-end gap-1.5 mt-3">
                  <span className="bq26-display text-4xl font-bold text-[var(--bq26-text)]">₹0</span>
                  <span className="text-xs font-bold text-[var(--bq26-muted)] mb-1.5">{tr('forever', 'চিরকাল')}</span>
                </div>
                <ul className="space-y-2.5 mt-6 text-xs font-bold text-[var(--bq26-text-soft)] flex-1">
                  {[
                    tr('10 invoices', '১০টি ইনভয়েস'),
                    tr('5 customers', '৫টি কাস্টমার'),
                    tr('10 products', '১০টি প্রোডাক্ট'),
                    tr('1 user', '১ জন ইউজার'),
                    tr('UPI QR & live links', 'UPI QR ও লাইভ লিংক')
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="mt-7 w-full py-3 rounded-full border border-[var(--bq26-line)] text-[var(--bq26-text)] text-xs font-black hover:bg-[rgba(11,143,120,0.08)] transition-colors">
                  {tr('Start Free', 'ফ্রি শুরু করুন')}
                </button>
              </div>

              {/* Pro */}
              <div className="bq26-tile rounded-3xl p-7 flex flex-col relative border-[rgba(11,143,120,0.4)] bg-[rgba(255,255,255,0.9)] shadow-[0_30px_80px_-30px_rgba(11,143,120,0.25)]">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-[var(--bq26-emerald-bright)] to-[var(--bq26-teal)] text-white">
                  {tr('Most Popular', 'সবচেয়ে জনপ্রিয়')}
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--bq26-emerald-bright)] flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Pro</p>
                <div className="flex items-end gap-1.5 mt-3">
                  <span className="bq26-display text-4xl font-bold bq26-grad-text font-numbers">₹499</span>
                  <span className="text-xs font-bold text-[var(--bq26-muted)] mb-1.5">{tr('/ month', '/ মাস')}</span>
                </div>
                <ul className="space-y-2.5 mt-6 text-xs font-bold text-[var(--bq26-text-soft)] flex-1">
                  {[
                    tr('500 invoices', '৫০০টি ইনভয়েস'),
                    tr('200 customers', '২০০টি কাস্টমার'),
                    tr('500 products', '৫০০টি প্রোডাক্ট'),
                    tr('3 users', '৩ জন ইউজার'),
                    tr('Premium themes', 'প্রিমিয়াম থিম'),
                    tr('Customer portal & payment links', 'কাস্টমার পোর্টাল ও পেমেন্ট লিংক'),
                    tr('AI Bill Creator', 'AI বিল ক্রিয়েটর')
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="bq26-beam mt-7">
                  <span className="bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] w-full py-3 text-xs font-black flex items-center justify-center transition-colors">
                    {tr('Go Pro', 'প্রো নিন')}
                  </span>
                </button>
              </div>

              {/* Lifetime */}
              <div className="bq26-tile rounded-3xl p-7 flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--bq26-gold)] flex items-center gap-1.5"><InfinityIcon className="w-3.5 h-3.5" /> {tr('Lifetime', 'লাইফটাইম')}</p>
                <div className="flex items-end gap-1.5 mt-3">
                  <span className="bq26-display text-4xl font-bold text-[var(--bq26-text)] font-numbers">₹14,999</span>
                  <span className="text-xs font-bold text-[var(--bq26-muted)] mb-1.5">{tr('once', 'একবার')}</span>
                </div>
                <ul className="space-y-2.5 mt-6 text-xs font-bold text-[var(--bq26-text-soft)] flex-1">
                  {[
                    tr('Everything in Pro', 'প্রো-র সবকিছু'),
                    tr('Pay once, use forever', 'একবার পে করুন, চিরকাল ব্যবহার'),
                    tr('Unlimited invoices', 'আনলিমিটেড ইনভয়েস'),
                    tr('Priority support', 'প্রায়োরিটি সাপোর্ট')
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--bq26-gold)] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="mt-7 w-full py-3 rounded-full border border-[rgba(227,201,143,0.3)] text-[var(--bq26-gold)] text-xs font-black hover:bg-[rgba(227,201,143,0.08)] transition-colors">
                  {tr('Claim Lifetime', 'লাইফটাইম নিন')}
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] font-bold text-[var(--bq26-muted)] mt-6">
              {tr('Plans are managed inside the app — upgrade anytime via UPI. Quarterly (₹1,299) and yearly (₹4,999) options available.', 'প্ল্যান অ্যাপের ভিতরে ম্যানেজ হয় — যেকোনো সময় UPI-তে আপগ্রেড করুন। কোয়ার্টারলি (₹১,২৯৯) ও ইয়ারলি (₹৪,৯৯৯) অপশন আছে।')}
            </p>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: OFFLINE & SECURITY ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="platform" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bq26-tile rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(227,201,143,0.1)] border border-[rgba(227,201,143,0.25)] text-[var(--bq26-gold)] flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--bq26-text)]">{tr('Offline-First IndexedDB Engine', 'অফলাইন-ফার্স্ট IndexedDB ইঞ্জিন')}</h3>
              <p className="text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium">
                {tr('Network drops in your shop will never interrupt your billing counter. BillQyro saves every invoice locally with cryptographic idempotency and automatically reconciles when internet restores.', 'দোকানে নেটওয়ার্ক চলে গেলেও বিলিং কাউন্টার থামবে না। BillQyro প্রতিটি ইনভয়েস লোকালি সেভ করে রাখে, ইন্টারনেট ফিরলেই সব অটোমেটিক সিঙ্ক হয়ে যায়।')}
              </p>
              <div className="text-[11px] font-bold text-[var(--bq26-emerald-bright)] flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4" /> {tr('Zero data loss guarantee during outages', 'নেটওয়ার্ক গেলেও ডেটা-লস শূন্য')}
              </div>
            </div>

            <div className="bq26-tile rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(11,143,120,0.1)] border border-[rgba(11,143,120,0.25)] text-[var(--bq26-emerald-bright)] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--bq26-text)]">{tr('Workspace Isolation & Security', 'ওয়ার্কস্পেস আইসোলেশন ও সিকিউরিটি')}</h3>
              <p className="text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium">
                {tr('Strict multi-tenant security architecture. Each business branch and workspace has dedicated data partition rules, encrypted token hashes for public links, and full audit logging.', 'কঠোর মাল্টি-টেন্যান্ট সিকিউরিটি আর্কিটেকচার। প্রতিটি ব্রাঞ্চ ও ওয়ার্কস্পেসের আলাদা ডেটা-পার্টিশন নিয়ম, পাবলিক লিংকের এনক্রিপ্টেড টোকেন হ্যাশ আর পূর্ণ অডিট লগ।')}
              </p>
              <div className="text-[11px] font-bold text-[var(--bq26-emerald-bright)] flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4" /> {tr('Firebase 256-bit encryption in-transit & at rest', 'Firebase ২৫৬-বিট এনক্রিপশন — চলার পথে ও সংরক্ষণে')} <span className="text-[9px] text-[var(--bq26-muted)]">(<a href="https://firebase.google.com/docs/firestore/security" target="_blank" rel="noopener noreferrer" className="underline">source</a>)</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: FAQ ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="faq" className="relative py-20 px-4 sm:px-8 lg:px-12 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="bq26-kicker">{tr('Clear & Transparent', 'পরিষ্কার ও স্বচ্ছ')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('Frequently asked questions', 'সাধারণ প্রশ্ন ও উত্তর')}
              </h2>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bq26-tile rounded-2xl overflow-hidden !transform-none">
                  <button
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 font-bold text-sm text-[var(--bq26-text)] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180 text-[var(--bq26-emerald-bright)]' : 'text-[var(--bq26-muted)]'}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium border-t border-[var(--bq26-line-soft)] pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: TESTIMONIALS ===== */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative py-20 px-4 sm:px-8 lg:px-12 z-10"
      >
        <ScrollReveal yOffset={28}>
          <div className="max-w-[1536px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="bq26-kicker">{tr('Trusted by Businesses', 'ব্যবসায়ীদের আস্থা')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('What Our Customers Say', 'আমাদের ব্যবহারকারীরা যা বলেন')}
              </h2>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.15
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4 custom-scrollbar"
            >
              {testimonials.map((item, i) => (
                <TestimonialCard
                  key={i}
                  name={item.name}
                  business={item.business}
                  quote={item.quote}
                  rating={item.rating}
                  avatarUrl={item.avatarUrl}
                />
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== SECTION: AUTH / LOGIN ===== */}
      <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }} id="login" className="relative py-10 sm:py-12 px-4 sm:px-8 lg:px-12 z-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[rgba(11,143,120,0.07)] to-transparent pointer-events-none" />
        <ScrollReveal yOffset={24}>
          <div className="max-w-[1536px] mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-start relative">
            <div className="text-center lg:text-left pt-4">
              <p className="bq26-kicker">{tr('Ready when you are', 'আপনি প্রস্তুত হলেই')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-2">
                {tr('Bring your billing desk into focus.', 'আপনার বিলিং ডেস্ককে গুছিয়ে নিন।')}
              </h2>
              <p className="text-xs text-[var(--bq26-text-soft)] mt-3 font-medium leading-relaxed">
                {tr('Log into your existing business account or register a new workspace in seconds.', 'আপনার ব্যবসার অ্যাকাউন্টে লগইন করুন, বা কয়েক সেকেন্ডে নতুন ওয়ার্কস্পেস খুলে ফেলুন।')}
              </p>
              <div className="hidden lg:grid grid-cols-3 gap-3 mt-8">
                {[
                  [tr('Setup', 'সেটআপ'), tr('Business workspace', 'বিজনেস ওয়ার্কস্পেস')],
                  [tr('Operate', 'পরিচালনা'), tr('Invoice & collect', 'ইনভয়েস ও আদায়')],
                  [tr('Grow', 'বৃদ্ধি'), tr('Measure & improve', 'মাপুন ও উন্নত করুন')]
                ].map(([k, v]) => (
                  <div key={k} className="p-4 rounded-2xl bq26-glass">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--bq26-emerald-bright)]">{k}</p>
                    <p className="text-xs font-bold text-[var(--bq26-text-soft)] mt-1">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <div className="bq26-glass-strong rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(11,143,120,0.15)] ring-1 ring-inset ring-white/20 bq26-edge-light relative">
                <div className="relative flex bg-[var(--bq26-sunken-strong)] p-1.5 rounded-2xl border border-[var(--bq26-line-soft)] mb-8">
                  <motion.div 
                    layoutId="tab-pill"
                    className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-[#0B8F78] to-[#097a66] shadow-md"
                    initial={false}
                    animate={{
                      left: portalMode === 'business' ? '0.375rem' : 'calc(50% + 0.1875rem)',
                      width: 'calc(50% - 0.5625rem)'
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                  <button
                    onClick={() => setPortalMode('business')}
                    className={`relative flex-1 py-3 text-xs font-bold rounded-xl transition-all z-10 ${portalMode === 'business' ? 'text-white drop-shadow-sm' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {tr('Business Login / Register', 'বিজনেস লগইন / রেজিস্টার')}
                  </button>
                  <button
                    onClick={() => setPortalMode('customer')}
                    className={`relative flex-1 py-3 text-xs font-bold rounded-xl transition-all z-10 ${portalMode === 'customer' ? 'text-white drop-shadow-sm' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {tr('Customer Portal', 'কাস্টমার পোর্টাল')}
                  </button>
                </div>

                {/* Scoped dark emerald theme so the embedded forms match the landing */}
                <div className={landingMode === 'light' ? '' : 'dark'} data-theme="emerald-royal">
                  {portalMode === 'business' ? (
                    <Suspense fallback={<div className="p-10 flex justify-center"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>}>
                      <Login onLoginSuccess={onLoginSuccess} embedded={true} />
                    </Suspense>
                  ) : (
                    <Suspense fallback={<div className="p-10 flex justify-center"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>}>
                      <CustomerPortalLogin
                        embedded={true}
                        onVerificationSuccess={(id, phone) => {
                          sessionStorage.setItem('billqyro_customer_portal_id', id);
                          sessionStorage.setItem('billqyro_customer_portal_phone', phone);
                          window.location.href = `/customer/${id}`;
                        }}
                      />
                    </Suspense>
                  )}
                </div>

                {/* No-signup interactive demo access */}
                <div className="mt-8 pt-6 border-t border-[var(--bq26-line-soft)]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[rgba(11,143,120,0.04)] border border-dashed border-[rgba(11,143,120,0.25)] px-5 py-4 transition-colors hover:bg-[rgba(11,143,120,0.06)]">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(11,143,120,0.12)] border border-[rgba(11,143,120,0.25)] flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-[var(--bq26-emerald-bright)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-[var(--bq26-text)]">{tr('Not ready to register?', 'এখনই রেজিস্টার করবেন না?')}</p>
                        <p className="text-[11px] font-semibold text-[var(--bq26-text-soft)] mt-0.5">{tr('Tour the full platform with sample business data.', 'নমুনা ব্যবসার ডেটা দিয়ে পুরো প্ল্যাটফর্ম ঘুরে দেখুন।')}</p>
                      </div>
                    </div>
                    <button
                      onClick={launchLiveDemo}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B8F78] to-[#087763] text-white text-[13px] font-black hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0B8F78]/20 transition-all"
                    >
                      {tr('Launch Live Demo →', 'লাইভ ডেমো শুরু করুন →')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      {/* ===== PWA INSTALL NUDGE (Android native prompt / iOS guide) ===== */}
      <PwaInstallPrompt />

      {/* ===== FLOATING CONTACT CTAs (WhatsApp + direct call) ===== */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <a
          href={`tel:+${WHATSAPP_NUMBER}`}
          aria-label={tr('Call us', 'ফোন করুন')}
          title={tr('Call us', 'ফোন করুন')}
          className="group flex items-center justify-center h-11 w-11 rounded-full bg-[var(--bq26-card)] border border-[var(--bq26-line)] text-[var(--bq26-emerald-bright)] shadow-xl hover:scale-[1.05] active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lang === 'bn' ? 'হ্যালো BillQyro! প্ল্যাটফর্মটি সম্পর্কে জানতে চাই।' : 'Hi BillQyro! I would like to know more about the platform.')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tr('Chat on WhatsApp', 'WhatsApp-এ কথা বলুন')}
          className="group relative flex items-center gap-2.5 h-14 w-14 sm:w-auto sm:px-5 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-[1.04] active:scale-95 transition-transform"
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse -z-10 opacity-40" />
          <svg className="relative w-7 h-7 mx-auto sm:mx-0 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="hidden sm:block text-sm font-black tracking-tight">{tr('Chat with us', 'আমাদের সাথে কথা বলুন')}</span>
        </a>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="relative px-4 sm:px-8 lg:px-12 pt-8 sm:pt-10 pb-8 text-xs text-[var(--bq26-muted)] z-10 mt-auto">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(11,143,120,0.5)] to-transparent" />
        <div className="max-w-[1536px] mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-[var(--bq26-line-soft)]">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Logo type="horizontal" forceWhiteText={landingMode === 'dark'} textColorClass="text-[var(--bq26-text)]" />
              <p className="text-[11px] font-medium leading-relaxed max-w-[28ch] text-[var(--bq26-text-soft)]">
                {tr('The premium billing command center for small shops, studios and service businesses. Built in India 🇮🇳, made for the world.', 'ছোট দোকান, স্টুডিও আর সার্ভিস ব্যবসার জন্য প্রিমিয়াম বিলিং কমান্ড সেন্টার। ভারতে তৈরি 🇮🇳, সারা বিশ্বের জন্য।')}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)] text-[10px] font-bold text-[var(--bq26-text-soft)]">
                  <ShieldCheck className="w-3 h-3 text-[var(--bq26-emerald-bright)]" /> {tr('Secure Sync', 'সিকিউর সিঙ্ক')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)] text-[10px] font-bold text-[var(--bq26-text-soft)]">
                  <Zap className="w-3 h-3 text-[var(--bq26-gold)]" /> {tr('Offline First', 'অফলাইন ফার্স্ট')}
                </span>
              </div>
            </div>

            {/* Product column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bq26-text)]">{tr('Product', 'প্রোডাক্ট')}</p>
              <div className="space-y-2.5 font-semibold">
                <button onClick={() => scrollTo('platform')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Platform Tour', 'প্ল্যাটফর্ম ট্যুর')}</button>
                <button onClick={() => scrollTo('categories')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Business Categories', 'বিজনেস ক্যাটাগরি')}</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Pricing', 'প্রাইসিং')}</button>
                <button onClick={launchLiveDemo} className="block text-[var(--bq26-emerald-bright)] hover:opacity-80 transition-opacity">{tr('Live Demo', 'লাইভ ডেমো')}</button>
              </div>
            </div>

            {/* Resources column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bq26-text)]">{tr('Resources', 'রিসোর্স')}</p>
              <div className="space-y-2.5 font-semibold">
                <button onClick={() => scrollTo('faq')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('FAQ', 'সাধারণ প্রশ্ন')}</button>
                <a href="/support" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Help Center', 'হেল্প সেন্টার')}</a>
                <button onClick={() => scrollTo('payments')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Payment Collection', 'পেমেন্ট কালেকশন')}</button>
                <button onClick={() => scrollTo('workflow')} className="block hover:text-[var(--bq26-text)] transition-colors">{tr('How It Works', 'কীভাবে কাজ করে')}</button>
              </div>
            </div>

            {/* Legal column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bq26-text)]">{tr('Legal', 'লিগ্যাল')}</p>
              <div className="space-y-2.5 font-semibold">
                <a href="/about" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('About Us', 'আমাদের সম্পর্কে')}</a>
                <a href="/terms" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Terms of Service', 'সার্ভিসের শর্তাবলী')}</a>
                <a href="/privacy" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Privacy Policy', 'প্রাইভেসি পলিসি')}</a>
                <a href="/refund" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Refund Policy', 'রিফান্ড পলিসি')}</a>
                <a href="/data-deletion" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Data Deletion', 'ডেটা ডিলিশন')}</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
            <span className="text-[10px] font-bold">{tr('© 2026 BillQyro Platform · All rights reserved.', '© ২০২৬ BillQyro প্ল্যাটফর্ম · সর্বস্বত্ব সংরক্ষিত।')}</span>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/billqyro" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-[var(--bq26-text)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/company/billqyro" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[var(--bq26-text)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://youtube.com/@billqyro" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[var(--bq26-text)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://github.com/billqyro" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-[var(--bq26-text)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
            <div className="flex items-center gap-5 font-bold">
              <button onClick={() => scrollTo('login')} className="hover:text-[var(--bq26-text)] transition-colors">{tr('Sign In', 'সাইন ইন')}</button>
              <a href="mailto:support@billqyro.com" className="hover:text-[var(--bq26-text)] transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> support@billqyro.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
