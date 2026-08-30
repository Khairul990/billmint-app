import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle,
  ShieldCheck, Megaphone, FileText, Users, Clock,
  CheckCircle, TrendingUp, TrendingDown,
  BarChart3, RefreshCw, Eye, Download,
  AlertTriangle, ChevronRight, ChevronDown, Building2,
  Layers, ArrowUpRight, ArrowDownRight, Wallet, Activity, ShieldAlert,
  Calendar, PieChart as PieIcon, ArrowUpDown, Sparkles, CircleDot,
  CheckCircle2, DollarSign, ArrowUp, ArrowDown, HelpCircle,
  ShoppingBag, Shield, Check, Flame, Award, Lightbulb, Zap, TrendingUpDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { analyticsEngine } from '../services/analyticsEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';
import { KPISkeleton, ChartSkeleton } from '../components/PremiumSkeleton';
import { useFeatureControl } from '../hooks/useFeatureControl';
import { getInvoicePaidTotal, getInvoiceBalanceDue, getInvoicePaymentStatus } from '../utils/financialCalculations';

// ============================================================================
// ANIMATED NUMBER WITH SMOOTH EASING & CLEAN SIGN/SUFFIX
// ============================================================================
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(null);
  const strValue = String(value ?? '0');

  useEffect(() => {
    if (!strValue || strValue === 'undefined' || strValue === 'null') {
      setDisplayValue('0');
      return;
    }

    const match = strValue.match(/^([^0-9.-]*)(-?[0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      setDisplayValue(strValue);
      return;
    }

    const prefix = match[1] || '';
    const numericValue = parseFloat(match[2]);
    const suffix = match[3] || '';

    if (isNaN(numericValue)) {
      setDisplayValue(strValue);
      return;
    }

    if (Math.abs(numericValue) < 0.0001) {
      const cleanPrefix = prefix.replace(/^[+-]/, '');
      setDisplayValue(`${cleanPrefix}0.00${suffix}`);
      return;
    }

    let startTime = null;
    let rafId;
    const hasDecimal = match[2].includes('.');
    const decimalPlaces = hasDecimal ? match[2].split('.')[1].length : 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = numericValue * eased;
      const formattedNumber = decimalPlaces > 0
        ? Math.abs(currentVal).toLocaleString('en-IN', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
        : Math.round(Math.abs(currentVal)).toLocaleString('en-IN');

      const sign = numericValue < 0 && !prefix.includes('-') ? '-' : '';
      setDisplayValue(`${sign}${prefix}${formattedNumber}${suffix}`);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [strValue]);

  return <>{displayValue ?? strValue}</>;
};

// Helper for local calendar dates
const getLocalCalendarDate = (dateInput = new Date()) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Mini Sparkline Generator
const MiniSparkline = ({ color = '#38bdf8', isPositive = true }) => (
  <div className="w-12 h-5 overflow-hidden flex items-end">
    <svg viewBox="0 0 60 20" className="w-full h-full overflow-visible">
      <path
        d={isPositive ? "M0,16 Q15,18 25,10 T50,4 T60,2" : "M0,4 Q15,2 25,10 T50,16 T60,18"}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  </div>
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
  revenueStatus = {}
}) => {
  const activeWsId = businessSettings?.activeWorkspaceId || 'default';
  const { isFeatureEnabled } = useFeatureControl(activeWsId);

  const hasCustomers = isFeatureEnabled('customer');
  const hasExpenses = isFeatureEnabled('treasury.moneyOut');
  const hasReports = isFeatureEnabled('reports');
  const currencySymbol = businessSettings?.currency || '₹';

  const [showAddCustomerSheet, setShowAddCustomerSheet] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('7d');
  const [timeNow, setTimeNow] = useState(new Date());
  const [, setTriggerSync] = useState(0);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Real-time synchronization listeners
  useEffect(() => {
    const handleDataChange = () => setTriggerSync(prev => prev + 1);
    window.addEventListener('billqyro_invoice_updated', handleDataChange);
    window.addEventListener('billqyro_bank_updated', handleDataChange);
    window.addEventListener('billqyro_sync', handleDataChange);
    window.addEventListener('billqyro:data-updated', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('billqyro_invoice_updated', handleDataChange);
      window.removeEventListener('billqyro_bank_updated', handleDataChange);
      window.removeEventListener('billqyro_sync', handleDataChange);
      window.removeEventListener('billqyro:data-updated', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, []);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const ann = await analyticsEngine.getActiveAnnouncement();
        if (ann) setActiveAnnouncement(ann);
      } catch (e) { /* non-blocking */ }
    };
    loadAnnouncement();
  }, []);

  const getDynamicGreeting = () => {
    const hour = timeNow.getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
    if (hour < 18) return { text: 'Good Afternoon', icon: '🌤️' };
    return { text: 'Good Evening', icon: '🌙' };
  };
  const greeting = getDynamicGreeting();

  const activeWorkspace = useMemo(() =>
    businessSettings?.businessWorkspaces?.find(
      ws => ws.id === businessSettings.activeWorkspaceId
    ), [businessSettings]);
  const workspaceName = activeWorkspace?.name || businessSettings?.businessName || 'Default';
  const workspaceType = activeWorkspace?.type || 'retail';

  // ==========================================================================
  // REAL FINANCIAL DATA AGGREGATION
  // ==========================================================================
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalCalendarDate(now);
    
    // Yesterday comparison date
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalCalendarDate(yesterdayDate);

    // Current & Prev Month prefixes
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
    const activeExpenses = expenses.filter(exp => !exp.isDeleted);

    let todaysSales = 0;
    let todaysOutstanding = 0;
    let todaysCollected = 0;
    let todaysInvoicesCount = 0;
    let todaysPaymentCount = 0;
    let todaysLargestPayment = 0;
    let yesterdaySales = 0;
    let yesterdayCollected = 0;
    let yesterdayPaymentCount = 0;

    let thisMonthRevenue = 0;
    let thisMonthCollected = 0;
    let prevMonthRevenue = 0;
    let prevMonthCollected = 0;

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let dueTodayAmount = 0;
    let dueTodayInvoicesCount = 0;

    const allRecentPayments = [];
    const customerDueMap = new Map();
    const customerOverdueMap = new Map();
    const paymentMethodsMap = new Map();

    const dueAging = {
      current: { amount: 0, count: 0 },
      moderate: { amount: 0, count: 0 },
      aged: { amount: 0, count: 0 }
    };

    activeInvoices.forEach(inv => {
      const invTotal = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const invPaid = getInvoicePaidTotal(inv);
      const invDue = getInvoiceBalanceDue(inv);
      const invDateStr = getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
      
      const isTodayInv = invDateStr === todayStr;
      const isYesterdayInv = invDateStr === yesterdayStr;
      const isThisMonthInv = invDateStr.startsWith(currentMonthPrefix);
      const isPrevMonthInv = invDateStr.startsWith(prevMonthPrefix);

      totalRevenue += invTotal;
      totalCollected += invPaid;
      totalOutstanding += invDue;

      if (isTodayInv) {
        todaysSales += invTotal;
        todaysOutstanding += invDue;
        todaysInvoicesCount++;
      }
      if (isYesterdayInv) {
        yesterdaySales += invTotal;
      }
      if (isThisMonthInv) thisMonthRevenue += invTotal;
      if (isPrevMonthInv) prevMonthRevenue += invTotal;

      const isOverdue = invDue > 0 && inv.dueDate && new Date(inv.dueDate) < now;
      const cKey = inv.customerName || inv.customer?.name || 'Walk-in';

      if (isOverdue) {
        overdueCount++;
        overdueAmount += invDue;
        customerOverdueMap.set(cKey, (customerOverdueMap.get(cKey) || 0) + invDue);
      }

      if (inv.dueDate && getLocalCalendarDate(inv.dueDate) === todayStr && invDue > 0) {
        dueTodayAmount += invDue;
        dueTodayInvoicesCount++;
      }

      if (invDue > 0) {
        customerDueMap.set(cKey, (customerDueMap.get(cKey) || 0) + invDue);

        const invAgeDays = Math.floor((now.getTime() - new Date(inv.date || inv.createdAt || now).getTime()) / (1000 * 60 * 60 * 24));
        if (invAgeDays <= 7) {
          dueAging.current.amount += invDue;
          dueAging.current.count++;
        } else if (invAgeDays <= 30) {
          dueAging.moderate.amount += invDue;
          dueAging.moderate.count++;
        } else {
          dueAging.aged.amount += invDue;
          dueAging.aged.count++;
        }
      }

      // Payments extraction
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(p => {
          const amt = Math.round((parseFloat(p.amount) || 0) * 100) / 100;
          if (amt <= 0) return;
          const pDateStr = getLocalCalendarDate(p.date) || getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
          const pMethod = p.method || inv.paymentMethod || 'Cash';

          paymentMethodsMap.set(pMethod, (paymentMethodsMap.get(pMethod) || 0) + amt);

          const payRecord = {
            id: p.id || `pmt_${inv.id}_${amt}`,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`,
            customerName: cKey,
            amount: amt,
            method: pMethod,
            date: p.date || inv.date || inv.createdAt,
            dateStr: pDateStr,
            status: 'Paid'
          };

          allRecentPayments.push(payRecord);

          if (pDateStr === todayStr) {
            todaysCollected += amt;
            todaysPaymentCount++;
            if (amt > todaysLargestPayment) todaysLargestPayment = amt;
          }
          if (pDateStr === yesterdayStr) {
            yesterdayCollected += amt;
            yesterdayPaymentCount++;
          }
          if (pDateStr.startsWith(currentMonthPrefix)) thisMonthCollected += amt;
          if (pDateStr.startsWith(prevMonthPrefix)) prevMonthCollected += amt;
        });
      } else if (invPaid > 0) {
        const pMethod = inv.paymentMethod || 'Cash';
        paymentMethodsMap.set(pMethod, (paymentMethodsMap.get(pMethod) || 0) + invPaid);

        const payRecord = {
          id: `pmt_init_${inv.id}`,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`,
          customerName: cKey,
          amount: invPaid,
          method: pMethod,
          date: inv.date || inv.createdAt,
          dateStr: invDateStr,
          status: 'Paid'
        };
        allRecentPayments.push(payRecord);
        if (invDateStr === todayStr) {
          todaysCollected += invPaid;
          todaysPaymentCount++;
          if (invPaid > todaysLargestPayment) todaysLargestPayment = invPaid;
        }
        if (invDateStr === yesterdayStr) {
          yesterdayCollected += invPaid;
          yesterdayPaymentCount++;
        }
        if (isThisMonthInv) thisMonthCollected += invPaid;
        if (isPrevMonthInv) prevMonthCollected += invPaid;
      }
    });

    // Cash flow
    let thisMonthExpenses = 0;
    activeExpenses.forEach(exp => {
      const amt = Math.round((parseFloat(exp.amount) || 0) * 100) / 100;
      const expDateStr = getLocalCalendarDate(exp.date) || getLocalCalendarDate(exp.createdAt);
      if (expDateStr.startsWith(currentMonthPrefix)) thisMonthExpenses += amt;
    });

    const thisMonthNetCash = Math.round((thisMonthCollected - thisMonthExpenses) * 100) / 100;
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    const todaysAvgPayment = todaysPaymentCount > 0 ? Math.round((todaysCollected / todaysPaymentCount) * 100) / 100 : 0;
    const todaysProgress = todaysSales > 0 ? Math.min(100, Math.round((todaysCollected / todaysSales) * 100)) : (todaysCollected > 0 ? 100 : 0);

    const revenueGrowthPercent = prevMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : (thisMonthRevenue > 0 ? 100 : 0);

    const collectedGrowthPercent = prevMonthCollected > 0
      ? Math.round(((thisMonthCollected - prevMonthCollected) / prevMonthCollected) * 100)
      : (thisMonthCollected > 0 ? 100 : 0);

    const sortedPayments = allRecentPayments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Top Customers
    const customerStatsMap = new Map();
    activeInvoices.forEach(inv => {
      const name = inv.customerName || inv.customer?.name || 'Walk-in';
      const tot = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const pd = getInvoicePaidTotal(inv);
      const du = getInvoiceBalanceDue(inv);
      const existing = customerStatsMap.get(name) || { name, invoicesCount: 0, totalBilled: 0, collected: 0, outstanding: 0 };
      existing.invoicesCount++;
      existing.totalBilled += tot;
      existing.collected += pd;
      existing.outstanding += du;
      customerStatsMap.set(name, existing);
    });

    const topCustomersList = Array.from(customerStatsMap.values())
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 4);

    // Payment methods
    const totalPaymentsVolume = Array.from(paymentMethodsMap.values()).reduce((s, v) => s + v, 0);
    const paymentMethodsList = Array.from(paymentMethodsMap.entries())
      .map(([method, amount]) => ({
        name: method,
        value: amount,
        percentage: totalPaymentsVolume > 0 ? Math.round((amount / totalPaymentsVolume) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);

    if (paymentMethodsList.length === 0) {
      paymentMethodsList.push({ name: 'Cash', value: 0, percentage: 100 });
    }

    const overdueRatio = totalOutstanding > 0 ? overdueAmount / totalOutstanding : 0;
    const healthStatus = overdueRatio > 0.35 ? 'Critical' : overdueRatio > 0.15 ? 'Attention' : 'Low';

    return {
      todaysSales: Math.round(todaysSales * 100) / 100,
      todaysCollected: Math.round(todaysCollected * 100) / 100,
      todaysOutstanding: Math.round(todaysOutstanding * 100) / 100,
      todaysInvoicesCount,
      todaysPaymentCount,
      todaysAvgPayment,
      todaysLargestPayment,
      todaysProgress,
      yesterdaySales: Math.round(yesterdaySales * 100) / 100,
      yesterdayCollected: Math.round(yesterdayCollected * 100) / 100,
      yesterdayPaymentCount,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      thisMonthCollected: Math.round(thisMonthCollected * 100) / 100,
      thisMonthExpenses: Math.round(thisMonthExpenses * 100) / 100,
      thisMonthNetCash,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      overdueCount,
      dueTodayAmount: Math.round(dueTodayAmount * 100) / 100,
      dueTodayInvoicesCount,
      dueAging: {
        current: { amount: Math.round(dueAging.current.amount * 100) / 100, count: dueAging.current.count },
        moderate: { amount: Math.round(dueAging.moderate.amount * 100) / 100, count: dueAging.moderate.count },
        aged: { amount: Math.round(dueAging.aged.amount * 100) / 100, count: dueAging.aged.count }
      },
      customersWithDueCount: customerDueMap.size,
      collectionRate,
      revenueGrowthPercent,
      collectedGrowthPercent,
      recentPayments: sortedPayments.slice(0, 5),
      topCustomers: topCustomersList,
      paymentMethodsList,
      healthStatus
    };
  }, [invoices, expenses]);

  // ==========================================================================
  // CHART DATA GENERATION
  // ==========================================================================
  const chartSeries = useMemo(() => {
    const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
    const now = new Date();
    const days = [];

    let countDays = 7;
    if (chartTimeframe === '30d') countDays = 30;
    else if (chartTimeframe === 'this_month') countDays = Math.max(1, now.getDate());
    else if (chartTimeframe === 'last_month') countDays = 30;

    for (let i = countDays - 1; i >= 0; i--) {
      const d = new Date(now);
      if (chartTimeframe === 'last_month') {
        d.setMonth(d.getMonth() - 1);
      }
      d.setDate(d.getDate() - i);
      const dateKey = getLocalCalendarDate(d);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateKey, label, sales: 0, collected: 0 });
    }

    const dayMap = new Map(days.map(item => [item.dateKey, item]));

    activeInvoices.forEach(inv => {
      const invDate = getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
      if (dayMap.has(invDate)) {
        dayMap.get(invDate).sales += Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      }
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(p => {
          const pDate = getLocalCalendarDate(p.date) || getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
          if (dayMap.has(pDate)) {
            dayMap.get(pDate).collected += Math.round((parseFloat(p.amount) || 0) * 100) / 100;
          }
        });
      } else {
        const p = getInvoicePaidTotal(inv);
        if (p > 0 && dayMap.has(invDate)) {
          dayMap.get(invDate).collected += p;
        }
      }
    });

    return days;
  }, [invoices, chartTimeframe]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void')
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5);
  }, [invoices]);

  const handleRefresh = async () => {
    try {
      await invoiceEngine.syncFromCloud();
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const PIE_COLORS = ['var(--status-success, #10b981)', 'var(--status-warning, #f59e0b)', 'var(--accent, #d4af7a)', '#8b5cf6'];

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="min-h-screen bg-theme-app text-theme-primary pb-16 font-sans">
          {(isInitialLoad || isLoading) ? (
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 space-y-6">
              <KPISkeleton count={4} />
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 space-y-4">

              {/* ========================================================================= */}
              {/* 1. TOP HEADER / COMMAND CENTER BANNER */}
              {/* ========================================================================= */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-premium">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xl">👋</span>
                    <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
                      {greeting.text}, <span className="text-theme-accent">{businessSettings?.ownerName?.split(' ')[0] || businessSettings?.businessName?.split(' ')[0] || 'Khairul'}</span>
                    </h1>
                    <span className="text-xl">✌️</span>
                  </div>
                  <p className="text-xs text-theme-muted font-medium">Here's your business overview for today</p>
                </div>

                {/* Right Action Strip & Clock */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={onQuickBillOpen}
                    className="btn-premium flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-premium transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ New Invoice</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('due-ledger')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-primary text-xs font-bold transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Record Payment</span>
                  </button>

                  {hasCustomers && (
                    <button
                      onClick={() => setShowAddCustomerSheet(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-primary text-xs font-bold transition-all"
                    >
                      <Users className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Add Customer</span>
                    </button>
                  )}

                  {hasExpenses && (
                    <button
                      onClick={() => setCurrentTab('expenses')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-primary text-xs font-bold transition-all"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Add Expense</span>
                    </button>
                  )}

                  {hasReports && (
                    <button
                      onClick={() => setCurrentTab('reports')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-primary text-xs font-bold transition-all"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-theme-accent" />
                      <span>View Reports</span>
                    </button>
                  )}

                  {/* Live Clock & Sync State */}
                  <div className="flex items-center gap-3 pl-2 sm:border-l border-theme-border-soft">
                    <div className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted">
                      <Clock className="w-4 h-4 text-theme-accent" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider leading-none">
                        {timeNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-black text-theme-primary font-numbers tracking-tight mt-0.5">
                        {timeNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-500">{syncStatus === 'Synced' ? 'Cloud Synced' : syncStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. EXECUTIVE 8 KPI ROW WITH MINI SPARKLINE CHARTS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">

                {/* 1. TODAY'S SALES */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Today's Sales</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.todaysSales, currencySymbol)} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">{metrics.todaysInvoicesCount} invoices</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Yesterday</span>
                      <span className="text-[9px] font-bold text-theme-secondary font-numbers">{formatCurrency(metrics.yesterdaySales, currencySymbol)} (0%)</span>
                    </div>
                    <MiniSparkline color="#38bdf8" isPositive={metrics.todaysSales >= metrics.yesterdaySales} />
                  </div>
                </div>

                {/* 2. TODAY'S COLLECTED */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Today's Collected</p>
                    <p className="text-base font-black text-emerald-500 tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.todaysCollected, currencySymbol)} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">{metrics.todaysPaymentCount} payments</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Yesterday</span>
                      <span className="text-[9px] font-bold text-emerald-500 font-numbers">{formatCurrency(metrics.yesterdayCollected, currencySymbol)} (0%)</span>
                    </div>
                    <MiniSparkline color="#10b981" isPositive={metrics.todaysCollected >= metrics.yesterdayCollected} />
                  </div>
                </div>

                {/* 3. TODAY'S DUE */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Today's Due</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.todaysOutstanding, currencySymbol)} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">Unpaid today</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Yesterday</span>
                      <span className="text-[9px] font-bold text-theme-secondary font-numbers">{formatCurrency(0, currencySymbol)} (0%)</span>
                    </div>
                    <MiniSparkline color="#f59e0b" isPositive={false} />
                  </div>
                </div>

                {/* 4. TODAY'S PAYMENTS */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Today's Payments</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={metrics.todaysPaymentCount} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">Payments received</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Yesterday</span>
                      <span className="text-[9px] font-bold text-purple-500 font-numbers">{metrics.yesterdayPaymentCount} (0%)</span>
                    </div>
                    <MiniSparkline color="#c084fc" isPositive={metrics.todaysPaymentCount >= metrics.yesterdayPaymentCount} />
                  </div>
                </div>

                {/* 5. MONTH REVENUE */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Month Revenue</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.thisMonthRevenue, currencySymbol)} />
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Last Month</span>
                      <span className="text-[9px] font-bold text-emerald-500 font-numbers">+{metrics.revenueGrowthPercent}%</span>
                    </div>
                    <MiniSparkline color="#22d3ee" isPositive={metrics.revenueGrowthPercent >= 0} />
                  </div>
                </div>

                {/* 6. MONTH COLLECTED */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Month Collected</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.thisMonthCollected, currencySymbol)} />
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-theme-muted block">vs Last Month</span>
                      <span className="text-[9px] font-bold text-emerald-500 font-numbers">+{metrics.collectedGrowthPercent}%</span>
                    </div>
                    <MiniSparkline color="#10b981" isPositive={metrics.collectedGrowthPercent >= 0} />
                  </div>
                </div>

                {/* 7. TOTAL OUTSTANDING */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Total Outstanding</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={formatCurrency(metrics.totalOutstanding, currencySymbol)} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">{metrics.customersWithDueCount} accounts</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60">
                    <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden border border-theme-border-soft/40">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (metrics.overdueAmount / (metrics.totalOutstanding || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* 8. COLLECTION RATE */}
                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between hover:border-theme-border-strong transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Collection Rate</p>
                    <p className="text-base font-black text-theme-primary tracking-tight font-numbers mt-0.5">
                      <AnimatedNumber value={`${metrics.collectionRate}%`} />
                    </p>
                    <p className="text-[9px] font-medium text-theme-muted">All time</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-theme-border-soft/60">
                    <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden border border-theme-border-soft/40">
                      <div className="h-full bg-theme-accent rounded-full" style={{ width: `${metrics.collectionRate}%` }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* 3. MIDDLE ROW: TODAY'S PERFORMANCE | CASH FLOW | DUE & AGING RISK */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* CARD 1: TODAY'S PERFORMANCE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Today's Performance</h3>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      {/* Circular Gauge */}
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-theme-surface"
                            strokeWidth="3.2"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-theme-accent"
                            strokeDasharray={`${metrics.todaysProgress}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-base font-black text-theme-primary font-numbers">{metrics.todaysProgress}%</span>
                          <span className="text-[7px] text-theme-muted uppercase font-bold leading-tight">Collection<br />Progress</span>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="space-y-1.5 flex-1 text-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-theme-border-soft">
                          <span className="text-theme-muted text-[11px]">Invoiced Today</span>
                          <span className="font-bold text-theme-primary font-numbers">{formatCurrency(metrics.todaysSales, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-theme-border-soft">
                          <span className="text-theme-muted text-[11px]">Collected Today</span>
                          <span className="font-bold text-emerald-500 font-numbers">{formatCurrency(metrics.todaysCollected, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-theme-muted text-[11px]">Pending Today</span>
                          <span className="font-bold text-amber-500 font-numbers">{formatCurrency(metrics.todaysOutstanding, currencySymbol)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-theme-border-soft text-center">
                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <p className="text-[8px] font-bold text-theme-muted uppercase">Payments</p>
                      <p className="text-xs font-black text-theme-primary font-numbers mt-0.5">{metrics.todaysPaymentCount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <p className="text-[8px] font-bold text-theme-muted uppercase">Avg Payment</p>
                      <p className="text-xs font-black text-theme-primary font-numbers mt-0.5">{formatCurrency(metrics.todaysAvgPayment, currencySymbol)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <p className="text-[8px] font-bold text-theme-muted uppercase">Largest Payment</p>
                      <p className="text-xs font-black text-emerald-500 font-numbers mt-0.5">{formatCurrency(metrics.todaysLargestPayment, currencySymbol)}</p>
                    </div>
                  </div>
                </div>

                {/* CARD 2: CASH FLOW MOVEMENT */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-theme-accent/15 text-theme-accent flex items-center justify-center">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Cash Flow Movement</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-theme-surface border border-theme-border-soft text-theme-muted">This Month ▾</span>
                    </div>

                    <div className="space-y-2.5 py-1">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface border border-theme-border-soft/60">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-theme-primary">Money In (Collections)</span>
                        </div>
                        <span className="text-xs font-black text-emerald-500 font-numbers">
                          +{formatCurrency(metrics.thisMonthCollected, currencySymbol)} ∧
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface border border-theme-border-soft/60">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-theme-primary">Money Out (Expenses)</span>
                        </div>
                        <span className="text-xs font-black text-rose-500 font-numbers">
                          {metrics.thisMonthExpenses > 0 ? `-${formatCurrency(metrics.thisMonthExpenses, currencySymbol)}` : formatCurrency(0, currencySymbol)} ∨
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-theme-border-soft flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Net Cash Flow</p>
                      <p className="text-lg font-black text-emerald-500 font-numbers mt-0.5">
                        {metrics.thisMonthNetCash >= 0 ? `+${formatCurrency(metrics.thisMonthNetCash, currencySymbol)}` : `-${formatCurrency(Math.abs(metrics.thisMonthNetCash), currencySymbol)}`}
                      </p>
                    </div>
                    {/* Golden/Emerald glowing wave */}
                    <div className="w-24 h-8 overflow-hidden">
                      <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                        <path
                          d="M0,25 Q30,30 50,15 T90,5 T100,2"
                          fill="none"
                          stroke="var(--accent, #d4af7a)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* CARD 3: DUE & AGING RISK */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Due & Aging Risk</h3>
                      </div>
                      <button
                        onClick={() => setCurrentTab('due-ledger')}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-accent hover:bg-theme-surface-elevated transition-all"
                      >
                        View Due Ledger
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-center">
                      <div>
                        <p className="text-[8px] font-bold text-theme-muted uppercase">Total Outstanding</p>
                        <p className="text-xs font-black text-amber-500 font-numbers mt-0.5">{formatCurrency(metrics.totalOutstanding, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-theme-muted uppercase">Overdue Amount</p>
                        <p className="text-xs font-black text-rose-500 font-numbers mt-0.5">{formatCurrency(metrics.overdueAmount, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-theme-muted uppercase">Due Today</p>
                        <p className="text-xs font-black text-theme-primary font-numbers mt-0.5">{formatCurrency(metrics.dueTodayAmount, currencySymbol)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-theme-border-soft flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">Aging Summary</p>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="p-1 rounded-lg bg-theme-surface border border-theme-border-soft/40">
                          <p className="text-[7px] font-bold text-theme-muted">0-7 DAYS</p>
                          <p className="text-[9px] font-black text-theme-primary font-numbers">{formatCurrency(metrics.dueAging.current.amount, currencySymbol)}</p>
                          <p className="text-[7px] text-theme-muted">{metrics.dueAging.current.count} invoices</p>
                        </div>
                        <div className="p-1 rounded-lg bg-theme-surface border border-theme-border-soft/40">
                          <p className="text-[7px] font-bold text-theme-muted">8-30 DAYS</p>
                          <p className="text-[9px] font-black text-amber-500 font-numbers">{formatCurrency(metrics.dueAging.moderate.amount, currencySymbol)}</p>
                          <p className="text-[7px] text-theme-muted">{metrics.dueAging.moderate.count} invoice</p>
                        </div>
                        <div className="p-1 rounded-lg bg-theme-surface border border-theme-border-soft/40">
                          <p className="text-[7px] font-bold text-theme-muted">30+ DAYS</p>
                          <p className="text-[9px] font-black text-rose-500 font-numbers">{formatCurrency(metrics.dueAging.aged.amount, currencySymbol)}</p>
                          <p className="text-[7px] text-theme-muted">{metrics.dueAging.aged.count} invoices</p>
                        </div>
                      </div>
                    </div>

                    {/* Shield Risk Badge */}
                    <div className="w-18 h-18 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex flex-col items-center justify-center p-1 shrink-0 shadow-inner">
                      <Shield className="w-4 h-4 text-emerald-500 mb-0.5" />
                      <span className="text-[7px] text-theme-muted font-bold uppercase">Risk Level</span>
                      <span className="text-xs font-black text-emerald-500">{metrics.healthStatus}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* 4. MAIN TWO-COLUMN ROW: CHART (LEFT) | RECENT PAYMENTS & INVOICES (RIGHT) */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                {/* LEFT: SALES VS COLLECTION TREND CHART (6 Cols) */}
                <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-theme-primary font-heading">Sales vs Collection Trend</h3>
                      <p className="text-[10px] text-theme-muted font-medium">Real-time comparison of invoiced sales & actual collections</p>
                    </div>
                    <div className="flex items-center gap-1 bg-theme-surface p-1 rounded-xl border border-theme-border-soft text-[10px] font-bold">
                      {[
                        { key: '7d', label: '7 Days' },
                        { key: '30d', label: '30 Days' },
                        { key: 'this_month', label: 'This Month' },
                        { key: 'last_month', label: 'Last Month' }
                      ].map(tf => (
                        <button
                          key={tf.key}
                          onClick={() => setChartTimeframe(tf.key)}
                          className={`px-2.5 py-1 rounded-lg transition-all ${chartTimeframe === tf.key ? 'bg-theme-accent text-theme-button-text font-black shadow-xs' : 'text-theme-muted hover:text-theme-primary'}`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-theme-muted">Invoiced Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-theme-muted">Collected Cash</span>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGradM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent, #d4af7a)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--accent, #d4af7a)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="collectedGradM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft, rgba(0,0,0,0.05))" opacity={0.5} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted, #8b949e)' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted, #8b949e)' }} dx={-3} />
                        <Tooltip
                          contentStyle={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-soft, #e2e8f0)', borderRadius: '12px', fontSize: '11px', color: 'var(--text-primary, #000)' }}
                          formatter={(val, name) => [formatCurrency(val, currencySymbol), name === 'sales' ? 'Invoiced Sales' : 'Collected Cash']}
                        />
                        <Area type="monotone" dataKey="sales" stroke="var(--accent, #d4af7a)" strokeWidth={2.5} fill="url(#salesGradM)" />
                        <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fill="url(#collectedGradM)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* MIDDLE-RIGHT: RECENT PAYMENTS (3 Cols) */}
                <div className="lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Recent Payments</h3>
                    <button onClick={() => setCurrentTab('due-ledger')} className="text-[10px] font-bold text-theme-accent hover:underline">
                      View All &gt;
                    </button>
                  </div>

                  {metrics.recentPayments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-theme-muted">No payments recorded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {metrics.recentPayments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/60 hover:bg-theme-surface transition-all">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 font-bold text-[9px] flex items-center justify-center shrink-0">
                              {getInitials(p.customerName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-theme-primary truncate">{p.customerName}</p>
                              <p className="text-[9px] text-theme-muted font-medium">{p.method} Payment</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[8px] text-theme-muted font-mono block">{p.invoiceNumber}</span>
                            <p className="text-xs font-black text-emerald-500 font-numbers">+{formatCurrency(p.amount, currencySymbol)}</p>
                            <span className="text-[8px] text-theme-muted">{getLocalCalendarDate(p.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentTab('due-ledger')}
                    className="w-full py-1.5 rounded-xl bg-theme-surface border border-theme-border-soft text-[10px] font-bold text-theme-muted hover:text-theme-primary transition-colors text-center block"
                  >
                    View All Payments ▾
                  </button>
                </div>

                {/* RIGHT: RECENT INVOICES (3 Cols) */}
                <div className="lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Recent Invoices</h3>
                    <button onClick={() => setCurrentTab('invoices')} className="text-[10px] font-bold text-theme-accent hover:underline">
                      View All &gt;
                    </button>
                  </div>

                  {recentInvoices.length === 0 ? (
                    <div className="py-12 text-center text-xs text-theme-muted">No invoices created yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {recentInvoices.map(inv => {
                        const status = (inv.paymentStatus || 'Unpaid').toLowerCase();
                        const isPaid = status === 'paid';
                        const isPartial = status === 'partially paid' || status === 'partial';

                        return (
                          <div key={inv.id} className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/60 hover:bg-theme-surface transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-theme-primary font-mono truncate">{inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`}</p>
                                <p className="text-[9px] text-theme-muted truncate">{inv.customerName || 'Walk-in'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-theme-primary font-numbers">
                                {formatCurrency(inv.grandTotal || inv.total || 0, currencySymbol)}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : isPartial ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Due'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* ========================================================================= */}
              {/* 5. BOTTOM ROW (4 CARDS): TOP CUSTOMERS | PAYMENT METHODS | HEALTH | INSIGHTS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. TOP CUSTOMERS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Top Customers <span className="text-[9px] font-normal text-theme-muted">(By Collected)</span></h3>
                    <button onClick={() => setCurrentTab('customers')} className="text-[10px] font-bold text-theme-accent hover:underline">
                      View All &gt;
                    </button>
                  </div>

                  {metrics.topCustomers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-theme-muted">No customer records yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {metrics.topCustomers.map((c, idx) => (
                        <div key={c.name} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded bg-theme-surface text-[9px] font-bold text-theme-accent flex items-center justify-center shrink-0 border border-theme-border-soft">{idx + 1}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-theme-primary truncate text-[11px]">{c.name}</p>
                              <span className="text-[8px] text-theme-muted">{c.invoicesCount} invoices</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[8px] text-theme-muted block">Collected: <span className="font-bold text-theme-primary font-numbers">{formatCurrency(c.collected, currencySymbol)}</span></span>
                            <span className="text-[8px] text-theme-muted block">Outstanding: <span className="font-bold text-amber-500 font-numbers">{formatCurrency(c.outstanding, currencySymbol)}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. PAYMENT METHODS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Payment Methods</h3>
                    <span className="text-[10px] font-bold text-theme-muted">This Month ▾</span>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    {/* Donut Chart */}
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <PieChart width={80} height={80}>
                        <Pie
                          data={metrics.paymentMethodsList}
                          cx={40}
                          cy={40}
                          innerRadius={24}
                          outerRadius={36}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {metrics.paymentMethodsList.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-theme-primary font-numbers">100%</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-1.5 flex-1 text-xs">
                      {metrics.paymentMethodsList.map((pm, idx) => (
                        <div key={pm.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            <span className="text-theme-muted font-medium">{pm.name}</span>
                          </div>
                          <span className="font-bold text-theme-primary font-numbers">{formatCurrency(pm.value, currencySymbol)} ({pm.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. BUSINESS HEALTH */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Business Health</h3>
                    <button onClick={() => setCurrentTab('reports')} className="text-[10px] font-bold text-theme-accent hover:underline">
                      View Details &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <span className="text-[8px] font-bold text-theme-muted block uppercase">Collection Efficiency</span>
                      <p className="text-sm font-black text-theme-primary font-numbers mt-0.5">{metrics.collectionRate}%</p>
                      <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-0.5 mt-0.5">● Good</span>
                    </div>

                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <span className="text-[8px] font-bold text-theme-muted block uppercase">Invoice Generation</span>
                      <p className="text-sm font-black text-theme-primary font-numbers mt-0.5">{invoices.length}</p>
                      <span className="text-[8px] text-theme-muted block mt-0.5">This Month</span>
                    </div>

                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <span className="text-[8px] font-bold text-theme-muted block uppercase">Customer Network</span>
                      <p className="text-sm font-black text-theme-primary font-numbers mt-0.5">{customers.length}</p>
                      <span className="text-[8px] text-theme-muted block mt-0.5">Active</span>
                    </div>

                    <div className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft/40">
                      <span className="text-[8px] font-bold text-theme-muted block uppercase">Outstanding Risk</span>
                      <p className="text-sm font-black text-emerald-500 mt-0.5">{metrics.healthStatus}</p>
                      <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-0.5 mt-0.5">💚 Healthy</span>
                    </div>
                  </div>
                </div>

                {/* 4. QUICK INSIGHTS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft">
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Quick Insights</h3>
                    <span className="text-[10px] font-bold text-theme-muted">This Month ▾</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                      <Sparkles className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-theme-secondary font-medium">Keep going! You're doing great.</p>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                      <BarChart3 className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-theme-secondary font-medium">Your collection is {metrics.collectionRate}% efficient this period.</p>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                      <Lightbulb className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-theme-secondary font-medium">
                        {metrics.dueTodayInvoicesCount > 0 ? `${metrics.dueTodayInvoicesCount} invoices are due today.` : 'All today invoices are settled.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

        <AddCustomerSheet
          isOpen={showAddCustomerSheet}
          onClose={() => setShowAddCustomerSheet(false)}
          onSave={async (customerData) => {
            await onSaveCustomer?.(customerData);
            setShowAddCustomerSheet(false);
          }}
          businessSettings={businessSettings}
        />
      </PullToRefresh>
    </AnimatedPage>
  );
};

export default Dashboard;
