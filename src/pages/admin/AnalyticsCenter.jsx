import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, CreditCard, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getAdminUsersList, getAdminPlatformRevenueStates } from '../../services/dbEngine';

const SimpleBarChart = ({ data, color, height = "200px" }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 w-full pt-4" style={{ height }}>
      {data.map((d, i) => {
        const h = `${(d.value / max) * 100}%`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full relative rounded-t-sm" style={{ height: '100%', backgroundColor: 'var(--surface-hover)' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                className="absolute bottom-0 left-0 right-0 rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] text-theme-muted font-bold truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const AnalyticsCenter = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    activeWorkspaces: 0
  });

  // Mock historical data for visual presentation
  const mockRevenueData = [
    { label: 'Jan', value: 12000 }, { label: 'Feb', value: 19000 }, { label: 'Mar', value: 15000 },
    { label: 'Apr', value: 22000 }, { label: 'May', value: 28000 }, { label: 'Jun', value: 32000 },
    { label: 'Jul', value: 38000 }
  ];

  const mockUserGrowthData = [
    { label: 'Jan', value: 40 }, { label: 'Feb', value: 65 }, { label: 'Mar', value: 95 },
    { label: 'Apr', value: 120 }, { label: 'May', value: 160 }, { label: 'Jun', value: 210 },
    { label: 'Jul', value: 285 }
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const users = await getAdminUsersList();
        const revenue = await getAdminPlatformRevenueStates();
        
        let totalRev = 0;
        revenue.forEach(r => totalRev += (r.totalBillsCreated || 0) * 1); // Mock calculation
        
        setStats({
          totalUsers: users.length,
          premiumUsers: users.filter(u => u.planStatus === 'premium').length,
          totalRevenue: totalRev,
          activeWorkspaces: users.reduce((acc, u) => acc + (u.workspacesCount || 1), 0)
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-theme-accent" /> Analytics Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Platform growth, revenue, and usage analytics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-transparent relative overflow-hidden bg-theme-surface-elevated">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-accent"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Total Users</p>
                <h3 className="text-3xl font-black text-theme-primary">{stats.totalUsers}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-theme-success">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% this month
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent relative overflow-hidden bg-theme-surface-elevated">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-warning"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Premium Subs</p>
                <h3 className="text-3xl font-black text-theme-primary">{stats.premiumUsers}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-theme-warning/10 flex items-center justify-center text-theme-warning">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-theme-success">
              <TrendingUp className="w-3 h-3 mr-1" /> +5% this month
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent relative overflow-hidden bg-theme-surface-elevated">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-success"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Platform Revenue</p>
                <h3 className="text-3xl font-black text-theme-primary">₹{stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-theme-success/10 flex items-center justify-center text-theme-success">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-theme-success">
              <TrendingUp className="w-3 h-3 mr-1" /> +24% this month
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent relative overflow-hidden bg-theme-surface-elevated">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-primary"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Active Workspaces</p>
                <h3 className="text-3xl font-black text-theme-primary">{stats.activeWorkspaces}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center text-theme-primary border border-theme-border-soft">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-theme-success">
              <TrendingUp className="w-3 h-3 mr-1" /> Steady Growth
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-xs text-theme-secondary">Monthly platform revenue trends (INR)</p>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={mockRevenueData} color="var(--success)" height="250px" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <p className="text-xs text-theme-secondary">New user signups over time</p>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={mockUserGrowthData} color="var(--accent)" height="250px" />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default memo(AnalyticsCenter);
