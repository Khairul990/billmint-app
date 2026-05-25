import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Globe, Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { getSettings } from '../utils/storage';
import { isAdminUser } from '../utils/adminAccess';
import { auth, firebaseReady } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Premium Split-Pane Welcome Onboarding & Login Screen for BillQyro
 * Matches Reference Image 1 exactly: Large centered container, accurate layout
 */
const WelcomeOnboarding = ({ onLoginSuccess, onQuickStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleAuthSubmit = async (e) => {
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

    // If Firebase is ready, use real authentication
    if (firebaseReady && auth) {
      try {
        if (isLoginMode) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        processLocalLogin(email, password);
      } catch (err) {
        console.error('Firebase Auth Error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          setError('Invalid email or password. Please try again.');
        } else if (err.code === 'auth/email-already-in-use') {
          setError('This email is already registered. Please log in.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak. Must be at least 6 characters.');
        } else {
          setError(err.message || 'Authentication failed. Please check your credentials.');
        }
        setLoading(false);
      }
    } else {
      // Fallback to local auth if Firebase isn't configured
      processLocalLogin(email, password);
    }
  };

  const processLocalLogin = (userEmail, userPassword) => {
    // Admin unlock strictly relies on email matching
    setTimeout(() => {
      const emailLower = userEmail.toLowerCase().trim();
      const isAdminResult = isAdminUser({ email: emailLower });
      
      const session = { 
        timestamp: Date.now(), 
        token: 'billqyro-secure-session',
        userEmail: userEmail,
        uid: auth?.currentUser?.uid || null
      };
      
      localStorage.setItem('billqyro_auth', JSON.stringify(session));
      localStorage.setItem('billqyro_user_role', isAdminResult ? 'admin' : 'user');
      
      if (isAdminResult) {
        localStorage.setItem('billqyro_admin_unlocked', 'true');
      } else {
        localStorage.removeItem('billqyro_admin_unlocked');
      }
      
      onLoginSuccess();
    }, 400);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4 md:p-6 lg:p-8 font-sans antialiased text-slate-900 dark:text-white"
    >
      
      <div className="w-full max-w-[1400px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">
        
        {/* LEFT SECTION: Login Form */}
        <div className="lg:w-[45%] p-8 md:p-14 xl:p-20 flex flex-col relative z-10 bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar">
          
          {/* Top Header: Logo */}
          <div className="flex items-center gap-3 mb-16">
            <Logo type="horizontal" className="scale-125 origin-left" forceWhiteText={false} />
          </div>

          <div className="w-full max-w-[440px] mx-auto flex-1 flex flex-col justify-center">
            
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                {isLoginMode ? 'Welcome to BillQyro' : 'Create an Account'}
              </h1>
              <p className="text-slate-500 font-medium text-[17px] leading-relaxed">
                {isLoginMode 
                  ? 'Log in to access your professional billing and invoicing dashboard.' 
                  : 'Sign up to start creating professional invoices and managing clients.'}
              </p>
              
              {/* Toggle Login/Signup */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mt-6">
                <button 
                  onClick={() => setIsLoginMode(true)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLoginMode ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setIsLoginMode(false)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setError(''); setEmail(e.target.value); }}
                    placeholder="admin@billqyro.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <button type="button" className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors">
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
                    className="w-full pl-12 pr-16 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 dark:text-white tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {!isLoginMode && (
                  <p className="text-xs text-slate-500 font-medium pt-1">
                    Password must be at least 6 characters long.
                  </p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-semibold flex items-center gap-2 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 h-[58px] bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-base tracking-wide hover:from-teal-600 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>{isLoginMode ? 'Log in to BillQyro' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">OR</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Quick Demo Bypass */}
            <button
              onClick={onQuickStart}
              type="button"
              className="w-full h-[58px] border-2 border-slate-200 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-2xl font-bold text-base hover:bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all flex items-center justify-between px-6 shadow-sm"
            >
              <span>Skip to Demo</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* Trust feature blocks */}
            <div className="grid grid-cols-3 gap-4 mt-12">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100/50 flex items-center justify-center text-teal-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Secure & Private</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">AES-256 encrypted storage</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Fast & Reliable</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Instant invoice creation</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-600">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Trusted Design</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Premium SaaS layout</p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 font-medium mt-8 mb-2">
              By logging in, you agree to our <a href="#" className="text-slate-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-slate-600 font-bold hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* RIGHT SECTION: Dashboard Preview / Branding */}
        <div className="lg:w-[55%] bg-slate-50 dark:bg-slate-800/50 p-8 md:p-14 lg:p-20 relative flex flex-col items-center justify-center overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
          
          <div className="absolute top-8 right-8 z-20 flex items-center gap-2 text-sm font-bold text-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
            <Globe className="w-4 h-4" />
            <span>EN</span>
          </div>

          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-400/20 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="w-full max-w-[600px] relative z-10 flex flex-col gap-10">
            
            <div className="text-center lg:text-left mt-8 lg:mt-0">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                All your billing.<br className="hidden lg:block" /> All in one place.
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                Create professional invoices, manage customers, and track payments seamlessly with our premium SaaS dashboard.
              </p>
            </div>

            {/* Realistic Dashboard Mockup */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-300/60 border border-slate-200 p-2 overflow-hidden aspect-[16/11] flex flex-col relative transform lg:hover:-translate-y-2 lg:hover:scale-[1.01] transition-all duration-500 w-full ml-auto">
              
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-400"></div>
              </div>
              
              <div className="flex-1 flex bg-slate-50 dark:bg-slate-800/50 overflow-hidden rounded-b-[28px]">
                {/* Mock Sidebar */}
                <div className="w-24 md:w-44 bg-[#071B3A] flex flex-col gap-4 p-4 md:p-5 shrink-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
                      <div className="w-4 h-4 rounded-sm bg-white dark:bg-slate-900"></div>
                    </div>
                    <div className="hidden md:block h-4 w-20 bg-white dark:bg-slate-900/20 rounded"></div>
                  </div>
                  <div className="h-9 w-full bg-white dark:bg-slate-900/10 rounded-xl"></div>
                  <div className="h-9 w-full bg-transparent border border-white/5 rounded-xl"></div>
                  <div className="h-9 w-full bg-transparent border border-white/5 rounded-xl"></div>
                  <div className="h-9 w-3/4 bg-transparent border border-white/5 rounded-xl"></div>
                </div>
                
                {/* Mock Main Area */}
                <div className="flex-1 p-5 md:p-6 flex flex-col gap-5 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 md:w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-9 w-24 md:w-32 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center">
                       <div className="h-2 w-12 md:w-16 bg-white dark:bg-slate-900/60 rounded"></div>
                    </div>
                  </div>
                  
                  {/* Revenue Cards */}
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-5 w-24 bg-slate-800 rounded"></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-5 w-24 bg-slate-800 rounded"></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-5 w-24 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 flex-1 overflow-hidden">
                    {/* Chart Mock */}
                    <div className="flex-[2] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-5 flex flex-col gap-4">
                      <div className="h-3 w-28 bg-slate-200 rounded"></div>
                      <div className="flex-1 flex items-end gap-3 px-2">
                        <div className="w-full bg-teal-500/20 rounded-t-lg h-[30%]"></div>
                        <div className="w-full bg-teal-500/40 rounded-t-lg h-[50%]"></div>
                        <div className="w-full bg-teal-500/60 rounded-t-lg h-[70%]"></div>
                        <div className="w-full bg-teal-500/80 rounded-t-lg h-[95%]"></div>
                        <div className="w-full bg-teal-500 rounded-t-lg h-[80%]"></div>
                      </div>
                    </div>
                    
                    {/* Recent Invoices Mock */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-5 flex flex-col gap-4">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      <div className="flex-1 space-y-3 md:space-y-4">
                        <div className="h-10 md:h-12 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center px-3 gap-3">
                           <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0"></div>
                           <div className="h-2 w-full bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-10 md:h-12 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center px-3 gap-3">
                           <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0"></div>
                           <div className="h-2 w-full bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial Card */}
            <div className="relative z-20 -mt-16 md:-mt-20 self-center md:self-start md:ml-12 lg:-ml-6">
              <div className="bg-[#071B3A] text-white p-6 rounded-2xl shadow-xl flex gap-4 w-[340px] md:w-[380px] transform md:hover:-translate-y-1 transition-transform border border-slate-800">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/10 flex items-center justify-center shrink-0">
                  <Quote className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-relaxed mb-3">
                    "BillQyro has completely transformed how we handle invoicing. It's incredibly fast, intuitive, and highly professional."
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Sarah Jenkins</h4>
                      <p className="text-[10px] text-slate-400">Founder, StyleStudio</p>
                    </div>
                    <div className="flex text-yellow-400 gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default WelcomeOnboarding;
