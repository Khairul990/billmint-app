import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, FileDown, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import { auth, firebaseReady } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { login } from '../utils/storage';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

const LoginAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full relative p-8">
      <div className="relative w-64 h-64 flex items-center justify-center">
        
        {/* Step 1: Bill Created */}
        <motion.div
          animate={{
            y: [20, -20, -20, 20],
            opacity: [0, 1, 0, 0],
            scale: [0.8, 1, 0.8, 0.8]
          }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.2, 0.4, 1], ease: "easeInOut" }}
          className="absolute z-10"
        >
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 w-40">
            <div className="flex justify-between items-center mb-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Logo type="icon" className="w-5 h-5" /></div>
              <div className="w-12 h-2 bg-slate-200 rounded-full" />
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full" />
            <div className="w-3/4 h-2 bg-slate-200 rounded-full" />
            <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
            <div className="w-1/2 h-3 bg-teal-100 rounded-full mt-1" />
          </div>
        </motion.div>

        {/* Step 2: Processing */}
        <motion.div
          animate={{
            rotate: 360,
            opacity: [0, 0, 1, 0, 0],
            scale: [0.5, 0.5, 1.2, 0.5, 0.5]
          }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.35, 0.5, 0.65, 1], ease: "easeInOut" }}
          className="absolute z-20 text-teal-400 drop-shadow-xl bg-slate-900 rounded-full p-3 border border-slate-800"
        >
          <RefreshCw size={32} />
        </motion.div>

        {/* Step 3: PDF Ready */}
        <motion.div
          animate={{
            y: [-20, 0, 0, 20],
            opacity: [0, 0, 0, 1, 0],
            scale: [0.8, 0.8, 0.8, 1, 0.8]
          }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.5, 0.6, 0.8, 1], ease: "backOut" }}
          className="absolute z-30"
        >
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-2xl shadow-[0_20px_50px_rgba(20,184,166,0.3)] flex flex-col items-center gap-4 w-44 text-white border border-teal-400/30">
            <div className="bg-white dark:bg-slate-900/20 p-3 rounded-xl backdrop-blur-sm">
              <FileDown size={40} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-black tracking-widest uppercase">PDF Ready</span>
          </div>
        </motion.div>
      </div>

      <div className="mt-12 text-center relative z-40">
        <h3 className="text-2xl font-bold text-white mb-3">Professional Invoicing</h3>
        <p className="text-sm text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          Create, manage and download premium PDF invoices instantly across all your devices.
        </p>
      </div>
    </div>
  );
};

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
        const isOk = login(email); // Local fallback uses email as identifier if admin
        if (isOk) {
          localStorage.setItem('billqyro_admin_unlocked', 'true');
          onLoginSuccess();
        } else {
          setError('Firebase is not configured. Local fallback failed (invalid credentials).');
        }
        setLoading(false);
        return;
      }

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess(); // Trigger App.jsx state update
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

  const handleGoogleAuth = async () => {
    if (!firebaseReady || !auth) return setError('Firebase is not configured for Google Login.');
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err) {
      let msg = err.message.replace('Firebase: ', '');
      if (msg.includes('popup-closed-by-user')) return; // Ignore user cancellation
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
    <div className="min-h-screen flex bg-slate-900 font-sans overflow-hidden">
      
      {/* Left side animation (hidden on mobile) */}
      <div className="hidden lg:flex w-5/12 bg-slate-950 border-r border-slate-800 items-center justify-center relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-900/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-900/10 blur-3xl rounded-full" />
        
        <LoginAnimation />
      </div>

      {/* Right side login form */}
      <div className="flex w-full lg:w-7/12 items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 lg:hidden">
          <Logo type="horizontal" className="h-8" forceWhiteText />
        </div>

        <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              {isSignUp ? 'Join BillQyro to create premium invoices.' : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all mb-6 disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Or email</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setError(''); setResetSent(false); setEmail(e.target.value); }}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setError(''); setPassword(e.target.value); }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                  <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-sm text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
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
                  <div className="flex items-start gap-2 p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 rounded-xl text-sm text-teal-600 dark:text-teal-400">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-tight">Password reset email sent. Check your inbox.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setResetSent(false); }} 
                className="font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
