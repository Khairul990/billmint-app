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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Simulate initial loading for the skeleton effect
    const timer = setTimeout(() => setIsInitialLoad(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
    if (hour < 18) return { text: 'Good Afternoon', icon: '🌤️' };
    return { text: 'Good Evening', icon: '🌙' };
  };
  const greeting = getDynamicGreeting();

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

            {/* ===== HEADER & GREETING ===== */}
            <div className="flex items-center justify-between pt-2 pb-4">
              <div>
                <h1 className="text-2xl font-black text-theme-primary tracking-tight flex items-center gap-2">
                  <span>{greeting.icon}</span> {greeting.text}, {businessSettings?.ownerName?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-xs text-theme-muted font-medium mt-1">Here's what's happening with your business today.</p>
              </div>
              <button onClick={() => {
                onQuickBillOpen();
                window.dispatchEvent(new Event('trigger-confetti'));
              }} className="px-4 py-2 bg-[image:var(--accent-gradient)] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-premium-hover transition-all active:scale-95 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Create Bill
              </button>
            </div>

            {/* ===== ROW 1: KPI CARDS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
              {isInitialLoad ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm h-[140px] flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-theme-surface animate-pulse" />
                        <div className="h-3 w-24 bg-theme-surface animate-pulse rounded" />
                      </div>
                      <div className="h-8 w-32 bg-theme-surface animate-pulse rounded mb-4" />
                      <div className="flex justify-between">
                        <div className="h-3 w-12 bg-theme-surface animate-pulse rounded" />
                        <div className="h-3 w-20 bg-theme-surface animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Total Revenue */}
                  <div className="bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-theme-accent/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-theme-surface text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-theme-muted tracking-wide">Total Revenue</p>
                    </div>
                    <p className="text-3xl font-black text-theme-primary tracking-tight mb-4 tabular-nums"><AnimatedNumber value={formatCurrency(todayEarnings + totalRevenue)} /></p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+8.6%</span>
                      <span className="text-[10px] font-semibold text-theme-muted">from last month</span>
                    </div>
                  </div>

                  {/* Total Invoices */}
                  <div className="bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-theme-accent/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-theme-surface text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-theme-muted tracking-wide">Total Invoices</p>
                    </div>
                    <p className="text-3xl font-black text-theme-primary tracking-tight mb-4 tabular-nums"><AnimatedNumber value={invoices.length} /></p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+12.4%</span>
                      <span className="text-[10px] font-semibold text-theme-muted">from last month</span>
                    </div>
                  </div>

                  {/* Pending Due */}
                  <div className="bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-theme-accent/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-theme-surface text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-theme-muted tracking-wide">Pending Due</p>
                    </div>
                    <p className="text-3xl font-black text-theme-primary tracking-tight mb-4 tabular-nums"><AnimatedNumber value={formatCurrency(totalDue)} /></p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">-7.1%</span>
                      <span className="text-[10px] font-semibold text-theme-muted">from last month</span>
                    </div>
                  </div>

                  {/* Active Customers */}
                  <div className="bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-theme-accent/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-theme-surface text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-theme-muted tracking-wide">Active Customers</p>
                      <span className="ml-auto text-[10px] font-bold text-theme-muted bg-theme-surface px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                    <p className="text-3xl font-black text-theme-primary tracking-tight mb-4 tabular-nums"><AnimatedNumber value={customers.length} /></p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+3</span>
                      <span className="text-[10px] font-semibold text-theme-muted">this week</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* ===== ROW 2: CHARTS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-4">
              {/* Traffic / Revenue Trend */}
              <div className="col-span-8 bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">Revenue Trend</h3>
                    <p className="text-[11px] text-theme-muted font-medium mt-0.5">Daily revenue activity across the selected time period.</p>
                  </div>
                  <button onClick={() => setCurrentTab('reports')} className="px-3 py-1.5 border border-theme-border-soft rounded-lg flex items-center gap-2 text-[11px] font-semibold text-theme-muted hover:bg-theme-surface hover:text-theme-primary transition-colors">
                    <BarChart3 className="w-3.5 h-3.5" /> Select range <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-[280px] w-full mt-6">
                  {getRevenueTrend().length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-theme-muted">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getRevenueTrend().reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--theme-accent)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border-soft)" opacity={0.5} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--theme-muted)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--theme-muted)' }} dx={-10} />
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: 'var(--theme-primary)', fontSize: '13px', fontWeight: 700 }} />
                        <Area type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Sessions By Device / Payment Breakdown */}
              <div className="col-span-4 bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative flex flex-col">
                <h3 className="text-sm font-bold text-theme-primary mb-6">Payment Breakdown</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-[220px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPaymentBreakdown()}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {getPaymentBreakdown().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xl font-black text-theme-primary">{formatCurrency(totalCollected)}</p>
                      <p className="text-[11px] text-theme-muted font-bold uppercase mt-0.5">Collected</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-8 w-full">
                    {getPaymentBreakdown().map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                        <span className="text-xs font-bold text-theme-primary">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== ROW 3: BOTTOM AREA ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-4">
              {/* Recent Bills List */}
              <div className="col-span-8 bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative">
                <h3 className="text-sm font-bold text-theme-primary mb-1">Recent Invoices</h3>
                <p className="text-[11px] text-theme-muted font-medium mb-6">Most recent invoices generated.</p>
                <div className="space-y-5">
                  {recentInvoices.length === 0 ? (
                    <p className="text-sm text-theme-muted font-medium p-4 bg-theme-surface rounded-xl">No recent invoices.</p>
                  ) : (
                    recentInvoices.slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between group cursor-pointer p-3 rounded-xl hover:bg-theme-surface transition-colors" onClick={() => { onViewInvoice(inv); setCurrentTab('invoices'); }}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center text-theme-muted group-hover:text-theme-accent group-hover:bg-theme-accent/10 transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-theme-primary mb-0.5">{inv.customerName || 'Walk-in'}</p>
                            <p className="text-[11px] text-theme-muted font-semibold">{inv.invoiceNumber || `#${inv.id?.slice(0,6)}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="w-32 h-2 bg-theme-surface rounded-full overflow-hidden hidden sm:block">
                            <div className={`h-full ${inv.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-500' : 'bg-theme-accent'}`} style={{ width: `${Math.random() * 40 + 60}%` }} />
                          </div>
                          <p className="text-sm font-black text-theme-primary w-20 text-right tabular-nums">{formatCurrency(inv.grandTotal || 0)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Insights List */}
              <div className="col-span-4 bg-theme-card border border-theme-border-soft rounded-xl p-5 shadow-sm relative flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-theme-primary">Quick Insights</h3>
                  <button onClick={onQuickBillOpen} className="px-3 py-1.5 border border-theme-border-soft rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-theme-primary hover:bg-theme-surface transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Create
                  </button>
                </div>
                <p className="text-[11px] text-theme-muted font-medium mb-8">Metrics generating the highest engagement.</p>

                <div className="space-y-6 flex-1">
                  <div className="p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                    <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">Collection Rate</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+2.4% than last Week</p>
                  </div>
                  <div className="p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                    <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">Overdue Bills</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{totalOverdue}</p>
                    <p className="text-[10px] text-red-500 font-bold">-1.2% than last Week</p>
                  </div>
                  <div className="p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                    <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">Total Outstanding</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{formatCurrency(totalDue)}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">+5.1% than last Week</p>
                  </div>
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
