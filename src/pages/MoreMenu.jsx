import React, { useState } from 'react';
import { 
  TrendingDown, 
  Layers, 
  Sparkles, 
  Settings, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  ExternalLink 
} from 'lucide-react';
import { login } from '../utils/storage';

/**
 * Premium iOS-style consolidated submenu hub for mobile/responsive users
 */
const MoreMenu = ({ 
  setCurrentTab, 
  isAuthenticated, 
  onLoginSuccess,
  businessSettings 
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showUnlockConsole, setShowUnlockConsole] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter passcode.');
      return;
    }

    const isOk = login(passcode);
    if (isOk) {
      onLoginSuccess();
      setCurrentTab('admin-panel');
    } else {
      setError('Invalid passcode.');
      setPasscode('');
    }
  };

  const navigateToAdmin = () => {
    if (isAuthenticated) {
      setCurrentTab('admin-panel');
    } else {
      setShowUnlockConsole(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Dynamic SaaS Hub Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <span className="text-[9px] font-black tracking-widest text-indigo-100 bg-white/20 px-2.5 py-1 rounded-full uppercase">
          BillQyro Workspace Hub
        </span>
        <h2 className="text-xl font-extrabold tracking-tight mt-2.5">
          {businessSettings?.businessName || 'BillQyro Embroidery'}
        </h2>
        <p className="text-xs text-white/80 font-bold mt-1">
          Owner: {businessSettings?.ownerName || 'Administrator'} • Phone: {businessSettings?.phone || 'N/A'}
        </p>
      </div>

      {/* Grid of iOS-Style Premium Navigation Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Expenses page */}
        <button
          onClick={() => setCurrentTab('expenses')}
          className="bg-white hover:bg-slate-50 text-left p-5 rounded-3xl border border-slate-100 shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-100 transition-colors shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Overhead Expenses</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold truncate">
              Log machine threads, needles, bills, repairs
            </p>
          </div>
        </button>

        {/* Inventory page */}
        <button
          onClick={() => setCurrentTab('products')}
          className="bg-white hover:bg-slate-50 text-left p-5 rounded-3xl border border-slate-100 shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Products & Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold truncate">
              Prefill stitch types, sizes, catalog prices
            </p>
          </div>
        </button>

        {/* Subscriptions page */}
        <button
          onClick={() => setCurrentTab('subscription')}
          className="bg-white hover:bg-slate-50 text-left p-5 rounded-3xl border border-slate-100 shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>SaaS Subscriptions</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold truncate">
              Unlock custom logo uploads & watermarks
            </p>
          </div>
        </button>

        {/* Business Settings profile (Passcode locked) */}
        <button
          onClick={navigateToAdmin}
          className="bg-white hover:bg-slate-50 text-left p-5 rounded-3xl border border-slate-100 shadow-premium flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-[0.99] w-full"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Admin Settings</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold truncate">
              {isAuthenticated ? 'GSTIN tax codes, seed resets' : 'Unlock business settings console'}
            </p>
          </div>
        </button>

      </div>

      {/* Inline Unlock console for Administrative access */}
      {showUnlockConsole && !isAuthenticated && (
        <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-5 md:p-6 space-y-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Unlock Console Block
            </h3>
          </div>

          <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="password"
                maxLength="6"
                placeholder="Enter Passcode (Default 1118)"
                value={passcode}
                onChange={(e) => {
                  setError('');
                  setPasscode(e.target.value.replace(/\D/g, ''));
                }}
                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-black text-center tracking-widest text-sm"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Profile Details (Visible when unlocked) */}
      {isAuthenticated && (
        <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-3xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Secure Session Active
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Full administrator credentials unlocked. Seeding & configs available.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default MoreMenu;
