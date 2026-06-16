import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListPlus, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChangelogManager = () => {
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');

  const handlePublish = () => {
    if (!version || !notes) {
      toast.error('Please fill in all fields.');
      return;
    }
    toast.success(`Version ${version} published to all users!`);
    setVersion('');
    setNotes('');
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

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Create New Release</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Version Number</label>
            <input 
              type="text" 
              placeholder="e.g. v2.1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Release Notes (Markdown supported)</label>
            <textarea 
              rows="6"
              placeholder="- Added new Premium feature...&#10;- Fixed bug in PDF generation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>
          <button 
            onClick={handlePublish}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center transition-colors"
          >
            <Send className="w-5 h-5 mr-2" /> Publish to App
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChangelogManager;
