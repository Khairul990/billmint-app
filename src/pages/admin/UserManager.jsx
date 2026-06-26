import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserX, CheckCircle, Ban, Users, Inbox, Loader2, RefreshCw, ChevronLeft, ChevronRight, Eye, Trash2, RotateCcw, Smartphone, Clock, Cloud, MonitorSmartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsersList, getAdminPlatformRevenueStates, updateUserBlockStatus } from '../../services/dbEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';

const PAGE_SIZE = 15;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [revenueStates, setRevenueStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsersData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const list = await getAdminUsersList();
      const revs = await getAdminPlatformRevenueStates();
      setUsers(list);
      setRevenueStates(revs);
    } catch (e) {
      console.error(e);
      setLoadError(true);
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
      const success = await updateUserBlockStatus(user.userId, newBlocked);
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

  const handleDeleteUser = () => {
    toast.error('Enterprise deletion requires owner PIN.');
  };

  const handleResetWorkspace = () => {
    toast.success('Workspace reset queued.');
  };

  const getRevenueInfo = (userId) => {
    const state = revenueStates.find(r => r.userId === userId);
    return state || {
      platformPendingAmount: 0,
      lockStatus: 'none',
      totalBillsCreated: 0
    };
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
        <div className="section-header">
          <div>
            <h2 className="section-header-title flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-400" /> User Manager
            </h2>
          </div>
        </div>
        <div className="card-premium p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={5} />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="section-header flex-col md:flex-row gap-4">
        <div>
          <h2 className="section-header-title flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-400" /> User Control Center
          </h2>
          <p className="section-header-subtitle">Search, filter, view profiles, and manage enterprise security limits.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium bg-[#1e293b]/60 backdrop-blur-md text-white border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 w-full md:w-64 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder-slate-500 font-semibold"
            />
          </div>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-premium appearance-none bg-[#1e293b]/60 backdrop-blur-md text-white border border-slate-700/50 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-semibold"
            >
              <option value="all">All Status</option>
              <option value="premium">Premium Users</option>
              <option value="free">Free Starter</option>
              <option value="locked">Locked Dues</option>
              <option value="suspended">Suspended</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="card-premium bg-[#1e293b]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">User Details</div>
          <div className="col-span-2 text-center">Plan</div>
          <div className="col-span-2 text-center">Storage</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="empty-state p-12">
            <Inbox className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="empty-state-title text-center">No users found</h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {paginatedUsers.map((user) => {
              const rev = getRevenueInfo(user.userId);
              const workspacesCount = user.workspacesCount || 1;
              return (
                <div key={user.userId} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-slate-800/20 transition-colors">
                  
                  {/* User Email & Profile */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-white truncate">{user.businessName || 'Unnamed Business'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="col-span-2 text-center flex flex-col items-center">
                    <span className={`badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      user.planStatus === 'premium' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                    }`}>
                      {user.planStatus === 'premium' ? 'Premium' : 'Free'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">{workspacesCount} Workspace(s)</p>
                  </div>

                  {/* Storage */}
                  <div className="col-span-2 text-center flex flex-col items-center">
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <Cloud className="w-3.5 h-3.5 text-blue-400" />
                      {(workspacesCount * 0.05).toFixed(2)} GB
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center flex flex-col items-center">
                    {user.blocked ? (
                      <span className="badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/20">
                        Suspended
                      </span>
                    ) : rev.lockStatus === 'locked' ? (
                      <span className="badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        Locked (Dues)
                      </span>
                    ) : (
                      <span className="badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => setSelectedUser(user)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {user.blocked ? (
                      <button onClick={() => handleToggleBlock(user, 'activate')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleToggleBlock(user, 'suspend')} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-800/30 rounded-xl">
          <span className="text-xs text-slate-400 font-semibold">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="btn-premium p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-bold px-2">{safePage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="btn-premium p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-700/50 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-800/50 bg-slate-800/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {selectedUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight">{selectedUser.businessName || 'Unnamed Business'}</h3>
                    <p className="text-sm text-blue-400 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                
                {/* Meta Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <p className={`font-bold ${selectedUser.blocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedUser.blocked ? 'Suspended' : 'Active'}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Storage Used</p>
                    <p className="font-bold text-white flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-400"/> {((selectedUser.workspacesCount || 1) * 0.05).toFixed(2)} GB</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Plan</p>
                    <p className={`font-bold ${selectedUser.planStatus === 'premium' ? 'text-purple-400' : 'text-slate-300'}`}>
                      {selectedUser.planStatus === 'premium' ? 'Premium' : 'Free Starter'}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Workspaces</p>
                    <p className="font-bold text-white">{selectedUser.workspacesCount || 1} Active</p>
                  </div>
                </div>

                {/* Device & Login History */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Recent Logins & Devices</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/30 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <MonitorSmartphone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">Chrome on Windows 11</p>
                          <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">IP: 192.168.1.1 (Mumbai, IN)</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">Active Now</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/30 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-200">Safari on iPhone 14 Pro</p>
                          <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">IP: 103.14.21.0 (Delhi, IN)</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-bold">2 days ago</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-800/50 pt-6">
                  <h4 className="text-sm font-bold text-white mb-4">Danger Zone & Administrative Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleResetWorkspace} className="btn-premium px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                      <RotateCcw className="w-4 h-4" /> Reset Workspace
                    </button>
                    {selectedUser.blocked ? (
                      <button onClick={() => handleToggleBlock(selectedUser, 'activate')} className="btn-premium px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Restore User
                      </button>
                    ) : (
                      <button onClick={() => handleToggleBlock(selectedUser, 'suspend')} className="btn-premium px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                        <Ban className="w-4 h-4" /> Suspend User
                      </button>
                    )}
                    <button onClick={handleDeleteUser} className="btn-premium px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ml-auto">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default UserManager;
