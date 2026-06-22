import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, TrendingUp, Users, Sparkles, Download, Link2, Smartphone, Printer, CreditCard, Star, HelpCircle, ChevronDown, MessageCircle, Mail, MapPin, DollarSign, Clock, BarChart3, QrCode, Globe, Zap } from 'lucide-react';
import Logo from '../components/Logo';

const Landing = ({ onLoginClick }) => {
  const [faqOpen, setFaqOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('billqyro_theme_color') || 'pink';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const features = [
    { icon: Zap, title: 'Instant Invoicing', desc: 'Create professional invoices in seconds with smart templates. Auto-calculate taxes, discounts, and totals.' },
    { icon: Users, title: 'Client CRM', desc: 'Manage customer database with purchase history, balances, and communication logs.' },
    { icon: BarChart3, title: 'Analytics & Reports', desc: 'Visual revenue insights, top clients, overdue tracking, and exportable reports.' },
    { icon: Globe, title: 'Live Invoice Links', desc: 'Share invoices via secure public links. Customers can view, pay, and submit proof online.' },
    { icon: Printer, title: 'Premium PDF Export', desc: 'Generate A4/A5 PDF invoices with logo, QR code, and category-specific templates.' },
    { icon: Smartphone, title: 'Works Offline', desc: 'PWA-enabled. Create and manage invoices even without internet. Syncs when online.' },
  ];

  const templates = [
    { name: 'Tailor', icon: '✂️', desc: 'Measurements, stitching, design tracking' },
    { name: 'Embroidery', icon: '🧵', desc: 'Design no, work type, size, rate per piece' },
    { name: 'Doctor', icon: '🩺', desc: 'Consultation fees, prescriptions, clinic management' },
    { name: 'Teacher', icon: '📚', desc: 'Tuition fees, subject-wise billing, monthly tracking' },
    { name: 'Retail', icon: '🏪', desc: 'Product sales, variants, discounts, stock tracking' },
    { name: 'Repair', icon: '🔧', desc: 'Service orders, parts cost, labour charges' },
  ];

  const pricingPlans = [
    { name: 'Free', price: '₹0', period: 'forever', features: ['15 invoices', 'Basic PDF', 'Customer management', 'Cloud sync'], cta: 'Get Started', popular: false },
    { name: 'Premium', price: '₹199', period: '/month', features: ['Unlimited invoices', 'Premium PDF templates', 'Live invoice links', 'Payment proofs', 'WhatsApp sharing', 'Advanced reports', 'Priority support'], cta: 'Start Free Trial', popular: true },
    { name: 'Lifetime', price: '₹1,999', period: 'one-time', features: ['Everything in Premium', 'All future updates', 'Priority support', 'Early access features', 'Custom branding'], cta: 'Get Lifetime', popular: false },
  ];

  const faqs = [
    { q: 'Is BillQyro free to use?', a: 'Yes! BillQyro offers a generous free plan with 15 invoices, customer management, and basic PDF generation. Upgrade to Premium for unlimited access.' },
    { q: 'Can I use BillQyro offline?', a: 'Absolutely. BillQyro is a Progressive Web App (PWA) that works offline. Create invoices, manage customers, and sync automatically when reconnected.' },
    { q: 'Is my data secure?', a: 'Enterprise-grade security. All data is encrypted in transit and at rest. Firebase authentication and Firestore rules ensure complete data isolation between users.' },
    { q: 'Can customers pay online?', a: 'Yes! Share a live invoice link. Customers can view details, scan QR codes, make payments, and upload payment proof for verification.' },
    { q: 'What invoice templates are available?', a: 'BillQyro supports Tailor, Embroidery, Doctor, Teacher, Retail, Repair, Grocery, and Custom templates — each with tailored fields.' },
    { q: 'Can I export invoices as PDF?', a: 'Yes. Generate professional A4 or A5 PDF invoices with your logo, business info, QR code, and itemized details.' },
  ];

  return (
    <div className="min-h-screen bg-theme-app text-theme-primary font-sans selection:bg-theme-accent selection:text-white flex flex-col">
      {/* ===== PREMIUM GLASS NAVBAR ===== */}
      <nav className="glass border-b border-theme-border-soft/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo type="horizontal" forceWhiteText={false} />
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Features</button>
            <button onClick={() => scrollTo('templates')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Templates</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">FAQ</button>
            <button onClick={() => scrollTo('contact')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Contact</button>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={onLoginClick} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors hidden sm:block">Log in</button>
            <button onClick={onLoginClick} className="btn-premium px-6 py-2.5 text-sm">Get Started Free</button>
            
            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-theme-primary">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-theme-border-soft/50 bg-theme-card/95 backdrop-blur-md px-6 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Features</button>
            <button onClick={() => scrollTo('templates')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Templates</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">FAQ</button>
            <button onClick={() => scrollTo('contact')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Contact</button>
          </motion.div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-theme-accent opacity-[0.03] dark:opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface border border-theme-border-soft shadow-sm">
              <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              <span className="badge-premium text-[10px] tracking-wide">The future of billing is here</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-theme-primary leading-[1.1]">
              Smart billing for <br className="hidden lg:block" />
              <span className="text-gradient-premium">modern business.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-theme-muted max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Streamline your invoicing process, manage customers effortlessly, and get paid faster with BillQyro's premium SaaS platform.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={onLoginClick} className="btn-premium w-full sm:w-auto px-8 py-4 text-base">
                Start Invoicing Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => scrollTo('features')} className="btn-premium-outline w-full sm:w-auto px-8 py-4 text-base">
                Explore Features
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-4 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-theme-muted text-sm font-semibold">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> 15 free invoices</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> PWA offline mode</div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="flex-1 w-full relative">
            <div className="card-premium rounded-3xl overflow-hidden border border-theme-border-soft shadow-2xl bg-theme-card">
              <div className="aspect-video bg-theme-surface w-full p-2 flex flex-col">
                <div className="flex gap-1.5 p-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-theme-warning"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-theme-app rounded-xl border border-theme-border-soft p-4 sm:p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[image:var(--accent-gradient)]"></div>
                    <div className="h-8 w-40 bg-theme-surface rounded border border-theme-border-soft"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-20 bg-theme-surface rounded-xl border border-theme-border-soft p-3 flex flex-col justify-between">
                      <div className="h-3 w-16 bg-theme-accent/30 rounded"></div>
                      <div className="h-6 w-24 bg-theme-accent/40 rounded"></div>
                    </div>
                    <div className="flex-1 h-20 bg-theme-surface rounded-xl border border-theme-border-soft p-3 flex flex-col justify-between">
                      <div className="h-3 w-12 bg-theme-muted/20 rounded"></div>
                      <div className="h-6 w-20 bg-theme-muted/30 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-theme-surface rounded-xl border border-theme-border-soft p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full bg-theme-accent"></div>
                      <div className="h-3 w-32 bg-theme-muted/20 rounded"></div>
                      <div className="h-3 w-16 bg-theme-muted/20 rounded ml-auto"></div>
                    </div>
                    <div className="h-3 w-full bg-theme-muted/10 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-theme-card p-3 sm:p-4 rounded-2xl border border-theme-border-soft shadow-premium flex items-center gap-3 sm:gap-4" style={{ animation: 'bounce 3s ease-in-out infinite' }}>
              <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-theme-accent" /></div>
              <div><p className="text-[10px] uppercase font-bold text-theme-muted">Total Revenue</p><p className="text-base sm:text-lg font-black text-theme-primary">₹12,450</p></div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== FEATURES ===== */}
      <motion.section id="features" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Powerful Features</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Everything you need to run your billing.</h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">Powerful features wrapped in an elegant interface, designed specifically for modern teams and growing businesses.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={staggerItem} className="card-premium p-6 sm:p-8 rounded-3xl hover:border-theme-accent/30 transition-all duration-300 group hover:shadow-lg hover:shadow-theme-accent/5">
                <div className="w-12 h-12 rounded-2xl bg-theme-card border border-theme-border-soft flex items-center justify-center mb-5 group-hover:scale-110 transition-transform group-hover:bg-theme-accent/10 group-hover:border-theme-accent/30"><feature.icon className="w-6 h-6 text-theme-accent" /></div>
                <h3 className="text-lg font-bold text-theme-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-theme-muted font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== LIVE LINK SHOWCASE ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
              <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Live Invoice Link</span>
              <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Share invoices with a <span className="text-gradient-premium">secure link.</span></h2>
              <p className="text-theme-muted font-medium text-base leading-relaxed mb-8 max-w-xl">Customers can view their invoice online, scan QR codes to pay, and submit payment proof — all without creating an account.</p>
              <div className="space-y-4">
                {[
                  { icon: Link2, text: 'Unique secure link per invoice' },
                  { icon: QrCode, text: 'UPI / bKash / Nagad QR codes' },
                  { icon: ShieldCheck, text: 'Payment proof upload & verification' },
                  { icon: MessageCircle, text: 'WhatsApp & contact buttons' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0"><item.icon className="w-4 h-4" /></div><p className="text-sm font-bold text-theme-primary">{item.text}</p></div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 w-full">
              <div className="card-premium rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-theme-border-soft">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-bold text-sm">B</div>
                  <div><p className="text-sm font-extrabold text-theme-primary">Business Name</p><p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Digital Invoice · INV-2026-0001</p></div>
                  <div className="ml-auto px-3 py-1.5 bg-theme-surface rounded-xl border border-theme-border-soft text-[10px] font-bold flex items-center gap-1"><Download className="w-3 h-3" /> PDF</div>
                </div>
                <div className="bg-gradient-to-br from-theme-accent to-theme-accent-dark text-white rounded-2xl p-5 shadow-lg">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Amount Due</p>
                  <p className="text-4xl sm:text-5xl font-black mt-1 tracking-tight leading-none">₹1,500</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[8px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Awaiting Payment
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-theme-surface rounded-xl p-3 border border-theme-border-soft text-center">
                    <div className="w-16 h-16 mx-auto bg-theme-surface rounded-lg border border-theme-border-soft flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-theme-muted" />
                    </div>
                    <p className="text-[9px] mt-2 font-bold text-theme-muted">Scan to Pay</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><p className="text-[10px] font-bold text-theme-primary flex-1">UPI: merchant@upi</p></div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"><MessageCircle className="w-3.5 h-3.5 text-emerald-500" /><p className="text-[10px] font-bold text-emerald-600">Pay via WhatsApp</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== PDF SHOWCASE ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 order-2 lg:order-1 w-full">
              <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-premium p-4 sm:p-6 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-theme-border-soft">
                  <div className="w-10 h-10 rounded-lg bg-theme-accent text-white flex items-center justify-center font-bold">B</div>
                  <div><p className="text-sm font-bold text-theme-primary">Business Name</p><p className="text-[9px] text-theme-muted font-semibold">GSTIN: 29AAAAA0000A1Z5</p></div>
                  <div className="ml-auto text-right"><p className="text-[10px] font-bold text-theme-primary">INVOICE</p><p className="text-[8px] text-theme-muted">#INV-2026-0001</p></div>
                </div>
                <div className="flex gap-3 mb-4 text-[10px]">
                  <div className="flex-1"><p className="text-[8px] font-bold text-theme-muted uppercase mb-1">Bill To</p><p className="font-bold text-theme-primary">Customer Name</p><p className="text-theme-muted">Phone: +91 98765 43210</p></div>
                  <div className="flex-1 text-right"><p className="text-[8px] font-bold text-theme-muted uppercase mb-1">Date</p><p className="font-bold text-theme-primary">15/06/2026</p><p className="text-theme-muted">Due: 30/06/2026</p></div>
                </div>
                <div className="border border-theme-border-soft rounded-lg overflow-hidden text-[9px] mb-3">
                  <div className="flex bg-theme-surface font-bold p-2 text-theme-muted">
                    <div className="flex-1">Item</div><div className="w-12 text-center">Qty</div><div className="w-16 text-right">Rate</div><div className="w-16 text-right">Amount</div>
                  </div>
                  <div className="flex p-2 border-t border-theme-border-soft"><div className="flex-1 font-bold text-theme-primary">Product/Service</div><div className="w-12 text-center text-theme-muted">2</div><div className="w-16 text-right text-theme-muted">₹500</div><div className="w-16 text-right font-bold text-theme-primary">₹1,000</div></div>
                </div>
                <div className="text-right space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-theme-muted">Subtotal</span><span className="font-bold text-theme-primary">₹1,000</span></div>
                  <div className="flex justify-between"><span className="text-theme-muted">GST (18%)</span><span className="font-bold text-theme-primary">₹180</span></div>
                  <div className="flex justify-between border-t border-theme-border-soft pt-1"><span className="font-bold text-theme-primary">Grand Total</span><span className="font-bold text-lg text-theme-accent">₹1,180</span></div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 order-1 lg:order-2">
              <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Premium PDF</span>
              <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Professional <span className="text-gradient-premium">A4/A5 PDF</span> invoices.</h2>
              <p className="text-theme-muted font-medium text-base leading-relaxed mb-8 max-w-xl">Generate beautiful PDF invoices with your logo, business details, QR code, and category-specific layouts. Ready to print or share.</p>
              <div className="space-y-4">
                {[
                  { icon: Printer, text: 'A4 and A5 page sizes' },
                  { icon: FileSpreadsheet, text: '6+ category-specific templates' },
                  { icon: QrCode, text: 'UPI/bKash/Nagad QR codes on PDF' },
                  { icon: Download, text: 'Professional filename: Invoice_Number_Business_Date.pdf' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0"><item.icon className="w-4 h-4" /></div><p className="text-sm font-bold text-theme-primary">{item.text}</p></div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== TEMPLATES ===== */}
      <motion.section id="templates" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Category Templates</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Templates for every <span className="text-gradient-premium">business type.</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">Pre-built templates with custom fields tailored for each industry.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {templates.map((tpl, idx) => (
              <motion.div key={idx} variants={staggerItem} className="card-premium p-5 sm:p-6 rounded-2xl hover:border-theme-accent/30 transition-all duration-300 group cursor-default">
                <div className="text-3xl mb-3">{tpl.icon}</div>
                <h3 className="text-lg font-bold text-theme-primary mb-1">{tpl.name}</h3>
                <p className="text-sm text-theme-muted font-medium">{tpl.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== STATS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft bg-theme-surface py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: '10K+', label: 'Invoices Generated', icon: FileSpreadsheet },
              { number: '500+', label: 'Active Businesses', icon: Users },
              { number: '99.9%', label: 'Uptime Guarantee', icon: ShieldCheck },
              { number: '₹2Cr+', label: 'Invoices Processed', icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center stat-premium rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center mx-auto mb-3"><stat.icon className="w-6 h-6" /></div>
                <p className="text-2xl sm:text-3xl font-black text-theme-primary">{stat.number}</p>
                <p className="text-sm text-theme-muted font-semibold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== TESTIMONIALS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Trusted by <span className="text-gradient-premium">business owners</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">See what our customers say about their BillQyro experience.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Rajesh Kumar', role: 'Retail Store Owner', location: 'Mumbai', avatar: 'RK', text: 'BillQyro transformed how I manage my billing. The PDF invoices look professional and my customers love the payment links.', rating: 5 },
              { name: 'Fatima Begum', role: 'Embroidery Studio', location: 'Dhaka', avatar: 'FB', text: 'The embroidery-specific template with design numbers and work types saved me hours. Best billing app for Bangladeshi businesses!', rating: 5 },
              { name: 'Ananya Sharma', role: 'Clinic Manager', location: 'Delhi', avatar: 'AS', text: 'Switched from paper prescriptions to BillQyro. The medical disclaimers on invoices and patient management are exactly what we needed.', rating: 5 }
            ].map((t, i) => (
              <motion.div key={i} variants={staggerItem} className="card-premium p-6 sm:p-8 rounded-3xl hover:border-theme-accent/30 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-theme-muted font-medium leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[image:var(--accent-gradient)] flex items-center justify-center text-white text-xs font-black">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-theme-primary">{t.name}</p>
                    <p className="text-xs text-theme-muted font-medium">{t.role} • {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CUSTOMER BENEFITS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Why Choose BillQyro</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Built for <span className="text-gradient-premium">growing businesses</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">Everything you need to run your billing operations smoothly.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Create invoices in under 30 seconds with smart auto-fill and templates' },
              { icon: ShieldCheck, title: 'Bank-Grade Security', desc: '256-bit encryption with Firebase authentication and Firestore rules' },
              { icon: Smartphone, title: 'Works Anywhere', desc: 'PWA-enabled with full offline support. Create invoices even on a train' },
              { icon: Globe, title: 'Multi-Currency', desc: 'Support for INR, BDT, USD with automatic tax configuration per country' },
              { icon: Download, title: 'Professional PDFs', desc: 'A4 and A5 PDF with your logo, QR codes, and category-specific templates' },
              { icon: MessageCircle, title: 'WhatsApp Integration', desc: 'Send invoices and payment reminders directly via WhatsApp' }
            ].map((benefit, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-4 p-4">
                <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0"><benefit.icon className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary mb-1">{benefit.title}</h3>
                  <p className="text-sm text-theme-muted font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== PRICING ===== */}
      <motion.section id="pricing" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Simple Pricing</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Transparent plans for <span className="text-gradient-premium">every business.</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">Start free, upgrade when you need more. No hidden fees.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <motion.div key={idx} variants={staggerItem} className={`relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 ${
                plan.popular ? 'border-theme-accent bg-theme-accent/5 shadow-xl shadow-theme-accent/10 scale-[1.02] md:scale-105' : 'card-premium hover:border-theme-accent/30'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[image:var(--accent-gradient)] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Most Popular</div>
                )}
                <h3 className="text-lg font-bold text-theme-primary mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-theme-primary">{plan.price}</span>
                  <span className="text-sm text-theme-muted font-semibold">{plan.period}</span>
                </div>
                <ul className="space-y-3 my-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-theme-muted"><CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={onLoginClick} className={`w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 ${
                  plan.popular ? 'bg-[image:var(--accent-gradient)] text-white shadow-lg hover:opacity-90' : 'bg-theme-surface border border-theme-border-soft text-theme-primary hover:bg-theme-accent hover:text-white hover:border-theme-accent'
                }`}>{plan.cta}</button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== FAQ ===== */}
      <motion.section id="faq" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Frequently asked questions.</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div key={idx} variants={staggerItem} className="card-premium rounded-2xl overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === idx ? null : idx)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer">
                  <span className="text-sm sm:text-base font-bold text-theme-primary pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-theme-muted shrink-0 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`} />
                </button>
                <motion.div initial={false} animate={{ height: faqOpen === idx ? 'auto' : 0, opacity: faqOpen === idx ? 1 : 0 }} className="overflow-hidden">
                  <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-theme-muted font-medium leading-relaxed">{faq.a}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CTA ===== */}
      <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Get Started</span>
            <h2 className="text-3xl md:text-5xl font-black text-theme-primary tracking-tight mb-4">Ready to simplify your billing?</h2>
            <p className="text-theme-muted font-medium text-base sm:text-lg max-w-2xl mx-auto mb-8">Join thousands of businesses using BillQyro to create, manage, and track invoices effortlessly.</p>
            <button onClick={onLoginClick} className="btn-premium px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-theme-muted font-semibold mt-4">No credit card required · 15 free invoices · Cancel anytime</p>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="border-t border-theme-border-soft bg-theme-surface py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Contact</h3>
              <div className="space-y-3 text-sm text-theme-muted font-medium">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-theme-accent" /> support@billqyro.com</div>
                <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-theme-accent" /> WhatsApp: +91 98765 43210</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-theme-accent" /> BillQyro Technologies, India</div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Product</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => scrollTo('features')} className="block hover:text-theme-accent transition-colors">Features</button>
                <button onClick={() => scrollTo('templates')} className="block hover:text-theme-accent transition-colors">Templates</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-theme-accent transition-colors">Pricing</button>
                <button onClick={() => scrollTo('faq')} className="block hover:text-theme-accent transition-colors">FAQ</button>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => window.open('/privacy', '_blank')} className="block hover:text-theme-accent transition-colors">Privacy Policy</button>
                <button onClick={() => window.open('/terms', '_blank')} className="block hover:text-theme-accent transition-colors">Terms of Service</button>
                <button onClick={() => window.open('/refund', '_blank')} className="block hover:text-theme-accent transition-colors">Refund Policy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-theme-border-soft py-8 bg-theme-app text-center">
        <Logo type="horizontal" forceWhiteText={false} />
        <p className="text-theme-muted text-xs font-semibold mt-4">© {new Date().getFullYear()} BillQyro Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
