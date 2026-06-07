import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import Logo from '../components/Logo';
import { getGlobalAdminSettings } from '../services/dbEngine';

const Landing = ({ onLoginClick }) => {
  // Try to load the default theme on mount if not already set by admin inside App.jsx
  useEffect(() => {
    const loadDefaultTheme = async () => {
      try {
        const adminGlobal = await getGlobalAdminSettings();
        if (adminGlobal && adminGlobal.defaultTheme) {
          document.documentElement.setAttribute('data-theme', adminGlobal.defaultTheme);
          import('../utils/themeIcon').then(m => m.updateFaviconForTheme(adminGlobal.defaultTheme));
        } else if (!document.documentElement.hasAttribute('data-theme')) {
          document.documentElement.setAttribute('data-theme', 'classic');
          import('../utils/themeIcon').then(m => m.updateFaviconForTheme('classic'));
        }
      } catch (e) {
        // Silent fallback
      }
    };
    loadDefaultTheme();
  }, []);

  const features = [
    { icon: FileSpreadsheet, title: 'Smart Invoicing', desc: 'Create beautiful, professional invoices in seconds with pre-built templates.' },
    { icon: Users, title: 'Client Management', desc: 'Keep track of all your customers, communication history, and pending balances.' },
    { icon: TrendingUp, title: 'Financial Insights', desc: 'Visualize your revenue growth, top clients, and overdue payments at a glance.' },
    { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Enterprise-grade security keeps your billing data safe and always accessible.' }
  ];

  return (
    <div className="min-h-screen bg-theme-app text-theme-primary font-sans selection:bg-theme-accent selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-theme-border-soft bg-theme-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo type="horizontal" forceWhiteText={false} />
          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-sm font-bold text-theme-muted hover:text-theme-primary transition-colors hidden sm:block"
            >
              Log in
            </button>
            <button 
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-theme-accent hover:opacity-90 text-white text-sm font-black rounded-xl shadow-premium transition-all active:scale-95"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-theme-accent opacity-[0.03] dark:opacity-[0.05] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface border border-theme-border-soft shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              <span className="text-xs font-bold text-theme-primary tracking-wide">The future of billing is here</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black tracking-tight text-theme-primary leading-[1.1]"
            >
              Smart billing for <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-accent to-theme-accent/60">modern business.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-theme-muted max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Streamline your invoicing process, manage customers effortlessly, and get paid faster with BillQyro's premium SaaS platform.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button 
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-4 bg-theme-accent hover:opacity-90 text-white font-black rounded-2xl shadow-premium shadow-theme-accent/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Start Invoicing Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-4 bg-theme-surface hover:bg-theme-border-soft/20 text-theme-primary font-bold rounded-2xl border border-theme-border-soft transition-all active:scale-95"
              >
                Book a Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-4 flex items-center gap-6 justify-center lg:justify-start text-theme-muted text-sm font-semibold"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-theme-accent" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-theme-accent" /> 14-day free trial
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-1 w-full relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-theme-border-soft shadow-2xl bg-theme-card">
              <div className="aspect-video bg-theme-surface w-full p-2 flex flex-col">
                <div className="flex gap-1.5 p-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-theme-warning"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-theme-app rounded-xl border border-theme-border-soft p-6 flex flex-col gap-4">
                  <div className="h-8 w-1/3 bg-theme-surface rounded border border-theme-border-soft"></div>
                  <div className="flex gap-4">
                    <div className="flex-1 h-24 bg-theme-surface rounded-xl border border-theme-border-soft"></div>
                    <div className="flex-1 h-24 bg-theme-surface rounded-xl border border-theme-border-soft"></div>
                    <div className="flex-1 h-24 bg-theme-surface rounded-xl border border-theme-border-soft"></div>
                  </div>
                  <div className="flex-1 bg-theme-surface rounded-xl border border-theme-border-soft"></div>
                </div>
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <div className="absolute -bottom-6 -left-6 bg-theme-card p-4 rounded-2xl border border-theme-border-soft shadow-premium flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-theme-accent" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-theme-muted">Total Revenue</p>
                <p className="text-lg font-black text-theme-primary">$12,450.00</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-theme-border-soft bg-theme-surface py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-theme-primary tracking-tight mb-4">Everything you need to run your billing.</h2>
            <p className="text-theme-muted font-medium max-w-2xl mx-auto">Powerful features wrapped in an elegant interface, designed specifically for modern teams and growing businesses.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 bg-theme-app border border-theme-border-soft rounded-3xl hover:border-theme-accent/30 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-theme-card border border-theme-border-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-theme-accent" />
                </div>
                <h3 className="text-lg font-bold text-theme-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-theme-muted font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-theme-border-soft py-12 bg-theme-app text-center">
        <Logo type="horizontal" forceWhiteText={false} />
        <p className="text-theme-muted text-xs font-semibold mt-4">
          © {new Date().getFullYear()} BillQyro Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
