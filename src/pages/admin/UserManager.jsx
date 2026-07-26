import { useState, useEffect, memo } from 'react';
import { Search, Filter, CheckCircle, Ban, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';

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

  const fetchUsersData = async () => {
    setLoading(true);
    try {
const list = await adminEngine.getUsersList();
        const revs = await adminEngine.getRevenueStates();
      setUsers(list);
      setRevenueStates(revs);
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

  const handleToggleBlock = async (user, action = 'suspend') => {
    setProcessingId(user.userId);
    const newBlocked = action === 'suspend';
    try {
      const success = newBlocked ? await adminEngine.blockUser(user.userId) : await adminEngine.unblockUser(user.userId);
      if (success) {
        toast.success(`User successfully ${newBlocked ? 'suspended' : 'activated'}!`);
        fetchUsersData();
        if (selectedUser?.userId === user.userId) {
          setSelectedUser({ ...selectedUser, blocked: newBlocked });
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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (window.confirm(`WARNING! This will permanently delete ${selectedUser.businessName}'s entire account and all their subcollections. Are you absolutely sure?`)) {
      setProcessingId(selectedUser.userId);
      const success = await adminEngine.deleteUser(selectedUser.userId);
      if (success) {
        toast.success('Enterprise account completely deleted.');
        setSelectedUser(null);
        fetchUsersData();
      } else {
        toast.error('Failed to delete account.');
      }
      setProcessingId(null);
    }
  };

  const handleResetWorkspace = async () => {
    if (!selectedUser) return;
    if (window.confirm(`This will delete all invoices, customers, and products for ${selectedUser.businessName}, but keep their settings. Proceed?`)) {
      setProcessingId(selectedUser.userId);
      const success = await adminEngine.resetWorkspace(selectedUser.userId);
      if (success) {
        toast.success('Workspace data reset successfully.');
      } else {
        toast.error('Failed to reset workspace.');
      }
      setProcessingId(null);
    }
  };

  const getRevenueInfo = (userId) => {
    const state = revenueStates.find(r => r.userId === userId);
    return state || { platformPendingAmount: 0, lockStatus: 'none', totalBillsCreated: 0 };
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (user.email?.toLowerCase().includes(term) || '') ||
      (user.businessName?.toLowerCase().includes(term) || '') ||
      (user.userId?.toLowerCase().includes(term) || '');

    const rev = getRevenueInfo(user.userId);

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'premium') return user.planStatus === 'premium' && matchesSearch;
    if (statusFilter === 'free') return user.planStatus === 'free' && matchesSearch;
    if (statusFilter === 'locked') return rev.lockStatus === 'locked' && matchesSearch;
    if (statusFilter === 'suspended') return user.blocked && matchesSearch;
    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
        <div className="mb-6"><h2 className="text-2xl font-black text-theme-primary">User Manager</h2></div>
        <Card className="p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={5} />
          ))}
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-theme-accent" /> User Control Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Search, filter, view profiles, and manage enterprise security limits.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            icon={Search}
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Select 
            icon={Filter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="premium">Premium Users</option>
            <option value="free">Free Starter</option>
            <option value="locked">Locked Dues</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead className="text-center">Plan</TableHead>
              <TableHead className="text-center">Storage</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Inbox className="w-10 h-10 text-theme-muted mx-auto mb-4" />
                  <p className="text-theme-secondary font-bold">No users found.</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const rev = getRevenueInfo(user.userId);
                const workspacesCount = user.workspacesCount || 1;
                return (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent font-black text-lg shrink-0">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-theme-primary truncate">{user.businessName || 'Unnamed Business'}</p>
                          <p className="text-[11px] text-theme-secondary truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.planStatus === 'premium' ? 'primary' : 'outline'}>
                        {user.planStatus === 'premium' ? 'Premium' : 'Free'}
                      </Badge>
                      <p className="text-[10px] text-theme-secondary mt-1 font-bold">{workspacesCount} Workspace(s)</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-theme-primary font-bold">
                        <Cloud className="w-3.5 h-3.5 text-theme-accent" />
                        {(workspacesCount * 0.05).toFixed(2)} GB
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.blocked ? (
                        <Badge variant="danger">Suspended</Badge>
                      ) : rev.lockStatus === 'locked' ? (
                        <Badge variant="warning">Locked (Dues)</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.blocked ? (
                          <Button variant="outline" className="border-theme-success text-theme-success" size="sm" onClick={() => handleToggleBlock(user, 'activate')}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" className="border-theme-danger text-theme-danger" size="sm" onClick={() => handleToggleBlock(user, 'suspend')}>
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-theme-border-soft bg-theme-surface-elevated">
            <span className="text-xs text-theme-secondary font-semibold">
              Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-theme-primary font-bold px-2">{safePage} / {totalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={selectedUser?.businessName || 'Unnamed Business'} className="max-w-3xl">
        {selectedUser && (
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 flex items-center justify-center text-theme-accent font-black text-xl">
                {selectedUser.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-theme-secondary font-medium">{selectedUser.email}</p>
                <p className="text-xs text-theme-muted font-mono">{selectedUser.userId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-transparent shadow-none bg-theme-surface-elevated">
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Status</p>
                <p className={`font-bold ${selectedUser.blocked ? 'text-theme-danger' : 'text-theme-success'}`}>
                  {selectedUser.blocked ? 'Suspended' : 'Active'}
                </p>
              </Card>
              <Card className="p-4 border-transparent shadow-none bg-theme-surface-elevated">
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Storage Used</p>
                <p className="font-bold text-theme-primary flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-theme-accent"/> {((selectedUser.workspacesCount || 1) * 0.05).toFixed(2)} GB
                </p>
              </Card>
              <Card className="p-4 border-transparent shadow-none bg-theme-surface-elevated">
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Plan</p>
                <p className={`font-bold ${selectedUser.planStatus === 'premium' ? 'text-theme-accent' : 'text-theme-primary'}`}>
                  {selectedUser.planStatus === 'premium' ? 'Premium' : 'Free Starter'}
                </p>
              </Card>
              <Card className="p-4 border-transparent shadow-none bg-theme-surface-elevated">
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-wider mb-1">Workspaces</p>
                <p className="font-bold text-theme-primary">{selectedUser.workspacesCount || 1} Active</p>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-bold text-theme-primary mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-theme-warning" /> Recent Logins & Devices</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-theme-surface-elevated border border-theme-border-soft p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="w-5 h-5 text-theme-muted" />
                    <div>
                      <p className="text-sm font-bold text-theme-primary">Chrome on Windows 11</p>
                      <p className="text-[10px] text-theme-secondary uppercase font-mono mt-0.5">IP: 192.168.1.1 (Mumbai, IN)</p>
                    </div>
                  </div>
                  <span className="text-xs text-theme-success font-bold">Active Now</span>
                </div>
              </div>
            </div>

            <div className="border-t border-theme-border-soft pt-6">
              <h4 className="text-sm font-bold text-theme-primary mb-4">Danger Zone</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-theme-warning text-theme-warning hover:bg-theme-warning/10" onClick={handleResetWorkspace} leftIcon={RotateCcw}>
                  Reset Workspace
                </Button>
                {selectedUser.blocked ? (
                  <Button variant="outline" className="border-theme-success text-theme-success hover:bg-theme-success/10" onClick={() => handleToggleBlock(selectedUser, 'activate')} leftIcon={CheckCircle}>
                    Restore User
                  </Button>
                ) : (
                  <Button variant="outline" className="border-theme-danger text-theme-danger hover:bg-theme-danger/10" onClick={() => handleToggleBlock(selectedUser, 'suspend')} leftIcon={Ban}>
                    Suspend User
                  </Button>
                )}
                <Button variant="primary" className="bg-theme-danger hover:bg-theme-danger/80 border-theme-danger shadow-[0_0_15px_var(--danger)] ml-auto" disabled={processingId === selectedUser.userId} onClick={handleDeleteUser} leftIcon={processingId === selectedUser.userId ? Loader2 : Trash2}>
                  {processingId === selectedUser.userId ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default memo(UserManager);
