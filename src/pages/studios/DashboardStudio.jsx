import React from 'react';
import { LayoutDashboard, BarChart3, PieChart, Activity, Users, FileText, Settings, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

const DEFAULT_WIDGETS = [
  { id: 'revenueOverview', label: 'Revenue Overview (Chart)', visible: true },
  { id: 'recentInvoices', label: 'Recent Invoices List', visible: true },
  { id: 'pendingPayments', label: 'Pending Payments Alerts', visible: true },
  { id: 'customerStats', label: 'Customer Statistics', visible: true },
  { id: 'expenseTracker', label: 'Expense Tracker', visible: false }
];

const DashboardStudio = ({ settings, onUpdate }) => {
  const widgets = settings?.dashboardWidgets || DEFAULT_WIDGETS;

  const handleToggle = (id) => {
    const newWidgets = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    onUpdate({ dashboardWidgets: newWidgets });
  };

  const moveWidget = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === widgets.length - 1) return;
    
    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[index + direction];
    newWidgets[index + direction] = temp;
    
    onUpdate({ dashboardWidgets: newWidgets });
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-warning/10 text-theme-warning flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Dashboard Layout</h2>
            <p className="text-xs text-theme-muted">Customize the main dashboard widgets and data display</p>
          </div>
        </div>

        <div className="bg-theme-surface/50 border border-theme-border-soft rounded-2xl p-6">
          <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-4">Widget Manager</h3>
          <div className="space-y-3">
            {widgets.map((widget, idx) => (
              <div key={widget.id} className="flex items-center justify-between p-4 bg-theme-main border border-theme-border-soft rounded-xl hover:border-theme-warning/50 transition-colors">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleToggle(widget.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${widget.visible ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-surface-hover text-theme-muted'}`}
                  >
                    {widget.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <div>
                    <span className={`text-sm font-bold block ${widget.visible ? 'text-theme-primary' : 'text-theme-muted line-through'}`}>{widget.label}</span>
                    <span className="text-[10px] text-theme-muted">Dashboard Component</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => moveWidget(idx, -1)}
                    disabled={idx === 0}
                    className="p-2 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => moveWidget(idx, 1)}
                    disabled={idx === widgets.length - 1}
                    className="p-2 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="card-premium p-6 opacity-60 pointer-events-none">
        <h3 className="text-lg font-black text-theme-primary flex items-center mb-2"><Activity className="w-5 h-5 mr-2" /> Advanced Metrics Engine (Coming Soon)</h3>
        <p className="text-xs text-theme-muted mb-4">Define custom SQL-like data aggregations and display them as KPI cards.</p>
        <div className="h-24 bg-theme-surface rounded-xl border border-dashed border-theme-border-soft flex items-center justify-center">
          <span className="text-sm font-bold text-theme-muted">Advanced Metrics Locked</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStudio;
