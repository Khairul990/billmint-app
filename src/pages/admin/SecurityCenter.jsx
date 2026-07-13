import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const SecurityCenter = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const l = JSON.parse(localStorage.getItem('billqyro_admin_security_logs') || '[]');
    setLogs(l);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <ShieldCheck className="w-8 h-8 mr-3 text-theme-danger" /> Security Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Review login attempts, blocks, and access logs.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Access Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-theme-surface-hover rounded-xl border border-theme-border-soft gap-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-theme-danger mr-3 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-theme-primary font-bold text-sm">{log.type}</p>
                    <p className="text-theme-secondary text-xs mt-1">{log.details}</p>
                  </div>
                </div>
                <span className="text-xs text-theme-muted font-bold whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-theme-muted">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold">No recent security alerts.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default memo(SecurityCenter);
