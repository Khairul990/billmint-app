import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListPlus, Send, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createChangelog, getAdminAllChangelogs } from '../../services/dbEngine';

const ChangelogManager = () => {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState('new');
  const [changelogs, setChangelogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChangelogs = async () => {
    setIsLoading(true);
    try {
      const list = await getAdminAllChangelogs();
      setChangelogs(list);
    } catch (e) {
      toast.error('Failed to load changelogs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const handlePublish = async () => {
    if (!version || !title || !notes) {
      toast.error('Please fill in all fields.');
      return;
    }
    
    try {
      await createChangelog(version, '', title, notes, type);
      toast.success(`Version ${version} published to all users!`);
      setVersion('');
      setTitle('');
      setNotes('');
      setType('new');
      fetchChangelogs();
    } catch (e) {
      toast.error('Failed to publish changelog');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ListPlus className="w-6 h-6 mr-3 text-purple-500" /> Changelog Manager
          </h2>
          <p className="text-slate-400 text-sm mt-1">Publish release notes and version updates to users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 space-y-4">
          <h3 className="text-white font-bold mb-2">Create New Release</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Version Number</label>
              <input 
                type="text" 
                placeholder="e.g. v2.1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Release Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="new">🚀 New Feature</option>
                <option value="improvement">⚡ Improvement</option>
                <option value="fix">🛠️ Bug Fix</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Release Title</label>
            <input 
              type="text" 
              placeholder="e.g. Multi-Workspace & Payment Updates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Release Notes (Markdown supported)</label>
            <textarea 
              rows="6"
              placeholder="- Added new Premium feature...&#10;- Fixed bug in PDF generation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
            />
          </div>

          <button 
            onClick={handlePublish}
            className="w-full px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/10 active:scale-95"
          >
            <Send className="w-5 h-5 mr-2" /> Publish to App
          </button>
        </div>

        {/* Previous Releases */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 flex flex-col h-[520px]">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" /> Release History
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {isLoading ? (
              <div className="text-center py-10 text-slate-400 font-bold animate-pulse text-xs">Loading history...</div>
            ) : changelogs.length > 0 ? (
              changelogs.map((log) => (
                <div key={log.id} className="p-4 bg-[#0f172a] rounded-xl border border-slate-700/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-purple-400">{log.version}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{log.date}</span>
                  </div>
                  <h4 className="text-white text-sm font-black mb-1">{log.title}</h4>
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                    {log.notes}
                  </pre>
                  <div className="mt-2.5 flex justify-end">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      log.type === 'fix' ? 'bg-rose-500/10 text-rose-400' :
                      log.type === 'improvement' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {log.type || 'new'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 font-bold text-xs">No releases published yet.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChangelogManager;
