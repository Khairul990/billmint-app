import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, Phone, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { portalEngine } from '../../services/portalEngine';
import ClassicLoader from '../ClassicLoader';

export default function CustomerPortalLogin({ onVerificationSuccess, prefillId }) {
  const [customerId, setCustomerId] = useState(prefillId || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || !phone) {
      toast.error('Please enter both Customer ID and Phone Number.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const cleanCustomerId = customerId.replace(/[#\s]/g, '');
      const isVerified = await portalEngine.verifyCustomerPortal(cleanCustomerId, fullPhone);
      if (isVerified) {
        toast.success('Verification successful!');
        onVerificationSuccess(cleanCustomerId, fullPhone);
      } else {
        toast.error('Verification failed. Invalid Customer ID or Phone Number.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during verification.');
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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-accent via-theme-accent-light to-theme-accent"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-center text-theme-primary mb-2">Customer Portal</h2>
        <p className="text-center text-theme-muted mb-8 text-sm">
          Access your bills, payments, and history. No password required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">Customer ID</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input 
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-theme-main border border-theme-border-soft text-theme-primary rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-theme-accent transition-colors font-mono"
                placeholder="e.g. CUST-1234"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-muted uppercase mb-1">Phone Number</label>
            <div className="flex gap-2 relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 bg-theme-main border border-theme-border-soft text-theme-primary rounded-xl py-3 pl-10 pr-2 focus:outline-none focus:border-theme-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+880">+880 (BD)</option>
              </select>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-theme-main border border-theme-border-soft text-theme-primary rounded-xl py-3 px-4 focus:outline-none focus:border-theme-accent transition-colors"
                placeholder="Local Phone Number"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[image:var(--accent-gradient)] hover:opacity-90 text-white font-bold rounded-xl py-3 mt-4 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <ClassicLoader /> : <><KeyRound className="w-4 h-4" /> View My Bills</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
