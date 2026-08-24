import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle,
  Shield, ShieldCheck, Megaphone, FileText, DollarSign, Users, Clock,
  CheckCircle, Activity, Calendar, TrendingUp, Wallet,
  BarChart3, RefreshCw, MoreHorizontal, Eye, Download,
  Search, Link, Camera, FileSpreadsheet, ListChecks,
  AlertTriangle, ChevronRight, ChevronDown, Circle, Briefcase,
  Zap, Target, Percent, Building2, Smartphone, Globe,
  ArrowUpRight, ArrowDownRight, Timer, TrendingDown, Layers
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
import { useFeatureControl } from '../hooks/useFeatureControl';
import CategoryDashboardWidgets from '../components/dashboard/CategoryDashboardWidgets';
import { getInvoicePaidTotal, getInvoiceBalanceDue, getInvoicePaymentStatus } from '../utils/financialCalculations';

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
    className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-premium-sm hover:shadow-premium-hover hover-glow-effect transition-all duration-200 relative overflow-hidden group"
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
  const activeWsId = businessSettings?.activeWorkspaceId || 'default';
  const { isFeatureEnabled } = useFeatureControl(activeWsId);

  const hasCustomers = isFeatureEnabled('customer');
  const hasProducts = isFeatureEnabled('product');
  const hasTreasury = isFeatureEnabled('treasury');
  const hasExpenses = isFeatureEnabled('treasury.moneyOut');
  const hasReports = isFeatureEnabled('reports');
  const currencySymbol = businessSettings?.currency || '₹';

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
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void' && new Date(inv.date || inv.createdAt).toDateString() === today)
      .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal || inv.total) || 0), 0);
  }, [invoices]);

  const calculatedTodaysCollections = useMemo(() => {
    const todayStr = new Date().toDateString();
    return invoices
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .reduce((sum, inv) => {
        if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
          const todaysPaidInHistory = inv.paymentHistory
            .filter(p => p.date && new Date(p.date).toDateString() === todayStr)
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
          return sum + todaysPaidInHistory;
        } else if (new Date(inv.date || inv.createdAt).toDateString() === todayStr) {
          return sum + getInvoicePaidTotal(inv);
        }
        return sum;
      }, 0);
  }, [invoices]);

  const calculatedTotalDue = useMemo(() => {
    return invoices
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .reduce((sum, inv) => sum + getInvoiceBalanceDue(inv), 0);
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
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getRecentPayments = () => {
    return [...invoices]
      .filter(inv => {
        if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
        return getInvoicePaidTotal(inv) > 0;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  };

  const getPendingCollection = () => {
    return [...invoices]
      .filter(inv => {
        if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
        return getInvoiceBalanceDue(inv) > 0;
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
        title: `Created ${getInvoiceLabel().slice(0, -1)} #${inv.invoiceNumber || inv.id?.slice(0, 6)}`,
        subtitle: `${inv.customerName || 'Walk-in'} • ${formatCurrency(inv.grandTotal || inv.total || 0)}`,
        status: inv.paymentStatus,
        data: inv
      });
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach((p, idx) => {
          activities.push({
            id: `paid-${inv.id}-${p.id || idx}`,
            type: 'payment_received',
            date: new Date(p.date || inv.updatedAt || inv.createdAt).getTime(),
            title: `Payment Received on #${inv.invoiceNumber || inv.id?.slice(0, 6)}`,
            subtitle: `${inv.customerName || 'Walk-in'} • ${formatCurrency(p.amount)} (${p.method || 'Cash'})`,
            status: 'Paid',
            data: { invoice: inv, payment: p }
          });
        });
      } else {
        const s = (inv.paymentStatus || '').toLowerCase();
        if (s === 'paid' || s === 'partial' || s === 'partially paid') {
          activities.push({
            id: `paid-${inv.id}`,
            type: 'payment_received',
            date: new Date(inv.updatedAt || inv.createdAt).getTime(),
            title: `Payment on ${getInvoiceLabel().slice(0, -1)} #${inv.invoiceNumber || inv.id?.slice(0, 6)}`,
            subtitle: `${inv.customerName || 'Walk-in'} • ${formatCurrency(getInvoicePaidTotal(inv))}`,
            status: inv.paymentStatus,
            data: inv
          });
        }
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
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
      return getInvoiceBalanceDue(inv) > 0;
    }).length;
    const recentInvoices = getRecentInvoices();
    const recentPayments = getRecentPayments();
    const pendingCollection = getPendingCollection();
    const totalOverdue = getOverdueCount(pendingCollection);
    const totalOverdueAmount = invoices
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .filter(inv => {
        const due = getInvoiceBalanceDue(inv);
        if (due <= 0) return false;
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < new Date();
      })
      .reduce((sum, inv) => sum + getInvoiceBalanceDue(inv), 0);
    const totalUpcoming = getUpcomingCount(pendingCollection);
    const activities = getActivities();
    const totalPaymentsCount = invoices.filter(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
      return getInvoicePaidTotal(inv) > 0;
    }).length;
    const paidCount = invoices.filter(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return false;
      return getInvoicePaymentStatus(inv) === 'Paid';
    }).length;
    const totalRevenue = invoices
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal || inv.total) || 0), 0);
    const totalCollected = invoices
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .reduce((sum, inv) => sum + getInvoicePaidTotal(inv), 0);
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
      totalOverdue, totalOverdueAmount, totalUpcoming, activities,
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
    totalOverdue, totalOverdueAmount, totalUpcoming, activities,
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
    invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void').forEach(inv => {
      const d = new Date(inv.date || inv.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daily[key]) {
        daily[key].revenue += parseFloat(inv.grandTotal || inv.total) || 0;
      }
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(p => {
          const pDate = new Date(p.date || inv.date || inv.createdAt);
          const pKey = pDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (daily[pKey]) {
            daily[pKey].collection += parseFloat(p.amount) || 0;
          }
        });
      } else {
        const paid = getInvoicePaidTotal(inv);
        if (daily[key] && paid > 0) {
          daily[key].collection += paid;
        }
      }
    });
    return Object.values(daily);
  };

  function getPaymentBreakdown() {
    let paid = 0, partial = 0, unpaid = 0;
    invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void').forEach(inv => {
      const status = getInvoicePaymentStatus(inv);
      const total = parseFloat(inv.grandTotal || inv.total) || 0;
      const paidAmt = getInvoicePaidTotal(inv);
      const dueAmt = getInvoiceBalanceDue(inv);
      if (status === 'Paid') paid += total;
      else if (status === 'Partially Paid') {
        partial += paidAmt;
        unpaid += dueAmt;
      }
      else unpaid += total;
    });
    return [
      { name: 'Paid', value: Math.round(paid * 100) / 100, color: 'var(--theme-success)' },
      { name: 'Partial', value: Math.round(partial * 100) / 100, color: 'var(--theme-warning)' },
      { name: 'Unpaid', value: Math.round(unpaid * 100) / 100, color: 'var(--theme-danger)' },
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
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full">
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
          <div className="bg-[image:var(--accent-gradient)] text-white rounded-2xl p-5 shadow-premium hover-glow-effect relative overflow-hidden">
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
            {hasCustomers && (
              <button onClick={() => setShowAddCustomerSheet(true)} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
                <Users className="w-3.5 h-3.5" /> Customer
              </button>
            )}
            {hasTreasury && (
              <button onClick={() => setCurrentTab('due-ledger')} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
                <CreditCard className="w-3.5 h-3.5" /> Collect
              </button>
            )}
            {hasReports && (
              <button onClick={() => setCurrentTab('reports')} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
                <BarChart3 className="w-3.5 h-3.5" /> Reports
              </button>
            )}
            {hasProducts && (
              <button onClick={() => setCurrentTab('products')} className="flex-1 flex items-center justify-center gap-1.5 bg-theme-card border border-theme-border-soft rounded-xl py-3 font-bold text-[10px] text-theme-primary active:scale-[0.97] transition-all">
                <Layers className="w-3.5 h-3.5" /> Items
              </button>
            )}
          </div>

          {/* DYNAMIC CATEGORY WIDGETS */}
          <CategoryDashboardWidgets
            businessType={workspaceType}
            products={products}
            invoices={invoices}
            customers={customers}
            currencySymbol={currencySymbol}
            setCurrentTab={setCurrentTab}
            onQuickBillOpen={onQuickBillOpen}
          />

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
        <div className="hidden lg:block w-full max-w-full">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

            {/* Pending Payments Banner */}
            {pendingPaymentsCount > 0 && (
              <motion.button 
                variants={itemVariants} 
                onClick={() => setCurrentTab('pending-payments')} 
                className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left hover:bg-amber-500/15 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">
                      {pendingPaymentsCount} Payment Proof{pendingPaymentsCount > 1 ? 's' : ''} Awaiting Review
                    </p>
                    <p className="text-[11px] text-theme-muted font-medium">Verify customer payment screenshots and reconcile ledger</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Review <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            )}

            {/* HEADER: GREETING & CONTEXT */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-theme-primary tracking-tight">
                  {greeting.text}, {businessSettings?.ownerName?.split(' ')[0] || businessSettings?.businessName?.split(' ')[0] || 'Khairul'} 👋
                </h1>
                <p className="text-xs font-semibold text-theme-muted mt-0.5 flex items-center gap-1.5">
                  <span>Here's what's happening with</span>
                  <span className="font-bold text-theme-primary">{workspaceName}</span>
                  <span>today.</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-theme-card border border-theme-border-soft rounded-2xl shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-theme-primary leading-tight font-numbers">
                      {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                    <p className="text-[10px] font-semibold text-theme-muted">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* DOMINANT FINANCIAL COMMAND CENTER (Hero Overview) */}
            <motion.div variants={itemVariants} className="bg-theme-card rounded-2xl p-6 border border-theme-border-soft shadow-xs">
              <div className="grid grid-cols-12 gap-8 items-center">
                
                {/* Left Column: Big Numbers & Breakdown */}
                <div className="col-span-12 lg:col-span-5 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                        Total Revenue (This Month)
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${parseFloat(revenueGrowth) >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {parseFloat(revenueGrowth) >= 0 ? `↑ +${revenueGrowth}%` : `↓ -${Math.abs(parseFloat(revenueGrowth)).toFixed(1)}%`} vs last month
                      </span>
                    </div>
                    <div className="text-4xl font-black text-theme-primary tracking-tight font-numbers">
                      {formatCurrency(totalRevenue)}
                    </div>
                  </div>

                  {/* Financial Breakdown Strip */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-theme-border-soft">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Collected</p>
                      <p className="text-base font-extrabold text-emerald-500 font-numbers">{formatCurrency(totalCollected)}</p>
                      <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">↑ 12.4%</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Outstanding</p>
                      <p className="text-base font-extrabold text-amber-500 font-numbers">{formatCurrency(totalDue)}</p>
                      <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">↑ 8.7%</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Collection Rate</p>
                      <p className="text-base font-extrabold text-theme-primary font-numbers">{collectionRate}%</p>
                      <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">↑ 5.1%</span>
                    </div>
                  </div>

                  {/* Today's Billings Metric */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-theme-surface/60 border border-theme-border-soft text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-theme-muted">Today's Invoiced Volume</span>
                    </div>
                    <span className="font-extrabold text-theme-primary font-numbers">{formatCurrency(todayEarnings)}</span>
                  </div>
                </div>

                {/* Right Column: Sleek Revenue Trend Timeline */}
                <div className="col-span-12 lg:col-span-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-theme-primary">Revenue & Collection Trend</span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-theme-muted px-2.5 py-1 rounded-lg border border-theme-border-soft bg-theme-surface">
                      <span>Last 7 Days</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="h-44 w-full">
                    {revenueTrend.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-theme-muted">No historical data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fintechRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" opacity={0.35} />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={6} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dx={-4} />
                          <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-soft)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} itemStyle={{ color: 'var(--text-primary)' }} />
                          <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#fintechRevGrad)" dot={false} activeDot={{ r: 4, stroke: 'var(--card-bg)', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* REFINED ACTION TOOLBAR */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button 
                onClick={onQuickBillOpen} 
                className="p-3.5 rounded-2xl bg-theme-accent text-white shadow-sm hover:opacity-95 flex items-center gap-3 transition-all group text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-black truncate">Create Invoice</span>
              </button>

              <button onClick={() => setShowAddCustomerSheet(true)} className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft hover:border-theme-accent/40 shadow-xs flex items-center gap-3 transition-all group text-left cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary truncate">Add Customer</span>
              </button>

              <button onClick={() => setCurrentTab('due-ledger')} className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft hover:border-theme-accent/40 shadow-xs flex items-center gap-3 transition-all group text-left cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary truncate">Record Payment</span>
              </button>

              <button onClick={() => setCurrentTab('reports')} className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft hover:border-theme-accent/40 shadow-xs flex items-center gap-3 transition-all group text-left cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary truncate">View Reports</span>
              </button>

              <button onClick={() => setCurrentTab('expenses')} className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft hover:border-theme-accent/40 shadow-xs flex items-center gap-3 transition-all group text-left cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-theme-primary truncate">Add Expense</span>
              </button>
            </motion.div>

            {/* TWO-COLUMN INTELLIGENCE & ACTIVITY GRID */}
            <motion.div variants={itemVariants} className="grid grid-cols-12 gap-6 items-start">
              
              {/* LEFT: Recent Invoices Table (68% / 8-cols on desktop) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Recent Invoices Table Card */}
                <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-xs p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-theme-border-soft">
                    <h3 className="text-sm font-black text-theme-primary">
                      Recent Invoices
                    </h3>
                    <button onClick={() => setCurrentTab('invoices')} className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1">
                      View Full Invoices <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {recentInvoices.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs text-theme-muted font-medium mb-3">No invoices created yet.</p>
                      <button onClick={onQuickBillOpen} className="btn-premium text-xs py-1.5 px-4">
                        + New Invoice
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-theme-muted uppercase tracking-wider py-3 border-b border-theme-border-soft/60 px-2">
                        <div className="col-span-3">Invoice</div>
                        <div className="col-span-2">Customer</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1 text-right">Paid</div>
                        <div className="col-span-1 text-right">Due</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-theme-border-soft">
                        {recentInvoices.slice(0, 5).map(inv => {
                          const status = statusBadge(inv.paymentStatus);
                          const total = parseFloat(inv.grandTotal || inv.total || 0);
                          const paid = getInvoicePaidTotal(inv);
                          const due = getInvoiceBalanceDue(inv);

                          return (
                            <div 
                              key={inv.id} 
                              className="grid grid-cols-12 gap-2 items-center py-3.5 px-2 hover:bg-theme-surface/50 rounded-xl transition-colors group text-xs font-medium"
                            >
                              {/* Invoice ID */}
                              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-theme-primary font-numbers truncate">{inv.invoiceNumber || `#${inv.id?.slice(0,6)}`}</p>
                                  <p className="text-[10px] text-theme-muted font-semibold">#{inv.id?.slice(-5) || '1001'}</p>
                                </div>
                              </div>

                              {/* Customer */}
                              <div className="col-span-2 text-theme-primary font-semibold truncate">
                                {inv.customerName || 'Walk-in'}
                              </div>

                              {/* Date */}
                              <div className="col-span-2 text-theme-muted text-[11px]">
                                {formatShortDate(inv.createdAt || inv.date)}
                              </div>

                              {/* Total */}
                              <div className="col-span-1 text-right font-black text-theme-primary font-numbers">
                                {formatCurrency(total)}
                              </div>

                              {/* Paid */}
                              <div className="col-span-1 text-right font-black text-emerald-500 font-numbers">
                                {formatCurrency(paid)}
                              </div>

                              {/* Due */}
                              <div className="col-span-1 text-right font-black font-numbers text-theme-primary">
                                {formatCurrency(due)}
                              </div>

                              {/* Status */}
                              <div className="col-span-1 text-center">
                                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${status.classes}`}>
                                  {status.label}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="col-span-1 flex items-center justify-end gap-1 text-theme-muted">
                                <button 
                                  onClick={() => { onViewInvoice(inv); setCurrentTab('invoices'); }}
                                  className="w-6 h-6 flex items-center justify-center hover:text-theme-primary rounded-md transition-colors" 
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => onDownloadPDF && onDownloadPDF(inv)}
                                  className="w-6 h-6 flex items-center justify-center hover:text-theme-primary rounded-md transition-colors" 
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load More Button */}
                      {recentInvoices.length > 5 && (
                        <div className="pt-4 border-t border-theme-border-soft text-center">
                          <button 
                            onClick={() => setCurrentTab('invoices')}
                            className="text-xs font-bold text-theme-muted hover:text-theme-primary inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Load More Invoices</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT: Collection Center, Business Health, Recent Collections (32% / 4-cols on desktop) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* 1. Collection Center */}
                <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-theme-primary">
                      Collection Center
                    </h3>
                    <span className="text-xs font-extrabold text-theme-primary font-numbers">
                      {collectionRate}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-theme-accent rounded-full transition-all duration-700" 
                      style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }} 
                    />
                  </div>

                  <p className="text-[11px] font-semibold text-theme-muted">
                    Keep going! You're doing great.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Collected Funds</p>
                      <p className="text-sm font-black text-emerald-500 font-numbers mt-0.5">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Pending Dues</p>
                      <p className="text-sm font-black text-amber-500 font-numbers mt-0.5">{formatCurrency(totalDue)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme-border-soft">
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Overdue Invoices</p>
                      <p className="text-sm font-black text-rose-500 font-numbers mt-0.5">{totalOverdue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Overdue</p>
                      <p className="text-sm font-black text-rose-500 font-numbers mt-0.5">{formatCurrency(totalOverdueAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Business Health */}
                <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-theme-primary">
                      Business Health
                    </h3>
                    <button onClick={() => setCurrentTab('reports')} className="text-[11px] font-bold text-theme-accent hover:underline">
                      View Full Report
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-theme-muted font-medium">Collection Efficiency</span>
                        <span className="font-bold text-theme-primary font-numbers">{collectionRate}%</span>
                      </div>
                      <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${collectionRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-theme-muted font-medium">Invoice Generation</span>
                        <span className="font-bold text-theme-primary font-numbers">{invoices.length} Invoices</span>
                      </div>
                      <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${Math.min(100, invoices.length * 8)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-theme-muted font-medium">Customer Network</span>
                        <span className="font-bold text-theme-primary font-numbers">{totalCustomers} Active</span>
                      </div>
                      <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${Math.min(100, totalCustomers * 15)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-theme-muted font-medium">Overdue Invoices</span>
                        <span className="font-bold text-theme-primary font-numbers">{totalOverdue} Invoices</span>
                      </div>
                      <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, totalOverdue * 25)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Collections */}
                <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-theme-primary">
                      Recent Collections
                    </h3>
                    <button onClick={() => setCurrentTab('due-ledger')} className="text-[11px] font-bold text-theme-accent hover:underline">
                      View Ledger
                    </button>
                  </div>

                  {recentPayments.length === 0 ? (
                    <p className="text-xs text-theme-muted text-center py-4">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentPayments.slice(0, 3).map((pay, idx) => (
                        <div key={pay.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-theme-primary truncate">{pay.customerName || 'Customer'}</p>
                              <p className="text-[10px] text-theme-muted font-semibold font-numbers">{pay.invoiceNumber || 'INV-0001'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-500 font-numbers block">
                              +{formatCurrency(pay.grandTotal || pay.total || pay.amount || 0)}
                            </span>
                            <span className="text-[9px] text-theme-muted font-semibold">
                              {formatShortDate(pay.updatedAt || pay.createdAt) || 'Today'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
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
