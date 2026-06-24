import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Plus, Search, X, CheckCircle2, Clock, Truck, Ban,
  Package, TrendingUp, User, Calendar, Hash, Loader2, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';
import { CardSkeleton } from '../components/PremiumSkeleton';
import { toast } from 'react-hot-toast';
const getOrders = async () => { try { const d = localStorage.getItem('billqyro_orders'); return d ? JSON.parse(d) : []; } catch { return []; } };
const saveOrder = async (order) => { const orders = await getOrders(); const idx = orders.findIndex(o => o.id === order.id); if (idx >= 0) orders[idx] = order; else orders.push(order); localStorage.setItem('billqyro_orders', JSON.stringify(orders)); window.dispatchEvent(new Event('billqyro_sync')); };
const deleteOrder = async (id) => { const orders = await getOrders(); localStorage.setItem('billqyro_orders', JSON.stringify(orders.filter(o => o.id !== id))); };
const ORDER_STATUSES = ['All', 'Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];

const STATUS_STYLES = {
  'Pending': 'bg-amber-100 text-amber-700 border border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Delivered': 'bg-violet-100 text-violet-700 border border-violet-200',
  'Cancelled': 'bg-rose-100 text-rose-700 border border-rose-200'
};

const STATUS_ICONS = {
  'Pending': Clock, 'In Progress': Loader2, 'Completed': CheckCircle2, 'Delivered': Truck, 'Cancelled': Ban
};

const STATUS_FLOW = {
  'Pending': ['In Progress', 'Cancelled'],
  'In Progress': ['Completed'],
  'Completed': ['Delivered'],
  'Delivered': [],
  'Cancelled': []
};

const deriveOrders = (invoices) =>
  (invoices || []).filter(inv => inv.orderStatus).map(inv => ({
    ...inv,
    itemsCount: (inv.items || []).reduce((sum, it) => sum + (parseInt(it.qty) || 1), 0)
  })).sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

const StatusBadge = ({ status }) => {
  const Icon = STATUS_ICONS[status] || Package;
  return (
    <span className={`badge-premium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[status] || 'bg-theme-surface text-theme-muted border border-theme-border-soft'}`}>
      <Icon className={`w-3 h-3 ${status === 'In Progress' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
};

const Orders = ({ invoices = [], customers = [], businessSettings, setCurrentTab }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [notes, setNotes] = useState('');

  const currencySymbol = businessSettings?.currency || '₹';

  useEffect(() => { loadOrders(); }, [invoices]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const fromDb = await getOrders();
      setOrders(fromDb && fromDb.length > 0 ? fromDb : deriveOrders(invoices));
    } catch { setOrders(deriveOrders(invoices)); }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'Pending').length,
      inProgress: orders.filter(o => o.orderStatus === 'In Progress').length,
      thisMonth: orders.filter(o => {
        const d = new Date(o.date || o.createdAt || 0);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.orderStatus === 'Completed';
      }).length
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'All') list = list.filter(o => o.orderStatus === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.invoiceNumber || o.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    try { await syncFromFirestore(); window.dispatchEvent(new Event('billqyro_sync')); toast.success('Orders refreshed'); }
    catch { toast.error('Sync failed'); }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    setSubmitting(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      const payload = {
        id: 'ord-' + Date.now(),
        invoiceNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        customerId: selectedCustomer,
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || '',
        customerEmail: customer?.email || '',
        customerAddress: customer?.address || '',
        items: [], itemsCount: 0, grandTotal: 0, amountPaid: 0, balanceDue: 0,
        orderStatus: 'Pending', paymentStatus: 'Unpaid',
        notes: notes || '', createdAt: new Date().toISOString()
      };
      await saveOrder(payload);
      toast.success('Order created! Add items from invoice.');
      setShowCreateModal(false);
      setSelectedCustomer('');
      setNotes('');
      loadOrders();
      if (setCurrentTab && typeof setCurrentTab === 'function') setCurrentTab('invoices');
    } catch { toast.error('Failed to create order'); }
    finally { setSubmitting(false); }
  };

  const updateOrderStatus = async (order, newStatus) => {
    const prev = toast.loading(`Updating to ${newStatus}...`);
    try {
      const updated = { ...order, orderStatus: newStatus, updatedAt: new Date().toISOString() };
      await saveOrder(updated);
      setOrders(p => p.map(o => o.id === order.id ? updated : o));
      toast.success(`Order marked as ${newStatus}`, { id: prev });
    } catch { toast.error('Failed to update status', { id: prev }); }
  };

  const handleDeleteOrder = (id) => {
    toast((t) => (
      <div>
        <p className="font-bold mb-2">Delete this order? This action is permanent.</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            try { await deleteOrder(id); setOrders(p => p.filter(o => o.id !== id)); toast.dismiss(t.id); toast.success('Order deleted'); }
            catch { toast.error('Delete failed'); }
          }} className="bg-theme-danger text-white px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-theme-surface px-3 py-1 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  if (loading) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="stat-premium"><CardSkeleton lines={2} /></div>)}
      </div>
      <div className="card-premium"><CardSkeleton lines={6} /></div>
    </motion.div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-header text-xl font-extrabold text-theme-primary tracking-tight">Orders</h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">MANAGE ORDER FULFILLMENT</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="btn-premium flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /><span>Create Order</span>
        </button>
      </div>

      {/* STAT CARDS */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-theme-accent', bg: 'bg-theme-accent-light' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Completed (Month)', value: stats.thisMonth, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map(stat => (
          <motion.div key={stat.label} variants={staggerItem}
            className="stat-premium bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="chip-premium text-[10px] font-bold text-theme-muted uppercase tracking-wider bg-theme-surface px-2 py-0.5 rounded-full">
                {stat.label === 'Completed (Month)' ? 'This Month' : 'Count'}
              </span>
            </div>
            <p className="text-2xl font-black text-theme-primary tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-bold text-theme-muted mt-1 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* SEARCH & FILTER */}
      <div className="card-premium bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft shadow-premium space-y-4">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or customer name..."
            className="input-premium w-full pl-10 pr-4 py-2.5 bg-theme-app border border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card transition-all text-theme-primary" />
        </div>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map(status => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? 'bg-theme-accent text-white shadow-md'
                  : 'bg-theme-surface text-theme-muted border border-theme-border-soft hover:bg-theme-accent/10'
              }`}>{status}</button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Order Registry</h3>
          <span className="chip-premium text-[10px] text-theme-muted font-bold uppercase tracking-wider bg-theme-surface px-2 py-0.5 rounded-full">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="empty-state bg-theme-card rounded-3xl p-12 border border-theme-border-soft text-center shadow-premium">
              <div className="w-20 h-20 mx-auto mb-4 bg-theme-accent/10 rounded-[2rem] flex items-center justify-center">
                <Package className="w-10 h-10 text-theme-accent" />
              </div>
              <h4 className="font-extrabold text-theme-primary text-lg">
                {searchQuery || statusFilter !== 'All' ? 'No Orders Found' : 'No Orders Yet'}
              </h4>
              <p className="text-xs text-theme-muted font-semibold mt-1 max-w-xs mx-auto">
                {searchQuery || statusFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Create your first order to start tracking fulfillment.'}
              </p>
              {!searchQuery && statusFilter === 'All' && (
                <button onClick={() => setShowCreateModal(true)}
                  className="btn-premium mt-6 inline-flex items-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Plus className="w-4 h-4" /><span>Create First Order</span>
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredOrders.map(order => {
                const actions = STATUS_FLOW[order.orderStatus] || [];
                return (
                  <motion.div key={order.id} layout variants={staggerItem} initial="hidden" animate="visible"
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium hover:shadow-premium-hover transition-all duration-300 relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-theme-accent-light border border-theme-border-soft flex items-center justify-center text-theme-accent">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-theme-primary tracking-tight leading-tight">{order.customerName || 'Unknown'}</h3>
                            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 inline-block">{order.invoiceNumber || order.id}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5 rounded-xl transition-all tooltip-premium" title="Delete Order">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <StatusBadge status={order.orderStatus} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="chip-premium inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-theme-app text-theme-muted border border-theme-border-soft">
                            <Hash className="w-3 h-3" />{order.itemsCount || 0} items
                          </span>
                          <span className="chip-premium inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-theme-app text-theme-muted border border-theme-border-soft">
                            <Calendar className="w-3 h-3" />{order.date || new Date(order.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {order.customerPhone && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-theme-muted">
                            <User className="w-3 h-3" />{order.customerPhone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-theme-border-soft/60 pt-4 mt-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-theme-muted font-extrabold uppercase tracking-wider">Order Total</span>
                        <span className="text-base font-black text-theme-accent">{formatCurrency(order.grandTotal || 0, currencySymbol)}</span>
                      </div>
                      {actions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {actions.map(action => (
                            <button key={action} onClick={() => updateOrderStatus(order, action)}
                              className="flex-1 min-w-0 text-center px-2 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white hover:scale-[1.02] active:scale-[0.98]">{action}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CREATE ORDER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => !submitting && setShowCreateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-premium w-full max-w-lg pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-theme-border-soft">
                  <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Create New Order</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-xl transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-theme-muted uppercase tracking-wider">Select Customer</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} required
                        className="input-premium w-full pl-10 pr-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold text-xs appearance-none">
                        <option value="">-- Choose Customer --</option>
                        {(customers || []).map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-theme-muted uppercase tracking-wider">Order Notes (Optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special instructions, delivery notes..." rows={3}
                      className="input-premium w-full px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary text-xs font-semibold" />
                  </div>
                  <div className="bg-theme-accent/5 border border-theme-accent/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-theme-primary">Order Created as Pending</p>
                        <p className="text-[10px] text-theme-muted font-semibold mt-1">After creating, add items from the Invoices page. Status starts as Pending.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} disabled={submitting}
                      className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold border border-theme-border-soft text-theme-muted hover:bg-theme-surface transition-all">Cancel</button>
                    <button type="submit" disabled={submitting || !selectedCustomer}
                      className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>{submitting ? 'Creating...' : 'Create Order'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Orders;
