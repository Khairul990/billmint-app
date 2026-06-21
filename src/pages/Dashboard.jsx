import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle, Shield, Megaphone, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore, getActiveAnnouncement } from '../services/dbEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';

const Dashboard = ({
  invoices = [],
  customers = [],
  products = [],
  expenses = [],
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDownloadPDF,
  setCurrentTab,
  businessSettings,
  installPromptEvent = null,
  isAppInstalled = false,
  onInstallApp,
  onSaveCustomer,
  subscription = {},
  onQuickBillOpen,
  pendingPaymentsCount = 0,
  syncStatus = 'Synced',
  isLoading = false,
  revenueStatus = {}
}) => {
  const [showAddCustomerSheet, setShowAddCustomerSheet] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  useEffect(() => {
    const loadAnnouncement = async () => {
      const ann = await getActiveAnnouncement();
      if (ann) setActiveAnnouncement(ann);
    };
    loadAnnouncement();
  }, []);

  const getTodaysSales = () => {
    const today = new Date();
    return invoices
      .filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.toDateString() === today.toDateString();
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  };

  const getTotalDue = () => {
    return invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.dueAmount || inv.total || 0), 0);
  };

  const getInvoiceLabel = () => {
    const wsType = businessSettings?.businessWorkspaces?.find(
      ws => ws.id === businessSettings.activeWorkspaceId
    )?.type || 'retail';
    const labels = {
      retail: 'Invoices',
      clinic: 'Prescriptions',
      studio: 'Projects',
      garage: 'Job Cards',
      salon: 'Service Slips',
      education: 'Fee Bills',
      default: 'Bills'
    };
    return labels[wsType] || labels.default;
  };

  const getRecentInvoices = () => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const handleRefresh = async () => {
    try {
      await syncFromFirestore();
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const todayEarnings = getTodaysSales();
  const totalDue = getTotalDue();
  const recentInvoices = getRecentInvoices();

  return (
    <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
      <div className="px-3 sm:px-4 max-w-2xl mx-auto space-y-3 pb-4">

        {/* Pending Payments Banner */}
        {pendingPaymentsCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setCurrentTab('pending-payments')}
            className="w-full flex items-center gap-3 p-3 bg-theme-warning/10 border border-theme-warning/30 rounded-2xl text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-theme-warning/20 text-theme-warning flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-theme-primary">{pendingPaymentsCount} Payment{pendingPaymentsCount > 1 ? 's' : ''} Pending Review</p>
              <p className="text-xs text-theme-muted font-semibold">Tap to review payment proofs</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0" />
          </motion.button>
        )}

        {/* Announcement */}
        {activeAnnouncement && (
          <div className={`p-3 rounded-2xl border ${
            activeAnnouncement.type === 'urgent' ? 'bg-theme-danger/10 border-theme-danger/30' :
            activeAnnouncement.type === 'info' ? 'bg-theme-accent/10 border-theme-accent/30' :
            'bg-theme-warning/10 border-theme-warning/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-4 h-4 text-theme-accent" />
              <p className="text-xs font-bold text-theme-accent uppercase tracking-wider">
                {activeAnnouncement.type === 'urgent' ? 'Important' : 'Announcement'}
              </p>
            </div>
            <p className="text-sm text-theme-primary font-semibold">{activeAnnouncement.message}</p>
          </div>
        )}

        {/* Revenue Lock Banner */}
        {['warn', 'grace', 'locked'].includes(revenueStatus.lockStatus) && (
          <div className={`p-4 rounded-2xl border ${
            revenueStatus.lockStatus === 'warn' ? 'bg-theme-warning/10 border-theme-warning/30' :
            revenueStatus.lockStatus === 'grace' ? 'bg-orange-500/10 border-orange-500/30' :
            'bg-theme-danger/10 border-theme-danger/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                revenueStatus.lockStatus === 'locked' ? 'bg-theme-danger/20 text-theme-danger' : 'bg-theme-warning/20 text-theme-warning'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-theme-primary">
                  {revenueStatus.lockStatus === 'locked' ? 'Platform Locked' :
                   revenueStatus.lockStatus === 'grace' ? 'Grace Period Active' : 'Payment Due Soon'}
                </p>
                <p className="text-xs text-theme-muted font-semibold mt-0.5">{revenueStatus.message || 'Please update your subscription'}</p>
              </div>
              {revenueStatus.lockStatus !== 'locked' && (
                <button onClick={() => setCurrentTab('subscription')} className="px-3 py-1.5 bg-theme-accent text-white text-xs font-bold rounded-xl shrink-0">
                  Renew
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== PREMIUM HERO CARD ===== */}
        <div className="bg-[image:var(--accent-gradient)] text-white rounded-2xl p-4 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black tracking-widest text-white/70 uppercase">
                {businessSettings?.businessName || 'Dashboard'}
              </p>
              <span className="text-[8px] font-bold text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                Today's Collection
              </span>
            </div>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(todayEarnings)}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Total Due</p>
                <p className="text-base font-black mt-0.5">{formatCurrency(totalDue)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Pending Bills</p>
                <p className="text-base font-black mt-0.5">{pendingPaymentsCount || 0}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={onQuickBillOpen} className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl py-2.5 font-bold text-xs transition-colors active:scale-[0.98]">
                <Plus className="w-3.5 h-3.5" />
                New Bill
              </button>
              <button onClick={() => setCurrentTab('due-ledger')} className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl py-2.5 font-bold text-xs transition-colors active:scale-[0.98]">
                <CreditCard className="w-3.5 h-3.5" />
                Collect Due
              </button>
            </div>
          </div>
        </div>

        {/* Sync Status Bar */}
        <div className="flex items-center justify-between p-2.5 bg-theme-card rounded-xl border border-theme-border-soft">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-[10px] font-bold text-theme-primary">
              {isAppInstalled ? 'Installed' : 'Works offline'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-theme-muted">
            {syncStatus === 'Synced' ? 'Cloud Synced' : syncStatus}
          </span>
        </div>

        {/* ===== HOME FEED: Recent Bills ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-extrabold text-theme-primary tracking-tight">
              Recent {getInvoiceLabel()}
            </h2>
            {invoices.length > 5 && (
              <button onClick={() => setCurrentTab('invoices')} className="flex items-center gap-1 text-[10px] font-bold text-theme-accent">
                View All
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {recentInvoices.length === 0 ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onQuickBillOpen}
              className="w-full py-8 bg-theme-card rounded-2xl border border-dashed border-theme-border-soft flex flex-col items-center gap-3 text-center hover:border-theme-accent/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-theme-primary">Create your first bill</p>
                <p className="text-[11px] text-theme-muted font-semibold mt-0.5">Tap to get started</p>
              </div>
              <div className="mt-1 px-4 py-2 bg-[image:var(--accent-gradient)] text-white text-xs font-bold rounded-xl shadow-md">
                + Create Bill
              </div>
            </motion.button>
          ) : (
            <div className="space-y-1.5">
              {recentInvoices.map((inv, idx) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => {
                    onViewInvoice(inv);
                    setCurrentTab('invoices');
                  }}
                  className="p-3.5 bg-theme-card rounded-xl border border-theme-border-soft active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-theme-primary truncate">
                        {inv.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-[10px] text-theme-muted font-semibold mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-black text-theme-primary">{formatCurrency(inv.total || 0)}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${
                        inv.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                        inv.status === 'partial' ? 'bg-theme-warning/10 text-theme-warning' :
                        'bg-theme-danger/10 text-theme-danger'
                      }`}>
                        {inv.status === 'paid' ? 'Paid' : inv.status === 'partial' ? 'Partial' : 'Due'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddCustomerSheet
        isOpen={showAddCustomerSheet}
        onClose={() => setShowAddCustomerSheet(false)}
        onSave={async (customerData) => {
          await onSaveCustomer(customerData);
          setShowAddCustomerSheet(false);
        }}
        businessSettings={businessSettings}
      />
    </PullToRefresh>
  );
};

export default Dashboard;
