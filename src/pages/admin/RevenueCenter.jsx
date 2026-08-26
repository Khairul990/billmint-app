import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, CreditCard, TrendingUp, DollarSign, Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const RevenueCenter = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revenueStates, setRevenueStates] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [revenueConfig, setRevenueConfig] = useState({
    chargePerBill: 5,
    freeInvoiceLimit: 15,
    maximumPendingDue: 100,
    platformUpiId: '',
    platformQrUrl: '',
    currency: 'INR'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revs, prfs, conf] = await Promise.all([
        adminEngine.getRevenueStates(),
        adminEngine.getPaymentProofs(),
        adminEngine.getRevenueSettings()
      ]);
      setRevenueStates(revs || []);
      setProofs(prfs || []);
      if (conf) {
        setRevenueConfig(prev => ({ ...prev, ...conf }));
      }
    } catch (e) {
      console.error('Failed to load revenue data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCollected = revenueStates.reduce((acc, r) => acc + (parseFloat(r.platformPaidAmount) || 0), 0);
  const totalPending = revenueStates.reduce((acc, r) => acc + (parseFloat(r.platformPendingAmount) || 0), 0);
  const verifiedProofsCount = proofs.filter(p => p.status === 'Approved' || p.status === 'Verified').length;
  const pendingProofsCount = proofs.filter(p => p.status === 'Pending').length;

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminEngine.saveRevenueSettings(revenueConfig);
      await adminEngine.logAdminAudit({
        action: 'REVENUE_SETTINGS_UPDATED',
        target: 'BILLING_CONFIG',
        result: 'SUCCESS',
        details: `Charge per bill: ₹${revenueConfig.chargePerBill}, Free limit: ${revenueConfig.freeInvoiceLimit}`
      });
      toast.success('Billing & Revenue configurations saved.');
    } catch (e) {
      toast.error('Failed to save configurations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-500" />
            Platform Revenue & Billing Engine
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Real-time platform fee collection telemetry, pending payment proofs, and billing rate parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Total Revenue Collected</span>
            <div className="text-2xl font-black text-emerald-500">₹{totalCollected.toLocaleString()}</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Lifetime verified settlements</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Pending Platform Dues</span>
            <div className="text-2xl font-black text-amber-500">₹{totalPending.toLocaleString()}</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Accrued across active workspaces</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Pending Proofs</span>
            <div className="text-2xl font-black text-rose-500">{pendingProofsCount}</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Awaiting owner verification</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Verified Proofs</span>
            <div className="text-2xl font-black text-theme-accent">{verifiedProofsCount}</div>
            <span className="text-[11px] text-theme-muted mt-1 block">Completed transactions</span>
          </CardContent>
        </Card>
      </div>

      {/* Billing Configuration */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-theme-accent" />
            Platform Billing Parameters
          </CardTitle>
          <p className="text-xs text-theme-secondary">
            Configure usage tiers, charge rates, and platform payment collection destinations.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Free Invoice Limit</label>
              <Input
                type="number"
                value={revenueConfig.freeInvoiceLimit}
                onChange={(e) => setRevenueConfig({ ...revenueConfig, freeInvoiceLimit: parseInt(e.target.value) || 0 })}
                placeholder="15"
              />
              <span className="text-[10px] text-theme-muted">Invoices allowed before charges apply</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Charge Per Additional Bill (₹)</label>
              <Input
                type="number"
                value={revenueConfig.chargePerBill}
                onChange={(e) => setRevenueConfig({ ...revenueConfig, chargePerBill: parseFloat(e.target.value) || 0 })}
                placeholder="5"
              />
              <span className="text-[10px] text-theme-muted">Rate levied per invoice beyond limit</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Maximum Pending Due (₹)</label>
              <Input
                type="number"
                value={revenueConfig.maximumPendingDue}
                onChange={(e) => setRevenueConfig({ ...revenueConfig, maximumPendingDue: parseFloat(e.target.value) || 0 })}
                placeholder="100"
              />
              <span className="text-[10px] text-theme-muted">Threshold before account soft-lock activates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-theme-border-soft">
            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Platform UPI ID</label>
              <Input
                type="text"
                value={revenueConfig.platformUpiId}
                onChange={(e) => setRevenueConfig({ ...revenueConfig, platformUpiId: e.target.value })}
                placeholder="owner@okaxis / billqyro@upi"
              />
              <span className="text-[10px] text-theme-muted">UPI destination shown on payment proof upload screen</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Platform QR Code Image URL</label>
              <Input
                type="text"
                value={revenueConfig.platformQrUrl}
                onChange={(e) => setRevenueConfig({ ...revenueConfig, platformQrUrl: e.target.value })}
                placeholder="https://..."
              />
              <span className="text-[10px] text-theme-muted">Static QR graphic displayed to tenants</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveConfig} disabled={saving} variant="primary" leftIcon={Save}>
              {saving ? 'Saving...' : 'Save Billing Parameters'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueCenter;
