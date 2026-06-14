import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-hot-toast';
import StatCard from '../components/StatCard';
import {
  Plus, Search, TrendingUp, DollarSign, Hourglass, Users, FileSpreadsheet,
  ReceiptText, LayoutDashboard, ArrowRight, Send, MessageSquare, AlertCircle,
  CheckCircle2, Activity, Shield, HardDrive, FileDown, Download, Clock,
  Sparkles, FileText, PieChart as PieChartIcon, Rocket, Check, Megaphone,
  Zap, Smartphone, Bell, CreditCard, ShoppingBag, FolderHeart
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../services/dbEngine';
import { t } from '../utils/i18n';

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
  subscription = {},
  onQuickBillOpen,
  pendingPaymentsCount = 0,
  syncStatus = 'Synced',
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currencySymbol = businessSettings?.currency || '₹';
  const businessName = businessSettings?.businessName || 'My Business';
  
  const activeWorkspace = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId) || businessSettings;
  const businessType = activeWorkspace?.businessType || businessSettings?.businessType;
  const enabledModules = activeWorkspace?.enabledModules || [];

  const isEmbroidery = businessType === 'Embroidery / Designer' || businessType === 'Tailor / Fashion' || businessType === 'Embroidery';

  // --- STATS CALCULATIONS ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const totalCustomersCount = customers.length;
  const totalInvoicesCount = invoices.length;

  // --- TODAY'S SUMMARY ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysInvoices = invoices.filter(inv => inv.date === todayStr);
  const todayBills = todaysInvoices.length;
  const todayRevenue = todaysInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const todayCollection = todaysInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const todayDue = todaysInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const recentInvoices = invoices.slice(-5).reverse();

  // --- 6-MONTH CHART DATA ---
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        revenue: 0,
        expenses: 0
      });
    }

    invoices.forEach(inv => {
      if (!inv.date) return;
      const invMonthKey = inv.date.substring(0, 7);
      const match = months.find(m => m.key === invMonthKey);
      if (match) {
        match.revenue += (inv.grandTotal || 0);
      }
    });

    expenses.forEach(exp => {
      if (!exp.date) return;
      const expMonthKey = exp.date.substring(0, 7);
      const match = months.find(m => m.key === expMonthKey);
      if (match) {
        match.expenses += parseFloat(exp.amount || 0);
      }
    });

    return months;
  };
  const monthlyData = getMonthlyData();

  // --- DYNAMIC LABELS ---
  const getLabels = () => {
    const type = businessType;
    if (type === 'Doctor / Clinic' || type === 'Doctor') return { clients: 'Patients', invoices: 'Bills', items: 'Services', due: 'Pending Balance', orders: 'Appointments', create: 'Create Bill' };
    if (type === 'Teacher / Tuition' || type === 'Teacher') return { clients: 'Students', invoices: 'Fee Receipts', items: 'Courses', due: 'Due Fees', orders: 'Reports', create: 'Collect Fee' };
    if (type === 'Tailor / Fashion' || type === 'Embroidery / Designer' || type === 'Embroidery') return { clients: 'Customers', invoices: 'Orders', items: 'Design Book', due: 'Due Payment', orders: 'Delivery', create: 'Add Order' };
    if (type === 'Retail' || type === 'Retail / Shop') return { clients: 'Customers', invoices: 'Sales', items: 'Inventory', due: 'Pending Due', orders: 'Products', create: 'Create Invoice' };
    if (type === 'Service' || type === 'Service / Repair') return { clients: 'Clients', invoices: 'Jobs', items: 'Devices', due: 'Pending Due', orders: 'Delivery', create: 'Create Job' };
    return { clients: 'Customers', invoices: 'Invoices', items: 'Products/Services', due: 'Pending Due', orders: 'Reports', create: 'Create Invoice' };
  };
  const labels = getLabels();

  // --- TOP CUSTOMERS ---
  const getTopCustomers = () => {
    const customerTotals = {};
    invoices.forEach(inv => {
      const name = inv.customerName || 'Unknown';
      customerTotals[name] = (customerTotals[name] || 0) + (parseFloat(inv.grandTotal) || 0);
    });

    return Object.keys(customerTotals)
      .map(name => ({ name, value: customerTotals[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  const topCustomersData = getTopCustomers();
  const PIE_COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  // --- BEST SELLING ITEMS ---
  const getBestSellingItems = () => {
    const itemTotals = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const name = item.description || item.productName || item.serviceName || item.itemService || 'Unknown Item';
        const qty = parseFloat(item.qty) || 1;
        itemTotals[name] = (itemTotals[name] || 0) + qty;
      });
    });

    return Object.keys(itemTotals)
      .map(name => ({ name, qty: itemTotals[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };
  const bestSellingItems = getBestSellingItems();

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  const hasBilling = !enabledModules.length || enabledModules.includes('billing');
  const hasCustomers = !enabledModules.length || enabledModules.some(m => ['customers','patients','students','clients'].includes(m));
  const hasProducts = !enabledModules.length || enabledModules.includes('products');
  const hasPayments = !enabledModules.length || enabledModules.includes('paymentProofs');

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="pb-32 md:pb-12 w-full">
        <div className="max-w-[1600px] w-full mx-auto space-y-6">
          
          {/* PAYMENT ALERTS */}
          {pendingPaymentsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setCurrentTab('pending-payments')}
              className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 flex items-center justify-between shadow-premium cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-theme-warning text-white flex items-center justify-center animate-pulse shadow-premium shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-theme-warning font-bold text-sm">Review Required</h3>
                  <p className="text-theme-warning/80 text-xs font-semibold">
                    You have <span className="font-black text-theme-warning">{pendingPaymentsCount}</span> pending payment proofs to verify.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-theme-warning shrink-0" />
            </motion.div>
          )}

          {/* 1. HERO SUMMARY CARD */}
          <div className="bg-[image:var(--accent-gradient)] rounded-3xl p-6 md:p-8 shadow-premium text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight">{businessName}</h1>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/10">
                    {businessSettings?.activeWorkspaceName || 'Main Workspace'}
                  </span>
                </div>
                <p className="text-sm md:text-base font-semibold text-white/90 max-w-xl">
                  {t('welcome')}, {businessSettings?.ownerName || 'Admin'}. Here is your dashboard overview.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  {hasBilling && (
                    <button onClick={() => setCurrentTab('create')} className="bg-white text-theme-accent hover:bg-theme-surface transition-colors font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                      <Plus className="w-4 h-4" /> {labels.create}
                    </button>
                  )}
                  {hasPayments && (
                    <button onClick={() => setCurrentTab('pending-payments')} className="bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/20 text-white transition-colors font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Collect Payment
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:gap-6 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar w-full lg:w-auto shrink-0">
                <div className="shrink-0">
                  <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">{isEmbroidery ? 'Orders' : "Today's Revenue"}</p>
                  {isLoading ? (
                    <div className="w-20 h-8 bg-white/20 animate-pulse rounded-lg mt-1"></div>
                  ) : (
                    <p className="text-xl md:text-2xl font-black">{isEmbroidery ? todayBills : formatCurrency(todayRevenue, currencySymbol)}</p>
                  )}
                </div>
                <div className="w-px h-10 bg-white/20 shrink-0"></div>
                <div className="shrink-0">
                  <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">{isEmbroidery ? 'Delivery' : 'Collection'}</p>
                  {isLoading ? (
                    <div className="w-20 h-8 bg-white/20 animate-pulse rounded-lg mt-1"></div>
                  ) : (
                    <p className="text-xl md:text-2xl font-black">{formatCurrency(todayCollection, currencySymbol)}</p>
                  )}
                </div>
                <div className="w-px h-10 bg-white/20 shrink-0"></div>
                <div className="shrink-0">
                  <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">{isEmbroidery ? 'Due' : 'Pending Due'}</p>
                  {isLoading ? (
                    <div className="w-20 h-8 bg-white/20 animate-pulse rounded-lg mt-1"></div>
                  ) : (
                    <p className="text-xl md:text-2xl font-black text-amber-300">{formatCurrency(todayDue, currencySymbol)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN LAYOUT GRID (12 Cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT 8 COLS */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Quick Actions (Mobile 2x2, Desktop 4x1) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {hasBilling && (
                  <button onClick={() => setCurrentTab('create')} className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-theme-accent to-theme-accent-dark text-white rounded-2xl shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold text-center">{labels.create}</span>
                  </button>
                )}
                {hasCustomers && (
                  <button onClick={() => setCurrentTab('customers')} className="flex flex-col items-center justify-center p-4 bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all group">
                    <Users className="w-6 h-6 mb-2 text-theme-primary group-hover:text-theme-accent transition-colors" />
                    <span className="text-xs font-bold text-theme-primary text-center">Add {labels.clients}</span>
                  </button>
                )}
                {hasProducts && (
                  <button onClick={() => setCurrentTab('products')} className="flex flex-col items-center justify-center p-4 bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all group">
                    <ShoppingBag className="w-6 h-6 mb-2 text-theme-primary group-hover:text-theme-accent transition-colors" />
                    <span className="text-xs font-bold text-theme-primary text-center">Add {labels.items}</span>
                  </button>
                )}
                {hasPayments && (
                  <button onClick={() => setCurrentTab('pending-payments')} className="flex flex-col items-center justify-center p-4 bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all group">
                    <CheckCircle2 className="w-6 h-6 mb-2 text-theme-primary group-hover:text-theme-accent transition-colors" />
                    <span className="text-xs font-bold text-theme-primary text-center">Collect Payment</span>
                  </button>
                )}
              </div>

              {/* KPI Cards (4 cards) */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft animate-pulse flex flex-col justify-between h-[110px]">
                      <div className="w-8 h-8 bg-theme-surface rounded-lg mb-2"></div>
                      <div>
                        <div className="w-16 h-3 bg-theme-surface rounded-md mb-2"></div>
                        <div className="w-24 h-6 bg-theme-surface rounded-md"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <StatCard title="Revenue" value={formatCurrency(totalRevenue, currencySymbol)} icon={TrendingUp} trend="+12%" accentColor="bg-theme-success/10 text-theme-success" />
                    <StatCard title="Collection" value={formatCurrency(totalPaid, currencySymbol)} icon={CheckCircle2} trend="Good" accentColor="bg-theme-accent/10 text-theme-accent" />
                    <StatCard title={labels.due} value={formatCurrency(totalDue, currencySymbol)} icon={AlertCircle} trend="Action Needed" trendUp={false} accentColor="bg-theme-danger/10 text-theme-danger" />
                    <StatCard title={`Total ${labels.clients}`} value={totalCustomersCount} icon={Users} trend="Active" accentColor="bg-blue-500/10 text-blue-500" />
                  </>
                )}
              </div>

              {/* Chart (Hidden Mobile) */}
              <div className="hidden md:flex flex-col bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                    <Activity className="w-4 h-4 text-theme-accent" /> Revenue & Expenses
                  </h3>
                </div>
                <div className="flex-1 w-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-theme-muted" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="text-theme-muted" tickFormatter={(val) => `${val >= 1000 ? val/1000+'k' : val}`} />
                      <Tooltip
                        cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value) => [formatCurrency(value, currencySymbol), '']}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RIGHT 4 COLS */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Insight Panel */}
              <div className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
                <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-theme-accent" /> Quick Insights
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-theme-primary">Cloud Sync</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${syncStatus === 'Synced' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{syncStatus}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                        <FolderHeart className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-theme-primary">Total {labels.invoices}</span>
                    </div>
                    <span className="text-xs font-black text-theme-primary">{totalInvoicesCount}</span>
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-theme-accent" /> Recent {labels.invoices}
                  </h3>
                  <button onClick={() => setCurrentTab('invoices')} className="text-[10px] font-black text-theme-accent hover:text-theme-primary transition-colors uppercase">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`skel-inv-${i}`} className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-theme-surface"></div>
                          <div>
                            <div className="w-24 h-4 bg-theme-surface rounded-md mb-1.5"></div>
                            <div className="w-16 h-3 bg-theme-surface rounded-md"></div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="w-16 h-4 bg-theme-surface rounded-md mb-1.5"></div>
                          <div className="w-12 h-3 bg-theme-surface rounded-md"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {recentInvoices.map((inv) => (
                        <div key={inv.id} className="group flex items-center justify-between p-3 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-all cursor-pointer" onClick={() => { onEditInvoice(inv); setCurrentTab('create'); }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-theme-card group-hover:bg-theme-surface flex items-center justify-center transition-colors shadow-sm">
                              <FileText className="w-4 h-4 text-theme-accent" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-theme-primary mb-0.5 line-clamp-1">{inv.customerName}</p>
                              <p className="text-[10px] font-bold text-theme-muted">{inv.invoiceNumber} • {inv.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-theme-primary mb-1">{formatCurrency(inv.grandTotal, currencySymbol)}</p>
                            <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${inv.paymentStatus === 'Paid' ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-danger/10 text-theme-danger'}`}> {inv.paymentStatus || 'Pending'} </span>
                          </div>
                        </div>
                      ))}
                      {recentInvoices.length === 0 && (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-theme-app rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-theme-muted" />
                          </div>
                          <p className="text-xs font-bold text-theme-primary mb-1">No {labels.invoices.toLowerCase()} yet</p>
                          <p className="text-[10px] text-theme-muted mb-3">Create your first {labels.invoices.toLowerCase()} to start tracking.</p>
                          <button onClick={() => setCurrentTab('create')} className="text-[10px] font-bold bg-theme-accent/10 text-theme-accent px-3 py-1.5 rounded-lg hover:bg-theme-accent hover:text-white transition-colors">
                            Create {labels.invoices}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* BOTTOM SECTION (Desktop 2-Col, Mobile 1-Col) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {/* Top Customers */}
            <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium flex flex-col">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-theme-accent" /> Top {labels.clients}
              </h3>
              <div className="flex-1 w-full min-h-[220px]">
                {isLoading ? (
                  <div className="w-48 h-48 rounded-full border-8 border-theme-surface border-t-theme-accent/20 animate-spin mx-auto mt-4"></div>
                ) : topCustomersData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topCustomersData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {topCustomersData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value) => [formatCurrency(value, currencySymbol), 'Revenue']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Users className="w-8 h-8 text-theme-muted mb-2 opacity-50" />
                    <p className="text-xs font-bold text-theme-muted">No client data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Best Selling Items */}
            <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-theme-accent" /> Best Selling {labels.items}
              </h3>
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skel-item-${i}`} className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-theme-surface"></div>
                        <div className="w-24 h-4 bg-theme-surface rounded-md"></div>
                      </div>
                      <div className="w-16 h-5 bg-theme-surface rounded-md"></div>
                    </div>
                  ))
                ) : (
                  <>
                    {bestSellingItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center font-black text-xs">
                            #{index + 1}
                          </div>
                          <span className="text-xs font-bold text-theme-primary line-clamp-1">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-black bg-theme-success/10 text-theme-success px-2 py-1 rounded-md">
                            {item.qty} Sold
                          </span>
                        </div>
                      </div>
                    ))}
                    {bestSellingItems.length === 0 && (
                      <div className="text-center py-10 text-theme-muted flex flex-col items-center">
                        <ShoppingBag className="w-8 h-8 text-theme-muted mb-2 opacity-50" />
                        <p className="text-[10px] font-bold">No sales data yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </PullToRefresh>
  );
};

export default Dashboard;
