import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Key, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import ClassicLoader from '../ClassicLoader';

export default function StudentLogin({ studentId, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully! Claiming your portal...');
        onLoginSuccess(userCredential.user);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('Email is already registered. Please login instead.');
        setIsLogin(true);
      } else {
        toast.error(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-theme-card border border-theme-border-soft rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-center text-theme-primary mb-2">Student Portal Access</h2>
        <p className="text-center text-theme-muted mb-8 text-sm">
          Student ID: <span className="font-mono font-bold">{studentId}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-theme-main border border-theme-border-soft text-theme-primary rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="student@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-theme-main border border-theme-border-soft text-theme-primary rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl py-3 mt-4 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <ClassicLoader /> : (isLogin ? <><Lock className="w-4 h-4" /> Secure Login</> : <><GraduationCap className="w-4 h-4" /> Create & Claim Portal</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 text-sm font-bold hover:underline"
          >
            {isLogin ? "First time here? Claim your portal." : "Already have an account? Login here."}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
