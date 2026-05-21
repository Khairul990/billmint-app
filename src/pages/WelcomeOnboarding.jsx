import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Globe, Star, Quote, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { getSettings } from '../utils/storage';

/**
 * Premium Split-Pane Welcome Onboarding & Login Screen for BillQyro
 * Matches Reference Image 1: White layout, Left form, Right dashboard preview
 */
const WelcomeOnboarding = ({ onLoginSuccess, onQuickStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Fetch the active settings passcode (default: 1118)
    const settings = getSettings();
    const activePasscode = settings?.adminPasscode || '1118';

    // Premium fake loading delay
    setTimeout(() => {
      if (password === activePasscode) {
        const session = { 
          timestamp: Date.now(), 
          token: 'billqyro-secure-session',
          userEmail: email 
        };
        localStorage.setItem('billqyro_auth', JSON.stringify(session));
        onLoginSuccess();
      } else {
        setError('Incorrect password. Password is your 4-digit admin passcode.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row w-full font-sans antialiased text-slate-900">
      
      {/* LEFT SECTION: Login Form */}
      <div className="lg:w-1/2 flex flex-col p-6 md:p-12 xl:p-20 relative bg-white z-10 overflow-y-auto no-scrollbar">
        
        {/* Top Header: Logo and Language Dropdown */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <Logo type="icon" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900">BillQyro</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
            <Globe className="w-4 h-4" />
            <span>EN</span>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Welcome to BillQyro
            </h1>
            <p className="text-slate-500 font-medium">
              Log in to access your billing and invoicing dashboard.
            </p>
          </div>



          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setError(''); setEmail(e.target.value); }}
                  placeholder="admin@billqyro.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <button type="button" className="text-sm font-bold text-teal-600 hover:text-teal-700">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setError(''); setPassword(e.target.value); }}
                  placeholder="••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 uppercase"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">Default passcode: <span className="font-bold text-teal-600">1118</span></p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold text-sm tracking-wide hover:from-teal-600 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Log in to BillQyro'
              )}
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <button
            onClick={onQuickStart}
            type="button"
            className="w-full mt-4 py-4 border border-slate-200 text-slate-700 bg-white rounded-xl font-bold text-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
          >
            Skip to Demo
          </button>
          
          {/* Three small feature blocks */}
          <div className="flex items-center justify-between mt-8 gap-2 px-2">
            <div className="flex flex-col items-center text-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">Secure & Private</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <ArrowRight className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">Fast & Reliable</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Star className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">Trusted by Businesses</span>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 font-medium mt-8">
            By logging in, you agree to our <a href="#" className="text-slate-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-slate-600 font-bold hover:underline">Privacy Policy</a>.
          </p>
        </div>

      </div>

      {/* RIGHT SECTION: Dashboard Preview / Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 p-8 relative items-center justify-center overflow-hidden border-l border-slate-100">
        
        {/* Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#071B3A]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-2xl flex flex-col gap-8 relative z-10">
          
          {/* Trust Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">Easy Setup</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">Secure Data</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ArrowRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">Fast Invoicing</p>
            </div>
          </div>

          {/* Detailed Dashboard Mockup Container */}
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 overflow-visible aspect-[4/3] flex flex-col transform hover:scale-[1.02] transition-transform duration-500 relative mt-4">
            {/* Mock Header (Browser dots) */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50 bg-white rounded-t-[1.75rem] z-10">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            
            {/* Mock Content */}
            <div className="flex-1 flex bg-slate-50 overflow-hidden relative rounded-b-[1.75rem]">
              {/* Mock Sidebar */}
              <div className="w-24 md:w-32 bg-[#071B3A] flex flex-col gap-3 p-3 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-teal-500/20"></div>
                  <div className="h-3 w-12 bg-white/20 rounded"></div>
                </div>
                <div className="h-6 w-full bg-white/10 rounded"></div>
                <div className="h-6 w-full bg-transparent border border-white/5 rounded"></div>
                <div className="h-6 w-full bg-transparent border border-white/5 rounded"></div>
                <div className="h-6 w-3/4 bg-transparent border border-white/5 rounded"></div>
              </div>
              
              {/* Mock Main Area */}
              <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  <div className="h-6 w-20 bg-teal-500 text-white rounded-full flex items-center justify-center"><div className="h-2 w-10 bg-white/50 rounded"></div></div>
                </div>
                
                {/* Revenue Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-800 rounded"></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-800 rounded"></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-800 rounded"></div>
                  </div>
                </div>
                
                <div className="flex gap-4 flex-1 overflow-hidden">
                  {/* Chart Area */}
                  <div className="flex-[2] bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col gap-3">
                    <div className="h-2 w-20 bg-slate-200 rounded"></div>
                    <div className="flex-1 flex items-end gap-2 px-2">
                      <div className="w-full bg-teal-500/20 rounded-t h-1/4"></div>
                      <div className="w-full bg-teal-500/40 rounded-t h-2/4"></div>
                      <div className="w-full bg-teal-500/60 rounded-t h-3/4"></div>
                      <div className="w-full bg-teal-500/80 rounded-t h-full"></div>
                      <div className="w-full bg-teal-500 rounded-t h-3/4"></div>
                    </div>
                  </div>
                  
                  {/* Recent Invoices */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col gap-3">
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-8 w-full bg-slate-50 rounded border border-slate-100"></div>
                      <div className="h-8 w-full bg-slate-50 rounded border border-slate-100"></div>
                      <div className="h-8 w-full bg-slate-50 rounded border border-slate-100"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Absolute Testimonial Card placed over dashboard */}
            <div className="absolute -bottom-8 -left-8 z-20">
              <div className="bg-[#071B3A] text-white p-5 rounded-2xl shadow-xl flex gap-4 max-w-[280px] transform hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Quote className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium leading-relaxed mb-2">
                    "BillQyro transformed our billing process. We now create and send invoices in seconds!"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-white">Sarah Jenkins</h4>
                    </div>
                    <div className="flex text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default WelcomeOnboarding;
