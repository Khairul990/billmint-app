import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, PlayCircle } from 'lucide-react';
import Logo from '../components/Logo';
import Login from './Login';

/**
 * App-shell entry screen (Phase 26).
 *
 * Shown INSTEAD of the marketing landing whenever the product runs inside
 * the Android APK (TWA) or an installed PWA — the app opens like a native
 * app: brand mark, login/signup card, a quiet demo link. কোনো
 * মার্কেটিং-সেকশন নেই.
 */
const AppEntry = ({ onLoginSuccess }) => {
  const [launching, setLaunching] = useState(false);

  // The demo → signup conversion flow lands on /#login — jump straight
  // into signup mode (Login reads + clears the flag itself on mount).
  useEffect(() => {
    try {
      if (window.location.hash === '#login') {
        localStorage.setItem('billqyro_open_signup', '1');
      }
    } catch { /* ignore */ }
  }, []);

  // Same launch sequence the landing used: seed the sandbox and let
  // App.jsx route the visitor through the demo journey.
  const launchDemo = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      const demoKeys = [
        'billqyro_demo_customers', 'billqyro_demo_invoices', 'billqyro_demo_products',
        'billqyro_demo_expenses', 'billqyro_demo_payments', 'billqyro_demo_reports',
        'billqyro_demo_settings', 'billqyro_demo_logged_in',
      ];
      demoKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('billqyro_demo_session_active', 'true');
      localStorage.setItem('billqyro_demo_journey_mode', 'true');
      const { generateDemoWorkspace } = await import('../services/demoGenerator.js');
      generateDemoWorkspace('retail');
      window.location.href = '/';
    } catch (e) {
      console.warn('Demo launch failed', e);
      localStorage.removeItem('billqyro_demo_session_active');
      localStorage.removeItem('billqyro_demo_journey_mode');
      setLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-main flex flex-col overflow-y-auto">
      {/* Status-bar breathing room (TWA draws under the notch on new Androids) */}
      <div className="h-[env(safe-area-inset-top)] min-h-[10px]" />

      <div className="flex-1 w-full max-w-md mx-auto px-5 flex flex-col justify-center py-8">
        {/* Brand — pure app identity, zero marketing */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-7"
        >
          <div className="w-16 h-16 rounded-[1.35rem] bg-theme-card border border-theme-border-soft shadow-2xl flex items-center justify-center">
            <Logo type="icon" className="w-10 h-10" />
          </div>
          <h1 className="mt-3.5 text-[22px] font-black tracking-tight text-theme-primary">
            BillQyro
          </h1>
          <p className="mt-1 text-xs font-bold text-theme-muted">
            বিলিং · বাকির হিসাব · রিপোর্ট
          </p>
        </motion.div>

        {/* Login / signup — the full existing auth panel, app-framed */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="bg-theme-card rounded-3xl border border-theme-border-soft p-5 sm:p-6 shadow-2xl"
        >
          <Login onLoginSuccess={onLoginSuccess} embedded />
        </motion.div>

        {/* Quiet demo affordance — one tap, no signup */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          onClick={launchDemo}
          disabled={launching}
          className="mt-5 mx-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold text-theme-muted active:bg-theme-surface transition-all disabled:opacity-60"
        >
          {launching
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <PlayCircle className="w-4 h-4" />}
          {launching ? 'ডেমো চালু হচ্ছে…' : 'অ্যাকাউন্ট ছাড়া ডেমো দেখুন'}
        </motion.button>

        {/* App-style version footer */}
        <p className="mt-7 text-center text-[10px] font-bold text-theme-muted/70 tracking-wide">
          BillQyro Android · v1.0.3
        </p>
      </div>
    </div>
  );
};

export default AppEntry;
