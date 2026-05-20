import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import InvoiceCard from '../components/InvoiceCard';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Hourglass, 
  Users, 
  FileSpreadsheet, 
  ReceiptText, 
  ArrowRight,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2, 
  Activity, 
  Shield, 
  HardDrive, 
  FileDown, 
  Clock, 
  UserCheck, 
  Sparkles, 
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { isFirebaseEnabled } from '../utils/firebase';

/**
 * High-End SaaS Dashboard with SVG Charts & WhatsApp Reminders
 */
const Dashboard = ({ 
  invoices = [], 
  customers = [], 
  onViewInvoice, 
  onEditInvoice, 
  onDeleteInvoice, 
  onDownloadPDF, 
  setCurrentTab,
  businessSettings 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // --- INTERACTIVE GETTING STARTED CHECKLIST STATE ---
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('billqyro_checklist');
    return saved ? JSON.parse(saved) : {
      profile: false,
      clients: false,
      catalog: false,
      invoice: false,
      expenses: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('billqyro_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleChecklistItem = (id) => {
    setChecklist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const checklistItems = [
    { 
      id: 'profile', 
      label: 'Set Up Business Profile', 
      tab: 'admin-panel', 
      desc: 'Add your shop/company name, address, phone, logo & GST number. This info shows on every invoice PDF.',
      emoji: '🏢',
      tip: 'Go to Settings → Fill in your business details → Click Save',
    },
    { 
      id: 'clients', 
      label: 'Add Your First Customer', 
      tab: 'customers', 
      desc: 'Save customer names, phone numbers & addresses. Next time you make a bill, just select them — no need to type again!',
      emoji: '👥',
      tip: 'Go to Customers → Click + Add → Enter details → Save',
    },
    { 
      id: 'catalog', 
      label: 'Add Products / Services', 
      tab: 'products', 
      desc: 'Add your services (embroidery, punching, repair etc.) with default prices. When creating invoices, just pick from the list!',
      emoji: '🧵',
      tip: 'Go to Products → Click + Add → Enter name & price → Save',
    },
    { 
      id: 'invoice', 
      label: 'Create Your First Invoice', 
      tab: 'create-invoice', 
      desc: 'Select a customer, add items/services, set payment status, and download a professional PDF invoice instantly.',
      emoji: '📄',
      tip: 'Click Create Bill → Select Customer → Add Items → Save & Download PDF',
    },
    { 
      id: 'expenses', 
      label: 'Track Your Expenses', 
      tab: 'expenses', 
      desc: 'Record your daily expenses like thread, needles, electricity bills. See total profit = revenue minus expenses.',
      emoji: '💰',
      tip: 'Go to Expenses → Click + Add → Enter amount & category → Save',
    },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  
  const currencySymbol = businessSettings?.currency || '₹';
  const businessName = businessSettings?.businessName || 'BillQyro Embroidery';

  // --- STATS CALCULATIONS (Accurate SaaS Math) ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const totalCustomersCount = customers.length;

  // Filter invoices for local dashboard search
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.paymentStatus && inv.paymentStatus.toLowerCase().includes(q))
    );
  });

  // Recent invoices (Max 3)
  const recentInvoices = invoices.slice(-3).reverse();

  // Outstanding unpaid invoices for WhatsApp reminders
  const unpaidInvoices = invoices.filter(inv => inv.balanceDue > 0);

  // --- 6-MONTH CHART DATA AGGREGATION ---
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    // Get last 6 rolling months (chronological order)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        total: 0
      });
    }

    invoices.forEach(inv => {
      if (!inv.date) return;
      const invMonthKey = inv.date.substring(0, 7); // "YYYY-MM"
      const match = months.find(m => m.key === invMonthKey);
      if (match) {
        match.total += (inv.grandTotal || 0);
      }
    });

    return months;
  };

  const monthlyData = getMonthlyData();
  const maxVal = Math.max(...monthlyData.map(m => m.total), 5000); // Floor scale of 5000 to keep it professional

  // SVG Chart Layout
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = chartWidth - paddingX * 2;
  const graphHeight = chartHeight - paddingY * 2;
  const barWidth = 40;
  const gap = (graphWidth - barWidth * 6) / 5;

  // --- WHATSAPP REMINDER DISPATCHER ---
  const sendWhatsAppReminder = (invoice) => {
    const phone = invoice.customerPhone || '';
    if (!phone) {
      alert('This customer does not have a saved phone number. Please edit their details in the CRM.');
      return;
    }

    const msg = `Hello *${invoice.customerName}*,\n\nThis is a friendly payment reminder from *${businessName}* regarding Invoice *${invoice.invoiceNumber}* (issued on ${invoice.date}).\n\n* Invoice Total: ${currencySymbol}${invoice.grandTotal.toFixed(2)}\n* Amount Paid: ${currencySymbol}${invoice.amountPaid.toFixed(2)}\n* Outstanding Balance: *${currencySymbol}${invoice.balanceDue.toFixed(2)}*\n* Payment Due Date: *${invoice.dueDate || 'N/A'}*\n\nPlease complete payment at your earliest convenience. Thank you for your business!\n\nBest regards,\n${businessName}`;

    // Clean phone number of spaces or symbols
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 0. WELCOME HERO BANNER */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-premium border border-slate-800/80">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Authenticated</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{businessName}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Your professional invoicing workspace is loaded and ready. Let's make billing seamless today!
            </p>
          </div>
          
          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs px-5 py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer w-fit shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill</span>
          </button>
        </div>
      </div>

      {/* 0.1 ONBOARDING CHECKLIST & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Onboarding Checklist (Col Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                <span>📖 How to Use BillQyro — Step by Step</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                FOLLOW THESE 5 SIMPLE STEPS TO SET UP YOUR BILLING SYSTEM
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 py-1 px-2.5 rounded-full">
                {progressPercent}% Complete
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Visual Guide Cards */}
          <div className="space-y-3">
            {checklistItems.map((item, index) => {
              const isChecked = checklist[item.id];
              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isChecked 
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-500/10' 
                      : 'bg-white dark:bg-slate-950/40 border-slate-100/80 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex gap-3.5">
                    {/* Left: Emoji + Step Number */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                        isChecked 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                          : 'bg-indigo-50 dark:bg-indigo-950/50'
                      }`}>
                        {isChecked ? '✅' : item.emoji}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        isChecked ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        Step {index + 1}
                      </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs font-extrabold leading-snug ${
                          isChecked ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {item.label}
                        </h4>
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleChecklistItem(item.id)}
                          type="button"
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 cursor-pointer ${
                            isChecked 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent hover:border-indigo-500'
                          }`}
                          title={isChecked ? "Mark incomplete" : "Mark complete"}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {item.desc}
                      </p>

                      {/* How-to Tip */}
                      {!isChecked && (
                        <div className="flex items-start gap-2 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl px-3 py-2 border border-indigo-100/50 dark:border-indigo-800/30">
                          <span className="text-indigo-500 text-sm shrink-0 mt-0.5">💡</span>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
                            {item.tip}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      {!isChecked && (
                        <button
                          onClick={() => setCurrentTab(item.tab)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:shadow w-fit"
                        >
                          <span>Open & Configure</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time System Services Status (Col Span 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium flex flex-col justify-between space-y-5">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-emerald-500" />
              <span>Workspace Services Status</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              REAL-TIME STATUS METER
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            
            {/* Firebase Status Card */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Firebase Database</span>
              </div>
              {(() => {
                if (!isFirebaseEnabled) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
                      <span>Firebase Not Configured</span>
                    </span>
                  );
                }
                if (!navigator.onLine) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-[9px] font-black uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>Offline Mode (Local Backup Active)</span>
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Firebase Connected</span>
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <ReceiptText className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Invoice System</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ready</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileDown className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">PDF Generator</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Offline Storage</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Enabled</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Security Shield</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Secure</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">CRM Records</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Order Tracking</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live</span>
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalRevenue, currencySymbol)}
          icon={DollarSign}
          trend="+12.4% MoM"
          trendUp={true}
          accentColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalPaid, currencySymbol)}
          icon={TrendingUp}
          trend="+15.8% MoM"
          trendUp={true}
          accentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(totalDue, currencySymbol)}
          icon={Hourglass}
          trend="-8.2% outstanding"
          trendUp={false}
          accentColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          title="Active Clients"
          value={totalCustomersCount}
          icon={Users}
          trend="In SaaS CRM"
          trendUp={true}
          accentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
      </div>

      {/* 2. ANALYTICS & QUICK LAUNCH ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Custom Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Revenue Analytics</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ROLLING 6 MONTH HISTORY</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Billing</span>
            </div>
          </div>

          {/* Pure SVG Graph */}
          <div className="relative">
            {invoices.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-4 rounded-3xl text-center z-10">
                <TrendingUp className="w-10 h-10 text-indigo-500 mb-2 animate-bounce" />
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Revenue will appear after invoices are created</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">NO REVENUE DATA FOUND</p>
              </div>
            )}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
              </defs>              {/* Gridlines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3" />
              <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={chartWidth - paddingX} y2={paddingY + graphHeight / 2} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
 
              {/* Y Axis Reference Labels */}
              <text x={paddingX - 8} y={paddingY + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500">{formatCurrency(maxVal, currencySymbol)}</text>
              <text x={paddingX - 8} y={paddingY + graphHeight / 2 + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500">{formatCurrency(maxVal / 2, currencySymbol)}</text>
              <text x={paddingX - 8} y={chartHeight - paddingY + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500">{currencySymbol}0</text>

              {/* Bars rendering */}
              {monthlyData.map((m, i) => {
                const barHeight = (m.total / maxVal) * graphHeight;
                const x = paddingX + i * (barWidth + gap) + gap / 2;
                const y = chartHeight - paddingY - barHeight;

                return (
                  <g 
                    key={m.key} 
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover Glow Behind */}
                    {hoveredBarIndex === i && (
                      <rect
                        x={x - 6}
                        y={paddingY - 5}
                        width={barWidth + 12}
                        height={graphHeight + 10}
                        rx="12"
                        className="transition-all duration-200 fill-slate-50 dark:fill-slate-800/40"
                      />
                    )}

                    {/* Main Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 4)} // minimum height of 4px for visibility
                      fill="url(#barGradient)"
                      rx="6"
                      className="transition-all duration-300 hover:opacity-90"
                    />

                    {/* Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - paddingY + 16}
                      textAnchor="middle"
                      className={`text-[10px] font-bold transition-colors duration-200 ${
                        hoveredBarIndex === i ? 'fill-indigo-600 dark:fill-indigo-400 font-extrabold' : 'fill-slate-400 dark:fill-slate-550'
                      }`}
                    >
                      {m.label}
                    </text>

                    {/* Value Popover Label on Hover */}
                    {hoveredBarIndex === i && (
                      <g>
                        <rect
                          x={x + barWidth / 2 - 50}
                          y={y - 28}
                          width="100"
                          height="20"
                          fill="#1e293b"
                          rx="6"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 15}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="text-[9px] font-black"
                        >
                          {formatCurrency(m.total, currencySymbol)}
                        </text>
                        {/* Downward triangle arrow */}
                        <polygon
                          points={`${x + barWidth / 2 - 4},${y - 8} ${x + barWidth / 2 + 4},${y - 8} ${x + barWidth / 2},${y - 4}`}
                          fill="#1e293b"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Speed Invoicing Call-To-Action Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-premium flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full w-fit">
              Embroidery Billing OS
            </span>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight mt-1 leading-snug">
              Instant Thread & Stitch Invoicing
            </h2>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
              Auto-generate sequential SO design numbers, compile multi-composite rates with smart adders, and download premium PDF invoice sheets.
            </p>
          </div>
          
          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xs px-5 py-4 rounded-2xl shadow-lg shadow-indigo-500/10 hover:from-indigo-600 hover:to-blue-600 transition-all w-full hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* 3. DUES AND RECENT RECORDS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Double-width: Unpaid WhatsApp Reminders Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>Pending Balance Reminders</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                AUTO-PREFILLED WHATSAPP DUELISTS
              </p>
            </div>
            
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 py-1 px-2.5 rounded-full">
              {unpaidInvoices.length} unpaid total
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-3.5 max-h-[300px] overflow-y-auto no-scrollbar">
            {unpaidInvoices.map((inv) => (
              <div 
                key={inv.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</span>
                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded uppercase">
                      Due: {inv.dueDate || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    Client: <span className="text-slate-800 dark:text-slate-350 font-extrabold">{inv.customerName}</span> • Phone: {inv.customerPhone || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Outstanding Balance</span>
                    <span className="text-xs font-black text-rose-500 mt-1 block">
                      {formatCurrency(inv.balanceDue, currencySymbol)}
                    </span>
                  </div>

                  <button
                    onClick={() => sendWhatsAppReminder(inv)}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl shadow-sm hover:shadow transition-all shrink-0 uppercase tracking-wider"
                  >
                    <Send className="w-3 h-3" />
                    <span>Remind</span>
                  </button>
                </div>
              </div>
            ))}

            {unpaidInvoices.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Perfect Billing Score!</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  All accounts settled. There are no pending outstanding balances.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Single-width: Recent Invoices & Global Search */}
        <div className="space-y-6">
          
          {/* Recent Invoices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Recent Logs</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LATEST TRANSACTIONS</p>
              </div>
              
              <button
                onClick={() => setCurrentTab('invoices')}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all uppercase tracking-wider"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  currencySymbol={currencySymbol}
                  onView={onViewInvoice}
                  onEdit={onEditInvoice}
                  onDelete={onDeleteInvoice}
                  onDownload={onDownloadPDF}
                />
              ))}

              {recentInvoices.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 text-center shadow-premium">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-350">No invoices yet</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Start by creating your first bill to see recent transactions here!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Global Search Panel */}
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Global Invoices Filter</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FAST SEARCH SYSTEM</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-3.5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Invoice ID, client..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              {searchQuery && (
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pt-2 border-t border-slate-50">
                  {filteredInvoices.map((inv) => (
                    <div 
                      key={inv.id} 
                      onClick={() => onViewInvoice(inv)}
                      className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{inv.invoiceNumber}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{inv.customerName}</p>
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        {formatCurrency(inv.grandTotal, currencySymbol)}
                      </span>
                    </div>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <p className="text-center text-slate-400 font-semibold text-[10px] py-4">
                      No matching records found.
                    </p>
                  )}
                </div>
              )}
              
              {!searchQuery && (
                <div className="text-center py-4 text-slate-400">
                  <ReceiptText className="w-6 h-6 mx-auto text-slate-200 mb-1.5" />
                  <p className="text-[10px] font-bold">Search results show instantly.</p>
                </div>
              )}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
