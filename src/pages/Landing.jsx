import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Sparkles,
  MessageCircle, Mail, ChevronDown, Smartphone, Printer, CreditCard,
  BarChart3, Zap, Lock, Check,
  FileSpreadsheet, Link2, Layers, Landmark, Scissors, Stethoscope,
  GraduationCap, Wrench, ShoppingBag, Languages, Crown, Infinity as InfinityIcon, WifiOff, QrCode
} from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import CustomerPortalLogin from '../components/portal/CustomerPortalLogin';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedNumber from '../components/AnimatedNumber';

// ── WhatsApp business number for the landing CTA ──────────────────────────
// ⚠️ এখানে তোমার নিজের WhatsApp নম্বর বসাও (country code সহ, '+' ছাড়া)।
// যেমন: ভারতের ৯৮৩০০ ০০০০০ নম্বরের জন্য '919830000000'
const WHATSAPP_NUMBER = '910000000000';

const Landing = ({ onLoginSuccess }) => {
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business'); // 'business' | 'customer'
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
      generateDemoWorkspace();
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
    <div className="bq26-root min-h-screen flex flex-col relative">
      {/* ── Cinematic aurora backdrop ─────────────────────────────────── */}
      <div aria-hidden="true" className="bq26-aurora" />
      <div aria-hidden="true" className="bq26-grid" />
      <div aria-hidden="true" className="bq26-noise" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#04100C] via-transparent to-transparent z-[1] pointer-events-none" />

      {/* ===== GLOBAL NAVIGATION ===== */}
      <nav className="fixed w-full top-3 z-50 flex justify-center px-4">
        <div className={`w-full max-w-7xl rounded-full px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between transition-all duration-300 bq26-nav ${isScrolled ? '' : '!bg-transparent !border-transparent !shadow-none'}`}>
          <Logo type="horizontal" forceWhiteText />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="bq26-nav-link">{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleLang}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--bq26-line)] text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] hover:border-[rgba(52,211,153,0.35)] text-[11px] font-black transition-all cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button onClick={() => scrollTo('login')} className="hidden sm:block bq26-nav-link">
              {tr('Sign In', 'সাইন ইন')}
            </button>
            <button onClick={() => scrollTo('login')} className="bq26-beam">
              <span className="bg-[#052e21] hover:bg-[#06392a] text-[#D9FEEA] px-5 py-2 text-xs font-black tracking-tight flex items-center gap-1.5 transition-colors">
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
            <button onClick={() => scrollTo('login')} className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#0DA678] to-[#0B8F78] text-white text-sm font-black">{tr('Sign In / Register', 'সাইন ইন / রেজিস্টার')}</button>
              <a href="/downloads/BillQyro-Android.apk" download className="block w-full mt-2 py-3 rounded-xl border border-[rgba(52,211,153,0.35)] text-[var(--bq26-emerald-bright)] text-sm font-black flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4" />
                {tr('Download Android App', 'অ্যান্ড্রয়েড অ্যাপ ডাউনলোড')}
              </a>
          </motion.div>
        )}
      </nav>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="relative min-h-[94vh] flex items-center pt-32 pb-16 px-6 z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-14 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bq26-glass"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--bq26-emerald-bright)]">
                {tr('BILLQYRO SIGNATURE · EMERALD STANDARD', 'BILLQYRO সিগনেচার · এমারল্ড স্ট্যান্ডার্ড')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bq26-display text-[2.75rem] sm:text-6xl lg:text-[4.6rem] font-bold text-[var(--bq26-text)] max-w-3xl"
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
              {tr('A premium billing command center for modern businesses. Create beautiful invoices, collect faster, manage customer dues, and keep working even when the network disappears.', 'আধুনিক ব্যবসার জন্য প্রিমিয়াম বিলিং কমান্ড সেন্টার। সুন্দর ইনভয়েস তৈরি করুন, দ্রুত টাকা আদায় করুন, কাস্টমারের বাকি ম্যানেজ করুন — নেটওয়ার্ক চলে গেলেও কাজ থেমে থাকবে না।')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start"
            >
              <button onClick={() => scrollTo('login')} className="bq26-beam w-full sm:w-auto">
                <span className="bg-[#052e21] hover:bg-[#07402e] text-[#D9FEEA] px-8 py-3.5 text-base font-bold flex items-center justify-center gap-2 transition-colors">
                  {tr('Create Free Account', 'ফ্রি অ্যাকাউন্ট খুলুন')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                onClick={launchLiveDemo}
                className="w-full sm:w-auto px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-[rgba(52,211,153,0.35)] text-[var(--bq26-emerald-bright)] hover:bg-[rgba(16,185,129,0.1)] transition-all"
                title={tr('Explore the full platform with sample data — no signup required', 'নমুনা ডেটা দিয়ে পুরো প্ল্যাটফর্ম দেখুন — রেজিস্টার লাগবে না')}
              >
                <Zap className="w-4 h-4" />
                {tr('Try Live Demo', 'লাইভ ডেমো দেখুন')}
              </button>
              <a
                href="/downloads/BillQyro-Android.apk"
                download
                className="w-full sm:w-auto px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-full border border-[rgba(52,211,153,0.35)] text-[var(--bq26-emerald-bright)] hover:bg-[rgba(16,185,129,0.1)] transition-all"
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
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34D399]" /> {tr('Free forever plan', 'চিরকাল ফ্রি প্ল্যান')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34D399]" /> {tr('No credit card', 'ক্রেডিট কার্ড লাগবে না')}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34D399]" /> {tr('Works offline', 'অফলাইনেও চলে')}</span>
            </motion.div>
          </div>

          {/* ── Hero Interactive Cockpit ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-xl relative"
          >
            <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-[rgba(16,185,129,0.09)] blur-3xl -z-10 pointer-events-none" />

            {/* Floating notification chips */}
            <div aria-hidden="true" className="bq26-chip -left-4 top-14 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float">
              <span className="w-6 h-6 rounded-xl bg-[rgba(52,211,153,0.14)] text-[#34D399] flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Payment Received</p>
                <p className="text-[9px] font-bold text-[#34D399]">UPI · just now</p>
              </div>
            </div>
            <div aria-hidden="true" className="bq26-chip -right-5 top-44 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float-slow">
              <span className="w-6 h-6 rounded-xl bg-[rgba(227,201,143,0.12)] text-[#E3C98F] flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Revenue +18%</p>
                <p className="text-[9px] font-bold text-[#E3C98F]">this week</p>
              </div>
            </div>
            <div aria-hidden="true" className="bq26-chip -bottom-5 left-12 hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 bq-float" style={{ animationDelay: '1.2s' }}>
              <span className="w-6 h-6 rounded-xl bg-[rgba(45,212,191,0.12)] text-[#2DD4BF] flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5" /></span>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-[var(--bq26-text)]">Invoice shared</p>
                <p className="text-[9px] font-bold text-[#2DD4BF]">via WhatsApp</p>
              </div>
            </div>

            {/* Cockpit card */}
            <div className="bq26-cockpit rounded-[1.75rem] p-4 sm:p-5 relative overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--bq26-line-soft)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E3C98F]/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]/70" />
                </div>
                <div className="text-[10px] font-bold text-[var(--bq26-muted)] px-2.5 py-0.5 rounded-full border border-[var(--bq26-line-soft)]">
                  billqyro.app · {tr('Live Cockpit', 'লাইভ ককপিট')}
                </div>
                <div className="w-8" />
              </div>

              {/* Cockpit tabs */}
              <div className="grid grid-cols-3 gap-1.5 mb-4 p-1 rounded-xl bg-[rgba(2,10,7,0.55)] border border-[var(--bq26-line-soft)]">
                {[
                  ['dashboard', tr('Dashboard', 'ড্যাশবোর্ড'), BarChart3],
                  ['invoice', tr('Invoice', 'ইনভয়েস'), FileSpreadsheet],
                  ['qr', tr('UPI QR', 'UPI QR'), QrCode]
                ].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => selectCockpitTab(id)}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black transition-colors ${cockpitTab === id ? 'text-[#04100C]' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {cockpitTab === id && <motion.span layoutId="cockpit-pill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#34D399] to-[#2DD4BF]" transition={{ type: 'spring', damping: 28, stiffness: 320 }} />}
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
                        <div className="bg-[rgba(2,10,7,0.5)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr("Today's Revenue", 'আজকের আয়')}</p>
                          <p className="text-base font-black text-[var(--bq26-text)] font-numbers mt-0.5"><AnimatedNumber value={48250} prefix="₹" /></p>
                        </div>
                        <div className="bg-[rgba(2,10,7,0.5)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr('Collections', 'কালেকশন')}</p>
                          <p className="text-base font-black text-[#34D399] font-numbers mt-0.5"><AnimatedNumber value={42000} prefix="₹" /></p>
                        </div>
                        <div className="bg-[rgba(2,10,7,0.5)] p-3 rounded-xl border border-[var(--bq26-line-soft)]">
                          <p className="text-[9px] font-bold text-[var(--bq26-muted)] uppercase tracking-wider">{tr('Due', 'বাকি')}</p>
                          <p className="text-base font-black text-[#E3C98F] font-numbers mt-0.5"><AnimatedNumber value={6250} prefix="₹" /></p>
                        </div>
                      </div>
                      {/* Revenue bars */}
                      <div className="bg-[rgba(2,10,7,0.5)] rounded-xl border border-[var(--bq26-line-soft)] p-3.5">
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-[10px] font-black text-[var(--bq26-text)]">{tr('Weekly collections', 'সাপ্তাহিক কালেকশন')}</p>
                          <span className="text-[9px] font-black text-[#34D399] flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18%</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-16">
                          {[38, 52, 44, 68, 59, 82, 95].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                              className={`flex-1 rounded-t-md ${i === 6 ? 'bg-gradient-to-t from-[#0DA678] to-[#34D399]' : 'bg-[rgba(52,211,153,0.22)]'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {cockpitTab === 'invoice' && (
                    <motion.div key="inv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-2.5">
                      <div className="flex justify-between items-start bg-[rgba(2,10,7,0.5)] rounded-xl border border-[var(--bq26-line-soft)] p-3.5">
                        <div>
                          <span className="text-[9px] font-black text-[#34D399] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 rounded-md">INV-2026-0042</span>
                          <p className="text-sm font-black text-[var(--bq26-text)] mt-1.5">Apex Industrial Solutions</p>
                          <p className="text-[10px] text-[var(--bq26-muted)] font-medium">{tr('3 line items · Standard B2B', '৩টি আইটেম · স্ট্যান্ডার্ড B2B')}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[rgba(52,211,153,0.1)] text-[#34D399] border border-[rgba(52,211,153,0.25)]">{tr('Paid', 'পেইড')}</span>
                      </div>
                      {[
                        ['Commercial Consultation', '2 × ₹2,500', '₹5,000'],
                        ['Design Implementation', '1 × ₹12,000', '₹12,000'],
                        ['GST (18%)', '', '₹3,060']
                      ].map(([item, qty, amt]) => (
                        <div key={item} className="flex justify-between items-center bg-[rgba(2,10,7,0.4)] rounded-lg border border-[var(--bq26-line-soft)] px-3.5 py-2 text-[11px]">
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
                    <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex items-center gap-4 bg-[rgba(2,10,7,0.5)] rounded-xl border border-[var(--bq26-line-soft)] p-4">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 bq26-qr-cell rounded-xl border border-[rgba(52,211,153,0.25)] p-2 grid grid-cols-7 grid-rows-7 gap-[2px]">
                        {[
                          1,1,1,0,1,1,1, 1,0,1,0,0,0,1, 1,1,0,1,0,1,1, 0,0,1,1,1,0,0,
                          1,0,0,1,0,0,1, 1,1,0,0,1,1,1, 0,1,1,0,1,0,1, 1,0,1,1,0,1,1,
                          1,1,0,1,1,0,1, 0,0,1,0,1,1,0, 1,1,0,1,0,0,1, 0,1,1,0,1,1,0,
                          1,0,1,1,0,1,1, 1,1,0,0,1,0,1, 0,1,0,1,1,0,0, 1,0,1,0,1,1,1
                        ].map((on, i) => <span key={i} className={on ? 'bg-[rgba(52,211,153,0.8)] rounded-[1px]' : ''} />)}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-black text-[var(--bq26-text)]">{tr('Scan & pay with any UPI app', 'যেকোনো UPI অ্যাপে স্ক্যান করে টাকা দিন')}</p>
                        <p className="text-[10px] text-[var(--bq26-muted)] font-bold">GPay · PhonePe · Paytm · BHIM</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2.5 py-1 rounded-lg bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] text-[#34D399] text-sm font-black font-numbers">₹4,200</span>
                          <span className="flex items-center gap-1 text-[9px] font-black text-[#34D399] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {tr('Verified proof', 'প্রমাণ যাচাই')}</span>
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
      </section>

      {/* ===== CATEGORY MARQUEE ===== */}
      <section aria-label={tr('Business categories', 'ব্যবসার ক্যাটাগরি')} className="pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bq26-marquee-shell bq-marquee rounded-full py-3">
            <div className="bq-marquee-track gap-3 pr-3">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-3 pr-3" aria-hidden={dup === 1}>
                  {[tr('Tailoring & Boutiques', 'টেইলারিং ও বুটিক'), tr('Retail & Supermarkets', 'রিটেইল ও সুপারমার্কেট'), tr('Clinics & Healthcare', 'ক্লিনিক ও হেলথকেয়ার'), tr('Repair & Electronics', 'রিপেয়ার ও ইলেকট্রনিক্স'), tr('Coaching & Education', 'কোচিং ও শিক্ষা'), tr('Embroidery Studios', 'এমব্রয়ডারি স্টুডিও'), tr('Cyber Cafes', 'সাইবার ক্যাফে'), tr('Salons & Parlours', 'সেলুন ও পার্লার'), tr('Wholesale Trading', 'হোলসেল ট্রেডিং'), tr('Freelancers', 'ফ্রিল্যান্সার')].map((cat) => (
                    <span key={cat + dup} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--bq26-line-soft)] bg-[rgba(6,20,15,0.6)] px-4 py-1.5 text-[11px] font-black text-[var(--bq26-text-soft)] tracking-wide">
                      <Sparkles className="w-3 h-3 text-[#34D399]" />
                      {cat}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION: WHY BILLQYRO (BENTO GRID) ===== */}
      <section id="why-billqyro" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
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
                  <div className="w-11 h-11 rounded-2xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] text-[#34D399] flex items-center justify-center mb-5"><Layers className="w-5 h-5" /></div>
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
                    <div key={label} className="flex items-center justify-between bg-[rgba(2,10,7,0.45)] border border-[var(--bq26-line-soft)] rounded-xl px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--bq26-text-soft)]">
                        <span className={`w-1.5 h-1.5 rounded-full ${sign === '+' ? 'bg-[#34D399]' : 'bg-[#2DD4BF]'}`} />
                        {label}
                      </span>
                      <span className="text-[11px] font-black font-numbers text-[#34D399]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.1)] text-[#34D399] flex items-center justify-center mb-4"><Zap className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Counter-speed billing', 'কাউন্টারের গতিতে বিল')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Optimistic local saves and focused workflows keep everyday billing responsive.', 'অপটিমিস্টিক লোকাল সেভ আর ফোকাসড ওয়ার্কফ্লো — রোজকার বিলিং ঝটপট।')}</p>
              </div>

              {/* Live links */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(45,212,191,0.1)] text-[#2DD4BF] flex items-center justify-center mb-4"><Link2 className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Live customer links', 'লাইভ কাস্টমার লিংক')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Encrypted web links where customers view, verify and pay — no app install.', 'এনক্রিপ্টেড ওয়েব লিংকে কাস্টমার দেখে, যাচাই করে, টাকা দেয় — অ্যাপ ইনস্টল লাগে না।')}</p>
              </div>

              {/* Offline */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(227,201,143,0.1)] text-[#E3C98F] flex items-center justify-center mb-4"><WifiOff className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Offline-first engine', 'অফলাইন-ফার্স্ট ইঞ্জিন')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Network drops never stop the counter. Everything syncs when you reconnect.', 'নেটওয়ার্ক গেলেও কাউন্টার থামে না। নেট ফিরলেই সব সিঙ্ক।')}</p>
              </div>

              {/* Security */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.1)] text-[#34D399] flex items-center justify-center mb-4"><ShieldCheck className="w-5 h-5" /></div>
                <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Workspace isolation', 'ওয়ার্কস্পেস আইসোলেশন')}</h3>
                <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Multi-tenant sandboxing, encrypted link tokens and audit-oriented controls.', 'মাল্টি-টেন্যান্ট স্যান্ডবক্স, এনক্রিপ্টেড লিংক টোকেন আর অডিট-ভিত্তিক কন্ট্রোল।')}</p>
              </div>

              {/* Wide tile: reports w/ sparkline */}
              <div onMouseMove={handleTileMove} className="bq26-tile rounded-3xl p-6 md:col-span-2 flex items-center justify-between gap-5">
                <div className="max-w-[60%]">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(45,212,191,0.1)] text-[#2DD4BF] flex items-center justify-center mb-4"><BarChart3 className="w-5 h-5" /></div>
                  <h3 className="text-base font-black text-[var(--bq26-text)]">{tr('Reports that reconcile', 'মিলে-যাওয়া রিপোর্ট')}</h3>
                  <p className="text-xs text-[var(--bq26-muted)] leading-relaxed mt-2">{tr('Sales, P&L, due ledgers and inventory valuation — exportable to Excel and PDF.', 'সেলস, লাভ-ক্ষতি, বাকির লেজার আর ইনভেন্টরি ভ্যালুয়েশন — Excel ও PDF-এ এক্সপোর্ট।')}</p>
                </div>
                <svg viewBox="0 0 120 64" className="w-32 sm:w-40 h-auto shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="bq26-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,52 L15,44 L30,48 L45,34 L60,38 L75,24 L90,28 L105,14 L120,8 L120,64 L0,64 Z" fill="url(#bq26-spark)" />
                  <path d="M0,52 L15,44 L30,48 L45,34 L60,38 L75,24 L90,28 L105,14 L120,8" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="120" cy="8" r="3.5" fill="#2DD4BF" />
                </svg>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== STATS BAND ===== */}
      <section className="relative py-14 px-6 z-10">
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
      </section>

      {/* ===== SECTION: BUSINESS CATEGORIES (interactive) ===== */}
      <section id="categories" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
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
                        ? 'border-[rgba(52,211,153,0.4)] bg-[rgba(16,185,129,0.1)]'
                        : 'border-[var(--bq26-line-soft)] bg-[rgba(6,20,15,0.4)] hover:border-[rgba(52,211,153,0.25)]'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[rgba(52,211,153,0.18)] text-[#34D399]' : 'bg-[rgba(2,10,7,0.5)] text-[var(--bq26-muted)]'}`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-black truncate ${isActive ? 'text-[var(--bq26-text)]' : 'text-[var(--bq26-text-soft)]'}`}>{cat.name}</span>
                        <span className="block text-[10px] font-bold text-[var(--bq26-muted)]">{cat.tag}</span>
                      </span>
                      {isActive && <motion.span layoutId="cat-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0 hidden lg:block" />}
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#34D399]">{activeCat.tag}</span>
                        <h3 className="bq26-display text-2xl font-bold text-[var(--bq26-text)] mt-1">{activeCat.name}</h3>
                      </div>
                      <span className="w-12 h-12 rounded-2xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] text-[#34D399] flex items-center justify-center shrink-0">
                        {React.createElement(activeCat.icon, { className: 'w-6 h-6' })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--bq26-text-soft)] leading-relaxed mt-4">{activeCat.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {activeCat.fields.map((f) => (
                        <span key={f} className="px-3 py-1.5 rounded-full bg-[rgba(2,10,7,0.5)] border border-[var(--bq26-line-soft)] text-[10px] font-black text-[var(--bq26-text-soft)]">{f}</span>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-[var(--bq26-line-soft)] flex items-center gap-2 text-[11px] font-bold text-[#34D399]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {activeCat.highlight}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== SECTION: WORKFLOW TIMELINE ===== */}
      <section id="workflow" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
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
                      <div className="absolute left-0 lg:relative lg:left-auto flex items-center justify-center w-10 h-10 rounded-2xl bg-[#071c14] border border-[rgba(52,211,153,0.35)] text-[#34D399] shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)] z-10">
                        <Icon className="w-[18px] h-[18px]" />
                      </div>
                      <div className="bq26-tile rounded-2xl p-5 h-full">
                        <span className="text-2xl font-black font-numbers text-[rgba(52,211,153,0.25)]">{ws.step}</span>
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
      </section>

      {/* ===== SECTION: PAYMENTS ===== */}
      <section id="payments" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
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
                    <div className="w-8 h-8 rounded-lg bg-[rgba(2,10,7,0.5)] border border-[var(--bq26-line-soft)] flex items-center justify-center text-[#34D399] shrink-0">
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
                <div className="text-center p-5 rounded-2xl bg-[rgba(2,10,7,0.5)] border border-[var(--bq26-line-soft)]">
                  <div className="w-36 h-36 mx-auto bq26-qr-cell rounded-2xl border border-[rgba(52,211,153,0.25)] p-2.5 grid grid-cols-8 grid-rows-8 gap-[2px]">
                    {[
                      1,1,1,1,0,1,1,0, 1,0,0,1,0,0,1,1, 1,1,0,0,1,1,0,1, 0,1,1,0,0,1,1,0,
                      1,0,1,1,1,0,0,1, 0,1,0,1,0,1,1,0, 1,1,1,0,1,0,1,1, 0,0,1,1,0,1,1,1
                    ].map((on, i) => <span key={i} className={on ? 'bg-[rgba(52,211,153,0.8)] rounded-[1px]' : ''} />)}
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
      </section>

      {/* ===== SECTION: PRICING ===== */}
      <section id="pricing" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="bq26-kicker">{tr('Simple, Honest Pricing', 'সহজ, সৎ প্রাইসিং')}</p>
              <h2 className="bq26-display text-3xl sm:text-4xl font-bold text-[var(--bq26-text)] mt-3">
                {tr('Start free. Upgrade when you grow.', 'ফ্রি শুরু করুন। বড় হলে আপগ্রেড।')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto items-stretch">
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
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="mt-7 w-full py-3 rounded-full border border-[var(--bq26-line)] text-[var(--bq26-text)] text-xs font-black hover:bg-[rgba(16,185,129,0.08)] transition-colors">
                  {tr('Start Free', 'ফ্রি শুরু করুন')}
                </button>
              </div>

              {/* Pro */}
              <div className="bq26-tile rounded-3xl p-7 flex flex-col relative border-[rgba(52,211,153,0.4)] bg-[rgba(10,30,24,0.75)] shadow-[0_30px_80px_-30px_rgba(16,185,129,0.4)]">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-[#34D399] to-[#2DD4BF] text-[#04100C]">
                  {tr('Most Popular', 'সবচেয়ে জনপ্রিয়')}
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#34D399] flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Pro</p>
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
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="bq26-beam mt-7">
                  <span className="bg-[#052e21] hover:bg-[#07402e] text-[#D9FEEA] w-full py-3 text-xs font-black flex items-center justify-center transition-colors">
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
                    <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#E3C98F] shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('login')} className="mt-7 w-full py-3 rounded-full border border-[rgba(227,201,143,0.3)] text-[#E3C98F] text-xs font-black hover:bg-[rgba(227,201,143,0.08)] transition-colors">
                  {tr('Claim Lifetime', 'লাইফটাইম নিন')}
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] font-bold text-[var(--bq26-muted)] mt-6">
              {tr('Plans are managed inside the app — upgrade anytime via UPI. Quarterly (₹1,299) and yearly (₹4,999) options available.', 'প্ল্যান অ্যাপের ভিতরে ম্যানেজ হয় — যেকোনো সময় UPI-তে আপগ্রেড করুন। কোয়ার্টারলি (₹১,২৯৯) ও ইয়ারলি (₹৪,৯৯৯) অপশন আছে।')}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== SECTION: OFFLINE & SECURITY ===== */}
      <section id="platform" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bq26-tile rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(227,201,143,0.1)] border border-[rgba(227,201,143,0.25)] text-[#E3C98F] flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--bq26-text)]">{tr('Offline-First IndexedDB Engine', 'অফলাইন-ফার্স্ট IndexedDB ইঞ্জিন')}</h3>
              <p className="text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium">
                {tr('Network drops in your shop will never interrupt your billing counter. BillQyro saves every invoice locally with cryptographic idempotency and automatically reconciles when internet restores.', 'দোকানে নেটওয়ার্ক চলে গেলেও বিলিং কাউন্টার থামবে না। BillQyro প্রতিটি ইনভয়েস লোকালি সেভ করে রাখে, ইন্টারনেট ফিরলেই সব অটোমেটিক সিঙ্ক হয়ে যায়।')}
              </p>
              <div className="text-[11px] font-bold text-[#34D399] flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4" /> {tr('Zero data loss guarantee during outages', 'নেটওয়ার্ক গেলেও ডেটা-লস শূন্য')}
              </div>
            </div>

            <div className="bq26-tile rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] text-[#34D399] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-[var(--bq26-text)]">{tr('Workspace Isolation & Security', 'ওয়ার্কস্পেস আইসোলেশন ও সিকিউরিটি')}</h3>
              <p className="text-xs text-[var(--bq26-text-soft)] leading-relaxed font-medium">
                {tr('Strict multi-tenant security architecture. Each business branch and workspace has dedicated data partition rules, encrypted token hashes for public links, and full audit logging.', 'কঠোর মাল্টি-টেন্যান্ট সিকিউরিটি আর্কিটেকচার। প্রতিটি ব্রাঞ্চ ও ওয়ার্কস্পেসের আলাদা ডেটা-পার্টিশন নিয়ম, পাবলিক লিংকের এনক্রিপ্টেড টোকেন হ্যাশ আর পূর্ণ অডিট লগ।')}
              </p>
              <div className="text-[11px] font-bold text-[#34D399] flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4" /> {tr('Firebase 256-bit encryption in-transit & at rest', 'Firebase ২৫৬-বিট এনক্রিপশন — চলার পথে ও সংরক্ষণে')}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== SECTION: FAQ ===== */}
      <section id="faq" className="relative py-24 px-6 z-10">
        <ScrollReveal yOffset={28}>
          <div className="max-w-4xl mx-auto">
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
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180 text-[#34D399]' : 'text-[var(--bq26-muted)]'}`} />
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
      </section>

      {/* ===== SECTION: AUTH / LOGIN ===== */}
      <section id="login" className="relative py-24 px-6 z-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[rgba(16,185,129,0.07)] to-transparent pointer-events-none" />
        <ScrollReveal yOffset={24}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-start relative">
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
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#34D399]">{k}</p>
                    <p className="text-xs font-bold text-[var(--bq26-text-soft)] mt-1">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <div className="bq26-glass-strong rounded-[2rem] p-5 sm:p-8 shadow-2xl bq26-edge-light">
                <div className="flex bg-[rgba(2,10,7,0.55)] p-1 rounded-2xl border border-[var(--bq26-line-soft)] mb-6">
                  <button
                    onClick={() => setPortalMode('business')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${portalMode === 'business' ? 'bg-gradient-to-r from-[#0DA678] to-[#0B8F78] text-white shadow-md' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {tr('Business Login / Register', 'বিজনেস লগইন / রেজিস্টার')}
                  </button>
                  <button
                    onClick={() => setPortalMode('customer')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${portalMode === 'customer' ? 'bg-gradient-to-r from-[#0DA678] to-[#0B8F78] text-white shadow-md' : 'text-[var(--bq26-muted)] hover:text-[var(--bq26-text)]'}`}
                  >
                    {tr('Customer Portal', 'কাস্টমার পোর্টাল')}
                  </button>
                </div>

                {/* Scoped dark emerald theme so the embedded forms match the landing */}
                <div className="dark" data-theme="emerald-royal">
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
                </div>

                {/* No-signup interactive demo access */}
                <div className="mt-5 pt-5 border-t border-[var(--bq26-line-soft)]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-[rgba(2,10,7,0.45)] border border-dashed border-[rgba(52,211,153,0.3)] px-4 py-3.5">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-9 h-9 rounded-xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-[#34D399]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[var(--bq26-text)]">{tr('Not ready to register?', 'এখনই রেজিস্টার করবেন না?')}</p>
                        <p className="text-[11px] font-semibold text-[var(--bq26-muted)] mt-0.5">{tr('Tour the full platform with sample business data.', 'নমুনা ব্যবসার ডেটা দিয়ে পুরো প্ল্যাটফর্ম ঘুরে দেখুন।')}</p>
                      </div>
                    </div>
                    <button
                      onClick={launchLiveDemo}
                      className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0DA678] to-[#0B8F78] text-white text-xs font-black hover:opacity-90 transition-opacity shadow-lg"
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
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 h-14 w-14 sm:w-auto sm:px-5 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-[1.04] active:scale-95 transition-transform"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse -z-10 opacity-40" />
        <svg className="relative w-7 h-7 mx-auto sm:mx-0 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:block text-sm font-black tracking-tight">{tr('Chat with us', 'আমাদের সাথে কথা বলুন')}</span>
      </a>

      {/* ===== FOOTER ===== */}
      <footer className="relative px-6 pt-16 pb-8 text-xs text-[var(--bq26-muted)] z-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(52,211,153,0.5)] to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-[var(--bq26-line-soft)]">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Logo type="horizontal" forceWhiteText />
              <p className="text-[11px] font-medium leading-relaxed max-w-[28ch] text-[var(--bq26-text-soft)]">
                {tr('The premium billing command center for small shops, studios and service businesses. Built in India 🇮🇳, made for the world.', 'ছোট দোকান, স্টুডিও আর সার্ভিস ব্যবসার জন্য প্রিমিয়াম বিলিং কমান্ড সেন্টার। ভারতে তৈরি 🇮🇳, সারা বিশ্বের জন্য।')}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(2,10,7,0.5)] border border-[var(--bq26-line-soft)] text-[10px] font-bold text-[var(--bq26-text-soft)]">
                  <ShieldCheck className="w-3 h-3 text-[#34D399]" /> {tr('Secure Sync', 'সিকিউর সিঙ্ক')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(2,10,7,0.5)] border border-[var(--bq26-line-soft)] text-[10px] font-bold text-[var(--bq26-text-soft)]">
                  <Zap className="w-3 h-3 text-[#E3C98F]" /> {tr('Offline First', 'অফলাইন ফার্স্ট')}
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
                <button onClick={launchLiveDemo} className="block text-[#34D399] hover:opacity-80 transition-opacity">{tr('Live Demo', 'লাইভ ডেমো')}</button>
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
                <a href="/terms" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Terms of Service', 'সার্ভিসের শর্তাবলী')}</a>
                <a href="/privacy" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Privacy Policy', 'প্রাইভেসি পলিসি')}</a>
                <a href="/refund" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Refund Policy', 'রিফান্ড পলিসি')}</a>
                <a href="/data-deletion" className="block hover:text-[var(--bq26-text)] transition-colors">{tr('Data Deletion', 'ডেটা ডিলিশন')}</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
            <span className="text-[10px] font-bold">{tr('© 2026 BillQyro Platform · All rights reserved.', '© ২০২৬ BillQyro প্ল্যাটফর্ম · সর্বস্বত্ব সংরক্ষিত।')}</span>
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
