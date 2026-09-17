import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileSpreadsheet, Users, Package, Wallet, TrendingUp, X, ArrowRight } from 'lucide-react';

/**
 * Post-signup offer: import the visitor's demo sandbox into their new real
 * account so they continue exactly where the demo left off.
 */
const DemoImportOffer = ({ summary = {}, onImport, onDiscard, onLater }) => {
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    setBusy(true);
    try { await onImport(); } finally { setBusy(false); }
  };

  const stats = [
    { icon: FileSpreadsheet, label: 'Invoices', bn: 'ইনভয়েস', n: summary.invoices || 0 },
    { icon: Users, label: 'Customers', bn: 'কাস্টমার', n: summary.customers || 0 },
    { icon: Package, label: 'Products', bn: 'প্রোডাক্ট', n: summary.products || 0 },
    { icon: Wallet, label: 'Expenses', bn: 'খরচ', n: summary.expenses || 0 }
  ].filter(s => s.n > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative w-full max-w-md overflow-hidden rounded-[26px] bg-theme-card border border-theme-border-soft shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Import demo data"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--accent-gradient)]" />

          <button
            onClick={onLater}
            aria-label="Later"
            className="absolute right-3.5 top-3.5 w-8 h-8 rounded-xl bg-theme-surface flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-muted">Demo → Account</p>
                <h2 className="text-xl font-black tracking-tight text-theme-primary leading-tight">আপনার ডেমো ওয়ার্কস্পেস পাওয়া গেছে!</h2>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-theme-secondary font-medium mb-5">
              ডেমোতে যে ইনভয়েস, কাস্টমার, প্রোডাক্ট আর খরচের হিসাব ছিল — সব এই নতুন অ্যাকাউন্টে এনে দিতে পারি।
              যেখান থেকে ছেড়েছিলেন, ঠিক সেখান থেকেই শুরু করুন।
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {stats.map(({ icon: Icon, label, bn, n }) => (
                <div key={label} className="flex items-center gap-2.5 p-3 rounded-2xl bg-theme-surface border border-theme-border-soft">
                  <div className="w-8 h-8 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-theme-primary font-numbers leading-none">{n}</p>
                    <p className="text-[10px] font-bold text-theme-muted mt-0.5">{bn} <span className="opacity-60">/{label}</span></p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleImport}
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-[image:var(--accent-gradient)] text-white font-black text-sm shadow-lg shadow-theme-glow flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {busy ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> ইমপোর্ট হচ্ছে…</>
                ) : (
                  <><TrendingUp className="w-4 h-4" /> ডেমো-ডেটা ইমপোর্ট করুন</>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onDiscard}
                  className="flex-1 py-2.5 rounded-2xl bg-theme-surface border border-theme-border-soft text-theme-secondary font-bold text-xs hover:text-theme-primary hover:border-theme-border-strong transition-all"
                >
                  নতুন করে শুরু করব
                </button>
                <button
                  onClick={onLater}
                  className="flex-1 py-2.5 rounded-2xl bg-theme-surface border border-theme-border-soft text-theme-muted font-bold text-xs hover:text-theme-primary transition-all"
                >
                  পরে দেখব <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-theme-muted text-center mt-4 leading-relaxed">
              ইমপোর্ট করলে ডেমো-স্যান্ডবক্স মুছে যাবে আর ডেটা এই অ্যাকাউন্টের হয়ে যাবে। ফ্রি প্ল্যানেই থাকবেন।
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoImportOffer;
