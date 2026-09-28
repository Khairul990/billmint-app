import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, FileText, Settings, X, CreditCard, PieChart, Sparkles } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigate({ type: 'open_command_palette' }); // handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const commands = [
    { id: 'create-bill', icon: Plus, label: 'Create New Bill', shortcut: 'C', tab: 'dashboard', action: 'create_bill' },
    { id: 'collect-payment', icon: CreditCard, label: 'Collect Payment', shortcut: 'P', tab: 'due-ledger' },
    { id: 'view-customers', icon: Users, label: 'View Customers', shortcut: 'U', tab: 'customers' },
    { id: 'view-invoices', icon: FileText, label: 'All Invoices', shortcut: 'I', tab: 'invoices' },
    { id: 'view-reports', icon: PieChart, label: 'Analytics & Reports', shortcut: 'R', tab: 'reports' },
    { id: 'open-settings', icon: Settings, label: 'Settings', shortcut: 'S', tab: 'settings' }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd) => {
    setQuery('');
    onClose();
    if (cmd.action === 'create_bill') {
      onNavigate({ tab: 'dashboard', openQuickBill: true });
    } else {
      onNavigate({ tab: cmd.tab });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-theme-main/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[10000] w-full max-w-xl bg-gradient-to-br from-white/90 via-theme-surface/80 to-theme-accent/5 backdrop-blur-3xl border border-white/60 dark:border-theme-border-soft shadow-[0_32px_64px_-16px_rgba(11,143,120,0.2)] dark:bg-gradient-to-br dark:from-[#0B1220]/90 dark:to-theme-surface/70 rounded-[2rem] overflow-hidden font-sans ring-1 ring-white/50"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-theme-accent/20 rounded-full blur-[60px] pointer-events-none z-0 animate-pulse" />
            
            <div className="relative flex items-center gap-3 p-5 border-b border-white/40 dark:border-theme-border-soft/50 bg-white/40 dark:bg-[#0B1220]/40 backdrop-blur-sm z-10">
              <div className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-theme-accent" />
              </div>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask AI or search commands (Ctrl+K)..."
                className="flex-1 bg-transparent border-none outline-none text-theme-primary text-lg font-bold placeholder:text-theme-muted/50"
              />
              <button onClick={onClose} className="p-1.5 text-theme-muted hover:text-rose-500 transition-colors bg-white/50 dark:bg-theme-surface/50 hover:bg-rose-500/10 rounded-xl shadow-xs border border-white/50 dark:border-theme-border-soft">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative p-3 max-h-[60vh] overflow-y-auto custom-scrollbar z-10 bg-white/20 dark:bg-transparent">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/60 dark:hover:bg-theme-surface/60 border border-transparent hover:border-white/60 dark:hover:border-theme-border-soft text-left transition-all duration-200 group shadow-none hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted group-hover:text-theme-accent group-hover:border-theme-accent/30 group-hover:bg-theme-accent/10 transition-all shadow-xs group-hover:shadow-md group-hover:scale-110">
                          <cmd.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-theme-primary group-hover:text-theme-accent transition-colors block">{cmd.label}</span>
                          <span className="text-[10px] text-theme-muted font-medium mt-0.5 block">{cmd.tab.toUpperCase()}</span>
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-theme-muted bg-white/50 dark:bg-theme-surface px-2 py-1 rounded-lg border border-theme-border-soft group-hover:border-theme-accent/20 group-hover:text-theme-accent transition-colors">
                          Ctrl <span className="text-[9px]">+</span> {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Search className="w-6 h-6 text-theme-accent" />
                  </div>
                  <p className="text-sm font-bold text-theme-primary">No matching commands found.</p>
                  <p className="text-[11px] text-theme-muted mt-1">Try searching for "invoice" or "customer"</p>
                </div>
              )}
            </div>
            
            <div className="relative border-t border-white/40 dark:border-theme-border-soft/50 p-3 bg-white/40 dark:bg-[#0B1220]/40 backdrop-blur-sm z-10 flex items-center justify-between">
              <span className="text-[10px] font-black text-theme-muted tracking-widest uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> BillQyro Magic Search
              </span>
              <span className="text-[10px] text-theme-muted font-medium">Use arrows to navigate</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
