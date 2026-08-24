import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Users, Sparkles, 
  Download, Link2, Smartphone, Printer, CreditCard, ChevronDown, 
  MessageCircle, Mail, MapPin, DollarSign, Clock, BarChart3, Globe, 
  Zap, Lock, RefreshCw, Check, ArrowUpRight, FileSpreadsheet, 
  Layers, Landmark, Scissors, Stethoscope, GraduationCap, Wrench, ShoppingBag
} from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import CustomerPortalLogin from '../components/portal/CustomerPortalLogin';
import HeroBackground from '../components/HeroBackground';
import ScrollReveal from '../components/ScrollReveal';
import { AnimatedThemeToggler } from '../components/AnimatedThemeToggler';
import { useTheme } from '../contexts/ThemeContext';

const Landing = ({ onLoginSuccess }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business'); // 'business' | 'customer'
  const [activePreviewTab, setActivePreviewTab] = useState('dashboard');

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
      name: 'Retail & Supermarket',
      icon: ShoppingBag,
      tag: 'Inventory & POS',
      desc: 'Barcode scanning, product variants, real-time stock alert thresholds, and rapid itemized billing.',
      highlight: 'Auto-decrementing inventory & GST/VAT breakdowns'
    },
    {
      id: 'tailor',
      name: 'Tailoring & Boutiques',
      icon: Scissors,
      tag: 'Custom Orders',
      desc: 'Custom measurements, cloth swatch tracking, stitching stages, delivery dates, and advance payment logging.',
      highlight: 'Order status lifecycle & measurement cards'
    },
    {
      id: 'clinic',
      name: 'Clinics & Healthcare',
      icon: Stethoscope,
      tag: 'Patient CRM',
      desc: 'Patient history records, consultation fees, prescription attachments, and automated follow-up dues.',
      highlight: 'Clinical disclaimer headers & patient ledger'
    },
    {
      id: 'repair',
      name: 'Repair & Electronics',
      icon: Wrench,
      tag: 'Service Jobs',
      desc: 'Job-sheet numbers, problem diagnostics, replacement parts billing, labour estimates, and service warranty tracking.',
      highlight: 'Job-sheet lifecycle & parts breakdown'
    },
    {
      id: 'education',
      name: 'Coaching & Education',
      icon: GraduationCap,
      tag: 'Fee Management',
      desc: 'Batch tracking, monthly tuition fee schedules, student admission records, and parent payment receipts.',
      highlight: 'Monthly fee dues & student directory'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Create & Itemize',
      desc: 'Add items in seconds with auto-complete product catalog, dynamic discounts, and regional tax computations.'
    },
    {
      step: '02',
      title: 'Instant Live Link / PDF',
      desc: 'Generate pixel-perfect A4/A5 PDF documents and shareable encrypted web links for client self-service.'
    },
    {
      step: '03',
      title: 'Collect Payment via UPI / QR',
      desc: 'Clients scan dynamic QR codes, submit digital transaction proof, or pay on delivery with real-time feedback.'
    },
    {
      step: '04',
      title: 'Reconciliation & Ledger',
      desc: 'One-click proof approval automatically updates Customer Ledger, Cash Book, and Executive Dashboard.'
    }
  ];

  const faqs = [
    {
      q: 'How does BillQyro operate offline?',
      a: 'BillQyro utilizes an IndexedDB local-first architecture. You can generate invoices, look up customer balances, and create estimates without an active internet connection. As soon as you reconnect, changes synchronize bidirectionally with Firebase.'
    },
    {
      q: 'Is multi-workspace data isolated securely?',
      a: 'Yes. Every workspace operates in a strictly segregated sandbox. Invoices, customers, bank transactions, and reports are partitioned by workspace ID and authenticated credentials with server-side security rules.'
    },
    {
      q: 'Can customers view and pay invoices without creating an account?',
      a: 'Yes. Each invoice comes with a secure, unique Live Link. Customers can open the link in any mobile or desktop browser to view invoice line items, scan payment QR codes, and upload transaction proof directly.'
    },
    {
      q: 'How are previous dues and balances calculated?',
      a: 'BillQyro enforces canonical mathematical invariants across all screens: Balance Due = max(0, Previous Due + Current Invoice - Paid Now). Lifetime customer dues and dashboard totals stay 100% consistent.'
    },
    {
      q: 'Can I export reports and financial statements?',
      a: 'Yes. Export Sales Summaries, Profit & Loss Statements, Due Ledgers, Inventory Valuation Reports, and Customer Statements into structured Excel spreadsheets or PDF archives at any time.'
    }
  ];

  return (
    <div className="billqyro-landing-premium billqyro-signature-brand min-h-screen bg-theme-app text-theme-primary font-sans selection:bg-theme-accent selection:text-white flex flex-col relative overflow-x-hidden" data-brand="billqyro">
      {/* Background Ambience */}
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-theme-app/30 via-transparent to-theme-app -z-10 pointer-events-none" />

      {/* ===== GLOBAL NAVIGATION BAR ===== */}
      <nav className={`fixed w-full top-3 z-50 transition-all duration-300 flex justify-center px-4`}>
        <div className={`w-full max-w-7xl rounded-full transition-all duration-300 px-6 h-14 sm:h-16 flex items-center justify-between ${
          isScrolled 
            ? 'bg-theme-card/90 backdrop-blur-2xl border border-theme-border-soft shadow-xl' 
            : 'bg-theme-card/40 backdrop-blur-md border border-theme-border-soft/60'
        }`}>
          <Logo type="horizontal" forceWhiteText={false} />

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            <button onClick={() => scrollTo('preview')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Platform</button>
            <button onClick={() => scrollTo('why-billqyro')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Why BillQyro</button>
            <button onClick={() => scrollTo('categories')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Categories</button>
            <button onClick={() => scrollTo('workflow')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Workflow</button>
            <button onClick={() => scrollTo('payments')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Payments</button>
            <button onClick={() => scrollTo('offline-security')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">Security</button>
            <button onClick={() => scrollTo('faq')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors">FAQ</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo('login')} className="text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors hidden sm:block">
              Sign In
            </button>
            <a 
              href="/BillQyro-Setup.exe" 
              download 
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-theme-border-soft hover:bg-theme-surface hover:text-theme-primary text-theme-muted text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Desktop App
            </a>
            <button 
              onClick={() => scrollTo('login')} 
              className="btn-premium px-5 py-2 text-xs font-bold shadow-theme-glow"
            >
              Get Started Free
            </button>
            <AnimatedThemeToggler 
              theme={isDarkMode ? "dark" : "light"}
              onThemeChange={(newTheme) => {
                const newDarkMode = newTheme === "dark";
                if (newDarkMode !== isDarkMode) {
                  toggleTheme();
                }
              }}
            />

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
            <button onClick={() => scrollTo('preview')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Platform Preview</button>
            <button onClick={() => scrollTo('why-billqyro')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Why BillQyro</button>
            <button onClick={() => scrollTo('categories')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Business Categories</button>
            <button onClick={() => scrollTo('workflow')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Invoice Workflow</button>
            <button onClick={() => scrollTo('payments')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Payment Collections</button>
            <button onClick={() => scrollTo('offline-security')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">Security & Offline</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-bold text-theme-primary py-2 border-b border-theme-border-soft/40">FAQ</button>
            <button onClick={() => scrollTo('login')} className="w-full btn-premium py-2.5 text-sm mt-2">Sign In / Register</button>
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
                BILLQYRO SIGNATURE · OFFICIAL EMERALD STANDARD
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[4.7rem] font-black tracking-[-0.045em] text-theme-primary leading-[1.02] max-w-3xl"
            >
              Smart Billing. <br />
              <span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)]">
                Premium Invoicing Platform.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-theme-muted max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              A premium billing command center for modern businesses. Create beautiful invoices, collect faster, manage customer dues, and keep working even when the network disappears.
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
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => scrollTo('preview')} 
                className="btn-premium-outline px-6 py-3.5 text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Explore Platform
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-2 flex flex-wrap items-center gap-5 justify-center lg:justify-start text-theme-muted text-xs font-bold"
            >
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Offline-Ready PWA</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multi-Workspace</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Real-time Sync</span>
            </motion.div>
          </div>

          {/* Hero Interactive Cockpit Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-1 w-full max-w-xl"
          >
            <div className="billqyro-hero-cockpit rounded-[2rem] border border-theme-accent/20 bg-theme-card/90 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
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
                  <p className="text-[9px] font-bold text-theme-muted uppercase">Today's Revenue</p>
                  <p className="text-base font-black text-theme-primary font-numbers mt-0.5">₹48,250</p>
                </div>
                <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <p className="text-[9px] font-bold text-theme-muted uppercase">Collections</p>
                  <p className="text-base font-black text-emerald-500 font-numbers mt-0.5">₹42,000</p>
                </div>
                <div className="bg-theme-surface p-3 rounded-xl border border-theme-border-soft">
                  <p className="text-[9px] font-bold text-theme-muted uppercase">Due Amount</p>
                  <p className="text-base font-black text-amber-500 font-numbers mt-0.5">₹6,250</p>
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
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
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
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-theme-accent">Official BillQyro Brand System</p>
                  <p className="text-xs sm:text-sm font-bold text-theme-primary mt-0.5">Signature Emerald · Financial clarity with a premium edge</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                <span className="brand-proof-pill">Local-first</span><span className="brand-proof-pill">Live links</span><span className="brand-proof-pill">Secure sync</span><span className="brand-proof-pill">Premium PDFs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: PRODUCT PREVIEW ===== */}
      <section id="preview" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              Interactive Product Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              Purpose-Built for Financial Clarity
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              Inspect key workflows across our unified billing platform.
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
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activePreviewTab === tab.id 
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
                    <h3 className="text-lg font-black text-theme-primary">Executive Summary & Cash Position</h3>
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
                  <h3 className="text-base font-black text-theme-primary">Invoice Studio Builder</h3>
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
                  <div className="flex justify-between text-theme-muted"><span>Previous Due</span><span className="font-numbers font-bold text-amber-500">₹1,500.00</span></div>
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
                    <h3 className="text-base font-black text-theme-primary">Customer 360 & Lifetime Ledger</h3>
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
                    <h3 className="text-base font-black text-theme-primary">Internal Treasury & Cash Book</h3>
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
      </section>

      {/* ===== SECTION 3A: WHY BILLQYRO ===== */}
      <section id="why-billqyro" className="relative py-24 px-6 border-t border-theme-border-soft bg-theme-surface/20 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-28">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">The BillQyro Difference</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-theme-primary leading-[1.05] mt-4">
                One system for the work that happens after the sale.
              </h2>
              <p className="text-sm sm:text-base text-theme-muted font-medium leading-relaxed mt-5 max-w-lg">
                Billing is only the beginning. BillQyro connects invoices, payments, customer balances, live links, reports and workspace controls into one disciplined operating layer.
              </p>
              <button onClick={() => scrollTo('preview')} className="mt-7 inline-flex items-center gap-2 text-xs font-black text-theme-accent hover:gap-3 transition-all">
                See the platform in action <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Zap className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">01 · Speed</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">Fast enough for the counter</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Optimistic local saves and focused workflows keep everyday billing responsive instead of form-heavy.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Layers className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">02 · Control</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">Everything stays connected</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Invoice totals, payments, customer dues and reporting are designed around the same financial source of truth.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><ShieldCheck className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">03 · Trust</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">Built around safe boundaries</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Workspace isolation, authenticated access and audit-oriented controls make business data easier to govern.</p>
              </div>
              <div className="billqyro-luxury-card p-6 rounded-3xl border border-theme-accent/15 bg-theme-card/80 backdrop-blur-xl">
                <div className="w-11 h-11 rounded-2xl bg-theme-accent-light text-theme-accent flex items-center justify-center mb-5"><Sparkles className="w-5 h-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-accent">04 · Presentation</p>
                <h3 className="text-lg font-black text-theme-primary mt-2">A brand customers remember</h3>
                <p className="text-xs text-theme-muted leading-relaxed mt-2">Premium invoice layouts, polished live links and a consistent visual system make every customer touchpoint feel intentional.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3B: PLATFORM PILLARS ===== */}
      <section className="py-24 px-6 border-t border-theme-border-soft bg-theme-app">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">Platform Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">Every operational layer, designed to work together.</h2>
            </div>
            <p className="text-xs sm:text-sm text-theme-muted max-w-md leading-relaxed">
              From first draft to final collection, the platform keeps the workflow visible, structured and measurable.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              ['01','Invoice Studio','Create polished invoices, estimates and documents.'],
              ['02','Live Customer Links','Give customers a clean place to view, verify and act.'],
              ['03','Collections & Ledgers','Track paid, partial, due and overdue amounts clearly.'],
              ['04','Reports & Control','Turn daily activity into a reliable operating picture.']
            ].map(([n,t,d]) => (
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              Industry Tailored Workspaces
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              Configured for Your Exact Business Workflow
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              Switch seamlessly between business modes. Dynamic fields adapt to retail, healthcare, garment tailoring, and education.
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
                    <span className="text-[9px] font-bold text-theme-accent uppercase tracking-wider block mb-1">
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
      </section>

      {/* ===== SECTION 4: INVOICE WORKFLOW ===== */}
      <section id="workflow" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              End-to-End Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              Streamlined 4-Step Billing Flow
            </h2>
            <p className="text-sm text-theme-muted font-medium mt-2">
              From fast draft creation to verified bank reconciliation.
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
      </section>

      {/* ===== SECTION 5: PAYMENT COLLECTION ===== */}
      <section id="payments" className="py-20 px-6 border-t border-theme-border-soft bg-theme-app">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
              Frictionless Payment Rails
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight">
              Instant UPI QR & Real-Time Proof Verification
            </h2>
            <p className="text-sm text-theme-muted font-medium leading-relaxed">
              Share live digital invoices with your customers. They scan standard UPI QR codes, transfer funds, and upload confirmation receipts. You verify and approve with a single tap.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-accent">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary">Dynamic QR Codes on Web Links & PDF documents</span>
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
      </section>

      {/* ===== SECTION 6: OFFLINE & SECURITY ===== */}
      <section id="offline-security" className="py-20 px-6 border-t border-theme-border-soft bg-theme-surface/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-theme-card p-8 rounded-3xl border border-theme-border-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-theme-primary">Offline-First IndexedDB Engine</h3>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">
              Network drops in your shop will never interrupt your billing counter. BillQyro saves every invoice locally with cryptographic idempotency and automatically reconciles when internet restores.
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
      </section>

      {/* ===== SECTION 7: FAQ ===== */}
      <section id="faq" className="py-20 px-6 border-t border-theme-border-soft bg-theme-app">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-3.5 py-1 rounded-full border border-theme-accent/20">
              Clear & Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-3">
              Frequently Asked Questions
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
      </section>

      {/* ===== SECTION 8: AUTH / LOGIN SECTION ===== */}
      <section id="login" className="relative border-t border-theme-border-soft bg-theme-surface/50 py-24 px-6 z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-theme-accent/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center relative">
          <div className="text-center lg:text-left mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-accent">Ready when you are</span>
            <h2 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight mt-2">Bring your billing desk into focus.</h2>
            <p className="text-xs text-theme-muted mt-1 font-medium">Log into your existing business account or register a new workspace</p>
            <div className="hidden lg:block mt-8">
              <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[9px] font-black uppercase tracking-wider text-theme-accent">Setup</p><p className="text-xs font-bold text-theme-primary mt-1">Business workspace</p></div>
              <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[9px] font-black uppercase tracking-wider text-theme-accent">Operate</p><p className="text-xs font-bold text-theme-primary mt-1">Invoice & collect</p></div>
              <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft"><p className="text-[9px] font-black uppercase tracking-wider text-theme-accent">Grow</p><p className="text-xs font-bold text-theme-primary mt-1">Measure & improve</p></div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl lg:justify-self-end">
            <div className="bg-theme-card/80 rounded-3xl border border-theme-accent/15 p-3 sm:p-4 shadow-premium backdrop-blur-xl">
          <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border-soft mb-5">
            <button
              onClick={() => setPortalMode('business')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                portalMode === 'business' 
                  ? 'bg-theme-accent text-white shadow-md' 
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              Business Login / Register
            </button>
            <button
              onClick={() => setPortalMode('customer')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                portalMode === 'customer' 
                  ? 'bg-theme-accent text-white shadow-md' 
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              Customer Portal
            </button>
          </div>

          {portalMode === 'business' ? (
            <Login onLoginSuccess={onLoginSuccess} />
          ) : (
            <CustomerPortalLogin onVerificationSuccess={(id, phone) => {
              sessionStorage.setItem('billqyro_customer_portal_id', id);
              sessionStorage.setItem('billqyro_customer_portal_phone', phone);
              window.location.href = `/customer/${id}`;
            }} />
            )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */
      <footer className="border-t border-theme-border-soft bg-theme-app py-10 px-6 text-xs text-theme-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo type="horizontal" forceWhiteText={false} />
            <span className="text-[10px] font-bold text-theme-muted">© 2026 BillQyro Platform</span>
          </div>
          <div className="flex items-center gap-6 font-bold">
            <a href="/terms" className="hover:text-theme-primary transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-theme-primary transition-colors">Privacy Policy</a>
            <a href="/refund" className="hover:text-theme-primary transition-colors">Refund Policy</a>
            <button onClick={() => scrollTo('login')} className="hover:text-theme-primary transition-colors">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
