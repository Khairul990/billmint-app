import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, ShieldAlert, Zap, Sliders, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { CardSkeleton } from '../../components/PremiumSkeleton';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';

const GlobalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [premiumModeEnabled, setPremiumModeEnabled] = useState(true);
  const [payPerBillEnabled, setPayPerBillEnabled] = useState(true);
  const [freeBillLimit, setFreeBillLimit] = useState(10);
  const [chargePerBill, setChargePerBill] = useState(5);
  const [percentageChargeSetting, setPercentageChargeSetting] = useState(0);
  const [monthlyGraceLimit, setMonthlyGraceLimit] = useState(5);
  const [maxPendingDue, setMaxPendingDue] = useState(100);
  const [maxUnpaidBillCount, setMaxUnpaidBillCount] = useState(20);
  const [lockBehavior, setLockBehavior] = useState('bill_creation');
  const [upiId, setUpiId] = useState('khairul2052007@okaxis');
  const [payeeName, setPayeeName] = useState('BillQyro Platform');
  const [defaultTheme, setDefaultTheme] = useState('obsidian-gold');
  const [defaultTemplate, setDefaultTemplate] = useState('standard');
  const [defaultCurrency, setDefaultCurrency] = useState('₹');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await adminEngine.getRevenueSettings();
        setPremiumModeEnabled(s.premiumModeEnabled ?? true);
        setPayPerBillEnabled(s.payPerBillEnabled ?? true);
        setFreeBillLimit(s.freeBillLimit ?? 10);
        setChargePerBill(s.chargePerBill ?? 5);
        setPercentageChargeSetting(s.percentageChargeSetting ?? 0);
        setMonthlyGraceLimit(s.monthlyGraceLimit ?? 5);
        setMaxPendingDue(s.maxPendingDue ?? 100);
        setMaxUnpaidBillCount(s.maxUnpaidBillCount ?? 20);
        setLockBehavior(s.lockBehavior ?? 'bill_creation');
        setUpiId(s.upiId || 'khairul2052007@okaxis');
        setPayeeName(s.payeeName || 'BillQyro Platform');
        setDefaultTheme(s.defaultTheme || 'obsidian-gold');
        setDefaultTemplate(s.defaultTemplate || 'standard');
        setDefaultCurrency(s.defaultCurrency || '₹');
      } catch {
        toast.error('Failed to load global revenue settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!window.confirm('Are you sure you want to overwrite global revenue settings? This will affect all users.')) return;
    setLoading(true);
    const payload = {
      premiumModeEnabled,
      payPerBillEnabled,
      freeBillLimit: parseInt(freeBillLimit) || 10,
      chargePerBill: parseFloat(chargePerBill) || 5,
      percentageChargeSetting: parseFloat(percentageChargeSetting) || 0,
      monthlyGraceLimit: parseInt(monthlyGraceLimit) || 5,
      maxPendingDue: parseFloat(maxPendingDue) || 100,
      maxUnpaidBillCount: parseInt(maxUnpaidBillCount) || 20,
      lockBehavior,
      upiId,
      payeeName,
      defaultTheme,
      defaultTemplate,
      defaultCurrency
    };

    try {
      const success = await adminEngine.saveRevenueSettings(payload);
      if (success) {
        toast.success('Global revenue settings saved successfully!');
      } else {
        toast.error('Failed to save settings to Firestore.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
        <div className="section-header">
          <div>
            <h2 className="text-2xl font-black text-theme-primary flex items-center tracking-tight">
              <Sliders className="w-6 h-6 mr-3 text-theme-accent" /> Revenue Settings (Owner)
            </h2>
            <p className="section-header-subtitle">Loading configuration...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
          <div className="lg:col-span-2">
            <CardSkeleton lines={6} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-theme-accent/20 via-transparent to-transparent p-6 rounded-3xl border border-theme-accent/10">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-theme-primary to-theme-accent flex items-center tracking-tight">
            <Sliders className="w-8 h-8 mr-3 text-theme-accent" /> Revenue Settings (Owner)
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Configure global monetization parameters and limits.</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={loading}
          variant="primary"
          className="shadow-premium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Settings */}
        <div className="glass-card p-8 rounded-3xl border border-theme-border-soft/50 shadow-premium space-y-6 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-accent/5 rounded-full blur-3xl group-hover:bg-theme-accent/10 transition-colors pointer-events-none"></div>
          <div className="border-b border-theme-border-soft/50 pb-5 mb-2 relative">
            <h3 className="text-lg font-bold text-theme-primary flex items-center">
              <Globe className="w-5 h-5 mr-2 text-theme-accent" /> Monetization Modes
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-theme-secondary">Enable Premium Subscriptions</span>
            <Switch checked={premiumModeEnabled} onChange={(checked) => setPremiumModeEnabled(checked)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-theme-secondary">Enable Pay-Per-Bill Model</span>
            <Switch checked={payPerBillEnabled} onChange={(checked) => setPayPerBillEnabled(checked)} />
          </div>
        </div>

        {/* UPI Payments */}
        <div className="glass-card p-8 rounded-3xl border border-theme-border-soft/50 shadow-premium space-y-6 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-accent/5 rounded-full blur-3xl group-hover:bg-theme-accent/10 transition-colors pointer-events-none"></div>
          <div className="border-b border-theme-border-soft/50 pb-5 mb-2 relative">
            <h3 className="text-lg font-bold text-theme-primary flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-theme-accent" /> UPI Payment Details
            </h3>
          </div>
          <div>
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Platform UPI ID</label>
            <input 
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all font-mono text-sm shadow-inner"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Payee Name</label>
            <input 
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all text-sm shadow-inner"
            />
          </div>
        </div>

        {/* Business Limits */}
        <div className="glass-card p-8 rounded-3xl border border-theme-border-soft/50 shadow-premium lg:col-span-2 space-y-6 relative overflow-hidden group hover:border-theme-warning/30 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-warning/5 rounded-full blur-3xl group-hover:bg-theme-warning/10 transition-colors pointer-events-none"></div>
          <div className="border-b border-theme-border-soft/50 pb-5 mb-2 relative">
            <h3 className="text-lg font-bold text-theme-primary flex items-center">
              <Zap className="w-5 h-5 mr-2 text-theme-warning" /> Pricing & Lock Parameters
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Free Bill Limit</label>
              <input 
                type="number" 
                value={freeBillLimit}
                onChange={(e) => setFreeBillLimit(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Flat Charge Per Bill (₹)</label>
              <input 
                type="number" 
                value={chargePerBill}
                onChange={(e) => setChargePerBill(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Percentage Charge (%)</label>
              <input 
                type="number" 
                value={percentageChargeSetting}
                onChange={(e) => setPercentageChargeSetting(e.target.value)}
                placeholder="e.g. 1% of bill value"
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Grace Bills Count</label>
              <input 
                type="number" 
                value={monthlyGraceLimit}
                onChange={(e) => setMonthlyGraceLimit(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Max Pending Dues (₹)</label>
              <input 
                type="number" 
                value={maxPendingDue}
                onChange={(e) => setMaxPendingDue(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Max Unpaid Bills Count</label>
              <input 
                type="number" 
                value={maxUnpaidBillCount}
                onChange={(e) => setMaxUnpaidBillCount(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 transition-all text-sm font-bold shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Lock Behavior After Limit Exceeded</label>
            <select
              value={lockBehavior}
              onChange={(e) => setLockBehavior(e.target.value)}
              className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-warning focus:ring-2 focus:ring-theme-warning/20 cursor-pointer text-sm font-bold shadow-inner"
            >
              <option value="bill_creation">Lock New Bill Creation Only</option>
              <option value="none">No Lock (Warning Only)</option>
            </select>
          </div>
        </div>

        {/* Platform Defaults */}
        <div className="glass-card p-8 rounded-3xl border border-theme-border-soft/50 shadow-premium lg:col-span-2 space-y-6 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-accent/5 rounded-full blur-3xl group-hover:bg-theme-accent/10 transition-colors pointer-events-none"></div>
          <div className="border-b border-theme-border-soft/50 pb-5 mb-2 relative">
            <h3 className="text-lg font-bold text-theme-primary flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-theme-accent" /> Platform Defaults (New Users)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Default Theme</label>
              <select
                value={defaultTheme}
                onChange={(e) => setDefaultTheme(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 cursor-pointer text-sm font-bold shadow-inner"
              >
                <option value="obsidian-gold">Obsidian Gold (Luxury)</option>
                <option value="arctic-teal">Arctic Teal (Corporate)</option>
                <option value="rose-gold">Rose Gold (Premium)</option>
                <option value="neon-cyber">Neon Cyber (Modern)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Default Template</label>
              <select
                value={defaultTemplate}
                onChange={(e) => setDefaultTemplate(e.target.value)}
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 cursor-pointer text-sm font-bold shadow-inner"
              >
                <option value="standard">Standard Professional</option>
                <option value="modern">Modern Minimal</option>
                <option value="classic">Classic Corporate</option>
                <option value="elegant">Elegant Serif</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Default Currency Symbol</label>
              <input 
                type="text" 
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                placeholder="e.g. ₹, $, €"
                className="w-full bg-theme-app/50 backdrop-blur-sm text-theme-primary border border-theme-border-soft/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all text-sm font-numbers shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Info Control */}
        <div className="glass-card bg-theme-danger/5 border border-theme-danger/20 rounded-3xl p-8 lg:col-span-2 flex items-start space-x-5 shadow-premium relative overflow-hidden group">
          <div className="absolute -left-12 top-0 bottom-0 w-24 bg-theme-danger/10 blur-3xl group-hover:bg-theme-danger/20 transition-colors pointer-events-none"></div>
          <div className="bg-theme-danger/10 p-3 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6 text-theme-danger" />
          </div>
          <div className="relative">
            <h4 className="text-theme-danger font-black tracking-wide text-sm">SECURITY & ENFORCEMENT PROTOCOL</h4>
            <p className="text-theme-secondary text-sm mt-2 leading-relaxed max-w-4xl">
              When lock enforcement is active, users exceeding their free bill limit, unpaid count, or max dues threshold will be restricted from saving new invoices. However, login, existing invoice viewing, downloads, and backups will remain fully operational.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default GlobalSettings;
