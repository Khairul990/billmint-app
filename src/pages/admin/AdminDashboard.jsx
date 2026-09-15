import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, Activity, Crown, Cloud, IndianRupee,
  ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, Layers, Building2,
  UserPlus, FileWarning, Database, Zap, RefreshCw, Power, ServerCrash
} from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { pageVariants } from '../../utils/animations';
import { KPISkeleton } from '../../components/PremiumSkeleton';
import { toast } from 'react-hot-toast';
import { BillQyroDB } from '../../services/localDb.js';
import { Button } from '../../components/ui/Button.jsx';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: null,
    activeUsers: null,
    premiumUsers: null,
    freeUsers: null,
    totalWorkspaces: null,
    activeWorkspaces: null,
    totalInvoices: null,
    totalCustomers: null,
    totalProducts: null,
    monthlyRevenue: null,
    pendingPayments: null,
    failedSyncs: null,
    cloudStorageUsage: null,
    systemHealth: null
  });
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [users, proofs, revs, extraStats, telemetry, workspaces] = await Promise.all([
        adminEngine.getUsersList().catch(() => null),
        adminEngine.getPaymentProofs().catch(() => null),
        adminEngine.getRevenueStates().catch(() => null),
        adminEngine.getTotalStats().catch(() => null),
        adminEngine.getSystemTelemetry().catch(() => null),
        adminEngine.getWorkspaces().catch(() => null)
      ]);

      const isUsersValid = Array.isArray(users);
      const totalUsers = isUsersValid ? users.length : null;
      const premiumUsers = isUsersValid ? users.filter(u => u.planStatus === 'premium' || u.planStatus === 'pro').length : null;
      const freeUsers = isUsersValid ? users.filter(u => u.planStatus === 'free' || !u.planStatus).length : null;
      const activeUsers = isUsersValid ? users.filter(u => !u.blocked).length : null;

      const isWorkspacesValid = Array.isArray(workspaces);
      const totalWorkspaces = isWorkspacesValid ? workspaces.length : (isUsersValid ? users.reduce((acc, u) => acc + (u.workspacesCount || 1), 0) : null);
      const activeWorkspaces = isWorkspacesValid ? workspaces.length : totalWorkspaces;

      const isProofsValid = Array.isArray(proofs);
      const pendingPayments = isProofsValid
        ? proofs.filter(p => p.status === 'Pending').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)
        : null;

      const isRevsValid = Array.isArray(revs);
      const monthlyRevenue = isRevsValid
        ? revs.reduce((acc, r) => acc + (parseFloat(r.platformPaidAmount) || 0), 0)
        : null;

      const activities = [];
      if (isUsersValid) {
        const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
        sortedUsers.forEach(u => {
          activities.push({
            id: `usr_${u.userId || u.id}`,
            type: 'user',
            title: 'User Registered',
            desc: `${u.email || u.businessName} created an account.`,
            date: new Date(u.createdAt || Date.now()),
            icon: UserPlus,
            color: 'text-emerald-500 bg-emerald-500/10'
          });
        });
      }

      if (isProofsValid) {
        const sortedProofs = [...proofs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
        sortedProofs.forEach(p => {
          activities.push({
            id: `prf_${p.id}`,
            type: 'payment',
            title: 'Payment Proof Uploaded',
            desc: `₹${p.amount} submitted by ${p.userEmail || 'tenant'}.`,
            date: new Date(p.createdAt || Date.now()),
            icon: CreditCard,
            color: 'text-theme-accent bg-theme-accent/10'
          });
        });
      }

      activities.sort((a, b) => b.date - a.date);
      setRecentActivities(activities.slice(0, 6));

      setStats({
        totalUsers,
        activeUsers,
        premiumUsers,
        freeUsers,
        totalWorkspaces,
        activeWorkspaces,
        monthlyRevenue,
        pendingPayments,
        failedSyncs: telemetry?.pendingSyncQueue ?? 0,
        cloudStorageUsage: telemetry?.storageEstimate?.usageMB ? `${telemetry.storageEstimate.usageMB} MB` : (totalWorkspaces !== null ? `${(totalWorkspaces * 0.05).toFixed(2)} GB` : null),
        systemHealth: telemetry?.firebaseConnected ? 'Healthy' : (telemetry?.online ? 'Warning' : 'Critical'),
        totalInvoices: extraStats?.invoices ?? null,
        totalCustomers: extraStats?.customers ?? null,
        totalProducts: extraStats?.products ?? null
      });
    } catch (e) {
      console.error('Admin stat error:', e);
      setErrorState('Unable to query cloud telemetry metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatValue = (val, prefix = '') => {
    if (val === null || val === undefined) return 'Data unavailable';
    if (typeof val === 'number') return `${prefix}${val.toLocaleString()}`;
    return `${prefix}${val}`;
  };

  const kpis = [
    { label: 'Total Users', value: formatValue(stats.totalUsers), icon: Users, color: 'text-theme-accent' },
    { label: 'Active Users', value: formatValue(stats.activeUsers), icon: UserPlus, color: 'text-emerald-500' },
    { label: 'Premium Users', value: formatValue(stats.premiumUsers), icon: Crown, color: 'text-theme-accent' },
    { label: 'Free Users', value: formatValue(stats.freeUsers), icon: Users, color: 'text-theme-muted' },
    { label: 'Total Workspaces', value: formatValue(stats.totalWorkspaces), icon: Building2, color: 'text-theme-accent' },
    { label: 'Active Workspaces', value: formatValue(stats.activeWorkspaces), icon: Building2, color: 'text-emerald-500' },
    { label: 'Total Invoices', value: formatValue(stats.totalInvoices), icon: Layers, color: 'text-theme-accent' },
    { label: 'Total Customers', value: formatValue(stats.totalCustomers), icon: Users, color: 'text-theme-accent' },
    { label: 'Total Products', value: formatValue(stats.totalProducts), icon: Database, color: 'text-theme-accent' },
    { label: 'Platform Revenue', value: stats.monthlyRevenue !== null ? `₹${stats.monthlyRevenue.toLocaleString()}` : 'Data unavailable', icon: IndianRupee, color: 'text-emerald-500' },
    { label: 'Pending Payments', value: stats.pendingPayments !== null ? `₹${stats.pendingPayments.toLocaleString()}` : 'Data unavailable', icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Pending Sync Queue', value: formatValue(stats.failedSyncs), icon: FileWarning, color: stats.failedSyncs > 0 ? 'text-amber-500' : 'text-emerald-500' },
    { label: 'Storage Footprint', value: formatValue(stats.cloudStorageUsage), icon: Cloud, color: 'text-cyan-500' },
    { label: 'System Health', value: stats.systemHealth || 'Data unavailable', icon: Activity, color: stats.systemHealth === 'Healthy' ? 'text-emerald-500' : 'text-amber-500' }
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8 pb-32">
      {/* Premium Command Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-theme-accent/20 bg-gradient-to-br from-theme-surface-elevated via-theme-surface to-theme-surface p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/60 to-transparent" />
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-theme-accent/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-accent">Owner Command Center</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stats.systemHealth === 'Healthy'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stats.systemHealth === 'Healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                {stats.systemHealth || 'Standby'}
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-theme-primary flex items-center gap-3">
              Platform Governance
              <Crown className="w-6 h-6 text-theme-accent" />
            </h2>
            <p className="text-sm text-theme-secondary mt-1 max-w-xl">
              Authoritative platform governance, telemetry metrics, and multi-tenant financial health.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchStats} leftIcon={RefreshCw}>
              Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Banner highlight strip */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-theme-border-soft/60">
          {[
            { label: 'Platform Revenue', value: stats.monthlyRevenue !== null ? `₹${stats.monthlyRevenue.toLocaleString()}` : '—', icon: IndianRupee, tone: 'text-emerald-500' },
            { label: 'Total Users', value: stats.totalUsers !== null ? stats.totalUsers.toLocaleString() : '—', icon: Users, tone: 'text-theme-accent' },
            { label: 'Pending Payouts', value: stats.pendingPayments !== null ? `₹${stats.pendingPayments.toLocaleString()}` : '—', icon: AlertTriangle, tone: 'text-amber-500' },
            { label: 'Sync Queue', value: stats.failedSyncs !== null ? stats.failedSyncs : '—', icon: RefreshCw, tone: stats.failedSyncs > 0 ? 'text-amber-500' : 'text-emerald-500' }
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-theme-app/40 border border-theme-border-soft/60 px-4 py-3">
                <SIcon className={`w-4 h-4 ${s.tone} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted truncate">{s.label}</p>
                  <p className="text-lg font-black text-theme-primary tracking-tight truncate">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <KPISkeleton count={14} />
        </div>
      ) : errorState ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <ServerCrash className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-rose-500">Telemetry Query Error</h3>
          <p className="text-xs text-rose-400 font-medium">{errorState}</p>
          <Button onClick={fetchStats} variant="outline" size="sm">Retry</Button>
        </div>
      ) : (
        <>
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              const isUnavailable = kpi.value === 'Data unavailable';
              return (
                <div
                  key={idx}
                  className="group p-4 rounded-xl bg-theme-surface/60 border border-theme-border-soft hover:border-theme-accent/30 hover:bg-theme-accent-light/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">{kpi.label}</span>
                    <div className="p-1.5 rounded-lg bg-theme-surface-elevated border border-theme-border-soft group-hover:border-theme-accent/25 transition-colors">
                      <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className={`text-xl md:text-2xl font-black tracking-tight ${isUnavailable ? 'text-xs text-theme-muted font-bold' : 'text-theme-primary'}`}>
                    {kpi.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Live Activity Stream */}
          <div className="p-6 rounded-2xl bg-theme-surface/50 border border-theme-border-soft space-y-4">
            <h3 className="text-base font-bold text-theme-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-theme-accent" />
              Live Platform Activity Stream
            </h3>
            {recentActivities.length === 0 ? (
              <p className="text-xs text-theme-muted">No recent registration or payment events recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-lg ${act.color} mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-theme-primary truncate">{act.title}</span>
                          <span className="text-[10px] text-theme-muted whitespace-nowrap">{act.date.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-theme-secondary truncate mt-0.5">{act.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default memo(AdminDashboard);
