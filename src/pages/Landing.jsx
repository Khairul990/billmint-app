import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Users, Sparkles,
  Download, Link2, Smartphone, Printer, CreditCard, ChevronDown,
  MessageCircle, Mail, MapPin, DollarSign, Clock, BarChart3, Globe,
  Zap, Lock, RefreshCw, Check, ArrowUpRight, FileSpreadsheet,
  Layers, Landmark, Scissors, Stethoscope, GraduationCap, Wrench, ShoppingBag, Languages
} from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import CustomerPortalLogin from '../components/portal/CustomerPortalLogin';
import HeroBackground from '../components/HeroBackground';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedNumber from '../components/AnimatedNumber';
import { AnimatedThemeToggler } from '../components/AnimatedThemeToggler';

// ── WhatsApp business number for the landing CTA ──────────────────────────
// ⚠️ এখানে তোমার নিজের WhatsApp নম্বর বসাও (country code সহ, '+' ছাড়া)।
// যেমন: ভারতের ৯৮৩০০ ০০০০০ নম্বরের জন্য '919830000000'
const WHATSAPP_NUMBER = '910000000000';

const Landing = ({ onLoginSuccess }) => {
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business'); // 'business' | 'customer'
  const [activePreviewTab, setActivePreviewTab] = useState('dashboard');
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
      generateDemoWorkspace();
      window.location.href = '/';
    } catch (e) {
      console.warn('Demo launch failed', e);
      localStorage.removeItem('billqyro_demo_session_active');
      localStorage.removeItem('billqyro_demo_journey_mode');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = window.pageYOffset + el.getBoundingClientRect().top - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const businessCategories = [
    {
      id: 'retail',
      name: tr('Retail & Supermarket', 'রিটেইল ও সুপারমার্কেট'),
      icon: ShoppingBag,
      tag: tr('Inventory & POS', 'ইনভেন্টরি ও POS'),
      desc: tr('Barcode scanning, product variants, real-time stock alert thresholds, and rapid itemized billing.', 'বারকোড স্ক্যানিং, প্রোডাক্ট ভ্যারিয়েন্ট, রিয়েল-টাইম স্টক অ্যালার্ট আর দ্রুত আইটেমাইজড বিলিং।'),
      highlight: tr('Auto-decrementing inventory & GST/VAT breakdowns', 'অটো-কমতে ইনভেন্টরি ও GST/VAT বিশ্লেষণ')
    },
    {
      id: 'tailor',
      name: tr('Tailoring & Boutiques', 'টেইলারিং ও বুটিক'),
      icon: Scissors,
      tag: tr('Custom Orders', 'কাস্টম অর্ডার'),
      desc: tr('Custom measurements, cloth swatch tracking, stitching stages, delivery dates, and advance payment logging.', 'কাস্টম মাপ, কাপড়ের নমুনা ট্র্যাকিং, সেলাইয়ের ধাপ, ডেলিভারির তারিখ আর অ্যাডভান্স পেমেন্টের হিসাব।'),
      highlight: tr('Order status lifecycle & measurement cards', 'অর্ডার স্টেটাস লাইফসাইকেল ও মাপের কার্ড')
    },
    {
      id: 'clinic',
      name: tr('Clinics & Healthcare', 'ক্লিনিক ও হেলথকেয়ার'),
      icon: Stethoscope,
      tag: tr('Patient CRM', 'পেশেন্ট CRM'),
      desc: tr('Patient history records, consultation fees, prescription attachments, and automated follow-up dues.', 'রোগীর ইতিহাস, কনসালটেশন ফি, প্রেসক্রিপশন অ্যাটাচমেন্ট আর অটোমেটিক ফলো-আপ বাকি।'),
      highlight: tr('Clinical disclaimer headers & patient ledger', 'ক্লিনিকাল ডিসক্লেইমার হেডার ও পেশেন্ট লেজার')
    },
    {
      id: 'repair',
      name: tr('Repair & Electronics', 'রিপেয়ার ও ইলেকট্রনিক্স'),
      icon: Wrench,
      tag: tr('Service Jobs', 'সার্ভিস জব'),
      desc: tr('Job-sheet numbers, problem diagnostics, replacement parts billing, labour estimates, and service warranty tracking.', 'জব-শিট নম্বর, সমস্যার ডায়াগনোসিস, পার্টস বিলিং, লেবার এস্টিমেট আর ওয়ারেন্টি ট্র্যাকিং।'),
      highlight: tr('Job-sheet lifecycle & parts breakdown', 'জব-শিট লাইফসাইকেল ও পার্টস ব্রেকডাউন')
    },
    {
      id: 'education',
      name: tr('Coaching & Education', 'কোচিং ও শিক্ষা'),
      icon: GraduationCap,
      tag: tr('Fee Management', 'ফি ম্যানেজমেন্ট'),
      desc: tr('Batch tracking, monthly tuition fee schedules, student admission records, and parent payment receipts.', 'ব্যাচ ট্র্যাকিং, মাসিক টিউশন ফি, শিক্ষার্থীর ভর্তির রেকর্ড আর অভিভাবকের পেমেন্ট রসিদ।'),
      highlight: tr('Monthly fee dues & student directory', 'মাসিক ফি বাকি ও শিক্ষার্থী ডিরেক্টরি')
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: tr('Create & Itemize', 'তৈরি ও আইটেম যোগ'),
      desc: tr('Add items in seconds with auto-complete product catalog, dynamic discounts, and regional tax computations.', 'অটো-কমপ্লিট প্রোডাক্ট ক্যাটালগ, ডাইনামিক ডিসকাউন্ট আর রিজিওনাল ট্যাক্স হিসাব দিয়ে সেকেন্ডেই আইটেম যোগ করুন।')
    },
    {
      step: '02',
      title: tr('Instant Live Link / PDF', 'সাথে সাথে লাইভ লিংক / PDF'),
      desc: tr('Generate pixel-perfect A4/A5 PDF documents and shareable encrypted web links for client self-service.', 'নিখুঁত A4/A5 PDF আর শেয়ারযোগ্য এনক্রিপ্টেড ওয়েব লিংক তৈরি করুন — কাস্টমার নিজেই দেখে নিতে পারবে।')
    },
    {
      step: '03',
      title: tr('Collect Payment via UPI / QR', 'UPI / QR-এ পেমেন্ট আদায়'),
      desc: tr('Clients scan dynamic QR codes, submit digital transaction proof, or pay on delivery with real-time feedback.', 'কাস্টমার QR স্ক্যান করে টাকা পাঠায়, ডিজিটাল প্রমাণ জমা দেয় — সবকিছুর রিয়েল-টাইম আপডেট পাবেন।')
    },
    {
      step: '04',
      title: tr('Reconciliation & Ledger', 'রিকনসিলিয়েশন ও লেজার'),
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

  return (
    <div className="billqyro-landing-premium billqyro-signature-brand min-h-screen bg-theme-app text-theme-primary font-sans selection:bg-theme-accent selection:text-white flex flex-col relative overflow-x-hidden" data-brand="billqyro">
      {/* Background Ambience */}
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-theme-app/30 via-transparent to-theme-app -z-10 pointer-events-none" />

      {/* ===== GLOBAL NAVIGATION BAR ===== */}
      <nav className={`fixed w-full top-3 z-50 transition-all duration-300 flex justify-center px-4`}>
        <div className={`w-full max-w-7xl rounded-full transition-all duration-300 px-6 h-14 sm:h-16 flex items-center justify-between ${isScrolled
            ? 'bg-theme-card/90 backdrop-blur-2xl border border-theme-border-soft shadow-xl'
            : 'bg-theme-card/40 backdrop-blur-md border border-theme-border-soft/60'
          }`}>
          <Logo type="horizontal" forceWhiteText={false} />

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            <button onClick={() => scrollTo('preview')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Platform', 'প্ল্যাটফর্ম')}</button>
            <button onClick={() => scrollTo('why-billqyro')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Why BillQyro', 'কেন BillQyro')}</button>
            <button onClick={() => scrollTo('categories')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Categories', 'ক্যাটাগরি')}</button>
            <button onClick={() => scrollTo('workflow')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Workflow', 'ওয়ার্কফ্লো')}</button>
            <button onClick={() => scrollTo('payments')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Payments', 'পেমেন্ট')}</button>
            <button onClick={() => scrollTo('offline-security')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('Security', 'নিরাপত্তা')}</button>
            <button onClick={() => scrollTo('faq')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors">{tr('FAQ', 'সাধারণ প্রশ্ন')}</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo('login')} className="text-[13px] font-semibold text-theme-muted hover:text-theme-primary transition-colors hidden sm:block">
              {tr('Sign In', 'সাইন ইন')}
            </button>
            <a
              href="/BillQyro-Setup.exe"
              download
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-theme-border-soft hover:bg-theme-surface hover:text-theme-primary text-theme-muted text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" /> {tr('Desktop App', 'ডেস্কটপ অ্যাপ')}
            </a>
            <button
              onClick={() => scrollTo('login')}
              className="btn-premium px-5 py-2 text-xs font-bold shadow-theme-glow"
            >
              {tr('Get Started Free', 'ফ্রি শুরু করুন')}
            </button>
            <button
              onClick={toggleLang}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              aria-label="Toggle language"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-surface text-[11px] font-black transition-all cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <AnimatedThemeToggler />

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-theme-primary focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-4 right-4 bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-2xl space-y-3 z-50 backdrop-blur-2xl"
          >
            <button onClick={toggleLang} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-surface border border-theme-border-soft text-xs font-black text-theme-accent">
              <Languages className="w-3.5 h-3.5" /> {lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            </button>
            <button onClick={() => scrollTo('preview')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Platform Preview', 'প্ল্যাটফর্ম প্রিভিউ')}</button>
            <button onClick={() => scrollTo('why-billqyro')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Why BillQyro', 'কেন BillQyro')}</button>
            <button onClick={() => scrollTo('categories')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Business Categories', 'বিজনেস ক্যাটাগরি')}</button>
            <button onClick={() => scrollTo('workflow')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Invoice Workflow', 'ইনভয়েস ওয়ার্কফ্লো')}</button>
            <button onClick={() => scrollTo('payments')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Payment Collections', 'পেমেন্ট কালেকশন')}</button>
            <button onClick={() => scrollTo('offline-security')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('Security & Offline', 'নিরাপত্তা ও অফলাইন')}</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">{tr('FAQ', 'সাধারণ প্রশ্ন')}</button>
            <button onClick={() => scrollTo('login')} className="w-full btn-premium py-2.5 text-sm mt-2">{tr('Sign In / Register', 'সাইন ইন / রেজিস্টার')}</button>
          </motion.div>
        )}
      </nav>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="relative min-h-[92vh] flex items-center pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-theme-surface-elevated border border-theme-border-soft shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-theme-secondary">
                {tr('BILLQYRO SIGNATURE · OFFICIAL EMERALD STANDARD', 'BILLQYRO সিগনেচার · অফিসিয়াল এমারল্ড স্ট্যান্ডার্ড')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[4.7rem] font-black tracking-[-0.045em] text-theme-primary leading-[1.02] max-w-3xl"
            >
              {tr('Smart Billing.', 'স্মার্ট বিলিং।')} <br />
              <span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)] bq-shimmer-text">
                {tr('Premium Invoicing Platform.', 'প্রিমিয়াম ইনভয়েসিং প্ল্যাটফর্ম।')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-theme-muted max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              {tr('A premium billing command center for modern businesses. Create beautiful invoices, collect faster, manage customer dues, and keep working even when the network disappears.', 'আধুনিক ব্যবসার জন্য প্রিমিয়াম বিলিং কমান্ড সেন্টার। সুন্দর ইনভয়েস তৈরি করুন, দ্রুত টাকা আদায় করুন, কাস্টমারের বাকি ম্যানেজ করুন — নেটওয়ার্ক চলে গেলেও কাজ থেমে থাকবে না।')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start"
            >
              <button
                onClick={() => scrollTo('login')}
                className="btn-premium px-8 py-3.5 text-base font-bold shadow-lg shadow-theme-glow flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {tr('Create Free Account', 'ফ্রি অ্যাকাউন্ট খুলুন')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('preview')}
                className="btn-premium-outline px-6 py-3.5 text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {tr('Explore Platform', 'প্ল্যাটফর্ম দেখুন')}
              </button>
              <button
                onClick={launchLiveDemo}
                className="px-6 py-3.5 text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-dashed border-theme-accent/40 text-theme-accent hover:bg-theme-accent-light transition-all"
                title="Explore the full platform with sample data — no signup required"
              >
                <Zap className="w-4 h-4" />
                {tr('Try Live Demo', 'লাইভ ডেমো দেখুন')}
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[11px] font-semibold text-theme-muted flex items-center gap-1.5 justify-center lg:justify-start"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {tr('Free forever plan · No credit card · Works offline', 'চিরকাল ফ্রি প্ল্যান · ক্রেডিট কার্ড লাগবে না · অফলাইনেও চলে')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-2 flex flex-wrap items-center gap-5 justify-center lg:justify-start text-theme-muted text-xs font-bold"
            >
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> {tr('Offline-Ready PWA', 'অফলাইন-রেডি PWA')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> {tr('Multi-Workspace', 'মাল্টি-ওয়ার্কস্পেস')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> {tr('Real-time Sync', 'রিয়েল-টাইম সিঙ্ক')}</span>
            </motion.div>
          </div>

          {/* Hero Interactive Cockpit Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-1 w-full max-w-xl relative"
          >
            <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-theme-accent/10 blur-3xl -z-10 bq-breathe pointer-events-none" />
            <div className="billqyro-hero-cockpit rounded-[2rem] border border-theme-accent/20 bg-theme-card/90 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              {/* Signature floating ornaments */}
              <div aria-hidden="true" className="absolute -left-3 top-16 z-20 hidden md:flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-theme-card/95 px-3 py-2 shadow-xl shadow-emerald-500/10 bq-float">
                <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-theme-primary">Payment Received</p>
                  <p className="text-[9px] font-bold text-emerald-500">UPI · just now</p>
                </div>
              </div>
              <div aria-hidden="true" className="absolute -right-4 top-40 z-20 hidden md:flex items-center gap-2 rounded-2xl border border-theme-accent/30 bg-theme-card/95 px-3 py-2 shadow-xl bq-float-delay">
                <span className="w-6 h-6 rounded-xl bg-theme-accent/15 text-theme-accent flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5" /></span>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-theme-primary">Revenue +18%</p>
                  <p className="text-[9px] font-bold text-theme-accent">this week</p>
                </div>
              </div>
              <div aria-hidden="true" className="absolute -bottom-5 left-10 z-20 hidden md:flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-theme-card/95 px-3 py-2 shadow-xl bq-float-slow">
                <span className="w-6 h-6 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5" /></span>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-theme-primary">Invoice shared</p>
                  <p className="text-[9px] font-bold text-amber-500">via WhatsApp</p>
                </div>
              </div>
              {/* Window Controls */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-soft/60">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="text-[10px] font-bold text-theme-muted px-2.5 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft">
                  app.billqyro.com · Live Cockpit
                </div>
                <div className="w-8"></div>
              </div>

              {/* Mini Dashboard Metrics */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <p className="text-[10px] font-bold text-theme-muted uppercase">Today's Revenue</p>
                  <p className="text-base font-black text-theme-primary font-numbers mt-0.5"><AnimatedNumber value={48250} prefix="₹" /></p>
                </div>
                <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <p className="text-[10px] font-bold text-theme-muted uppercase">Collections</p>
                  <p className="text-base font-black text-emerald-500 font-numbers mt-0.5"><AnimatedNumber value={42000} prefix="₹" /></p>
                </div>
                <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <p className="text-[10px] font-bold text-theme-muted uppercase">Due Amount</p>
                  <p className="text-base font-black text-amber-500 font-numbers mt-0.5"><AnimatedNumber value={6250} prefix="₹" /></p>
                </div>
              </div>

              {/* Sample Live Invoice Strip */}
              <div className="bg-theme-surface-elevated rounded-2xl p-4 border border-theme-border-soft/80 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded-md">INV-2026-0042</span>
                    <p className="text-sm font-black text-theme-primary mt-1">Apex Industrial Solutions</p>
                    <p className="text-[10px] text-theme-muted font-medium">3 Line Items · Standard B2B Invoice</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Paid Online
                  </span>
                </div>
                <div className="pt-2 border-t border-theme-border-soft flex items-center justify-between text-xs font-bold">
                  <span className="text-theme-muted">Total Settled</span>
                  <span className="text-theme-primary font-black font-numbers text-sm">₹18,400.00</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BRAND SIGNATURE STRIP ===== */}
      <section className="relative px-6 pb-10 -mt-2">
        <div className="max-w-7xl mx-auto">
          <div className="billqyro-brand-strip rounded-[2rem] border border-theme-accent/15 bg-theme-card/70 backdrop-blur-2xl px-5 py-4 sm:px-7 sm:py-5 shadow-premium">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-theme-accent-light border border-theme-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-theme-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-theme-accent">{tr('Official BillQyro Brand System','অফিসিয়াল BillQyro ব্র্যান্ড সিস্টেম')}</p>
                  <p className="text-xs sm:text-sm font-bold text-theme-primary mt-0.5">{tr('Signature Emerald · Financial clarity with a premium edge','সিগনেচার এমারল্ড · প্রিমিয়াম ছোঁয়ায় আর্থিক স্বচ্ছতা')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                <span className="brand-proof-pill">{tr('Local-first','লোকাল-ফার্স্ট')}</span><span className="brand-proof-pill">{tr('Live links','লাইভ লিংক')}</span><span className="brand-proof-pill">{tr('Secure sync','সিকিউর সিঙ্ক')}</span><span className="brand-proof-pill">{tr('Premium PDFs','প্রিমিয়াম PDF')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SIGNATURE CATEGORY MARQUEE ===== */}
      <section aria-label="Business categories" className="pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bq-marquee rounded-full border border-theme-border-soft bg-theme-surface/40 py-3">
            <div className="bq-marquee-track gap-3 pr-3">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-3 pr-3" aria-hidden={dup === 1}>
                  {[tr('Tailoring & Boutiques','টেইলারিং ও বুটিক'), tr('Retail & Supermarkets','রিটেইল ও সুপারমার্কেট'), tr('Clinics & Healthcare','ক্লিনিক ও হেলথকেয়ার'), tr('Repair & Electronics','রিপেয়ার ও ইলেকট্রনিক্স'), tr('Coaching & Education','কোচিং ও শিক্ষা'), tr('Embroidery Studios','এমব্রয়ডারি স্টুডিও'), tr('Cyber Cafes','সাইবার ক্যাফে'), tr('Salons & Parlours','সেলুন ও পার্লার'), tr('Wholesale Trading','হোলসেল ট্রেডিং'), tr('Freelancers','ফ্রিল্যান্সার')].map((cat) => (
                    <span key={cat + dup} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-theme-border-soft bg-theme-card px-4 py-1.5 text-[11px] font-black text-theme-secondary tracking-wide">
                      <Sparkles className="w-3 h-3 text-theme-accent" />
                      {cat}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: PRODUCT PREVIEW ===== */}
      <section id="preview" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30 relative">
        <ScrollReveal yOffset={28}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              {tr('Interactive Product Architecture', 'ইন্টারঅ্যাক্টিভ প্রোডাক্ট আর্কিটেকচার')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              {tr('Purpose-Built for Financial Clarity', 'আর্থিক স্বচ্ছতার জন্য বিশেষভাবে তৈরি')}
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              {tr('Inspect key workflows across our unified billing platform.', 'আমাদের একীভূত বিলিং প্ল্যাটফর্মের গুরুত্বপূর্ণ ওয়ার্কফ্লোগুলো দেখে নিন।')}
            </p>

            {/* Preview Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 p-1.5 bg-theme-card rounded-2xl border border-theme-border-soft max-w-fit mx-auto">
              {[
                { id: 'dashboard', label: 'Financial Command Center', icon: BarChart3 },
                { id: 'invoice-studio', label: 'Invoice Builder Studio', icon: FileSpreadsheet },
                { id: 'customer-360', label: 'Customer 360 & Ledger', icon: Users },
                { id: 'internal-bank', label: 'Internal Cash Ledger', icon: Landmark }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePreviewTab === tab.id
                      ? 'bg-theme-accent text-white shadow-sm'
                      : 'text-theme-muted hover:text-theme-primary'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Mockup Viewport */}
          <div className="rounded-3xl border border-theme-border-soft bg-theme-card p-6 sm:p-8 shadow-2xl max-w-5xl mx-auto">
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-theme-border-soft">
                  <div>
                    <h3 className="text-lg font-black text-theme-primary">{tr('Executive Summary & Cash Position','এক্সিকিউটিভ সামারি ও ক্যাশ পজিশন')}</h3>
                    <p className="text-xs text-theme-muted">Real-time ledger updates across all active workspaces</p>
                  </div>
                  <span className="text-[11px] font-bold text-theme-secondary bg-theme-surface px-3 py-1 rounded-lg border border-theme-border-soft">
                    Fiscal Period: Today
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted uppercase">Gross Invoiced</p>
                    <p className="text-2xl font-black text-theme-primary font-numbers mt-1">₹1,84,600</p>
                    <span className="text-[10px] font-bold text-emerald-500 mt-1 inline-block">↑ 14.2% vs last week</span>
                  </div>
                  <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted uppercase">Collected Funds</p>
                    <p className="text-2xl font-black text-emerald-500 font-numbers mt-1">₹1,56,000</p>
                    <span className="text-[10px] font-bold text-theme-muted mt-1 inline-block">84.5% Collection Rate</span>
                  </div>
                  <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted uppercase">Receivables Due</p>
                    <p className="text-2xl font-black text-amber-500 font-numbers mt-1">₹28,600</p>
                    <span className="text-[10px] font-bold text-amber-500 mt-1 inline-block">4 Invoices Pending</span>
                  </div>
                  <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted uppercase">Active Customers</p>
                    <p className="text-2xl font-black text-theme-primary font-numbers mt-1">142</p>
                    <span className="text-[10px] font-bold text-emerald-500 mt-1 inline-block">+8 New This Month</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'invoice-studio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-base font-black text-theme-primary">{tr('Invoice Studio Builder','ইনভয়েস স্টুডিও বিল্ডার')}</h3>
                  <div className="bg-theme-surface p-3.5 rounded-xl border border-theme-border-soft text-xs space-y-2">
                    <div className="flex justify-between font-bold text-theme-muted">
                      <span>Item</span>
                      <span>Qty × Rate</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between font-bold text-theme-primary py-1 border-t border-theme-border-soft/60">
                      <span>Commercial Consultation</span>
                      <span className="font-numbers">2 × ₹2,500</span>
                      <span className="font-numbers">₹5,000</span>
                    </div>
                    <div className="flex justify-between font-bold text-theme-primary py-1 border-t border-theme-border-soft/60">
                      <span>Custom Design Implementation</span>
                      <span className="font-numbers">1 × ₹12,000</span>
                      <span className="font-numbers">₹12,000</span>
                    </div>
                  </div>
                </div>
                <div className="bg-theme-surface-elevated p-4 rounded-2xl border border-theme-border-soft space-y-2 text-xs">
                  <p className="font-black text-sm text-theme-primary">Financial Computation</p>
                  <div className="flex justify-between text-theme-muted"><span>Subtotal</span><span className="font-numbers font-bold text-theme-primary">₹17,000.00</span></div>
                  <div className="flex justify-between text-theme-muted"><span>GST (18%)</span><span className="font-numbers font-bold text-theme-primary">₹3,060.00</span></div>
                  <div className="flex justify-between text-theme-muted"><span>Old Due</span><span className="font-numbers font-bold text-amber-500">₹1,500.00</span></div>
                  <div className="flex justify-between text-theme-muted"><span>Paid Now</span><span className="font-numbers font-bold text-emerald-500">-₹10,000.00</span></div>
                  <div className="flex justify-between pt-2 border-t border-theme-border-soft font-black text-sm text-theme-primary">
                    <span>Balance Due</span>
                    <span className="text-amber-500 font-numbers">₹11,560.00</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'customer-360' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-theme-border-soft">
                  <div>
                    <h3 className="text-base font-black text-theme-primary">{tr('Customer 360 & Lifetime Ledger','কাস্টমার ৩৬০ ও লাইফটাইম লেজার')}</h3>
                    <p className="text-xs text-theme-muted">Rahim Enterprises · Account ID: #CUST-9104</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Outstanding: ₹4,500
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted">Lifetime Invoiced</p>
                    <p className="text-lg font-black text-theme-primary font-numbers">₹64,500</p>
                  </div>
                  <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted">Lifetime Settled</p>
                    <p className="text-lg font-black text-emerald-500 font-numbers">₹60,000</p>
                  </div>
                  <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                    <p className="text-[10px] font-bold text-theme-muted">Payment Health</p>
                    <p className="text-lg font-black text-theme-primary">93% On-Time</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'internal-bank' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-theme-border-soft">
                  <div>
                    <h3 className="text-base font-black text-theme-primary">{tr('Internal Treasury & Cash Book','ইন্টারনাল ট্রেজারি ও ক্যাশ বুক')}</h3>
                    <p className="text-xs text-theme-muted">Real-time debit/credit transaction record</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-numbers">
                    Vault Balance: ₹1,42,800
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-theme-surface border border-theme-border-soft">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-theme-primary">Customer Payment · UPI (INV-0041)</span>
                    </div>
                    <span className="font-black text-emerald-500 font-numbers">+₹12,500.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-theme-surface border border-theme-border-soft">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="font-bold text-theme-primary">Store Rent & Utilities</span>
                    </div>
                    <span className="font-black text-rose-500 font-numbers">-₹8,000.00</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 3A: WHY BILLQYRO ===== */}
      <section id="why-billqyro" className="relative py-24 px-6 border-t border-theme-border-soft bg-theme-surface/20 overflow-hidden">
        <ScrollReveal yOffset={28}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-28">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">{tr('The BillQyro Difference','BillQyro-এর পার্থক্য')}</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-theme-primary leading-[1.05] mt-4">
                {tr('One system for the work that happens after the sale.', 'বিক্রির পরের সব কাজের জন্য একটাই সিস্টেম।')}
              </h2>
              <p className="text-sm sm:text-base text-theme-muted font-medium leading-relaxed mt-5 max-w-lg">
                {tr('Billing is only the beginning. BillQyro connects invoices, payments, customer balances, live links, reports and workspace controls into one disciplined operating layer.','বিলিং তো শুধু শুরু। BillQyro ইনভয়েস, পেমেন্ট, কাস্টমার ব্যালেন্স, লাইভ লিংক, রিপোর্ট আর ওয়ার্কস্পেস কন্ট্রোল — সব জুড়ে দেয় একটা সুশৃঙ্খল অপারেটিং লেয়ারে।')}
              </p>
              <button onClick={() => scrollTo('preview')} className="mt-7 inline-flex items-center gap-2 text-xs font-black text-theme-accent hover:gap-3 transition-all">
                {tr('See the platform in action', 'প্ল্যাটফর্মটি লাইভ দেখুন')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Zap className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">01 · Speed</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">{tr('Fast enough for the counter','কাউন্টারের গতিতে দ্রুত')}</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Optimistic local saves and focused workflows keep everyday billing responsive instead of form-heavy.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Layers className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">02 · Control</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">{tr('Everything stays connected','সবকিছু একসাথে যুক্ত')}</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Invoice totals, payments, customer dues and reporting are designed around the same financial source of truth.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><ShieldCheck className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">03 · Trust</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">{tr('Built around safe boundaries','নিরাপদ সীমানায় তৈরি')}</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Workspace isolation, authenticated access and audit-oriented controls make business data easier to govern.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Sparkles className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">04 · Presentation</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">{tr('A brand customers remember','কাস্টমারের মনে থাকা ব্র্যান্ড')}</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Premium invoice layouts, polished live links and a consistent visual system make every customer touchpoint feel intentional.</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 3B: PLATFORM PILLARS ===== */}
      <section className="py-24 px-6 border-t border-theme-border-soft bg-theme-app">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">{tr('Platform Architecture','প্ল্যাটফর্ম আর্কিটেকচার')}</span>
              <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">{tr('Every operational layer, designed to work together.','প্রতিটি অপারেশনাল লেয়ার, একসাথে কাজ করার জন্য ডিজাইন করা।')}</h2>
            </div>
            <p className="text-xs sm:text-sm text-theme-muted max-w-md leading-relaxed">
              From first draft to final collection, the platform keeps the workflow visible, structured and measurable.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              ['01', 'Invoice Studio', 'Create polished invoices, estimates and documents.'],
              ['02', 'Live Customer Links', 'Give customers a clean place to view, verify and act.'],
              ['03', 'Collections & Ledgers', 'Track paid, partial, due and overdue amounts clearly.'],
              ['04', 'Reports & Control', 'Turn daily activity into a reliable operating picture.']
            ].map(([n, t, d]) => (
              <div key={n} className="group relative min-h-[190px] p-5 sm:p-6 rounded-3xl border border-theme-border-soft bg-theme-card hover:border-theme-accent/30 hover:-translate-y-1 transition-all duration-300">
                <span className="text-4xl font-black text-theme-accent/20 font-numbers">{n}</span>
                <h3 className="text-base font-black text-theme-primary mt-7">{t}</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">{d}</p>
                <ArrowUpRight className="absolute right-5 bottom-5 w-4 h-4 text-theme-accent opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: BUSINESS CATEGORIES ===== */}
      <section id="categories" className="py-20 px-6 border-t border-theme-border-soft bg-theme-app">
        <ScrollReveal yOffset={28}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              {tr('Industry Tailored Workspaces', 'ইন্ডাস্ট্রি-অনুযায়ী ওয়ার্কস্পেস')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              {tr('Configured for Your Exact Business Workflow', 'আপনার ব্যবসার হুবহু ওয়ার্কফ্লো অনুযায়ী কনফিগার করা')}
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              {tr('Switch seamlessly between business modes. Dynamic fields adapt to retail, healthcare, garment tailoring, and education.', 'ব্যবসার ধরন বদলান এক ক্লিকে। রিটেইল, হেলথকেয়ার, জামাকাপড়ের টেইলারিং বা শিক্ষা — ডাইনামিক ফিল্ড নিজে নিজে বদলে যায়।')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {businessCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="bg-theme-card rounded-2xl border border-theme-border-soft p-5 flex flex-col justify-between hover:border-theme-accent/40 transition-all hover:shadow-md group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-theme-accent uppercase tracking-wider block mb-1">
                      {cat.tag}
                    </span>
                    <h3 className="text-base font-black text-theme-primary mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-theme-muted leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-theme-border-soft/60">
                    <p className="text-[10px] font-bold text-theme-secondary">
                      ✓ {cat.highlight}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 4: INVOICE WORKFLOW ===== */}
      <section id="workflow" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30">
        <ScrollReveal yOffset={28}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              {tr('End-to-End Lifecycle', 'সম্পূর্ণ লাইফসাইকেল')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              {tr('Streamlined 4-Step Billing Flow', 'সহজ ৪ ধাপের বিলিং ফ্লো')}
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              {tr('From fast draft creation to verified bank reconciliation.', 'দ্রুত ড্রাফট তৈরি থেকে যাচাইকৃত ব্যাংক রিকনসিলিয়েশন পর্যন্ত।')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((ws, i) => (
              <div key={i} className="bg-theme-card p-6 rounded-2xl border border-theme-border-soft relative shadow-sm">
                <span className="text-3xl font-black text-theme-accent/30 font-numbers block mb-2">{ws.step}</span>
                <h3 className="text-base font-black text-theme-primary mb-2">{ws.title}</h3>
                <p className="text-xs text-theme-muted font-medium leading-relaxed">{ws.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 5: PAYMENT COLLECTION ===== */}
      <section id="payments" className="py-20 px-6 border-t border-theme-border-soft bg-theme-app">
        <ScrollReveal yOffset={28}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
              {tr('Frictionless Payment Rails', 'ঘর্ষণহীন পেমেন্ট রেল')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight">
              {tr('Instant UPI QR & Real-Time Proof Verification', 'তাৎক্ষণিক UPI QR ও রিয়েল-টাইম প্রমাণ যাচাই')}
            </h2>
            <p className="text-sm text-theme-muted font-medium leading-relaxed">
              {tr('Share live digital invoices with your customers. They scan standard UPI QR codes, transfer funds, and upload confirmation receipts. You verify and approve with a single tap.','কাস্টমারকে লাইভ ডিজিটাল ইনভয়েস পাঠান। তারা UPI QR স্ক্যান করে টাকা পাঠায়, কনফার্মেশন রসিদ আপলোড করে। আপনি এক ট্যাপে যাচাই করে অনুমোদন দেন।')}
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-accent">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary">{tr('Dynamic QR Codes on Web Links & PDF documents','ওয়েব লিংক ও PDF-এ ডাইনামিক QR কোড')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-accent">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary">Idempotent proof verification prevents duplicate credits</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-accent">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary">Direct 1-Click WhatsApp Invoice Dispatch</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-xl">
            <div className="text-center p-4 bg-theme-surface rounded-2xl border border-theme-border-soft mb-4">
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-sm flex items-center justify-center">
                <div className="w-full h-full border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400">
                  <CreditCard className="w-8 h-8 text-slate-800" />
                  <span className="text-[8px] font-bold text-slate-800 mt-1">UPI QR CODE</span>
                </div>
              </div>
              <p className="text-xs font-black text-theme-primary mt-3">Scan with Google Pay / PhonePe / Paytm</p>
              <p className="text-[10px] text-theme-muted font-numbers">UPI ID: business@bank</p>
            </div>
            <div className="flex justify-between items-center text-xs font-bold px-1">
              <span className="text-theme-muted">Invoice Amount</span>
              <span className="font-black text-theme-primary font-numbers text-sm">₹4,200.00</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 6: OFFLINE & SECURITY ===== */}
      <section id="offline-security" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30">
        <ScrollReveal yOffset={28}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-theme-card p-8 rounded-3xl border border-theme-border-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-theme-primary">{tr('Offline-First IndexedDB Engine','অফলাইন-ফার্স্ট IndexedDB ইঞ্জিন')}</h3>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">
              {tr('Network drops in your shop will never interrupt your billing counter. BillQyro saves every invoice locally with cryptographic idempotency and automatically reconciles when internet restores.','দোকানে নেটওয়ার্ক চলে গেলেও বিলিং কাউন্টার থামবে না। BillQyro প্রতিটি ইনভয়েস লোকালি সেভ করে রাখে, ইন্টারনেট ফিরলেই সব অটোমেটিক সিঙ্ক হয়ে যায়।')}
            </p>
            <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 pt-2">
              <Check className="w-4 h-4" /> Zero data loss guarantee during network outages
            </div>
          </div>

          <div className="bg-theme-card p-8 rounded-3xl border border-theme-border-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-theme-primary">Workspace Isolation & Security</h3>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">
              Strict multi-tenant security architecture. Each business branch and workspace has dedicated data partition rules, encrypted token hashes for public links, and full audit logging.
            </p>
            <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 pt-2">
              <Check className="w-4 h-4" /> Firebase 256-bit encryption in-transit and at rest
            </div>
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 7: FAQ ===== */}
      <section id="faq" className="py-20 px-6 border-t border-theme-border-soft bg-theme-app">
        <ScrollReveal yOffset={28}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              {tr('Clear & Transparent', 'পরিষ্কার ও স্বচ্ছ')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              {tr('Frequently Asked Questions', 'সাধারণ প্রশ্ন ও উত্তর')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-theme-card rounded-2xl border border-theme-border-soft overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center font-bold text-sm text-theme-primary"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${faqOpen === idx ? 'rotate-180 text-theme-accent' : 'text-theme-muted'}`} />
                </button>
                {faqOpen === idx && (
                  <div className="p-5 pt-0 text-xs text-theme-muted leading-relaxed font-medium border-t border-theme-border-soft/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== SECTION 8: AUTH / LOGIN SECTION ===== */}
      <section id="login" className="relative border-t border-theme-border-soft bg-theme-surface/50 py-24 px-6 z-10 overflow-hidden">
        <ScrollReveal yOffset={24}>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-theme-accent/10 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-start relative">
          <div className="text-center lg:text-left pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">{tr('Ready when you are','আপনি প্রস্তুত হলেই')}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-2">{tr('Bring your billing desk into focus.','আপনার বিলিং ডেস্ককে গুছিয়ে নিন।')}</h2>
            <p className="text-xs text-theme-muted mt-2 font-medium leading-relaxed">{tr('Log into your existing business account or register a new workspace in seconds.','আপনার ব্যবসার অ্যাকাউন্টে লগইন করুন, বা কয়েক সেকেন্ডে নতুন ওয়ার্কস্পেস খুলে ফেলুন।')}</p>
            <div className="hidden lg:block mt-8">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Setup</p><p className="text-xs font-bold text-theme-primary mt-1">Business workspace</p></div>
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Operate</p><p className="text-xs font-bold text-theme-primary mt-1">Invoice & collect</p></div>
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Grow</p><p className="text-xs font-bold text-theme-primary mt-1">Measure & improve</p></div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-theme-card/95 rounded-[2rem] border border-theme-border-soft p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border-soft mb-6">
                <button
                  onClick={() => setPortalMode('business')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${portalMode === 'business'
                      ? 'bg-theme-accent text-white shadow-md'
                      : 'text-theme-muted hover:text-theme-primary'
                    }`}
                >
                  {tr('Business Login / Register', 'বিজনেস লগইন / রেজিস্টার')}
                </button>
                <button
                  onClick={() => setPortalMode('customer')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${portalMode === 'customer'
                      ? 'bg-theme-accent text-white shadow-md'
                      : 'text-theme-muted hover:text-theme-primary'
                    }`}
                >
                  {tr('Customer Portal', 'কাস্টমার পোর্টাল')}
                </button>
              </div>

              {portalMode === 'business' ? (
                <Login onLoginSuccess={onLoginSuccess} embedded={true} />
              ) : (
                <CustomerPortalLogin
                  embedded={true}
                  onVerificationSuccess={(id, phone) => {
                    sessionStorage.setItem('billqyro_customer_portal_id', id);
                    sessionStorage.setItem('billqyro_customer_portal_phone', phone);
                    window.location.href = `/customer/${id}`;
                  }}
                />
              )}

              {/* No-signup interactive demo access */}
              <div className="mt-5 pt-5 border-t border-theme-border-soft">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-theme-surface border border-dashed border-theme-accent/30 px-4 py-3.5">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="w-9 h-9 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-theme-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-theme-primary">{tr('Not ready to register?','এখনই রেজিস্টার করবেন না?')}</p>
                      <p className="text-[11px] font-semibold text-theme-muted mt-0.5">{tr('Tour the full platform with sample business data.','নমুনা ব্যবসার ডেটা দিয়ে পুরো প্ল্যাটফর্ম ঘুরে দেখুন।')}</p>
                    </div>
                  </div>
                  <button
                    onClick={launchLiveDemo}
                    className="shrink-0 px-4 py-2 rounded-xl bg-theme-accent text-white text-xs font-black hover:opacity-90 transition-opacity shadow-md shadow-theme-glow/40"
                  >
                    {tr('Launch Live Demo →', 'লাইভ ডেমো শুরু করুন →')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
      </section>

      {/* ===== FLOATING WHATSAPP CTA ===== */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lang === 'bn' ? 'হ্যালো BillQyro! প্ল্যাটফর্মটি সম্পর্কে জানতে চাই।' : 'Hi BillQyro! I would like to know more about the platform.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tr('Chat on WhatsApp', 'WhatsApp-এ কথা বলুন')}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 h-14 w-14 sm:w-auto sm:px-5 rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-600/30 hover:scale-[1.04] active:scale-95 transition-transform"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#25D366] bq-breathe -z-10" />
        <svg className="relative w-7 h-7 mx-auto sm:mx-0 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:block text-sm font-black tracking-tight">{tr('Chat with us', 'আমাদের সাথে কথা বলুন')}</span>
      </a>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-theme-border-soft bg-theme-app px-6 pt-14 pb-8 text-xs text-theme-muted relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-theme-border-soft/60">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Logo type="horizontal" forceWhiteText={false} />
              <p className="text-[11px] font-medium leading-relaxed max-w-[26ch]">
                {tr('The premium billing command center for small shops, studios and service businesses. Built in India 🇮🇳, made for the world.','ছোট দোকান, স্টুডিও আর সার্ভিস ব্যবসার জন্য প্রিমিয়াম বিলিং কমান্ড সেন্টার। ভারতে তৈরি 🇮🇳, সারা বিশ্বের জন্য।')}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface border border-theme-border-soft text-[10px] font-bold text-theme-secondary">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> {tr('Secure Sync', 'সিকিউর সিঙ্ক')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface border border-theme-border-soft text-[10px] font-bold text-theme-secondary">
                  <Zap className="w-3 h-3 text-amber-500" /> {tr('Offline First', 'অফলাইন ফার্স্ট')}
                </span>
              </div>
            </div>

            {/* Product column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-primary">{tr('Product', 'প্রোডাক্ট')}</p>
              <div className="space-y-2.5 font-semibold">
                <button onClick={() => scrollTo('preview')} className="block hover:text-theme-primary transition-colors">{tr('Platform Tour', 'প্ল্যাটফর্ম ট্যুর')}</button>
                <button onClick={() => scrollTo('categories')} className="block hover:text-theme-primary transition-colors">{tr('Business Categories', 'বিজনেস ক্যাটাগরি')}</button>
                <button onClick={() => scrollTo('workflow')} className="block hover:text-theme-primary transition-colors">{tr('How It Works', 'কীভাবে কাজ করে')}</button>
                <button onClick={launchLiveDemo} className="block text-theme-accent hover:opacity-80 transition-opacity">{tr('Live Demo', 'লাইভ ডেমো')}</button>
              </div>
            </div>

            {/* Resources column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-primary">{tr('Resources', 'রিসোর্স')}</p>
              <div className="space-y-2.5 font-semibold">
                <button onClick={() => scrollTo('faq')} className="block hover:text-theme-primary transition-colors">{tr('FAQ', 'সাধারণ প্রশ্ন')}</button>
                <a href="/support" className="block hover:text-theme-primary transition-colors">{tr('Help Center', 'হেল্প সেন্টার')}</a>
                <button onClick={() => scrollTo('offline-security')} className="block hover:text-theme-primary transition-colors">{tr('Security & Privacy', 'নিরাপত্তা ও প্রাইভেসি')}</button>
                <button onClick={() => scrollTo('payments')} className="block hover:text-theme-primary transition-colors">{tr('Payment Collection', 'পেমেন্ট কালেকশন')}</button>
              </div>
            </div>

            {/* Legal column */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-primary">{tr('Legal', 'লিগ্যাল')}</p>
              <div className="space-y-2.5 font-semibold">
                <a href="/terms" className="block hover:text-theme-primary transition-colors">{tr('Terms of Service', 'সার্ভিসের শর্তাবলী')}</a>
                <a href="/privacy" className="block hover:text-theme-primary transition-colors">{tr('Privacy Policy', 'প্রাইভেসি পলিসি')}</a>
                <a href="/refund" className="block hover:text-theme-primary transition-colors">{tr('Refund Policy', 'রিফান্ড পলিসি')}</a>
                <a href="/data-deletion" className="block hover:text-theme-primary transition-colors">{tr('Data Deletion', 'ডেটা ডিলিশন')}</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
            <span className="text-[10px] font-bold">{tr('© 2026 BillQyro Platform · All rights reserved.','© ২০২৬ BillQyro প্ল্যাটফর্ম · সর্বস্বত্ব সংরক্ষিত।')}</span>
            <div className="flex items-center gap-5 font-bold">
              <button onClick={() => scrollTo('login')} className="hover:text-theme-primary transition-colors">{tr('Sign In', 'সাইন ইন')}</button>
              <a href="mailto:support@billqyro.com" className="hover:text-theme-primary transition-colors flex items-center gap-1.5">
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
