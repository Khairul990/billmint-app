import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Shield, Clock } from 'lucide-react';
import { BillQyroDB } from '../services/localDb';

const AuditLogs = ({ setCurrentTab }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await BillQyroDB.getAll('auditLogs');
      const sorted = allLogs.sort((a, b) => b.createdAt - a.createdAt);
      setLogs(sorted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative font-sans animate-fade-in space-y-6">
      <button 
        onClick={() => setCurrentTab('more')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-premium">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-theme-border-soft">
          <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Audit Logs</h1>
            <p className="text-sm text-theme-muted font-medium mt-1">Append-only security and action tracing.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-theme-muted py-8 text-sm">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-theme-muted py-8 text-sm flex flex-col items-center">
            <Activity className="w-8 h-8 opacity-20 mb-2" />
            <p>No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border-soft text-theme-muted text-xs uppercase tracking-wider">
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Entity</th>
                  <th className="p-3 font-semibold">Actor Role</th>
                  <th className="p-3 font-semibold">Device Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-soft/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-theme-bg-soft/50 transition-colors">
                    <td className="p-3 text-sm text-theme-secondary">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 opacity-50" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-medium text-theme-primary">
                      <span className="px-2 py-1 rounded-md bg-theme-accent/10 text-theme-accent text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-theme-secondary truncate max-w-[150px]">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="p-3 text-sm text-theme-secondary">
                      {log.actorRole}
                    </td>
                    <td className="p-3 text-xs text-theme-muted truncate max-w-[200px]" title={log.deviceInfo}>
                      {log.deviceInfo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
