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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-theme-primary flex items-center gap-3">
            Owner Command Center
            <Crown className="w-6 h-6 text-theme-accent" />
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Authoritative platform governance, telemetry metrics, and multi-tenant financial health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStats} leftIcon={RefreshCw}>
            Refresh Telemetry
          </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              const isUnavailable = kpi.value === 'Data unavailable';
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-theme-surface/50 border border-theme-border-soft hover:border-theme-accent/20 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-theme-muted">{kpi.label}</span>
                    <div className="p-2 rounded-xl bg-theme-surface-elevated border border-theme-border-soft">
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-black tracking-tight ${isUnavailable ? 'text-sm text-theme-muted font-bold' : 'text-theme-primary'}`}>
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
