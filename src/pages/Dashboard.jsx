import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ShoppingBag, Shield, Check, Flame, Award, Lightbulb, Zap, UserPlus,
  Heart, Coins, Smartphone, Moon, Target, X
} from 'lucide-react';
import { paymentEngine } from '../services/paymentEngine';
import { bankEngine } from '../services/bankEngine';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { invoiceEngine } from '../services/invoiceEngine';
import { analyticsEngine } from '../services/analyticsEngine';
import AddCustomerSheet from '../components/AddCustomerSheet';
import QuickPayModal from '../components/payments/QuickPayModal';
import { KPISkeleton, ChartSkeleton } from '../components/PremiumSkeleton';
import { useFeatureControl } from '../hooks/useFeatureControl';
import { 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus,
  calculateAgingDistribution,
  calculateCollectionPriority,
  filterByWorkspace,
  roundTo2
} from '../utils/invoiceMath';

// ============================================================================
// ANIMATED NUMBER WITH SMOOTH EASING & CLEAN SIGN/SUFFIX PRESERVATION
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
  onRecordPayment,
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
  const [quickPayInvoice, setQuickPayInvoice] = useState(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState('7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeNow, setTimeNow] = useState(new Date());
  const [, setTriggerSync] = useState(0);

  // Live Bank Ledger & Personal Financial Buckets
  const [liveBankLedger, setLiveBankLedger] = useState([]);
  const [showDreamAddModal, setShowDreamAddModal] = useState(false);
  const [showDreamWithdrawModal, setShowDreamWithdrawModal] = useState(false);
  const [showDreamCreateModal, setShowDreamCreateModal] = useState(false);
  const [dreamTransferSource, setDreamTransferSource] = useState('my_cash'); // 'my_cash' | 'phonepe'
  const [dreamWithdrawDest, setDreamWithdrawDest] = useState('phonepe');     // 'phonepe' | 'my_cash'
  const [dreamTransferAmount, setDreamTransferAmount] = useState('');
  const [dreamGoalName, setDreamGoalName] = useState('');
  const [dreamGoalTarget, setDreamGoalTarget] = useState('');
  const [dreamGoalDate, setDreamGoalDate] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Live Bank Ledger
  useEffect(() => {
    let mounted = true;
    const fetchBankData = async () => {
      try {
        const state = await bankEngine.getState();
        if (mounted && Array.isArray(state?.ledger)) {
          setLiveBankLedger(state.ledger);
        }
      } catch (e) {}
    };
    fetchBankData();
    const handleBankUpdate = () => fetchBankData();
    window.addEventListener('billqyro_bank_updated', handleBankUpdate);
    window.addEventListener('billqyro_sync', handleBankUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('billqyro_bank_updated', handleBankUpdate);
      window.removeEventListener('billqyro_sync', handleBankUpdate);
    };
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

  const workspaceName = activeWorkspace?.name || businessSettings?.businessName || 'KB.Embroidery Designer 1118';
  const ownerName = businessSettings?.ownerName?.split(' ')[0] || businessSettings?.businessName?.split(' ')[0] || 'Khairul';

  // Workspace-scoped active records
  const scopedInvoices = useMemo(() => {
    const wsInvoices = activeWsId && activeWsId !== 'default'
      ? filterByWorkspace(invoices, activeWsId)
      : invoices;
    return wsInvoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  }, [invoices, activeWsId]);

  const scopedExpenses = useMemo(() => {
    const wsExpenses = activeWsId && activeWsId !== 'default'
      ? filterByWorkspace(expenses, activeWsId)
      : expenses;
    return wsExpenses.filter(exp => !exp.isDeleted);
  }, [expenses, activeWsId]);

  // Canonical Financial Buckets
  const bucketFinancials = useMemo(() => {
    return paymentEngine.calculateFinancialBuckets({
      invoices: scopedInvoices,
      bankLedger: liveBankLedger,
      workspaceId: activeWsId
    });
  }, [scopedInvoices, liveBankLedger, activeWsId]);

  const activeDream = useMemo(() => {
    if (!bucketFinancials.dreamGoals || bucketFinancials.dreamGoals.length === 0) return null;
    return bucketFinancials.dreamGoals.find(g => g.status === 'ACTIVE') || bucketFinancials.dreamGoals[0];
  }, [bucketFinancials.dreamGoals]);

  const handleExecuteDreamTransfer = async () => {
    const amt = parseFloat(dreamTransferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than zero.');
      return;
    }
    const sourceBal = dreamTransferSource === 'my_cash' ? bucketFinancials.myCashBalance : bucketFinancials.phonePeBalance;
    if (amt > sourceBal) {
      toast.error(`Cannot transfer more than available source balance of ${formatCurrency(sourceBal, currencySymbol)}`);
      return;
    }
    if (!activeDream) {
      toast.error('No active dream goal selected.');
      return;
    }

    setIsTransferring(true);
    try {
      await paymentEngine.recordMoneyTransfer({
        fromLocation: dreamTransferSource,
        toLocation: 'my_dream',
        amount: amt,
        dreamId: activeDream.id || activeDream.dreamId,
        dreamName: activeDream.dreamName || activeDream.name,
        workspaceId: activeWsId
      });
      toast.success(`Transferred ${formatCurrency(amt, currencySymbol)} to ${activeDream.dreamName || activeDream.name}!`, { icon: '🌙' });
      setDreamTransferAmount('');
      setShowDreamAddModal(false);
    } catch (e) {
      toast.error(e.message || 'Transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExecuteDreamWithdraw = async () => {
    const amt = parseFloat(dreamTransferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than zero.');
      return;
    }
    const savedBal = activeDream?.savedAmount || 0;
    if (amt > savedBal) {
      toast.error(`Cannot withdraw more than saved dream balance of ${formatCurrency(savedBal, currencySymbol)}`);
      return;
    }

    setIsTransferring(true);
    try {
      await paymentEngine.recordMoneyTransfer({
        fromLocation: 'my_dream',
        toLocation: dreamWithdrawDest,
        amount: amt,
        dreamId: activeDream.id || activeDream.dreamId,
        dreamName: activeDream.dreamName || activeDream.name,
        workspaceId: activeWsId
      });
      toast.success(`Returned ${formatCurrency(amt, currencySymbol)} from Dream to ${dreamWithdrawDest === 'phonepe' ? 'PhonePe' : 'My Cash'}!`, { icon: '✨' });
      setDreamTransferAmount('');
      setShowDreamWithdrawModal(false);
    } catch (e) {
      toast.error(e.message || 'Withdrawal failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCreateDreamGoal = () => {
    if (!dreamGoalName.trim()) {
      toast.error('Please enter a dream name.');
      return;
    }
    const target = parseFloat(dreamGoalTarget) || 0;
    paymentEngine.saveDreamGoal({
      dreamName: dreamGoalName.trim(),
      name: dreamGoalName.trim(),
      targetAmount: target,
      targetDate: dreamGoalDate
    }, activeWsId);
    toast.success('New Dream Goal created!', { icon: '🎯' });
    setDreamGoalName('');
    setDreamGoalTarget('');
    setDreamGoalDate('');
    setShowDreamCreateModal(false);
  };

  // ==========================================================================
  // CANONICAL FINANCIAL DATA AGGREGATION
  // ==========================================================================
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalCalendarDate(now);
    
    // Yesterday comparison date
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalCalendarDate(yesterdayDate);

    // This week cutoff (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Current & Prev Month prefixes
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

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
    let dueThisWeekAmount = 0;
    let dueThisWeekInvoicesCount = 0;

    scopedInvoices.forEach(inv => {
      const invTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
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

      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isOverdue = invDue > 0 && dueDate && !isNaN(dueDate.getTime()) && dueDate < now;

      if (isOverdue) {
        overdueCount++;
        overdueAmount += invDue;
      }

      if (inv.dueDate && getLocalCalendarDate(inv.dueDate) === todayStr && invDue > 0) {
        dueTodayAmount += invDue;
        dueTodayInvoicesCount++;
      }

      if (dueDate && !isNaN(dueDate.getTime()) && dueDate >= now && (dueDate.getTime() - now.getTime()) <= (7 * 24 * 60 * 60 * 1000) && invDue > 0) {
        dueThisWeekAmount += invDue;
        dueThisWeekInvoicesCount++;
      }

      // Payments extraction
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(p => {
          const amt = roundTo2(parseFloat(p.amount) || 0);
          if (amt <= 0) return;
          const pDateStr = getLocalCalendarDate(p.date) || getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);

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

    let thisMonthExpenses = 0;
    scopedExpenses.forEach(exp => {
      const amt = roundTo2(parseFloat(exp.amount || exp.total) || 0);
      const expDateStr = getLocalCalendarDate(exp.date) || getLocalCalendarDate(exp.createdAt);
      if (expDateStr.startsWith(currentMonthPrefix)) thisMonthExpenses += amt;
    });

    const thisMonthNetCash = roundTo2(thisMonthCollected - thisMonthExpenses);
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Real comparison metrics (never fabricated)
    const revenueGrowthPercent = prevMonthRevenue > 0
      ? roundTo2(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : null;

    const collectedGrowthPercent = prevMonthCollected > 0
      ? roundTo2(((thisMonthCollected - prevMonthCollected) / prevMonthCollected) * 100)
      : null;

    const aging = calculateAgingDistribution(scopedInvoices);

    return {
      todaysSales: roundTo2(todaysSales),
      todaysCollected: roundTo2(todaysCollected),
      todaysOutstanding: roundTo2(todaysOutstanding),
      todaysInvoicesCount,
      todaysPaymentCount,
      thisMonthRevenue: roundTo2(thisMonthRevenue),
      thisMonthCollected: roundTo2(thisMonthCollected),
      thisMonthExpenses: roundTo2(thisMonthExpenses),
      thisMonthNetCash,
      totalRevenue: roundTo2(totalRevenue),
      totalCollected: roundTo2(totalCollected),
      totalOutstanding: roundTo2(totalOutstanding),
      overdueAmount: roundTo2(overdueAmount),
      overdueCount,
      dueTodayAmount: roundTo2(dueTodayAmount),
      dueTodayInvoicesCount,
      dueThisWeekAmount: roundTo2(dueThisWeekAmount),
      dueThisWeekInvoicesCount,
      aging,
      dueAging: aging,
      collectionRate,
      revenueGrowthPercent,
      collectedGrowthPercent
    };
  }, [scopedInvoices, scopedExpenses]);

  // Top Outstanding Customer Intelligence
  const topOutstandingCustomer = useMemo(() => {
    const customerDueMap = new Map();
    scopedInvoices.forEach(inv => {
      const due = getInvoiceBalanceDue(inv);
      if (due > 0) {
        const cName = inv.customerName || inv.customer?.name || 'Walk-in Customer';
        const cId = inv.customerId || inv.customer?.id || cName;
        const current = customerDueMap.get(cId) || { 
          id: cId, 
          name: cName, 
          totalDue: 0, 
          count: 0, 
          phone: inv.customerPhone || inv.customer?.phone || '' 
        };
        current.totalDue = roundTo2(current.totalDue + due);
        current.count++;
        customerDueMap.set(cId, current);
      }
    });

    const list = Array.from(customerDueMap.values()).sort((a, b) => b.totalDue - a.totalDue);
    return list.length > 0 ? list[0] : null;
  }, [scopedInvoices]);

  // ==========================================================================
  // CANONICAL CHART DATA GENERATION (Revenue & Collected Trend)
  // ==========================================================================
  const chartSeries = useMemo(() => {
    const now = new Date();
    const days = [];

    let countDays = 7;
    if (chartTimeframe === '30d') countDays = 30;
    else if (chartTimeframe === 'this_month') countDays = Math.max(1, now.getDate());

    for (let i = countDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = getLocalCalendarDate(d);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateKey, label, invoiced: 0, collected: 0, value: 0 });
    }

    const dayMap = new Map(days.map(item => [item.dateKey, item]));

    scopedInvoices.forEach(inv => {
      const invDate = getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
      const val = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);

      if (dayMap.has(invDate)) {
        dayMap.get(invDate).invoiced = roundTo2(dayMap.get(invDate).invoiced + val);
        dayMap.get(invDate).value = dayMap.get(invDate).invoiced;
      }

      // Exact payments on their real payment dates
      if (Array.isArray(inv.paymentHistory)) {
        inv.paymentHistory.forEach(p => {
          const pAmt = roundTo2(parseFloat(p.amount) || 0);
          const pDate = getLocalCalendarDate(p.date) || invDate;
          if (pAmt > 0 && dayMap.has(pDate)) {
            dayMap.get(pDate).collected = roundTo2(dayMap.get(pDate).collected + pAmt);
          }
        });
      } else {
        const paid = getInvoicePaidTotal(inv);
        if (paid > 0 && dayMap.has(invDate)) {
          dayMap.get(invDate).collected = roundTo2(dayMap.get(invDate).collected + paid);
        }
      }
    });

    return days;
  }, [scopedInvoices, chartTimeframe]);

  const recentInvoicesList = useMemo(() => {
    return [...scopedInvoices]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5);
  }, [scopedInvoices]);

  const handleRefresh = async () => {
    try {
      await invoiceEngine.syncFromCloud();
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const timeframeLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    'this_month': 'This Month'
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="min-h-screen bg-[#fcfbfa] dark:bg-theme-app text-[#1c1917] dark:text-theme-primary pb-20 font-sans">
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
              {/* 1. GREETING HEADER & LIVE TIME PILL */}
              {/* ========================================================================= */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] dark:text-theme-primary tracking-tight flex items-center gap-2">
                    <span>{greeting.text},</span>
                    <span className="text-[#c2410c] dark:text-theme-accent">{ownerName}</span>
                    <span>👋</span>
                  </h1>
                  <p className="text-xs text-[#78716c] dark:text-theme-muted font-medium mt-0.5">
                    Here's what's happening with <span className="font-bold text-[#44403c] dark:text-theme-secondary">{workspaceName}</span> today.
                  </p>
                </div>

                {/* Right Time / Date Pill */}
                <div className="flex items-center gap-3 self-start sm:self-auto bg-white dark:bg-theme-card px-4 py-2.5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-[#faf5ef] dark:bg-theme-surface flex items-center justify-center text-[#c2410c] dark:text-theme-accent">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-right leading-tight">
                    <p className="text-xs font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                      {timeNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                    <p className="text-[10px] font-semibold text-[#78716c] dark:text-theme-muted">
                      {timeNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. TOP TWO FEATURE CARDS: REVENUE CARD (LEFT) & TREND CHART (RIGHT) */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* LEFT CARD: TOTAL REVENUE (THIS MONTH) */}
                <div className="lg:col-span-6 bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#a8a29e] dark:text-theme-muted tracking-wider uppercase" data-title="Month Revenue">
                        TOTAL REVENUE (THIS MONTH)
                      </span>
                      {metrics.revenueGrowthPercent !== null ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          metrics.revenueGrowthPercent >= 0 
                            ? 'bg-[#ecfdf5] dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20' 
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20'
                        }`}>
                          {metrics.revenueGrowthPercent >= 0 ? `+ ${metrics.revenueGrowthPercent}%` : `${metrics.revenueGrowthPercent}%`} vs last month
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#faf5ef] dark:bg-theme-surface text-[#78716c] dark:text-theme-muted text-[10px] font-bold border border-[#f0ece6] dark:border-theme-border-soft">
                          Current Month
                        </span>
                      )}
                    </div>

                    {/* Big Revenue Number */}
                    <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1c1917] dark:text-theme-primary font-numbers tracking-tight">
                      <AnimatedNumber value={formatCurrency(metrics.thisMonthRevenue, currencySymbol)} />
                    </div>

                    {/* 3 Sub-Metrics Row */}
                    <div className="grid grid-cols-3 gap-3 pt-5 pb-2">
                      <div>
                        <p className="text-[9px] font-bold text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider">COLLECTED</p>
                        <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-numbers mt-0.5">
                          <AnimatedNumber value={formatCurrency(metrics.thisMonthCollected, currencySymbol)} />
                        </p>
                        {metrics.collectedGrowthPercent !== null && (
                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {metrics.collectedGrowthPercent >= 0 ? `+ ${metrics.collectedGrowthPercent}%` : `${metrics.collectedGrowthPercent}%`}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[9px] font-bold text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider">OUTSTANDING</p>
                        <p className="text-sm sm:text-base font-black text-[#ea580c] dark:text-amber-500 font-numbers mt-0.5">
                          <AnimatedNumber value={formatCurrency(metrics.totalOutstanding, currencySymbol)} />
                        </p>
                        {metrics.overdueCount > 0 ? (
                          <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {metrics.overdueCount} overdue
                          </p>
                        ) : (
                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            All on track
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[9px] font-bold text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider">COLLECTION RATE</p>
                        <p className="text-sm sm:text-base font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-0.5">
                          <AnimatedNumber value={`${metrics.collectionRate}%`} />
                        </p>
                        <p className="text-[9px] font-bold text-theme-muted mt-0.5">
                          of total billed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Strip: Today's Invoiced Volume */}
                  <div className="mt-4 p-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#44403c] dark:text-theme-secondary font-medium">
                      <div className="w-5 h-5 rounded-md bg-[#faf5ef] dark:bg-theme-surface flex items-center justify-center text-[#c2410c] dark:text-theme-accent">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Today's Invoiced Volume</span>
                    </div>
                    <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers text-xs">
                      {formatCurrency(metrics.todaysSales, currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* RIGHT CARD: REVENUE & COLLECTION TREND */}
                <div className="lg:col-span-6 bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Revenue & Collection Trend
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-[#c2410c] dark:text-theme-accent">
                          <span className="w-2 h-2 rounded-full bg-[#c2410c]" /> Invoiced
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Collected
                        </span>
                      </div>
                    </div>

                    {/* Timeframe Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-theme-surface border border-[#f0ece6] dark:border-theme-border-soft text-[11px] font-bold text-[#44403c] dark:text-theme-secondary hover:border-[#c2410c] transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>{timeframeLabels[chartTimeframe]}</span>
                        <ChevronDown className="w-3 h-3 text-[#78716c]" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-theme-card rounded-xl border border-[#f0ece6] dark:border-theme-border-soft shadow-lg py-1 z-20">
                          {Object.entries(timeframeLabels).map(([k, lbl]) => (
                            <button
                              key={k}
                              onClick={() => {
                                setChartTimeframe(k);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${chartTimeframe === k ? 'text-[#c2410c] bg-[#faf5ef] font-bold' : 'text-[#44403c] hover:bg-[#faf5ef]'}`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AreaChart */}
                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="warmTerracottaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c2410c" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#c2410c" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" opacity={0.6} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e' }} dy={4} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e' }} />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #f0ece6', borderRadius: '12px', fontSize: '11px', color: '#1c1917', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          formatter={(val, name) => [
                            formatCurrency(val, currencySymbol), 
                            name === 'invoiced' ? 'Invoiced' : 'Collected'
                          ]}
                        />
                        <Area type="monotone" dataKey="invoiced" name="invoiced" stroke="#c2410c" strokeWidth={2.2} fill="url(#warmTerracottaGrad)" />
                        <Area type="monotone" dataKey="collected" name="collected" stroke="#10b981" strokeWidth={2} fill="url(#emeraldGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* 3. HORIZONTAL 5 ACTION BUTTONS BAR */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">

                {/* 1. Create Invoice (Primary Orange Button) */}
                <button
                  onClick={onQuickBillOpen}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#c2410c] hover:bg-[#b43e0b] active:scale-[0.98] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Invoice</span>
                </button>

                {/* 2. Add Customer */}
                {hasCustomers && (
                  <button
                    onClick={() => setShowAddCustomerSheet(true)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#c2410c]" />
                    <span>Add Customer</span>
                  </button>
                )}

                {/* 3. Record Payment */}
                <button
                  onClick={() => (onRecordPayment ? onRecordPayment() : setCurrentTab('collection-center'))}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-[#c2410c]" />
                  <span>Record Payment</span>
                </button>

                {/* 4. View Reports */}
                {hasReports && (
                  <button
                    onClick={() => setCurrentTab('reports')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-[#c2410c]" />
                    <span>View Reports</span>
                  </button>
                )}

                {/* 5. Add Expense */}
                {hasExpenses && (
                  <button
                    onClick={() => setCurrentTab('expenses')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <TrendingDown className="w-4 h-4 text-[#c2410c]" />
                    <span>Add Expense</span>
                  </button>
                )}

              </div>

              {/* ========================================================================= */}
              {/* 4. NEEDS YOUR ATTENTION SECTION (Actionable Intelligence Strip) */}
              {/* ========================================================================= */}
              {(metrics.overdueCount > 0 || pendingPaymentsCount > 0 || metrics.dueTodayInvoicesCount > 0) ? (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent dark:from-amber-500/5 dark:via-rose-500/5 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1c1917] dark:text-theme-primary uppercase tracking-wider">
                        Needs Your Attention
                      </h4>
                      <p className="text-xs text-[#78716c] dark:text-theme-muted font-medium flex items-center gap-2 flex-wrap mt-0.5">
                        {metrics.overdueCount > 0 && (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            🔴 {metrics.overdueCount} overdue ({formatCurrency(metrics.overdueAmount, currencySymbol)})
                          </span>
                        )}
                        {metrics.dueTodayInvoicesCount > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            🟠 {metrics.dueTodayInvoicesCount} due today ({formatCurrency(metrics.dueTodayAmount, currencySymbol)})
                          </span>
                        )}
                        {pendingPaymentsCount > 0 && (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            🟡 {pendingPaymentsCount} proof awaiting verification
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setCurrentTab('due-ledger')}
                      className="px-3 py-1.5 bg-white dark:bg-theme-surface text-xs font-bold text-[#c2410c] dark:text-theme-accent border border-[#f0ece6] dark:border-theme-border-soft hover:bg-[#faf5ef] rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      View Dues →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Everything looks good! Zero overdue invoices.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-theme-muted hidden sm:inline font-numbers">
                    {metrics.collectionRate}% Collection Rate
                  </span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 5. BOTTOM TWO-COLUMN SECTION: RECENT INVOICES (LEFT) & RIGHT WIDGETS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                {/* LEFT: RECENT INVOICES TABLE (8 Cols) */}
                <div className="lg:col-span-8 bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                      Recent Invoices
                    </h3>
                    <button
                      onClick={() => setCurrentTab('invoices')}
                      className="text-xs font-bold text-[#c2410c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Invoices</span>
                      <span>→</span>
                    </button>
                  </div>

                  {recentInvoicesList.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#a8a29e]">
                      <FileText className="w-8 h-8 mx-auto text-[#d6d3d1] mb-2" />
                      <p>No invoices created yet.</p>
                      <button
                        onClick={onQuickBillOpen}
                        className="mt-2 text-xs font-bold text-[#c2410c] hover:underline"
                      >
                        + Create First Invoice
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-[9px] font-bold text-[#a8a29e] uppercase tracking-wider border-b border-[#f5f2ed] dark:border-theme-border-soft pb-2">
                            <th className="pb-2.5 font-bold">INVOICE</th>
                            <th className="pb-2.5 font-bold">CUSTOMER</th>
                            <th className="pb-2.5 font-bold">DATE</th>
                            <th className="pb-2.5 font-bold text-right">TOTAL</th>
                            <th className="pb-2.5 font-bold text-right">PAID</th>
                            <th className="pb-2.5 font-bold text-right">DUE</th>
                            <th className="pb-2.5 font-bold text-center">STATUS</th>
                            <th className="pb-2.5 font-bold text-center">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#faf7f2] dark:divide-theme-border-soft/40">
                          {recentInvoicesList.map(inv => {
                            const total = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
                            const paid = getInvoicePaidTotal(inv);
                            const due = getInvoiceBalanceDue(inv);
                            const status = (inv.paymentStatus || 'Unpaid').toLowerCase();
                            const isPaid = status === 'paid' || due <= 0;
                            const isPartial = (status === 'partially paid' || status === 'partial') || (paid > 0 && due > 0);

                            const invDateStr = inv.date || inv.createdAt;
                            const formattedDate = invDateStr ? new Date(invDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';

                            return (
                              <tr key={inv.id} className="hover:bg-[#faf8f5] dark:hover:bg-theme-surface/50 transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-[#faf5ef] dark:bg-theme-surface flex items-center justify-center text-[#c2410c] shrink-0">
                                      <FileText className="w-3 h-3" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#1c1917] dark:text-theme-primary block font-mono">
                                        {inv.invoiceNumber || `INV-${inv.id?.slice(0, 4)}`}
                                      </span>
                                      <span className="text-[8px] text-[#a8a29e] font-mono">
                                        #{inv.id?.slice(0, 5)}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 text-[#44403c] dark:text-theme-secondary font-medium truncate max-w-[120px]">
                                  {inv.customerName || inv.customer?.name || 'Walk-in'}
                                </td>

                                <td className="py-3 text-[#78716c] dark:text-theme-muted font-medium whitespace-nowrap">
                                  {formattedDate}
                                </td>

                                <td className="py-3 text-right font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                                  {formatCurrency(total, currencySymbol)}
                                </td>

                                <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-numbers">
                                  {formatCurrency(paid, currencySymbol)}
                                </td>

                                <td className="py-3 text-right font-bold text-[#ea580c] dark:text-amber-500 font-numbers">
                                  {formatCurrency(due, currencySymbol)}
                                </td>

                                <td className="py-3 text-center">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : isPartial ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-rose-100/70 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                                    {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Due'}
                                  </span>
                                </td>

                                <td className="py-3 text-center">
                                  <div className="flex items-center justify-center gap-1 text-[#a8a29e]">
                                    {due > 0 && (
                                      <button
                                        onClick={() => setQuickPayInvoice(inv)}
                                        className="p-1 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                                        title="Quick Pay Collection"
                                        aria-label="Quick Pay"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onViewInvoice?.(inv)}
                                      className="p-1 hover:text-[#c2410c] hover:bg-[#faf5ef] rounded-md transition-colors cursor-pointer"
                                      title="View Invoice"
                                      aria-label="View Invoice"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDownloadPDF?.(inv)}
                                      className="p-1 hover:text-[#c2410c] hover:bg-[#faf5ef] rounded-md transition-colors cursor-pointer"
                                      title="Download PDF"
                                      aria-label="Download PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* RIGHT STACKED WIDGETS (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">

                  {/* 1. COLLECTION CENTER */}
                  <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Collection Center
                      </h3>
                      <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                        {metrics.collectionRate}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c2410c] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                      />
                    </div>

                    {/* 2x2 Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <p className="text-[8px] font-bold text-[#a8a29e] uppercase tracking-wider">COLLECTED FUNDS</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-numbers mt-0.5">
                          {formatCurrency(metrics.totalCollected, currencySymbol)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-bold text-[#a8a29e] uppercase tracking-wider">PENDING DUES</p>
                        <p className="text-xs font-black text-[#ea580c] dark:text-amber-500 font-numbers mt-0.5">
                          {formatCurrency(metrics.totalOutstanding, currencySymbol)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-bold text-[#a8a29e] uppercase tracking-wider">OVERDUE INVOICES</p>
                        <p className="text-xs font-black text-rose-600 font-numbers mt-0.5">
                          {metrics.overdueCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-bold text-[#a8a29e] uppercase tracking-wider">TOTAL OVERDUE</p>
                        <p className="text-xs font-black text-rose-600 font-numbers mt-0.5">
                          {formatCurrency(metrics.overdueAmount, currencySymbol)}
                        </p>
                      </div>
                    </div>

                    {/* Top Debtor Highlight */}
                    {topOutstandingCustomer && (
                      <div className="mt-2 p-3 bg-[#faf8f5] dark:bg-theme-surface/70 rounded-xl border border-[#f0ece6] dark:border-theme-border-soft flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[8px] font-bold text-[#a8a29e] uppercase tracking-wider block">Top Outstanding</span>
                          <span className="font-bold text-[#1c1917] dark:text-theme-primary truncate block text-xs">{topOutstandingCustomer.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-rose-600 dark:text-rose-400 font-numbers block text-xs">
                            {formatCurrency(topOutstandingCustomer.totalDue, currencySymbol)}
                          </span>
                          <button
                            onClick={() => setCurrentTab('due-ledger')}
                            className="text-[9px] font-bold text-[#c2410c] hover:underline inline-block mt-0.5 cursor-pointer"
                          >
                            Follow Up →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. BUSINESS HEALTH */}
                  <div className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Business Health
                      </h3>
                      <button
                        onClick={() => setCurrentTab('reports')}
                        className="text-xs font-bold text-[#c2410c] hover:underline cursor-pointer"
                      >
                        View Full Report
                      </button>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Metric 1 */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#44403c] dark:text-theme-secondary mb-1">
                          <span>Collection Efficiency</span>
                          <span className="font-bold text-[#1c1917] dark:text-theme-primary font-numbers">{metrics.collectionRate}%</span>
                        </div>
                        <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c2410c] rounded-full" style={{ width: `${Math.min(100, metrics.collectionRate)}%` }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#44403c] dark:text-theme-secondary mb-1">
                          <span>Overdue Exposure</span>
                          <span className="font-bold text-[#1c1917] dark:text-theme-primary">
                            {metrics.totalOutstanding > 0 && (metrics.overdueAmount / metrics.totalOutstanding) > 0.4 ? 'High' : (metrics.overdueAmount > 0 ? 'Moderate' : 'Low')}
                          </span>
                        </div>
                        <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${metrics.totalOutstanding > 0 ? Math.min(100, Math.round((metrics.overdueAmount / metrics.totalOutstanding) * 100)) : 0}%`,
                              backgroundColor: metrics.overdueAmount > 0 ? '#ef4444' : '#10b981'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#44403c] dark:text-theme-secondary mb-1">
                          <span>Active Ledger Size</span>
                          <span className="font-bold text-[#1c1917] dark:text-theme-primary font-numbers">{scopedInvoices.length} Invoices</span>
                        </div>
                        <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c2410c] rounded-full" style={{ width: `${Math.min(100, scopedInvoices.length * 10 || 20)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. PREMIUM MY DREAM CARD */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-theme-card p-5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                          <Moon className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                          MY DREAM
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {activeDream?.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            COMPLETED 🎉
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-pink-500/10 text-pink-600 border border-pink-500/20">
                            {activeDream?.status || 'ACTIVE'}
                          </span>
                        )}
                        <button
                          onClick={() => setShowDreamCreateModal(true)}
                          className="p-1 rounded-lg text-theme-muted hover:text-pink-600 transition-colors"
                          title="Create New Dream Goal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {activeDream ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary">
                            {activeDream.dreamName || activeDream.name}
                          </span>
                          <span className="text-2xs font-bold text-theme-muted font-numbers">
                            {activeDream.targetDate ? `Target: ${activeDream.targetDate.slice(0, 10)}` : ''}
                          </span>
                        </div>

                        {/* Amount Numbers */}
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-lg font-black text-pink-600 font-numbers tabular-nums">
                            {formatCurrency(activeDream.savedAmount || 0, currencySymbol)}
                          </span>
                          <span className="text-2xs font-bold text-theme-muted font-numbers">
                            / {formatCurrency(activeDream.targetAmount || 0, currencySymbol)}
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-2 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeDream.progressPercentage || 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              activeDream.progressPercentage >= 100 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                : 'bg-gradient-to-r from-pink-500 to-rose-400'
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-theme-muted">
                          <span>{activeDream.progressPercentage || 0}% achieved</span>
                          <span>{formatCurrency(activeDream.remainingAmount || 0, currencySymbol)} remaining</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setShowDreamAddModal(true)}
                            className="py-2 px-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-2xs font-black transition-all flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Add Money</span>
                          </button>
                          <button
                            disabled={!activeDream.savedAmount}
                            onClick={() => setShowDreamWithdrawModal(true)}
                            className="py-2 px-3 rounded-xl bg-white dark:bg-theme-surface hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-theme-muted hover:text-theme-primary text-2xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Move Money</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-theme-muted">
                        <Target className="w-6 h-6 mx-auto mb-1 text-pink-400 opacity-60" />
                        <p className="font-bold">No Dream Goals Yet</p>
                        <button
                          onClick={() => setShowDreamCreateModal(true)}
                          className="mt-1 text-2xs font-bold text-pink-600 hover:underline"
                        >
                          + Set Your First Dream Goal
                        </button>
                      </div>
                    )}

                    {/* Compact Personal Money Summary Strip */}
                    <div className="mt-2 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 grid grid-cols-3 gap-1 text-center text-[9px]">
                      <div>
                        <span className="text-theme-muted block font-semibold">My Cash</span>
                        <span className="font-black text-amber-600 font-numbers">
                          {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-muted block font-semibold">PhonePe</span>
                        <span className="font-black text-indigo-600 font-numbers">
                          {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)}
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-muted block font-semibold">Personal</span>
                        <span className="font-black text-theme-accent font-numbers">
                          {formatCurrency(bucketFinancials.personalAvailableTotal, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </motion.div>

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

        {/* QUICK PAY MODAL */}
        <QuickPayModal
          isOpen={Boolean(quickPayInvoice)}
          onClose={() => setQuickPayInvoice(null)}
          invoice={quickPayInvoice}
          currencySymbol={currencySymbol}
          businessSettings={businessSettings}
          onPaymentSuccess={() => {
            setQuickPayInvoice(null);
            setTriggerSync(prev => prev + 1);
          }}
        />

        {/* DREAM ADD MONEY MODAL */}
        <AnimatePresence>
          {showDreamAddModal && activeDream && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-[#f0ece6] dark:border-theme-border-soft space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#f0ece6] dark:border-theme-border-soft">
                  <h3 className="text-sm font-black text-[#1c1917] dark:text-theme-primary flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Save Money for Dream
                  </h3>
                  <button onClick={() => setShowDreamAddModal(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/70 border border-[#f0ece6] dark:border-theme-border-soft space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-theme-muted">Dream Goal:</span>
                    <span className="text-[#1c1917] dark:text-theme-primary">{activeDream.dreamName || activeDream.name}</span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-theme-muted">Target: {formatCurrency(activeDream.targetAmount || 0, currencySymbol)}</span>
                    <span className="text-pink-600 font-bold">Saved: {formatCurrency(activeDream.savedAmount || 0, currencySymbol)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                      Transfer From Source
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDreamTransferSource('my_cash')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          dreamTransferSource === 'my_cash'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 font-black'
                            : 'bg-white dark:bg-theme-surface border-[#f0ece6] dark:border-theme-border-soft text-theme-muted'
                        }`}
                      >
                        <Coins className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">My Cash</div>
                        <div className="text-[10px] text-theme-muted">Bal: {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDreamTransferSource('phonepe')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          dreamTransferSource === 'phonepe'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 font-black'
                            : 'bg-white dark:bg-theme-surface border-[#f0ece6] dark:border-theme-border-soft text-theme-muted'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">PhonePe</div>
                        <div className="text-[10px] text-theme-muted">Bal: {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)}</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                      Amount to Save ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="1"
                      value={dreamTransferAmount}
                      onChange={(e) => setDreamTransferAmount(e.target.value)}
                      className="input-premium w-full text-base font-black text-[#1c1917] dark:text-theme-primary"
                    />
                  </div>

                  {parseFloat(dreamTransferAmount) > 0 && (
                    <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 text-2xs space-y-1">
                      <div className="font-bold text-pink-600 uppercase text-[10px]">Transfer Preview:</div>
                      <div className="flex justify-between text-theme-muted">
                        <span>From {dreamTransferSource === 'phonepe' ? 'PhonePe' : 'My Cash'}:</span>
                        <span className="font-bold text-rose-500">-{formatCurrency(parseFloat(dreamTransferAmount) || 0, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between text-theme-muted">
                        <span>To My Dream:</span>
                        <span className="font-bold text-emerald-600">+{formatCurrency(parseFloat(dreamTransferAmount) || 0, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-theme-primary pt-1 border-t border-pink-500/20">
                        <span>New Dream Saved:</span>
                        <span>{formatCurrency((activeDream.savedAmount || 0) + (parseFloat(dreamTransferAmount) || 0), currencySymbol)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDreamAddModal(false)}
                    className="btn-premium-outline flex-1 !py-2 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isTransferring || !parseFloat(dreamTransferAmount)}
                    onClick={handleExecuteDreamTransfer}
                    className="btn-premium flex-1 !py-2 text-xs font-black shadow-lg shadow-pink-500/20 bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DREAM WITHDRAW / MOVE MONEY MODAL */}
        <AnimatePresence>
          {showDreamWithdrawModal && activeDream && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-[#f0ece6] dark:border-theme-border-soft space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#f0ece6] dark:border-theme-border-soft">
                  <h3 className="text-sm font-black text-[#1c1917] dark:text-theme-primary flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-theme-accent" />
                    Move Money from Dream
                  </h3>
                  <button onClick={() => setShowDreamWithdrawModal(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/70 border border-[#f0ece6] dark:border-theme-border-soft space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-theme-muted">Available in Dream:</span>
                    <span className="text-pink-600 font-black">{formatCurrency(activeDream.savedAmount || 0, currencySymbol)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1.5">
                      Return to Account
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDreamWithdrawDest('phonepe')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          dreamWithdrawDest === 'phonepe'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 font-black'
                            : 'bg-white dark:bg-theme-surface border-[#f0ece6] dark:border-theme-border-soft text-theme-muted'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">PhonePe</div>
                        <div className="text-[10px] text-theme-muted">Online Personal</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDreamWithdrawDest('my_cash')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          dreamWithdrawDest === 'my_cash'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 font-black'
                            : 'bg-white dark:bg-theme-surface border-[#f0ece6] dark:border-theme-border-soft text-theme-muted'
                        }`}
                      >
                        <Coins className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">My Cash</div>
                        <div className="text-[10px] text-theme-muted">Physical Cash</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">
                      Amount to Move ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="1"
                      max={activeDream.savedAmount || 0}
                      value={dreamTransferAmount}
                      onChange={(e) => setDreamTransferAmount(e.target.value)}
                      className="input-premium w-full text-base font-black text-[#1c1917] dark:text-theme-primary"
                    />
                  </div>

                  {parseFloat(dreamTransferAmount) > 0 && (
                    <div className="p-3 rounded-xl bg-theme-surface/70 border border-[#f0ece6] dark:border-theme-border-soft text-2xs space-y-1">
                      <div className="font-bold text-theme-muted uppercase text-[10px]">Preview:</div>
                      <div className="flex justify-between text-theme-muted">
                        <span>From My Dream:</span>
                        <span className="font-bold text-rose-500">-{formatCurrency(parseFloat(dreamTransferAmount) || 0, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between text-theme-muted">
                        <span>To {dreamWithdrawDest === 'phonepe' ? 'PhonePe' : 'My Cash'}:</span>
                        <span className="font-bold text-emerald-600">+{formatCurrency(parseFloat(dreamTransferAmount) || 0, currencySymbol)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDreamWithdrawModal(false)}
                    className="btn-premium-outline flex-1 !py-2 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isTransferring || !parseFloat(dreamTransferAmount)}
                    onClick={handleExecuteDreamWithdraw}
                    className="btn-premium flex-1 !py-2 text-xs font-black shadow-lg shadow-theme-accent/20"
                  >
                    {isTransferring ? 'Moving...' : 'Confirm Move'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DREAM CREATE GOAL MODAL */}
        <AnimatePresence>
          {showDreamCreateModal && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-[#f0ece6] dark:border-theme-border-soft space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#f0ece6] dark:border-theme-border-soft">
                  <h3 className="text-sm font-black text-[#1c1917] dark:text-theme-primary flex items-center gap-2">
                    <Target className="w-4 h-4 text-pink-500" />
                    New Dream Goal
                  </h3>
                  <button onClick={() => setShowDreamCreateModal(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Dream Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. New Laptop, Camera Kit, Trip"
                      value={dreamGoalName}
                      onChange={(e) => setDreamGoalName(e.target.value)}
                      className="input-premium w-full text-xs font-bold text-[#1c1917] dark:text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Target Amount ({currencySymbol}) *</label>
                    <input
                      type="number"
                      placeholder="50000"
                      min="1"
                      value={dreamGoalTarget}
                      onChange={(e) => setDreamGoalTarget(e.target.value)}
                      className="input-premium w-full text-xs font-black text-[#1c1917] dark:text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Target Date (Optional)</label>
                    <input
                      type="date"
                      value={dreamGoalDate}
                      onChange={(e) => setDreamGoalDate(e.target.value)}
                      className="input-premium w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDreamCreateModal(false)}
                    className="btn-premium-outline flex-1 !py-2 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDreamGoal}
                    className="btn-premium flex-1 !py-2 text-xs font-black bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Save Goal
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PullToRefresh>
    </AnimatedPage>
  );
};

export default Dashboard;
