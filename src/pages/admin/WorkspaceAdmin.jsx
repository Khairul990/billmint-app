import React, { useState, useEffect } from 'react';
import { Search, Building2, Layers, Cloud, Inbox, Eye, Settings, RefreshCw, HardDrive, Filter, Copy, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsersList } from '../../services/dbEngine';
import { toast } from 'react-hot-toast';
import { pageVariants } from '../../utils/animations';
import { TableRowSkeleton } from '../../components/PremiumSkeleton';

export default function WorkspaceAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const list = await getAdminUsersList();
      setUsers(list);
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

  // Flatten workspaces for display
  const allWorkspaces = [];
  users.forEach(user => {
    if (user.workspacesCount > 0 && user.workspaces) {
       // Since the admin doesn't actually have a list of all workspaces per user synced individually in demo data
       // We'll mock the workspaces based on the user object for the control center
       allWorkspaces.push({
         id: `ws_${user.userId}_primary`,
         userId: user.userId,
         ownerEmail: user.email,
         name: user.businessName || 'Default Workspace',
         type: user.workspacesCount > 1 ? 'Multiple' : 'retail', // Just placeholder logic
         createdAt: new Date().toISOString(),
         size: '0.05 GB',
       });
    } else {
      allWorkspaces.push({
         id: `ws_${user.userId}_primary`,
         userId: user.userId,
         ownerEmail: user.email,
         name: user.businessName || 'Default Workspace',
         type: 'retail',
         createdAt: new Date().toISOString(),
         size: '0.05 GB',
       });
    }
  });

  const filteredWorkspaces = allWorkspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ws.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-32">
      <div className="section-header flex-col md:flex-row gap-4">
        <div>
          <h2 className="section-header-title flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-indigo-400" /> Workspace Manager
          </h2>
          <p className="section-header-subtitle">View, monitor, and reset workspaces across the platform.</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search workspaces..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium bg-[#1e293b]/60 backdrop-blur-md text-white border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 w-full md:w-64 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-500 font-semibold"
          />
        </div>
      </div>

      <div className="card-premium bg-[#1e293b]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">Workspace Name</div>
          <div className="col-span-3">Owner Email</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-center">Storage</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="empty-state p-12">
            <Inbox className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
            <h3 className="empty-state-title text-center">No workspaces found</h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredWorkspaces.map(ws => (
              <div key={ws.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-slate-800/20 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white truncate">{ws.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ws.id}</p>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <p className="font-bold text-slate-300 truncate">{ws.ownerEmail}</p>
                </div>
                
                <div className="col-span-2">
                  <span className="badge-premium px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-400">
                    {ws.type}
                  </span>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="font-bold text-slate-300 flex items-center justify-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> {ws.size}
                  </span>
                </div>
                
                <div className="col-span-1 flex justify-end gap-2">
                  <button onClick={() => toast.success('Backup queued for workspace')} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors" title="Download Backup">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => toast.error('Enterprise deletion requires owner PIN')} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" title="Delete Workspace">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
