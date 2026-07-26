import React, { useState, useRef, useEffect } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { UserPlus, Search, ChevronDown, ChevronRight, Check, Phone, Mail, MapPin, MessageCircle, Clock, IndianRupee, Star, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerInsightsPane from './CustomerInsightsPane';
import { getCustomerLabelByType } from '../../../config/businessPresets';

const SmartCustomerSelect = ({ customers = [] }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.businessType || 'retail';
  const customerLabel = getCustomerLabelByType(wsType);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleSelect = (customer) => {
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        whatsapp: customer.whatsapp || '',
        email: customer.email || '',
        address: customer.address || '',
        customerType: customer.customerType || 'Retail',
        previousDue: customer.previousDue || 0,
        lastOrderDate: customer.lastOrderDate || ''
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleQuickChange = (field, value) => {
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { [field]: value, id: '' } // Clear ID if editing manually
    });
    dispatch({ type: 'UPDATE_SAVE_CUSTOMER', payload: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-theme-accent" /> {customerLabel} Details
          </h2>
          {state.customer.customerType === 'VIP' && (
            <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" /> VIP
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.customer.id && (
            <>
              <span className="text-[10px] font-bold text-theme-muted bg-theme-app px-2 py-0.5 rounded border border-theme-border-soft">
                Total Orders: <span className="text-theme-primary font-black">24</span>
              </span>
              <span className="text-[10px] font-bold text-theme-muted bg-theme-app px-2 py-0.5 rounded border border-theme-border-soft">
                LTV: <span className="text-theme-success font-black">₹45,000</span>
              </span>
            </>
          )}
          {state.customer.name && !state.customer.id && (
            <span className="text-[10px] font-bold bg-theme-accent/10 text-theme-accent px-2 py-0.5 rounded-full border border-theme-accent/20">
              New {customerLabel}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Search / Name */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-theme-muted mb-1.5 ml-1">{customerLabel} Name *</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
            <input
              type="text"
              value={isOpen ? searchTerm : state.customer.name}
              onChange={(e) => {
                if (isOpen) {
                  setSearchTerm(e.target.value);
                } else {
                  handleQuickChange('name', e.target.value);
                }
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search or enter new name"
              className="w-full pl-9 pr-10 py-3 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary font-bold text-sm transition-all"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 w-full mt-2 bg-theme-card border border-theme-border-soft rounded-xl shadow-premium overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-theme-surface transition-colors text-left group"
                      >
                        <div>
                          <p className="text-sm font-bold text-theme-primary group-hover:text-theme-accent">{c.name}</p>
                          {c.phone && <p className="text-xs text-theme-muted mt-0.5">{c.phone}</p>}
                        </div>
                        {state.customer.id === c.id && <Check className="w-4 h-4 text-theme-accent" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm font-bold text-theme-primary">No {customerLabel.toLowerCase()} found</p>
                      <p className="text-xs text-theme-muted mt-1">Type to add new {customerLabel.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Phone Input */}
        <div>
          <label className="block text-xs font-bold text-theme-muted mb-1.5 ml-1">Phone Number</label>
          <div className="relative group">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
            <input
              type="tel"
              value={state.customer.phone}
              onChange={(e) => handleQuickChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary font-bold text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Select Panel */}
      {!state.customer.id && (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider mr-2 whitespace-nowrap">Quick Pick:</span>
          {customers.slice(0, 3).map((c, i) => (
            <button 
              key={c.id || i}
              onClick={() => handleSelect(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-app border border-theme-border-soft hover:border-theme-accent rounded-lg text-xs font-bold text-theme-primary transition-colors whitespace-nowrap"
            >
              {i === 0 ? <Star className="w-3 h-3 text-amber-500" /> : <History className="w-3 h-3 text-blue-500" />}
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Collapsible Advanced Details */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors pt-2"
      >
        {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {showAdvanced ? 'Hide Details' : 'Add Details'}
      </button>
      {showAdvanced && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div>
          <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-wider ml-1">WhatsApp</label>
          <div className="relative group">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              type="tel"
              value={state.customer.whatsapp || ''}
              onChange={(e) => handleQuickChange('whatsapp', e.target.value)}
              placeholder="WhatsApp No."
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-theme-app border border-theme-border-soft focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-theme-primary text-sm font-bold transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-wider ml-1">{customerLabel} Type</label>
          <div className="relative group">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
            <select
              value={state.customer.customerType || 'Retail'}
              onChange={(e) => handleQuickChange('customerType', e.target.value)}
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary text-sm font-bold transition-all cursor-pointer appearance-none"
            >
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="VIP">VIP</option>
              <option value="B2B">B2B</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-wider ml-1">Previous Due</label>
          <div className="relative group">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 transition-colors group-focus-within:text-rose-400" />
            <input
              type="number"
              value={state.customer.previousDue || ''}
              onChange={(e) => handleQuickChange('previousDue', e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-theme-app border border-theme-border-soft focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-theme-primary text-sm font-bold transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-theme-muted mb-1 uppercase tracking-wider ml-1">Last Order</label>
          <div className="relative group">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
            <input
              type="date"
              value={state.customer.lastOrderDate || ''}
              onChange={(e) => handleQuickChange('lastOrderDate', e.target.value)}
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary text-sm font-bold transition-all"
            />
          </div>
        </div>
      </motion.div>
      )}

      {/* AI Customer Insights */}
      <CustomerInsightsPane customerId={state.customer.id} />
    </div>
  );
};

export default SmartCustomerSelect;
