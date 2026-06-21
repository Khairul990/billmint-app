import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserX, CheckCircle, Ban, Users, Inbox, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAdminUsersList, getAdminPlatformRevenueStates, updateUserBlockStatus } from '../../services/dbEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';

const PAGE_SIZE = 20;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [revenueStates, setRevenueStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleToggleBlock = async (user) => {
    setProcessingId(user.userId);
    const newBlocked = !user.blocked;
    try {
      const success = await updateUserBlockStatus(user.userId, newBlocked);
      if (success) {
        toast.success(`User successfully ${newBlocked ? 'suspended' : 'activated'}!`);
        fetchUsersData();
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
            <p className="section-header-subtitle">Loading user profiles...</p>
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

  if (loadError) {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
        <div className="section-header">
          <div>
            <h2 className="section-header-title flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-400" /> User Manager
            </h2>
            <p className="section-header-subtitle">Manage accounts, check platform dues, and toggle suspensions.</p>
          </div>
        </div>
        <div className="card-premium p-12 flex flex-col items-center justify-center text-center">
          <div className="empty-state-icon">
            <RefreshCw className="w-10 h-10 text-rose-400" />
          </div>
          <h3 className="empty-state-title">Failed to load users</h3>
          <p className="empty-state-text">Could not fetch user data from the server. Check your connection and try again.</p>
          <button
            onClick={fetchUsersData}
            className="btn-premium mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="section-header flex-col md:flex-row gap-4">
        <div>
          <h2 className="section-header-title flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-400" /> User Manager
          </h2>
          <p className="section-header-subtitle">Manage accounts, check platform dues, and toggle suspensions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search email or business..." 
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
        
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-3">User Email</div>
          <div className="col-span-3">Business Profile</div>
          <div className="col-span-2 text-center">Plan / Bills</div>
          <div className="col-span-2 text-center">Platform Due</div>
          <div className="col-span-2 text-right">Enforcement</div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="empty-state p-12">
            <div className="empty-state-icon">
              <Inbox className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="empty-state-title">No users found</h3>
            <p className="empty-state-text">No registered user profiles match your filter options.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {paginatedUsers.map((user) => {
              const rev = getRevenueInfo(user.userId);
              return (
                <div 
                  key={user.userId} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-slate-800/20 transition-colors"
                >
                  {/* User Email */}
                  <div className="col-span-3">
                    <p className="font-extrabold text-white truncate">{user.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate select-all">{user.userId}</p>
                  </div>

                  {/* Business Name */}
                  <div className="col-span-3">
                    <p className="font-bold text-slate-300">{user.businessName || 'No Name Set'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">{user.country || 'India'}</p>
                  </div>

                  {/* Plan / Bills */}
                  <div className="col-span-2 text-center flex flex-row md:flex-col justify-between items-center md:justify-center">
                    <span className="md:hidden text-xs text-slate-500 font-semibold">Plan / Bills:</span>
                    <div>
                      <span className={`badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        user.planStatus === 'premium'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                          : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                      }`}>
                        {user.planStatus === 'premium' ? 'Premium' : 'Free'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold font-mono">
                        Bills: {rev.totalBillsCreated || 0}
                      </p>
                    </div>
                  </div>

                  {/* Dues */}
                  <div className="col-span-2 text-center flex flex-row md:flex-col justify-between items-center md:justify-center">
                    <span className="md:hidden text-xs text-slate-500 font-semibold">Platform Due:</span>
                    <div>
                      <span className={`font-extrabold ${rev.platformPendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{rev.platformPendingAmount || 0}
                      </span>
                      <p className={`text-[9px] uppercase font-black tracking-wide mt-1 ${
                        rev.lockStatus === 'locked' ? 'text-rose-500' : 
                        rev.lockStatus === 'grace' ? 'text-orange-500' : 
                        rev.lockStatus === 'warn' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {rev.lockStatus}
                      </p>
                    </div>
                  </div>

                  {/* Block Toggles */}
                  <div className="col-span-2 flex justify-between items-center md:justify-end gap-2">
                    <span className="md:hidden text-xs text-slate-500 font-semibold">Status:</span>
                    <button
                      disabled={processingId === user.userId}
                      onClick={() => handleToggleBlock(user)}
                      className={`btn-premium px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        user.blocked
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
                      }`}
                    >
                      {processingId === user.userId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : user.blocked ? (
                        <Ban className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      {user.blocked ? 'Suspended' : 'Active'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-800/30">
            <span className="text-xs text-slate-400 font-semibold">
              Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="btn-premium p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-bold px-2">{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="btn-premium p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default UserManager;
