import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const SecurityCenter = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const l = JSON.parse(localStorage.getItem('billqyro_admin_security_logs') || '[]');
    setLogs(l);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-3 text-rose-500" /> Security Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review login attempts, blocks, and access logs.</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Admin Access Logs</h3>
        <div className="space-y-3">
          {logs.length > 0 ? logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-700">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-rose-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-white font-bold text-sm">{log.type}</p>
                  <p className="text-slate-400 text-xs mt-1">{log.details}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No recent security alerts.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityCenter;
