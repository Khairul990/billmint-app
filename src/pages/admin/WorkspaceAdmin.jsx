import React, { useState, useEffect, memo } from 'react';
import { Search, Building2, HardDrive, Inbox, Download, Trash2, RefreshCw, Layers, CheckCircle2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

const WorkspaceAdmin = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const list = await adminEngine.getWorkspaces();
      setWorkspaces(list || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const filteredWorkspaces = workspaces.filter(ws =>
    (ws.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ws.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ws.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ws.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-theme-accent" />
            Workspace Governance & Multi-Tenant Registry
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Audit tenant workspaces, inspect active business modules, verify plan limits, and monitor isolation boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchWorkspaces} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-theme-surface/50 border-theme-border-soft">
        <Input
          icon={Search}
          type="text"
          placeholder="Search by workspace name, owner email, or workspace ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </Card>

      {/* Workspace Registry Table */}
      <Card className="overflow-hidden border-theme-border-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Modules Enabled</TableHead>
              <TableHead className="text-right">Inspection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="p-4">
                    <TableRowSkeleton cols={6} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredWorkspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-theme-muted font-bold">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No workspaces found matching query.
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkspaces.map((ws) => (
                <TableRow key={ws.id} className="hover:bg-theme-surface-hover/50 transition-colors">
                  <TableCell className="font-bold text-theme-primary">
                    <div>
                      <span>{ws.name}</span>
                      <span className="text-[10px] text-theme-muted block font-mono">ID: {ws.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-theme-secondary">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-theme-accent" />
                      <div>
                        <span>{ws.ownerName || 'Owner'}</span>
                        <span className="text-[10px] text-theme-muted block">{ws.email || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-theme-secondary">
                    {ws.category || 'General Business'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      ws.plan === 'pro' || ws.plan === 'enterprise'
                        ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20'
                        : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
                    }`}>
                      {ws.plan || 'free'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-theme-muted">
                    <span className="font-bold text-theme-primary">{ws.activeModules?.length || 4}</span> modules active
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWorkspace(ws)}
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

      {/* Workspace Detail Modal */}
      {selectedWorkspace && (
        <Modal
          isOpen={!!selectedWorkspace}
          onClose={() => setSelectedWorkspace(null)}
          title="Workspace Tenant Inspection"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-theme-surface-elevated p-4 rounded-xl border border-theme-border-soft">
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Workspace Name</span>
                <span className="text-theme-primary font-bold">{selectedWorkspace.name}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Category</span>
                <span className="text-theme-primary font-bold">{selectedWorkspace.category || 'General'}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Owner Email</span>
                <span className="text-theme-primary">{selectedWorkspace.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Workspace ID</span>
                <span className="text-theme-muted font-mono">{selectedWorkspace.id}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-2">Enabled Platform Modules</span>
              <div className="flex flex-wrap gap-2">
                {(selectedWorkspace.activeModules || ['invoices', 'customers', 'products', 'reports']).map((mod) => (
                  <span
                    key={mod}
                    className="px-2.5 py-1 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-xs font-bold text-theme-primary capitalize flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {mod}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedWorkspace(null)} variant="primary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default memo(WorkspaceAdmin);
