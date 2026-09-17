import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Users, Crown, IndianRupee, Building2, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminEngine } from '../../services/adminEngine';

/* Simple animated bar chart (theme-aware) */
const SimpleBarChart = ({ data, color, height = "200px" }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 w-full pt-4" style={{ height }}>
      {data.map((d, i) => {
        const h = `${(d.value / max) * 100}%`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            <div className="w-full relative rounded-t-sm" style={{ height: '100%', backgroundColor: 'var(--surface-hover)' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                className="absolute bottom-0 left-0 right-0 rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: color }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-theme-primary opacity-0 group-hover:opacity-100 transition-opacity font-numbers whitespace-nowrap">
                {d.value.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-theme-muted font-bold truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Build last-N-month buckets with a real value extractor */
const buildMonthlySeries = (rows, n, extract) => {
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], value: 0 });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  for (const row of rows) {
    const t = extract(row);
    if (!t) continue;
    const d = new Date(t);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in index) buckets[index[key]].value += 1;
  }
  return buckets;
};

/* Sum-based monthly buckets (e.g. approved payment amounts) */
const buildMonthlySum = (rows, n, extract, amountOf) => {
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], value: 0 });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  for (const row of rows) {
    const t = extract(row);
    if (!t) continue;
    const d = new Date(t);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in index) buckets[index[key]].value += amountOf(row);
  }
  return buckets;
};

const pctChange = (series) => {
  if (series.length < 2) return null;
  const curr = series[series.length - 1].value;
  const prev = series[series.length - 2].value;
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
};

const TrendBadge = ({ series }) => {
  const change = pctChange(series);
  if (change === null) {
    return <div className="mt-4 flex items-center text-xs font-bold text-theme-muted">No comparison data yet</div>;
  }
  const up = change >= 0;
  return (
    <div className={`mt-4 flex items-center text-xs font-bold ${up ? 'text-theme-success' : 'text-theme-danger'}`}>
      {up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
      {up ? '+' : ''}{change}% vs last month
    </div>
  );
};

const AnalyticsCenter = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, platformRevenue: 0, activeWorkspaces: 0, openTickets: 0 });
  const [userSeries, setUserSeries] = useState([]);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, revenueStates, proofs, premiumRequests, tickets] = await Promise.all([
        adminEngine.getUsersList().catch(() => []),
        adminEngine.getRevenueStates().catch(() => []),
        adminEngine.getPaymentProofs().catch(() => []),
        adminEngine.getPremiumRequests().catch(() => []),
        adminEngine.getSupportTickets().catch(() => [])
      ]);

      const userList = Array.isArray(users) ? users : [];
      const revList = Array.isArray(revenueStates) ? revenueStates : [];
      const proofList = Array.isArray(proofs) ? proofs : [];
      const premiumList = Array.isArray(premiumRequests) ? premiumRequests : [];
      const ticketList = Array.isArray(tickets) ? tickets : [];

      const platformRevenue = revList.reduce((acc, r) => acc + (parseFloat(r.platformPaidAmount) || 0), 0);
      const premiumUsers = userList.filter(u => u.planStatus === 'premium' || u.planStatus === 'pro').length;

      // Real series: user registrations per month (last 6 months)
      const uSeries = buildMonthlySeries(userList, 6, (u) => u.createdAt);
      // Real series: approved/settled money per month (dues proofs + premium requests)
      const settledRows = [
        ...proofList.filter(p => p.status === 'Approved' || p.status === 'Verified').map(p => ({ at: p.createdAt, amt: parseFloat(p.amount) || 0 })),
        ...premiumList.filter(p => p.status === 'Approved').map(p => ({ at: p.createdAt, amt: parseFloat(p.paidAmount || p.amount) || 0 }))
      ];
      const rSeries = buildMonthlySum(settledRows, 6, (r) => r.at, (r) => r.amt);

      setUserSeries(uSeries);
      setRevenueSeries(rSeries);
      setStats({
        totalUsers: userList.length,
        premiumUsers,
        platformRevenue,
        activeWorkspaces: userList.reduce((acc, u) => acc + (u.workspacesCount || 1), 0),
        openTickets: ticketList.filter(t => (t.status || 'Open').toLowerCase() === 'open').length
      });
    } catch (e) {
      console.error(e);
      setError('Unable to load analytics right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = [
    {
      label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, tone: 'accent',
      series: userSeries
    },
    {
      label: 'Premium Subs', value: stats.premiumUsers.toLocaleString(), icon: Crown, tone: 'warning',
      hint: `${stats.totalUsers ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% of all users`
    },
    {
      label: 'Platform Revenue', value: `₹${stats.platformRevenue.toLocaleString()}`, icon: IndianRupee, tone: 'accent',
      series: revenueSeries
    },
    {
      label: 'Active Workspaces', value: stats.activeWorkspaces.toLocaleString(), icon: Building2, tone: 'info',
      hint: `${stats.openTickets} open support ticket${stats.openTickets === 1 ? '' : 's'}`
    }
  ];

  const toneMap = {
    accent: { bar: 'bg-theme-accent/10', icon: 'text-theme-accent', top: 'bg-theme-accent', chart: 'var(--accent)' },
    warning: { bar: 'bg-theme-warning/10', icon: 'text-theme-warning', top: 'bg-theme-warning', chart: 'var(--status-warning, #F59E0B)' },
    info: { bar: 'bg-theme-info/10', icon: 'text-theme-info', top: 'bg-theme-info', chart: 'var(--accent)' }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <BarChart3 className="w-7 h-7 mr-3 text-theme-accent" /> Analytics Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Real platform growth, revenue and usage — computed live from Firestore.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} leftIcon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-theme-danger/10 border border-theme-danger/20 text-xs font-bold text-theme-danger">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const tone = toneMap[kpi.tone] || toneMap.accent;
          return (
            <Card key={kpi.label} className="border-transparent relative overflow-hidden bg-theme-surface-elevated">
              <div className={`absolute top-0 left-0 right-0 h-1 ${tone.top}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black text-theme-primary font-numbers">{kpi.value}</h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${tone.bar} flex items-center justify-center ${tone.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                {kpi.series ? (
                  <TrendBadge series={kpi.series} />
                ) : (
                  <div className="mt-4 flex items-center text-xs font-bold text-theme-muted">{kpi.hint}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-theme-accent" /> New User Registrations
                </h3>
                <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Last 6 months — real signup dates</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-xs font-bold text-theme-muted">Loading…</div>
            ) : (
              <SimpleBarChart data={userSeries} color="var(--accent)" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-theme-accent" /> Settled Payments
                </h3>
                <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Approved proofs + premium payments, last 6 months</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-xs font-bold text-theme-muted">Loading…</div>
            ) : (
              <SimpleBarChart data={revenueSeries} color="var(--status-success, #10B981)" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insight strip */}
      <div className="p-5 rounded-2xl bg-theme-surface/50 border border-theme-border-soft flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-theme-accent/10 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-theme-accent" />
        </div>
        <div className="text-xs text-theme-secondary font-semibold leading-relaxed">
          <span className="font-black text-theme-primary">How these numbers are computed: </span>
          user growth from real account creation dates; revenue from payment proofs you approved (dues and premium requests);
          premium share from live plan status. Nothing on this page is simulated.
        </div>
      </div>
    </motion.div>
  );
};

export default memo(AnalyticsCenter);
