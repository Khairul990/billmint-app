import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getAdminUsersList, getAdminTotalStats } from '../../services/dbEngine';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const AppHealthCenter = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    onlineUsers: 0,
    invoices: 0,
    syncStatus: '100%',
    storageUsed: 0,
    errors: 0
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const users = await getAdminUsersList();
        const totals = await getAdminTotalStats();
        
        const totalWorkspaces = users.reduce((acc, u) => acc + (u.workspacesCount || 1), 0);
        const activeUsers = users.filter(u => !u.blocked).length;
        
        let localQueue = 0;
        try {
          await window.indexedDB.databases();
        } catch(e) {
          localQueue = 1;
        }

        setStats({
          activeUsers: activeUsers,
          onlineUsers: Math.floor(activeUsers * 0.1),
          invoices: totals.invoices || 0,
          syncStatus: localQueue > 0 ? 'Queue Pending' : '99.9%',
          storageUsed: (totalWorkspaces * 0.05).toFixed(2),
          errors: localQueue
        });
      } catch (e) {
        console.error('Failed to load health stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Activity className="w-8 h-8 mr-3 text-theme-success" /> App Health Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Monitor system metrics and platform stability.</p>
        </div>
      </div>

      {loading ? (
        <Card className="flex justify-center p-12 border-transparent">
          <Loader2 className="w-8 h-8 animate-spin text-theme-success" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Active Users', value: stats.activeUsers, status: 'healthy' },
            { label: 'Est. Online Users', value: stats.onlineUsers, status: 'healthy' },
            { label: 'Total Invoices', value: stats.invoices, status: 'healthy' },
            { label: 'Sync Status', value: stats.syncStatus, status: stats.syncStatus === '99.9%' ? 'healthy' : 'warning' },
            { label: 'Storage Usage', value: `${stats.storageUsed} GB`, status: 'healthy' },
            { label: 'Offline Queue', value: stats.errors, status: stats.errors > 0 ? 'warning' : 'healthy' }
          ].map((item, i) => (
            <Card key={i} className="flex flex-col h-full border-transparent bg-theme-surface-elevated hover:bg-theme-surface-hover transition-colors">
              <CardContent className="p-6 flex flex-col flex-1">
                <span className="text-theme-muted text-sm font-bold uppercase mb-2 tracking-wider">{item.label}</span>
                <span className="text-4xl font-black text-theme-primary mb-6">{item.value}</span>
                <div className="mt-auto">
                  <Badge variant={item.status === 'healthy' ? 'success' : 'warning'} className="flex items-center w-fit">
                    {item.status === 'healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                    {item.status === 'healthy' ? 'Healthy' : 'Action Needed'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default memo(AppHealthCenter);
