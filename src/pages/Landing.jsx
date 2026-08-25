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

const featureData = [
  [Zap, 'Fast invoicing', 'Create polished invoices, estimates and receipts without the clutter.'],
  [Link2, 'Live invoice links', 'Give every customer a clean browser-based invoice experience.'],
  [CreditCard, 'Payments & collections', 'Track paid, partial, unpaid and overdue balances with confidence.'],
  [ShieldCheck, 'Secure by design', 'Workspace-aware access and controlled data handling are built in.'],
  [RefreshCw, 'Offline-first', 'Keep working through connectivity gaps and sync when you are back online.'],
  [Download, 'PDF-ready', 'Generate professional documents for print, download and sharing.'],
];

const categories = [
  [ShoppingBag, 'Retail & Supermarket', 'Inventory-aware billing, customer records and everyday sales workflows.'],
  [Scissors, 'Tailoring & Boutiques', 'Measurements, custom orders, advances and delivery tracking.'],
  [Stethoscope, 'Clinics & Healthcare', 'Patient ledgers, consultation billing and structured records.'],
  [Wrench, 'Repair & Electronics', 'Job sheets, parts, labour, payment status and warranty notes.'],
  [GraduationCap, 'Coaching & Education', 'Student directories, recurring dues and payment receipts.'],
];

const faqs = [
  ['Does BillQyro work offline?', 'Yes. BillQyro is designed around a local-first architecture so core billing workflows remain usable during connectivity gaps and synchronize when the connection returns.'],
  ['Can customers view an invoice without an account?', 'Yes. A secure Live Link can let a customer view the invoice and follow the configured payment workflow directly from a browser.'],
  ['Can I change the brand theme?', 'Yes. BillQyro uses a semantic theme system so the visual language can adapt without rewriting the application UI.'],
  ['Is my workspace data isolated?', 'Yes. Workspace-aware storage and authenticated synchronization keep business data separated across workspaces.'],
];

const workflow = [
  ['01', 'Create', 'Build the invoice in seconds.'],
  ['02', 'Share', 'Send a PDF or Live Link.'],
  ['03', 'Collect', 'Record payments and proofs.'],
  ['04', 'Reconcile', 'See the ledger and reports.'],
];

const Landing = ({ onLoginSuccess }) => {
  const { isDarkMode } = useTheme();
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalMode, setPortalMode] = useState('business');

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().top - 92,
        behavior: 'smooth',
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className={`billqyro-landing-premium min-h-screen overflow-x-hidden bg-theme-app text-theme-primary ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        .billqyro-landing-premium {
          --bq-emerald: #0aa889;
          --bq-emerald-deep: #087c69;
          --bq-champagne: #caa66a;
          --bq-ivory: #fbfaf7;
        }
        .billqyro-landing-premium .bq-grid {
          background-image: linear-gradient(rgba(10,168,137,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(10,168,137,.045) 1px, transparent 1px);
          background-size: 42px 42px;
        }
        .billqyro-landing-premium .bq-section {
          width: min(100% - 40px, 1240px);
          margin-inline: auto;
        }
        .billqyro-landing-premium .bq-display {
          font-family: Sora, ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -.055em;
        }
        .billqyro-landing-premium .bq-glass {
          background: color-mix(in srgb, var(--bq-ivory) 72%, transparent);
          backdrop-filter: blur(22px);
        }
        .billqyro-landing-premium .bq-shadow {
          box-shadow: 0 30px 90px rgba(15, 23, 42, .10), 0 8px 30px rgba(10,168,137,.06);
        }
        .billqyro-landing-premium #login,
        .billqyro-landing-premium #login * { box-sizing: border-box; }
        .billqyro-landing-premium #login { overflow: hidden; }
        .billqyro-landing-premium #login input,
        .billqyro-landing-premium #login button { max-width: 100%; }
        @media (max-width: 1023px) {
          .billqyro-landing-premium .bq-section { width: min(100% - 28px, 900px); }
          .billqyro-landing-premium #login { padding-top: 1.5rem; padding-bottom: 1.5rem; }
          .billqyro-landing-premium #login .card-premium .card-premium { width: 100% !important; max-width: 520px !important; margin-inline: auto; }
          .billqyro-landing-premium #login section { width: 100%; min-width: 0; border-left: 0 !important; }
        }
        @media (max-width: 640px) {
          .billqyro-landing-premium .bq-section { width: min(100% - 20px, 680px); }
          .billqyro-landing-premium .bq-display { letter-spacing: -.045em; }
          .billqyro-landing-premium #login { padding-inline: .5rem; }
          .billqyro-landing-premium #login > div { border-radius: 24px; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-theme-accent/8 blur-[140px]" />
        <div className="absolute right-[-220px] top-[42%] h-[460px] w-[460px] rounded-full bg-amber-300/5 blur-[130px]" />
        <div className="absolute left-[-240px] top-[66%] h-[420px] w-[420px] rounded-full bg-theme-accent/5 blur-[120px]" />
      </div>

      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${isScrolled ? 'border-b border-theme-border-soft bg-theme-app/88 shadow-lg backdrop-blur-2xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button onClick={() => scrollTo('top')} className="shrink-0" aria-label="BillQyro home">
            <Logo type="horizontal" forceWhiteText={false} />
          </button>

          <nav className="hidden items-center gap-1 rounded-full border border-theme-border-soft bg-theme-card/70 p-1 backdrop-blur-xl md:flex">
            {[
              ['features', 'Platform'],
              ['categories', 'Businesses'],
              ['workflow', 'How it works'],
              ['faq', 'FAQ'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="rounded-full px-4 py-2.5 text-xs font-bold text-theme-muted transition hover:bg-theme-accent/10 hover:text-theme-primary">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
            <button onClick={() => scrollTo('login')} className="hidden rounded-full bg-theme-accent px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-theme-accent/20 transition hover:-translate-y-0.5 sm:block">
              Sign in
            </button>
            <button onClick={() => setMobileMenuOpen((value) => !value)} className="rounded-xl border border-theme-border-soft bg-theme-card p-2.5 md:hidden" aria-label="Open navigation">
              {mobileMenuOpen ? <Menu size={18} /> : <Layers size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-theme-border-soft bg-theme-app/95 px-5 py-3 backdrop-blur-2xl md:hidden">
              {[
                ['features', 'Platform'],
                ['categories', 'Businesses'],
                ['workflow', 'How it works'],
                ['faq', 'FAQ'],
                ['login', 'Sign in'],
              ].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full border-b border-theme-border-soft py-3.5 text-left text-sm font-bold last:border-0">
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top" className="pt-[78px]">
        {/* HERO */}
        <section className="bq-grid relative overflow-hidden border-b border-theme-border-soft">
          <div className="bq-section relative flex min-h-[720px] items-center justify-center py-24 text-center lg:min-h-[790px]">
            <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-theme-accent/10 blur-[110px]" />
            <div className="relative z-10 max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-theme-accent/20 bg-theme-card/75 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-theme-accent shadow-sm backdrop-blur-xl">
                <Sparkles size={13} /> Smart billing. Premium control.
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .75 }} className="bq-display mx-auto max-w-5xl text-5xl font-black leading-[.98] sm:text-6xl lg:text-[82px]">
                Billing that looks as{' '}
                <span className="bg-gradient-to-r from-theme-accent via-[#087c69] to-[#caa66a] bg-clip-text text-transparent">premium</span>{' '}
                as your business.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16, duration: .7 }} className="mx-auto mt-7 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                BillQyro brings invoices, customers, payments, Live Links and analytics into one calm, powerful workspace built for modern businesses.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24, duration: .7 }} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => scrollTo('login')} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-theme-accent px-7 py-4 text-sm font-black text-white shadow-2xl shadow-theme-accent/25 transition hover:-translate-y-1 hover:shadow-theme-accent/35">
                  Start with BillQyro <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </button>
                <button onClick={() => scrollTo('preview')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-theme-border-soft bg-theme-card/75 px-7 py-4 text-sm font-black backdrop-blur-xl transition hover:-translate-y-1 hover:border-theme-accent/30">
                  <BarChart3 size={17} /> Explore the platform
                </button>
              </motion.div>

              <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-7 gap-y-3 text-[11px] font-bold text-theme-muted">
                {['Offline-first', 'Secure workspace', 'Live invoice links', 'Premium themes'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-theme-accent" />{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section id="preview" className="bq-section py-16 sm:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7 }} className="bq-shadow relative overflow-hidden rounded-[34px] border border-theme-border-soft bg-theme-card/80 p-2 backdrop-blur-xl">
            <div className="rounded-[28px] border border-theme-border-soft bg-theme-app p-5 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-5 border-b border-theme-border-soft pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-theme-accent"><span className="h-1.5 w-1.5 rounded-full bg-theme-accent" /> Financial command center</div>
                  <h2 className="bq-display mt-2 text-2xl font-black sm:text-3xl">Your business, at a glance.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-theme-muted">A focused dashboard for revenue, collections and the numbers that actually matter.</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-theme-accent/15 bg-theme-accent/8 px-3.5 py-2 text-[10px] font-black text-theme-accent"><span className="h-1.5 w-1.5 rounded-full bg-theme-accent" /> CLOUD SYNCED</div>
              </div>

              <div className="grid gap-4 py-7 sm:grid-cols-3">
                {[
                  ['Total revenue', '₹ 2,48,650', '+18.4% this month'],
                  ['Collected', '₹ 1,86,420', '+12.7% collected'],
                  ['Outstanding', '₹ 62,230', '12 invoices pending'],
                ].map(([label, value, meta]) => (
                  <div key={label} className="group rounded-2xl border border-theme-border-soft bg-theme-card p-5 transition hover:-translate-y-1 hover:border-theme-accent/25">
                    <p className="text-[11px] font-bold text-theme-muted">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
                    <p className="mt-2 text-[10px] font-black text-theme-accent">{meta}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.5fr_.5fr]">
                <div className="rounded-2xl border border-theme-border-soft bg-theme-card p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="text-sm font-black">Revenue performance</span><TrendingUp size={18} className="text-theme-accent" /></div>
                  <div className="flex h-44 items-end gap-2 sm:gap-3">
                    {[35, 48, 42, 65, 58, 74, 69, 88, 78, 94, 82, 100].map((height, index) => (
                      <motion.div key={index} initial={{ height: 0 }} whileInView={{ height: `${height}%` }} viewport={{ once: true }} transition={{ delay: index * .035, duration: .5 }} className="flex-1 rounded-t-lg bg-gradient-to-t from-theme-accent/15 to-theme-accent/45" />
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-[9px] font-bold text-theme-muted"><span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span></div>
                </div>

                <div className="rounded-2xl border border-theme-border-soft bg-theme-card p-5 sm:p-6">
                  <p className="text-sm font-black">Collection health</p>
                  <div className="mx-auto my-7 flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-theme-accent/10 border-t-theme-accent border-r-theme-accent/70">
                    <div className="text-center"><b className="text-3xl font-black">76%</b><span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-theme-muted">Collected</span></div>
                  </div>
                  <div className="flex items-center justify-between border-t border-theme-border-soft pt-4 text-xs"><span className="text-theme-muted">Pending dues</span><b>₹ 62,230</b></div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FEATURE SYSTEM */}
        <section id="features" className="bq-section py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[.26em] text-theme-accent">The BillQyro platform</span>
            <h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Everything important. Nothing noisy.</h2>
            <p className="mt-5 text-sm leading-7 text-theme-muted sm:text-base">Premium billing should feel clear, fast and intentional. Every module has a purpose.</p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[30px] border border-theme-accent/20 bg-gradient-to-br from-theme-accent/[.09] via-theme-card to-theme-card p-7 lg:col-span-7 lg:p-9">
              <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-theme-accent/10 blur-3xl" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-accent text-white shadow-lg shadow-theme-accent/20"><Zap size={22} /></div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[.22em] text-theme-accent">Core experience</p>
                <h3 className="bq-display mt-2 text-3xl font-black sm:text-4xl">A billing workspace that stays out of your way.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-theme-muted">Create, share, collect and understand your money without jumping through a maze of screens.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {['Invoice creation', 'Customer management', 'Payment tracking', 'Business analytics'].map((item) => <div key={item} className="flex items-center gap-2 text-xs font-bold"><Check size={15} className="text-theme-accent" />{item}</div>)}
                </div>
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
              {featureData.slice(1, 5).map(([Icon, title, desc]) => (
                <motion.div key={title} whileHover={{ y: -4 }} className="rounded-[26px] border border-theme-border-soft bg-theme-card/80 p-6 transition hover:border-theme-accent/25">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 text-theme-accent"><Icon size={19} /></div>
                  <h3 className="mt-5 text-sm font-black">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-theme-muted">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {featureData.slice(0, 1).concat(featureData.slice(5)).map(([Icon, title, desc]) => (
              <motion.div key={title} whileHover={{ y: -3 }} className="flex items-start gap-4 rounded-[26px] border border-theme-border-soft bg-theme-card/70 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme-accent/10 text-theme-accent"><Icon size={19} /></div>
                <div><h3 className="text-sm font-black">{title}</h3><p className="mt-1.5 text-xs leading-6 text-theme-muted">{desc}</p></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BUSINESS CATEGORIES */}
        <section id="categories" className="border-y border-theme-border-soft bg-theme-card/35 py-16 sm:py-20">
          <div className="bq-section">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><span className="text-[10px] font-black uppercase tracking-[.26em] text-theme-accent">Built around real work</span><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Made for your kind of business.</h2></div>
              <p className="max-w-md text-sm leading-7 text-theme-muted">One premium foundation, shaped around the workflows your customers already understand.</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(([Icon, title, desc], index) => (
                <motion.div key={title} whileHover={{ y: -5 }} className={`group relative overflow-hidden rounded-[28px] border border-theme-border-soft bg-theme-card p-6 transition hover:border-theme-accent/25 ${index === 0 ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-accent/10 text-theme-accent"><Icon size={22} /></div><ArrowUpRight size={18} className="text-theme-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-theme-accent" /></div>
                  <h3 className="mt-6 text-base font-black">{title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-theme-muted">{desc}</p>
                  <div className="mt-6 h-1 w-12 rounded-full bg-theme-accent/20 transition-all group-hover:w-20 group-hover:bg-theme-accent" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="bq-section py-16 sm:py-20">
          <div className="overflow-hidden rounded-[34px] border border-theme-border-soft bg-theme-card/75 p-7 sm:p-10 lg:p-12">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl"><span className="text-[10px] font-black uppercase tracking-[.26em] text-theme-accent">Simple operating rhythm</span><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">From invoice to collected cash.</h2></div>
              <div className="inline-flex items-center gap-2 rounded-full border border-theme-accent/15 bg-theme-accent/8 px-4 py-2 text-[10px] font-black text-theme-accent"><FileText size={14} /> One connected workflow</div>
            </div>

            <div className="relative mt-12 grid gap-5 md:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-6 hidden h-px bg-gradient-to-r from-theme-accent/10 via-theme-accent/40 to-theme-accent/10 md:block" />
              {workflow.map(([number, title, desc]) => (
                <div key={number} className="relative">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-theme-accent/20 bg-theme-app text-xs font-black text-theme-accent shadow-sm">{number}</div>
                  <h3 className="mt-5 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-theme-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="bq-section pb-16 sm:pb-20">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Lock, 'Private workspaces', 'Business data stays separated.'],
              [ShieldCheck, 'Controlled access', 'Authentication and permissions.'],
              [Globe2, 'Live customer links', 'Share invoices from any browser.'],
              [Smartphone, 'Built for every screen', 'Desktop, tablet and mobile.'],
            ].map(([Icon, title, desc]) => (
              <div key={title} className="rounded-2xl border border-theme-border-soft bg-theme-card/70 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 text-theme-accent"><Icon size={18} /></div>
                <h3 className="mt-4 text-sm font-black">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-theme-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-y border-theme-border-soft bg-theme-card/25 py-16 sm:py-20">
          <div className="bq-section">
            <div className="mx-auto max-w-3xl text-center"><span className="text-[10px] font-black uppercase tracking-[.26em] text-theme-accent">Questions</span><h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Frequently asked.</h2><p className="mt-4 text-sm leading-7 text-theme-muted">A few answers before you make BillQyro part of your daily workflow.</p></div>
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[28px] border border-theme-border-soft bg-theme-card">
              {faqs.map(([question, answer], index) => (
                <div key={question} className="border-b border-theme-border-soft last:border-0">
                  <button onClick={() => setFaqOpen(faqOpen === index ? null : index)} className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-sm font-black sm:px-7" aria-expanded={faqOpen === index}>
                    <span>{question}</span>
                    <ChevronDown size={18} className={`shrink-0 transition ${faqOpen === index ? 'rotate-180 text-theme-accent' : 'text-theme-muted'}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === index && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="px-6 pb-6 text-sm leading-7 text-theme-muted sm:px-7">{answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LOGIN / PORTAL */}
        <section id="login" className="bq-section py-16 sm:py-20">
          <div className="bq-shadow overflow-hidden rounded-[34px] border border-theme-accent/15 bg-theme-card">
            <div className="relative overflow-hidden border-b border-theme-border-soft bg-gradient-to-br from-theme-accent/[.09] via-theme-card to-theme-card px-6 py-10 text-center sm:px-10 sm:py-12">
              <div className="absolute left-1/2 top-[-120px] h-72 w-72 -translate-x-1/2 rounded-full bg-theme-accent/10 blur-[90px]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-theme-accent/15 bg-theme-card/80 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.18em] text-theme-accent"><Users size={13} /> Secure access</span>
                <h2 className="bq-display mt-4 text-3xl font-black sm:text-4xl">Enter your BillQyro workspace.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-theme-muted">Business owners can sign in to manage billing. Customers can access their invoice portal separately.</p>
                <div className="mx-auto mt-7 flex max-w-md rounded-xl border border-theme-border-soft bg-theme-app p-1">
                  <button onClick={() => setPortalMode('business')} className={`flex-1 rounded-lg py-2.5 text-[11px] font-black transition ${portalMode === 'business' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted hover:text-theme-primary'}`}>Business Login / Register</button>
                  <button onClick={() => setPortalMode('customer')} className={`flex-1 rounded-lg py-2.5 text-[11px] font-black transition ${portalMode === 'customer' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted hover:text-theme-primary'}`}>Customer Portal</button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-9 lg:p-10">
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
        </section>

        {/* FINAL CTA */}
        <section className="bq-section pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-[34px] border border-theme-accent/20 bg-theme-accent px-6 py-14 text-center text-white sm:px-10 sm:py-16">
            <div className="absolute left-1/2 top-[-170px] h-96 w-96 -translate-x-1/2 rounded-full bg-white/10 blur-[100px]" />
            <div className="relative mx-auto max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-[.28em] text-white/75">BillQyro</span>
              <h2 className="bq-display mt-3 text-4xl font-black sm:text-5xl">Your business deserves better billing.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80">Turn everyday billing into a polished customer experience—without adding complexity to your day.</p>
              <button onClick={() => scrollTo('login')} className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-theme-accent shadow-xl transition hover:-translate-y-1">Get started <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-theme-border-soft bg-theme-app px-5 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3"><Logo type="horizontal" forceWhiteText={false} /><span className="text-[10px] font-bold text-theme-muted">© 2026 BillQyro Platform</span></div>
          <div className="flex flex-wrap justify-center gap-5 text-xs font-bold text-theme-muted"><button onClick={() => scrollTo('faq')} className="transition hover:text-theme-accent">Help</button><button onClick={() => scrollTo('login')} className="transition hover:text-theme-accent">Sign In</button><span>Smart Billing. Premium Invoicing Platform.</span></div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
