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
      } catch (e) {
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
      payeeName
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary flex items-center tracking-tight">
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
        <div className="bg-theme-surface-elevated p-6 rounded-2xl border border-theme-border-soft space-y-6">
          <div className="border-b border-theme-border-soft pb-4 mb-0">
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
        <div className="bg-theme-surface-elevated p-6 rounded-2xl border border-theme-border-soft space-y-5">
          <div className="border-b border-theme-border-soft pb-4 mb-0">
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
              className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Payee Name</label>
            <input 
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all text-sm"
            />
          </div>
        </div>

        {/* Business Limits */}
        <div className="bg-theme-surface-elevated p-6 rounded-2xl border border-theme-border-soft lg:col-span-2 space-y-6">
          <div className="border-b border-theme-border-soft pb-4 mb-0">
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
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Flat Charge Per Bill (₹)</label>
              <input 
                type="number" 
                value={chargePerBill}
                onChange={(e) => setChargePerBill(e.target.value)}
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Percentage Charge (%)</label>
              <input 
                type="number" 
                value={percentageChargeSetting}
                onChange={(e) => setPercentageChargeSetting(e.target.value)}
                placeholder="e.g. 1% of bill value"
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Grace Bills Count</label>
              <input 
                type="number" 
                value={monthlyGraceLimit}
                onChange={(e) => setMonthlyGraceLimit(e.target.value)}
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Max Pending Dues (₹)</label>
              <input 
                type="number" 
                value={maxPendingDue}
                onChange={(e) => setMaxPendingDue(e.target.value)}
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Max Unpaid Bills Count</label>
              <input 
                type="number" 
                value={maxUnpaidBillCount}
                onChange={(e) => setMaxUnpaidBillCount(e.target.value)}
                className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning transition-all text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Lock Behavior After Limit Exceeded</label>
            <select
              value={lockBehavior}
              onChange={(e) => setLockBehavior(e.target.value)}
              className="w-full bg-theme-app text-theme-primary border border-theme-border-soft rounded-xl px-4 py-3 focus:outline-none focus:border-theme-warning focus:ring-1 focus:ring-theme-warning cursor-pointer text-sm"
            >
              <option value="bill_creation">Lock New Bill Creation Only</option>
              <option value="none">No Lock (Warning Only)</option>
            </select>
          </div>
        </div>

        {/* Info Control */}
        <div className="bg-theme-danger/5 border border-theme-danger/20 rounded-2xl p-6 lg:col-span-2 flex items-start space-x-4">
          <ShieldAlert className="w-6 h-6 text-theme-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-theme-danger font-bold text-sm">Security & Enforcement Note</h4>
            <p className="text-theme-secondary text-xs mt-1 leading-relaxed">
              When lock enforcement is active, users exceeding their free bill limit, unpaid count, or max dues threshold will be restricted from saving new invoices. However, login, existing invoice viewing, downloads, and backups will remain fully operational.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default GlobalSettings;
