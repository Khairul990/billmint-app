import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Trash2, Edit2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAdminAllAnnouncements, createAnnouncement, toggleAnnouncementActive } from '../../services/dbEngine';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info', // 'info', 'warning', 'maintenance', 'update'
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await getAdminAllAnnouncements();
      setAnnouncements(list);
    } catch (e) {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }
    
    try {
      const ann = await createAnnouncement(
        formData.title,
        formData.message,
        formData.type,
        formData.active,
        formData.startDate,
        formData.endDate
      );
      if (ann) {
        toast.success('Announcement published!');
        setIsCreating(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          active: true,
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        });
        loadData();
      }
    } catch (e) {
      toast.error('Error creating announcement');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await toggleAnnouncementActive(id, !currentStatus);
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (e) {
      toast.error('Error toggling announcement status');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'maintenance': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'update': return <Megaphone className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Megaphone className="w-6 h-6 mr-3 text-purple-500" /> Announcements & Maintenance
          </h2>
          <p className="text-slate-400 text-sm mt-1">Broadcast messages to all users or trigger global maintenance mode.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center transition-colors"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> New Broadcast</>}
        </button>
      </div>

      {isCreating && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-purple-500/30 overflow-hidden">
          <h3 className="font-bold text-white mb-4">Create New Broadcast</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                placeholder="e.g., Scheduled Maintenance"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Broadcast Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 appearance-none"
              >
                <option value="info">Info / News</option>
                <option value="update">Platform Update</option>
                <option value="warning">Warning / Alert</option>
                <option value="maintenance">Global Maintenance (Locks App)</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 mb-1">Message Body</label>
            <textarea
              rows="3"
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Enter the broadcast message..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <input 
              type="checkbox" 
              checked={formData.active} 
              onChange={e => setFormData({...formData, active: e.target.checked})}
              id="activeToggle"
              className="w-4 h-4 rounded text-purple-500 bg-slate-800 border-slate-600 focus:ring-purple-500"
            />
            <label htmlFor="activeToggle" className="text-sm font-bold text-white cursor-pointer">Activate Immediately</label>
          </div>

          <div className="flex justify-end">
            <button onClick={handleCreate} className="px-6 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors">
              Publish Broadcast
            </button>
          </div>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-bold text-sm">Loading broadcasts...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-[#1e293b]/60 backdrop-blur-md rounded-3xl border border-slate-700/50">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No broadcasts yet</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-[#1e293b]/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${ann.type === 'maintenance' ? 'bg-rose-500/10' : ann.type === 'warning' ? 'bg-amber-500/10' : ann.type === 'update' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                  {getIconForType(ann.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-white text-base">{ann.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${ann.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {ann.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm font-semibold mb-2">{ann.message}</p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Start: {ann.startDate || 'N/A'} {ann.endDate && ` • End: ${ann.endDate}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(ann.id, ann.active)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${ann.active ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                >
                  {ann.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AnnouncementManager;
