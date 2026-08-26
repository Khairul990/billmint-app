import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Filter, RefreshCw, FileText, Download, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine.js';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';

const AuditLogCenter = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const list = await adminEngine.getAuditLogs();
      setLogs(list);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Actor', 'Action', 'Target', 'Result', 'Details'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toISOString(),
      `"${l.actor || ''}"`,
      `"${l.action || ''}"`,
      `"${l.target || ''}"`,
      `"${l.result || 'SUCCESS'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `billqyro-admin-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (log.action?.toLowerCase().includes(term) || '') ||
      (log.actor?.toLowerCase().includes(term) || '') ||
      (log.target?.toLowerCase().includes(term) || '') ||
      (log.details?.toLowerCase().includes(term) || '');

    if (actionFilter === 'all') return matchesSearch;
    return log.action?.toLowerCase().includes(actionFilter.toLowerCase()) && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-theme-accent" />
            Platform Audit Logs & Governance
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Immutable, timestamped record of all administrative operations, security changes, and mutations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={Download}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 bg-theme-surface/50 border-theme-border-soft">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            icon={Search}
            type="text"
            placeholder="Search action, actor, target, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All Actions</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="USER_">User Lifecycle</option>
            <option value="PAYMENT_">Payment Approvals</option>
            <option value="BACKUP_">Backup & Restore</option>
            <option value="GLOBAL_">Global Settings</option>
          </Select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border-theme-border-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="p-4">
                    <TableRowSkeleton cols={6} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-theme-muted font-bold">
                  No audit logs found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-theme-surface-hover/50 transition-colors">
                  <TableCell className="font-semibold text-xs whitespace-nowrap text-theme-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-theme-primary">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-theme-accent" />
                      {log.actor || 'Owner'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-theme-secondary">
                    {log.target}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.result === 'FAILED' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {log.result === 'FAILED' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {log.result || 'SUCCESS'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-bold text-theme-accent hover:underline"
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Record Inspection"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-theme-surface-elevated p-4 rounded-xl border border-theme-border-soft">
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Actor</span>
                <span className="text-theme-primary font-bold">{selectedLog.actor}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Timestamp</span>
                <span className="text-theme-primary font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Action</span>
                <span className="text-theme-accent font-bold font-mono">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Target</span>
                <span className="text-theme-primary font-mono">{selectedLog.target}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Details</span>
              <div className="p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft text-xs text-theme-primary font-medium">
                {selectedLog.details || 'No extended textual details recorded.'}
              </div>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Metadata JSON</span>
                <pre className="p-3 bg-theme-main rounded-xl border border-theme-border-soft text-[11px] font-mono text-theme-secondary overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)} variant="primary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default AuditLogCenter;
