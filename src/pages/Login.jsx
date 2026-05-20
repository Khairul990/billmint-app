import React, { useState } from 'react';
import { login } from '../utils/storage';
import { ReceiptText, KeyRound, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Premium Admin Login Page
 * @param {Function} onLoginSuccess - login event dispatcher
 */
const Login = ({ onLoginSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter your administrator passcode.');
      return;
    }

    setLoading(true);
    // Artificially wait a tiny bit for a premium premium look
    setTimeout(() => {
      const isOk = login(passcode);
      if (isOk) {
        onLoginSuccess();
      } else {
        setError('Invalid passcode. Hint: Check the default passcode.');
        setPasscode('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Visual background enhancements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium relative z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 animate-pulse">
            <ReceiptText className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-4">
            BillMint
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Secure Admin Workspace
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Enter Admin Passcode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type="password"
                maxLength="6"
                value={passcode}
                onChange={(e) => {
                  setError('');
                  setPasscode(e.target.value.replace(/\D/g, '')); // only allow numbers
                }}
                placeholder="••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center text-lg font-black tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-semibold mt-2">
              Default passcode: <strong className="text-indigo-600">1118</strong>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-md shadow-indigo-100/50 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>Unlock Admin Panel</span>
            )}
          </button>
        </form>

        {/* Security details Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mt-8 pt-6 border-t border-slate-50">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
          <span>AES-256 Client-Side Local Data Storage Only</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
