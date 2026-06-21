import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp = true, accentColor, subtitle, onClick, loading = false }) => {
  if (loading) {
    return (
      <div className="stat-premium">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton-block" style={{ width: '2.5rem', height: '2.5rem' }} />
          <div className="skeleton-block" style={{ width: '3.5rem', height: '1rem', borderRadius: '9999px' }} />
        </div>
        <div className="skeleton-line mb-2" style={{ width: '60%' }} />
        <div className="skeleton-line" style={{ width: '40%' }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-premium group cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="icon-premium shrink-0 group-hover:scale-110 transition-transform duration-300">
          {Icon && <Icon className="w-4 h-4" />}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${
            trendUp
              ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
          }`}>
            {trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">{title}</p>
      <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums">{value}</p>
      {subtitle && (
        <p className="text-2xs text-theme-muted font-medium mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default StatCard;