import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Search, FileText, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useInvoice } from '../../../../contexts/InvoiceContext';
import { invoiceTemplates } from '../../../../config/invoiceTemplates';
import { getCustomerLabelByType } from '../../../../config/businessPresets';

const CustomerSelectionStep = ({ customers = [] }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.businessType || 'retail';
  const customerLabel = getCustomerLabelByType(wsType);
  const { customer, saveCustomer } = state;
  const [searchTerm, setSearchTerm] = useState('');

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    if (custId === '') {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: { id: '', name: '', phone: '', email: '', address: '' } });
      return;
    }
    const client = customers.find(c => c.id === custId);
    if (client) {
      dispatch({ 
        type: 'UPDATE_CUSTOMER', 
        payload: { id: client.id, name: client.name, phone: client.phone || '', email: client.email || '', address: client.address || '' } 
      });
      setSearchTerm('');
    }
  };

  const handleFieldChange = (field, value) => {
    dispatch({ 
      type: 'UPDATE_CUSTOMER', 
      payload: { [field]: value } 
    });
  };

  return (
    <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-premium h-full flex flex-col overflow-y-auto">
      {/* TEMPLATE SELECTOR */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-theme-primary">
          <FileText className="w-5 h-5 text-theme-accent" />
          বিল টেমপ্লেট নির্বাচন করুন
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {invoiceTemplates.map((template) => {
            const IconComponent = Icons[template.icon];
            return (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch({ type: 'SET_TEMPLATE', payload: template.id })}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden flex flex-col items-start
                  ${state.selectedTemplate === template.id
                    ? `border-theme-accent bg-theme-accent/5 shadow-lg`
                    : 'border-theme-border-soft hover:border-theme-accent/50 bg-theme-surface'
                  }
                `}
              >
                {IconComponent && <IconComponent className={`w-8 h-8 mb-2 ${state.selectedTemplate === template.id ? 'text-theme-accent' : 'text-theme-muted'}`} />}
                <p className="font-bold text-sm text-theme-primary">{template.name}</p>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">{template.nameEn}</p>
                
                {/* Selected indicator */}
                {state.selectedTemplate === template.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <Check className="w-5 h-5 text-theme-accent" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 border-t border-theme-border-soft pt-6">
        <h2 className="text-xl font-extrabold text-theme-primary">{customerLabel} Details</h2>
        <p className="text-sm text-theme-muted font-medium mt-1">Select an existing {customerLabel.toLowerCase()} or enter new details.</p>
      </div>

      {customers.length > 0 && (
        <div className="mb-8 p-4 bg-theme-surface rounded-2xl border border-theme-border-soft">
          <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-3">Quick Select</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <select
              value={customer.id || ''}
              onChange={handleCustomerSelect}
              className="w-full pl-10 pr-4 py-3 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary appearance-none"
            >
              <option value="">-- Add New {customerLabel} --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
        {/* Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">{customerLabel} Name <span className="text-theme-danger">*</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              value={customer.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g. Acme Corp"
              className={`w-full pl-10 pr-4 py-3.5 bg-theme-surface border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition-all ${!customer.name && customer.id === '' ? 'border-theme-warning/50 focus:border-theme-warning text-theme-primary' : 'border-theme-border-soft focus:border-theme-accent text-theme-primary'}`}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Phone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full pl-10 pr-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="email"
              value={customer.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="e.g. client@example.com"
              className="w-full pl-10 pr-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Address</label>
          <div className="relative h-full">
            <MapPin className="absolute left-4 top-4 w-4 h-4 text-theme-muted" />
            <textarea
              value={customer.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Billing Address..."
              rows={3}
              className="w-full pl-10 pr-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary resize-none"
            />
          </div>
        </div>
      </div>

      {!customer.id && customer.name && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-theme-accent-light border border-theme-accent/20 rounded-2xl flex items-center justify-between"
        >
          <div>
          <p className="text-sm font-bold text-theme-primary">Save {customerLabel} to CRM?</p>
          <p className="text-xs font-medium text-theme-muted">Save this {customerLabel.toLowerCase()} for faster billing next time.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={saveCustomer} onChange={(e) => dispatch({ type: 'UPDATE_SAVE_CUSTOMER', payload: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-theme-border-strong rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-theme-border-soft after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-accent"></div>
          </label>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerSelectionStep;
