import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Users, CreditCard, Download, BarChart3 } from 'lucide-react';
import { staggerContainer, staggerItem } from '../utils/animations';

const defaultActions = [
  { id: 'new-bill', label: 'New Bill', icon: Plus, color: 'bg-theme-accent', action: 'onQuickBillOpen' },
  { id: 'invoices', label: 'View Bills', icon: FileText, color: 'bg-blue-500', action: 'invoices' },
  { id: 'customers', label: 'Customers', icon: Users, color: 'bg-emerald-500', action: 'customers' },
  { id: 'collect', label: 'Collect Due', icon: CreditCard, color: 'bg-amber-500', action: 'due-ledger' },
];

const QuickActions = ({ actions = defaultActions, onAction, setCurrentTab }) => {
  const handleClick = (action) => {
    if (action.action?.startsWith('on')) {
      if (onAction) onAction(action.action);
    } else if (action.action) {
      if (setCurrentTab) setCurrentTab(action.action);
    }
  };

  return (
    <div className="card-premium p-5">
      <div className="section-header">
        <h3 className="section-header-title">Quick Actions</h3>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              variants={staggerItem}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(action)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-surface hover:bg-theme-accent/10 transition-all duration-200 group border border-theme-border-soft hover:border-theme-accent/20"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-2xs font-bold text-theme-primary text-center">{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default QuickActions;