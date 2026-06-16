import React, { useState, useRef, useEffect } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { UserPlus, Search, ChevronDown, Check, Phone, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerInsightsPane from './CustomerInsightsPane';

const SmartCustomerSelect = ({ customers = [] }) => {
  const { state, dispatch } = useInvoice();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
        email: customer.email || '',
        address: customer.address || ''
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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-theme-accent" /> Customer Details
        </h2>
        {state.customer.name && !state.customer.id && (
          <span className="text-[10px] font-bold bg-theme-accent/10 text-theme-accent px-2 py-0.5 rounded-full">
            New Customer (Auto-Save)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Search / Name */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-theme-muted mb-1.5 ml-1">Customer Name *</label>
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
                      <p className="text-sm font-bold text-theme-primary">No matches found</p>
                      <p className="text-xs text-theme-muted mt-1">Press enter or click away to create new</p>
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

      {/* Advanced Details (Collapsible or always visible if populated) */}
      {(state.customer.email || state.customer.address || state.customer.id) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
              <input
                type="email"
                value={state.customer.email}
                onChange={(e) => handleQuickChange('email', e.target.value)}
                placeholder="Email Address (Optional)"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted transition-colors group-focus-within:text-theme-accent" />
              <input
                type="text"
                value={state.customer.address}
                onChange={(e) => handleQuickChange('address', e.target.value)}
                placeholder="Billing Address (Optional)"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-theme-app border border-theme-border-soft focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none text-theme-primary text-sm transition-all"
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
