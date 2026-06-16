import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const AppHealthCenter = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Activity className="w-6 h-6 mr-3 text-emerald-500" /> App Health Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Monitor system metrics and platform stability.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Users', value: '1,245', status: 'healthy' },
          { label: 'Online Users', value: '89', status: 'healthy' },
          { label: 'Invoices Today', value: '432', status: 'healthy' },
          { label: 'Sync Status', value: '99.9%', status: 'healthy' },
          { label: 'Storage Health', value: '45% Used', status: 'warning' },
          { label: 'Error Logs', value: '12', status: 'warning' }
        ].map((item, i) => (
          <div key={i} className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 flex flex-col">
            <span className="text-slate-400 text-sm font-bold uppercase mb-2">{item.label}</span>
            <span className="text-3xl font-black text-white mb-4">{item.value}</span>
            <div className={`mt-auto flex items-center text-xs font-bold ${item.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {item.status === 'healthy' ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
              {item.status === 'healthy' ? 'Healthy' : 'Action Needed'}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AppHealthCenter;
