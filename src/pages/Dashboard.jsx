import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus, CreditCard, Bell, ArrowRight, Receipt, AlertCircle,
  ShieldCheck, Megaphone, FileText, Users, Clock,
  CheckCircle, TrendingUp, TrendingDown,
  BarChart3, RefreshCw, Eye, Download,
  AlertTriangle, ChevronRight, ChevronDown, Building2,
  Layers, ArrowUpRight, ArrowDownRight, Wallet, Activity, ShieldAlert,
  Calendar, PieChart as PieIcon, ArrowUpDown, Sparkles, CircleDot
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { analyticsEngine } from '../services/analyticsEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';
import { KPISkeleton, ChartSkeleton } from '../components/PremiumSkeleton';
import ActivityFeed from '../components/ActivityFeed';
import { useFeatureControl } from '../hooks/useFeatureControl';
import CategoryDashboardWidgets from '../components/dashboard/CategoryDashboardWidgets';
import { getInvoicePaidTotal, getInvoiceBalanceDue, getInvoicePaymentStatus } from '../utils/financialCalculations';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(null);
  const strValue = String(value ?? '0');

  useEffect(() => {
    if (!strValue || strValue === 'undefined' || strValue === 'null') {
      setDisplayValue('0');
      return;
    }

    // Match leading prefix, numeric digits, and trailing suffix
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

    // Eliminate negative zero completely
    if (Math.abs(numericValue) < 0.0001) {
      const cleanPrefix = prefix.replace(/^[+-]/, '');
      setDisplayValue(`${cleanPrefix}0${suffix}`);
      return;
    }

    let startTime = null;
    let rafId;
    const hasDecimal = match[2].includes('.');
    const decimalPlaces = hasDecimal ? match[2].split('.')[1].length : 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 500, 1);
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

const LuxuryKpiCard = ({ title, value, icon: Icon, subtext, trend, trendUp = true, highlight = false }) => (
  <div
    className={`bg-theme-card border ${highlight ? 'border-theme-accent/40 shadow-premium hover:border-theme-accent' : 'border-theme-border-soft/70 shadow-xs hover:border-theme-border-strong'} rounded-2xl p-4 transition-all duration-200 relative overflow-hidden group hover:-translate-y-0.5`}
  >
    <div className="flex items-start justify-between mb-2">
      <div className={`p-2.5 rounded-xl ${highlight ? 'bg-theme-accent text-white shadow-xs' : 'bg-theme-accent/10 text-theme-accent'} group-hover:scale-105 transition-transform shrink-0`}>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      {trend && (
        <span className={`flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-0.5">{title}</p>
    <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums font-numbers">
      <AnimatedNumber value={value} />
    </p>
    {subtext && <p className="text-[10px] font-semibold text-theme-muted mt-1 truncate">{subtext}</p>}
  </div>
);

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
  const hasProducts = isFeatureEnabled('product');
  const hasTreasury = isFeatureEnabled('treasury');
  const hasExpenses = isFeatureEnabled('treasury.moneyOut');
  const hasReports = isFeatureEnabled('reports');
  const currencySymbol = businessSettings?.currency || '₹';

  const [showAddCustomerSheet, setShowAddCustomerSheet] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('7d'); // '7d' | '30d' | 'this_month' | 'last_month'
  const [, setTriggerSync] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Real-time synchronization listeners across workspace mutations
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
    const hour = new Date().getHours();
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
  // REAL FINANCIAL DATA AGGREGATION & INTELLIGENCE
  // ==========================================================================

  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalCalendarDate(now);
    
    // Yesterday comparison date
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalCalendarDate(yesterdayDate);

    // Current Month & Previous Month
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
    const activeExpenses = expenses.filter(exp => !exp.isDeleted);

    // 1. TODAY'S & YESTERDAY'S METRICS
    let todaysSales = 0;
    let todaysOutstanding = 0;
    let todaysCollected = 0;
    let todaysPaymentCount = 0;
    let todaysLargestPayment = 0;
    let yesterdaySales = 0;
    let yesterdayCollected = 0;

    // 2. MONTHLY METRICS
    let thisMonthRevenue = 0;
    let thisMonthCollected = 0;
    let prevMonthRevenue = 0;
    let prevMonthCollected = 0;

    // 3. LIFETIME METRICS & DUE INTELLIGENCE
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let dueTodayAmount = 0;
    let maxInvoiceDue = 0;
    let largestDueInvoice = null;

    const pipeline = { draft: 0, sent: 0, partial: 0, paid: 0, overdue: 0 };
    const allRecentPayments = [];
    const customerDueMap = new Map();
    const customerOverdueMap = new Map();
    const paymentMethodsMap = new Map();

    // Due Aging Buckets (0-7d, 8-30d, 30+d)
    const dueAging = { current: 0, moderate: 0, aged: 0 };

    activeInvoices.forEach(inv => {
      const invTotal = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const invPaid = getInvoicePaidTotal(inv);
      const invDue = getInvoiceBalanceDue(inv);
      const invStatus = getInvoicePaymentStatus(inv);
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
      }
      if (isYesterdayInv) {
        yesterdaySales += invTotal;
      }
      if (isThisMonthInv) thisMonthRevenue += invTotal;
      if (isPrevMonthInv) prevMonthRevenue += invTotal;

      // Pipeline & Due Intelligence
      const isOverdue = invDue > 0 && inv.dueDate && new Date(inv.dueDate) < now;
      const cKey = inv.customerName || inv.customer?.name || 'Walk-in';

      if (isOverdue) {
        overdueCount++;
        overdueAmount += invDue;
        pipeline.overdue++;
        customerOverdueMap.set(cKey, (customerOverdueMap.get(cKey) || 0) + invDue);
      } else if (invStatus === 'Paid') {
        pipeline.paid++;
      } else if (invStatus === 'Partially Paid') {
        pipeline.partial++;
      } else {
        pipeline.sent++;
      }

      if (inv.dueDate && getLocalCalendarDate(inv.dueDate) === todayStr && invDue > 0) {
        dueTodayAmount += invDue;
      }

      if (invDue > maxInvoiceDue) {
        maxInvoiceDue = invDue;
        largestDueInvoice = inv;
      }

      if (invDue > 0) {
        customerDueMap.set(cKey, (customerDueMap.get(cKey) || 0) + invDue);

        // Calculate Aging
        const invAgeDays = Math.floor((now.getTime() - new Date(inv.date || inv.createdAt || now).getTime()) / (1000 * 60 * 60 * 24));
        if (invAgeDays <= 7) dueAging.current += invDue;
        else if (invAgeDays <= 30) dueAging.moderate += invDue;
        else dueAging.aged += invDue;
      }

      // Payments from paymentHistory
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
        }
        if (isThisMonthInv) thisMonthCollected += invPaid;
        if (isPrevMonthInv) prevMonthCollected += invPaid;
      }
    });

    // 4. CASH FLOW (MONEY IN vs MONEY OUT)
    let todaysExpenses = 0;
    let thisMonthExpenses = 0;
    activeExpenses.forEach(exp => {
      const amt = Math.round((parseFloat(exp.amount) || 0) * 100) / 100;
      const expDateStr = getLocalCalendarDate(exp.date) || getLocalCalendarDate(exp.createdAt);
      if (expDateStr === todayStr) todaysExpenses += amt;
      if (expDateStr.startsWith(currentMonthPrefix)) thisMonthExpenses += amt;
    });

    const todaysNetCash = Math.round((todaysCollected - todaysExpenses) * 100) / 100;
    const thisMonthNetCash = Math.round((thisMonthCollected - thisMonthExpenses) * 100) / 100;

    // Rates & Trends
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    const todaysAvgPayment = todaysPaymentCount > 0 ? Math.round((todaysCollected / todaysPaymentCount) * 100) / 100 : 0;
    const todaysProgress = todaysSales > 0 ? Math.min(100, Math.round((todaysCollected / todaysSales) * 100)) : (todaysCollected > 0 ? 100 : 0);

    const revenueGrowthPercent = prevMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : (thisMonthRevenue > 0 ? 100 : 0);

    const sortedPayments = allRecentPayments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Top Customers by billing & collected
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
      .slice(0, 5);

    // Payment methods array for breakdown pill
    const paymentMethodsList = Array.from(paymentMethodsMap.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Business Health breakdown (Transparent real data calculations)
    const overdueRatio = totalOutstanding > 0 ? overdueAmount / totalOutstanding : 0;
    const riskLevel = overdueRatio > 0.35 ? 'Elevated' : overdueRatio > 0.15 ? 'Moderate' : 'Low';
    const riskColor = riskLevel === 'Low' ? 'text-emerald-500' : riskLevel === 'Moderate' ? 'text-amber-500' : 'text-rose-500';

    return {
      todaysSales: Math.round(todaysSales * 100) / 100,
      todaysCollected: Math.round(todaysCollected * 100) / 100,
      todaysOutstanding: Math.round(todaysOutstanding * 100) / 100,
      todaysPaymentCount,
      todaysAvgPayment,
      todaysLargestPayment,
      todaysProgress,
      yesterdaySales: Math.round(yesterdaySales * 100) / 100,
      yesterdayCollected: Math.round(yesterdayCollected * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      thisMonthCollected: Math.round(thisMonthCollected * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      overdueCount,
      dueTodayAmount: Math.round(dueTodayAmount * 100) / 100,
      largestDueInvoice,
      dueAging: {
        current: Math.round(dueAging.current * 100) / 100,
        moderate: Math.round(dueAging.moderate * 100) / 100,
        aged: Math.round(dueAging.aged * 100) / 100
      },
      customersWithDueCount: customerDueMap.size,
      todaysExpenses: Math.round(todaysExpenses * 100) / 100,
      thisMonthExpenses: Math.round(thisMonthExpenses * 100) / 100,
      todaysNetCash,
      thisMonthNetCash,
      collectionRate,
      revenueGrowthPercent,
      recentPayments: sortedPayments.slice(0, 6),
      topCustomers: topCustomersList,
      paymentMethodsList,
      pipeline,
      riskLevel,
      riskColor
    };
  }, [invoices, expenses]);

  // ==========================================================================
  // DYNAMIC CHART DATA GENERATION
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

  const activities = useMemo(() => {
    const list = [];
    invoices.forEach(inv => {
      list.push({
        id: `created-${inv.id}`,
        type: 'invoice_created',
        date: new Date(inv.createdAt || inv.date || Date.now()).getTime(),
        title: `Invoice #${inv.invoiceNumber || inv.id?.slice(0, 6)}`,
        subtitle: `${inv.customerName || 'Walk-in'} • ${formatCurrency(inv.grandTotal || inv.total || 0, currencySymbol)}`,
        status: inv.paymentStatus || 'Unpaid'
      });
      if (Array.isArray(inv.paymentHistory)) {
        inv.paymentHistory.forEach((p, idx) => {
          list.push({
            id: `paid-${inv.id}-${p.id || idx}`,
            type: 'payment_received',
            date: new Date(p.date || inv.updatedAt || inv.createdAt || Date.now()).getTime(),
            title: `Payment on #${inv.invoiceNumber || inv.id?.slice(0, 6)}`,
            subtitle: `${inv.customerName || 'Walk-in'} • ${formatCurrency(p.amount, currencySymbol)} (${p.method || 'Cash'})`,
            status: 'Paid'
          });
        });
      }
    });
    return list.sort((a, b) => b.date - a.date).slice(0, 6);
  }, [invoices, currencySymbol]);

  const handleRefresh = async () => {
    try {
      await invoiceEngine.syncFromCloud();
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return { label: 'Paid', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
    if (s === 'partial' || s === 'partially paid') return { label: 'Partial', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
    if (s === 'pending' || s === 'pending verification') return { label: 'Pending', classes: 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20' };
    if (s === 'overdue') return { label: 'Overdue', classes: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' };
    return { label: 'Unpaid', classes: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' };
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="min-h-screen bg-theme-surface/40 pb-16">
          {(isInitialLoad || isLoading) ? (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full">
              <KPISkeleton count={4} />
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">

              {/* PENDING PROOFS BANNER */}
              {pendingPaymentsCount > 0 && (
                <button
                  onClick={() => setCurrentTab('pending-payments')}
                  className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left hover:bg-amber-500/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-primary">
                        {pendingPaymentsCount} Payment Proof{pendingPaymentsCount > 1 ? 's' : ''} Pending Review
                      </p>
                      <p className="text-[11px] text-theme-muted font-medium">Verify customer payment submissions</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Review <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}

              {/* GREETING & WORKSPACE LUXURY COMMAND HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-theme-card border border-theme-border-soft shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-black text-theme-primary tracking-tight font-heading">
                      {greeting.text}, {businessSettings?.ownerName?.split(' ')[0] || businessSettings?.businessName?.split(' ')[0] || 'Admin'} 👋
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-theme-muted">
                    <span className="flex items-center gap-1 text-theme-primary font-bold">
                      <Building2 className="w-3.5 h-3.5 text-theme-accent" /> {workspaceName}
                    </span>
                    <span>&middot;</span>
                    <span className="capitalize px-2 py-0.5 rounded-md bg-theme-surface text-theme-muted border border-theme-border-soft text-[10px] font-bold">
                      {workspaceType}
                    </span>
                    <span>&middot;</span>
                    <span className="text-theme-muted font-medium">Financial Command Cockpit</span>
                  </div>
                </div>

                {/* Right controls: Quick Date, Sync Status, Action Shortcuts */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-muted">
                    <Clock className="w-3.5 h-3.5 text-theme-accent" />
                    <span className="font-numbers">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                    <CircleDot className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>{syncStatus === 'Synced' ? 'Live Synced' : syncStatus}</span>
                  </div>
                  <button
                    onClick={onQuickBillOpen}
                    className="btn-premium flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl shadow-premium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ New Invoice</span>
                  </button>
                </div>
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

              {/* ========================================================================= */}
              {/* TOP 8 KPI EXECUTIVE METRICS GRID */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <LuxuryKpiCard
                  title="Today Sales"
                  value={formatCurrency(metrics.todaysSales, currencySymbol)}
                  icon={FileText}
                  subtext={metrics.yesterdaySales > 0 ? `vs Yday (${formatCurrency(metrics.yesterdaySales, currencySymbol)})` : 'Invoices today'}
                />
                <LuxuryKpiCard
                  title="Today Collected"
                  value={formatCurrency(metrics.todaysCollected, currencySymbol)}
                  icon={CreditCard}
                  highlight
                  subtext={`${metrics.todaysPaymentCount} payment${metrics.todaysPaymentCount === 1 ? '' : 's'}`}
                />
                <LuxuryKpiCard
                  title="Today Due"
                  value={formatCurrency(metrics.todaysOutstanding, currencySymbol)}
                  icon={AlertCircle}
                  subtext="Unpaid today"
                />
                <LuxuryKpiCard
                  title="Payments"
                  value={metrics.todaysPaymentCount}
                  icon={CheckCircle}
                  subtext="Received today"
                />
                <LuxuryKpiCard
                  title="Month Revenue"
                  value={formatCurrency(metrics.thisMonthRevenue, currencySymbol)}
                  icon={TrendingUp}
                  trend={metrics.revenueGrowthPercent !== 0 ? `${metrics.revenueGrowthPercent > 0 ? '+' : ''}${metrics.revenueGrowthPercent}%` : null}
                  trendUp={metrics.revenueGrowthPercent >= 0}
                />
                <LuxuryKpiCard
                  title="Month Collected"
                  value={formatCurrency(metrics.thisMonthCollected, currencySymbol)}
                  icon={Wallet}
                  subtext="Cash Inflow"
                />
                <LuxuryKpiCard
                  title="Total Due"
                  value={formatCurrency(metrics.totalOutstanding, currencySymbol)}
                  icon={AlertTriangle}
                  subtext={`${metrics.customersWithDueCount} customer${metrics.customersWithDueCount === 1 ? '' : 's'}`}
                />
                <LuxuryKpiCard
                  title="Collection Rate"
                  value={`${metrics.collectionRate}%`}
                  icon={Activity}
                  subtext="All time"
                />
              </div>

              {/* ========================================================================= */}
              {/* TODAY'S COLLECTION CENTER, CASH FLOW SNAPSHOT & DUE INTELLIGENCE */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Card 1: Today's Collection Center */}
                <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-theme-border-strong transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-theme-primary">Today's Collection</h3>
                      </div>
                      <span className="text-xs font-black text-emerald-500 font-numbers px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {metrics.todaysProgress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden mb-4 border border-theme-border-soft/40">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${metrics.todaysProgress}%` }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-b border-theme-border-soft">
                      <div>
                        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Collected Today</p>
                        <p className="text-lg font-black text-emerald-500 font-numbers">{formatCurrency(metrics.todaysCollected, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Pending Today</p>
                        <p className="text-lg font-black text-amber-500 font-numbers">{formatCurrency(metrics.todaysOutstanding, currencySymbol)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                    <div className="p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/30">
                      <p className="text-[9px] font-bold text-theme-muted uppercase">Payments</p>
                      <p className="text-xs font-black text-theme-primary font-numbers mt-0.5">{metrics.todaysPaymentCount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/30">
                      <p className="text-[9px] font-bold text-theme-muted uppercase">Avg Pay</p>
                      <p className="text-xs font-black text-theme-primary font-numbers mt-0.5">{formatCurrency(metrics.todaysAvgPayment, currencySymbol)}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/30">
                      <p className="text-[9px] font-bold text-theme-muted uppercase">Largest</p>
                      <p className="text-xs font-black text-emerald-500 font-numbers mt-0.5">{formatCurrency(metrics.todaysLargestPayment, currencySymbol)}</p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Cash Flow Snapshot */}
                <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-theme-border-strong transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-theme-accent/10 text-theme-accent">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-theme-primary">Cash Flow Snapshot</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-surface text-theme-muted border border-theme-border-soft">This Month</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                        <div className="flex items-center gap-2">
                          <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-theme-primary">Money In (Collections)</span>
                        </div>
                        <span className="text-xs font-black text-emerald-500 font-numbers">
                          +{formatCurrency(metrics.thisMonthCollected, currencySymbol)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-rose-500" />
                          <span className="text-xs font-bold text-theme-primary">Money Out (Expenses)</span>
                        </div>
                        <span className="text-xs font-black text-rose-500 font-numbers">
                          {metrics.thisMonthExpenses > 0 ? `-${formatCurrency(metrics.thisMonthExpenses, currencySymbol)}` : formatCurrency(0, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-theme-border-soft flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Net Cash Flow</p>
                      <p className={`text-base font-black font-numbers ${metrics.thisMonthNetCash > 0 ? 'text-emerald-500' : metrics.thisMonthNetCash < 0 ? 'text-rose-500' : 'text-theme-primary'}`}>
                        {metrics.thisMonthNetCash > 0 ? `+${formatCurrency(metrics.thisMonthNetCash, currencySymbol)}` : metrics.thisMonthNetCash < 0 ? `-${formatCurrency(Math.abs(metrics.thisMonthNetCash), currencySymbol)}` : formatCurrency(0, currencySymbol)}
                      </p>
                    </div>
                    <button onClick={() => setCurrentTab('expenses')} className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1">
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 3: Due & Overdue Intelligence with Aging */}
                <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-theme-border-strong transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-theme-primary">Due Intelligence</h3>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${metrics.overdueCount > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {metrics.overdueCount > 0 ? `${metrics.overdueCount} Overdue` : 'Clean'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-b border-theme-border-soft">
                      <div>
                        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Total Outstanding</p>
                        <p className="text-base font-black text-amber-500 font-numbers">{formatCurrency(metrics.totalOutstanding, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Overdue Amount</p>
                        <p className="text-base font-black text-rose-500 font-numbers">{formatCurrency(metrics.overdueAmount, currencySymbol)}</p>
                      </div>
                    </div>

                    {/* Lightweight Due Aging Summary */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2.5 text-center">
                      <div className="p-1.5 rounded-lg bg-theme-surface/70 border border-theme-border-soft/30">
                        <p className="text-[8px] font-bold text-theme-muted uppercase">0-7 Days</p>
                        <p className="text-[10px] font-black text-theme-primary font-numbers">{formatCurrency(metrics.dueAging.current, currencySymbol)}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-theme-surface/70 border border-theme-border-soft/30">
                        <p className="text-[8px] font-bold text-theme-muted uppercase">8-30 Days</p>
                        <p className="text-[10px] font-black text-amber-500 font-numbers">{formatCurrency(metrics.dueAging.moderate, currencySymbol)}</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-theme-surface/70 border border-theme-border-soft/30">
                        <p className="text-[8px] font-bold text-theme-muted uppercase">30+ Days</p>
                        <p className="text-[10px] font-black text-rose-500 font-numbers">{formatCurrency(metrics.dueAging.aged, currencySymbol)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-theme-border-soft flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Due Today</p>
                      <p className="text-xs font-bold text-theme-primary font-numbers">{formatCurrency(metrics.dueTodayAmount, currencySymbol)}</p>
                    </div>
                    <button onClick={() => setCurrentTab('due-ledger')} className="btn-premium text-xs py-1.5 px-3">
                      View Due Ledger
                    </button>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* COLLECTION & REVENUE TREND CHART */}
              {/* ========================================================================= */}
              <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-black text-theme-primary font-heading">Sales & Collection Trend</h3>
                    <p className="text-xs text-theme-muted font-medium mt-0.5">Real-time revenue versus actual collected cash</p>
                  </div>
                  <div className="flex items-center gap-1 bg-theme-surface p-1 rounded-xl border border-theme-border-soft text-xs font-bold">
                    {[
                      { key: '7d', label: '7 Days' },
                      { key: '30d', label: '30 Days' },
                      { key: 'this_month', label: 'This Month' },
                      { key: 'last_month', label: 'Last Month' }
                    ].map(tf => (
                      <button
                        key={tf.key}
                        onClick={() => setChartTimeframe(tf.key)}
                        className={`px-3 py-1 rounded-lg transition-all ${chartTimeframe === tf.key ? 'bg-theme-card text-theme-primary shadow-xs' : 'text-theme-muted hover:text-theme-primary'}`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--theme-accent, #6366f1)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--theme-accent, #6366f1)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border-soft, rgba(255,255,255,0.1))" opacity={0.5} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--theme-text-muted, #94a3b8)' }} dy={6} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--theme-text-muted, #94a3b8)' }} dx={-4} />
                      <Tooltip
                        contentStyle={{ background: 'var(--theme-card, #1e293b)', border: '1px solid var(--theme-border-soft, #334155)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val, name) => [formatCurrency(val, currencySymbol), name === 'sales' ? 'Sales Volume' : 'Collected Cash']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="var(--theme-accent, #6366f1)" strokeWidth={2.5} fill="url(#salesGrad)" />
                      <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fill="url(#collectedGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-theme-accent" />
                    <span className="text-theme-muted">Invoiced Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-theme-muted">Collected Cash</span>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* RECENT INVOICES & RECENT PAYMENTS TWO-COLUMN GRID */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Recent Invoices Table (8 Cols) */}
                <div className="lg:col-span-8 bg-theme-card rounded-2xl border border-theme-border-soft shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                    <div>
                      <h3 className="text-sm font-black text-theme-primary font-heading">Recent Invoices</h3>
                      <p className="text-[11px] text-theme-muted font-medium">Latest bills generated in this workspace</p>
                    </div>
                    <button onClick={() => setCurrentTab('invoices')} className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {recentInvoices.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs text-theme-muted font-medium mb-3">No invoices created yet.</p>
                      <button onClick={onQuickBillOpen} className="btn-premium text-xs py-1.5 px-4">
                        + Create First Invoice
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-theme-border-soft">
                      {recentInvoices.map(inv => {
                        const status = statusBadge(inv.paymentStatus);
                        const total = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
                        const paid = getInvoicePaidTotal(inv);
                        const due = getInvoiceBalanceDue(inv);

                        return (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between py-3 px-2 hover:bg-theme-surface/50 rounded-xl transition-colors text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-theme-primary truncate">{inv.customerName || 'Walk-in Customer'}</p>
                                <p className="text-[10px] text-theme-muted font-semibold font-numbers">
                                  {inv.invoiceNumber || `#${inv.id?.slice(0, 6)}`} &middot; {getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-black text-theme-primary font-numbers">{formatCurrency(total, currencySymbol)}</p>
                                {due > 0 ? (
                                  <p className="text-[10px] font-bold text-amber-500 font-numbers">Due: {formatCurrency(due, currencySymbol)}</p>
                                ) : (
                                  <p className="text-[10px] font-bold text-emerald-500 font-numbers">Paid in full</p>
                                )}
                              </div>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${status.classes}`}>
                                {status.label}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { onViewInvoice?.(inv); setCurrentTab('invoices'); }}
                                  className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDownloadPDF?.(inv)}
                                  className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Recent Payments & Top Customers (4 Cols) */}
                <div className="lg:col-span-4 bg-theme-card rounded-2xl border border-theme-border-soft shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                    <div>
                      <h3 className="text-sm font-black text-theme-primary font-heading">Recent Payments</h3>
                      <p className="text-[11px] text-theme-muted font-medium">Reconciled payment receipts</p>
                    </div>
                    <button onClick={() => setCurrentTab('due-ledger')} className="text-xs font-bold text-theme-accent hover:underline">
                      Ledger
                    </button>
                  </div>

                  {metrics.recentPayments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-theme-muted">No payments recorded yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {metrics.recentPayments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border-soft/40">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-theme-primary truncate">{p.customerName}</p>
                              <p className="text-[10px] text-theme-muted font-semibold font-numbers">{p.invoiceNumber} &middot; {p.method}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-emerald-500 font-numbers">+{formatCurrency(p.amount, currencySymbol)}</p>
                            <p className="text-[9px] text-theme-muted font-medium">{getLocalCalendarDate(p.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top Customers Mini Widget */}
                  {metrics.topCustomers.length > 0 && (
                    <div className="pt-3 border-t border-theme-border-soft space-y-2">
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Top Paying Customers</p>
                      {metrics.topCustomers.slice(0, 3).map((cust, idx) => (
                        <div key={cust.name} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-theme-surface text-[9px] font-bold flex items-center justify-center border border-theme-border-soft">{idx + 1}</span>
                            <span className="font-semibold text-theme-primary truncate">{cust.name}</span>
                          </div>
                          <span className="font-black text-theme-primary font-numbers">{formatCurrency(cust.collected, currencySymbol)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

              {/* ========================================================================= */}
              {/* BUSINESS HEALTH & ACTIVITY TIMELINE */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Business Health Card */}
                <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                    <h3 className="text-sm font-black text-theme-primary font-heading">Business Financial Health</h3>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full bg-theme-surface border border-theme-border-soft ${metrics.riskColor}`}>
                      Risk: {metrics.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between py-0.5 font-bold">
                        <span className="text-theme-muted">Collection Efficiency</span>
                        <span className="text-theme-primary font-numbers">{metrics.collectionRate}%</span>
                      </div>
                      <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden mt-1 border border-theme-border-soft/40">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.collectionRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between py-0.5 font-bold">
                        <span className="text-theme-muted">Invoice Inflow</span>
                        <span className="text-theme-primary font-numbers">{invoices.length} Total</span>
                      </div>
                      <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden mt-1 border border-theme-border-soft/40">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${Math.min(100, invoices.length * 5)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between py-0.5 font-bold">
                        <span className="text-theme-muted">Customer Network</span>
                        <span className="text-theme-primary font-numbers">{customers.length} Accounts</span>
                      </div>
                      <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden mt-1 border border-theme-border-soft/40">
                        <div className="h-full bg-theme-accent rounded-full" style={{ width: `${Math.min(100, customers.length * 10)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Card */}
                <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft">
                    <h3 className="text-sm font-black text-theme-primary font-heading">Recent Activity Timeline</h3>
                    <span className="text-[10px] font-bold text-theme-muted uppercase">Live Activity</span>
                  </div>
                  <div className="-mx-2">
                    <ActivityFeed activities={activities} maxItems={4} />
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
