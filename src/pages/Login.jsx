import React, { useState } from 'react';
import { login } from '../utils/storage';
import { KeyRound, AlertCircle, ShieldAlert } from 'lucide-react';
import Logo from '../components/Logo';

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
      setError('Please enter your administrator passcode or admin email.');
      return;
    }

    setLoading(true);
    // Artificially wait a tiny bit for a premium look
    setTimeout(() => {
      const isOk = login(passcode);
      if (isOk) {
        localStorage.setItem('billqyro_admin_unlocked', 'true');
        localStorage.setItem('billqyro_user_role', 'admin');
        onLoginSuccess();
      } else {
        setError('Invalid passcode or email. Hint: Check the default passcode.');
        setPasscode('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#071B3A] to-[#19C3A3] font-sans overflow-hidden">
      {/* Left side illustration (premium placeholder) */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-white/10 backdrop-blur-xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight animate-fadeInUp">
            Welcome to BillQyro
          </h1>
          <p className="text-sm text-white/80 max-w-sm mx-auto">
            Modern Billing &amp; Invoicing Platform – secure, fast, and beautifully designed.
          </p>
          <button
            onClick={onLoginSuccess}
            className="inline-flex items-center gap-2 bg-white text-[#071B3A] font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-white/90 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
      {/* Right side login form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col items-center mb-6">
            <Logo type="icon" className="w-16 h-16 text-[#19C3A3]" />
            <h2 className="mt-4 text-2xl font-black text-gray-800 dark:text-gray-100">
              BillQyro
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1 tracking-wide">
              Secure Admin Workspace
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={passcode}
                onChange={(e) => {
                  setError('');
                  setPasscode(e.target.value);
                }}
                placeholder="Passcode or Admin Email"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#19C3A3] transition-colors"
              />
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Default passcode: <strong className="text-[#19C3A3]">1118</strong> or Admin Email
            </p>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900 rounded-xl text-sm text-rose-700">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#19C3A3] text-white font-bold rounded-xl hover:bg-[#12B76A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Unlock Admin Panel</span>
              )}
            </button>
          </form>
          <div className="mt-6 text-xs text-center text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
            <ShieldAlert className="w-4 h-4" />
            <span>AES-256 Client‑Side Local Data Storage Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
