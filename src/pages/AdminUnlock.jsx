import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { pageVariants } from '../utils/animations';

const AdminUnlock = ({ setCurrentTab }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const storedPin = localStorage.getItem('billqyro_admin_pin') || '1234';
    if (pin === storedPin) {
      setError(false);
      localStorage.setItem('billqyro_admin_unlocked', 'true');
      setCurrentTab('admin-panel');
    } else {
      setError(true);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-[80vh] flex items-center justify-center p-4"
    >
      <div className="card-premium glass p-8 md:p-10 w-full max-w-md text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-theme-accent/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-theme-danger/5 blur-[80px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-colors ${error ? 'bg-theme-danger/20' : 'bg-theme-accent/20'}`}>
            {error ? (
              <Shield className="w-8 h-8 text-theme-danger" />
            ) : (
              <Lock className="w-8 h-8 text-theme-accent" />
            )}
          </div>
        </motion.div>

        <h1 className="text-2xl font-black text-theme-primary mb-1">Admin Access</h1>
        <p className="text-xs font-semibold text-theme-muted mb-8">
          Enter your security PIN to unlock the admin panel
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 6) {
                  setPin(val);
                  setError(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Enter PIN (4-6 digits)"
              className={`input-premium w-full px-5 py-3.5 text-center text-lg font-bold tracking-[0.3em] rounded-xl ${error ? 'border-theme-danger ring-1 ring-theme-danger/30' : ''}`}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-theme-danger"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Incorrect PIN. Please try again.
              </motion.p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            className="btn-premium w-full py-3.5 text-sm font-black tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Shield className="w-4 h-4" />
            Unlock Admin Panel
          </button>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-theme-border-soft" />
            <span className="badge-premium text-[9px] font-black uppercase tracking-widest text-theme-muted bg-theme-card px-3 py-1 rounded-full">
              Secure Zone
            </span>
            <div className="flex-1 h-px bg-theme-border-soft" />
          </div>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-theme-muted hover:text-theme-primary transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUnlock;
