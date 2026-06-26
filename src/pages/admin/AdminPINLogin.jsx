import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminPINLogin = ({ onPinSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;
  const rawPin = import.meta.env.VITE_ADMIN_PIN;
  const CORRECT_PIN = (rawPin && rawPin !== 'undefined') ? rawPin : '0000';
  const [locked, setLocked] = useState(() => {
    return localStorage.getItem('billqyro_admin_locked') === 'true';
  });
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (locked && lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setLocked(false);
            localStorage.removeItem('billqyro_admin_locked');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [locked, lockoutTimer]);

  useEffect(() => {
    if (pin.length === 4 && !locked) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = () => {
    if (!CORRECT_PIN) {
      toast.error('Admin PIN not configured. Set VITE_ADMIN_PIN in environment.', { duration: 5000 });
      setPin('');
      return;
    }
    if (pin === CORRECT_PIN) {
      toast.success('Admin access granted');
      setError(false);
      setAttempts(0);
      localStorage.setItem('billqyro_admin_unlocked', 'true');
      onPinSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);
      setPin('');
      
      const logs = JSON.parse(localStorage.getItem('billqyro_admin_security_logs') || '[]');
      logs.unshift({
        type: 'FAILED_PIN',
        timestamp: new Date().toISOString(),
        details: `Failed PIN attempt (${newAttempts}/${MAX_ATTEMPTS})`
      });
      localStorage.setItem('billqyro_admin_security_logs', JSON.stringify(logs));

      if (newAttempts >= MAX_ATTEMPTS) {
        localStorage.setItem('billqyro_admin_locked', 'true');
        setLocked(true);
        setLockoutTimer(300);
        toast.error('Too many failed attempts. Access blocked for 5 minutes.', { duration: 5000 });
        onCancel();
      } else {
        toast.error('Incorrect Admin PIN', { duration: 2000 });
      }
    }
  };

  const appendPin = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const deletePin = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (locked) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center"
        >
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Blocked</h2>
          <p className="text-slate-400 mb-4">Too many failed attempts. Try again in {Math.floor(lockoutTimer / 60)}:{String(lockoutTimer % 60).padStart(2, '0')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${error ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {error ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
          <p className="text-slate-400 text-sm text-center">
            Enter Owner PIN to access the secured control panel.
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > index 
                  ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-110' 
                  : 'bg-slate-800'
              } ${error && pin.length > index ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : ''}`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => appendPin(num.toString())}
              className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-white font-semibold text-xl transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => onCancel()}
            className="h-14 rounded-2xl bg-slate-800/20 hover:bg-slate-800 text-slate-400 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => appendPin('0')}
            className="h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-white font-semibold text-xl transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={deletePin}
            className="h-14 rounded-2xl bg-slate-800/20 hover:bg-slate-800 text-slate-400 font-semibold transition-all active:scale-95 flex items-center justify-center"
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default AdminPINLogin;
