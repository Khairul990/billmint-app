import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Globe2,
  Layers,
  Link2,
  Lock,
  Menu,
  RefreshCw,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Smartphone,
  Stethoscope,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  GraduationCap,
} from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';
import CustomerPortalLogin from '../components/portal/CustomerPortalLogin';
import { AnimatedThemeToggler } from '../components/AnimatedThemeToggler';
import { useTheme } from '../contexts/ThemeContext';

const features = [
  [Zap, 'Fast invoicing', 'Create polished invoices, estimates and receipts without the clutter.'],
  [Link2, 'Live invoice links', 'Give every customer a clean browser-based invoice experience.'],
  [CreditCard, 'Payments & collections', 'Track paid, partial, unpaid and overdue balances with confidence.'],
  [ShieldCheck, 'Secure by design', 'Workspace-aware access and controlled data handling are built in.'],
  [RefreshCw, 'Offline-first', 'Keep working through connectivity gaps and sync when you are back online.'],
  [Download, 'PDF-ready', 'Generate professional documents for print, download and sharing.'],
];

const industries = [
  [ShoppingBag, 'Retail', 'Sales, customers, invoices and everyday collections in one workspace.'],
  [Scissors, 'Tailor & Boutique', 'Custom orders, measurements, advances and delivery tracking.'],
  [Stethoscope, 'Clinic', 'Consultation billing, patient ledgers and clean receipts.'],
  [Wrench, 'Repair Service', 'Jobs, parts, labour, payments and warranty notes.'],
  [GraduationCap, 'Education', 'Students, recurring dues, invoices and payment records.'],
];

const modules = [
  [FileText, 'Invoice Studio', 'Invoices, estimates, receipts and professional PDF templates.'],
  [Users, 'Customer Hub', 'Customer profiles, ledgers, balances and business history.'],
  [CreditCard, 'Collections', 'Payments, partial balances, proofs, dues and status tracking.'],
  [BarChart3, 'Reports', 'Revenue, collection efficiency and business performance insights.'],
  [Globe2, 'Live Links', 'A polished customer-facing invoice and payment experience.'],
  [Layers, 'Workspaces', 'Keep multiple business contexts organized and isolated.'],
  [Zap, 'Automation', 'Build repeatable workflows around the work your business does.'],
  [Lock, 'Security', 'Access control, workspace boundaries and protected data flows.'],
];

const workflow = [
  ['01', 'Create', 'Build the invoice in seconds.', FileText],
  ['02', 'Share', 'Send a PDF or Live Link.', Link2],
  ['03', 'Collect', 'Record payments and proofs.', CreditCard],
  ['04', 'Reconcile', 'See the ledger and reports.', BarChart3],
];

const faqItems = [
  ['Does BillQyro work offline?', 'Yes. BillQyro is designed around a local-first workflow so core billing work can continue during connectivity gaps and synchronize when the connection returns.'],
  ['Can customers open an invoice without an account?', 'Yes. A secure Live Link can provide a browser-based invoice experience without requiring the customer to manage a separate business account.'],
  ['Can I customize the visual theme?', 'Yes. BillQyro uses a semantic theme system so the visual language can be adapted consistently across the product.'],
  ['Is workspace data isolated?', 'Yes. Workspace-aware storage and authenticated synchronization are designed to keep business data separated between workspaces.'],
];

const Landing = ({ onLoginSuccess }) => {
  const { isDarkMode } = useTheme();
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().top - 88,
        behavior: 'smooth',
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className={`billqyro-landing min-h-screen overflow-x-hidden bg-theme-app text-theme-primary ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        .billqyro-landing {
          --bq-emerald: #0aa889;
          --bq-emerald-deep: #087766;
          --bq-champagne: #c9a56a;
          --bq-ink: #15231f;
          --bq-ivory: #fbfaf7;
        }
        .billqyro-landing .bq-display { font-family: Sora, ui-sans-serif, system-ui, sans-serif; letter-spacing: -.055em; }
        .billqyro-landing .bq-section { width: min(calc(100% - 40px), 1240px); margin-inline: auto; }
        .billqyro-landing .bq-grid {
          background-image: linear-gradient(rgba(10,168,137,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(10,168,137,.045) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .billqyro-landing .bq-shadow { box-shadow: 0 32px 90px rgba(15,23,42,.10), 0 10px 34px rgba(10,168,137,.07); }
        .billqyro-landing .bq-noise { position: relative; isolation: isolate; }
        .billqyro-landing .bq-noise::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.28'/%3E%3C/svg%3E"); z-index: -1; }
        .billqyro-landing .bq-line { background: linear-gradient(90deg, transparent, rgba(10,168,137,.28), transparent); }
        .billqyro-landing .bq-glow { box-shadow: 0 0 0 1px rgba(10,168,137,.08), 0 24px 70px rgba(10,168,137,.10); }
        .billqyro-landing #login, .billqyro-landing #login * { box-sizing: border-box; }
        .billqyro-landing #login { overflow: hidden; }
        .billqyro-landing #login input, .billqyro-landing #login button { max-width: 100%; }
        @media (max-width: 1023px) {
          .billqyro-landing .bq-section { width: min(calc(100% - 28px), 900px); }
          .billqyro-landing #login { padding-block: 20px; }
          .billqyro-landing #login section { width: 100%; min-width: 0; border-left: 0 !important; }
          .billqyro-landing #login .card-premium .card-premium { width: 100% !important; max-width: 520px !important; margin-inline: auto; }
        }
        @media (max-width: 640px) {
          .billqyro-landing .bq-section { width: min(calc(100% - 20px), 680px); }
          .billqyro-landing .bq-display { letter-spacing: -.045em; }
          .billqyro-landing #login { padding-inline: 8px; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-theme-accent/10 blur-[140px]" />
        <div className="absolute right-[-220px] top-[35%] h-[480px] w-[480px] rounded-full bg-amber-300/5 blur-[130px]" />
        <div className="absolute left-[-240px] top-[68%] h-[420px] w-[420px] rounded-full bg-theme-accent/5 blur-[120px]" />
      </div>

      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${isScrolled ? 'border-b border-theme-border-soft bg-theme-app/88 shadow-lg backdrop-blur-2xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button onClick={() => scrollTo('top')} className="shrink-0" aria-label="BillQyro home"><Logo type="horizontal" forceWhiteText={false} /></button>
          <nav className="hidden items-center gap-1 rounded-full border border-theme-border-soft bg-theme-card/70 p-1 backdrop-blur-xl md:flex">
            {[['features', 'Platform'], ['industries', 'Businesses'], ['workflow', 'How it works'], ['faq', 'FAQ']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="rounded-full px-4 py-2.5 text-xs font-bold text-theme-muted transition hover:bg-theme-accent/10 hover:text-theme-primary">{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
            <button onClick={() => scrollTo('login')} className="hidden rounded-full bg-theme-accent px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-theme-accent/20 transition hover:-translate-y-0.5 sm:block">Sign in</button>
            <button onClick={() => setMobileMenuOpen((value) => !value)} className="rounded-xl border border-theme-border-soft bg-theme-card p-2.5 md:hidden" aria-label="Toggle navigation">
              {mobileMenuOpen ? <span className="text-lg leading-none">×</span> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-theme-border-soft bg-theme-app/95 px-5 py-3 backdrop-blur-2xl md:hidden">
              {[['features', 'Platform'], ['industries', 'Businesses'], ['workflow', 'How it works'], ['faq', 'FAQ'], ['login', 'Sign in']].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full border-b border-theme-border-soft py-3.5 text-left text-sm font-bold last:border-0">{label}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top" className="pt-[78px]">
        <section className="bq-grid bq-noise relative overflow-hidden border-b border-theme-border-soft">
          <div className="bq-section relative flex min-h-[720px] items-center justify-center py-24 text-center lg:min-h-[790px]">
            <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-theme-accent/10 blur-[110px]" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="relative z-10 max-w-5xl">
              <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-theme-accent/20 bg-theme-card/75 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-theme-accent shadow-sm backdrop-blur-xl"><Sparkles size={13} /> Smart Billing · Premium Invoicing Platform</div>
              <h1 className="bq-display text-5xl font-black leading-[.98] sm:text-6xl lg:text-[82px]">Billing that looks as <span className="bg-gradient-to-r from-theme-accent via-[#087766] to-[#c9a56a] bg-clip-text text-transparent">premium</span> as your business.</h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">Invoices, customers, payments, Live Links and analytics—designed as one calm, powerful workspace for modern businesses.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => scrollTo('login')} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-theme-accent px-7 py-4 text-sm font-black text-white shadow-2xl shadow-theme-accent/25 transition hover:-translate-y-1">Start with BillQyro <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button>
                <button onClick={() => scrollTo('preview')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-theme-border-soft bg-theme-card/75 px-7 py-4 text-sm font-black backdrop-blur-xl transition hover:-translate-y-1 hover:border-theme-accent/30"><BarChart3 size={17} /> Explore the platform</button>
              </div>
              <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-7 gap-y-3 text-[11px] font-bold text-theme-muted">
                {['Offline-first', 'Secure workspace', 'Live invoice links', 'Premium themes'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-theme-accent" />{item}</span>)}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-theme-border-soft bg-theme-card/25">
          <div className="bq-section grid gap-3 py-5 sm:grid-cols-4">
            {[['01', 'Invoice', 'Create'], ['02', 'Customer', 'Manage'], ['03', 'Payment', 'Collect'], ['04', 'Report', 'Understand']].map(([number, title, text]) => (
              <div key={number} className="flex items-center gap-3 rounded-2xl border border-theme-border-soft bg-theme-card/60 px-4 py-3 backdrop-blur-xl"><span className="text-[9px] font-black tracking-widest text-theme-accent">{number}</span><div><div className="text-xs font-black">{title}</div><div className="text-[10px] text-theme-muted">{text}</div></div></div>
            ))}
          </div>
        </section>

        <section id="preview" className="bq-section py-16 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .7 }} className="bq-shadow overflow-hidden rounded-[34px] border border-theme-border-soft bg-theme-card/80 p-2 backdrop-blur-xl">
            <div className="rounded-[28px] border border-theme-border-soft bg-theme-app p-5 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-5 border-b border-theme-border-soft pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-theme-accent"><span className="h-1.5 w-1.5 rounded-full bg-theme-accent" /> Financial command center</div><h2 className="bq-display mt-2 text-2xl font-black sm:text-3xl">Your business, at a glance.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-theme-muted">Revenue, collections, outstanding balances and invoice activity—without dashboard noise.</p></div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-theme-accent/15 bg-theme-accent/8 px-3.5 py-2 text-[10px] font-black text-theme-accent"><span className="h-1.5 w-1.5 rounded-full bg-theme-accent" /> CLOUD SYNCED</div>
              </div>
              <div className="grid gap-4 py-7 sm:grid-cols-3">
                {[['Total revenue', '₹ 2,48,650', '+18.4% this month'], ['Collected', '₹ 1,86,420', '+12.7% collected'], ['Outstanding', '₹ 62,230', '12 invoices pending']].map(([label, value, meta], index) => (
                  <motion.div key={label} whileHover={{ y: -4 }} className="rounded-2xl border border-theme-border-soft bg-theme-card p-5"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-theme-muted"><span>{label}</span><TrendingUp size={14} className={index === 2 ? 'text-amber-500' : 'text-theme-accent'} /></div><div className="mt-4 text-2xl font-black tracking-tight">{value}</div><div className="mt-2 text-[11px] font-bold text-theme-accent">{meta}</div></motion.div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.55fr_.75fr]">
                <div className="rounded-2xl border border-theme-border-soft bg-theme-card p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black">Revenue & collection trend</p><p className="mt-1 text-[10px] text-theme-muted">Last 7 days</p></div><BarChart3 size={17} className="text-theme-accent" /></div><div className="relative mt-6 h-40 overflow-hidden rounded-xl border border-theme-border-soft bg-theme-app"><div className="absolute inset-x-0 bottom-8 h-px bg-theme-border-soft" /><div className="absolute inset-x-0 bottom-20 h-px bg-theme-border-soft/60" /><svg viewBox="0 0 700 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bqChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0aa889" stopOpacity=".25"/><stop offset="1" stopColor="#0aa889" stopOpacity="0"/></linearGradient></defs><path d="M0 145 C75 125 92 70 160 86 C235 104 255 52 325 72 C390 91 424 45 485 58 C560 74 600 28 700 44 L700 180 L0 180 Z" fill="url(#bqChartFill)" /><path d="M0 145 C75 125 92 70 160 86 C235 104 255 52 325 72 C390 91 424 45 485 58 C560 74 600 28 700 44" fill="none" stroke="#0aa889" strokeWidth="4" strokeLinecap="round" /></svg></div></div>
                <div className="rounded-2xl border border-theme-border-soft bg-theme-card p-5"><p className="text-xs font-black">Collection health</p><div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-theme-accent/15 border-t-theme-accent border-r-theme-accent"><div className="text-center"><div className="text-2xl font-black">76%</div><div className="text-[9px] font-bold uppercase tracking-widest text-theme-muted">collected</div></div></div><div className="mt-5 space-y-3 text-[11px] font-bold"><div className="flex justify-between"><span className="text-theme-muted">Paid</span><span className="text-theme-accent">₹ 1,86,420</span></div><div className="flex justify-between"><span className="text-theme-muted">Pending</span><span>₹ 62,230</span></div></div></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">{['Recent invoices', 'Customer ledger', 'Reports & analytics'].map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-theme-border-soft bg-theme-card px-4 py-3.5"><span className="text-xs font-bold">{item}</span><ArrowUpRight size={14} className={index === 1 ? 'text-theme-accent' : 'text-theme-muted'} /></div>)}</div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="border-y border-theme-border-soft bg-theme-card/35">
          <div className="bq-section py-20 sm:py-28">
            <div className="max-w-2xl"><div className="text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">The platform</div><h2 className="bq-display mt-3 text-4xl font-black leading-tight sm:text-5xl">Everything important. Nothing noisy.</h2><p className="mt-5 text-base leading-7 text-theme-muted">A premium billing system should make complicated work feel simple. Every module is designed around that principle.</p></div>
            <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon, title, description], index) => <motion.article key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .04 }} whileHover={{ y: -5 }} className="group rounded-3xl border border-theme-border-soft bg-theme-card p-6 transition hover:border-theme-accent/25 hover:shadow-xl hover:shadow-theme-accent/5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-theme-accent/15 bg-theme-accent/8 text-theme-accent"><Icon size={19} /></div><h3 className="mt-6 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-theme-muted">{description}</p><div className="mt-6 h-px w-8 bg-theme-accent/40 transition-all group-hover:w-14" /></motion.article>)}</div>
          </div>
        </section>

        <section className="bq-section py-20 sm:py-28">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">One operating system for billing</div><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Eight capabilities. One calm workspace.</h2></div><p className="max-w-md text-sm leading-6 text-theme-muted">Instead of stitching together disconnected tools, BillQyro brings the daily billing lifecycle into one coherent product experience.</p></div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{modules.map(([Icon, title, text], index) => <motion.article key={title} whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-3xl border border-theme-border-soft bg-theme-card p-6"><div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-theme-accent/5 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/8 text-theme-accent"><Icon size={18} /></div><span className="text-[9px] font-black tracking-widest text-theme-muted">0{index + 1}</span></div><h3 className="mt-6 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-theme-muted">{text}</p><div className="mt-5 flex items-center gap-1 text-[10px] font-black text-theme-accent opacity-0 transition group-hover:opacity-100">Explore <ArrowRight size={12} /></div></div></motion.article>)}</div>
        </section>

        <section className="bq-section pb-20 sm:pb-28">
          <div className="bq-glow overflow-hidden rounded-[36px] border border-theme-border-soft bg-theme-card">
            <div className="grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="relative overflow-hidden bg-theme-accent p-8 text-white sm:p-12"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" /><div className="relative"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Link2 size={20} /></div><div className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-white/70">Customer experience</div><h2 className="bq-display mt-3 text-3xl font-black sm:text-4xl">Your invoice is part of your brand.</h2><p className="mt-4 text-sm leading-7 text-white/75">Turn a simple invoice into a polished customer touchpoint with Live Links, clean layouts and payment visibility.</p><button onClick={() => scrollTo('login')} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-[#087766] shadow-xl">Create your first invoice <ArrowRight size={15} /></button></div></div>
              <div className="p-6 sm:p-10 lg:p-12"><div className="rounded-[28px] border border-theme-border-soft bg-theme-app p-4 shadow-inner"><div className="flex items-center justify-between border-b border-theme-border-soft pb-4"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg bg-theme-accent/10" /><div><div className="text-[10px] font-black">BillQyro Invoice</div><div className="text-[8px] text-theme-muted">INV-2048</div></div></div><span className="rounded-full bg-theme-accent/10 px-2.5 py-1 text-[8px] font-black text-theme-accent">PARTIAL</span></div><div className="py-7"><div className="h-2 w-28 rounded-full bg-theme-primary/15" /><div className="mt-2 h-1.5 w-44 rounded-full bg-theme-primary/10" /><div className="mt-8 space-y-3">{['Design service', 'Materials', 'Delivery'].map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-theme-border-soft bg-theme-card px-4 py-3"><span className="text-[10px] font-bold">{item}</span><span className="text-[10px] font-black">₹{index === 0 ? '8,500' : index === 1 ? '2,400' : '650'}</span></div>)}</div></div><div className="border-t border-theme-border-soft pt-4"><div className="flex justify-between text-[10px] font-bold text-theme-muted"><span>Total</span><span className="text-theme-primary">₹11,550</span></div><div className="mt-2 flex justify-between text-[10px] font-black"><span>Balance due</span><span className="text-theme-accent">₹3,550</span></div></div></div></div>
            </div>
          </div>
        </section>

        <section id="industries" className="border-y border-theme-border-soft bg-theme-card/30">
          <div className="bq-section py-20 sm:py-28"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">Made for real businesses</div><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Built around the way you work.</h2></div><p className="max-w-md text-sm leading-6 text-theme-muted">One platform, shaped for different workflows—without forcing every business into the same template.</p></div><div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{industries.map(([Icon, title, description], index) => <motion.article key={title} whileHover={{ y: -5 }} className={`relative overflow-hidden rounded-3xl border border-theme-border-soft bg-theme-card p-6 ${index === 0 ? 'lg:col-span-2' : ''}`}><div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-theme-accent/5 blur-2xl" /><div className="relative"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/8 text-theme-accent"><Icon size={18} /></div><ArrowUpRight size={15} className="text-theme-muted" /></div><h3 className="mt-7 text-sm font-black">{title}</h3><p className="mt-2 max-w-xl text-xs leading-6 text-theme-muted">{description}</p></div></motion.article>)}</div></div>
        </section>

        <section id="workflow" className="border-b border-theme-border-soft bg-theme-card/20">
          <div className="bq-section py-20 sm:py-24"><div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">A calmer workflow</div><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">From invoice to collected cash.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-theme-muted">The important path stays visible from the first invoice to the final reconciliation.</p></div><div className="relative mt-14 grid gap-3 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-theme-border-soft md:block" />{workflow.map(([number, title, description, Icon]) => <div key={number} className="relative rounded-3xl border border-theme-border-soft bg-theme-card p-6 text-center"><div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-theme-accent/20 bg-theme-card text-theme-accent shadow-lg shadow-theme-accent/10"><Icon size={19} /><span className="absolute -right-1 -top-1 rounded-full bg-theme-accent px-1.5 py-0.5 text-[8px] font-black text-white">{number}</span></div><h3 className="mt-6 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-theme-muted">{description}</p></div>)}</div></div>
        </section>

        <section className="bq-section py-20 sm:py-24">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_1.95fr]">
            <div className="rounded-[30px] border border-theme-border-soft bg-gradient-to-br from-theme-accent/10 via-theme-card to-theme-card p-7 sm:p-9"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-accent text-white shadow-lg shadow-theme-accent/20"><Lock size={20} /></div><div className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">Trust by default</div><h2 className="bq-display mt-3 text-3xl font-black">Your business deserves a system you can trust.</h2><p className="mt-4 text-sm leading-7 text-theme-muted">Secure workspace boundaries, controlled synchronization and local-first resilience are part of the product architecture—not an afterthought.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{[[ShieldCheck, 'Secure workspace', 'Business data stays scoped to the authenticated workspace.'], [RefreshCw, 'Resilient sync', 'Keep working locally and synchronize when connectivity returns.'], [Smartphone, 'Works across devices', 'Use the responsive PWA experience on desktop and mobile.'], [Globe2, 'Customer-ready links', 'Give customers a polished browser experience for their invoices.']].map(([Icon, title, text]) => <div key={title} className="rounded-3xl border border-theme-border-soft bg-theme-card p-6"><Icon size={18} className="text-theme-accent" /><h3 className="mt-5 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-theme-muted">{text}</p></div>)}</div>
          </div>
        </section>

        <section className="bq-section pb-20 sm:pb-28"><div className="bq-noise relative overflow-hidden rounded-[36px] border border-theme-accent/20 bg-theme-accent p-8 text-white shadow-2xl shadow-theme-accent/20 sm:p-12 lg:p-16"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/15 blur-3xl" /><div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#c9a56a]/25 blur-3xl" /><div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="text-[10px] font-black uppercase tracking-[.25em] text-white/70">Ready when you are</div><h2 className="bq-display mt-3 max-w-3xl text-4xl font-black sm:text-5xl">Make billing feel like part of your brand.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">Start with the workflows your business needs today and grow into the rest of the platform when you are ready.</p></div><button onClick={() => scrollTo('login')} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#087766] shadow-xl transition hover:-translate-y-1">Get started <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button></div></div></section>

        <section id="faq" className="border-t border-theme-border-soft bg-theme-card/25"><div className="bq-section py-20 sm:py-24"><div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.24em] text-theme-accent">Need to know</div><h2 className="bq-display mt-3 text-4xl font-black">Frequently asked.</h2></div><div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-theme-border-soft bg-theme-card">{faqItems.map(([question, answer], index) => { const open = faqOpen === index; return <div key={question} className="border-b border-theme-border-soft last:border-b-0"><button onClick={() => setFaqOpen(open ? null : index)} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-7"><span className="text-sm font-black">{question}</span><ChevronDown size={16} className={`shrink-0 text-theme-muted transition-transform ${open ? 'rotate-180' : ''}`} /></button><AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p className="px-5 pb-5 text-xs leading-6 text-theme-muted sm:px-7 sm:pb-6">{answer}</p></motion.div>}</AnimatePresence></div>; })}</div></div></section>

        <section id="login" className="bq-section py-16 sm:py-24"><div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-theme-border-soft bg-theme-card shadow-2xl shadow-slate-900/5"><div className="border-b border-theme-border-soft bg-theme-app/60 px-5 py-6 text-center sm:px-8"><div className="mx-auto inline-flex rounded-full border border-theme-border-soft bg-theme-card p-1"><button onClick={() => setPortalMode('business')} className={`rounded-full px-5 py-2.5 text-xs font-black transition ${portalMode === 'business' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted'}`}>Business Login</button><button onClick={() => setPortalMode('customer')} className={`rounded-full px-5 py-2.5 text-xs font-black transition ${portalMode === 'customer' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted'}`}>Customer Portal</button></div><h2 className="bq-display mt-5 text-3xl font-black">Enter your BillQyro workspace.</h2><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-theme-muted">Secure access for business owners, teams and customers—without changing the workflows underneath.</p></div><div className="min-w-0 p-3 sm:p-6 lg:p-10">{portalMode === 'business' ? <Login onLoginSuccess={onLoginSuccess} /> : <CustomerPortalLogin onVerificationSuccess={(id, phone) => { sessionStorage.setItem('billqyro_customer_portal_id', id); sessionStorage.setItem('billqyro_customer_portal_phone', phone); window.location.href = `/customer/${id}`; }} />}</div></div></section>
      </main>

      <footer className="border-t border-theme-border-soft bg-theme-app px-6 py-10"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><div className="flex items-center gap-3"><Logo type="horizontal" forceWhiteText={false} /><span className="text-[10px] font-bold text-theme-muted">© 2026 BillQyro Platform</span></div><div className="flex flex-wrap justify-center gap-5 text-xs font-bold text-theme-muted"><button onClick={() => scrollTo('faq')} className="transition hover:text-theme-accent">Help</button><button onClick={() => scrollTo('login')} className="transition hover:text-theme-accent">Sign In</button><span>Smart Billing · Premium Invoicing Platform</span></div></div></footer>
    </div>
  );
};

export default Landing;
