import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, ShieldAlert, Zap, Sliders, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { getGlobalRevenueSettings, saveGlobalRevenueSettings } from '../../services/dbEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { CardSkeleton } from '../../components/PremiumSkeleton';

const ToggleSwitch = ({ label, enabled, setEnabled }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
    <div className="relative">
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={enabled}
        onChange={() => setEnabled(!enabled)} 
      />
      <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);

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
        const s = await getGlobalRevenueSettings();
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
      const success = await saveGlobalRevenueSettings(payload);
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
            <h2 className="section-header-title flex items-center">
              <Sliders className="w-6 h-6 mr-3 text-emerald-400" /> Revenue Settings (Owner)
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
      <div className="section-header flex-col md:flex-row gap-4 mb-8">
        <div>
          <h2 className="section-header-title flex items-center">
            <Sliders className="w-6 h-6 mr-3 text-emerald-400" /> Revenue Settings (Owner)
          </h2>
          <p className="section-header-subtitle">Configure global monetization parameters and limits.</p>
        </div>
        <button 
          onClick={handleSave}
          className="btn-premium px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Settings */}
        <div className="card-premium bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 space-y-6">
          <div className="section-header border-b border-slate-700/50 pb-4 mb-0">
            <h3 className="section-header-title flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-400" /> Monetization Modes
            </h3>
          </div>
          <ToggleSwitch 
            label="Enable Premium Subscriptions" 
            enabled={premiumModeEnabled} 
            setEnabled={setPremiumModeEnabled} 
          />
          <ToggleSwitch 
            label="Enable Pay-Per-Bill Model" 
            enabled={payPerBillEnabled} 
            setEnabled={setPayPerBillEnabled} 
          />
        </div>

        {/* UPI Payments */}
        <div className="card-premium bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 space-y-5">
          <div className="section-header border-b border-slate-700/50 pb-4 mb-0">
            <h3 className="section-header-title flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-purple-400" /> UPI Payment Details
            </h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform UPI ID</label>
            <input 
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payee Name</label>
            <input 
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Business Limits */}
        <div className="card-premium bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 lg:col-span-2 space-y-6">
          <div className="section-header border-b border-slate-700/50 pb-4 mb-0">
            <h3 className="section-header-title flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-400" /> Pricing & Lock Parameters
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Free Bill Limit</label>
              <input 
                type="number" 
                value={freeBillLimit}
                onChange={(e) => setFreeBillLimit(e.target.value)}
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Flat Charge Per Bill (₹)</label>
              <input 
                type="number" 
                value={chargePerBill}
                onChange={(e) => setChargePerBill(e.target.value)}
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Percentage Charge (%)</label>
              <input 
                type="number" 
                value={percentageChargeSetting}
                onChange={(e) => setPercentageChargeSetting(e.target.value)}
                placeholder="e.g. 1% of bill value (Overrides flat charge)"
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grace Bills Count</label>
              <input 
                type="number" 
                value={monthlyGraceLimit}
                onChange={(e) => setMonthlyGraceLimit(e.target.value)}
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Pending Dues (₹)</label>
              <input 
                type="number" 
                value={maxPendingDue}
                onChange={(e) => setMaxPendingDue(e.target.value)}
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Unpaid Bills Count</label>
              <input 
                type="number" 
                value={maxUnpaidBillCount}
                onChange={(e) => setMaxUnpaidBillCount(e.target.value)}
                className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lock Behavior After Limit Exceeded</label>
            <select
              value={lockBehavior}
              onChange={(e) => setLockBehavior(e.target.value)}
              className="input-premium w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="bill_creation">Lock New Bill Creation Only</option>
              <option value="none">No Lock (Warning Only)</option>
            </select>
          </div>
        </div>

        {/* Info Control */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 lg:col-span-2 flex items-start space-x-4">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-bold text-sm">Security & Enforcement Note</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              When lock enforcement is active, users exceeding their free bill limit, unpaid count, or max dues threshold will be restricted from saving new invoices. However, login, existing invoice viewing, downloads, and backups will remain fully operational.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default GlobalSettings;
