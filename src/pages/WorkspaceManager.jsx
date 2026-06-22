import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { 
  Store, 
  Plus, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  Circle,
  Settings2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_MODULES = [
  { id: 'billing', name: 'Invoicing & Billing' },
  { id: 'customers', name: 'Customers (CRM)' },
  { id: 'products', name: 'Products & Inventory' },
  { id: 'dueLedger', name: 'Due Ledger' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'reports', name: 'Reports & Analytics' }
];

const WorkspaceManager = ({ 
  businessWorkspaces, 
  activeWorkspaceId, 
  setActiveWorkspace,
  settings,
  onSaveSettings,
  setCurrentTab
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('retail');
  const [enabledModules, setEnabledModules] = useState(['billing', 'customers']);

  const workspaces = businessWorkspaces || [];
  const activeCount = workspaces.filter(w => !w.archived).length;

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingWorkspace(null);
    setName('');
    setType('retail');
    setEnabledModules(['billing', 'customers', 'products', 'dueLedger', 'reports']);
  };

  const handleOpenEdit = (ws) => {
    setIsAdding(true);
    setEditingWorkspace(ws);
    setName(ws.name || '');
    setType(ws.type || 'retail');
    setEnabledModules(ws.enabledModules || []);
  };

  const toggleModule = (modId) => {
    if (enabledModules.includes(modId)) {
      setEnabledModules(enabledModules.filter(id => id !== modId));
    } else {
      setEnabledModules([...enabledModules, modId]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    let updatedWorkspaces = [...workspaces];
    
    if (editingWorkspace) {
      updatedWorkspaces = updatedWorkspaces.map(ws => {
        if (ws.id === editingWorkspace.id) {
          return { ...ws, name, type, enabledModules };
        }
        return ws;
      });
    } else {
      const newWs = {
        id: 'ws_' + Date.now(),
        name,
        type,
        enabledModules,
        archived: false
      };
      updatedWorkspaces.push(newWs);
      if (updatedWorkspaces.length === 1) {
        setActiveWorkspace(newWs.id);
      }
    }
    
    onSaveSettings({ ...settings, businessWorkspaces: updatedWorkspaces });
    setIsAdding(false);
  };

  const handleToggleArchive = (ws) => {
    if (ws.id === activeWorkspaceId) {
      alert("Cannot archive the currently active workspace.");
      return;
    }
    
    const updatedWorkspaces = workspaces.map(w => {
      if (w.id === ws.id) {
        return { ...w, archived: !w.archived };
      }
      return w;
    });
    onSaveSettings({ ...settings, businessWorkspaces: updatedWorkspaces });
  };

  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setCurrentTab('more')}
          className="w-10 h-10 bg-theme-card border border-theme-border-soft rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Workspace Manager</h1>
          <p className="text-xs font-bold text-theme-muted">{activeCount} Active Workspaces</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Workspaces List */}
            {workspaces.map(ws => (
              <div 
                key={ws.id} 
                className={`bg-theme-card rounded-3xl p-5 border shadow-premium transition-all relative overflow-hidden ${ws.archived ? 'opacity-60 border-theme-border-soft' : ws.id === activeWorkspaceId ? 'border-theme-accent ring-1 ring-theme-accent/20' : 'border-theme-border-soft'}`}
              >
                {ws.id === activeWorkspaceId && (
                  <div className="absolute top-0 right-0 bg-theme-accent text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Active
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => {
                      if (!ws.archived) setActiveWorkspace(ws.id);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ws.id === activeWorkspaceId ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/30' : 'bg-theme-app text-theme-muted'}`}>
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-theme-primary">{ws.name}</h3>
                      <p className="text-[11px] font-bold text-theme-muted capitalize">{ws.type} • {ws.enabledModules?.length || 0} Modules</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(ws)}
                      className="w-8 h-8 rounded-full bg-theme-app hover:bg-theme-surface flex items-center justify-center text-theme-muted transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleArchive(ws)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${ws.archived ? 'bg-theme-success/10 text-theme-success hover:bg-theme-success/20' : 'bg-theme-danger/10 text-theme-danger hover:bg-theme-danger/20'}`}
                      title={ws.archived ? "Restore" : "Archive"}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button */}
            <button
              onClick={handleOpenAdd}
              className="w-full mt-6 py-4 bg-[image:var(--accent-gradient)] text-white font-black rounded-2xl shadow-premium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-5 h-5" /> Add New Workspace
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium space-y-5">
              <div>
                <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Workspace Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Branch 2"
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Business Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors min-h-[44px]"
                >
                  <option value="retail">Retail & Shop</option>
                  <option value="grocery">Grocery & Store</option>
                  <option value="service">Service & Repair</option>
                  <option value="doctor">Clinic / Doctor</option>
                  <option value="teacher">Tutor / Teacher</option>
                  <option value="tailor">Tailor & Boutique</option>
                  <option value="embroidery">Embroidery & Designer</option>
                  <option value="freelance">Freelancer & Agency</option>
                  <option value="restaurant">Restaurant & Food</option>
                  <option value="custom">Custom Business</option>
                  <option value="billing_only">Billing Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-3">Enabled Modules</label>
                <div className="space-y-2">
                  {ALL_MODULES.map(mod => (
                    <div 
                      key={mod.id} 
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${enabledModules.includes(mod.id) ? 'bg-theme-accent/5 border-theme-accent/30' : 'bg-theme-app border-theme-border-soft'}`}
                    >
                      <span className="font-bold text-sm text-theme-primary">{mod.name}</span>
                      {enabledModules.includes(mod.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-theme-accent" />
                      ) : (
                        <Circle className="w-5 h-5 text-theme-muted" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-theme-app text-theme-muted font-black rounded-2xl border border-theme-border-soft hover:text-theme-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 py-4 bg-[image:var(--accent-gradient)] text-white font-black rounded-2xl shadow-premium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Save Workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AnimatedPage>
  );
};

export default WorkspaceManager;
