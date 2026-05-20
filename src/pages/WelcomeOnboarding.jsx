import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, FileText, Send, Smartphone, Landmark } from 'lucide-react';
import Logo from '../components/Logo';
import { getSettings } from '../utils/storage';

/**
 * Premium SPLIT-PANE Welcome Onboarding & Login Screen for BillQyro
 * Matches the deep navy / mint-teal brand visual theme
 */
const WelcomeOnboarding = ({ onLoginSuccess, onQuickStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your passcode password.');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Fetch the active settings passcode (default: 1118)
    const settings = getSettings();
    const activePasscode = settings?.adminPasscode || '1118';

    // Premium fake loading delay for sleek SaaS feel
    setTimeout(() => {
      if (password === activePasscode) {
        const session = { 
          timestamp: Date.now(), 
          token: 'billqyro-secure-session',
          userEmail: email 
        };
        localStorage.setItem('billqyro_auth', JSON.stringify(session));
        onLoginSuccess();
      } else {
        setError('Incorrect password. Password is your 4-digit admin passcode.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row w-full font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* LEFT SECTION: Brand Presentation & App Guidance Manual (Deep Navy/Indigo Premium Space) */}
      <div className="lg:w-7/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid Patterns & Ambient Light */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-8 md:space-y-12">
          {/* Header Brand Info */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-premium">
              <Logo type="icon" className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                BillQyro
              </h2>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold block mt-1">
                Smart Billing. Premium Invoices.
              </span>
            </div>
          </div>

          {/* SaaS Core Welcome Header */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Grade Micro-Billing OS</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Manage Bills, Customers & <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Invoices Easily.</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
              Designed for micro-shops, embroidery services, and independent contractors. Compile multi-item composite rates, track customer invoices in real-time, generate gorgeous PDF invoices, and send quick WhatsApp payment reminders.
            </p>
          </div>

          {/* Quick Guide Manual (Visual Workflow Cards) */}
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Interactive System Workflow Guide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/50 transition-all duration-300">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-200">Customer CRM Directory</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Save customer profiles, phone numbers, and addresses. Instantly retrieve records in the invoice workbench.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/50 transition-all duration-300">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-200">Rate & Product Catalog</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Save catalog items and service rates. Load products instantly during composite invoicing for rapid checkout.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/50 transition-all duration-300">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-200">One-Click PDF Generator</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Compile invoices, apply taxes or discounts, and generate high-fidelity vector PDF files locally in your browser.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/50 transition-all duration-300">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-200">WhatsApp Due Reminders</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Send automated, beautifully pre-formatted payment alerts to client WhatsApp channels straight from your dashboard.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Brand Security Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure AES-256 Client-Side Sandbox Sandbox</span>
          </div>
          <span className="text-[9px] font-black text-slate-500 tracking-wider">
            BILLQYRO v2.1.0-STABLE
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: Glassmorphic SaaS Login Card (Bright/Theme Adaptive Space) */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* Decorative elements */}
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 rounded-[2rem] p-6 md:p-10 border border-slate-200/60 dark:border-slate-800/80 shadow-premium relative z-10 backdrop-blur-xl">
          
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Unlock Workspace
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none">
              Welcome back to your invoicing console
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Workspace Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setError('');
                    setEmail(e.target.value);
                  }}
                  placeholder="admin@billqyro.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Passcode Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 focus:outline-none uppercase tracking-wider leading-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setError('');
                    setPassword(e.target.value);
                  }}
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-center text-sm font-black tracking-widest text-slate-800 dark:text-slate-100 placeholder-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Login hints */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold">
              Default passcode: <span className="text-emerald-500">1118</span> • Any valid email format
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-[11px] text-rose-700 dark:text-rose-450 font-extrabold animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-md shadow-emerald-500/10 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Authenticate Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Bypass Row */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest">
              OR EXPLORE DIRECTLY
            </p>
            <button
              onClick={onQuickStart}
              type="button"
              className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 bg-white dark:bg-slate-900/30 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-850/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Quick Demo Start</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default WelcomeOnboarding;
