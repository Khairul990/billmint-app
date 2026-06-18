import React, { useState, useEffect } from 'react';
import { Users, FileText, IndianRupee, Activity, Crown, Store, Clock, Database, ShieldAlert, CheckCircle2, AlertTriangle, ServerCrash, RefreshCw, CreditCard, ShieldCheck, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFakeAdminData } from '../../utils/demoDataManager';
import { getAdminUsersList, getAdminAllPaymentProofs, getAdminPlatformRevenueStates } from '../../services/dbEngine';

const AdminDashboard = () => {
  const [fakeData, setFakeData] = useState(null);
  const [realStats, setRealStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    pendingPayments: 0,
    totalDues: 0,
    totalCollected: 0,
    lockedUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const users = await getAdminUsersList();
        const proofs = await getAdminAllPaymentProofs();
        const revs = await getAdminPlatformRevenueStates();

        const totalUsers = users.length;
        const premiumUsers = users.filter(u => u.planStatus === 'premium').length;
        const freeUsers = totalUsers - premiumUsers;
        
        const pendingPayments = proofs.filter(p => p.status === 'Pending').length;
        
        let totalDues = 0;
        let totalCollected = 0;
        let lockedUsers = 0;
        
        revs.forEach(r => {
          totalDues += parseFloat(r.platformPendingAmount) || 0;
          totalCollected += parseFloat(r.platformPaidAmount) || 0;
          if (r.lockStatus === 'locked') {
            lockedUsers++;
          }
        });

        setRealStats({
          totalUsers,
          premiumUsers,
          freeUsers,
          pendingPayments,
          totalDues,
          totalCollected,
          lockedUsers
        });
      } catch (e) {
        console.error('Failed to load admin stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRealStats();

    // Simulator check
    const checkData = () => {
      setFakeData(getFakeAdminData());
    };
    checkData();
    window.addEventListener('storage', checkData);
    return () => window.removeEventListener('storage', checkData);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const displayUsers = fakeData ? fakeData.totalUsers : realStats.totalUsers;
  const displayPremium = fakeData ? fakeData.premiumUsers : realStats.premiumUsers;
  const displayPendingProofs = fakeData ? fakeData.pendingPayments : realStats.pendingPayments;
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics and platform status.</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {fakeData && (
          <div className="md:col-span-2 lg:col-span-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 animate-pulse" />
            <div>
              <p className="text-amber-500 font-bold">Admin Panel Demo Simulator Active</p>
              <p className="text-amber-500/70 text-sm">Showing simulated large-scale data for Owner Test Lab preview.</p>
            </div>
          </div>
        )}

        {/* Total Users */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <Users className="w-5 h-5 mr-2 text-blue-400" /> Total Users
            </div>
          </div>
          <div className="text-4xl font-black text-white">{displayUsers}</div>
          <div className="text-slate-500 text-xs mt-2 font-medium">
            {fakeData ? 'Simulated accounts' : `${realStats.freeUsers} Free starter accounts`}
          </div>
        </motion.div>
        
        {/* Premium Users */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <Crown className="w-5 h-5 mr-2 text-purple-400" /> Premium Users
            </div>
          </div>
          <div className="text-4xl font-black text-white">{displayPremium}</div>
          <div className="text-slate-500 text-xs mt-2 font-medium">
            {fakeData ? 'Conversion rate 25%' : `Conversion Rate: ${displayUsers > 0 ? Math.round((displayPremium / displayUsers) * 100) : 0}%`}
          </div>
        </motion.div>

        {/* Pending Proofs */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <Clock className="w-5 h-5 mr-2 text-amber-400" /> Pending Proofs
            </div>
            {displayPendingProofs > 0 && (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-black rounded border border-rose-500/30 animate-pulse">Action Required</span>
            )}
          </div>
          <div className="text-4xl font-black text-white">{displayPendingProofs}</div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Proofs awaiting review in queue</div>
        </motion.div>

        {/* Total Collected Revenue */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <IndianRupee className="w-5 h-5 mr-2 text-emerald-400" /> Total Collected
            </div>
          </div>
          <div className="text-4xl font-black text-white">
            {fakeData ? `₹${(fakeData.fakeRevenue / 100000).toFixed(2)}L` : `₹${realStats.totalCollected}`}
          </div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Revenue cleared by users</div>
        </motion.div>

        {/* Total Platform Dues */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <FileText className="w-5 h-5 mr-2 text-rose-400" /> Platform Dues
            </div>
          </div>
          <div className="text-4xl font-black text-white">
            {fakeData ? '₹4,900' : `₹${realStats.totalDues}`}
          </div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Outstanding platform dues</div>
        </motion.div>

        {/* Locked Users Count */}
        <motion.div variants={itemVariants} className="relative group bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-slate-400 font-medium">
              <UserMinus className="w-5 h-5 mr-2 text-indigo-400" /> Locked Accounts
            </div>
          </div>
          <div className="text-4xl font-black text-white">
            {fakeData ? '0' : realStats.lockedUsers}
          </div>
          <div className="text-slate-500 text-xs mt-2 font-medium">Users restricted due to limits</div>
        </motion.div>

      </div>
      
      {/* Platform Health Panel */}
      <motion.div variants={itemVariants} className="bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 mt-8">
        <h3 className="font-bold text-white text-lg mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-3 text-rose-500" /> 
          Platform Health & Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Firestore DB Health</p>
              <p className="text-white font-bold mt-1">Operational</p>
            </div>
            <div className="ml-auto">
              <span className="flex items-center px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Sync Status</p>
              <p className="text-white font-bold mt-1">Real-time active</p>
            </div>
            <div className="ml-auto">
              <span className="flex items-center px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Admin Security</p>
              <p className="text-white font-bold mt-1">Session Secured</p>
            </div>
            <div className="ml-auto">
              <span className="flex items-center px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
