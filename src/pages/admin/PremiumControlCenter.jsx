import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Search, Loader2, Save, CreditCard, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { toast } from 'react-hot-toast';
import { getGlobalRevenueSettings, saveGlobalRevenueSettings } from '../../services/platformRevenueService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const PremiumControlCenter = () => {
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [globalSettings, setGlobalSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const settings = await getGlobalRevenueSettings();
        setGlobalSettings(settings);
      } catch {
        toast.error('Failed to load global revenue settings');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLookupUser = async () => {
    if (!targetUserId.trim()) return;
    setLoading(true);
    setTargetUserEmail('');
    try {
      const userDoc = await getDoc(doc(db, 'usersList', targetUserId));
      if (userDoc.exists()) {
        setTargetUserEmail(userDoc.data().email || 'Found user');
        toast.success('User found!');
      } else {
        setTargetUserEmail('User not found');
        toast.error('No user found with this ID.');
      }
    } catch {
      toast.error('Failed to lookup user.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (newPlan) => {
    if (!targetUserId.trim()) {
      toast.error('Enter a user ID first.');
      return;
    }
    setActionLoading(newPlan);
    try {
      const subRef = doc(db, 'subscription', targetUserId);
      const userRef = doc(db, 'usersList', targetUserId);
      const settingsRef = doc(db, 'settings', targetUserId);

      const now = Date.now();
      const durationMs = newPlan === 'trial' ? 7 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
      const expiresAt = newPlan === 'free' ? null : now + durationMs;

      await setDoc(subRef, {
        status: newPlan === 'free' ? 'free' : 'premium',
        plan: newPlan,
        activatedAt: newPlan === 'free' ? null : now,
        expiresAt,
        updatedAt: now
      });
      await setDoc(userRef, { planStatus: newPlan === 'free' ? 'free' : 'premium' }, { merge: true });
      await setDoc(settingsRef, { planStatus: newPlan === 'free' ? 'free' : 'premium' }, { merge: true });

      toast.success(`User set to ${newPlan} successfully!`);
    } catch (e) {
      console.error('Override failed:', e);
      toast.error('Failed to update user plan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const success = await saveGlobalRevenueSettings(globalSettings);
      if (success) {
        toast.success('Global pricing & payment settings updated!');
      } else {
        toast.error('Failed to update global settings.');
      }
    } catch {
      toast.error('Error saving global settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-32">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-theme-surface to-theme-surface border border-theme-border-soft p-8 shadow-glass z-10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-accent/20 to-purple-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-theme-accent/30 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-accent to-purple-600 p-0.5 shadow-premium">
              <div className="w-full h-full bg-theme-surface/90 backdrop-blur-xl rounded-[15px] flex items-center justify-center">
                <Crown className="w-8 h-8 text-theme-accent" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-theme-primary tracking-tight">Premium Control Center</h2>
              <p className="text-sm font-semibold text-theme-muted mt-1.5 max-w-md leading-relaxed">
                Oversee platform subscriptions, manage user access levels, and configure global revenue routing securely.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Lookup & Override Card */}
        <div className="bg-theme-surface/60 backdrop-blur-2xl border border-theme-border-soft rounded-3xl p-6 shadow-glass relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-theme-info/10 text-theme-info flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-theme-primary">User Privileges</h3>
              <p className="text-xs font-semibold text-theme-muted">Lookup and force plan overrides</p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative group">
              <Input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter User ID (uid)"
                className="w-full pl-4 pr-4 py-3.5 bg-theme-app border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-info focus:ring-1 focus:ring-theme-info/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.05)]"
              />
            </div>
            <Button
              onClick={handleLookupUser}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl font-bold bg-theme-info hover:bg-theme-info/90 text-white shadow-lg shadow-theme-info/20 shrink-0 h-[48px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
              {loading ? '' : 'Lookup'}
            </Button>
          </div>

          <AnimatePresence>
            {targetUserEmail && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className={`overflow-hidden rounded-xl border p-4 ${
                  targetUserEmail === 'User not found' 
                    ? 'bg-theme-danger/10 border-theme-danger/20 text-theme-danger' 
                    : 'bg-theme-success/10 border-theme-success/20 text-theme-success'
                }`}
              >
                <div className="flex items-center gap-3">
                  {targetUserEmail !== 'User not found' && <CheckCircle2 className="w-5 h-5" />}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-70">
                      {targetUserEmail === 'User not found' ? 'Error' : 'Verified User'}
                    </span>
                    <span className="text-sm font-bold">{targetUserEmail}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 border-t border-theme-border-soft/50 pt-6 flex-1 flex flex-col justify-end">
            <h4 className="text-xs font-black text-theme-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-theme-warning" /> Override Actions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOverride('free')}
                disabled={actionLoading !== null || targetUserEmail === 'User not found' || !targetUserId}
                className="h-auto py-3 px-2 flex flex-col items-center gap-1 bg-theme-surface border-theme-border-soft hover:bg-theme-surface-hover hover:border-theme-primary/30"
              >
                {actionLoading === 'free' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xs font-bold text-theme-secondary">Free</span>}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOverride('premium')}
                disabled={actionLoading !== null || targetUserEmail === 'User not found' || !targetUserId}
                className="h-auto py-3 px-2 flex flex-col items-center gap-1 bg-theme-accent/5 border-theme-accent/20 text-theme-accent hover:bg-theme-accent hover:text-white transition-all shadow-premium-sm"
              >
                {actionLoading === 'premium' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xs font-bold">Premium</span>}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOverride('lifetime')}
                disabled={actionLoading !== null || targetUserEmail === 'User not found' || !targetUserId}
                className="h-auto py-3 px-2 flex flex-col items-center gap-1 bg-theme-primary/5 border-theme-primary/20 text-theme-primary hover:bg-theme-primary hover:text-theme-surface transition-all"
              >
                {actionLoading === 'lifetime' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xs font-bold">Lifetime</span>}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOverride('trial')}
                disabled={actionLoading !== null || targetUserEmail === 'User not found' || !targetUserId}
                className="h-auto py-3 px-2 flex flex-col items-center gap-1 bg-theme-success/5 border-theme-success/20 text-theme-success hover:bg-theme-success hover:text-white transition-all"
              >
                {actionLoading === 'trial' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xs font-bold">Trial (7D)</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Global Configuration */}
        {!settingsLoading && globalSettings && (
          <div className="space-y-6">
            <div className="bg-theme-surface/60 backdrop-blur-2xl border border-theme-border-soft rounded-3xl p-6 shadow-glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-theme-primary">Global Pricing Base</h3>
                  <p className="text-xs font-semibold text-theme-muted">Default plan pricing across the platform</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Monthly Base</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">₹</span>
                    <input 
                      type="number" 
                      value={globalSettings.priceMonthly || ''} 
                      onChange={(e) => handleSettingChange('priceMonthly', parseFloat(e.target.value))} 
                      className="w-full pl-8 pr-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Quarterly Base</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">₹</span>
                    <input 
                      type="number" 
                      value={globalSettings.priceQuarterly || ''} 
                      onChange={(e) => handleSettingChange('priceQuarterly', parseFloat(e.target.value))} 
                      className="w-full pl-8 pr-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Yearly Base</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">₹</span>
                    <input 
                      type="number" 
                      value={globalSettings.priceYearly || ''} 
                      onChange={(e) => handleSettingChange('priceYearly', parseFloat(e.target.value))} 
                      className="w-full pl-8 pr-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Lifetime Base</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">₹</span>
                    <input 
                      type="number" 
                      value={globalSettings.priceLifetime || ''} 
                      onChange={(e) => handleSettingChange('priceLifetime', parseFloat(e.target.value))} 
                      className="w-full pl-8 pr-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-theme-surface/60 backdrop-blur-2xl border border-theme-border-soft rounded-3xl p-6 shadow-glass relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-success to-emerald-400"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-theme-primary">Payment Routing</h3>
                  <p className="text-xs font-semibold text-theme-muted">Platform bank & UPI details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Account Name</label>
                    <input 
                      type="text" 
                      value={globalSettings.bankAccountName || ''} 
                      onChange={(e) => handleSettingChange('bankAccountName', e.target.value)} 
                      className="w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-success focus:ring-1 focus:ring-theme-success/50 transition-all"
                      placeholder="Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Account Number</label>
                    <input 
                      type="text" 
                      value={globalSettings.bankAccountNumber || ''} 
                      onChange={(e) => handleSettingChange('bankAccountNumber', e.target.value)} 
                      className="w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-success focus:ring-1 focus:ring-theme-success/50 transition-all"
                      placeholder="XXXX-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Bank Name</label>
                    <input 
                      type="text" 
                      value={globalSettings.bankName || ''} 
                      onChange={(e) => handleSettingChange('bankName', e.target.value)} 
                      className="w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-success focus:ring-1 focus:ring-theme-success/50 transition-all"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">IFSC Code</label>
                    <input 
                      type="text" 
                      value={globalSettings.bankIfsc || ''} 
                      onChange={(e) => handleSettingChange('bankIfsc', e.target.value)} 
                      className="w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-success focus:ring-1 focus:ring-theme-success/50 transition-all"
                      placeholder="HDFC0001234"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">UPI ID</label>
                  <input 
                    type="text" 
                    value={globalSettings.upiId || ''} 
                    onChange={(e) => handleSettingChange('upiId', e.target.value)} 
                    className="w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-success focus:ring-1 focus:ring-theme-success/50 transition-all"
                    placeholder="merchant@upi"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-3.5 rounded-xl font-bold bg-theme-success hover:bg-theme-success/90 text-white shadow-lg shadow-theme-success/20 w-full md:w-auto"
                >
                  {savingSettings ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Global Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(PremiumControlCenter);
