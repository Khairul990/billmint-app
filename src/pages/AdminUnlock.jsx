import React, { useState } from 'react';
import { KeyRound, ShieldAlert, AlertCircle } from 'lucide-react';
import { getSettings } from '../utils/storage';

const AdminUnlock = ({ onUnlock, onCancel }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    const settings = getSettings();
    const activePasscode = settings?.adminPasscode || '1118';
    const activeEmail = settings?.adminEmail || 'admin@billqyro.com';

    if (passcode === activePasscode || String(passcode).toLowerCase().trim() === activeEmail.toLowerCase()) {
      onUnlock();
    } else {
      setError('Incorrect admin passcode or email.');
      setPasscode('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Admin Protected</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Please enter the master passcode or admin email to access the owner tools.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 relative z-10">
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={passcode}
                onChange={(e) => { setError(''); setPasscode(e.target.value); }}
                placeholder="Passcode or Email"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-xs bg-rose-50 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUnlock;
