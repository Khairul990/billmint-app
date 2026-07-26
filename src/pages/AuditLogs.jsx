import { useState, useEffect, useMemo } from 'react';
import { auditEngine } from '../services/auditEngine';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';

const AuditLogs = ({ setCurrentTab }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const perPage = 15;

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await auditEngine.getAllAuditLogsFromDb();
      const sorted = (allLogs || []).sort((a, b) => b.createdAt - a.createdAt);
      setLogs(sorted);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map(l => l.action));
    return ['', ...Array.from(set)];
  }, [logs]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    return {
      total: logs.length,
      today: logs.filter(l => l.createdAt >= todayStart).length,
      week: logs.filter(l => l.createdAt >= weekStart).length
    };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (search) {
        const q = search.toLowerCase();
        const userMatch = (log.userEmail || log.userId || '').toLowerCase().includes(q);
        const actionMatch = (log.action || '').toLowerCase().includes(q);
        if (!userMatch && !actionMatch) return false;
      }
      if (actionFilter && log.action !== actionFilter) return false;
      if (dateFrom && log.createdAt < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (log.createdAt > end.getTime()) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, actionFilter, dateFrom, dateTo]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Actor Role', 'User Email', 'Device Info', 'Details'];
    const rows = filtered.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.entityType || '',
      log.entityId || '',
      log.actorRole || '',
      log.userEmail || '',
      `"${(log.deviceInfo || '').replace(/"/g, '""')}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const clearAll = async () => {
    try {
      await auditEngine.clearAllAuditLogsDb();
      setLogs([]);
    } catch (e) { console.error(e); }
    setShowConfirm(false);
  };

  const clearFilters = () => { setSearch(''); setActionFilter(''); setDateFrom(''); setDateTo(''); };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-6xl mx-auto pb-12 relative font-sans space-y-6">
      <button onClick={() => setCurrentTab('more')} className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="card-premium p-6 md:p-8">
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
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-premium">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent"><Activity className="w-5 h-5" /></div>
                  <div><p className="text-xs text-theme-muted font-medium">Total Events</p><p className="text-xl font-black text-theme-primary">{stats.total.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="stat-premium">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Clock className="w-5 h-5" /></div>
                  <div><p className="text-xs text-theme-muted font-medium">Today</p><p className="text-xl font-black text-theme-primary">{stats.today.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="stat-premium">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500"><Shield className="w-5 h-5" /></div>
                  <div><p className="text-xs text-theme-muted font-medium">This Week</p><p className="text-xl font-black text-theme-primary">{stats.week.toLocaleString()}</p></div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <div className="section-header flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                    <input type="text" placeholder="Search user or action..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-9 w-52" />
                  </div>
                  <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-premium w-40">
                    <option value="">All Actions</option>
                    {uniqueActions.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-premium w-36" />
                  <span className="text-xs text-theme-muted">to</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-premium w-36" />
                  {(search || actionFilter || dateFrom || dateTo) && (
                    <button onClick={clearFilters} className="btn-premium-ghost text-xs flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-premium badge-info text-xs">{filtered.length} records</span>
                  <button onClick={exportCSV} className="btn-premium text-xs flex items-center gap-1.5"><Download className="w-3 h-3" /> Export CSV</button>
                  <button onClick={() => setShowConfirm(true)} className="btn-premium-outline text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Clear All</button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Filter className="w-5 h-5" /></div>
                  <p className="empty-state-title">No matching logs</p>
                  <p className="empty-state-text">Try adjusting your filters or search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium min-w-[700px]">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Actor Role</th>
                        <th>User</th>
                        <th>Device Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft/50">
                      {paginated.map(log => (
                        <motion.tr key={log.id} variants={staggerItem} className="hover:bg-theme-bg-soft/50 transition-colors cursor-default">
                          <td className="text-xs text-theme-secondary whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 opacity-50 shrink-0" />
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td><span className="badge-premium bg-theme-accent/10 text-theme-accent text-xs border border-theme-accent/20">{log.action}</span></td>
                          <td className="text-sm text-theme-secondary truncate max-w-[130px]">{log.entityType} ({log.entityId})</td>
                          <td className="text-sm text-theme-secondary">{log.actorRole || '-'}</td>
                          <td className="text-xs text-theme-muted truncate max-w-[120px]" title={log.userEmail || log.userId}>{log.userEmail || log.userId || '-'}</td>
                          <td className="text-xs text-theme-muted truncate max-w-[160px]" title={log.deviceInfo}>{log.deviceInfo || '-'}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-theme-border-soft">
                <span className="text-xs text-theme-muted">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-premium-outline text-xs px-3 py-1.5 disabled:opacity-30">Previous</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-premium text-xs px-3 py-1.5 disabled:opacity-30">Next</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="card-premium p-6 max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><AlertTriangle className="w-5 h-5" /></div>
              <div><p className="text-sm font-bold text-theme-primary">Clear All Logs?</p><p className="text-xs text-theme-muted mt-0.5">This action cannot be undone.</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-premium-outline flex-1 text-xs">Cancel</button>
              <button onClick={clearAll} className="btn-premium flex-1 text-xs bg-red-500 hover:bg-red-600 border-none">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AuditLogs;
