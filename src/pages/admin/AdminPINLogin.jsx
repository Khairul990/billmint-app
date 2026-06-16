import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminPINLogin = ({ onPinSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;
  const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = () => {
    if (pin === CORRECT_PIN) {
      toast.success('Admin access granted', { icon: '🔓' });
      setError(false);
      localStorage.setItem('billqyro_admin_unlocked', 'true');
      onPinSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);
      setPin('');
      
      // Log attempt to security center (fake log for now, could be real DB later)
      const logs = JSON.parse(localStorage.getItem('billqyro_admin_security_logs') || '[]');
      logs.unshift({
        type: 'FAILED_PIN',
        timestamp: new Date().toISOString(),
        details: `Failed PIN attempt (${newAttempts}/${MAX_ATTEMPTS})`
      });
      localStorage.setItem('billqyro_admin_security_logs', JSON.stringify(logs));

      if (newAttempts >= MAX_ATTEMPTS) {
        toast.error('Too many failed attempts. Access blocked.', { duration: 5000 });
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
