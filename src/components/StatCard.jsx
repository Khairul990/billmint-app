import React from 'react';

/**
 * Premium KPI Stats Card
 * @param {string} title
 * @param {string|number} value
 * @param {React.Component} icon - Lucide Icon component
 * @param {string} trend - Optional string, e.g. "+12.5% this month"
 * @param {boolean} trendUp - Optional trend direction flag
 * @param {string} accentColor - Tailwind color classes for the icon e.g. "bg-blue-50 text-blue-600"
 */
const StatCard = ({ title, value, icon: Icon, trend, trendUp = true, accentColor = "bg-indigo-50 text-indigo-600" }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-premium hover:shadow-premium-hover transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${accentColor} transition-transform duration-300 hover:scale-105`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trendUp 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
          }`}>
            {trend}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
