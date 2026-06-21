import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle,
  Shield, ShieldCheck, Megaphone, FileText, DollarSign, Users, Clock,
  CheckCircle, Activity, Calendar, TrendingUp, Wallet,
  BarChart3, RefreshCw, MoreHorizontal, Eye, Download,
  Search, Link, Camera, FileSpreadsheet, ListChecks,
  AlertTriangle, ChevronRight, Circle, Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore, getActiveAnnouncement } from '../services/dbEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(null);
  const strValue = String(value);
  const numericPart = strValue.replace(/[^0-9.-]/g, '');
  const prefix = strValue.replace(/[0-9.,-]/g, '');
  const numericValue = parseFloat(numericPart);

  useEffect(() => {
    if (isNaN(numericValue) || !numericValue) {
      setDisplayValue(strValue);
      return;
    }
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(prefix + Math.round(numericValue * eased).toLocaleString());
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [numericValue]);

  return <>{displayValue ?? strValue}</>;
};

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
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
  };

  const getTotalDue = () => {
    return invoices
      .filter(inv => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partial')
      .reduce((sum, inv) => sum + (inv.balanceDue || inv.dueAmount || inv.grandTotal || inv.total || 0), 0);
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

  const getRecentPayments = () => {
    return [...invoices]
      .filter(inv => inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'partial' || inv.paymentStatus === 'Partially Paid')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  };

  const getPendingCollection = () => {
    return [...invoices]
      .filter(inv => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'partial' || inv.paymentStatus === 'Partially Paid' || inv.paymentStatus === 'Pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getOverdueCount = (pending) => {
    const now = new Date();
    return pending.filter(inv => inv.dueDate && new Date(inv.dueDate) < now).length;
  };

  const getUpcomingCount = (pending) => {
    const now = new Date();
    return pending.filter(inv => inv.dueDate && new Date(inv.dueDate) >= now).length;
  };

  const getActivities = () => {
    const activities = [];
    invoices.forEach(inv => {
      activities.push({
        id: `created-${inv.id}`,
        type: 'invoice_created',
        date: new Date(inv.createdAt).getTime(),
        icon: FileText,
        iconColor: 'text-theme-accent',
        iconBg: 'bg-theme-accent/10',
        text: `${getInvoiceLabel().slice(0, -1)} ${inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`} created`,
        subtext: inv.customerName || 'Walk-in Customer',
        amount: inv.grandTotal || inv.total || 0,
      });
      if (inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid') {
        activities.push({
          id: `paid-${inv.id}`,
          type: 'payment_received',
          date: new Date(inv.updatedAt || inv.createdAt).getTime(),
          icon: CheckCircle,
          iconColor: 'text-emerald-500',
          iconBg: 'bg-emerald-500/10',
          text: `Payment received from ${inv.customerName || 'Walk-in Customer'}`,
          subtext: inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`,
          amount: inv.grandTotal || inv.total || 0,
        });
      }
    });
    return activities.sort((a, b) => b.date - a.date).slice(0, 10);
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
  const pendingBillsCount = invoices.filter(inv => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partial' || inv.paymentStatus === 'Pending').length;
  const recentInvoices = getRecentInvoices();
  const recentPayments = getRecentPayments();
  const pendingCollection = getPendingCollection();
  const totalOverdue = getOverdueCount(pendingCollection);
  const totalUpcoming = getUpcomingCount(pendingCollection);
  const activities = getActivities();
  const totalCustomers = customers.length;
  const invoiceLabel = getInvoiceLabel();
  const paidCount = invoices.filter(inv => inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid').length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
  const totalCollected = invoices
    .filter(inv => inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'partial' || inv.paymentStatus === 'Partially Paid')
    .reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);

  const getRevenueTrend = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayInv = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.toDateString() === dateStr;
      });
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayInv.reduce((s, inv) => s + (inv.grandTotal || inv.total || 0), 0),
        collection: dayInv.filter(inv => inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid').reduce((s, inv) => s + (inv.grandTotal || inv.total || 0), 0),
      });
    }
    return days;
  };

  const getPaymentBreakdown = () => {
    const paid = invoices.filter(inv => inv.paymentStatus === 'Paid' || inv.paymentStatus === 'paid').length;
    const unpaid = invoices.filter(inv => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'unpaid').length;
    const partial = invoices.filter(inv => inv.paymentStatus === 'Partial' || inv.paymentStatus === 'partial' || inv.paymentStatus === 'Partially Paid').length;
    return [
      { name: 'Paid', value: paid, color: '#10B981' },
      { name: 'Unpaid', value: unpaid, color: '#EF4444' },
      { name: 'Partial', value: partial, color: '#F59E0B' },
    ];
  };

  const revenueTrend = getRevenueTrend();
  const paymentBreakdown = getPaymentBreakdown();

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'paid') return { label: 'Paid', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (s === 'partial' || s === 'partially paid') return { label: 'Partial', classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'Due', classes: 'bg-red-500/10 text-red-500 border-red-500/20' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const KpiCard = ({ title, value, icon: Icon, trend, trendUp = true }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-theme-card border border-theme-border-soft rounded-xl p-3.5 shadow-sm hover:shadow-premium-hover transition-all duration-300 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-theme-accent/10 text-theme-accent group-hover:scale-110 transition-transform shrink-0">
          {Icon && <Icon className="w-3.5 h-3.5" />}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            <TrendingUp className={`w-2.5 h-2.5 ${!trendUp ? 'rotate-180' : ''}`} /> {trend}
          </span>
        )}
      </div>
      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-0.5">{title}</p>
      <p className="text-lg font-black text-theme-primary tracking-tight tabular-nums"><AnimatedNumber value={value} /></p>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
      <div>
        {/* ===== MOBILE VIEW (< 1024px) ===== */}
        <div className="lg:hidden px-3 sm:px-4 max-w-2xl mx-auto space-y-3 pb-4">
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
              <p className="text-2xl font-black tracking-tight tabular-nums">{formatCurrency(todayEarnings)}</p>
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm min-w-[120px] flex-1">
                  <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Total Due</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">{formatCurrency(totalDue)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm min-w-[120px] flex-1">
                  <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">Pending Bills</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">{pendingBillsCount}</p>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-theme-primary tracking-tight">
                Recent {invoiceLabel}
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
                          {formatShortDate(inv.createdAt)} • {inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-black text-theme-primary">{formatCurrency(inv.total || 0)}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${statusBadge(inv.paymentStatus).classes}`}>
                          {statusBadge(inv.paymentStatus).label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== DESKTOP VIEW (>= 1024px) ===== */}
        <div className="hidden lg:block w-full space-y-5">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

            {/* Banners Row */}
            {pendingPaymentsCount > 0 && (
              <motion.button variants={itemVariants} onClick={() => setCurrentTab('pending-payments')} className="w-full flex items-center gap-3 p-3 bg-theme-warning/10 border border-theme-warning/30 rounded-xl text-left hover:bg-theme-warning/15 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-theme-warning/20 text-theme-warning flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-theme-primary">{pendingPaymentsCount} Payment{pendingPaymentsCount > 1 ? 's' : ''} Pending Review</p>
                  <p className="text-xs text-theme-muted font-semibold">Click to review payment proofs</p>
                </div>
                <ArrowRight className="w-4 h-4 text-theme-muted shrink-0" />
              </motion.button>
            )}

            {activeAnnouncement && (
              <motion.div variants={itemVariants} className={`p-3 rounded-xl border ${activeAnnouncement.type === 'urgent' ? 'bg-theme-danger/10 border-theme-danger/30' : activeAnnouncement.type === 'info' ? 'bg-theme-accent/10 border-theme-accent/30' : 'bg-theme-warning/10 border-theme-warning/30'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-theme-accent" />
                  <p className="text-xs font-bold text-theme-accent uppercase tracking-wider">{activeAnnouncement.type === 'urgent' ? 'Important' : 'Announcement'}</p>
                </div>
                <p className="text-sm text-theme-primary font-semibold">{activeAnnouncement.message}</p>
              </motion.div>
            )}

            {['warn', 'grace', 'locked'].includes(revenueStatus.lockStatus) && (
              <motion.div variants={itemVariants} className={`p-3 rounded-xl border ${revenueStatus.lockStatus === 'warn' ? 'bg-theme-warning/10 border-theme-warning/30' : revenueStatus.lockStatus === 'grace' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-theme-danger/10 border-theme-danger/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${revenueStatus.lockStatus === 'locked' ? 'bg-theme-danger/20 text-theme-danger' : 'bg-theme-warning/20 text-theme-warning'}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-theme-primary">{revenueStatus.lockStatus === 'locked' ? 'Platform Locked' : revenueStatus.lockStatus === 'grace' ? 'Grace Period Active' : 'Payment Due Soon'}</p>
                    <p className="text-xs text-theme-muted font-semibold mt-0.5">{revenueStatus.message || 'Please update your subscription'}</p>
                  </div>
                  <button onClick={() => setCurrentTab('subscription')} className="px-3 py-1.5 bg-theme-accent text-white text-xs font-bold rounded-lg shrink-0">Renew</button>
                </div>
              </motion.div>
            )}

            {/* ===== ROW 1: PREMIUM HERO BANNER ===== */}
            <motion.div variants={itemVariants} className="bg-[image:var(--accent-gradient)] text-white rounded-2xl p-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">Welcome back,</p>
                    <h1 className="text-2xl font-black tracking-tight">{businessSettings?.businessName || 'Your Workspace'}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={onQuickBillOpen} className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-sm border border-white/10">
                      <Plus className="w-4 h-4" /> Create Bill
                    </button>
                    <button onClick={() => setCurrentTab('due-ledger')} className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-sm border border-white/10">
                      <CreditCard className="w-4 h-4" /> Collect Payment
                    </button>
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/60 mb-1">Today's Earnings</p>
                  <p className="text-4xl font-black tracking-tight tabular-nums">{formatCurrency(todayEarnings)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-base font-black mt-0.5 tabular-nums">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Today's Due</p>
                    <p className="text-base font-black mt-0.5 tabular-nums">{formatCurrency(totalDue)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Active Customers</p>
                    <p className="text-base font-black mt-0.5 tabular-nums">{totalCustomers}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== ROW 2: KPI SUMMARY ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
              <KpiCard title="Today's Revenue" value={formatCurrency(todayEarnings)} icon={DollarSign} trend={todayEarnings > 0 ? `$${todayEarnings}` : null} />
              <KpiCard title="Total Invoices" value={invoices.length} icon={FileText} trend={invoices.length > 0 ? 'All time' : null} />
              <KpiCard title="Pending Due" value={formatCurrency(totalDue)} icon={Clock} trend={totalDue > 0 ? `${pendingBillsCount} bills` : null} trendUp={false} />
              <KpiCard title="Active Customers" value={totalCustomers} icon={Users} trend={totalCustomers > 0 ? 'Total clients' : null} />
            </motion.div>

            {/* ===== ROW 3: QUICK ACTIONS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onQuickBillOpen} className="flex items-center gap-4 p-4 bg-[image:var(--accent-gradient)] text-white rounded-xl shadow-sm hover:shadow-premium-hover transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 relative z-10">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="relative z-10 text-left">
                  <p className="text-xs font-bold">Create New Bill</p>
                  <p className="text-[9px] text-white/70 font-semibold mt-0.5">Generate invoice instantly</p>
                </div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddCustomerSheet(true)} className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border-soft rounded-xl shadow-sm hover:shadow-premium-hover transition-all hover:border-theme-accent/30">
                <div className="w-10 h-10 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-theme-primary">Add Customer</p>
                  <p className="text-[9px] text-theme-muted font-semibold mt-0.5">Register new client</p>
                </div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setCurrentTab('due-ledger')} className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border-soft rounded-xl shadow-sm hover:shadow-premium-hover transition-all hover:border-amber-500/30">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-theme-primary">Collect Payment</p>
                  <p className="text-[9px] text-theme-muted font-semibold mt-0.5">Receive pending dues</p>
                </div>
              </motion.button>
            </motion.div>

            {/* ===== ROW 4: RECENT BILLS + DUE OVERVIEW ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-4">
              {/* LEFT: Recent Bills + Recent Payments */}
              <div className="col-span-8 space-y-4">
                {/* Recent Bills (table) */}
                <div className="bg-theme-card rounded-xl border border-theme-border-soft shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-theme-border-soft">
                    <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Recent {invoiceLabel}</h3>
                    <button onClick={() => setCurrentTab('invoices')} className="flex items-center gap-1 text-[9px] font-bold text-theme-accent">
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {recentInvoices.length === 0 ? (
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-theme-primary">No {invoiceLabel.toLowerCase()} yet</p>
                        <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Create your first invoice to get started</p>
                      </div>
                      <button onClick={onQuickBillOpen} className="px-3 py-1.5 bg-[image:var(--accent-gradient)] text-white text-[10px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all">+ Create</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-theme-border-soft">
                      {recentInvoices.slice(0, 4).map((inv, idx) => (
                        <motion.div
                          key={inv.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => { onViewInvoice(inv); setCurrentTab('invoices'); }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-theme-surface transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-theme-primary truncate group-hover:text-theme-accent transition-colors">{inv.customerName || 'Walk-in Customer'}</p>
                            <p className="text-[9px] text-theme-muted font-semibold">{inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`} &bull; {formatShortDate(inv.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-[11px] font-black text-theme-primary">{formatCurrency(inv.grandTotal || inv.total || 0)}</p>
                            <span className={`inline-block text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadge(inv.paymentStatus).classes}`}>{statusBadge(inv.paymentStatus).label}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Payments (compact) */}
                <div className="bg-theme-card rounded-xl border border-theme-border-soft shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Recent Payments</h3>
                  </div>
                  {recentPayments.length === 0 ? (
                    <p className="text-[10px] text-theme-muted font-semibold py-1">No payments collected yet</p>
                  ) : (
                    <div className="space-y-2">
                      {recentPayments.slice(0, 4).map((inv, idx) => (
                        <div key={inv.id} onClick={() => { onViewInvoice(inv); setCurrentTab('invoices'); }} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-theme-surface transition-colors cursor-pointer">
                          <p className="text-[10px] font-bold text-theme-primary truncate flex-1 min-w-0">{inv.customerName || 'Walk-in'}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-[10px] font-black text-emerald-500">{formatCurrency(inv.grandTotal || inv.total || 0)}</p>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Due Overview + Pending Collection */}
              <div className="col-span-4 space-y-4">
                {/* Due Overview */}
                <div className="bg-theme-card rounded-xl border border-theme-border-soft shadow-sm p-4">
                  <h3 className="text-sm font-extrabold text-theme-primary tracking-tight mb-3">Due Overview</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Total Outstanding</p>
                      <p className="text-2xl font-black text-theme-primary tabular-nums mt-0.5">{formatCurrency(totalDue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 p-2.5 rounded-xl text-center ${totalOverdue > 0 ? 'bg-red-500/10' : 'bg-theme-surface'}`}>
                        <p className={`text-base font-black ${totalOverdue > 0 ? 'text-red-500' : 'text-theme-muted'}`}>{totalOverdue}</p>
                        <p className={`text-[7px] font-bold uppercase tracking-wider ${totalOverdue > 0 ? 'text-red-500' : 'text-theme-muted/60'}`}>Overdue</p>
                      </div>
                      <div className="flex-1 p-2.5 rounded-xl bg-theme-surface text-center">
                        <p className="text-base font-black text-theme-accent">{totalUpcoming}</p>
                        <p className="text-[7px] font-bold uppercase tracking-wider text-theme-muted/60">Upcoming</p>
                      </div>
                      <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 text-center">
                        <p className="text-base font-black text-emerald-500">{paidCount}</p>
                        <p className="text-[7px] font-bold uppercase tracking-wider text-emerald-500">Paid</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] font-bold text-theme-muted">Collection Rate</p>
                      <p className="text-sm font-black text-theme-accent tabular-nums">{totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>

                {/* Pending Collection */}
                <div className="bg-theme-card rounded-xl border border-theme-border-soft shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-theme-border-soft">
                    <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Pending Collection</h3>
                    {pendingCollection.length > 0 && (
                      <button onClick={() => setCurrentTab('due-ledger')} className="text-[9px] font-bold text-theme-accent flex items-center gap-1">Open Ledger <ArrowRight className="w-3 h-3" /></button>
                    )}
                  </div>
                  {pendingCollection.length === 0 ? (
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-theme-primary">All clear!</p>
                        <p className="text-[10px] text-theme-muted font-semibold">No pending collections</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-theme-border-soft">
                      {pendingCollection.slice(0, 4).map((inv, idx) => {
                        const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                        return (
                          <div key={inv.id} onClick={() => { onViewInvoice(inv); setCurrentTab('invoices'); }} className="flex items-center gap-2 px-4 py-2.5 hover:bg-theme-surface transition-colors cursor-pointer group">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-theme-primary truncate group-hover:text-theme-accent transition-colors">{inv.customerName || 'Walk-in'}</p>
                              <p className="text-[9px] text-theme-muted font-semibold">{inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`}{inv.dueDate ? ` &bull; Due ${formatShortDate(inv.dueDate)}` : ''}</p>
                            </div>
                            <p className="text-[11px] font-black text-theme-primary">{formatCurrency(inv.balanceDue || inv.dueAmount || inv.grandTotal || inv.total || 0)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {pendingCollection.length > 4 && (
                    <button onClick={() => setCurrentTab('due-ledger')} className="w-full py-2.5 text-[9px] font-bold text-theme-accent hover:bg-theme-surface transition-colors border-t border-theme-border-soft">
                      View All {pendingCollection.length} Pending <ArrowRight className="w-3 h-3 inline-block ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ===== ROW 5: ACTIVITY FEED ===== */}
            <motion.div variants={itemVariants} className="bg-theme-card rounded-xl border border-theme-border-soft shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-theme-border-soft">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Activity Feed</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                </div>
                <span className="text-[9px] font-semibold text-theme-muted">Latest activities</span>
              </div>
              {activities.length === 0 ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">No activity yet</p>
                    <p className="text-[10px] text-theme-muted font-semibold">Activity appears as you use BillQyro</p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-theme-accent via-theme-accent/50 to-transparent rounded-full" />
                    <div className="space-y-0">
                      {activities.slice(0, 6).map((act, idx) => (
                        <div key={act.id} className="relative flex items-start gap-3 py-2">
                          <div className={`w-8 h-8 rounded-full ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 relative z-10 ring-2 ring-theme-card transition-transform hover:scale-110`}>
                            <act.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[11px] font-bold text-theme-primary">{act.text}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-theme-muted font-semibold">{act.subtext}</span>
                              {act.amount > 0 && <><span className="text-theme-border-strong">&bull;</span><span className="text-[9px] font-bold text-theme-primary">{formatCurrency(act.amount)}</span></>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ===== ROW 6: BOTTOM ANALYTICS (Revenue Chart + Payment Status) ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-4">
              <div className="col-span-8 bg-theme-card rounded-xl border border-theme-border-soft shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-theme-primary tracking-tight">Revenue Trend (7 days)</h3>
                  <button onClick={() => setCurrentTab('reports')} className="flex items-center gap-1 text-[9px] font-bold text-theme-accent">
                    Full Report <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="h-52">
                  {getRevenueTrend().length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[10px] text-theme-muted font-semibold">No data yet — create invoices to see trends</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getRevenueTrend()} barCategoryGap="16%">
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--theme-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: 'var(--theme-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: 8, fontSize: 10, fontWeight: 700 }} labelStyle={{ color: 'var(--theme-primary)' }} />
                        <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="var(--theme-accent)" />
                        <Bar dataKey="collection" name="Collected" radius={[4, 4, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="col-span-4 bg-theme-card rounded-xl border border-theme-border-soft shadow-sm p-4">
                <h3 className="text-sm font-extrabold text-theme-primary tracking-tight mb-3">Payment Status</h3>
                <div className="h-44">
                  {getPaymentBreakdown().filter(d => d.value > 0).length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[10px] text-theme-muted font-semibold">No invoices yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getPaymentBreakdown()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={60} paddingAngle={3}>
                          {getPaymentBreakdown().map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: 8, fontSize: 10, fontWeight: 700 }} labelStyle={{ color: 'var(--theme-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 mt-1">
                  {getPaymentBreakdown().map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                      <span className="text-[9px] font-bold text-theme-muted">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Install prompt */}
            {installPromptEvent && !isAppInstalled && (
              <motion.div variants={itemVariants}>
                <button onClick={onInstallApp} className="w-full py-2.5 bg-[image:var(--accent-gradient)] text-white text-[10px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
                  Install App for Offline Access
                </button>
              </motion.div>
            )}

            {/* Sync Status Bar */}
            <motion.div variants={itemVariants} className="flex items-center justify-between p-3 bg-theme-card rounded-xl border border-theme-border-soft shadow-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-theme-accent" />
                <span className="text-[10px] font-bold text-theme-primary">
                  {isAppInstalled ? 'Installed • Works offline' : 'Available offline'}
                </span>
                {installPromptEvent && !isAppInstalled && (
                  <button onClick={onInstallApp} className="ml-2 px-2.5 py-1 bg-[image:var(--accent-gradient)] text-white text-[8px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95">
                    Install App
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'Synced' ? 'bg-emerald-500' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-blue-500 animate-pulse' : syncStatus === 'Offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-[9px] font-bold text-theme-muted">{syncStatus === 'Synced' ? 'Cloud Synced' : syncStatus}</span>
              </div>
            </motion.div>

          </motion.div>
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
