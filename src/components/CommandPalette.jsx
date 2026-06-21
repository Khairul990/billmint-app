import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, FileText, Settings, X, CreditCard, PieChart } from 'lucide-react';

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
      document.body.style.overflow = 'unset';
    }
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
            className="fixed inset-0 z-[9999] bg-theme-main/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[10000] w-full max-w-lg bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium overflow-hidden font-sans"
          >
            <div className="flex items-center gap-3 p-4 border-b border-theme-border-soft">
              <Search className="w-5 h-5 text-theme-muted" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-theme-primary text-base placeholder:text-theme-muted/50"
              />
              <button onClick={onClose} className="p-1 text-theme-muted hover:text-theme-primary transition-colors bg-theme-surface rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-theme-surface text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted group-hover:text-theme-accent group-hover:border-theme-accent/30 transition-all">
                          <cmd.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-theme-primary">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <span className="text-[10px] font-bold text-theme-muted bg-theme-surface border border-theme-border-soft px-2 py-1 rounded">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-theme-muted">No commands found for "{query}"</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-theme-border-soft bg-theme-surface/50 flex items-center justify-between text-[10px] font-semibold text-theme-muted">
              <span>Use <kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded mx-0.5">↑</kbd> <kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded mx-0.5">↓</kbd> to navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded mr-0.5">Enter</kbd> to select</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
