import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Phone, 
  Mail, 
  UserPlus,
  MapPin
} from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../services/dbEngine';
import CustomerLedger from '../components/customers/CustomerLedger';

/**
 * Customers CRM and Registry Page
 * @param {Array} customers
 * @param {Function} onSaveCustomer - saves or edits customer in state/storage
 * @param {Function} onDeleteCustomer - deletes customer
 */
const Customers = ({ customers = [], invoices = [], onSaveCustomer, onDeleteCustomer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Add-Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!name) {
      alert('Please specify a client name.');
      return;
    }

    const payload = {
      id: editingCustomer ? editingCustomer.id : null,
      name,
      phone,
      email,
      address,
    };

    onSaveCustomer(payload);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this customer? This action is permanent.')) {
      onDeleteCustomer(id);
    }
  };

  // Filter CRM Registry
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 pb-24">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Customer Directory</h2>
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">CRM CLIENT DATABASE</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* SEARCH CARD */}
        <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center justify-between">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, contact, location..."
              className="w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
            />
          </div>
        </div>

        {/* DYNAMIC LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredCustomers.map((cust) => (
            <div 
              key={cust.id}
              onClick={() => setLedgerCustomer(cust)}
              className="bg-theme-card dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-3xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative flex flex-col justify-between cursor-pointer group"
            >
              {/* Top section: Avatar and Actions */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent-light border border-theme-border-soft flex items-center justify-center font-extrabold text-theme-accent text-sm group-hover:scale-105 transition-transform">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight leading-none">{cust.name}</h3>
                      <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-1 inline-block">Client Contact</span>
                    </div>
                  </div>

                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id)}
                      className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5 rounded-xl transition-all"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle Section: Meta Info */}
                <div className="mt-5 space-y-2 text-xs font-semibold text-theme-muted leading-none">
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-theme-muted" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-theme-muted" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-start gap-2 leading-relaxed mt-1 text-theme-muted font-medium">
                      <MapPin className="w-3.5 h-3.5 text-theme-muted shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-theme-card dark:bg-theme-card rounded-3xl p-12 border border-theme-border-soft dark:border-theme-border-soft text-center shadow-premium">
              <Users className="w-12 h-12 text-theme-primary mx-auto mb-3 animate-pulse" />
              <h4 className="font-extrabold text-theme-primary dark:text-theme-muted">No customers added</h4>
              <p className="text-xs text-theme-muted font-semibold mt-1 max-w-xs mx-auto">
                No customers found. Create invoices to register customers automatically or add them here!
              </p>
            </div>
          )}
        </div>

        {/* DYNAMIC MODAL OVERLAY */}
        <BottomSheet 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingCustomer ? 'Update CRM Contact' : 'Register New Client'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
            <div>
              <label className="block mb-1 text-theme-muted">Customer / Business Name</label>
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
                className="w-full py-4 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-2xl font-bold hover:opacity-90 shadow-md shadow-theme-glow hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingCustomer ? 'Update Contact' : 'Register Contact'}</span>
              </button>
            </div>
          </form>
        </BottomSheet>

        <CustomerLedger 
          isOpen={!!ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
          customer={ledgerCustomer}
          invoices={invoices}
        />
      </div>
    </PullToRefresh>
  );
};

export default Customers;
