import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Star,
  Globe,
  Quote,
  ChevronRight
} from 'lucide-react';
import { auth, firebaseReady } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { login } from '../utils/storage';
import Logo from '../components/Logo';

export default function Login({ onLoginSuccess }) {
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
        const isOk = login(email);
        if (isOk) {
          localStorage.setItem('billqyro_admin_unlocked', 'true');
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setError('Invalid credentials for local fallback.');
        }
        setLoading(false);
        return;
      }

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onLoginSuccess) onLoginSuccess();
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

  const handleDemoLogin = () => {
    login('admin@billqyro.com'); // standard demo fallback
    localStorage.setItem('billqyro_admin_unlocked', 'true');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090f1a] p-4 sm:p-8 font-sans text-slate-200">
      <div className="flex w-full max-w-[1100px] flex-col overflow-hidden rounded-[24px] border border-white/5 bg-[#0e1420] shadow-2xl lg:flex-row lg:h-[720px]">
        
        {/* LEFT PANEL: Form */}
        <div className="flex w-full flex-col p-8 sm:p-12 lg:w-[45%] lg:border-r border-white/10 relative z-10 bg-[#0e1420]">
          
          <div className="mb-10">
            <Logo type="horizontal" className="h-8" forceWhiteText />
          </div>

          <div className="flex-1">
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-white">
              Welcome to BillQyro
            </h1>
            <p className="mb-8 text-sm text-slate-400">
              Log in to access your professional billing and invoicing dashboard.
            </p>

            {/* Tabs */}
            <div className="mb-8 flex rounded-xl bg-[#161f30] p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  !isSignUp ? 'bg-[#1e293b] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  isSignUp ? 'bg-[#1e293b] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@billqyro.com"
                    className="w-full rounded-xl border border-white/10 bg-[#161f30] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <button type="button" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-[#161f30] py-3.5 pl-11 pr-16 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-[#022c22] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-70"
              >
                <Lock size={16} />
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up for BillQyro' : 'Log in to BillQyro')}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="px-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Or</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <button 
              type="button"
              onClick={handleDemoLogin}
              className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#161f30] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
            >
              Skip to Demo
              <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
            </button>
          </div>

          <div className="mt-10">
            <div className="flex justify-between border-b border-white/10 pb-6 text-center">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-bold text-white">Secure & Private</span>
                <span className="mt-0.5 text-[9px] text-slate-500">AES-256 encrypted storage</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-400">
                  <ArrowRight size={20} />
                </div>
                <span className="text-[10px] font-bold text-white">Fast & Reliable</span>
                <span className="mt-0.5 text-[9px] text-slate-500">Instant invoice creation</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-400">
                  <Star size={20} />
                </div>
                <span className="text-[10px] font-bold text-white">Trusted Design</span>
                <span className="mt-0.5 text-[9px] text-slate-500">Premium SaaS layout</span>
              </div>
            </div>
            <p className="mt-6 text-center text-[10px] text-slate-500">
              By logging in, you agree to our <a href="#" className="text-emerald-400 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Visuals */}
        <div className="relative hidden w-[55%] flex-col bg-gradient-to-br from-[#0c1c25] to-[#07131b] p-12 lg:flex overflow-hidden">
          
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/3 translate-x-1/3 rounded-full bg-emerald-500/10 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/3 -translate-x-1/3 rounded-full bg-teal-500/10 blur-[100px]"></div>
          </div>

          <div className="relative z-10 flex justify-end">
            <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-300 transition hover:bg-white/10 uppercase">
              <Globe size={14} /> EN
            </button>
          </div>

          <div className="relative z-10 mt-16 mb-12 max-w-md">
            <h2 className="text-4xl font-black leading-tight tracking-tight text-white mb-4">
              All your billing.<br />All in one place.
            </h2>
            <p className="text-sm leading-relaxed text-[#518b95]">
              Create professional invoices, manage customers, and track payments seamlessly with our premium SaaS dashboard.
            </p>
          </div>

          <div className="relative z-10 flex-1 w-full">
            {/* Dashboard Mockup */}
            <div className="absolute top-0 right-0 w-[550px] rounded-[20px] border border-white/10 bg-[#121927] shadow-2xl shadow-emerald-500/10">
              {/* Window Header */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              </div>
              
              <div className="flex h-[320px] p-4 gap-4">
                {/* Sidebar */}
                <div className="w-[80px] rounded-xl border border-white/5 bg-[#0f1420] flex flex-col items-center py-4 gap-4">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30"></div>
                  <div className="w-full flex flex-col gap-3 px-3 mt-4">
                    <div className="h-2.5 w-full rounded-full bg-white/10"></div>
                    <div className="h-2.5 w-full rounded-full bg-white/5"></div>
                    <div className="h-2.5 w-full rounded-full bg-white/5"></div>
                    <div className="h-2.5 w-full rounded-full bg-white/5"></div>
                  </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Top Bar */}
                  <div className="flex justify-between gap-4">
                     <div className="h-8 w-48 rounded-lg bg-[#e2e8f0]"></div>
                     <div className="h-8 w-24 rounded-lg bg-emerald-500"></div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex gap-4">
                    <div className="h-16 flex-1 rounded-xl bg-white/5 flex flex-col justify-center px-4 gap-2 border border-white/5">
                      <div className="h-2 w-12 rounded-full bg-white/20"></div>
                      <div className="h-3 w-20 rounded-full bg-white/50"></div>
                    </div>
                    <div className="h-16 flex-1 rounded-xl bg-white/5 flex flex-col justify-center px-4 gap-2 border border-white/5">
                      <div className="h-2 w-12 rounded-full bg-white/20"></div>
                      <div className="h-3 w-20 rounded-full bg-white/50"></div>
                    </div>
                    <div className="h-16 flex-1 rounded-xl bg-white/5 flex flex-col justify-center px-4 gap-2 border border-white/5">
                      <div className="h-2 w-12 rounded-full bg-white/20"></div>
                      <div className="h-3 w-20 rounded-full bg-white/50"></div>
                    </div>
                  </div>

                  {/* Bottom Area */}
                  <div className="flex gap-4 h-full">
                    <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-3">
                      <div className="h-2.5 w-24 rounded-full bg-white/30 mb-2"></div>
                      <div className="flex items-end gap-2 h-full pb-2">
                        <div className="w-1/5 bg-emerald-500/20 rounded-t-sm h-[30%]"></div>
                        <div className="w-1/5 bg-emerald-500/40 rounded-t-sm h-[50%]"></div>
                        <div className="w-1/5 bg-emerald-500/60 rounded-t-sm h-[80%]"></div>
                        <div className="w-1/5 bg-emerald-500/80 rounded-t-sm h-[40%]"></div>
                        <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[90%]"></div>
                      </div>
                    </div>
                    <div className="w-[120px] rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-4">
                       <div className="h-8 w-full rounded-md bg-white/5 border border-white/10 flex items-center px-3 gap-2">
                         <div className="h-2 w-2 rounded-full bg-white/30"></div>
                         <div className="h-1.5 w-8 rounded-full bg-white/20"></div>
                       </div>
                       <div className="h-8 w-full rounded-md bg-white/5 border border-white/10 flex items-center px-3 gap-2">
                         <div className="h-2 w-2 rounded-full bg-white/30"></div>
                         <div className="h-1.5 w-8 rounded-full bg-white/20"></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Float */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-4 left-0 w-[320px] rounded-2xl border border-white/10 bg-[#0d1a2f] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-3 flex items-start gap-2">
                <Quote className="text-emerald-400 rotate-180 opacity-60 shrink-0" size={16} />
                <p className="text-[11px] font-bold leading-relaxed text-white">
                  "BillQyro has completely transformed how we handle invoicing. It's incredibly fast, intuitive, and highly professional."
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white">Sarah Jenkins</p>
                  <p className="text-[9px] text-[#518b95]">Founder, StyleStudio</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
