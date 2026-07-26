import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../../services/adminEngine';

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
      const list = await adminEngine.getChangelogs();
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
      await adminEngine.createChangelog({ version, title, notes, type });
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
          <h2 className="text-3xl font-black text-theme-primary flex items-center tracking-tight">
            <ListPlus className="w-8 h-8 mr-3 text-theme-accent" /> Changelog Manager
          </h2>
          <p className="text-theme-secondary text-sm mt-1">Publish release notes and version updates to users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="bg-theme-surface-elevated p-6 rounded-3xl border border-theme-border-soft space-y-4">
          <h3 className="text-theme-primary font-bold mb-2">Create New Release</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Version Number</label>
              <input 
                type="text" 
                placeholder="e.g. v2.1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-3 text-theme-primary focus:outline-none focus:border-theme-accent transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Release Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-3 text-theme-primary focus:outline-none focus:border-theme-accent transition-colors text-sm"
              >
                <option value="new">🚀 New Feature</option>
                <option value="improvement">⚡ Improvement</option>
                <option value="fix">🛠️ Bug Fix</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Release Title</label>
            <input 
              type="text" 
              placeholder="e.g. Multi-Workspace & Payment Updates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-3 text-theme-primary focus:outline-none focus:border-theme-accent transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-wider mb-2">Release Notes (Markdown supported)</label>
            <textarea 
              rows="6"
              placeholder="- Added new Premium feature...&#10;- Fixed bug in PDF generation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-3 text-theme-primary focus:outline-none focus:border-theme-accent transition-colors resize-none text-sm"
            />
          </div>

          <Button 
            onClick={handlePublish}
            variant="primary"
            className="w-full shadow-premium"
            leftIcon={Send}
          >
            Publish to App
          </Button>
        </div>

        {/* Previous Releases */}
        <div className="bg-theme-surface-elevated p-6 rounded-3xl border border-theme-border-soft flex flex-col h-[520px]">
          <h3 className="text-theme-primary font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-theme-accent" /> Release History
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {isLoading ? (
              <div className="text-center py-10 text-theme-secondary font-bold animate-pulse text-xs">Loading history...</div>
            ) : changelogs.length > 0 ? (
              changelogs.map((log) => (
                <div key={log.id} className="p-4 bg-theme-card rounded-xl border border-theme-border-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-theme-accent">{log.version}</span>
                    <span className="text-[10px] text-theme-secondary font-bold">{log.date}</span>
                  </div>
                  <h4 className="text-theme-primary text-sm font-black mb-1">{log.title}</h4>
                  <pre className="text-xs text-theme-secondary whitespace-pre-wrap font-sans leading-relaxed">
                    {log.notes}
                  </pre>
                  <div className="mt-2.5 flex justify-end">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      log.type === 'fix' ? 'bg-theme-danger/10 text-theme-danger border-theme-danger/20' :
                      log.type === 'improvement' ? 'bg-theme-success/10 text-theme-success border-theme-success/20' :
                      'bg-theme-accent-light text-theme-accent border-theme-accent/20'
                    }`}>
                      {log.type || 'new'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-theme-muted font-bold text-xs">No releases published yet.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChangelogManager;
