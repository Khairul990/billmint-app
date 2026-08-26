import React, { useState, useEffect, memo } from 'react';
import { Search, Filter, Shield, UserX, CheckCircle, Ban, Users, Inbox, Loader2, ChevronLeft, ChevronRight, Eye, Trash2, RotateCcw, Crown, Mail, Calendar, Building2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

const PAGE_SIZE = 15;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [revenueStates, setRevenueStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [planChangeModalUser, setPlanChangeModalUser] = useState(null);
  const [newPlanSelection, setNewPlanSelection] = useState('pro');

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const list = await adminEngine.getUsersList();
      const revs = await adminEngine.getRevenueStates();
      setUsers(list || []);
      setRevenueStates(revs || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleToggleBlock = async (user) => {
    const isBlocking = !user.blocked;
    const confirmAction = window.confirm(
      `Are you sure you want to ${isBlocking ? 'SUSPEND' : 'REACTIVATE'} account for ${user.email || user.businessName}?`
    );
    if (!confirmAction) return;

    setProcessingId(user.userId);
    try {
      const success = isBlocking
        ? await adminEngine.blockUser(user.userId)
        : await adminEngine.unblockUser(user.userId);

      if (success) {
        toast.success(`User ${isBlocking ? 'suspended' : 'reactivated'} successfully.`);
        fetchUsersData();
        if (selectedUser?.userId === user.userId) {
          setSelectedUser({ ...selectedUser, blocked: isBlocking });
        }
      } else {
        toast.error('Failed to update user block status.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error updating status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSavePlanChange = async () => {
    if (!planChangeModalUser) return;
    setProcessingId(planChangeModalUser.userId);
    try {
      await adminEngine.updateUserPlan(planChangeModalUser.userId, newPlanSelection);
      toast.success(`Assigned ${newPlanSelection.toUpperCase()} tier to ${planChangeModalUser.email}`);
      setPlanChangeModalUser(null);
      fetchUsersData();
      if (selectedUser?.userId === planChangeModalUser.userId) {
        setSelectedUser({ ...selectedUser, planStatus: newPlanSelection });
      }
    } catch (e) {
      toast.error('Failed to change plan');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (user.email?.toLowerCase().includes(term) || '') ||
      (user.businessName?.toLowerCase().includes(term) || '') ||
      (user.userId?.toLowerCase().includes(term) || '');

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'premium') return (user.planStatus === 'premium' || user.planStatus === 'pro') && matchesSearch;
    if (statusFilter === 'free') return (user.planStatus === 'free' || !user.planStatus) && matchesSearch;
    if (statusFilter === 'suspended') return user.blocked && matchesSearch;
    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-theme-accent" />
            User Management & Tenant Control
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Search users, inspect workspace allocations, manage tier assignments, and enforce access restrictions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUsersData} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-theme-surface/50 border-theme-border-soft">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            icon={Search}
            type="text"
            placeholder="Search email, business name, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All Users ({users.length})</option>
            <option value="premium">Premium / Pro</option>
            <option value="free">Free Tier</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-theme-border-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Business</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-theme-muted font-bold">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No users found matching search query.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.userId || user.id} className="hover:bg-theme-surface-hover/50 transition-colors">
                  <TableCell className="font-bold text-theme-primary">
                    <div>
                      <span>{user.businessName || 'Default Workspace'}</span>
                      <span className="text-[10px] text-theme-muted block font-mono">ID: {user.userId || user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-theme-secondary font-medium">
                    {user.email || 'No email attached'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      user.planStatus === 'pro' || user.planStatus === 'premium'
                        ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20'
                        : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
                    }`}>
                      {user.planStatus || 'free'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      user.blocked ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {user.blocked ? 'Suspended' : 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-theme-muted font-semibold">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="text-xs font-bold text-theme-accent hover:underline"
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPlanChangeModalUser(user);
                          setNewPlanSelection(user.planStatus || 'pro');
                        }}
                        className="text-xs font-bold text-theme-primary"
                      >
                        Tier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingId === user.userId}
                        onClick={() => handleToggleBlock(user)}
                        className={`text-xs font-bold ${user.blocked ? 'text-emerald-500' : 'text-rose-500'}`}
                      >
                        {user.blocked ? 'Unblock' : 'Suspend'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-theme-border-soft text-xs text-theme-secondary">
            <span>Page {safePage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Tenant User Profile"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-theme-surface-elevated p-4 rounded-xl border border-theme-border-soft">
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Business Name</span>
                <span className="text-theme-primary font-bold">{selectedUser.businessName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Email</span>
                <span className="text-theme-primary font-bold">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">User ID</span>
                <span className="text-theme-muted font-mono">{selectedUser.userId || selectedUser.id}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Current Tier</span>
                <span className="text-theme-accent font-bold uppercase">{selectedUser.planStatus || 'free'}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Account Status</span>
                <span className={`font-bold uppercase ${selectedUser.blocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {selectedUser.blocked ? 'Suspended' : 'Active'}
                </span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Registration Date</span>
                <span className="text-theme-primary">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPlanChangeModalUser(selectedUser);
                  setNewPlanSelection(selectedUser.planStatus || 'pro');
                }}
              >
                Change Subscription Tier
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Changer Modal */}
      {planChangeModalUser && (
        <Modal
          isOpen={!!planChangeModalUser}
          onClose={() => setPlanChangeModalUser(null)}
          title="Change Tenant Subscription Plan"
        >
          <div className="space-y-4">
            <p className="text-xs text-theme-secondary">
              Assign a new subscription tier for <strong>{planChangeModalUser.email}</strong>. This updates feature access and invoicing limits immediately.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Select Tier</label>
              <Select
                value={newPlanSelection}
                onChange={(e) => setNewPlanSelection(e.target.value)}
                className="w-full"
              >
                <option value="free">Free Tier (15 Invoices / Basic Modules)</option>
                <option value="pro">Pro Tier (Unlimited Invoices / All Modules)</option>
                <option value="enterprise">Enterprise Tier (Dedicated Multi-Workspace)</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setPlanChangeModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processingId === planChangeModalUser.userId}
                onClick={handleSavePlanChange}
              >
                Save Plan Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default memo(UserManager);
