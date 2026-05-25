import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Globe,
  Quote,
  ArrowRight,
  Shield,
  ArrowRightCircle
} from 'lucide-react';
import Logo from '../components/Logo';
import { auth, firebaseReady } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { login, getSettings, getAdminEmail } from '../utils/storage';

const DashboardMockup = () => (
  <div className="relative w-full max-w-lg mt-auto pb-12 pt-8 mx-auto">
    {/* Browser/App Window */}
    <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      {/* App Content */}
      <div className="p-4 flex gap-4 bg-slate-50/50">
        {/* Sidebar */}
        <div className="w-1/3 bg-[#0f172a] rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-teal-500" />
            <div className="w-16 h-3 rounded-full bg-slate-700" />
          </div>
          <div className="w-full h-8 rounded-lg bg-slate-800" />
          <div className="w-full h-8 rounded-lg bg-slate-800/50" />
          <div className="w-full h-8 rounded-lg bg-slate-800/50" />
          <div className="w-full h-8 rounded-lg bg-slate-800/50" />
        </div>
        {/* Main Area */}
        <div className="w-2/3 flex flex-col gap-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="w-32 h-4 rounded-full bg-slate-200" />
            <div className="w-20 h-8 rounded-lg bg-teal-500" />
          </div>
          {/* Stats Row */}
          <div className="flex gap-3">
            <div className="flex-1 h-16 rounded-xl bg-white border border-slate-100 p-3 flex flex-col justify-between shadow-sm">
              <div className="w-12 h-2 rounded-full bg-slate-200" />
              <div className="w-20 h-4 rounded-full bg-slate-800" />
            </div>
            <div className="flex-1 h-16 rounded-xl bg-white border border-slate-100 p-3 flex flex-col justify-between shadow-sm">
              <div className="w-12 h-2 rounded-full bg-slate-200" />
              <div className="w-20 h-4 rounded-full bg-slate-800" />
            </div>
            <div className="flex-1 h-16 rounded-xl bg-white border border-slate-100 p-3 flex flex-col justify-between shadow-sm">
              <div className="w-12 h-2 rounded-full bg-slate-200" />
              <div className="w-20 h-4 rounded-full bg-slate-800" />
            </div>
          </div>
          {/* Charts Area */}
          <div className="flex gap-3">
            <div className="flex-[2] h-24 rounded-xl bg-white border border-slate-100 shadow-sm p-4 flex items-end gap-2">
              <div className="w-1/5 h-1/2 bg-teal-100 rounded-t-sm" />
              <div className="w-1/5 h-3/4 bg-teal-200 rounded-t-sm" />
              <div className="w-1/5 h-full bg-teal-400 rounded-t-sm" />
              <div className="w-1/5 h-2/3 bg-teal-300 rounded-t-sm" />
              <div className="w-1/5 h-1/4 bg-teal-100 rounded-t-sm" />
            </div>
            <div className="flex-[1] h-24 rounded-xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="w-12 h-2 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="w-12 h-2 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Testimonial Card */}
    <div className="absolute -bottom-6 -left-6 sm:-left-12 bg-[#0f172a] rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] max-w-[300px] border border-slate-800">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
          <Quote className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <p className="text-white text-xs sm:text-sm font-medium leading-relaxed mb-4">
            "BillQyro has completely transformed how we handle invoicing. It's incredibly fast, intuitive, and highly professional."
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white text-xs font-bold">Sarah Jenkins</p>
              <p className="text-slate-400 text-[10px]">Founder, StyleStudio</p>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Login = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setResetSent(false);

    if (!email) return setError('Please enter your email.');
    if (!password) return setError('Please enter your password.');

    setLoading(true);

    try {
      if (!firebaseReady || !auth) {
        // Fallback to local login if firebase isn't configured
        const isOk = login(email); 
        if (isOk) {
          localStorage.setItem('billqyro_admin_unlocked', 'true');
          onLoginSuccess();
        } else {
          setError('Invalid local credentials or Firebase not configured.');
        }
        setLoading(false);
        return;
      }

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess(); 
    } catch (err) {
      let msg = err.message.replace('Firebase: ', '');
      if (msg.includes('auth/invalid-credential')) msg = 'Invalid email or password.';
      if (msg.includes('auth/email-already-in-use')) msg = 'An account with this email already exists.';
      if (msg.includes('auth/weak-password')) msg = 'Password should be at least 6 characters.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError('Please enter your email address first to reset password.');
    if (!firebaseReady || !auth) return setError('Firebase is not configured.');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      let msg = err.message.replace('Firebase: ', '');
      if (msg.includes('auth/user-not-found')) msg = 'No account found with this email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500/30">
      <div className="max-w-[1100px] w-full bg-white rounded-[2rem] shadow-2xl flex overflow-hidden border border-slate-100">
        
        {/* Left Column: Login Form */}
        <div className="w-full lg:w-[45%] p-8 sm:p-12 flex flex-col justify-center bg-white relative">
          
          {/* Logo Section */}
          <div className="mb-10 lg:mb-12">
            <Logo type="horizontal" className="h-10" />
          </div>

          {/* Headings */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Welcome to BillQyro
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-sm leading-relaxed">
            Log in to access your professional billing and invoicing dashboard.
          </p>

          {/* Toggle Log In / Sign Up */}
          <div className="flex p-1.5 bg-slate-100 rounded-xl mb-8">
            <button 
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setError(''); setResetSent(false); setEmail(e.target.value); }}
                  placeholder="admin@billqyro.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setError(''); setPassword(e.target.value); }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-tight">{error}</span>
                  </div>
                </motion.div>
              )}
              {resetSent && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs font-medium text-teal-600 mt-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="leading-tight">Password reset email sent. Check your inbox.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isSignUp ? 'Create BillQyro Account' : 'Log in to BillQyro'}</span>
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative flex items-center my-8">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Skip to Demo Button */}
          <button
            onClick={() => {
              login(getAdminEmail() || 'admin@billqyro.com'); 
              localStorage.setItem('billqyro_admin_unlocked', 'true');
              onLoginSuccess();
            }}
            className="w-full flex items-center justify-between py-3.5 px-5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all shadow-sm group mb-8"
          >
            <span>Skip to Demo</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Features Footer */}
          <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between gap-2">
            <div className="flex flex-col items-center text-center gap-1.5 flex-1">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mb-1">
                <Shield className="w-4 h-4 text-teal-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-800">Secure & Private</p>
              <p className="text-[9px] text-slate-400 leading-tight">AES-256 encrypted storage</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                <ArrowRight className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-800">Fast & Reliable</p>
              <p className="text-[9px] text-slate-400 leading-tight">Instant invoice creation</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 flex-1">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-1">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-800">Trusted Design</p>
              <p className="text-[9px] text-slate-400 leading-tight">Premium SaaS layout</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400">
              By {isSignUp ? 'signing up' : 'logging in'}, you agree to our <strong className="text-slate-500">Terms of Service</strong> and <strong className="text-slate-500">Privacy Policy</strong>.
            </p>
          </div>

        </div>

        {/* Right Column: Hero Graphic (Hidden on mobile) */}
        <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-[#e0f7f4] to-[#f4fbfc] p-12 xl:p-16 flex-col relative overflow-hidden">
          
          {/* Top Right Lang Toggle */}
          <div className="absolute top-8 right-8 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/50 shadow-sm flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer hover:bg-white transition-colors z-10">
            <Globe className="w-3.5 h-3.5" />
            <span>EN</span>
          </div>

          {/* Heading */}
          <div className="relative z-10">
            <h2 className="text-4xl xl:text-5xl font-black text-slate-800 leading-[1.15] mb-5 tracking-tight">
              All your billing.<br />
              All in one place.
            </h2>
            <p className="text-slate-500 text-sm xl:text-base leading-relaxed max-w-md">
              Create professional invoices, manage customers, and track payments seamlessly with our premium SaaS dashboard.
            </p>
          </div>

          {/* Dashboard Mockup Graphic */}
          <DashboardMockup />
          
        </div>

      </div>
    </div>
  );
};

export default Login;
