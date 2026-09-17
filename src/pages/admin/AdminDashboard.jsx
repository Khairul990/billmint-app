import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, Activity, Crown, Cloud, IndianRupee,
  CheckCircle2, TrendingUp, AlertTriangle, Layers, Building2,
  UserPlus, FileWarning, Database, Zap, RefreshCw, Power, ServerCrash,
  Megaphone, ToggleRight, ShieldCheck, HardDrive, ArrowRight, Clock
} from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { pageVariants } from '../../utils/animations';
import { KPISkeleton } from '../../components/PremiumSkeleton';
import { Button } from '../../components/ui/Button.jsx';

const timeAgo = (date) => {
  if (!date) return '';
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const AdminDashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
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
            color: 'text-theme-accent bg-theme-tint-bg'
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
      setLastRefreshed(new Date());
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
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') return `${prefix}${val.toLocaleString()}`;
    return `${prefix}${val}`;
  };

  const isHealthy = stats.systemHealth === 'Healthy';

  /* ── Primary hero metrics ── */
  const primary = [
    {
      label: 'Total Users',
      value: stats.totalUsers !== null ? stats.totalUsers.toLocaleString() : '—',
      icon: Users, tone: 'accent',
      sub: stats.premiumUsers !== null ? `${stats.premiumUsers} premium · ${stats.freeUsers} free` : 'Data unavailable'
    },
    {
      label: 'Platform Revenue',
      value: stats.monthlyRevenue !== null ? `₹${stats.monthlyRevenue.toLocaleString()}` : '—',
      icon: IndianRupee, tone: 'accent',
      sub: 'Lifetime collected across tenants'
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments !== null ? `₹${stats.pendingPayments.toLocaleString()}` : '—',
      icon: AlertTriangle, tone: 'amber',
      sub: 'Awaiting proof approval',
      action: { tab: 'payments', label: 'Review proofs' }
    },
    {
      label: 'System Health',
      value: stats.systemHealth || '—',
      icon: isHealthy ? CheckCircle2 : Power, tone: isHealthy ? 'accent' : 'amber',
      sub: stats.failedSyncs > 0 ? `${stats.failedSyncs} items in sync queue` : 'All queues clear',
      action: { tab: 'health', label: 'Open telemetry' }
    }
  ];

  /* ── Secondary metric groups ── */
  const groups = [
    {
      title: 'Growth & Tenants',
      icon: TrendingUp,
      items: [
        { label: 'Active Users', value: formatValue(stats.activeUsers), icon: UserPlus },
        { label: 'Premium Users', value: formatValue(stats.premiumUsers), icon: Crown },
        { label: 'Free Users', value: formatValue(stats.freeUsers), icon: Users },
        { label: 'Total Workspaces', value: formatValue(stats.totalWorkspaces), icon: Building2 },
        { label: 'Active Workspaces', value: formatValue(stats.activeWorkspaces), icon: Building2 }
      ]
    },
    {
      title: 'Platform Data',
      icon: Layers,
      items: [
        { label: 'Total Invoices', value: formatValue(stats.totalInvoices), icon: Layers },
        { label: 'Total Customers', value: formatValue(stats.totalCustomers), icon: Users },
        { label: 'Total Products', value: formatValue(stats.totalProducts), icon: Database }
      ]
    },
    {
      title: 'System Operations',
      icon: Activity,
      items: [
        { label: 'Pending Sync Queue', value: formatValue(stats.failedSyncs), icon: FileWarning },
        { label: 'Storage Footprint', value: formatValue(stats.cloudStorageUsage), icon: Cloud },
        { label: 'Health', value: stats.systemHealth || '—', icon: isHealthy ? CheckCircle2 : AlertTriangle }
      ]
    }
  ];

  const quickActions = [
    { label: 'Approve Payments', desc: 'Verify UPI proofs', icon: CreditCard, tab: 'payments', tone: 'amber' },
    { label: 'Announcement', desc: 'Broadcast to tenants', icon: Megaphone, tab: 'announcements', tone: 'accent' },
    { label: 'Feature Flags', desc: 'Toggle modules', icon: ToggleRight, tab: 'modules', tone: 'accent' },
    { label: 'Backup', desc: 'Snapshot & restore', icon: HardDrive, tab: 'backup', tone: 'accent' }
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      {/* ── Command banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-theme-accent/20 bg-gradient-to-br from-theme-surface-elevated via-theme-surface to-theme-surface p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/60 to-transparent" />
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-theme-accent/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-accent">Owner Command Center</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isHealthy
                ? 'bg-theme-tint-bg text-theme-accent border-theme-tint-border'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-theme-accent animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                {stats.systemHealth || 'Standby'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-theme-primary flex items-center gap-3">
              Platform Governance
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
            </h2>
            <p className="text-xs sm:text-sm text-theme-secondary mt-1 max-w-xl">
              Authoritative telemetry, multi-tenant financial health and live platform activity.
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchStats} leftIcon={RefreshCw}>
              Refresh Telemetry
            </Button>
            {lastRefreshed && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-theme-muted">
                <Clock className="w-3 h-3" /> Updated {timeAgo(lastRefreshed)}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <KPISkeleton count={8} />
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
          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((qa) => {
              const QIcon = qa.icon;
              return (
                <button
                  key={qa.label}
                  onClick={() => onNavigate && onNavigate(qa.tab)}
                  className="group p-4 rounded-2xl bg-theme-surface/60 border border-theme-border-soft hover:border-theme-accent/35 hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer flex items-center gap-3"
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${qa.tone === 'amber'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-theme-accent/10 text-theme-accent'}`}>
                    <QIcon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-theme-primary truncate">{qa.label}</span>
                    <span className="block text-[10px] font-semibold text-theme-muted truncate">{qa.desc}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-theme-muted group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
                </button>
              );
            })}
          </div>

          {/* ── Primary KPI row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {primary.map((kpi) => {
              const Icon = kpi.icon;
              const unavailable = kpi.value === '—';
              return (
                <div
                  key={kpi.label}
                  className="group relative p-5 rounded-2xl bg-theme-surface/60 border border-theme-border-soft hover:border-theme-accent/30 transition-all duration-200 flex flex-col gap-3 overflow-hidden"
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-theme-accent/5 blur-2xl group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">{kpi.label}</span>
                    <div className={`p-2 rounded-xl ${kpi.tone === 'amber' ? 'bg-amber-500/10' : 'bg-theme-accent/10'}`}>
                      <Icon className={`w-4 h-4 ${kpi.tone === 'amber' ? 'text-amber-500' : 'text-theme-accent'}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-black tracking-tight ${unavailable ? 'text-sm text-theme-muted font-bold self-start' : 'text-theme-primary'} ${typeof kpi.value === 'string' && kpi.value.startsWith('₹') ? 'font-numbers' : ''}`}>
                    {kpi.value}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-theme-muted truncate">{kpi.sub}</span>
                    {kpi.action && onNavigate && (
                      <button
                        onClick={() => onNavigate(kpi.action.tab)}
                        className="shrink-0 text-[10px] font-black text-theme-accent hover:underline underline-offset-2 cursor-pointer"
                      >
                        {kpi.action.label} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Secondary metric groups ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {groups.map((grp) => {
              const GIcon = grp.icon;
              return (
                <div key={grp.title} className="p-5 rounded-2xl bg-theme-surface/50 border border-theme-border-soft space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-theme-primary flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                      <GIcon className="w-3.5 h-3.5 text-theme-accent" />
                    </span>
                    {grp.title}
                  </h3>
                  <div className="space-y-1">
                    {grp.items.map((it) => {
                      const IIcon = it.icon;
                      const unavailable = it.value === '—';
                      return (
                        <div key={it.label} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl hover:bg-theme-surface/70 transition-colors">
                          <span className="flex items-center gap-2 text-[11px] font-bold text-theme-secondary min-w-0">
                            <IIcon className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                            <span className="truncate">{it.label}</span>
                          </span>
                          <span className={`text-xs font-black font-numbers truncate ${unavailable ? 'text-theme-muted font-bold' : 'text-theme-primary'}`}>{it.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Live activity stream ── */}
          <div className="p-5 sm:p-6 rounded-2xl bg-theme-surface/50 border border-theme-border-soft space-y-4">
            <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-theme-accent" />
              Live Platform Activity
              <span className="ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-theme-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" /> Realtime
              </span>
            </h3>
            {recentActivities.length === 0 ? (
              <p className="text-xs text-theme-muted">No recent registration or payment events recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex items-start gap-3 hover:border-theme-accent/25 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${act.color} mt-0.5 shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-theme-primary truncate">{act.title}</span>
                          <span className="text-[10px] font-bold text-theme-muted whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{timeAgo(act.date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-secondary truncate mt-0.5">{act.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security shortcut strip */}
          <button
            onClick={() => onNavigate && onNavigate('security')}
            className="w-full group flex items-center justify-between gap-3 p-4 rounded-2xl bg-theme-surface/50 border border-theme-border-soft hover:border-theme-accent/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-theme-accent/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-theme-accent" />
              </span>
              <span className="text-left min-w-0">
                <span className="block text-xs font-black text-theme-primary">Security & Audit</span>
                <span className="block text-[10px] font-semibold text-theme-muted truncate">Review policies, audit logs and owner controls</span>
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-theme-muted group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </>
      )}
    </motion.div>
  );
};

export default memo(AdminDashboard);
