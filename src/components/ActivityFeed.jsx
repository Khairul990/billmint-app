import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { staggerContainer, staggerItem } from '../utils/animations';
import { formatCurrency } from '../utils/invoiceUtils';

const activityConfig = {
  invoice_created: { icon: FileText, color: 'text-theme-accent', bg: 'bg-theme-accent/10' },
  payment_received: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  payment_due: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  invoice_overdue: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const ActivityFeed = ({ activities = [], maxItems = 10 }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="card-premium p-5">
        <div className="section-header">
          <h3 className="section-header-title">Activity Feed</h3>
        </div>
        <div className="empty-state py-8">
          <div className="empty-state-icon">
            <Clock className="w-6 h-6" />
          </div>
          <p className="empty-state-title">No recent activity</p>
          <p className="empty-state-text">Start creating invoices to see your activity here.</p>
        </div>
      </div>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="card-premium p-5">
      <div className="section-header">
        <h3 className="section-header-title">Activity Feed</h3>
        <span className="badge-premium badge-info">{activities.length} events</span>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {displayActivities.map((activity, idx) => {
          const config = activityConfig[activity.type] || activityConfig.invoice_created;
          const Icon = config.icon;
          return (
            <motion.div
              key={activity.id || idx}
              variants={staggerItem}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-theme-surface transition-all duration-200 group"
            >
              <div className={`w-9 h-9 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-theme-primary truncate">{activity.text}</p>
                <p className="text-2xs text-theme-muted font-medium">{activity.subtext}</p>
              </div>
              {activity.amount > 0 && (
                <p className="text-xs font-black text-theme-primary tabular-nums">{formatCurrency(activity.amount)}</p>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ActivityFeed;