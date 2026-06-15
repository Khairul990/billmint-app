import React from 'react';
import { Users, FileText, IndianRupee, Activity, Crown } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center text-slate-400 mb-4">
            <Users className="w-5 h-5 mr-2" /> Total Users
          </div>
          <div className="text-3xl font-black text-white">1,248</div>
          <div className="text-emerald-400 text-xs mt-2 font-bold">+12 this week</div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center text-slate-400 mb-4">
            <FileText className="w-5 h-5 mr-2" /> Total Invoices
          </div>
          <div className="text-3xl font-black text-white">45,902</div>
          <div className="text-emerald-400 text-xs mt-2 font-bold">+850 today</div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center text-slate-400 mb-4">
            <Crown className="w-5 h-5 mr-2" /> Premium Users
          </div>
          <div className="text-3xl font-black text-white">312</div>
          <div className="text-emerald-400 text-xs mt-2 font-bold">+5 this week</div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center text-slate-400 mb-4">
            <IndianRupee className="w-5 h-5 mr-2" /> Total Revenue
          </div>
          <div className="text-3xl font-black text-white">₹1,56,000</div>
          <div className="text-slate-500 text-xs mt-2 font-bold">Estimated</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-64">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-rose-500" /> Platform Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Database Sync Status</span>
              <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">Healthy</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Offline Queue</span>
              <span className="text-slate-300 font-bold">0 Pending</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Active Users Today</span>
              <span className="text-slate-300 font-bold">423</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
