import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, GitMerge } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';

const CONDITIONS = [
  { id: 'invoice_created', label: 'When Invoice is Created' },
  { id: 'invoice_paid', label: 'When Invoice is Paid' },
  { id: 'due_date_passed', label: 'When Due Date Passed' },
  { id: 'new_customer', label: 'When New Customer Added' }
];

const ACTIONS = [
  { id: 'send_email', label: 'Send Email Notification' },
  { id: 'send_sms', label: 'Send SMS Alert' },
  { id: 'mark_completed', label: 'Mark as Completed' },
  { id: 'apply_late_fee', label: 'Apply Late Fee (+5%)' }
];

const AutomationStudio = ({ settings, onUpdate }) => {
  const automations = settings?.automations || [];

  const handleAddRule = () => {
    const newRule = {
      id: 'auto_' + Date.now(),
      condition: 'invoice_created',
      action: 'send_email',
      active: true
    };
    onUpdate({ automations: [...automations, newRule] });
  };

  const handleUpdateRule = (index, key, value) => {
    const updated = [...automations];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate({ automations: updated });
  };

  const handleRemoveRule = (index) => {
    const updated = automations.filter((_, i) => i !== index);
    onUpdate({ automations: updated });
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 border-b border-theme-border-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-theme-primary">Automation Studio</h2>
              <p className="text-xs text-theme-muted">Design If-This-Then-That logic workflows</p>
            </div>
          </div>
          <button 
            onClick={handleAddRule}
            className="px-4 py-2 bg-theme-success text-white font-bold text-xs rounded-xl shadow-lg hover:bg-theme-success/80 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
        
        {automations.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-theme-border-soft rounded-2xl bg-theme-surface/30">
            <GitMerge className="w-8 h-8 text-theme-muted mx-auto mb-3" />
            <h3 className="text-sm font-bold text-theme-primary mb-1">No Automations Active</h3>
            <p className="text-[10px] text-theme-muted mb-4">Set up automated workflows to save time on manual tasks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((rule, idx) => (
              <div key={rule.id} className="p-5 bg-theme-surface/50 border border-theme-border-soft rounded-2xl flex flex-col md:flex-row gap-4 items-center relative">
                <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
                  <div className="flex flex-col gap-1 w-full md:flex-1">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">IF (Trigger)</label>
                    <select
                      value={rule.condition}
                      onChange={(e) => handleUpdateRule(idx, 'condition', e.target.value)}
                      className="w-full bg-theme-main border border-theme-border-soft text-theme-primary text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-theme-success cursor-pointer"
                    >
                      {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-8">
                    <GitMerge className="w-4 h-4 text-theme-muted rotate-90" />
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full md:flex-1">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">THEN (Action)</label>
                    <select
                      value={rule.action}
                      onChange={(e) => handleUpdateRule(idx, 'action', e.target.value)}
                      className="w-full bg-theme-main border border-theme-border-soft text-theme-primary text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-theme-success cursor-pointer"
                    >
                      {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end border-t border-theme-border-soft pt-4 md:border-0 md:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-theme-primary">
                    <Switch 
                      checked={rule.active}
                      onChange={(checked) => handleUpdateRule(idx, 'active', checked)}
                    />
                    {rule.active ? 'ON' : 'OFF'}
                  </label>
                  <button onClick={() => handleRemoveRule(idx)} className="p-2 bg-theme-danger/10 text-theme-danger hover:bg-theme-danger/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationStudio;
