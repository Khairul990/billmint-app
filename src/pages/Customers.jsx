import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  Phone,
  Mail,
  UserPlus,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { getInvoiceBalanceDue } from '../utils/financialCalculations';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { getCustomerLabelByType } from '../config/businessPresets';
import CustomerLedger from '../components/customers/CustomerLedger';
import PremiumEmptyState from '../components/PremiumEmptyState';
import { toast } from 'react-hot-toast';

/**
 * Customers CRM and Registry Page
 * @param {Array} customers
 * @param {Function} onSaveCustomer - saves or edits customer in state/storage
 * @param {Function} onDeleteCustomer - deletes customer
 */
const Customers = ({ customers = [], invoices = [], onSaveCustomer, onDeleteCustomer, businessSettings, onCreateBill, onPaymentRecorded, setCurrentTab }) => {
  const wsType = useMemo(() => businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.type || 'retail', [businessSettings]);
  const customerLabel = getCustomerLabelByType(wsType);
  const currencySymbol = businessSettings?.currencySymbol || '$';
  const [searchQuery, setSearchQuery] = useState('');
  
  // Financial map per customer
  const customerStatsMap = useMemo(() => {
    const map = {};
    invoices.forEach(inv => {
      if (inv.isDeleted) return;
      const cid = inv.customerId || inv.customer?.id;
      const cphone = inv.customerPhone;
      const cname = (inv.customerName || '').trim().toLowerCase();
      
      const keys = [cid, cphone, cname].filter(Boolean);
      keys.forEach(k => {
        if (!map[k]) {
          map[k] = { count: 0, totalBilled: 0, totalDue: 0 };
        }
      });

      const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
      const due = getInvoiceBalanceDue(inv);

      // Add to primary key
      const primaryKey = cid || cphone || cname;
      if (primaryKey && map[primaryKey]) {
        map[primaryKey].count += 1;
        map[primaryKey].totalBilled += grandTotal;
        map[primaryKey].totalDue += due;
      }
    });
    return map;
  }, [invoices]);

  // Modals / Add-Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // --- ACTIONS ---
  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name) {
      toast.error('Please specify a client name.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        id: editingCustomer ? editingCustomer.id : null,
        name,
        phone,
        email,
        address,
      };
      await onSaveCustomer(payload);
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="font-bold mb-2">Delete this customer? This action is permanent.</p>
        <div className="flex gap-2">
          <button onClick={() => { onDeleteCustomer(id); toast.dismiss(t.id); }} className="bg-theme-danger text-white px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-theme-surface px-3 py-1 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  // Filter CRM Registry
  const filteredCustomers = useMemo(() => customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }), [customers, searchQuery]);

  const ITEMS_PER_PAGE = 30;

  const { displayCount, loadMoreRef } = useInfiniteScroll(filteredCustomers.length, ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayCount);
  }, [filteredCustomers, displayCount]);

  const handleRefresh = useCallback(async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  }, []);

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 pb-32">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="p-2 rounded-xl bg-theme-surface hover:bg-theme-border-soft transition-colors text-theme-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <div>
              <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">{customerLabel} Directory</h2>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">CRM {customerLabel.toUpperCase()} DATABASE</p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="hidden md:flex items-center justify-center gap-2 btn-premium text-xs px-5 py-2.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add {customerLabel}</span>
          </button>
          {/* Mobile floating add button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="fixed bottom-20 right-4 md:hidden z-40 flex items-center justify-center gap-2 btn-premium rounded-full p-4 shadow-lg"
            aria-label={'Add ' + customerLabel}
          >
            <UserPlus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-theme-card rounded-2xl p-2.5 border border-theme-border-soft shadow-xs flex items-center">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'Search ' + customerLabel.toLowerCase() + ' by name, contact, location...'}
              className="w-full pl-10 pr-4 py-2.5 bg-theme-surface border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-theme-accent focus:bg-theme-card transition-all text-theme-primary"
            />
          </div>
        </div>

        {/* DYNAMIC LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCustomers.map((cust) => {
          const key = cust.id || cust.phone || (cust.name || '').trim().toLowerCase();
          const stats = customerStatsMap[key] || customerStatsMap[cust.name?.trim().toLowerCase()] || { count: 0, totalBilled: 0, totalDue: 0 };

          return (
            <div key={cust.id} className="bg-theme-card rounded-2xl p-4 sm:p-5 border border-theme-border-soft hover:border-theme-border-strong hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Header with avatar, name, and status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent text-white font-black text-xs shadow-xs shrink-0">
                      {(cust.name || '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-theme-primary truncate">{cust.name}</h3>
                      {cust.phone && <p className="text-xs font-semibold text-theme-muted font-numbers">{cust.phone}</p>}
                    </div>
                  </div>

                  {stats.totalDue > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                      Due
                    </span>
                  ) : stats.count > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      Settled
                    </span>
                  ) : null}
                </div>

                {/* Financial Summary Pill */}
                {stats.count > 0 && (
                  <div className="mt-3.5 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-theme-surface/60 border border-theme-border-soft/60">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-theme-muted">Billed ({stats.count})</p>
                      <p className="text-xs font-black text-theme-primary font-numbers tabular-nums">
                        {formatCurrency(stats.totalBilled, currencySymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-theme-muted">Balance Due</p>
                      <p className={`text-xs font-black font-numbers tabular-nums ${stats.totalDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatCurrency(stats.totalDue, currencySymbol)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="mt-3 space-y-1.5 text-xs text-theme-muted">
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-theme-muted shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-theme-muted shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{cust.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-theme-border-soft" onClick={(e) => e.stopPropagation()}>
                {onCreateBill && (
                  <button onClick={() => { onCreateBill(cust); }} className="flex-1 py-1.5 bg-theme-accent text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 min-h-[32px] cursor-pointer shadow-xs">
                    <Plus className="w-3 h-3" /> Bill
                  </button>
                )}
                <button onClick={() => setLedgerCustomer(cust)} className="flex-1 py-1.5 bg-theme-surface border border-theme-border-soft hover:bg-theme-card rounded-xl text-xs font-bold text-theme-primary transition-all flex items-center justify-center gap-1 min-h-[32px] cursor-pointer">
                  <FileText className="w-3 h-3" /> Ledger
                </button>
                <button onClick={() => openEditModal(cust)} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-xl transition-all cursor-pointer" title="Edit Contact">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cust.id)} className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-all cursor-pointer" title="Delete Contact">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      

          {filteredCustomers.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3">
              <PremiumEmptyState 
                type="CUSTOMERS" 
                title={`No ${customerLabel} Found`}
                description={`Create invoices to register ${customerLabel.toLowerCase()} automatically or add them here!`}
                actionLabel={`Add ${customerLabel}`}
                onAction={openAddModal}
              />
            </div>
          )}
        </div>

        {displayCount < filteredCustomers.length && (
          <div ref={loadMoreRef} className="flex justify-center items-center py-6 w-full text-theme-muted font-bold text-sm opacity-50">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading more...
          </div>
        )}

        {/* DYNAMIC MODAL OVERLAY */}
        <BottomSheet 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingCustomer ? 'Update ' + customerLabel : 'Register New ' + customerLabel}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
            <div>
              <label className="block mb-1 text-theme-muted">{customerLabel} / Business Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Supersonic Labs"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 text-theme-muted">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 99999 88888"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
              />
            </div>

            <div>
              <label className="block mb-1 text-theme-muted">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. billing@supersonic.io"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
              />
            </div>

            <div>
              <label className="block mb-1 text-theme-muted">Billing Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 45, Science Park, Pune..."
                rows="3"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary leading-relaxed font-semibold"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-2xl font-bold hover:opacity-90 shadow-premium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
                <span>{editingCustomer ? 'Update ' + customerLabel : 'Register ' + customerLabel}</span>
              </button>
            </div>
          </form>
        </BottomSheet>

        <CustomerLedger 
          isOpen={!!ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
          customer={ledgerCustomer}
          invoices={invoices}
          onCreateBill={onCreateBill}
          onPaymentRecorded={onPaymentRecorded}
        />
      </div>
        </PullToRefresh>
    </AnimatedPage>
  );
};

export default Customers;
