import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp, buttonTap, cardHover, scaleOnHover } from '../utils/animations';
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, TrendingUp, Users, Sparkles, Download, Link2, Smartphone, Printer, CreditCard, Star, HelpCircle, ChevronDown, MessageCircle, Mail, MapPin, DollarSign, Clock, BarChart3, Globe, Zap } from 'lucide-react';
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('billqyro_theme_color') || 'pink';
    // Handled by ThemeContext
    
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

  const features = [
    { icon: Zap, title: 'Instant Invoicing', desc: 'Create professional invoices in seconds with smart templates. Auto-calculate taxes, discounts, and totals.' },
    { icon: Users, title: 'Client CRM', desc: 'Manage customer database with purchase history, balances, and communication logs.' },
    { icon: BarChart3, title: 'Analytics & Reports', desc: 'Visual revenue insights, top clients, overdue tracking, and exportable reports.' },
    { icon: Globe, title: 'Live Invoice Links', desc: 'Share invoices via secure public links. Customers can view, pay, and submit proof online.' },
    { icon: Printer, title: 'Premium PDF Export', desc: 'Generate A4/A5 PDF invoices with logo, QR code, and category-specific templates.' },
    { icon: Smartphone, title: 'Works Offline', desc: 'PWA-enabled. Create and manage invoices even without internet. Syncs when online.' },
  ];

  const templates = [
    { name: 'Tailor', icon: '\u2702\uFE0F', desc: 'Measurements, stitching, design tracking' },
    { name: 'Embroidery', icon: '\uD83E\uDDF5', desc: 'Design no, work type, size, rate per piece' },
    { name: 'Doctor', icon: '\uD83E\uDDBA', desc: 'Consultation fees, prescriptions, clinic management' },
    { name: 'Teacher', icon: '\uD83D\uDCDA', desc: 'Tuition fees, subject-wise billing, monthly tracking' },
    { name: 'Retail', icon: '\uD83C\uDFEA', desc: 'Product sales, variants, discounts, stock tracking' },
    { name: 'Repair', icon: '\uD83D\uDD27', desc: 'Service orders, parts cost, labour charges' },
  ];

  const pricingPlans = [
    { name: 'Free', price: '\u20B90', period: 'forever', features: ['15 invoices', 'Basic PDF', 'Customer management', 'Cloud sync'], cta: 'Get Started', popular: false },
    { name: 'Premium', price: '\u20B9199', period: '/month', features: ['Unlimited invoices', 'Premium PDF templates', 'Live invoice links', 'Payment proofs', 'WhatsApp sharing', 'Advanced reports', 'Priority support'], cta: 'Start Free Trial', popular: true },
    { name: 'Lifetime', price: '\u20B91,999', period: 'one-time', features: ['Everything in Premium', 'All future updates', 'Priority support', 'Early access features', 'Custom branding'], cta: 'Get Lifetime', popular: false },
  ];

  const faqs = [
    { q: 'Is BillQyro free to use?', a: 'Yes! BillQyro offers a generous free plan with 15 invoices, customer management, and basic PDF generation. Upgrade to Premium for unlimited access.' },
    { q: 'Can I use BillQyro offline?', a: 'Absolutely. BillQyro is a Progressive Web App (PWA) that works offline. Create invoices, manage customers, and sync automatically when reconnected.' },
    { q: 'Is my data secure?', a: 'Enterprise-grade security. All data is encrypted in transit and at rest. Firebase authentication and Firestore rules ensure complete data isolation between users.' },
    { q: 'Can customers pay online?', a: 'Yes! Share a live invoice link. Customers can view details, scan QR codes, make payments, and upload payment proof for verification.' },
    { q: 'What invoice templates are available?', a: 'BillQyro supports Tailor, Embroidery, Doctor, Teacher, Retail, Repair, Grocery, and Custom templates \u2014 each with tailored fields.' },
    { q: 'Can I export invoices as PDF?', a: 'Yes. Generate professional A4 or A5 PDF invoices with your logo, business info, QR code, and itemized details.' },
  ];

  return (
    <div className="min-h-screen bg-theme-app text-theme-primary font-sans selection:bg-theme-accent selection:text-white flex flex-col relative">
      {/* ===== HERO BACKGROUND ===== */}
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-theme-app/40 via-transparent to-theme-app -z-10 pointer-events-none"></div>

      {/* ===== PREMIUM GLASS NAVBAR ===== */}
      <nav className={`fixed w-full top-4 z-50 transition-all duration-500 flex justify-center px-4`}>
        <div className={`w-full max-w-7xl rounded-full transition-all duration-500 px-6 h-16 flex items-center justify-between ${isScrolled ? 'bg-theme-card/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-transparent border border-transparent'}`}>
          <Logo type="horizontal" forceWhiteText={false} />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Features</button>
            <button onClick={() => scrollTo('screenshots')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Screenshots</button>
            <button onClick={() => scrollTo('templates')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Templates</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">FAQ</button>
            <button onClick={() => scrollTo('contact')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => scrollTo('login')} className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors hidden sm:block">Log in</button>
            <a href="/BillQyro-Setup.exe" download className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-theme-border-soft hover:bg-theme-surface hover:text-theme-primary text-theme-muted text-sm font-bold transition-all shadow-sm">
              <Download className="w-4 h-4" /> Windows App
            </a>
            <button onClick={() => scrollTo('login')} className="btn-premium px-6 py-2.5 text-sm">Get Started</button>
            <AnimatedThemeToggler 
              theme={isDarkMode ? "dark" : "light"}
              onThemeChange={(newTheme) => {
                const newDarkMode = newTheme === "dark";
                if (newDarkMode !== isDarkMode) {
                  toggleTheme();
                }
              }}
            />

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
            <button onClick={() => scrollTo('screenshots')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Screenshots</button>
            <button onClick={() => scrollTo('templates')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Templates</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">FAQ</button>
            <button onClick={() => scrollTo('contact')} className="block w-full text-left text-sm font-bold text-theme-primary py-2">Contact</button>
          </motion.div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <ScrollReveal className="relative overflow-hidden min-h-[90vh] flex items-center pt-16">
        {/* Massive Luxury Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-theme-primary/5 via-theme-app to-theme-app -z-10"></div>
        
        {/* Floating 3D Elements */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-[10%] w-24 h-24 rounded-3xl bg-gradient-to-br from-theme-primary/20 to-theme-accent/20 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center -rotate-12"><FileSpreadsheet className="w-10 h-10 text-theme-primary opacity-50" /></motion.div>
          <motion.div animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-1/4 right-[5%] w-32 h-32 rounded-full bg-gradient-to-br from-theme-accent/10 to-theme-primary/10 backdrop-blur-3xl border border-white/5 shadow-2xl flex items-center justify-center rotate-45"><TrendingUp className="w-12 h-12 text-theme-accent opacity-40" /></motion.div>
          <motion.div animate={{ x: [0, 20, 0], rotate: [0, 45, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-1/3 right-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-primary/20 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center rotate-12"><Zap className="w-8 h-8 text-theme-accent opacity-60" /></motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-16 relative z-10 w-full">
          <div className="flex-1 text-center lg:text-left space-y-8 lg:pr-8">
            <motion.div initial={{ rotate: -10, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring", bounce: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-theme-surface/80 backdrop-blur-md border border-theme-border-soft shadow-glass">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse shadow-[0_0_8px_var(--accent-glow)]"></span>
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-theme-primary">The Future of Enterprise Billing</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }} className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tight text-theme-primary leading-[1.05]">
              Smart billing for <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)] animate-gradient-x">modern business.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-lg sm:text-xl text-theme-muted max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Streamline your invoicing process, manage customers effortlessly, and get paid faster with BillQyro's premium SaaS platform.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <motion.button variants={buttonTap} initial="rest" whileHover="hover" whileTap="tap" onClick={() => scrollTo('login')} className="group relative overflow-hidden rounded-2xl bg-theme-primary text-white w-full sm:w-auto px-10 py-5 text-lg font-bold shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_8px_40px_rgba(var(--primary-rgb),0.5)] transition-all">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <div className="relative flex items-center justify-center gap-2">
                  Start Invoicing Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
              <motion.a href="/BillQyro-Setup.exe" download variants={buttonTap} initial="rest" whileHover="hover" whileTap="tap" className="flex items-center justify-center gap-2 rounded-2xl bg-theme-surface border-2 border-theme-border-soft hover:border-theme-primary text-theme-primary w-full sm:w-auto px-10 py-4.5 text-lg font-bold shadow-sm transition-all hover:shadow-glass">
                <Download className="w-5 h-5" /> Download (.exe)
              </motion.a>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="pt-6 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-theme-muted text-sm font-bold">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-theme-accent/20 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" /></div> No credit card required</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-theme-accent/20 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" /></div> 15 free invoices</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-theme-accent/20 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" /></div> PWA offline mode</div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0, y: [0, -15, 0] }} transition={{ opacity: {delay: 0.4, duration: 1}, x: {delay: 0.4, duration: 1, type: "spring"}, y: {duration: 6, repeat: Infinity, ease: "easeInOut"} }} className="flex-1 w-full relative perspective-1000">
            <div className="rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-br from-theme-surface/90 to-theme-surface/50 backdrop-blur-2xl transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="aspect-video bg-theme-app/50 w-full p-4 flex flex-col">
                <div className="flex gap-2 p-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80 shadow-inner"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-inner"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-inner"></div>
                </div>
                <div className="flex-1 bg-theme-surface/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-theme-primary to-blue-500 shadow-lg"></div>
                    <div className="h-6 w-48 bg-theme-muted/10 rounded-full"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 h-24 bg-gradient-to-br from-theme-primary/10 to-transparent rounded-2xl border border-theme-primary/20 p-4 flex flex-col justify-between">
                      <div className="h-4 w-20 bg-theme-primary/30 rounded-full"></div>
                      <div className="h-8 w-32 bg-theme-primary/40 rounded-lg"></div>
                    </div>
                    <div className="flex-1 h-24 bg-theme-muted/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                      <div className="h-4 w-16 bg-theme-muted/20 rounded-full"></div>
                      <div className="h-8 w-24 bg-theme-muted/30 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-theme-muted/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-theme-primary/50"></div>
                      <div className="h-4 w-full bg-theme-muted/10 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-theme-primary/30"></div>
                      <div className="h-4 w-3/4 bg-theme-muted/10 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Earnings Widget */}
            <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -bottom-8 -left-8 bg-theme-surface/90 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.2)] flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"><TrendingUp className="w-7 h-7 text-white" /></div>
              <div><p className="text-xs uppercase font-black tracking-wider text-theme-muted mb-1">Total Revenue</p><p className="text-2xl font-black text-theme-primary font-numbers tracking-tight">{'\u20B9'}1,24,450</p></div>
            </motion.div>
          </motion.div>
        </div>
      </ScrollReveal>

      {/* ===== LOGIN SECTION ===== */}
      <motion.section id="login" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft bg-theme-surface/50 relative z-10 py-12">
        <div className="max-w-md mx-auto px-4 mb-6">
          <div className="flex bg-theme-card p-1 rounded-xl border border-theme-border-soft shadow-sm">
            <button
              onClick={() => setPortalMode('business')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${portalMode === 'business' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted hover:text-theme-primary'}`}
            >
              Business Login
            </button>
            <button
              onClick={() => setPortalMode('customer')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${portalMode === 'customer' ? 'bg-theme-accent text-white shadow-md' : 'text-theme-muted hover:text-theme-primary'}`}
            >
              Customer Portal
            </button>
          </div>
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
      </motion.section>

      {/* ===== FEATURES ===== */}
      <motion.section id="features" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-white/5 bg-theme-surface/50 py-24 lg:py-32 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-theme-primary/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-flex items-center gap-2 badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light/50 px-5 py-2 rounded-full mb-6 border border-theme-accent/20">
              <Sparkles className="w-3.5 h-3.5" /> Powerful Features
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-6">Everything you need to <br className="hidden md:block"/>run your <span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)]">billing operations.</span></h2>
            <p className="text-theme-muted font-medium text-lg max-w-2xl mx-auto">Powerful features wrapped in an elegant interface, designed specifically for modern teams and growing businesses.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={staggerItem} whileHover={{ y: -10, scale: 1.02 }} className="group relative rounded-[2rem] bg-theme-card/80 backdrop-blur-xl border border-white/10 p-8 hover:bg-theme-surface transition-all duration-500 shadow-glass">
                <div className="absolute inset-0 rounded-[2rem] bg-[image:var(--accent-gradient)] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-theme-surface to-theme-app border border-white/10 shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <feature.icon className="w-7 h-7 text-theme-accent" />
                  </div>
                  <h3 className="text-xl font-black text-theme-primary mb-3 group-hover:text-theme-accent transition-colors">{feature.title}</h3>
                  <p className="text-sm text-theme-muted font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== SCREENSHOTS ===== */}
      <motion.section id="screenshots" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Dashboard Preview</motion.span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">See BillQyro in <span className="text-gradient-premium">action.</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">A clean, powerful dashboard that puts you in control of your entire billing workflow.</p>
          </div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible"  className="card-premium rounded-3xl overflow-hidden border-2 border-theme-border-soft shadow-premium-xl bg-theme-card max-w-5xl mx-auto group">
            <div className="relative">
              <div className="absolute inset-0 bg-[image:var(--accent-gradient)] opacity-0 group-hover:opacity-10 mix-blend-overlay transition-opacity duration-500 z-10 pointer-events-none"></div>
              <img src="/dashboard-preview.png" alt="BillQyro Premium Dashboard" className="w-full h-auto object-cover block" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}  className="flex flex-wrap items-center justify-center gap-6 mt-10 text-theme-muted text-sm font-semibold">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> Real-time revenue tracking</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> Invoice status overview</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> Client activity feed</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-theme-accent" /> Quick action shortcuts</div>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== LIVE LINK SHOWCASE ===== */}
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}  className="flex-1">
              <motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Live Invoice Link</motion.span>
              <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Share invoices with a <span className="text-gradient-premium">secure link.</span></h2>
              <p className="text-theme-muted font-medium text-base leading-relaxed mb-8 max-w-xl">Customers can view their invoice online, scan QR codes to pay, and submit payment proof \u2014 all without creating an account.</p>
              <div className="space-y-4">
                {[
                  { icon: Link2, text: 'Unique secure link per invoice' },
                  { icon: CreditCard, text: 'UPI / bKash / Nagad QR codes' },
                  { icon: ShieldCheck, text: 'Payment proof upload & verification' },
                  { icon: MessageCircle, text: 'WhatsApp & contact buttons' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0"><item.icon className="w-4 h-4" /></div><p className="text-sm font-bold text-theme-primary">{item.text}</p></div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}  className="flex-1 w-full">
              <div className="card-premium rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-theme-border-soft">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-bold text-sm">B</div>
                  <div><p className="text-sm font-extrabold text-theme-primary">Business Name</p><p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Digital Invoice {'\u00B7'} INV-2026-0001</p></div>
                  <div className="ml-auto px-3 py-1.5 bg-theme-surface rounded-xl border border-theme-border-soft text-[10px] font-bold flex items-center gap-1"><Download className="w-3 h-3" /> PDF</div>
                </div>
                <div className="bg-gradient-to-br from-theme-accent to-theme-accent-dark text-white rounded-2xl p-5 shadow-lg">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Amount Due</p>
                  <p className="text-4xl sm:text-5xl font-black mt-1 tracking-tight leading-none">{'\u20B9'}1,500</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[8px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Awaiting Payment
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-theme-surface rounded-xl p-3 border border-theme-border-soft text-center">
                    <div className="w-16 h-16 mx-auto bg-theme-surface rounded-lg border border-theme-border-soft flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-theme-muted" />
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
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}  className="flex-1 order-2 lg:order-1 w-full">
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
                  <div className="flex p-2 border-t border-theme-border-soft"><div className="flex-1 font-bold text-theme-primary">Product/Service</div><div className="w-12 text-center text-theme-muted">2</div><div className="w-16 text-right text-theme-muted">{'\u20B9'}500</div><div className="w-16 text-right font-bold text-theme-primary">{'\u20B9'}1,000</div></div>
                </div>
                <div className="text-right space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-theme-muted">Subtotal</span><span className="font-bold text-theme-primary">{'\u20B9'}1,000</span></div>
                  <div className="flex justify-between"><span className="text-theme-muted">GST (18%)</span><span className="font-bold text-theme-primary">{'\u20B9'}180</span></div>
                  <div className="flex justify-between border-t border-theme-border-soft pt-1"><span className="font-bold text-theme-primary">Grand Total</span><span className="font-bold text-lg text-theme-accent">{'\u20B9'}1,180</span></div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}  className="flex-1 order-1 lg:order-2">
              <motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Premium PDF</motion.span>
              <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Professional <span className="text-gradient-premium">A4/A5 PDF</span> invoices.</h2>
              <p className="text-theme-muted font-medium text-base leading-relaxed mb-8 max-w-xl">Generate beautiful PDF invoices with your logo, business details, QR code, and category-specific layouts. Ready to print or share.</p>
              <div className="space-y-4">
                {[
                  { icon: Printer, text: 'A4 and A5 page sizes' },
                  { icon: FileSpreadsheet, text: '6+ category-specific templates' },
                  { icon: CreditCard, text: 'UPI/bKash/Nagad QR codes on PDF' },
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
      <motion.section id="templates" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-white/5 bg-theme-surface/50 py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-theme-accent/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-flex items-center gap-2 badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent/10 px-5 py-2 rounded-full mb-6 border border-theme-accent/20">
              <Sparkles className="w-3.5 h-3.5" /> Category Templates
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-6">Templates for every <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)]">business type.</span></h2>
            <p className="text-theme-muted font-medium text-lg max-w-2xl mx-auto">Pre-built templates with custom fields tailored for each industry.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, idx) => (
              <motion.div key={idx} variants={staggerItem} whileHover={{ y: -5, scale: 1.02 }} className="group relative rounded-3xl bg-theme-card/80 backdrop-blur-xl border border-white/10 p-6 hover:bg-theme-surface transition-all duration-500 shadow-glass overflow-hidden cursor-default">
                <div className="absolute -inset-2 bg-[image:var(--accent-gradient)] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 pointer-events-none"></div>
                <div className="relative z-10">
                  <motion.div variants={scaleOnHover} className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500 origin-left">{tpl.icon}</motion.div>
                  <h3 className="text-xl font-black text-theme-primary mb-2 group-hover:text-theme-accent transition-colors">{tpl.name}</h3>
                  <p className="text-sm text-theme-muted font-medium">{tpl.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== STATS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: '10K+', label: 'Invoices Generated', icon: FileSpreadsheet },
              { number: '500+', label: 'Active Businesses', icon: Users },
              { number: '99.9%', label: 'Uptime Guarantee', icon: ShieldCheck },
              { number: '\u20B92Cr+', label: 'Invoices Processed', icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}  transition={{ delay: i * 0.1 }} className="text-center stat-premium rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center mx-auto mb-3"><stat.icon className="w-6 h-6" /></div>
                <p className="text-2xl sm:text-3xl font-black text-theme-primary">{stat.number}</p>
                <p className="text-sm text-theme-muted font-semibold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== TESTIMONIALS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Testimonials</motion.span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Trusted by <span className="text-gradient-premium">business owners</span></h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">See what our customers say about their BillQyro experience.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"  className="grid md:grid-cols-3 gap-6">
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
                    <p className="text-xs text-theme-muted font-medium">{t.role} {'\u2022'} {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CUSTOMER BENEFITS ===== */}
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Why Choose BillQyro</motion.span>
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
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}  transition={{ delay: i * 0.05 }} className="flex items-start gap-4 p-4">
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
      <motion.section id="pricing" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-white/5 bg-theme-surface/30 py-24 lg:py-32 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-theme-accent/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-flex items-center gap-2 badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent/10 px-5 py-2 rounded-full mb-6 border border-theme-accent/20">
              <Sparkles className="w-3.5 h-3.5" /> Simple Pricing
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-6">Transparent plans for <br className="hidden md:block"/>every <span className="text-transparent bg-clip-text bg-[image:var(--accent-gradient)] animate-gradient-x">business.</span></h2>
            <p className="text-theme-muted font-medium text-lg max-w-2xl mx-auto">Start free, upgrade when you need more. No hidden fees.</p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"  className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <motion.div key={idx} variants={staggerItem} whileHover={plan.popular ? { y: -15, scale: 1.05 } : { y: -10, scale: 1.02 }} className={`relative p-8 rounded-[2rem] transition-all duration-500 ${
                plan.popular ? 'border-2 border-theme-accent bg-gradient-to-b from-theme-surface to-theme-app shadow-[0_20px_50px_rgba(var(--accent-rgb),0.15)] md:scale-105 z-10' : 'bg-theme-card/80 backdrop-blur-xl border border-white/10 shadow-glass hover:bg-theme-surface'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-[image:var(--accent-gradient)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> Most Popular</div>
                )}
                
                <h3 className="text-xl font-black text-theme-primary mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-5xl font-black text-theme-primary font-numbers tracking-tight">{plan.price}</span>
                  <span className="text-sm text-theme-muted font-bold">{plan.period}</span>
                </div>
                
                <ul className="space-y-4 my-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-theme-primary/80"><div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? 'bg-theme-accent/20' : 'bg-white/5 border border-white/10'}`}><CheckCircle2 className={`w-3.5 h-3.5 ${plan.popular ? 'text-theme-accent' : 'text-theme-muted'}`} /></div>{f}</li>
                  ))}
                </ul>
                
                <div className="mt-auto pt-4">
                  <motion.button variants={buttonTap} initial="rest" whileHover="hover" whileTap="tap" onClick={() => scrollTo('login')} className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
                    plan.popular ? 'bg-theme-primary text-white shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_8px_40px_rgba(var(--primary-rgb),0.5)]' : 'bg-theme-app/50 border-2 border-white/10 text-theme-primary hover:border-theme-primary hover:bg-theme-surface'
                  }`}>{plan.cta}</motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== FAQ ===== */}
      <motion.section id="faq" variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Frequently asked questions.</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"  className="space-y-3">
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
      <motion.section variants={fadeInUp} initial="hidden" animate="visible"  className="border-t border-theme-border-soft bg-theme-surface py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} >
            <span className="badge-premium text-[10px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent-light px-4 py-1.5 rounded-full mb-4">Get Started</span>
            <h2 className="text-3xl md:text-5xl font-black text-theme-primary tracking-tight mb-4">Ready to simplify your billing?</h2>
            <p className="text-theme-muted font-medium text-base sm:text-lg max-w-2xl mx-auto mb-8">Join thousands of businesses using BillQyro to create, manage, and track invoices effortlessly.</p>
            <button onClick={() => scrollTo('login')} className="btn-premium px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-theme-muted font-semibold mt-4">No credit card required {'\u00B7'} 15 free invoices {'\u00B7'} Cancel anytime</p>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="border-t border-theme-border-soft py-16 bg-theme-app">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Contact</h3>
              <div className="space-y-3 text-sm text-theme-muted font-medium">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-theme-accent" /> support@billqyro.com</div>
                <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-theme-accent" /> WhatsApp: +91 98765 43210</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-theme-accent" /> BillQyro Technologies, India</div>
              </div>
              <div className="mt-6">
                <h3 className="text-base font-black text-theme-primary mb-4">Send a Message</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Your name" className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-sm text-theme-primary placeholder-theme-muted/50 font-medium focus:outline-none focus:border-theme-accent/50 transition-colors" />
                  <input type="email" placeholder="Your email" className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-sm text-theme-primary placeholder-theme-muted/50 font-medium focus:outline-none focus:border-theme-accent/50 transition-colors" />
                  <textarea rows={3} placeholder="Your message" className="w-full px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border-soft text-sm text-theme-primary placeholder-theme-muted/50 font-medium focus:outline-none focus:border-theme-accent/50 transition-colors resize-none"></textarea>
                  <button onClick={() => window.open('https://billqyro.com/contact', '_blank')} className="btn-premium w-full py-3 text-sm justify-center">Send Message</button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Product</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => scrollTo('features')} className="block hover:text-theme-accent transition-colors">Features</button>
                <button onClick={() => scrollTo('screenshots')} className="block hover:text-theme-accent transition-colors">Screenshots</button>
                <button onClick={() => scrollTo('templates')} className="block hover:text-theme-accent transition-colors">Templates</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-theme-accent transition-colors">Pricing</button>
                <button onClick={() => scrollTo('faq')} className="block hover:text-theme-accent transition-colors">FAQ</button>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Company</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => window.open('https://billqyro.com/about', '_blank')} className="block hover:text-theme-accent transition-colors">About Us</button>
                <button onClick={() => window.open('https://billqyro.com/blog', '_blank')} className="block hover:text-theme-accent transition-colors">Blog</button>
                <button onClick={() => window.open('https://billqyro.com/careers', '_blank')} className="block hover:text-theme-accent transition-colors">Careers</button>
                <button onClick={() => window.open('https://billqyro.com/press', '_blank')} className="block hover:text-theme-accent transition-colors">Press Kit</button>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Support</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => window.open('https://billqyro.com/help', '_blank')} className="block hover:text-theme-accent transition-colors">Help Center</button>
                <button onClick={() => window.open('https://billqyro.com/docs', '_blank')} className="block hover:text-theme-accent transition-colors">Documentation</button>
                <button onClick={() => window.open('https://billqyro.com/api', '_blank')} className="block hover:text-theme-accent transition-colors">API Reference</button>
                <button onClick={() => window.open('https://billqyro.com/status', '_blank')} className="block hover:text-theme-accent transition-colors">Status Page</button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-theme-border-soft grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base font-black text-theme-primary mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-theme-muted font-medium">
                <button onClick={() => window.open('/privacy', '_blank')} className="block hover:text-theme-accent transition-colors">Privacy Policy</button>
                <button onClick={() => window.open('/terms', '_blank')} className="block hover:text-theme-accent transition-colors">Terms of Service</button>
                <button onClick={() => window.open('/refund', '_blank')} className="block hover:text-theme-accent transition-colors">Refund Policy</button>
                <button onClick={() => window.open('/gdpr', '_blank')} className="block hover:text-theme-accent transition-colors">GDPR Compliance</button>
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-xs text-theme-muted font-semibold mb-1">{'\u00A9'} {new Date().getFullYear()} BillQyro Inc. All rights reserved.</p>
              <p className="text-xs text-theme-muted/60 font-medium">Made with <Sparkles className="w-3 h-3 inline text-theme-accent" /> for modern businesses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PREMIUM FOOTER ===== */}
      <footer className="border-t border-theme-border-soft bg-theme-surface/80 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-theme-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-theme-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-4">
              <Logo type="horizontal" forceWhiteText={false} />
              <p className="text-theme-muted font-medium text-sm mt-6 mb-8 max-w-sm leading-relaxed">
                The most powerful, beautifully designed premium invoicing and billing platform for modern businesses. Simplify your operations in style.
              </p>
              <div className="flex items-center gap-4">
                {['Twitter', 'LinkedIn', 'Instagram', 'GitHub'].map((social, i) => (
                  <button key={i} className="w-10 h-10 rounded-full bg-theme-card border border-theme-border-soft flex items-center justify-center text-theme-muted hover:text-theme-accent hover:border-theme-accent/50 hover:-translate-y-1 transition-all shadow-sm">
                    <span className="text-[10px] font-black">{social[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="text-sm font-black text-theme-primary uppercase tracking-wider mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-theme-muted">
                <li><button className="hover:text-theme-accent transition-colors">Features</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Templates</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Pricing</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Integrations</button></li>
              </ul>
            </div>
            
            <div className="lg:col-span-2">
              <h4 className="text-sm font-black text-theme-primary uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-theme-muted">
                <li><button className="hover:text-theme-accent transition-colors">About Us</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Careers</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Blog</button></li>
                <li><button className="hover:text-theme-accent transition-colors">Contact</button></li>
              </ul>
            </div>
            
            <div className="lg:col-span-3">
              <h4 className="text-sm font-black text-theme-primary uppercase tracking-wider mb-6">Subscribe</h4>
              <p className="text-sm text-theme-muted mb-4">Get the latest updates and billing tips delivered to your inbox.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2.5 rounded-xl bg-theme-app border border-theme-border-soft text-sm focus:outline-none focus:border-theme-accent transition-colors" />
                <button className="px-5 py-2.5 bg-theme-accent text-white font-bold rounded-xl hover:bg-theme-accent/90 transition-colors shadow-md">Subscribe</button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-theme-border-soft flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-theme-muted">
              {'\u00A9'} {new Date().getFullYear()} BillQyro Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs font-semibold text-theme-muted">
              <button className="hover:text-theme-primary transition-colors">Privacy Policy</button>
              <button className="hover:text-theme-primary transition-colors">Terms of Service</button>
              <button className="hover:text-theme-primary transition-colors">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
