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
  Heart, Coins, Smartphone, Moon, Target, X, Send, Filter, CheckCheck,
  ExternalLink, Edit3, Banknote, Landmark, Percent, PieChart, ShieldQuestion,
  UserCheck, UserX, UserMinus, ArrowLeftRight
} from 'lucide-react';
import { paymentEngine } from '../services/paymentEngine';
import { bankEngine } from '../services/bankEngine';
import { toast } from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
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
  calculateCanonicalInvoiceFinancials,
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

// Helper for local calendar dates (YYYY-MM-DD)
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

// Premium Custom Chart Tooltip
const PremiumChartTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload || {};
  const invoiced = data.invoiced || 0;
  const collected = data.collected || 0;
  const prevDueCollected = data.prevDueCollected || 0;
  const currentBillCollected = data.currentBillCollected !== undefined ? data.currentBillCollected : Math.max(0, collected - prevDueCollected);
  const outstanding = Math.max(0, invoiced - currentBillCollected);
  const rate = invoiced > 0 ? Math.round((currentBillCollected / invoiced) * 100) : (collected > 0 ? 100 : 0);

  return (
    <div className="bg-white dark:bg-theme-card p-3.5 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xl space-y-2 text-xs min-w-[200px]">
      <div className="font-bold text-[#1c1917] dark:text-theme-primary pb-1.5 border-b border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{rate}% Realized</span>
      </div>
      <div className="space-y-1.5 text-2xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[#c2410c] dark:text-theme-accent font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#c2410c]" /> Invoiced:
          </span>
          <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
            {formatCurrency(invoiced, currencySymbol)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Total Collected:
          </span>
          <span className="font-black text-emerald-600 dark:text-emerald-400 font-numbers">
            {formatCurrency(collected, currencySymbol)}
          </span>
        </div>
        {prevDueCollected > 0 && (
          <div className="flex items-center justify-between pl-3 text-amber-600 dark:text-amber-400 text-[10px]">
            <span>↳ Previous Due:</span>
            <span className="font-bold font-numbers">{formatCurrency(prevDueCollected, currencySymbol)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pl-3 text-emerald-700 dark:text-emerald-300 text-[10px]">
          <span>↳ Current Bills:</span>
          <span className="font-bold font-numbers">{formatCurrency(currentBillCollected, currencySymbol)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#f5f2ed] dark:border-theme-border-soft/40">
          <span className="text-[#ea580c] dark:text-amber-500 font-semibold">Period Outstanding:</span>
          <span className="font-black text-[#ea580c] dark:text-amber-500 font-numbers">
            {formatCurrency(outstanding, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
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
  const [chartTimeframe, setChartTimeframe] = useState('7d'); // '7d' | '30d' | 'this_month' | 'prev_month' | 'this_year'
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

  const scopedCustomers = useMemo(() => {
    const wsCusts = activeWsId && activeWsId !== 'default'
      ? filterByWorkspace(customers, activeWsId)
      : customers;
    return wsCusts.filter(c => !c.isDeleted);
  }, [customers, activeWsId]);

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

  // Unified Live Activity Transactions
  const unifiedActivity = useMemo(() => {
    try {
      const getHistoryFn = paymentEngine.getUnifiedTransactionHistory || paymentEngine.getUnifiedHistory;
      if (typeof getHistoryFn === 'function') {
        const list = getHistoryFn.call(paymentEngine, {
          invoices: scopedInvoices,
          bankLedger: liveBankLedger,
          workspaceId: activeWsId
        });
        return Array.isArray(list) ? list.slice(0, 8) : [];
      }
    } catch (e) {
      console.warn('Unified activity load error:', e);
    }
    return [];
  }, [scopedInvoices, liveBankLedger, activeWsId]);

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

    // Current & Prev Month prefixes
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let todaysSales = 0;
    let todaysOutstanding = 0;
    let todaysCollected = 0;
    let todaysExpenses = 0;
    let todaysInvoicesCount = 0;
    let todaysPaymentCount = 0;
    let todaysLargestPayment = 0;

    let yesterdaySales = 0;
    let yesterdayCollected = 0;
    let yesterdayPaymentCount = 0;

    let last7DaysSales = 0;
    let last30DaysSales = 0;

    let thisMonthRevenue = 0;
    let thisMonthCollected = 0;
    let thisMonthExpenses = 0;
    let thisMonthOutstanding = 0;

    let prevMonthRevenue = 0;
    let prevMonthCollected = 0;
    let prevMonthExpenses = 0;

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let dueTodayAmount = 0;
    let dueTodayInvoicesCount = 0;
    let dueThisWeekAmount = 0;
    let dueThisWeekInvoicesCount = 0;

    let previousDueTotal = 0;
    let currentDueTotal = 0;
    let paidInvoicesCount = 0;
    let partialInvoicesCount = 0;
    let unpaidInvoicesCount = 0;

    let cashPaymentsTotal = 0;
    let digitalPaymentsTotal = 0;
    let otherPaymentsTotal = 0;
    let totalPaymentsCount = 0;
    let largestSinglePayment = 0;

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

      // Status classification
      const status = getInvoicePaymentStatus(inv);
      if (status === 'Paid') paidInvoicesCount++;
      else if (status === 'Partial') partialInvoicesCount++;
      else unpaidInvoicesCount++;

      // Previous Due extraction (canonical)
      const prevDueAmt = roundTo2(parseFloat(inv.previousDue || inv.prevDue) || 0);
      if (prevDueAmt > 0) {
        previousDueTotal += prevDueAmt;
      }
      currentDueTotal += Math.max(0, invDue - prevDueAmt);

      if (isTodayInv) {
        todaysSales += invTotal;
        todaysOutstanding += invDue;
        todaysInvoicesCount++;
      }
      if (isYesterdayInv) {
        yesterdaySales += invTotal;
      }

      const invDateObj = new Date(invDateStr);
      if (!isNaN(invDateObj.getTime())) {
        const diffDays = Math.floor((now.getTime() - invDateObj.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) last7DaysSales += invTotal;
        if (diffDays <= 30) last30DaysSales += invTotal;
      }

      if (isThisMonthInv) {
        thisMonthRevenue += invTotal;
        thisMonthOutstanding += invDue;
      }
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
          totalPaymentsCount++;
          if (amt > largestSinglePayment) largestSinglePayment = amt;

          const method = String(p.method || p.paymentMethod || 'cash').toLowerCase();
          if (method.includes('cash')) cashPaymentsTotal += amt;
          else if (method.includes('upi') || method.includes('phonepe') || method.includes('gpay') || method.includes('online')) digitalPaymentsTotal += amt;
          else otherPaymentsTotal += amt;

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
        totalPaymentsCount++;
        if (invPaid > largestSinglePayment) largestSinglePayment = invPaid;
        cashPaymentsTotal += invPaid;

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

    // Expenses calculation
    let totalExpenses = 0;
    let largestExpense = 0;
    const expenseCategoriesMap = new Map();

    scopedExpenses.forEach(exp => {
      const amt = roundTo2(parseFloat(exp.amount || exp.total) || 0);
      if (amt <= 0) return;
      totalExpenses += amt;
      if (amt > largestExpense) largestExpense = amt;

      const cat = exp.category || exp.type || 'General';
      expenseCategoriesMap.set(cat, (expenseCategoriesMap.get(cat) || 0) + amt);

      const expDateStr = getLocalCalendarDate(exp.date) || getLocalCalendarDate(exp.createdAt);
      if (expDateStr === todayStr) todaysExpenses += amt;
      if (expDateStr.startsWith(currentMonthPrefix)) thisMonthExpenses += amt;
      if (expDateStr.startsWith(prevMonthPrefix)) prevMonthExpenses += amt;
    });

    const todaysNetCash = roundTo2(todaysCollected - todaysExpenses);
    const thisMonthNetCash = roundTo2(thisMonthCollected - thisMonthExpenses);
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Real comparison metrics (never fabricated)
    const revenueGrowthPercent = prevMonthRevenue > 0
      ? roundTo2(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : null;

    const collectedGrowthPercent = prevMonthCollected > 0
      ? roundTo2(((thisMonthCollected - prevMonthCollected) / prevMonthCollected) * 100)
      : null;

    const expenseGrowthPercent = prevMonthExpenses > 0
      ? roundTo2(((thisMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100)
      : null;

    const aging = calculateAgingDistribution(scopedInvoices);

    // Business Health Resolver
    let businessHealth = { label: 'Optimal Health', color: 'emerald', status: 'Healthy', note: 'Strong collection and balanced cash flow' };
    if (overdueCount > 3 || (totalOutstanding > 0 && overdueAmount / totalOutstanding > 0.4)) {
      businessHealth = { label: 'Needs Attention', color: 'rose', status: 'Attention', note: 'High overdue balance requires customer follow-up' };
    } else if (overdueCount > 0 || pendingPaymentsCount > 0) {
      businessHealth = { label: 'Moderate Flow', color: 'amber', status: 'Moderate', note: 'A few pending dues or payment proofs require action' };
    }

    return {
      todaysSales: roundTo2(todaysSales),
      todaysCollected: roundTo2(todaysCollected),
      todaysOutstanding: roundTo2(todaysOutstanding),
      todaysExpenses: roundTo2(todaysExpenses),
      todaysNetCash,
      todaysInvoicesCount,
      todaysPaymentCount,
      todaysLargestPayment: roundTo2(todaysLargestPayment),
      yesterdaySales: roundTo2(yesterdaySales),
      yesterdayCollected: roundTo2(yesterdayCollected),
      last7DaysSales: roundTo2(last7DaysSales),
      last30DaysSales: roundTo2(last30DaysSales),
      thisMonthRevenue: roundTo2(thisMonthRevenue),
      thisMonthCollected: roundTo2(thisMonthCollected),
      thisMonthExpenses: roundTo2(thisMonthExpenses),
      thisMonthOutstanding: roundTo2(thisMonthOutstanding),
      thisMonthNetCash,
      prevMonthRevenue: roundTo2(prevMonthRevenue),
      prevMonthCollected: roundTo2(prevMonthCollected),
      prevMonthExpenses: roundTo2(prevMonthExpenses),
      totalRevenue: roundTo2(totalRevenue),
      totalCollected: roundTo2(totalCollected),
      totalOutstanding: roundTo2(totalOutstanding),
      previousDueTotal: roundTo2(previousDueTotal),
      currentDueTotal: roundTo2(currentDueTotal),
      overdueAmount: roundTo2(overdueAmount),
      overdueCount,
      dueTodayAmount: roundTo2(dueTodayAmount),
      dueTodayInvoicesCount,
      dueThisWeekAmount: roundTo2(dueThisWeekAmount),
      dueThisWeekInvoicesCount,
      paidInvoicesCount,
      partialInvoicesCount,
      unpaidInvoicesCount,
      totalPaymentsCount,
      cashPaymentsTotal: roundTo2(cashPaymentsTotal),
      digitalPaymentsTotal: roundTo2(digitalPaymentsTotal),
      otherPaymentsTotal: roundTo2(otherPaymentsTotal),
      largestSinglePayment: roundTo2(largestSinglePayment),
      totalExpenses: roundTo2(totalExpenses),
      largestExpense: roundTo2(largestExpense),
      expenseCategories: Array.from(expenseCategoriesMap.entries()).map(([name, amount]) => ({ name, amount: roundTo2(amount) })),
      aging,
      dueAging: aging,
      collectionRate,
      revenueGrowthPercent,
      collectedGrowthPercent,
      expenseGrowthPercent,
      businessHealth
    };
  }, [scopedInvoices, scopedExpenses, pendingPaymentsCount]);

  // Top Outstanding Customer Intelligence & Top Revenue Customers
  const customerAnalytics = useMemo(() => {
    const customerMap = new Map();

    scopedInvoices.forEach(inv => {
      const cName = inv.customerName || inv.customer?.name || 'Walk-in Customer';
      const cId = inv.customerId || inv.customer?.id || cName;
      const billed = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
      const paid = getInvoicePaidTotal(inv);
      const due = getInvoiceBalanceDue(inv);
      const prevDue = roundTo2(parseFloat(inv.previousDue || inv.prevDue) || 0);

      if (!customerMap.has(cId)) {
        customerMap.set(cId, {
          id: cId,
          name: cName,
          phone: inv.customerPhone || inv.customer?.phone || '',
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          previousDue: 0,
          currentDue: 0,
          invoicesCount: 0,
          oldestDueDate: null
        });
      }

      const c = customerMap.get(cId);
      c.totalBilled = roundTo2(c.totalBilled + billed);
      c.totalPaid = roundTo2(c.totalPaid + paid);
      c.totalDue = roundTo2(c.totalDue + due);
      c.previousDue = roundTo2(c.previousDue + prevDue);
      c.currentDue = roundTo2(c.currentDue + Math.max(0, due - prevDue));
      c.invoicesCount++;

      if (due > 0 && inv.dueDate) {
        if (!c.oldestDueDate || new Date(inv.dueDate) < new Date(c.oldestDueDate)) {
          c.oldestDueDate = inv.dueDate;
        }
      }
    });

    const all = Array.from(customerMap.values());
    const topDebtors = all.filter(c => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);
    const topRevenue = [...all].sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 5);
    const fullyPaidCount = all.filter(c => c.totalDue <= 0 && c.totalBilled > 0).length;
    const withDueCount = topDebtors.length;
    const avgInvoiceValue = scopedInvoices.length > 0 ? roundTo2(metrics.totalRevenue / scopedInvoices.length) : 0;
    const avgPaymentValue = metrics.totalPaymentsCount > 0 ? roundTo2(metrics.totalCollected / metrics.totalPaymentsCount) : 0;

    return {
      topDebtors,
      topRevenue,
      totalCustomersCount: Math.max(all.length, scopedCustomers.length),
      activeCustomersCount: all.length,
      withDueCount,
      fullyPaidCount,
      avgInvoiceValue,
      avgPaymentValue
    };
  }, [scopedInvoices, scopedCustomers, metrics.totalRevenue, metrics.totalPaymentsCount, metrics.totalCollected]);

  // ==========================================================================
  // CANONICAL CHART DATA GENERATION (Revenue & Collected Trend)
  // ==========================================================================
  const chartSeries = useMemo(() => {
    const now = new Date();
    const days = [];

    if (chartTimeframe === 'this_year') {
      const currentYear = now.getFullYear();
      for (let m = 0; m <= now.getMonth(); m++) {
        const d = new Date(currentYear, m, 1);
        const dateKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        days.push({ dateKey, label, invoiced: 0, collected: 0, prevDueCollected: 0, currentBillCollected: 0, isMonthKey: true });
      }
    } else {
      let countDays = 7;
      if (chartTimeframe === '30d') countDays = 30;
      else if (chartTimeframe === 'this_month') countDays = Math.max(1, now.getDate());
      else if (chartTimeframe === 'prev_month') {
        const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        countDays = prevMonthLastDay;
      }

      if (chartTimeframe === 'prev_month') {
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        for (let i = 1; i <= countDays; i++) {
          const d = new Date(prevYear, prevMonth, i);
          const dateKey = getLocalCalendarDate(d);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          days.push({ dateKey, label, invoiced: 0, collected: 0, prevDueCollected: 0, currentBillCollected: 0 });
        }
      } else {
        for (let i = countDays - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateKey = getLocalCalendarDate(d);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          days.push({ dateKey, label, invoiced: 0, collected: 0, prevDueCollected: 0, currentBillCollected: 0 });
        }
      }
    }

    const dayMap = new Map(days.map(item => [item.dateKey, item]));

    scopedInvoices.forEach(inv => {
      const invDate = getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
      const val = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
      const prevDue = roundTo2(parseFloat(inv.previousDue || inv.prevDue) || 0);

      const targetKey = chartTimeframe === 'this_year' ? invDate?.substring(0, 7) : invDate;

      if (targetKey && dayMap.has(targetKey)) {
        dayMap.get(targetKey).invoiced = roundTo2(dayMap.get(targetKey).invoiced + val);
      }

      let runningOldDue = prevDue;

      // Exact payments on their real payment dates
      if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(p => {
          const pAmt = roundTo2(parseFloat(p.amount) || 0);
          const pDate = getLocalCalendarDate(p.date) || invDate;
          const pTargetKey = chartTimeframe === 'this_year' ? pDate?.substring(0, 7) : pDate;
          
          if (pAmt > 0 && pTargetKey && dayMap.has(pTargetKey)) {
            const entry = dayMap.get(pTargetKey);
            entry.collected = roundTo2(entry.collected + pAmt);

            const toOldDue = roundTo2(Math.min(pAmt, runningOldDue));
            runningOldDue = roundTo2(Math.max(0, runningOldDue - toOldDue));
            const toCurrent = roundTo2(Math.max(0, pAmt - toOldDue));

            entry.prevDueCollected = roundTo2((entry.prevDueCollected || 0) + toOldDue);
            entry.currentBillCollected = roundTo2((entry.currentBillCollected || 0) + toCurrent);
          }
        });
      } else {
        const paid = getInvoicePaidTotal(inv);
        if (paid > 0 && targetKey && dayMap.has(targetKey)) {
          const entry = dayMap.get(targetKey);
          entry.collected = roundTo2(entry.collected + paid);

          const toOldDue = roundTo2(Math.min(paid, runningOldDue));
          const toCurrent = roundTo2(Math.max(0, paid - toOldDue));

          entry.prevDueCollected = roundTo2((entry.prevDueCollected || 0) + toOldDue);
          entry.currentBillCollected = roundTo2((entry.currentBillCollected || 0) + toCurrent);
        }
      }
    });

    return days;
  }, [scopedInvoices, chartTimeframe]);

  // Selected Timeframe Hero Summary Metrics
  const heroKPIs = useMemo(() => {
    let invoiced = 0;
    let collected = 0;
    let prevDueCollected = 0;
    let currentBillCollected = 0;

    chartSeries.forEach(d => {
      invoiced += d.invoiced || 0;
      collected += d.collected || 0;
      prevDueCollected += d.prevDueCollected || 0;
      currentBillCollected += d.currentBillCollected || 0;
    });

    invoiced = roundTo2(invoiced);
    collected = roundTo2(collected);
    prevDueCollected = roundTo2(prevDueCollected);
    currentBillCollected = roundTo2(currentBillCollected);

    const outstanding = Math.max(0, roundTo2(invoiced - currentBillCollected));
    const overallCollectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 10000) / 100 : (metrics.collectionRate || 0);
    const currentRealizationRate = invoiced > 0 ? Math.min(100, Math.round((currentBillCollected / invoiced) * 10000) / 100) : (metrics.collectionRate || 0);

    return {
      invoiced,
      collected,
      prevDueCollected,
      currentBillCollected,
      outstanding,
      collectionRate: overallCollectionRate,
      currentRealizationRate
    };
  }, [chartSeries, metrics.collectionRate]);

  const recentInvoicesList = useMemo(() => {
    return [...scopedInvoices]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 8);
  }, [scopedInvoices]);

  const handleRefresh = async () => {
    try {
      await invoiceEngine.syncFromCloud();
      const state = await bankEngine.getState();
      if (Array.isArray(state?.ledger)) setLiveBankLedger(state.ledger);
    } catch (e) {
      console.error('Dashboard refresh failed:', e);
    }
  };

  const timeframeLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    'this_month': 'This Month',
    'prev_month': 'Previous Month',
    'this_year': 'This Year'
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="min-h-screen bg-[#fcfbfa] dark:bg-theme-app text-[#1c1917] dark:text-theme-primary pb-24 font-sans selection:bg-[#c2410c]/20">
          {(isInitialLoad || isLoading) ? (
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 space-y-6">
              <KPISkeleton count={4} />
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 space-y-6">

              {/* ========================================================================= */}
              {/* 1. EXECUTIVE HEADER & REAL-TIME BUSINESS HEALTH COCKPIT */}
              {/* ========================================================================= */}
              <div className="p-4 sm:p-5 lg:p-6 rounded-3xl bg-white dark:bg-theme-card border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#faf5ef] dark:bg-theme-surface text-[#c2410c] dark:text-theme-accent border border-[#f0ece6] dark:border-theme-border-soft flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c] dark:bg-theme-accent" />
                      {workspaceName}
                    </span>
                    <span className="text-2xs text-[#a8a29e] dark:text-theme-muted font-bold">
                      Executive Business Command Center
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1c1917] dark:text-theme-primary tracking-tight flex items-center gap-2 mt-1.5 truncate">
                    <span>{greeting.text},</span>
                    <span className="text-[#c2410c] dark:text-theme-accent truncate">{ownerName}</span>
                    <span>👋</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#78716c] dark:text-theme-muted font-medium mt-0.5">
                    Real-time revenue intelligence, collection flow, and financial command.
                  </p>
                </div>

                {/* Right Header Controls */}
                <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap shrink-0">
                  {/* Business Health Indicator */}
                  <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-2xs ${
                    metrics.businessHealth.color === 'emerald'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : metrics.businessHealth.color === 'rose'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      metrics.businessHealth.color === 'emerald' ? 'bg-emerald-500' : metrics.businessHealth.color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span>Business Health: {metrics.businessHealth.label}</span>
                  </div>

                  {/* Clock Pill */}
                  <div className="flex items-center gap-2.5 bg-[#faf8f5] dark:bg-theme-surface px-4 py-2 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-[#c2410c] dark:text-theme-accent" />
                    <div className="leading-tight">
                      <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                        {timeNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    className="p-2.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface hover:bg-[#f5f0ea] dark:hover:bg-theme-surface/80 border border-[#f0ece6] dark:border-theme-border-soft text-[#78716c] hover:text-[#c2410c] transition-colors shadow-2xs cursor-pointer"
                    title="Sync Latest Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. HERO SECTION: REVENUE & COLLECTION TREND (VISUAL FOCUS) */}
              {/* ========================================================================= */}
              <div className="bg-white dark:bg-theme-card p-5 sm:p-6 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-5">
                {/* Header & Timeframe Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5f2ed] dark:border-theme-border-soft/60">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                      Revenue & Collection Trend
                    </h2>
                    <p className="text-xs text-[#78716c] dark:text-theme-muted font-medium mt-0.5">
                      Track invoiced revenue and actual collections over time.
                    </p>
                  </div>

                  {/* Timeframe Controls */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                    {Object.entries(timeframeLabels).map(([k, lbl]) => (
                      <button
                        key={k}
                        onClick={() => setChartTimeframe(k)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          chartTimeframe === k
                            ? 'bg-[#c2410c] text-white shadow-xs'
                            : 'bg-[#faf8f5] dark:bg-theme-surface text-[#78716c] dark:text-theme-muted hover:text-[#1c1917] border border-[#f0ece6] dark:border-theme-border-soft'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero 4 KPI Summary Cards for Selected Timeframe */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* KPI 1: TOTAL INVOICED */}
                  <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed] dark:border-theme-border-soft/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        TOTAL INVOICED
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#c2410c] dark:text-theme-accent font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(heroKPIs.invoiced, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-[#f0ece6] dark:border-theme-border-soft/40 flex items-center justify-between text-2xs text-theme-muted font-medium">
                      <span>Billed Volume</span>
                      <span className="font-bold text-[#c2410c]">{timeframeLabels[chartTimeframe]}</span>
                    </div>
                  </div>

                  {/* KPI 2: TOTAL COLLECTED */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        TOTAL COLLECTED
                      </span>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(heroKPIs.collected, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                      <span>{heroKPIs.prevDueCollected > 0 ? `${formatCurrency(heroKPIs.prevDueCollected, currencySymbol)} Earlier • ` : ''}{formatCurrency(heroKPIs.currentBillCollected, currencySymbol)} This Bill</span>
                      <span className="font-bold text-emerald-600 shrink-0">Collected</span>
                    </div>
                  </div>

                  {/* KPI 3: OUTSTANDING */}
                  <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed] dark:border-theme-border-soft/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        AMOUNT STILL DUE
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#ea580c] dark:text-amber-500 font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(heroKPIs.outstanding, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-[#f0ece6] dark:border-theme-border-soft/40 flex items-center justify-between text-[10px] text-theme-muted font-medium truncate">
                      <span>{metrics.previousDueTotal > 0 ? `${formatCurrency(metrics.previousDueTotal, currencySymbol)} Earlier • ` : ''}{formatCurrency(metrics.currentDueTotal, currencySymbol)} This Bill</span>
                      <span className="font-bold text-[#ea580c] shrink-0">Due</span>
                    </div>
                  </div>

                  {/* KPI 4: COLLECTION RATE */}
                  <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                        COLLECTION RATE
                      </span>
                      <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-numbers mt-1">
                        <AnimatedNumber value={`${heroKPIs.collectionRate}%`} />
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-indigo-500/20 flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                      <span>{heroKPIs.currentRealizationRate}% Realized</span>
                      <span className="font-bold text-indigo-600">{heroKPIs.collectionRate >= 70 ? 'High' : 'Active'}</span>
                    </div>
                  </div>
                </div>

                {/* Main Hero AreaChart */}
                <div className="h-64 sm:h-72 w-full pt-2">
                  <div className="flex items-center gap-4 mb-2 text-2xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#c2410c] dark:text-theme-accent">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#c2410c]" /> INVOICED (Created Invoices)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> COLLECTED (Confirmed Payments)
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroInvoicedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c2410c" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#c2410c" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="heroCollectedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" opacity={0.6} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} dy={4} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                      <Tooltip content={<PremiumChartTooltip currencySymbol={currencySymbol} />} />
                      <Area type="monotone" dataKey="invoiced" name="invoiced" stroke="#c2410c" strokeWidth={2.4} fill="url(#heroInvoicedGrad)" />
                      <Area type="monotone" dataKey="collected" name="collected" stroke="#10b981" strokeWidth={2.2} fill="url(#heroCollectedGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. QUICK COMMAND BAR & ACTION SHORTCUTS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {/* 1. Create Invoice */}
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
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Record Payment</span>
                </button>

                {/* 4. Due Ledger */}
                <button
                  onClick={() => setCurrentTab('due-ledger')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-[#ea580c]" />
                  <span>Due Ledger</span>
                </button>

                {/* 5. Add Expense */}
                {hasExpenses && (
                  <button
                    onClick={() => setCurrentTab('expenses')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-theme-card hover:bg-[#faf5ef] dark:hover:bg-theme-surface-elevated border border-[#f0ece6] dark:border-theme-border-soft text-[#1c1917] dark:text-theme-primary text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span>Add Expense</span>
                  </button>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 4. UNIVERSAL MONEY SNAPSHOT (BUSINESS VS PERSONAL VS DREAM) */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#c2410c]" />
                    <h2 className="text-xs font-black text-[#1c1917] dark:text-theme-primary uppercase tracking-wider">
                      Universal Money & Collection Center
                    </h2>
                  </div>
                  <span className="text-2xs text-[#a8a29e] font-bold">
                    Clean Business & Personal Separation
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* CARD 1: BUSINESS MONEY */}
                  <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed] dark:border-theme-border-soft/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary">
                          BUSINESS MONEY
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#faf5ef] text-[#c2410c] border border-[#f0ece6]">
                        Enterprise
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-[#a8a29e] uppercase tracking-wider block">
                        TOTAL AVAILABLE BUSINESS MONEY
                      </span>
                      <p className="text-2xl font-black text-[#c2410c] font-numbers mt-0.5">
                        <AnimatedNumber value={formatCurrency(bucketFinancials.businessAvailableTotal, currencySymbol)} />
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                        <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">Total Collected</span>
                        <span className="font-black text-emerald-600 font-numbers text-xs">
                          {formatCurrency(bucketFinancials.totalCollected, currencySymbol)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                        <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">Business Expenses</span>
                        <span className="font-black text-rose-500 font-numbers text-xs">
                          {formatCurrency(bucketFinancials.totalBusinessExpenses, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: CURRENT MONEY LOCATIONS & PERSONAL MONEY */}
                  <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed] dark:border-theme-border-soft/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary">
                          MONEY LOCATIONS & SALARY
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                        Liquid Funds
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold">
                          <Coins className="w-3.5 h-3.5" />
                          <span>My Cash</span>
                        </div>
                        <p className="text-base font-black text-amber-700 dark:text-amber-400 font-numbers mt-1">
                          {formatCurrency(bucketFinancials.myCashBalance, currencySymbol)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                        <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-bold">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>PhonePe / Digital</span>
                        </div>
                        <p className="text-base font-black text-indigo-700 dark:text-indigo-400 font-numbers mt-1">
                          {formatCurrency(bucketFinancials.phonePeBalance, currencySymbol)}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">My Salary Drawn</span>
                        <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                          {formatCurrency(bucketFinancials.totalMySalary, currencySymbol)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">Personal Total</span>
                        <span className="font-black text-emerald-600 font-numbers">
                          {formatCurrency(bucketFinancials.personalAvailableTotal, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: MY DREAM SAVINGS */}
                  <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed] dark:border-theme-border-soft/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-[#1c1917] dark:text-theme-primary">
                          MY DREAM SAVINGS
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600">
                          {activeDream?.status || 'ACTIVE'}
                        </span>
                        <button
                          onClick={() => setShowDreamCreateModal(true)}
                          className="p-1 rounded-lg text-theme-muted hover:text-pink-600 transition-colors"
                          title="New Dream Goal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {activeDream ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#1c1917] dark:text-theme-primary truncate">{activeDream.dreamName || activeDream.name}</span>
                          <span className="text-pink-600 font-black font-numbers">{formatCurrency(activeDream.savedAmount || 0, currencySymbol)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#faf5ef] dark:bg-theme-surface h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, activeDream.progressPercentage || 0)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-theme-muted">
                          <span>{activeDream.progressPercentage || 0}% Target: {formatCurrency(activeDream.targetAmount || 0, currencySymbol)}</span>
                          <span>{formatCurrency(activeDream.remainingAmount || 0, currencySymbol)} left</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => setShowDreamAddModal(true)}
                            className="py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-2xs font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Save Money</span>
                          </button>
                          <button
                            disabled={!activeDream.savedAmount}
                            onClick={() => setShowDreamWithdrawModal(true)}
                            className="py-2 px-3 rounded-xl bg-[#faf8f5] dark:bg-theme-surface hover:bg-[#f0ece6] text-[#1c1917] dark:text-theme-primary text-2xs font-bold transition-all flex items-center justify-center gap-1 border border-[#f0ece6] disabled:opacity-50 cursor-pointer"
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
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 5. RECEIVABLES & DUE INTELLIGENCE */}
              {/* ========================================================================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ea580c]" />
                    <h2 className="text-xs font-black text-[#1c1917] dark:text-theme-primary uppercase tracking-wider">
                      Receivables & Due Intelligence
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentTab('due-ledger')}
                    className="text-xs font-bold text-[#c2410c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Due</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* LEFT: PREVIOUS DUE & CURRENT DUE BREAKDOWN (5 COLS) */}
                  <div className="lg:col-span-5 bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] uppercase tracking-wider block">
                        TOTAL OUTSTANDING RECEIVABLES
                      </span>
                      <p className="text-2xl font-black text-[#ea580c] font-numbers mt-0.5">
                        <AnimatedNumber value={formatCurrency(metrics.totalOutstanding, currencySymbol)} />
                      </p>
                    </div>

                    {/* Previous Due vs Current Due Split */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          <span>PREVIOUS DUE</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[8px] font-black">Priority</span>
                        </div>
                        <p className="text-base font-black text-amber-800 dark:text-amber-300 font-numbers mt-1">
                          {formatCurrency(metrics.previousDueTotal, currencySymbol)}
                        </p>
                        <p className="text-[9px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                          Paid first upon collection
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                        <span className="text-[10px] font-bold text-theme-muted uppercase block">Current Invoice Due</span>
                        <p className="text-base font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-1">
                          {formatCurrency(metrics.currentDueTotal, currencySymbol)}
                        </p>
                        <p className="text-[9px] text-theme-muted mt-0.5">
                          Active invoices
                        </p>
                      </div>
                    </div>

                    {/* Aging distribution bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-theme-muted mb-1.5">
                        <span>Aging Breakdown</span>
                        <span className="text-rose-600">{metrics.overdueCount} Overdue ({formatCurrency(metrics.overdueAmount, currencySymbol)})</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center text-[8px] font-bold">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <div>Current</div>
                          <div className="font-numbers">{formatCurrency(metrics.aging.current, currencySymbol)}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          <div>1-7d</div>
                          <div className="font-numbers">{formatCurrency(metrics.aging.days1to7, currencySymbol)}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-800 border border-amber-500/25">
                          <div>8-30d</div>
                          <div className="font-numbers">{formatCurrency(metrics.aging.days8to30, currencySymbol)}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 border border-rose-500/20">
                          <div>31-60d</div>
                          <div className="font-numbers">{formatCurrency(metrics.aging.days31to60, currencySymbol)}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-800 border border-rose-500/30">
                          <div>60d+</div>
                          <div className="font-numbers">{formatCurrency(metrics.aging.days60plus, currencySymbol)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: TOP OUTSTANDING CUSTOMERS LIST (7 COLS) */}
                  <div className="lg:col-span-7 bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Top Customers with Outstanding Balance
                      </h3>
                      <span className="text-2xs font-bold text-theme-muted">
                        {customerAnalytics.withDueCount} Debtors
                      </span>
                    </div>

                    {customerAnalytics.topDebtors.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#a8a29e]">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                        <p className="font-bold text-[#1c1917] dark:text-theme-primary">No outstanding dues</p>
                        <p className="text-2xs text-theme-muted mt-0.5">All customer invoices have been fully settled.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[9px] font-bold text-[#a8a29e] uppercase tracking-wider border-b border-[#f5f2ed] pb-2">
                              <th className="pb-2">CUSTOMER</th>
                              <th className="pb-2 text-right">TOTAL DUE</th>
                              <th className="pb-2 text-right">PREV DUE</th>
                              <th className="pb-2 text-right">INVOICES</th>
                              <th className="pb-2 text-center">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#faf7f2] dark:divide-theme-border-soft/40">
                            {customerAnalytics.topDebtors.slice(0, 5).map(c => (
                              <tr key={c.id} className="hover:bg-[#faf8f5] dark:hover:bg-theme-surface/50 transition-colors">
                                <td className="py-2.5 font-bold text-[#1c1917] dark:text-theme-primary">
                                  <div>{c.name}</div>
                                  {c.phone && <div className="text-[9px] text-[#a8a29e] font-numbers">{c.phone}</div>}
                                </td>
                                <td className="py-2.5 text-right font-black text-rose-600 dark:text-rose-400 font-numbers">
                                  {formatCurrency(c.totalDue, currencySymbol)}
                                </td>
                                <td className="py-2.5 text-right font-bold text-amber-600 font-numbers">
                                  {c.previousDue > 0 ? formatCurrency(c.previousDue, currencySymbol) : '—'}
                                </td>
                                <td className="py-2.5 text-right font-medium text-theme-muted font-numbers">
                                  {c.invoicesCount}
                                </td>
                                <td className="py-2.5 text-center">
                                  <button
                                    onClick={() => setCurrentTab('due-ledger')}
                                    className="px-2.5 py-1 rounded-xl bg-[#faf5ef] dark:bg-theme-surface text-[#c2410c] text-[10px] font-bold hover:bg-[#c2410c] hover:text-white transition-all border border-[#f0ece6]"
                                  >
                                    Collect
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 6. SALES & INVOICE INTELLIGENCE */}
              {/* ========================================================================= */}
              <div className="space-y-4">
                {/* Executive Sales Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Today's Sales */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        TODAY'S SALES
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(metrics.todaysSales, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs text-[#78716c]">
                      <span>Today's Invoiced Volume</span>
                      <span className="font-bold text-[#c2410c]">{metrics.todaysInvoicesCount} inv</span>
                    </div>
                  </div>

                  {/* Today's Collected */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        TODAY'S COLLECTED
                      </span>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(metrics.todaysCollected, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs text-[#78716c]">
                      <span>{metrics.todaysPaymentCount} payments</span>
                      <span className="font-bold text-emerald-600">Money In</span>
                    </div>
                  </div>

                  {/* Month Revenue */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block" data-title="Month Revenue">
                        TOTAL REVENUE (THIS MONTH)
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#c2410c] dark:text-theme-accent font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(metrics.thisMonthRevenue, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs">
                      {metrics.revenueGrowthPercent !== null ? (
                        <span className={`font-bold ${metrics.revenueGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {metrics.revenueGrowthPercent >= 0 ? `+${metrics.revenueGrowthPercent}%` : `${metrics.revenueGrowthPercent}%`} vs last mo
                        </span>
                      ) : (
                        <span className="text-theme-muted">This Month</span>
                      )}
                      <span className="text-theme-muted font-medium">Billed</span>
                    </div>
                  </div>

                  {/* Month Collected */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        MONTH COLLECTED
                      </span>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(metrics.thisMonthCollected, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs">
                      <span className="text-emerald-600 font-bold">{metrics.collectionRate}% Rate</span>
                      <span className="text-theme-muted font-medium">Realized</span>
                    </div>
                  </div>

                  {/* Total Invoices Count */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        TOTAL INVOICES
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-1">
                        <AnimatedNumber value={scopedInvoices.length} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs text-[#78716c]">
                      <span>{metrics.paidInvoicesCount} Paid</span>
                      <span className="font-bold text-amber-600">{metrics.unpaidInvoicesCount} Due</span>
                    </div>
                  </div>

                  {/* Average Ticket Size */}
                  <div className="bg-white dark:bg-theme-card p-4 rounded-2xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-[#a8a29e] dark:text-theme-muted uppercase tracking-wider block">
                        AVERAGE INVOICE
                      </span>
                      <p className="text-lg sm:text-xl font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-1">
                        <AnimatedNumber value={formatCurrency(customerAnalytics.avgInvoiceValue, currencySymbol)} />
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#f5f2ed] dark:border-theme-border-soft/60 flex items-center justify-between text-2xs text-[#78716c]">
                      <span>Ticket Size</span>
                      <span className="font-bold">Avg</span>
                    </div>
                  </div>
                </div>

                {/* Recent Invoices Table */}
                <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Recent Invoices
                      </h3>
                      <p className="text-2xs text-[#78716c] dark:text-theme-muted mt-0.5">
                        {metrics.paidInvoicesCount} Paid • {metrics.partialInvoicesCount} Partial • {metrics.unpaidInvoicesCount} Unpaid
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('invoices')}
                      className="text-xs font-bold text-[#c2410c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Invoices</span>
                      <span>→</span>
                    </button>
                  </div>

                  {recentInvoicesList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#a8a29e]">
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
                            const status = getInvoicePaymentStatus(inv);
                            const isPaid = status === 'Paid';
                            const isPartial = status === 'Partial';

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
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isPaid 
                                      ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' 
                                      : isPartial 
                                      ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' 
                                      : 'bg-rose-100/70 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                  }`}>
                                    {status}
                                  </span>
                                </td>

                                <td className="py-3 text-center">
                                  <div className="flex items-center justify-center gap-1 text-[#a8a29e]">
                                    {due > 0 && (
                                      <button
                                        onClick={() => setQuickPayInvoice(inv)}
                                        className="p-1 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                                        title="Quick Pay Collection"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onViewInvoice?.(inv)}
                                      className="p-1 hover:text-[#c2410c] hover:bg-[#faf5ef] rounded-md transition-colors cursor-pointer"
                                      title="View Invoice"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDownloadPDF?.(inv)}
                                      className="p-1 hover:text-[#c2410c] hover:bg-[#faf5ef] rounded-md transition-colors cursor-pointer"
                                      title="Download PDF"
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
              </div>

              {/* ========================================================================= */}
              {/* 7. EXPENSE & CASH FLOW INTELLIGENCE */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT: CASH FLOW BAR & PAYMENT METHODS (6 COLS) */}
                <div className="lg:col-span-6 bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Cash Flow: Money In vs Money Out
                      </h3>
                    </div>
                    <span className="text-2xs font-bold text-theme-muted">
                      Lifetime Overview
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Flow Bar */}
                    <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-600">Money In: {formatCurrency(metrics.totalCollected, currencySymbol)}</span>
                        <span className="text-rose-500">Money Out: {formatCurrency(metrics.totalExpenses, currencySymbol)}</span>
                      </div>
                      <div className="w-full bg-[#f0ece6] h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{
                            width: `${(metrics.totalCollected + metrics.totalExpenses) > 0 ? (metrics.totalCollected / (metrics.totalCollected + metrics.totalExpenses)) * 100 : 50}%`
                          }}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{
                            width: `${(metrics.totalCollected + metrics.totalExpenses) > 0 ? (metrics.totalExpenses / (metrics.totalCollected + metrics.totalExpenses)) * 100 : 50}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Payment methods split */}
                    <div>
                      <h4 className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-wider mb-2">
                        Collections by Payment Method
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="text-[9px] font-bold text-amber-700 block">Cash</span>
                          <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                            {formatCurrency(metrics.cashPaymentsTotal, currencySymbol)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                          <span className="text-[9px] font-bold text-indigo-700 block">Digital / UPI</span>
                          <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                            {formatCurrency(metrics.digitalPaymentsTotal, currencySymbol)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/20">
                          <span className="text-[9px] font-bold text-slate-700 block">Other</span>
                          <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                            {formatCurrency(metrics.otherPaymentsTotal, currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: EXPENSE INTELLIGENCE & CATEGORIES (6 COLS) */}
                <div className="lg:col-span-6 bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed]">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                        Expense Center & Categories
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('expenses')}
                      className="text-xs font-bold text-[#c2410c] hover:underline cursor-pointer"
                    >
                      All Expenses →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                      <span className="text-[8px] font-bold text-rose-700 uppercase block">This Month Expenses</span>
                      <span className="text-lg font-black text-rose-600 font-numbers mt-0.5 block">
                        {formatCurrency(metrics.thisMonthExpenses, currencySymbol)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                      <span className="text-[8px] font-bold text-theme-muted uppercase block">All-Time Expenses</span>
                      <span className="text-lg font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-0.5 block">
                        {formatCurrency(metrics.totalExpenses, currencySymbol)}
                      </span>
                    </div>
                  </div>

                  {metrics.expenseCategories.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-[#a8a29e] uppercase tracking-wider block">
                        Category Breakdown
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {metrics.expenseCategories.slice(0, 4).map(c => (
                          <div key={c.name} className="flex items-center justify-between p-2 rounded-xl bg-[#faf8f5] dark:bg-theme-surface/40 border border-[#f5f2ed] text-xs">
                            <span className="font-bold text-[#44403c] dark:text-theme-secondary truncate">{c.name}</span>
                            <span className="font-black text-rose-600 font-numbers">{formatCurrency(c.amount, currencySymbol)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-theme-muted">
                      No expense categories recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 8. CUSTOMER INTELLIGENCE */}
              {/* ========================================================================= */}
              <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#c2410c]" />
                    <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                      Customer Intelligence
                    </h3>
                  </div>
                  <span className="text-2xs font-bold text-theme-muted">
                    {customerAnalytics.totalCustomersCount} Total Registered
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                    <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">Fully Settled</span>
                    <span className="text-lg font-black text-emerald-600 font-numbers mt-0.5 block">
                      {customerAnalytics.fullyPaidCount} Customers
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                    <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">With Due Balance</span>
                    <span className="text-lg font-black text-amber-600 font-numbers mt-0.5 block">
                      {customerAnalytics.withDueCount} Customers
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/60 border border-[#f5f2ed]">
                    <span className="text-[8px] font-bold text-[#a8a29e] uppercase block">Average Payment Value</span>
                    <span className="text-lg font-black text-[#1c1917] dark:text-theme-primary font-numbers mt-0.5 block">
                      {formatCurrency(customerAnalytics.avgPaymentValue, currencySymbol)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-wider mb-2">
                    Top Customers by Revenue
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {customerAnalytics.topRevenue.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-[#faf8f5] dark:bg-theme-surface/40 border border-[#f5f2ed]">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 rounded-full bg-[#c2410c]/10 text-[#c2410c] text-[9px] font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-bold text-[#1c1917] dark:text-theme-primary truncate">{c.name}</span>
                        </div>
                        <span className="font-black text-[#1c1917] dark:text-theme-primary font-numbers">
                          {formatCurrency(c.totalBilled, currencySymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 9. ACTION REQUIRED (NEEDS YOUR ATTENTION) */}
              {/* ========================================================================= */}
              {(metrics.overdueCount > 0 || pendingPaymentsCount > 0 || metrics.dueTodayInvoicesCount > 0) ? (
                <div className="p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-500/20 dark:border-rose-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1c1917] dark:text-theme-primary uppercase tracking-wider flex items-center gap-2">
                        <span>Needs Your Attention</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                          Immediate
                        </span>
                      </h4>
                      <p className="text-xs text-[#78716c] dark:text-theme-muted font-medium flex items-center gap-3 flex-wrap mt-1">
                        {metrics.overdueCount > 0 && (
                          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            🔴 {metrics.overdueCount} Overdue ({formatCurrency(metrics.overdueAmount, currencySymbol)})
                          </span>
                        )}
                        {metrics.dueTodayInvoicesCount > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            🟠 {metrics.dueTodayInvoicesCount} Due Today ({formatCurrency(metrics.dueTodayAmount, currencySymbol)})
                          </span>
                        )}
                        {pendingPaymentsCount > 0 && (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            🟡 {pendingPaymentsCount} Payment Proofs Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {pendingPaymentsCount > 0 && (
                      <button
                        onClick={() => setCurrentTab('pending-payments')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Verify Proofs ({pendingPaymentsCount})
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentTab('due-ledger')}
                      className="px-3.5 py-2 bg-white dark:bg-theme-surface text-xs font-bold text-[#c2410c] dark:text-theme-accent border border-[#f0ece6] dark:border-theme-border-soft hover:bg-[#faf5ef] rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      Follow Up Dues →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Everything looks good! Zero overdue invoices and all collections are up to date.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 hidden sm:inline font-numbers">
                    {metrics.collectionRate}% Collection Efficiency
                  </span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 10. RECENT CONFIRMED FINANCIAL ACTIVITY */}
              {/* ========================================================================= */}
              <div className="bg-white dark:bg-theme-card p-5 rounded-3xl border border-[#f0ece6] dark:border-theme-border-soft shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f2ed]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#c2410c]" />
                    <h3 className="text-xs font-black text-[#1c1917] dark:text-theme-primary tracking-tight">
                      Confirmed Financial Activity Feed
                    </h3>
                  </div>
                  <button
                    onClick={() => setCurrentTab('collection-center')}
                    className="text-xs font-bold text-[#c2410c] hover:underline cursor-pointer"
                  >
                    View Money Center →
                  </button>
                </div>

                {unifiedActivity.length === 0 ? (
                  <div className="py-8 text-center text-xs text-theme-muted">
                    No recent confirmed transactions recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#faf7f2] dark:divide-theme-border-soft/40">
                    {unifiedActivity.map((act, i) => (
                      <div key={act.id || i} className="py-3 flex items-center justify-between text-xs hover:bg-[#faf8f5] dark:hover:bg-theme-surface/40 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            act.type === 'collection' || act.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : act.type === 'expense'
                              ? 'bg-rose-500/10 text-rose-600'
                              : act.type === 'salary'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-indigo-500/10 text-indigo-600'
                          }`}>
                            {act.type === 'collection' ? <CreditCard className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#1c1917] dark:text-theme-primary">
                              {act.title || act.customerName || act.category || 'Transaction'}
                            </p>
                            <p className="text-[10px] text-theme-muted">
                              {act.formattedDate || (act.date ? new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Confirmed')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-black font-numbers ${
                            act.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {act.type === 'expense' ? '-' : '+'}{formatCurrency(act.amount, currencySymbol)}
                          </p>
                          <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">
                            {act.source || act.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ADD CUSTOMER MODAL */}
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
                    className="btn-premium flex-1 !py-2 text-xs font-black shadow-lg shadow-pink-500/20 bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
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
                    className="btn-premium flex-1 !py-2 text-xs font-black shadow-lg shadow-theme-accent/20 cursor-pointer"
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
                    className="btn-premium flex-1 !py-2 text-xs font-black bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
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
