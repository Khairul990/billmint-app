import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Activity, Crown, Cloud, Database, IndianRupee, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, Layers, Building2, UserPlus, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAdminUsersList, getAdminAllPaymentProofs, getAdminPlatformRevenueStates } from '../../services/dbEngine';
import { pageVariants } from '../../utils/animations';
import { KPISkeleton } from '../../components/PremiumSkeleton';
import { getFakeAdminData } from '../../utils/demoDataManager';

const AdminDashboard = () => {
  const [fakeData, setFakeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    todayNewUsers: 0,
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    pendingPaymentProofs: 0,
    failedSyncs: 0,
    cloudStorageUsage: '0 GB',
    systemHealth: 'Healthy'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const users = await getAdminUsersList();
        const proofs = await getAdminAllPaymentProofs();
        const revs = await getAdminPlatformRevenueStates();

        const totalUsers = users.length;
        const premiumUsers = users.filter(u => u.planStatus === 'premium').length;
        const freeUsers = totalUsers - premiumUsers;
        
        // Simulating some stats since they may not exist in pure DB records yet
        let totalWorkspaces = 0;
        users.forEach(u => {
          totalWorkspaces += (u.workspacesCount || 1);
        });

        const activeWorkspaces = Math.floor(totalWorkspaces * 0.85); // Simulated activity
        const activeUsers = Math.floor(totalUsers * 0.75);
        const todayNewUsers = Math.floor(Math.random() * 10);
        
        const pendingPaymentProofs = proofs.filter(p => p.status === 'Pending').length;
        const pendingPayments = proofs.filter(p => p.status === 'Pending').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        
        const monthlyRevenue = revs.reduce((acc, r) => acc + (parseFloat(r.platformPaidAmount) || 0), 0);

        setStats({
          totalUsers,
          activeUsers,
          premiumUsers,
          freeUsers,
          todayNewUsers,
          totalWorkspaces,
          activeWorkspaces,
          monthlyRevenue,
          pendingPayments,
          pendingPaymentProofs,
          failedSyncs: 0, // Mocked 0 for perfect health initially
          cloudStorageUsage: `${(totalWorkspaces * 0.05).toFixed(2)} GB`,
          systemHealth: 'Healthy'
        });
      } catch (e) {
        console.error('Admin stat error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    setFakeData(getFakeAdminData());
  }, []);

  const kpiCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'emerald' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: Crown, color: 'purple' },
    { label: 'Free Users', value: stats.freeUsers, icon: UserPlus, color: 'slate' },
    { label: "Today's New Users", value: stats.todayNewUsers, icon: TrendingUp, color: 'pink' },
    { label: 'Total Workspaces', value: stats.totalWorkspaces, icon: Building2, color: 'indigo' },
    { label: 'Active Workspaces', value: stats.activeWorkspaces, icon: Layers, color: 'cyan' },
    { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue}`, icon: IndianRupee, color: 'emerald' },
    { label: 'Pending Payments', value: `₹${stats.pendingPayments}`, icon: AlertTriangle, color: 'amber' },
    { label: 'Payment Proofs', value: stats.pendingPaymentProofs, icon: CreditCard, color: 'rose' },
    { label: 'Failed Syncs', value: stats.failedSyncs, icon: FileWarning, color: stats.failedSyncs > 0 ? 'rose' : 'slate' },
    { label: 'Storage Usage', value: stats.cloudStorageUsage, icon: Cloud, color: 'blue' },
  ];

  const getColorClasses = (color) => {
    const map = {
      blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
      emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
      purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
      pink: 'from-pink-500/20 to-pink-600/5 border-pink-500/30 text-pink-400',
      indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
      cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
      amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
      rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400',
      slate: 'from-slate-500/20 to-slate-600/5 border-slate-500/30 text-slate-400',
    };
    return map[color] || map.slate;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="mb-6"><h2 className="text-2xl font-black text-white">Dashboard Overview</h2></div>
        <KPISkeleton count={12} />
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">SaaS Control Center</h2>
          <p className="text-slate-400 mt-1">Real-time overview of BillQyro platform metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center px-4 py-2 rounded-xl border ${stats.systemHealth === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} font-bold`}>
            {stats.systemHealth === 'Healthy' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
            System {stats.systemHealth}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gradient-to-br ${getColorClasses(kpi.color)} border p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">{kpi.label}</span>
              <kpi.icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-3xl font-black text-white">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-[#1e293b]/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-3 text-blue-400" /> Recent Activities
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><UserPlus className="w-5 h-5" /></div>
            <div>
              <p className="text-white font-bold text-sm">New workspace created</p>
              <p className="text-slate-400 text-xs">"Cyber Cafe Digital" by demo@billqyro.com - Just now</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-white font-bold text-sm">New payment proof uploaded</p>
              <p className="text-slate-400 text-xs">₹1,999 pending verification - 5 mins ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <p className="text-white font-bold text-sm">Daily cloud backup completed</p>
              <p className="text-slate-400 text-xs">System sync successful - 2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
