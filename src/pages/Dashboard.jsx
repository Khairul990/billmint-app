import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle,
  Shield, ShieldCheck, Megaphone, FileText, DollarSign, Users, Clock,
  CheckCircle, Activity, Calendar, TrendingUp, Wallet,
  BarChart3, RefreshCw, MoreHorizontal, Eye, Download,
  Search, Link, Camera, FileSpreadsheet, ListChecks,
  AlertTriangle, ChevronRight, Circle, Briefcase,
  Zap, Target, Percent, Building2, Smartphone, Globe,
  ArrowUpRight, ArrowDownRight, Timer, TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { analyticsEngine } from '../services/analyticsEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';
import StatCard from '../components/StatCard';
import { KPISkeleton, ChartSkeleton } from '../components/PremiumSkeleton';
import ActivityFeed from '../components/ActivityFeed';
import QuickActions from '../components/QuickActions';
import PremiumEmptyState from '../components/PremiumEmptyState';

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
    let rafId;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(prefix + Math.round(numericValue * eased).toLocaleString());
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [numericValue]);

  return <>{displayValue ?? strValue}</>;
};

const MiniHealthCircle = ({ value, label }) => {
  const size = 44;
  const sw = 4;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 70 ? 'var(--theme-success)' : value >= 40 ? 'var(--theme-warning)' : 'var(--theme-danger)';
  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className="relative transition-transform duration-300 group-hover:scale-110" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--theme-border-soft)" strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black tabular-nums" style={{ color }}>{value}</span>
        </div>
      </div>
      <span className="text-[7px] font-bold text-theme-muted uppercase tracking-wider text-center leading-tight">{label}</span>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, trend, trendUp = true }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }}
    className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-premium-sm hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group"
  >
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 rounded-lg bg-theme-accent/10 text-theme-accent group-hover:scale-105 transition-transform shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5" />}
      </div>
      {trend && (
        <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${trendUp ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-danger/10 text-theme-danger'}`}>
          <TrendingUp className={`w-2.5 h-2.5 ${!trendUp ? 'rotate-180' : ''}`} /> {trend}
        </span>
      )}
    </div>
    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-1">{title}</p>
    <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums"><AnimatedNumber value={value} /></p>
  </motion.div>
);

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
  revenueStatus = {},
  permissions = null,
  workspaceVerified = false
}) => {
  const [showAddCustomerSheet, setShowAddCustomerSheet] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
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
      const ann = await analyticsEngine.getActiveAnnouncement();
      if (ann) setActiveAnnouncement(ann);
    };
    loadAnnouncement();
  }, []);

  const calculatedTodaysSales = useMemo(() => {
    const today = new Date().toDateString();
    return invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === today)
      .reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
  }, [invoices]);

  const calculatedTodaysCollections = useMemo(() => {
    const today = new Date().toDateString();
    return invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === today)
      .reduce((sum, inv) => {
        const s = (inv.paymentStatus || '').toLowerCase();
        if (s === 'paid') return sum + (inv.grandTotal || inv.total || 0);
        if (s === 'partial' || s === 'partially paid') return sum + (parseFloat(inv.amountPaid) || 0);
        return sum;
      }, 0);
  }, [invoices]);

  const calculatedTotalDue = useMemo(() => {
    return invoices
      .filter(inv => {
        const s = (inv.paymentStatus || '').toLowerCase();
        return s === 'unpaid' || s === 'partial' || s === 'partially paid';
      })
      .reduce((sum, inv) => {
        const total = inv.grandTotal || inv.total || 0;
        const paid = parseFloat(inv.amountPaid) || 0;
        return sum + Math.max(0, total - paid);
      }, 0);
  }, [invoices]);

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
      .filter(inv => {
        const s = (inv.paymentStatus || '').toLowerCase();
        return s === 'paid' || s === 'partial' || s === 'partially paid';
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  };

  const getPendingCollection = () => {
    return [...invoices]
      .filter(inv => {
        const s = (inv.paymentStatus || '').toLowerCase();
        return s === 'unpaid' || s === 'partial' || s === 'partially paid' || s === 'pending';
      })
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
          iconColor: 'text-theme-success',
          iconBg: 'bg-theme-success/10',
          text: `Payment received from ${inv.customerName || 'Walk-in Customer'}`,
          subtext: inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`,
          amount: inv.grandTotal || inv.total || 0,
        });
      }
    });
    return activities.sort((a, b) => b.date - a.date).slice(0, 10);
  };

  useEffect(() => {
    setLastSyncTime(new Date());
  }, []);

  const handleRefresh = async () => {
    try {
      await invoiceEngine.syncFromCloud();
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const newCustomersThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return customers.filter(c => c.createdAt && new Date(c.createdAt) >= startOfMonth).length;
  }, [customers]);
  const activeCustomers = useMemo(() => customers.filter(c => {
    if (!c.updatedAt && !c.createdAt) return false;
    const lastActive = new Date(c.updatedAt || c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastActive >= thirtyDaysAgo;
  }).length, [customers]);
  const totalCustomers = customers.length;
  const invoiceLabel = getInvoiceLabel();

  const invoiceDerived = useMemo(() => {
    const todayEarnings = calculatedTodaysSales;
    const totalDue = calculatedTotalDue;
    const pendingBillsCount = invoices.filter(inv => {
      const s = (inv.paymentStatus || '').toLowerCase();
      return s === 'unpaid' || s === 'partial' || s === 'partially paid' || s === 'pending';
    }).length;
    const recentInvoices = getRecentInvoices();
    const recentPayments = getRecentPayments();
    const pendingCollection = getPendingCollection();
    const totalOverdue = getOverdueCount(pendingCollection);
    const totalUpcoming = getUpcomingCount(pendingCollection);
    const activities = getActivities();
    const totalPaymentsCount = invoices.filter(inv => {
      const s = (inv.paymentStatus || '').toLowerCase();
      return s === 'paid' || s === 'partial' || s === 'partially paid';
    }).length;
    const paidCount = invoices.filter(inv => (inv.paymentStatus || '').toLowerCase() === 'paid').length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const totalCollected = invoices
      .reduce((sum, inv) => {
        const s = (inv.paymentStatus || '').toLowerCase();
        if (s === 'paid') return sum + (inv.grandTotal || inv.total || 0);
        if (s === 'partial' || s === 'partially paid') return sum + (parseFloat(inv.amountPaid) || 0);
        return sum;
      }, 0);
    const healthScore = Math.min(100, Math.round(
      (invoices.length > 0 ? Math.min(paidCount / invoices.length, 1) * 40 : 0) +
      (totalRevenue > 0 ? Math.min(totalCollected / totalRevenue, 1) * 30 : 0) +
      (totalCustomers > 0 ? Math.min(totalCustomers / 10, 1) * 30 : 0)
    ));
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    const revenueTrend = getRevenueTrend();
    const paymentBreakdown = getPaymentBreakdown();
    const billsHealth = invoices.length > 0 ? Math.min(100, Math.round((paidCount / invoices.length) * 100)) : 0;
    const paymentHealth = collectionRate;
    const customerHealth = totalCustomers > 0 ? Math.min(100, Math.round((newCustomersThisMonth / Math.max(totalCustomers, 1)) * 200)) : 0;
    const activityHealth = Math.min(100, activities.length * 10);
    const dueHealth = pendingCollection.length > 0 ? Math.min(100, Math.max(0, 100 - Math.round((totalOverdue / pendingCollection.length) * 100))) : 100;
    const overallHealth = Math.round((billsHealth + paymentHealth + customerHealth + activityHealth + dueHealth) / 5);
    const topCustomers = getTopCustomers();
    const dueNext7Days = getDueInNext7Days();
    const busiestDay = getBusiestDay();
    const avgInvoiceValue = totalRevenue > 0 ? totalRevenue / invoices.length : 0;
    const collectionTrendData = revenueTrend.map(d => ({
      ...d,
      collectionRate: d.revenue > 0 ? Math.round((d.collection / d.revenue) * 100) : 0,
      pending: d.revenue - d.collection,
    }));
    const now = new Date();
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thisWeekInvoices = invoices.filter(inv => inv.createdAt && new Date(inv.createdAt) >= sevenDaysAgo);
    const lastWeekInvoices = invoices.filter(inv => inv.createdAt && new Date(inv.createdAt) >= fourteenDaysAgo && new Date(inv.createdAt) < sevenDaysAgo);
    const invoiceCountGrowth = lastWeekInvoices.length > 0
      ? `+${Math.round((thisWeekInvoices.length - lastWeekInvoices.length) / lastWeekInvoices.length * 100)}%`
      : thisWeekInvoices.length > 0 ? '+100%' : '0';
    const pendingDueTrend = totalDue > 0 && totalRevenue > 0
      ? `${((totalDue / totalRevenue) * 100).toFixed(1)}%`
      : '0';
    const thisWeekNewCustomers = customers.filter(c => c.createdAt && new Date(c.createdAt) >= sevenDaysAgo).length;
    const lastWeekNewCustomers = customers.filter(c => c.createdAt && new Date(c.createdAt) >= fourteenDaysAgo && new Date(c.createdAt) < sevenDaysAgo).length;
    const thisWeekOverdue = thisWeekInvoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < sevenDaysAgo).length;
    const lastWeekOverdue = lastWeekInvoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < fourteenDaysAgo).length;
    const overdueChange = lastWeekOverdue > 0
      ? `${Math.round((thisWeekOverdue - lastWeekOverdue) / lastWeekOverdue * 100)}%`
      : thisWeekOverdue > 0 ? '+100%' : '0%';
    const customerGrowth = lastWeekNewCustomers > 0
      ? `+${Math.round((thisWeekNewCustomers - lastWeekNewCustomers) / lastWeekNewCustomers * 100)}`
      : thisWeekNewCustomers > 0 ? `+${thisWeekNewCustomers}` : '0';
    const revenueGrowth = revenueTrend.length >= 4
      ? (() => {
          const firstHalf = revenueTrend.slice(0, 3).reduce((s, d) => s + d.revenue, 0);
          const secondHalf = revenueTrend.slice(-3).reduce((s, d) => s + d.revenue, 0);
          if (firstHalf === 0) return secondHalf > 0 ? '+100' : '0';
          return `${((secondHalf - firstHalf) / firstHalf * 100).toFixed(1)}`;
        })()
      : '0';
    const collectionChange = collectionTrendData.length >= 4
      ? (() => {
          const firstHalf = collectionTrendData.slice(0, 3).reduce((s, d) => s + d.collectionRate, 0) / 3;
          const secondHalf = collectionTrendData.slice(-3).reduce((s, d) => s + d.collectionRate, 0) / 3;
          return (secondHalf - firstHalf).toFixed(1);
        })()
      : '0';
    return {
      todayEarnings, totalDue, pendingBillsCount, totalPaymentsCount,
      recentInvoices, recentPayments, pendingCollection,
      totalOverdue, totalUpcoming, activities,
      paidCount, totalRevenue, totalCollected,
      healthScore, collectionRate, revenueTrend, paymentBreakdown,
      billsHealth, paymentHealth, customerHealth, activityHealth, dueHealth, overallHealth,
      topCustomers, dueNext7Days, busiestDay, avgInvoiceValue, collectionTrendData,
      revenueGrowth, collectionChange, invoiceCountGrowth, pendingDueTrend, customerGrowth, overdueChange
    };
  }, [invoices, invoiceLabel, totalCustomers, newCustomersThisMonth, calculatedTodaysSales, calculatedTotalDue]);
  const {
    todayEarnings, totalDue, pendingBillsCount, totalPaymentsCount,
    recentInvoices, recentPayments, pendingCollection,
    totalOverdue, totalUpcoming, activities,
    paidCount, totalRevenue, totalCollected,
    healthScore, collectionRate, revenueTrend, paymentBreakdown,
    billsHealth, paymentHealth, customerHealth, activityHealth, dueHealth, overallHealth,
    topCustomers, dueNext7Days, busiestDay, avgInvoiceValue, collectionTrendData,
    revenueGrowth, collectionChange, invoiceCountGrowth, pendingDueTrend, customerGrowth, overdueChange
  } = invoiceDerived;
  const activeWorkspace = useMemo(() =>
    businessSettings?.businessWorkspaces?.find(
      ws => ws.id === businessSettings.activeWorkspaceId
    ), [businessSettings]);
  const workspaceName = activeWorkspace?.name || businessSettings?.businessName || 'Default';
  const workspaceType = activeWorkspace?.type || 'retail';
  const enabledModulesCount = businessSettings?.businessModules?.filter(m => m.enabled)?.length || 0;

  function getRevenueTrend() {
    const daily = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daily[key] = { day: key, revenue: 0, collection: 0 };
    }
    invoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daily[key]) {
        daily[key].revenue += inv.grandTotal || inv.total || 0;
        if (inv.paymentStatus?.toLowerCase() === 'paid') {
          daily[key].collection += inv.grandTotal || inv.total || 0;
        } else {
          daily[key].collection += parseFloat(inv.amountPaid) || 0;
        }
      }
    });
    return Object.values(daily);
  };

  function getPaymentBreakdown() {
    let paid = 0, partial = 0, unpaid = 0;
    invoices.forEach(inv => {
      const s = (inv.paymentStatus || '').toLowerCase();
      const total = inv.grandTotal || inv.total || 0;
      if (s === 'paid') paid += total;
      else if (s === 'partial' || s === 'partially paid') partial += parseFloat(inv.amountPaid) || 0;
      else unpaid += total;
    });
    return [
      { name: 'Paid', value: paid, color: 'var(--theme-success)' },
      { name: 'Partial', value: partial, color: 'var(--theme-warning)' },
      { name: 'Unpaid', value: unpaid, color: 'var(--theme-danger)' },
    ];
  };

  function getTopCustomers() {
    const salesByCustomer = {};
    invoices.forEach(inv => {
      const name = inv.customerName || 'Walk-in';
      if (!salesByCustomer[name]) salesByCustomer[name] = 0;
      salesByCustomer[name] += inv.grandTotal || inv.total || 0;
    });
    return Object.entries(salesByCustomer)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  };

  function getDueInNext7Days() {
    const now = new Date();
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);
    return invoices.filter(inv => {
      const s = (inv.paymentStatus || '').toLowerCase();
      if (s === 'paid') return false;
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate);
      return due >= now && due <= sevenDays;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  function getBusiestDay() {
    const dayCount = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    invoices.forEach(inv => {
      if (inv.createdAt) {
        const day = new Date(inv.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        if (dayCount[day] !== undefined) dayCount[day]++;
      }
    });
    const maxDay = Object.entries(dayCount).reduce((a, b) => a[1] > b[1] ? a : b, ['N/A', 0]);
    return maxDay[1] > 0 ? maxDay[0] : 'N/A';
  };

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return { label: 'Paid', classes: 'bg-theme-success/10 text-theme-success border-theme-success/20' };
    if (s === 'partial' || s === 'partially paid') return { label: 'Partial', classes: 'bg-theme-warning/10 text-theme-warning border-theme-warning/20' };
    if (s === 'pending' || s === 'pending verification') return { label: 'Pending', classes: 'bg-theme-accent/10 text-theme-accent border-theme-accent/20' };
    if (s === 'overdue') return { label: 'Overdue', classes: 'bg-theme-danger/10 text-theme-danger border-theme-danger/20' };
    return { label: 'Due', classes: 'bg-theme-danger/10 text-theme-danger border-theme-danger/20' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
  };

  const getDaysRemaining = () => {
    if (subscription?.status !== 'premium' || !subscription?.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(subscription.expiresAt);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
  };
  const expiryDays = getDaysRemaining();

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="min-h-screen bg-theme-surface/50">
          {(isInitialLoad || isLoading) ? (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
              <KPISkeleton count={4} />
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : (
            <>
          {expiryDays !== null && expiryDays <= 30 && (
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                expiryDays <= 3 ? 'bg-theme-danger/10 border-theme-danger/30 text-theme-danger' :
                expiryDays <= 7 ? 'bg-theme-warning/10 border-theme-warning/30 text-theme-warning' :
                'bg-theme-accent/10 border-theme-accent/30 text-theme-accent'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">
                      {expiryDays <= 0 ? 'Your Premium Subscription has expired' : `Your Premium Subscription expires in ${expiryDays} days`}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {expiryDays <= 0 
                        ? 'Please renew your subscription to restore full access.'
                        : 'Renew now to ensure uninterrupted access to premium features.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('subscription')}
                  className="px-4 py-2 bg-theme-card text-theme-primary text-xs font-bold rounded-xl border border-theme-border-soft hover:bg-theme-surface transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Renew Now
                </button>
              </div>
            </div>
          )}

        {/* ===== MOBILE VIEW (< 1024px) ===== */}
        <div className="lg:hidden px-3 sm:px-4 max-w-2xl mx-auto space-y-4 pb-6 pt-3">
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
              revenueStatus.lockStatus === 'grace' ? 'bg-theme-warning/10 border-theme-warning/30' :
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

          {/* PREMIUM MOBILE HERO */}
          <div className="bg-[image:var(--accent-gradient)] text-white rounded-2xl p-5 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[9px] font-black tracking-widest text-white/70 uppercase">
                    {businessSettings?.businessName || 'Dashboard'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'Synced' ? 'bg-theme-success animate-pulse' : 'bg-theme-warning'}`} />
                  <span className="text-[7px] font-bold text-white/80 uppercase tracking-wider">{syncStatus === 'Synced' ? 'Live' : syncStatus}</span>
                </div>
              </div>
              <p className="text-[8px] text-white/60 font-semibold mt-1">
                {workspaceName} • {workspaceType.charAt(0).toUpperCase() + workspaceType.slice(1)}
              </p>
              <div className="mt-3">
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Today's Billings</p>
                <p className="text-3xl font-black tracking-tight tabular-nums mt-0.5">{formatCurrency(todayEarnings)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-[7px] font-bold text-white/60 uppercase tracking-wider">Monthly</p>
                  <p className="text-sm font-black mt-0.5 tabular-nums">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-[7px] font-bold text-white/60 uppercase tracking-wider">Due</p>
                  <p className="text-sm font-black mt-0.5 tabular-nums">{formatCurrency(totalDue)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-[7px] font-bold text-white/60 uppercase tracking-wider">Rate</p>
                  <p className="text-sm font-black mt-0.5 tabular-nums">{collectionRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* PREMIUM MOBILE QUICK ACTION BAR */}
          <div className="flex gap-2">
            <button onClick={onQuickBillOpen} className="flex-1 flex items-center justify-center gap-1.5 bg-[image:var(--accent-gradient)] text-white rounded-xl py-3 font-bold text-[10px] shadow-sm active:scale-[0.97] transition-all">
              <Plus className="w-3.5 h-3.5" /> New Bill
            </button>
            <button onClick={() => setShowAddCustomerSheet(true)} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
              <Users className="w-3.5 h-3.5" /> Customer
            </button>
            <button onClick={() => setCurrentTab('due-ledger')} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
              <CreditCard className="w-3.5 h-3.5" /> Collect
            </button>
            <button onClick={() => setCurrentTab('reports')} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </button>
          </div>

          {/* ===== MOBILE WELCOME AREA ===== */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-theme-primary">
                  <span>{greeting.icon}</span> {greeting.text}, {businessSettings?.ownerName?.split(' ')[0] || 'there'}!
                </h2>
                <p className="text-[10px] text-theme-muted font-medium mt-0.5">{businessSettings?.businessName || 'Your Business'} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-bold bg-theme-success/10 text-theme-success border border-theme-success/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-success" />
                {syncStatus === 'Synced' ? 'Live' : syncStatus}
              </div>
            </div>
          </motion.div>

          {/* ===== MOBILE HEALTH SCORE + SUB-METRICS ===== */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Business Health</p>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${overallHealth >= 70 ? 'bg-theme-success/10 text-theme-success' : overallHealth >= 40 ? 'bg-theme-warning/10 text-theme-warning' : 'bg-theme-danger/10 text-theme-danger'}`}>
                {overallHealth >= 70 ? 'Great' : overallHealth >= 40 ? 'Fair' : 'Low'}
              </span>
            </div>
            <div className="flex items-center justify-around gap-2">
              <MiniHealthCircle value={billsHealth} label="Bills" />
              <MiniHealthCircle value={paymentHealth} label="Payment" />
              <MiniHealthCircle value={customerHealth} label="Customers" />
              <MiniHealthCircle value={activityHealth} label="Activity" />
              <MiniHealthCircle value={dueHealth} label="Due" />
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-full h-1.5 bg-theme-surface rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${overallHealth >= 70 ? 'bg-theme-success' : overallHealth >= 40 ? 'bg-theme-warning' : 'bg-theme-danger'}`} style={{ width: `${overallHealth}%` }} />
              </div>
              <span className="text-[9px] font-black text-theme-primary shrink-0 tabular-nums">{overallHealth}/100</span>
            </div>
          </div>

          {/* ===== MOBILE COLLECTION CENTER ===== */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-4 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-2">Collection Rate</p>
              <p className="text-2xl font-black text-theme-primary tabular-nums">{collectionRate}%</p>
              <div className="w-full h-2 bg-theme-surface rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${collectionRate >= 70 ? 'bg-theme-success' : collectionRate >= 40 ? 'bg-theme-warning' : 'bg-theme-danger'}`} style={{ width: `${collectionRate}%` }} />
              </div>
              <p className="text-[9px] text-theme-muted font-medium mt-1.5">{formatCurrency(totalCollected)} collected of {formatCurrency(totalRevenue)}</p>
            </div>
            <div className="card-premium p-4 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-2">Collection Trend</p>
              {collectionTrendData.length === 0 ? (
                <p className="text-[9px] text-theme-muted font-medium">No data</p>
              ) : (
                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionTrendData}>
                      <Bar dataKey="collection" fill="var(--theme-success)" radius={[2,2,0,0]} stackId="a" />
                      <Bar dataKey="pending" fill="var(--theme-warning)" radius={[2,2,0,0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ===== MOBILE PAYMENT BREAKDOWN + REVENUE TREND ===== */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-4">
              <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-3">Payment Split</p>
              <div className="h-28 w-full">
                {paymentBreakdown.every(p => p.value === 0) ? (
                  <p className="text-[9px] text-theme-muted font-medium">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value" stroke="none">
                        {paymentBreakdown.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '8px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                {paymentBreakdown.filter(p => p.value > 0).map((e, i) => (
                  <span key={i} className="flex items-center gap-1 text-[7px] font-bold text-theme-muted">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />{e.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="card-premium p-4">
              <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-3">Revenue Trend</p>
              <div className="h-28 w-full">
                {revenueTrend.length === 0 ? (
                  <p className="text-[9px] text-theme-muted font-medium">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend}>
                      <defs>
                        <linearGradient id="revTrendMob" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--theme-accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={2} fill="url(#revTrendMob)" />
                      <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '8px', fontSize: '10px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* ===== MOBILE RECENT PAYMENTS ===== */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-theme-primary">Recent Payments</h3>
              {recentPayments.length > 5 && (
                <button onClick={() => setCurrentTab('due-ledger')} className="text-[9px] font-bold text-theme-accent">View All</button>
              )}
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-3 bg-theme-surface rounded-xl text-center">
                <p className="text-[11px] text-theme-muted font-medium">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentPayments.slice(0, 5).map((payment, idx) => {
                  const badge = statusBadge(payment.paymentStatus);
                  return (
                    <div key={payment.id || idx} className="flex items-center justify-between p-2.5 bg-theme-surface rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-theme-success/10 text-theme-success flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-theme-primary truncate">{payment.customerName || 'Walk-in'}</p>
                          <p className="text-[9px] text-theme-muted font-medium">{formatShortDate(payment.updatedAt || payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-theme-primary tabular-nums">{formatCurrency(payment.grandTotal || payment.total || 0)}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badge.classes}`}>{badge.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== MOBILE RECENT INVOICES ===== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-theme-primary tracking-tight">Recent {invoiceLabel}</h2>
              {invoices.length > 5 && (
                <button onClick={() => setCurrentTab('invoices')} className="flex items-center gap-1 text-[10px] font-bold text-theme-accent">
                  View All <ArrowRight className="w-3 h-3" />
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
                <div className="mt-1 px-4 py-2 bg-[image:var(--accent-gradient)] text-white text-xs font-bold rounded-xl shadow-premium">
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
                        <p className="text-sm font-bold text-theme-primary truncate">{inv.customerName || 'Walk-in Customer'}</p>
                        <p className="text-[10px] text-theme-muted font-semibold mt-0.5">
                          {formatShortDate(inv.createdAt)} • {inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-black text-theme-primary">{formatCurrency(inv.grandTotal || inv.total || 0)}</p>
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

          {/* ===== MOBILE TOP CUSTOMERS ===== */}
          {topCustomers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold text-theme-primary">Top Customers</h3>
              </div>
              <div className="space-y-1.5">
                {topCustomers.slice(0, 5).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between p-2 bg-theme-surface rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center shrink-0 ${i === 0 ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-accent/10 text-theme-accent'}`}>{i + 1}</span>
                      <span className="text-[10px] font-bold text-theme-primary truncate">{c.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-theme-primary tabular-nums">{formatCurrency(c.total)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== MOBILE DUE OVERVIEW ===== */}
          {dueNext7Days.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold text-theme-primary">Due in Next 7 Days</h3>
                <span className="text-[9px] font-bold text-theme-warning">{dueNext7Days.length} bills</span>
              </div>
              <div className="space-y-1.5">
                {dueNext7Days.slice(0, 3).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-2 bg-theme-surface rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-theme-primary truncate">{inv.customerName || 'Walk-in'}</p>
                      <p className="text-[8px] text-theme-muted font-medium">Due {formatShortDate(inv.dueDate)}</p>
                    </div>
                    <span className="text-[10px] font-black text-theme-primary tabular-nums">{formatCurrency(inv.grandTotal || inv.total || 0)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== MOBILE CUSTOMER INSIGHTS ===== */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-theme-primary">Customer Insights</h3>
              <button onClick={() => setCurrentTab('customers')} className="text-[9px] font-bold text-theme-accent flex items-center gap-0.5">
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="stat-premium !p-3 text-center">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Total</p>
                <p className="text-lg font-black text-theme-primary tabular-nums">{totalCustomers}</p>
              </div>
              <div className="stat-premium !p-3 text-center">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">New</p>
                <p className="text-lg font-black text-theme-primary tabular-nums">{newCustomersThisMonth}</p>
              </div>
              <div className="stat-premium !p-3 text-center">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Active</p>
                <p className="text-lg font-black text-theme-primary tabular-nums">{activeCustomers}</p>
              </div>
            </div>
          </div>

          {/* ===== MOBILE BUSINESS INSIGHTS ===== */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-4">
            <h3 className="text-xs font-extrabold text-theme-primary mb-3">Business Insights</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-theme-surface rounded-xl">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Busiest Day</p>
                <p className="text-xs font-black text-theme-primary mt-0.5">{busiestDay !== 'N/A' ? busiestDay : 'N/A'}</p>
              </div>
              <div className="p-2.5 bg-theme-surface rounded-xl">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Avg Invoice</p>
                <p className="text-xs font-black text-theme-primary mt-0.5">{formatCurrency(avgInvoiceValue)}</p>
              </div>
              <div className="p-2.5 bg-theme-surface rounded-xl">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Collection Rate</p>
                <p className="text-xs font-black text-theme-primary mt-0.5">{collectionRate}%</p>
              </div>
              <div className="p-2.5 bg-theme-surface rounded-xl">
                <p className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Top Customer</p>
                <p className="text-xs font-black text-theme-primary mt-0.5 truncate">{topCustomers[0]?.name || 'N/A'}</p>
              </div>
            </div>
          </motion.div>

          {/* ===== MOBILE ACTIVITY FEED ===== */}
          <div className="card-premium p-4">
            <h3 className="text-xs font-extrabold text-theme-primary mb-2">Recent Activity</h3>
            <div className="-mx-4">
              <ActivityFeed activities={activities} maxItems={4} />
            </div>
          </div>

          {/* ===== MOBILE WORKSPACE INFO ===== */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-theme-primary">Workspace</h3>
              <span className="badge-premium text-[8px]">{enabledModulesCount} modules</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-theme-surface rounded-lg">
                <span className="text-[9px] text-theme-muted font-semibold">Name</span>
                <span className="text-[9px] font-bold text-theme-primary">{workspaceName}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-theme-surface rounded-lg">
                <span className="text-[9px] text-theme-muted font-semibold">Type</span>
                <span className="text-[9px] font-bold text-theme-primary capitalize">{workspaceType}</span>
              </div>
              <button onClick={() => setCurrentTab('settings')} className="w-full flex items-center justify-between p-2.5 rounded-xl bg-theme-surface hover:bg-theme-accent/5 transition-colors">
                <span className="text-[9px] font-bold text-theme-primary">Switch Workspace</span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-muted" />
              </button>
            </div>
          </div>

          {/* ===== MOBILE SYNC STATUS ===== */}
          <div className="card-premium flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${syncStatus === 'Synced' ? 'bg-theme-success/10 text-theme-success' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-theme-accent/10 text-theme-accent' : 'bg-theme-danger/10 text-theme-danger'}`}>
                {syncStatus === 'Synced' ? <ShieldCheck className="w-3 h-3" /> : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
              </div>
              <div>
                <span className={`text-[9px] font-bold ${syncStatus === 'Synced' ? 'text-theme-success' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'text-theme-accent' : 'text-theme-danger'}`}>
                  {syncStatus === 'Synced' ? 'Connected' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'Syncing' : 'Disconnected'}
                </span>
                <p className="text-[8px] text-theme-muted font-medium">Synced just now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${syncStatus === 'Synced' ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-warning/10 text-theme-warning'}`}>
                {syncStatus === 'Synced' ? 'Healthy' : 'Pending'}
              </span>
              {installPromptEvent && !isAppInstalled && (
                <button onClick={onInstallApp} className="px-2 py-1 bg-[image:var(--accent-gradient)] text-white text-[7px] font-bold rounded-lg">Install</button>
              )}
            </div>
          </div>
        </div>

        {/* ===== DESKTOP VIEW (>= 1024px) ===== */}
        <div className="hidden lg:block w-full max-w-full mx-auto px-6 py-5">
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
              <motion.div variants={itemVariants} className={`p-3 rounded-xl border ${revenueStatus.lockStatus === 'warn' ? 'bg-theme-warning/10 border-theme-warning/30' : revenueStatus.lockStatus === 'grace' ? 'bg-theme-warning/10 border-theme-warning/30' : 'bg-theme-danger/10 border-theme-danger/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${revenueStatus.lockStatus === 'locked' ? 'bg-theme-danger/20 text-theme-danger' : 'bg-theme-warning/20 text-theme-warning'}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-theme-primary">{revenueStatus.lockStatus === 'locked' ? 'Platform Locked' : revenueStatus.lockStatus === 'grace' ? 'Grace Period Active' : 'Payment Due Soon'}</p>
                    <p className="text-xs text-theme-muted font-semibold mt-0.5">{revenueStatus.message || 'Please update your subscription'}</p>
                  </div>
                  {revenueStatus.lockStatus !== 'locked' && (
                    <button onClick={() => setCurrentTab('subscription')} className="px-3 py-1.5 bg-theme-accent text-white text-xs font-bold rounded-lg shrink-0">Renew</button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== PREMIUM HERO SECTION ===== */}
            <motion.div variants={itemVariants} className="bg-[image:var(--accent-gradient)] rounded-2xl p-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        {greeting.text}, {businessSettings?.ownerName?.split(' ')[0] || 'there'}!
                      </h1>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20">
                        <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'Synced' ? 'bg-theme-success animate-pulse' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-theme-accent animate-pulse' : 'bg-theme-warning'}`} />
                        {syncStatus === 'Synced' ? 'Live' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'Syncing' : syncStatus}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-white/80 font-medium">
                        <Building2 className="w-3 h-3 inline mr-1" />
                        {workspaceName} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <span className="text-white/30">|</span>
                      <p className="text-xs text-white/70 font-medium capitalize">{workspaceType} Workspace</p>
                    </div>
                  </div>
                  <button onClick={() => { onQuickBillOpen(); window.dispatchEvent(new Event('trigger-confetti')); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-theme-primary text-xs font-black rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0">
                    <Plus className="w-4 h-4" /> Create Bill
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-5 mt-5">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Today's Billings</p>
                    <p className="text-xl font-black text-white mt-0.5 tabular-nums">{formatCurrency(todayEarnings)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Monthly Revenue</p>
                    <p className="text-xl font-black text-white mt-0.5 tabular-nums">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Total Due</p>
                    <p className="text-xl font-black text-white mt-0.5 tabular-nums">{formatCurrency(totalDue)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5">
                    <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Collection Rate</p>
                    <p className="text-xl font-black text-white mt-0.5 tabular-nums">{collectionRate}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== QUICK STATS ROW ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-5">
              {(() => {
                const today = new Date().toDateString();
                const billsToday = invoices.filter(i => new Date(i.createdAt).toDateString() === today).length;
                const collectedToday = invoices
                  .filter(i => {
                    const d = new Date(i.updatedAt || i.createdAt).toDateString();
                    return d === today && (i.paymentStatus === 'Paid' || i.paymentStatus === 'paid');
                  })
                  .reduce((s, i) => s + (i.grandTotal || i.total || 0), 0);
                const dueToday = invoices.filter(i => {
                  if (i.paymentStatus === 'Paid' || i.paymentStatus === 'paid') return false;
                  const dueDate = i.dueDate ? new Date(i.dueDate).toDateString() : null;
                  return dueDate === today;
                }).length;
                const newCustToday = customers.filter(c => {
                  const d = c.createdAt ? new Date(c.createdAt).toDateString() : null;
                  return d === today;
                }).length;
                return [
                  { label: 'Bills Created Today', value: billsToday, icon: FileText, color: 'text-theme-accent' },
                  { label: 'Amount Collected Today', value: formatCurrency(collectedToday), icon: DollarSign, color: 'text-theme-success' },
                  { label: 'Due Bills Today', value: dueToday, icon: Clock, color: 'text-theme-warning' },
                  { label: 'New Customers Today', value: newCustToday, icon: Users, color: 'text-theme-accent' }
                ].map((s, i) => (
                  <motion.div key={i} variants={itemVariants} className="stat-premium">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`icon-premium icon-premium-sm ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-0.5">{s.label}</p>
                    <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums">{s.value}</p>
                  </motion.div>
                ));
              })()}
            </motion.div>

            {/* ===== QUICK ACTION BAR ===== */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              <button onClick={onQuickBillOpen} className="btn-premium flex items-center gap-2 px-4 py-2.5 bg-[image:var(--accent-gradient)] text-white rounded-xl shadow-sm hover:shadow-premium-hover transition-all active:scale-95 shrink-0">
                <Plus className="w-4 h-4" /> New Invoice
              </button>
              <button onClick={() => setShowAddCustomerSheet(true)} className="btn-premium flex items-center gap-2 px-4 py-2.5 bg-theme-card border border-theme-border-soft text-theme-primary rounded-xl hover:bg-theme-surface transition-all active:scale-95 shrink-0">
                <Users className="w-4 h-4" /> Add Customer
              </button>
              <button onClick={() => setCurrentTab('due-ledger')} className="btn-premium flex items-center gap-2 px-4 py-2.5 bg-theme-card border border-theme-border-soft text-theme-primary rounded-xl hover:bg-theme-surface transition-all active:scale-95 shrink-0">
                <CreditCard className="w-4 h-4" /> Log Payment
              </button>
              <button onClick={() => setCurrentTab('reports')} className="btn-premium flex items-center gap-2 px-4 py-2.5 bg-theme-card border border-theme-border-soft text-theme-primary rounded-xl hover:bg-theme-surface transition-all active:scale-95 shrink-0">
                <BarChart3 className="w-4 h-4" /> View Reports
              </button>
            </motion.div>

            {/* ===== ROW 1: KPI CARDS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-5">
              {isInitialLoad ? (
                <KPISkeleton count={4} />
              ) : (
                <>
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    icon={DollarSign}
                    trend={parseFloat(revenueGrowth) > 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
                    trendUp={parseFloat(revenueGrowth) >= 0}
                    subtitle="Revenue across all invoices"
                  />
                  <StatCard
                    title="Total Invoices"
                    value={invoices.length}
                    icon={FileText}
                    trend={invoiceCountGrowth}
                    trendUp={!invoiceCountGrowth.startsWith('-')}
                    subtitle="Total invoices generated"
                  />
                  <StatCard
                    title="Pending Due"
                    value={formatCurrency(totalDue)}
                    icon={Clock}
                    trend={pendingDueTrend}
                    trendUp={false}
                    subtitle="Outstanding collections"
                  />
                  <StatCard
                    title="Active Customers"
                    value={customers.length}
                    icon={Users}
                    trend={customerGrowth}
                    trendUp={!customerGrowth.startsWith('-')}
                    subtitle="Registered customers"
                  />
                </>
              )}
            </motion.div>

            {/* ===== BUSINESS HEALTH + COLLECTION SUMMARY ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              <div className="col-span-4 card-premium p-5 flex flex-col">
                <div className="section-header">
                  <h3 className="section-header-title">Business Health</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${overallHealth >= 70 ? 'bg-theme-success/10 text-theme-success' : overallHealth >= 40 ? 'bg-theme-warning/10 text-theme-warning' : 'bg-theme-danger/10 text-theme-danger'}`}>
                    {overallHealth >= 70 ? 'Excellent' : overallHealth >= 40 ? 'Fair' : 'Critical'}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--theme-border-soft)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${overallHealth * 3.267} 326.7`} className={overallHealth >= 70 ? 'text-theme-success' : overallHealth >= 40 ? 'text-theme-warning' : 'text-theme-danger'} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-3xl font-black ${overallHealth >= 70 ? 'text-theme-success' : overallHealth >= 40 ? 'text-theme-warning' : 'text-theme-danger'}`}>{overallHealth}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 w-full">
                    <MiniHealthCircle value={billsHealth} label="Bills" />
                    <MiniHealthCircle value={paymentHealth} label="Payment" />
                    <MiniHealthCircle value={customerHealth} label="Cust." />
                    <MiniHealthCircle value={activityHealth} label="Activity" />
                    <MiniHealthCircle value={dueHealth} label="Due" />
                  </div>
                </div>
              </div>
              <div className="col-span-8 card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Collection Center</h3>
                    <p className="section-header-subtitle">Track your collection progress against targets.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-theme-muted font-semibold">Target</span>
                    <span className="text-2xl font-black text-theme-primary tabular-nums">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
                <div className="mt-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-theme-muted font-semibold">Collected</p>
                      <p className="text-lg font-black text-theme-primary tabular-nums">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 text-xs font-bold ${collectionRate >= 70 ? 'text-theme-success' : collectionRate >= 40 ? 'text-theme-warning' : 'text-theme-danger'}`}>
                        <Target className="w-3.5 h-3.5" /> {collectionRate}%
                      </span>
                      <span className="text-xs text-theme-muted font-medium">{totalDue > 0 ? `${formatCurrency(totalDue)} remaining` : 'All collected'}</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-theme-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 relative ${collectionRate >= 70 ? 'bg-theme-success' : collectionRate >= 40 ? 'bg-theme-warning' : 'bg-theme-danger'}`} style={{ width: `${collectionRate}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-current" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-theme-surface">
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Collected</p>
                      <p className="text-sm font-black text-theme-success tabular-nums">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-theme-surface">
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Pending</p>
                      <p className="text-sm font-black text-theme-warning tabular-nums">{formatCurrency(totalDue)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-theme-surface">
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Overdue</p>
                      <p className="text-sm font-black text-theme-danger tabular-nums">{totalOverdue} bills</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== ROW 2: CHARTS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              {/* Revenue Trend */}
              <div className="col-span-6 card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Revenue Trend</h3>
                    <p className="section-header-subtitle">Daily revenue activity across the selected time period.</p>
                  </div>
                  <button onClick={() => setCurrentTab('reports')} className="btn-premium-ghost text-xs">
                    <BarChart3 className="w-3.5 h-3.5" /> Select range <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-[280px] w-full mt-6">
                  {revenueTrend.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-theme-muted">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...revenueTrend].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

              {/* Collection Trend + Payment Breakdown */}
              <div className="col-span-3 card-premium p-5 flex flex-col">
                <div className="section-header">
                  <h3 className="section-header-title">Collection Trend</h3>
                </div>
                <div className="flex-1 h-[280px] w-full mt-6">
                  {collectionTrendData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-theme-muted">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collectionTrendData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border-soft)" opacity={0.5} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--theme-muted)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--theme-muted)' }} dx={-10} />
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', fontWeight: 700 }} />
                        <Bar dataKey="collection" name="Collected" fill="var(--theme-success)" radius={[3,3,0,0]} stackId="a" />
                        <Bar dataKey="pending" name="Pending" fill="var(--theme-warning)" radius={[3,3,0,0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[9px] font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-theme-success" /> Collected</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-theme-warning" /> Pending</span>
                </div>
              </div>

              {/* Payment Breakdown Pie */}
              <div className="col-span-3 card-premium p-5 flex flex-col">
                <h3 className="section-header-title mb-6">Payment Breakdown</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-[220px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {paymentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border-soft)', borderRadius: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-lg font-black text-theme-primary">{formatCurrency(totalCollected)}</p>
                      <p className="text-[10px] text-theme-muted font-bold uppercase mt-0.5">Collected</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-6 w-full">
                    {paymentBreakdown.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className="text-[10px] font-bold text-theme-primary">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== CUSTOMER INSIGHTS + WORKSPACE INFO ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              <div className="col-span-7 card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Customer Insights</h3>
                    <p className="section-header-subtitle">Customer engagement and growth metrics.</p>
                  </div>
                  <button onClick={() => setCurrentTab('customers')} className="btn-premium-ghost text-xs">
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Total</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{totalCustomers}</p>
                    <p className="text-2xs text-theme-muted font-medium mt-1">Registered</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">New This Month</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{newCustomersThisMonth}</p>
                    <p className="text-2xs text-theme-success font-medium mt-1">This month</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Active</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{activeCustomers}</p>
                    <p className="text-2xs text-theme-accent font-medium mt-1">Last 30d</p>
                  </div>
                </div>
              </div>
              <div className="col-span-5 card-premium p-5 flex flex-col">
                <div className="section-header">
                  <h3 className="section-header-title">Workspace Overview</h3>
                </div>
                <div className="flex-1 space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-muted font-semibold">Workspace</span>
                    <span className="text-xs font-bold text-theme-primary">{workspaceName}</span>
                  </div>
                  <div className="divider-premium" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-muted font-semibold">Type</span>
                    <span className="text-xs font-bold text-theme-primary capitalize">{workspaceType}</span>
                  </div>
                  <div className="divider-premium" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-muted font-semibold">Enabled Modules</span>
                    <span className="badge-premium text-xs">{enabledModulesCount}</span>
                  </div>
                  <div className="divider-premium" />
                  <button onClick={() => setCurrentTab('settings')} className="w-full flex items-center justify-between p-3 rounded-xl bg-theme-surface hover:bg-theme-accent/5 transition-colors">
                    <span className="text-xs font-bold text-theme-primary">Switch Workspace</span>
                    <ChevronRight className="w-4 h-4 text-theme-muted" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ===== TOP CUSTOMERS + BUSINESS INSIGHTS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              <div className="col-span-6 card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Top Customers</h3>
                    <p className="section-header-subtitle">Highest billing customers.</p>
                  </div>
                  <button onClick={() => setCurrentTab('customers')} className="btn-premium-ghost text-xs">View All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="mt-6 space-y-2">
                  {topCustomers.length === 0 ? (
                    <p className="text-xs text-theme-muted font-medium text-center py-6">No customer data yet.</p>
                  ) : (
                    topCustomers.map((c, i) => (
                      <motion.div key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-3 rounded-xl bg-theme-surface hover:bg-theme-accent/5 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-accent/10 text-theme-accent'}`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-theme-primary truncate">{c.name}</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-theme-primary tabular-nums">{formatCurrency(c.total)}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
              <div className="col-span-6 card-premium p-5">
                <div className="section-header">
                  <h3 className="section-header-title">Business Insights</h3>
                </div>
                <p className="section-header-subtitle mb-6">Key metrics driving your business.</p>
                <div className="grid grid-cols-2 gap-5">
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Busiest Day</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{busiestDay !== 'N/A' ? busiestDay : '-'}</p>
                    <p className="text-2xs text-theme-muted font-medium mt-1">Most invoice creation day</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Avg Invoice</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{formatCurrency(avgInvoiceValue)}</p>
                    <p className="text-2xs text-theme-muted font-medium mt-1">Per invoice</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Collection Rate</p>
                    <p className="text-2xl font-black text-theme-primary tabular-nums">{collectionRate}%</p>
                    <p className="text-2xs text-theme-success font-medium mt-1">Overall rate</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Top Customer</p>
                    <p className="text-xl font-black text-theme-primary truncate">{topCustomers[0]?.name || '-'}</p>
                    <p className="text-2xs text-theme-accent font-medium mt-1">Highest spender</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== ROW 3: BOTTOM AREA ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              {/* Recent Bills List */}
              <div className="col-span-8 card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Recent {invoiceLabel}</h3>
                    <p className="section-header-subtitle">Most recent invoices generated.</p>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  {recentInvoices.length === 0 ? (
                    <div className="w-full">
                      <PremiumEmptyState
                        type="DASHBOARD"
                        title="No Recent Invoices"
                        description="Your most recent business transactions will appear here."
                        actionLabel="Create Invoice"
                        onAction={onQuickBillOpen}
                        size="sm"
                      />

                    </div>
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
                            <div className={`h-full ${inv.paymentStatus?.toLowerCase() === 'paid' ? 'bg-theme-success' : 'bg-theme-accent'}`} style={{ width: inv.paymentStatus?.toLowerCase() === 'paid' ? '100%' : inv.amountPaid && inv.grandTotal ? `${Math.min(100, Math.round((inv.amountPaid / inv.grandTotal) * 100))}%` : '65%' }} />
                          </div>
                          <p className="text-sm font-black text-theme-primary w-20 text-right tabular-nums">{formatCurrency(inv.grandTotal || 0)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Insights List */}
              <div className="col-span-4 card-premium p-5 flex flex-col">
                <div className="section-header">
                  <h3 className="section-header-title">Quick Insights</h3>
                  <button onClick={onQuickBillOpen} className="btn-premium-ghost text-xs">
                    <Plus className="w-3.5 h-3.5" /> Create
                  </button>
                </div>
                <p className="section-header-subtitle mb-6">Metrics generating the highest engagement.</p>
                <div className="space-y-4 flex-1">
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1.5">Collection Rate</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</p>
                    <p className={`text-2xs font-bold ${parseFloat(collectionChange) >= 0 ? 'text-theme-success' : 'text-theme-danger'}`}>{parseFloat(collectionChange) >= 0 ? '+' : ''}{collectionChange}pp vs last Week</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1.5">Overdue Bills</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{totalOverdue}</p>
                    <p className={`text-2xs font-bold ${overdueChange.startsWith('-') ? 'text-theme-success' : 'text-theme-danger'}`}>{overdueChange} vs last Week</p>
                  </div>
                  <div className="stat-premium !p-4">
                    <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1.5">Total Outstanding</p>
                    <p className="text-2xl font-black text-theme-primary mb-1 tabular-nums">{formatCurrency(totalDue)}</p>
                    <p className={`text-2xs font-bold ${parseFloat(pendingDueTrend) < 50 ? 'text-theme-success' : 'text-theme-warning'}`}>{pendingDueTrend} of total revenue</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ===== RECENT PAYMENTS ===== */}
            <motion.div variants={itemVariants} className="card-premium p-5">
              <div className="section-header">
                <div>
                  <h3 className="section-header-title">Recent Payments</h3>
                  <p className="section-header-subtitle">Latest payment transactions recorded.</p>
                </div>
                {totalPaymentsCount > 5 && (
                  <button onClick={() => setCurrentTab('due-ledger')} className="btn-premium-ghost text-xs">
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="mt-6 space-y-3">
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-theme-muted font-medium p-4 bg-theme-surface rounded-xl">No payments recorded yet.</p>
                ) : (
                  recentPayments.slice(0, 5).map((payment, idx) => (
                    <div key={payment.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-theme-surface hover:bg-theme-accent/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-theme-success/10 text-theme-success flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-theme-primary truncate">{payment.customerName || 'Walk-in Customer'}</p>
                          <p className="text-[10px] text-theme-muted font-semibold">{formatShortDate(payment.updatedAt || payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-theme-primary tabular-nums">{formatCurrency(payment.grandTotal || payment.total || 0)}</p>
                        <span className={`badge-premium text-[9px] ${statusBadge(payment.paymentStatus).classes}`}>
                          {statusBadge(payment.paymentStatus).label}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* ===== DUE OVERVIEW ===== */}
            {dueNext7Days.length > 0 && (
              <motion.div variants={itemVariants} className="card-premium p-5">
                <div className="section-header">
                  <div>
                    <h3 className="section-header-title">Due in Next 7 Days</h3>
                    <p className="section-header-subtitle">Invoices requiring attention soon.</p>
                  </div>
                  <button onClick={() => setCurrentTab('due-ledger')} className="btn-premium-ghost text-xs">
                    Collect Due <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-5 gap-3">
                  {dueNext7Days.map(inv => (
                    <div key={inv.id} className="p-3 rounded-xl bg-theme-surface border border-theme-warning/10 hover:border-theme-warning/30 transition-colors">
                      <p className="text-[10px] font-bold text-theme-primary truncate">{inv.customerName || 'Walk-in'}</p>
                      <p className="text-[8px] text-theme-muted font-medium mt-0.5">Due {formatShortDate(inv.dueDate)}</p>
                      <p className="text-xs font-black text-theme-primary mt-1 tabular-nums">{formatCurrency(inv.grandTotal || inv.total || 0)}</p>
                      <span className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${new Date(inv.dueDate) < new Date() ? 'bg-theme-danger/10 text-theme-danger' : 'bg-theme-warning/10 text-theme-warning'}`}>
                        {new Date(inv.dueDate) < new Date() ? 'Overdue' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== ROW 4: ACTIVITY FEED + QUICK ACTIONS + SYNC STATUS ===== */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-5">
              <div className="col-span-7">
                <ActivityFeed activities={activities} maxItems={6} />
              </div>
              <div className="col-span-5 flex flex-col gap-4">
                <QuickActions
                  actions={[
                    { id: 'new-bill', label: 'New Bill', icon: Plus, color: 'bg-theme-accent', action: 'onQuickBillOpen' },
                    { id: 'invoices', label: 'View Bills', icon: FileText, color: 'bg-theme-accent', action: 'invoices' },
                    { id: 'customers', label: 'Customers', icon: Users, color: 'bg-theme-success', action: 'customers' },
                    { id: 'collect', label: 'Collect Due', icon: CreditCard, color: 'bg-theme-warning', action: 'due-ledger' },
                  ]}
                  onAction={(action) => {
                    if (action === 'onQuickBillOpen') onQuickBillOpen();
                  }}
                  setCurrentTab={setCurrentTab}
                />

                {/* Sync Status Indicator */}
                <div className="card-premium flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${syncStatus === 'Synced' ? 'bg-theme-success/10 text-theme-success' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-theme-accent/10 text-theme-accent' : 'bg-theme-danger/10 text-theme-danger'}`}>
                      {syncStatus === 'Synced' ? <ShieldCheck className="w-4 h-4" /> : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${syncStatus === 'Synced' ? 'bg-theme-success' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'bg-theme-accent animate-pulse' : 'bg-theme-danger'}`} />
                        <span className="text-xs font-bold text-theme-primary">{syncStatus === 'Synced' ? 'Connected' : syncStatus === 'Saving...' || syncStatus === 'Syncing...' ? 'Syncing' : syncStatus === 'Offline' ? 'Disconnected' : 'Warning'}</span>
                      </div>
                      <p className="text-[10px] text-theme-muted font-medium mt-0.5">Last sync: {lastSyncTime ? lastSyncTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-theme-surface rounded-lg">
                      <span className="text-[9px] text-theme-muted font-semibold">Data Health</span>
                      <span className={`text-[9px] font-bold ${syncStatus === 'Synced' ? 'text-theme-success' : 'text-theme-warning'}`}>
                        {syncStatus === 'Synced' ? 'Good' : 'Pending'}
                      </span>
                    </div>
                    {installPromptEvent && !isAppInstalled && (
                      <button onClick={onInstallApp} className="px-3 py-1.5 bg-[image:var(--accent-gradient)] text-white text-[9px] font-bold rounded-lg shadow-sm hover:shadow-premium-hover transition-all active:scale-95">
                        Install App
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Install prompt standalone */}
            {installPromptEvent && !isAppInstalled && (
              <motion.div variants={itemVariants}>
                <button onClick={onInstallApp} className="w-full py-2.5 bg-[image:var(--accent-gradient)] text-white text-[10px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
                  Install App for Offline Access
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
        </>
      )}
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
    </AnimatedPage>
  );
};

export default Dashboard;
