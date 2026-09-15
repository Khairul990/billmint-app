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
import { getCategoryExperience } from '../config/categoryExperience';
import { 
  SignatureSurface, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../components/ui/Card';
import { FinancialValue } from '../components/ui/FinancialValue';
import { FinancialEquation } from '../components/ui/FinancialEquation';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button, ActionButton } from '../components/ui/Button';

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
    <div className="bg-theme-surface/95 dark:bg-theme-card/95 backdrop-blur-md p-3.5 rounded-2xl border border-theme-border-soft shadow-xl space-y-2 text-xs min-w-[200px]">
      <div className="font-bold text-theme-primary pb-1.5 border-b border-theme-border-soft/60 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{rate}% Realized</span>
      </div>
      <div className="space-y-1.5 text-2xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-theme-accent font-semibold">
            <span className="w-2 h-2 rounded-full bg-theme-accent" /> Invoiced:
          </span>
          <span className="font-black text-theme-primary font-numbers">
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
            <span>↳ Earlier Due:</span>
            <span className="font-bold font-numbers">{formatCurrency(prevDueCollected, currencySymbol)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pl-3 text-emerald-700 dark:text-emerald-300 text-[10px]">
          <span>↳ This Bill:</span>
          <span className="font-bold font-numbers">{formatCurrency(currentBillCollected, currencySymbol)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-theme-border-soft/40">
          <span className="text-amber-600 dark:text-amber-500 font-semibold">Period Outstanding:</span>
          <span className="font-black text-amber-600 dark:text-amber-500 font-numbers">
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
  onOpenCollection,
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
  const businessCategory = activeWorkspace?.category || activeWorkspace?.type || businessSettings?.businessCategory || 'general';
  const categoryExp = useMemo(() => getCategoryExperience(businessCategory) || {}, [businessCategory]);

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
    
    const customerAgg = new Map();

    scopedInvoices.forEach(inv => {
      const fin = calculateCanonicalInvoiceFinancials(inv);
      const invTotal = fin.currentInvoiceTotal;
      const invPaid = fin.amountPaid;
      const invBalance = fin.balanceDue; // Just this invoice's due
      const invDateStr = getLocalCalendarDate(inv.date) || getLocalCalendarDate(inv.createdAt);
      
      const isTodayInv = invDateStr === todayStr;
      const isYesterdayInv = invDateStr === yesterdayStr;
      const isThisMonthInv = invDateStr.startsWith(currentMonthPrefix);
      const isPrevMonthInv = invDateStr.startsWith(prevMonthPrefix);

      totalRevenue += invTotal;
      totalCollected += invPaid;
      
      // Customer Aggregation for True Total Outstanding
      const cId = inv.customerId || inv.customer?.id || inv.customerName || 'Walk-in Customer';
      if (!customerAgg.has(cId)) {
        customerAgg.set(cId, { totalBilled: 0, totalPaid: 0, oldestDate: null, importedBalance: 0 });
      }
      const agg = customerAgg.get(cId);
      agg.totalBilled += invTotal;
      agg.totalPaid += invPaid;
      
      const invDate = new Date(inv.date || inv.createdAt).getTime();
      if (!agg.oldestDate || invDate < agg.oldestDate) {
        agg.oldestDate = invDate;
        agg.importedBalance = fin.previousDue > 0 ? fin.previousDue : 0;
      }

      // Status classification
      const status = fin.paymentStatus;
      if (status === 'Paid') paidInvoicesCount++;
      else if (status === 'Partially Paid' || status === 'Partial') partialInvoicesCount++;
      else unpaidInvoicesCount++;

      // Old Due / Earlier Due extraction (canonical)
      const prevDueAmt = fin.previousDue;
      if (prevDueAmt > 0) {
        previousDueTotal += prevDueAmt;
      }
      currentDueTotal += fin.balanceDue;

      if (isTodayInv) {
        todaysSales += invTotal;
        todaysOutstanding += invBalance;
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
        thisMonthOutstanding += invBalance;
      }
      if (isPrevMonthInv) prevMonthRevenue += invTotal;

      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      // Overdue is based on this invoice's balance
      const isOverdue = invBalance > 0 && dueDate && !isNaN(dueDate.getTime()) && dueDate < now;

      if (isOverdue) {
        overdueCount++;
        overdueAmount += invBalance;
      }

      if (inv.dueDate && getLocalCalendarDate(inv.dueDate) === todayStr && invBalance > 0) {
        dueTodayAmount += invBalance;
        dueTodayInvoicesCount++;
      }

      if (dueDate && !isNaN(dueDate.getTime()) && dueDate >= now && (dueDate.getTime() - now.getTime()) <= (7 * 24 * 60 * 60 * 1000) && invBalance > 0) {
        dueThisWeekAmount += invBalance;
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

    for (const agg of customerAgg.values()) {
      const custDue = Math.max(0, agg.totalBilled + agg.importedBalance - agg.totalPaid);
      totalOutstanding += custDue;
    }

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

  // CANONICAL CHART DATA GENERATION (Revenue & Collected Trend)
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

  // Selected Timeframe Summary
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

  const isBusinessEmpty = scopedInvoices.length === 0;

  // Retain canonical calculations for test compatibility
  const businessAvailableMoney = bucketFinancials.businessAvailableTotal ?? bucketFinancials.businessBalance ?? 0;

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh} isLoading={isLoading}>
        <div className="w-full relative min-h-screen bg-theme-tint-bg dark:bg-theme-app text-theme-primary pb-12 font-sans selection:bg-theme-accent/20 overflow-x-hidden">
          
          {/* Subtle Ambient Theme Atmosphere */}
          <div className="absolute inset-0 pointer-events-none -z-0 opacity-40 dark:opacity-25 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-3xl bg-theme-accent/10" />
            <div className="absolute top-48 -right-24 w-[450px] h-[450px] rounded-full blur-3xl bg-theme-accent/8" />
          </div>

          {(isInitialLoad || isLoading) ? (
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 space-y-6 relative z-10">
              <KPISkeleton count={4} />
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-7 pt-4 space-y-6 relative z-10">

              {/* ========================================================================= */}
              {/* LEVEL 1: EXECUTIVE HEADER & REAL-TIME BUSINESS HEALTH COCKPIT */}
              {/* ========================================================================= */}
              <div className="relative overflow-hidden luxury-glass-card p-4 sm:p-5 lg:p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-theme-border-soft group">
                {/* Decorative Premium Glow */}
                <div className="absolute top-0 right-1/4 -mt-10 w-40 h-40 rounded-full bg-theme-accent opacity-[0.08] blur-3xl group-hover:opacity-[0.12] transition-opacity duration-700 pointer-events-none z-0" />
                <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-48 h-48 rounded-full bg-emerald-500 opacity-[0.05] blur-3xl pointer-events-none z-0" />

                <div className="min-w-0 flex-1 relative z-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-theme-surface text-theme-accent border border-theme-border-soft flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-theme-accent" />
                      {workspaceName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-theme-surface-elevated text-theme-muted border border-theme-border-soft">
                      {categoryExp.labels?.invoice ? `${businessCategory} • ${categoryExp.labels.invoice}s` : 'Business Command Center'}
                    </span>
                    <span className="text-2xs text-theme-muted font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {syncStatus}
                    </span>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bq-font-display text-theme-primary tracking-tight flex items-center gap-2 mt-1 truncate">
                    <span>{greeting.text},</span>
                    <span className="text-theme-accent truncate">{ownerName}</span>
                    <span>👋</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-theme-muted font-medium mt-1">
                    Your business at a glance — Real-time revenue intelligence, collection flow, and customer ledger.
                  </p>
                </div>

                {/* Right Header Controls & Quick Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 relative z-10">
                  {/* Business Health Indicator */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold shadow-sm ${
                    metrics.businessHealth.color === 'emerald'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                      : metrics.businessHealth.color === 'rose'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      metrics.businessHealth.color === 'emerald' ? 'bg-emerald-500' : metrics.businessHealth.color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span>Business Health: {metrics.businessHealth.label}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Primary Create Bill / Invoice Action */}
                    <Button
                      variant="financial"
                      size="sm"
                      onClick={() => setCurrentTab('create-invoice')}
                      leftIcon={Plus}
                      className="shadow-sm"
                    >
                      {categoryExp.labels?.invoice ? `Create ${categoryExp.labels.invoice}` : 'Create Invoice'}
                    </Button>

                    {/* Quick Collect Action */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenCollection}
                      leftIcon={CreditCard}
                    >
                      Record Payment
                    </Button>

                    {/* Refresh Button */}
                    <button
                      onClick={handleRefresh}
                      className="flex items-center justify-center p-2 rounded-xl bg-theme-surface hover:bg-theme-surface-elevated border border-theme-border-soft text-theme-muted hover:text-theme-accent transition-all cursor-pointer group shadow-sm"
                      title="Sync Latest Data"
                      aria-label="Sync Data"
                    >
                      <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* FIRST BUSINESS EMPTY STATE */}
              {isBusinessEmpty ? (
                <div className="luxury-glass-card p-6 sm:p-10 rounded-3xl border border-theme-border-soft text-center space-y-6">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-theme-accent/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold bq-font-display text-theme-primary">
                      Your business starts here
                    </h2>
                    <p className="text-sm text-theme-muted leading-relaxed">
                      Welcome to your BillQyro Business Command Center. Create your first customer, record an invoice, and watch your financial ledger come to life.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                    <div 
                      onClick={() => setShowAddCustomerSheet(true)}
                      className="luxury-glass-subcard p-5 rounded-2xl border border-theme-border-soft hover:border-theme-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="p-2.5 w-fit rounded-xl bg-theme-accent/10 text-theme-accent mb-3 group-hover:bg-theme-accent group-hover:text-white transition-colors">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-theme-primary mb-1">
                        1. Add First {categoryExp.labels?.customer || 'Customer'}
                      </h3>
                      <p className="text-xs text-theme-muted">
                        Save client contacts and track their balance from day one.
                      </p>
                    </div>

                    <div 
                      onClick={() => setCurrentTab('create-invoice')}
                      className="luxury-glass-subcard p-5 rounded-2xl border border-theme-border-soft hover:border-theme-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-theme-primary mb-1">
                        2. Create First {categoryExp.labels?.invoice || 'Invoice'}
                      </h3>
                      <p className="text-xs text-theme-muted">
                        Generate professional bills with automatic Earlier Due tracking.
                      </p>
                    </div>

                    <div 
                      onClick={onOpenCollection}
                      className="luxury-glass-subcard p-5 rounded-2xl border border-theme-border-soft hover:border-theme-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="p-2.5 w-fit rounded-xl bg-theme-accent/10 text-theme-accent mb-3 group-hover:bg-theme-accent group-hover:text-white transition-colors">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-theme-primary mb-1">
                        3. Collection Center
                      </h3>
                      <p className="text-xs text-theme-muted">
                        Accept payments, record cash or UPI, and settle customer accounts.
                      </p>
                    </div>
                  </div>

                  {categoryExp.quickTips && categoryExp.quickTips.length > 0 && (
                    <div className="max-w-xl mx-auto p-4 rounded-2xl bg-theme-surface-elevated border border-theme-border-soft flex items-center gap-3 text-left">
                      <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                      <div className="text-xs text-theme-muted">
                        <span className="font-bold text-theme-primary">Pro Tip for {businessCategory}:</span> {categoryExp.quickTips[0]}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* ========================================================================= */}
                  {/* LEVEL 2: TODAY'S BUSINESS SNAPSHOT */}
                  {/* ========================================================================= */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* HERO FINANCIAL FOCAL POINT (7 Columns on Desktop) */}
                    <div className="lg:col-span-7 luxury-glass-card p-6 rounded-3xl border border-theme-border-soft flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-theme-surface via-theme-surface to-theme-surface-elevated group">
                      {/* Premium Decorative Background Elements */}
                      <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-theme-accent/5 rounded-full blur-3xl group-hover:bg-theme-accent/10 transition-all duration-700 pointer-events-none z-0" />
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] text-theme-accent pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 z-0">
                        <TrendingUp style={{ width: '160px', height: '160px' }} />
                      </div>

                      <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60 relative z-10">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-theme-accent" />
                          <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                            TOTAL REVENUE (THIS MONTH)
                          </span>
                        </div>
                        <span className="text-2xs font-bold text-theme-muted flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="py-5 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <FinancialValue
                            label="Month Revenue"
                            value={metrics.thisMonthRevenue > 0 ? metrics.thisMonthRevenue : metrics.totalRevenue}
                            currency={currencySymbol}
                            intent="sales"
                            size="xl"
                          />
                          
                          <div className="mt-3 flex items-center gap-3 flex-wrap text-xs">
                            {metrics.todaysSales > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Today's Invoiced Volume: {formatCurrency(metrics.todaysSales, currencySymbol)} ({metrics.todaysInvoicesCount} bills)
                              </span>
                            ) : (
                              <span className="text-theme-muted font-medium">
                                Today's Invoiced Volume: {formatCurrency(0, currencySymbol)} • {scopedInvoices.length} active invoices
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side balanced metrics */}
                        <div className="shrink-0 flex flex-col gap-3 md:items-end p-4 rounded-2xl bg-theme-surface/50 border border-theme-border-soft backdrop-blur-sm min-w-[220px]">
                           <div className="flex items-center justify-between w-full gap-4">
                             <span className="text-xs text-theme-muted font-medium">Net Cash Flow</span>
                             <span className="font-bold text-theme-primary text-sm">{formatCurrency(metrics.thisMonthNetCash, currencySymbol)}</span>
                           </div>
                           <div className="w-full h-px bg-theme-border-soft/60" />
                           <div className="flex items-center justify-between w-full gap-4">
                             <span className="text-xs text-theme-muted font-medium">Growth</span>
                             {metrics.revenueGrowthPercent !== null ? (
                               <span className={`text-xs font-bold flex items-center gap-1 ${metrics.revenueGrowthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                 {metrics.revenueGrowthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                 {Math.abs(metrics.revenueGrowthPercent)}%
                               </span>
                             ) : (
                               <span className="text-xs font-bold text-theme-muted">—</span>
                             )}
                           </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-theme-border-soft/60 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="luxury-glass-subcard p-3 rounded-2xl border border-theme-border-soft">
                          <span className="text-[10px] uppercase font-bold text-theme-muted block">Today's Inflow</span>
                          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 bq-financial-number">
                            <AnimatedNumber value={formatCurrency(metrics.todaysCollected, currencySymbol)} />
                          </span>
                        </div>
                        <div className="luxury-glass-subcard p-3 rounded-2xl border border-theme-border-soft">
                          <span className="text-[10px] uppercase font-bold text-theme-muted block">Today's Outflow</span>
                          <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 bq-financial-number">
                            <AnimatedNumber value={formatCurrency(metrics.todaysExpenses, currencySymbol)} />
                          </span>
                        </div>
                        <div className="luxury-glass-subcard p-3 rounded-2xl border border-theme-border-soft col-span-2 sm:col-span-1">
                          <span className="text-[10px] uppercase font-bold text-theme-muted block">Collection Realized</span>
                          <span className="text-sm sm:text-base font-bold text-theme-primary bq-financial-number">
                            {metrics.collectionRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SUPPORTING PULSE SURFACES (5 Columns on Desktop) */}
                    <div className="lg:col-span-5 flex flex-col gap-3">
                      
                      {/* Collected Revenue Card */}
                      <SignatureSurface variant="success" className="p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <FinancialValue
                            label="Total Collected"
                            value={metrics.totalCollected}
                            currency={currencySymbol}
                            intent="collection"
                            size="md"
                          />
                          <span className="text-[10px] text-theme-muted mt-0.5 block">
                            {metrics.totalPaymentsCount} confirmed payments received
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {metrics.collectionRate}% Settled
                          </span>
                        </div>
                      </SignatureSurface>

                      {/* Outstanding Dues Summary Card */}
                      <SignatureSurface variant="warning" className="p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <FinancialValue
                            label="Still to Collect"
                            value={metrics.totalOutstanding}
                            currency={currencySymbol}
                            intent="balanceDue"
                            size="md"
                          />
                          <span className="text-[10px] text-theme-muted mt-0.5 block">
                            {metrics.overdueCount > 0 ? `${metrics.overdueCount} overdue bills requiring action` : 'All invoices within payment terms'}
                          </span>
                        </div>
                        <div className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onOpenCollection}
                            className="!text-xs"
                          >
                            Collect →
                          </Button>
                        </div>
                      </SignatureSurface>

                      {/* Operating Treasury Balance */}
                      <SignatureSurface variant="financial" className="p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <FinancialValue
                            label="Operating Capital"
                            value={businessAvailableMoney}
                            currency={currencySymbol}
                            intent="money"
                            size="md"
                          />
                          <span className="text-[10px] text-theme-muted mt-0.5 block">
                            Liquid operating funds
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Wallet className="w-5 h-5" />
                        </div>
                      </SignatureSurface>

                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* Business Money Overview */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-theme-accent" />
                          Business Money Overview
                        </h2>
                        <p className="text-xs text-theme-muted">
                          Available Business Money: Clean Business & Personal Separation.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={onOpenCollection}>
                        Collection Center
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="luxury-glass-subcard p-4 rounded-2xl border border-theme-border-soft">
                        <span className="text-2xs font-bold text-theme-muted uppercase tracking-wider block mb-1">
                          Business Money Inflow
                        </span>
                        <FinancialValue
                          value={bucketFinancials.totalWebsiteRevenue}
                          currency={currencySymbol}
                          intent="collection"
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted mt-1 block">Customer revenue credited</span>
                      </div>

                      <div className="luxury-glass-subcard p-4 rounded-2xl border border-theme-border-soft">
                        <span className="text-2xs font-bold text-theme-muted uppercase tracking-wider block mb-1">
                          Business Expenses Outflow
                        </span>
                        <FinancialValue
                          value={metrics.totalExpenses}
                          currency={currencySymbol}
                          intent="expense"
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted mt-1 block">Operational & supply expenditures</span>
                      </div>

                      <div className="luxury-glass-subcard p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-2xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Available Business Money
                        </span>
                        <FinancialValue
                          value={bucketFinancials.websiteIncomeAvailable}
                          currency={currencySymbol}
                          intent="oldDue"
                          size="md"
                          className="font-black text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block">Operating balance</span>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* LEVEL 4: REVENUE & COLLECTION INTELLIGENCE */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-theme-accent" />
                          Revenue & Collection Trend
                        </h2>
                        <p className="text-xs text-theme-muted">
                          Sales realization & collection velocity across your business.
                        </p>
                      </div>

                      {/* Timeframe Selector Tabs */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-xs font-bold self-start sm:self-auto">
                        {['7d', '30d', 'this_month', 'prev_month', 'this_year'].map(tf => (
                          <button
                            key={tf}
                            onClick={() => setChartTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              chartTimeframe === tf
                                ? 'bg-theme-accent text-white shadow-sm'
                                : 'text-theme-muted hover:text-theme-primary'
                            }`}
                          >
                            {tf === '7d' ? '7D' : tf === '30d' ? '30D' : tf === 'this_month' ? 'Month' : tf === 'prev_month' ? 'Prev' : 'Year'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-[260px] sm:h-[300px] w-full pt-2 relative group">
                      {/* Abstract background for the chart */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-700 pointer-events-none z-0">
                         <BarChart3 style={{ width: '240px', height: '240px' }} />
                      </div>
                      <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-theme-surface-elevated to-transparent opacity-30 pointer-events-none z-0" />
                      <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                        <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" opacity={0.5} vertical={false} />
                          <XAxis 
                            dataKey="label" 
                            stroke="var(--text-muted)" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="var(--text-muted)" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(v) => formatCurrency(v, currencySymbol, false)}
                          />
                          <Tooltip content={<PremiumChartTooltip currencySymbol={currencySymbol} />} />
                          <Area 
                            type="monotone" 
                            dataKey="invoiced" 
                            name="Invoiced" 
                            stroke="var(--accent)" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#invoicedGradient)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="collected" 
                            name="Collected" 
                            stroke="#10B981" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#collectedGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Summary Realization Badges */}
                    <div className="pt-3 border-t border-theme-border-soft/60 flex items-center justify-between flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-bold text-theme-primary">
                          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent" />
                          Invoiced: {formatCurrency(heroKPIs.invoiced, currencySymbol)}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Collected: {formatCurrency(heroKPIs.collected, currencySymbol)}
                        </span>
                      </div>
                      <span className="text-theme-muted font-bold">
                        Period Realization: <span className="text-emerald-600 dark:text-emerald-400">{heroKPIs.collectionRate}%</span>
                      </span>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* LEVEL 5: MONEY STILL TO COLLECT */}
                  {/* ========================================================================= */}
                  <SignatureSurface variant="financial" className="p-5 sm:p-6 rounded-3xl border border-emerald-500/25 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Money Still to Collect
                        </h2>
                        <p className="text-xs text-theme-muted">
                          Old Due + Current Bill = Total Payable liability relationship.
                        </p>
                      </div>
                      <Button variant="financial" size="sm" onClick={onOpenCollection}>
                        Open Collection Center →
                      </Button>
                    </div>

                    {/* Canonical Financial Equation Primitive */}
                    <FinancialEquation
                      oldDue={metrics.previousDueTotal}
                      currentBill={metrics.totalRevenue}
                      paid={metrics.totalCollected}
                      balanceDue={metrics.totalOutstanding}
                      currency={currencySymbol}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="luxury-glass-subcard p-3 rounded-2xl border border-theme-border-soft flex items-center justify-between">
                        <span className="text-theme-muted font-medium">Earlier Due Recovered:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bq-financial-number">
                          {formatCurrency(heroKPIs.prevDueCollected, currencySymbol)}
                        </span>
                      </div>
                      <div className="luxury-glass-subcard p-3 rounded-2xl border border-theme-border-soft flex items-center justify-between">
                        <span className="text-theme-muted font-medium">This Bill Collected:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bq-financial-number">
                          {formatCurrency(heroKPIs.currentBillCollected, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </SignatureSurface>

                  {/* ========================================================================= */}
                  {/* LEVEL 6: ACTION REQUIRED */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary">
                          Needs Your Attention
                        </h2>
                      </div>
                      <span className="text-2xs font-bold text-theme-muted uppercase tracking-wider">
                        Real-time Priority Feed
                      </span>
                    </div>

                    {metrics.overdueCount === 0 && metrics.partialInvoicesCount === 0 && pendingPaymentsCount === 0 && customerAnalytics.withDueCount === 0 ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">All caught up!</p>
                          <p className="text-2xs text-theme-muted">No overdue bills, partial payments, or pending approvals requiring immediate action.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {metrics.overdueCount > 0 && (
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('invoices')}
                            className="luxury-glass-subcard p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all shadow-premium-sm hover:shadow-premium-md"
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                                  {metrics.overdueCount} Overdue Bills
                                </span>
                                <span className="text-2xs text-theme-muted">
                                  {formatCurrency(metrics.overdueAmount, currencySymbol)} total overdue
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="!text-xs">Review</Button>
                          </motion.div>
                        )}

                        {metrics.partialInvoicesCount > 0 && (
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('invoices')}
                            className="luxury-glass-subcard p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all shadow-premium-sm hover:shadow-premium-md"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                                  {metrics.partialInvoicesCount} Partial Invoices
                                </span>
                                <span className="text-2xs text-theme-muted">
                                  Awaiting full balance clearance
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="!text-xs">Inspect</Button>
                          </motion.div>
                        )}

                        {pendingPaymentsCount > 0 && (
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onOpenCollection}
                            className="luxury-glass-subcard p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between cursor-pointer hover:bg-sky-500/15 transition-all shadow-premium-sm hover:shadow-premium-md"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 block">
                                  {pendingPaymentsCount} Live Link Payments
                                </span>
                                <span className="text-2xs text-theme-muted">
                                  Customer submitted payment proofs awaiting approval
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="!text-xs">Approve</Button>
                          </motion.div>
                        )}

                        {customerAnalytics.withDueCount > 0 && (
                          <div 
                            onClick={() => setCurrentTab('customers')}
                            className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft flex items-center justify-between cursor-pointer hover:border-theme-accent/40 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-theme-accent shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-theme-primary block">
                                  {customerAnalytics.withDueCount} Customers with Balance Due
                                </span>
                                <span className="text-2xs text-theme-muted">
                                  Track customer ledger & follow up
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="!text-xs">View Ledger</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* Sales & Invoice Intelligence */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-theme-accent" />
                          Sales & Invoice Intelligence
                        </h2>
                        <p className="text-xs text-theme-muted">Invoice status distribution and settlement breakdown.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentTab('invoices')}>
                        Recent Invoices →
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-theme-muted uppercase">Paid</span>
                          <StatusBadge status="paid" size="sm" showIcon={false} />
                        </div>
                        <span className="text-xl font-bold bq-financial-number text-emerald-600 dark:text-emerald-400">
                          {metrics.paidInvoicesCount}
                        </span>
                        <span className="text-[10px] text-theme-muted block mt-0.5">Fully cleared bills</span>
                      </div>

                      <div className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-theme-muted uppercase">Partial</span>
                          <StatusBadge status="partial" size="sm" showIcon={false} />
                        </div>
                        <span className="text-xl font-bold bq-financial-number text-amber-600 dark:text-amber-400">
                          {metrics.partialInvoicesCount}
                        </span>
                        <span className="text-[10px] text-theme-muted block mt-0.5">Partially paid bills</span>
                      </div>

                      <div className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-theme-muted uppercase">Unpaid</span>
                          <StatusBadge status="unpaid" size="sm" showIcon={false} />
                        </div>
                        <span className="text-xl font-bold bq-financial-number text-rose-600 dark:text-rose-400">
                          {metrics.unpaidInvoicesCount}
                        </span>
                        <span className="text-[10px] text-theme-muted block mt-0.5">Zero payment recorded</span>
                      </div>

                      <div className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-theme-muted uppercase">Avg Bill</span>
                          <span className="text-[10px] text-theme-muted font-bold">Ticket</span>
                        </div>
                        <span className="text-xl font-bold bq-financial-number text-theme-primary">
                          {formatCurrency(customerAnalytics.avgInvoiceValue, currencySymbol)}
                        </span>
                        <span className="text-[10px] text-theme-muted block mt-0.5">Per invoice average</span>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* Expense & Cash Flow */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          Expense & Cash Flow
                        </h2>
                        <p className="text-xs text-theme-muted">Business expenditure categories and monthly net margin.</p>
                      </div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bq-financial-number">
                        Total Expenses: {formatCurrency(metrics.totalExpenses, currencySymbol)}
                      </span>
                    </div>

                    {metrics.expenseCategories.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {metrics.expenseCategories.slice(0, 4).map(cat => (
                          <div key={cat.name} className="luxury-glass-subcard p-3.5 rounded-2xl border border-theme-border-soft">
                            <span className="text-2xs font-bold text-theme-muted uppercase block truncate">{cat.name}</span>
                            <span className="text-base font-bold text-theme-primary bq-financial-number mt-1 block">
                              {formatCurrency(cat.amount, currencySymbol)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="luxury-glass-subcard p-4 rounded-2xl border border-theme-border-soft text-center text-xs text-theme-muted">
                        No expenses logged for this workspace yet.
                      </div>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* Customer Intelligence */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <Users className="w-4 h-4 text-theme-accent" />
                          Customer Intelligence
                        </h2>
                        <p className="text-xs text-theme-muted">Top debtors requiring follow-up and top revenue accounts.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentTab('customers')}>
                        All Customers →
                      </Button>
                    </div>

                    {customerAnalytics.topDebtors.length > 0 ? (
                      <div className="divide-y divide-theme-border-soft/60">
                        {customerAnalytics.topDebtors.slice(0, 4).map(c => (
                          <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-theme-primary block truncate">{c.name}</span>
                              <span className="text-2xs text-theme-muted">
                                {c.invoicesCount} {c.invoicesCount === 1 ? 'bill' : 'bills'} • {c.phone || 'No phone recorded'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 bq-financial-number block">
                                  {formatCurrency(c.totalDue, currencySymbol)}
                                </span>
                                <span className="text-[10px] text-theme-muted">Balance Due</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={onOpenCollection}
                                className="!text-xs"
                              >
                                Collect
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="luxury-glass-subcard p-4 rounded-2xl border border-theme-border-soft text-center text-xs text-theme-muted">
                        Zero customer outstanding dues recorded.
                      </div>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* LEVEL 10: PERSONAL MONEY */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          Personal Money & Salary
                        </h2>
                        <p className="text-xs text-theme-muted">
                          Personal accounts maintained strictly separate from official business money.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowDreamCreateModal(true)}>
                          + New Goal
                        </Button>
                        {activeDream && (
                          <Button variant="secondary" size="sm" onClick={() => setShowDreamAddModal(true)}>
                            Add to Dream
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="luxury-glass-subcard p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-amber-700 dark:text-amber-400 uppercase">My Cash</span>
                          <Coins className="w-4 h-4 text-amber-600" />
                        </div>
                        <FinancialValue
                          value={bucketFinancials.myCashBalance}
                          currency={currencySymbol}
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted mt-1 block">Physical personal cash</span>
                      </div>

                      <div className="luxury-glass-subcard p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">PhonePe</span>
                          <Smartphone className="w-4 h-4 text-indigo-600" />
                        </div>
                        <FinancialValue
                          value={bucketFinancials.phonePeBalance}
                          currency={currencySymbol}
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted mt-1 block">Online personal account</span>
                      </div>

                      <div className="luxury-glass-subcard p-4 rounded-2xl bg-pink-500/5 dark:bg-pink-500/10 border border-pink-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-bold text-pink-700 dark:text-pink-400 uppercase">MY DREAM SAVINGS</span>
                          <Target className="w-4 h-4 text-pink-600" />
                        </div>
                        <FinancialValue
                          value={activeDream ? activeDream.savedAmount || 0 : 0}
                          currency={currencySymbol}
                          size="md"
                        />
                        <span className="text-[10px] text-theme-muted mt-1 block">
                          {activeDream ? activeDream.dreamName || activeDream.name : 'My Dream Goal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* Recent Financial Activity */}
                  {/* ========================================================================= */}
                  <div className="luxury-glass-card p-5 sm:p-6 rounded-3xl border border-theme-border-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft/60">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold bq-font-display text-theme-primary flex items-center gap-2">
                          <Activity className="w-4 h-4 text-theme-accent" />
                          Recent Financial Activity
                        </h2>
                        <p className="text-xs text-theme-muted">Latest verified invoices, payments, and settlements.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentTab('invoices')}>
                        Recent Invoices →
                      </Button>
                    </div>

                    <div className="divide-y divide-theme-border-soft/60">
                      {recentInvoicesList.map(inv => {
                        const paid = getInvoicePaidTotal(inv);
                        const due = getInvoiceBalanceDue(inv);
                        const status = getInvoicePaymentStatus(inv);

                        return (
                          <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-center text-theme-accent shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-theme-primary block truncate">
                                  {inv.customerName || inv.customer?.name || 'Walk-in Customer'}
                                </span>
                                <span className="text-2xs text-theme-muted">
                                  {inv.invoiceNumber || inv.number || 'Invoice'} • {getLocalCalendarDate(inv.date || inv.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-bold text-theme-primary bq-financial-number block">
                                  {formatCurrency(inv.grandTotal || inv.total || 0, currencySymbol)}
                                </span>
                                <span className="text-[10px] text-theme-muted">
                                  {due > 0 ? `Due: ${formatCurrency(due, currencySymbol)}` : 'Cleared'}
                                </span>
                              </div>
                              <StatusBadge status={status} size="sm" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

        {/* CUSTOMER CREATION SHEET */}
        {showAddCustomerSheet && (
          <AddCustomerSheet
            isOpen={showAddCustomerSheet}
            onClose={() => setShowAddCustomerSheet(false)}
            onSave={onSaveCustomer}
            currencySymbol={currencySymbol}
          />
        )}

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
