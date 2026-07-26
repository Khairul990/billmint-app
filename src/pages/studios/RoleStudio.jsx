import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, Check, Users, Lock } from 'lucide-react';

const ROLES = [
  { id: 'manager', label: 'Store Manager', desc: 'Can manage invoices, customers, and view reports, but cannot change settings.' },
  { id: 'cashier', label: 'Cashier / Staff', desc: 'Can create invoices and accept payments. Cannot edit past data or see reports.' }
];

const PERMISSIONS = [
  { id: 'create_invoice', label: 'Create Invoices' },
  { id: 'edit_invoice', label: 'Edit/Delete Invoices' },
  { id: 'view_reports', label: 'View Financial Reports' },
  { id: 'manage_customers', label: 'Manage Customers' },
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'access_settings', label: 'Access Settings Studio' }
];

const RoleStudio = ({ settings, onUpdate }) => {
  const rolePermissions = settings?.rolePermissions || {
    manager: ['create_invoice', 'edit_invoice', 'view_reports', 'manage_customers', 'manage_products'],
    cashier: ['create_invoice', 'manage_customers']
  };

  const handleTogglePermission = (roleId, permissionId) => {
    const current = rolePermissions[roleId] || [];
    const updated = current.includes(permissionId) 
      ? current.filter(p => p !== permissionId)
      : [...current, permissionId];
      
    onUpdate({ rolePermissions: { ...rolePermissions, [roleId]: updated } });
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6 border-b border-theme-border-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-danger/10 text-theme-danger flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-theme-primary">Role & Permission Studio</h2>
              <p className="text-xs text-theme-muted">Define access control for your team members</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-warning/10 border border-theme-warning/20 rounded-xl p-4 mb-6 flex gap-3 items-start">
          <ShieldAlert className="w-5 h-5 text-theme-warning shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-theme-warning mb-1">Owner Privileges Fixed</h3>
            <p className="text-[10px] text-theme-warning/80 leading-relaxed">
              The 'Owner' role has unrestricted access to all modules, billing, and settings. You cannot modify Owner permissions. Use this studio to restrict access for secondary accounts (e.g. your staff).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ROLES.map(role => (
            <div key={role.id} className="bg-theme-surface/50 border border-theme-border-soft rounded-2xl p-5 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-theme-muted" />
                <h3 className="text-sm font-bold text-white">{role.label}</h3>
              </div>
              <p className="text-[10px] text-theme-muted mb-4 h-6">{role.desc}</p>
              
              <div className="space-y-2 border-t border-theme-border-soft pt-4 mt-2">
                {PERMISSIONS.map(perm => {
                  const hasPerm = rolePermissions[role.id]?.includes(perm.id);
                  // Hardcode settings block for non-owners unless explicitly enabled (usually blocked in real app logic, here we just show it)
                  const isDangerous = perm.id === 'access_settings' || perm.id === 'edit_invoice';
                  
                  return (
                    <button 
                      key={perm.id}
                      onClick={() => handleTogglePermission(role.id, perm.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-theme-main transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isDangerous && <Lock className="w-3 h-3 text-theme-danger" />}
                        <span className={`text-xs ${hasPerm ? 'text-white font-bold' : 'text-theme-muted'}`}>{perm.label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hasPerm ? 'bg-theme-danger border-theme-danger' : 'bg-transparent border-theme-border-soft'}`}>
                        {hasPerm && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleStudio;
