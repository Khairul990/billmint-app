import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, IndianRupee, CreditCard, TrendingUp, TrendingDown,
  Plus, Search, Filter, Phone, MessageSquare, Mail, MapPin, CheckCircle2,
  Clock, AlertCircle, Trash2, Edit3, Eye, FileText, ChevronRight,
  ExternalLink, ArrowUpRight, ArrowDownLeft, Sliders, ShieldCheck, Download,
  Printer, X, RefreshCw, Landmark, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/invoiceUtils.js';
import {
  getVendors, saveVendor, deleteVendor,
  getOutsourceJobs, saveOutsourceJob, deleteOutsourceJob,
  getOutsourcePayments, recordOutsourcePayment, deleteOutsourcePayment,
  calculateJobFinancials, calculateVendor360, getVendorLedger, calculateOutsourceProfitability
} from '../../services/outsourceEngine.js';
import { bankEngine } from '../../services/bankEngine.js';

const VENDOR_CATEGORIES = [
  'Graphic Designer',
  'UI/UX Designer',
  'Web Developer',
  'Mobile App Developer',
  'Video Editor & Animator',
  'Content Writer & Copywriter',
  'SEO & Digital Marketer',
  'Photographer / Videographer',
  'Tailoring & Embroidery Artisan',
  'Hardware / Repair Technician',
  'Printing & Production Vendor',
  'Voiceover & Audio Engineer',
  'Other Specialist'
];

const JOB_STATUSES = [
  { id: 'Draft', label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  { id: 'Assigned', label: 'Assigned', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'Submitted', label: 'Submitted / Review', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Revision', label: 'Revision', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'Approved', label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Completed', label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Cancelled', label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
];

const OutsourceVendors = ({ invoices = [], currentTab, setCurrentTab }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'vendors', 'jobs', 'payables', 'profit', 'settings'
  const [vendors, setVendors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Modals state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetJob, setPaymentTargetJob] = useState(null);
  const [paymentTargetVendor, setPaymentTargetVendor] = useState(null);

  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedVendorForLedger, setSelectedVendorForLedger] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [vData, jData, pData, bSettings] = await Promise.all([
        getVendors(),
        getOutsourceJobs(),
        getOutsourcePayments(),
        bankEngine.getSettings().catch(() => ({ accounts: ['Cash', 'Bank Account', 'UPI'] }))
      ]);
      setVendors(vData);
      setJobs(jData);
      setPayments(pData);
      setBankAccounts(bSettings?.accounts || ['Cash', 'Main Bank', 'UPI Account']);
    } catch (e) {
      console.error('Error loading Outsource data:', e);
      toast.error('Failed to load Outsource & Vendor records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleUpdate = () => loadAllData();
    window.addEventListener('billqyro_outsource_updated', handleUpdate);
    return () => window.removeEventListener('billqyro_outsource_updated', handleUpdate);
  }, []);

  // Profitability and Totals Calculation
  const profitability = useMemo(() => {
    return calculateOutsourceProfitability(invoices, jobs, payments);
  }, [invoices, jobs, payments]);

  const totalOutstandingPayable = useMemo(() => {
    return vendors.reduce((acc, v) => {
      const v360 = calculateVendor360(v, jobs, payments);
      return acc + v360.payable;
    }, 0);
  }, [vendors, jobs, payments]);

  const activeJobsCount = useMemo(() => {
    return jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length;
  }, [jobs]);

  // Handlers for Vendor Actions
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vendorPayload = {
      id: editingVendor?.id,
      name: formData.get('name')?.trim(),
      phone: formData.get('phone')?.trim(),
      whatsapp: formData.get('whatsapp')?.trim(),
      email: formData.get('email')?.trim(),
      category: formData.get('category'),
      address: formData.get('address')?.trim(),
      paymentPreference: formData.get('paymentPreference'),
      upiId: formData.get('upiId')?.trim(),
      bankDetails: formData.get('bankDetails')?.trim(),
      defaultRate: Number(formData.get('defaultRate')) || 0,
      openingBalance: Number(formData.get('openingBalance')) || 0,
      notes: formData.get('notes')?.trim(),
      isActive: formData.get('isActive') === 'on'
    };

    if (!vendorPayload.name) {
      toast.error('Please enter the vendor / freelancer name.');
      return;
    }

    try {
      await saveVendor(vendorPayload);
      toast.success(editingVendor ? 'Vendor profile updated.' : 'New vendor registered.');
      setVendorModalOpen(false);
      setEditingVendor(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to save vendor: ' + err.message);
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      await deleteVendor(id);
      toast.success('Vendor deleted.');
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete vendor: ' + err.message);
    }
  };

  // Handlers for Outsource Job Actions
  const handleSaveJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const relatedInvoiceId = formData.get('relatedInvoiceId');
    const selectedInvoice = invoices.find(i => i.id === relatedInvoiceId);

    const agreedCost = Number(formData.get('agreedCost')) || 0;
    const advance = Number(formData.get('advance')) || 0;

    const jobPayload = {
      id: editingJob?.id,
      jobCode: editingJob?.jobCode,
      project: formData.get('project')?.trim(),
      description: formData.get('description')?.trim(),
      client: formData.get('client')?.trim() || selectedInvoice?.customerName || '',
      relatedInvoiceId: relatedInvoiceId || null,
      relatedInvoiceNumber: selectedInvoice?.invoiceNumber || '',
      vendorId: formData.get('vendorId'),
      vendorName: vendors.find(v => v.id === formData.get('vendorId'))?.name || '',
      priority: formData.get('priority') || 'Medium',
      startDate: formData.get('startDate') || new Date().toISOString().split('T')[0],
      deadline: formData.get('deadline') || '',
      agreedCost: agreedCost,
      status: formData.get('status') || 'Assigned',
      notes: formData.get('notes')?.trim()
    };

    if (!jobPayload.description && !jobPayload.project) {
      toast.error('Please enter a job title or project description.');
      return;
    }
    if (!jobPayload.vendorId) {
      toast.error('Please select an assigned vendor/freelancer.');
      return;
    }

    try {
      const saved = await saveOutsourceJob(jobPayload);

      // Auto-record advance payment if requested on new job creation
      if (!editingJob && advance > 0) {
        await recordOutsourcePayment({
          jobId: saved.id,
          jobCode: saved.jobCode,
          vendorId: jobPayload.vendorId,
          vendorName: jobPayload.vendorName,
          amount: advance,
          paymentMethod: 'UPI',
          note: 'Initial Advance for ' + saved.jobCode,
          isAdvance: true
        });
      }

      toast.success(editingJob ? 'Outsource job updated.' : 'Outsource job created.');
      setJobModalOpen(false);
      setEditingJob(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to save job: ' + err.message);
    }
  };

  const handleDeleteJob = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete job "${code}"?`)) return;
    try {
      await deleteOutsourceJob(id);
      toast.success('Job deleted.');
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete job: ' + err.message);
    }
  };

  // Handlers for Payment Actions
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = Number(formData.get('amount')) || 0;
    const vendorId = formData.get('vendorId');
    const jobId = formData.get('jobId');

    if (amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (!vendorId) {
      toast.error('Please select a vendor.');
      return;
    }

    const targetVendor = vendors.find(v => v.id === vendorId);
    const targetJob = jobs.find(j => j.id === jobId);

    try {
      await recordOutsourcePayment({
        vendorId,
        vendorName: targetVendor?.name || '',
        jobId: jobId || null,
        jobCode: targetJob?.jobCode || '',
        amount,
        paymentMethod: formData.get('paymentMethod'),
        reference: formData.get('reference')?.trim(),
        bankAccount: formData.get('bankAccount'),
        note: formData.get('note')?.trim(),
        date: formData.get('date') || new Date().toISOString().split('T')[0],
        syncWithBank: true
      });

      toast.success(`Payment of ${formatCurrency(amount)} recorded successfully.`);
      setPaymentModalOpen(false);
      setPaymentTargetJob(null);
      setPaymentTargetVendor(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to record payment: ' + err.message);
    }
  };

  const handleDeletePayment = async (id, amount) => {
    if (!window.confirm(`Reverse payment of ${formatCurrency(amount)}?`)) return;
    try {
      await deleteOutsourcePayment(id);
      toast.success('Payment removed and balance restored.');
      loadAllData();
    } catch (err) {
      toast.error('Failed to reverse payment: ' + err.message);
    }
  };

  // Filtered lists
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = !searchQuery || 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone?.includes(searchQuery) ||
        v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? v.isActive !== false : v.isActive === false);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchQuery, categoryFilter, statusFilter]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = !searchQuery || 
        j.jobCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.vendorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-theme-main text-theme-primary font-sans pb-32">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-theme-border-soft">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center text-theme-accent">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-theme-primary flex items-center gap-2">
                  Outsource & Vendor Hub
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                    V8 Enterprise
                  </span>
                </h1>
                <p className="text-xs text-theme-secondary">
                  External freelancer costing, job progress tracking, payouts, and client profit margin analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditingVendor(null);
                setVendorModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover border border-theme-border-soft text-xs font-bold flex items-center gap-1.5 transition-all text-theme-primary shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-theme-accent" />
              <span>Add Vendor</span>
            </button>
            <button
              onClick={() => {
                setEditingJob(null);
                setJobModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover border border-theme-border-soft text-xs font-bold flex items-center gap-1.5 transition-all text-theme-primary shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-theme-accent" />
              <span>New Job</span>
            </button>
            <button
              onClick={() => {
                setPaymentTargetJob(null);
                setPaymentTargetVendor(null);
                setPaymentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto custom-scrollbar border-b border-theme-border-soft pb-px">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'vendors', label: `Vendors (${vendors.length})`, icon: Users },
            { id: 'jobs', label: `Outsource Jobs (${jobs.length})`, icon: Briefcase },
            { id: 'payables', label: `Payouts & Ledger (${payments.length})`, icon: CreditCard },
            { id: 'profit', label: 'Profit & Margins', icon: Landmark }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-theme-accent text-theme-accent bg-theme-accent/5'
                    : 'border-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        {/* ========================================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Active Vendors</span>
                <div className="text-xl font-black text-theme-primary">{vendors.filter(v => v.isActive !== false).length}</div>
                <div className="text-[10px] text-theme-secondary font-medium">Registered freelancers</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Open Jobs</span>
                <div className="text-xl font-black text-amber-500">{activeJobsCount}</div>
                <div className="text-[10px] text-theme-secondary font-medium">In progress / review</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Total Outsource Cost</span>
                <div className="text-xl font-black text-theme-primary">{formatCurrency(profitability.totalOutsourceCost)}</div>
                <div className="text-[10px] text-theme-secondary font-medium">{jobs.length} jobs assigned</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Total Payouts Made</span>
                <div className="text-xl font-black text-emerald-500">{formatCurrency(profitability.totalPaid)}</div>
                <div className="text-[10px] text-theme-secondary font-medium">{payments.length} transactions</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Outstanding Payables</span>
                <div className="text-xl font-black text-rose-500">{formatCurrency(totalOutstandingPayable)}</div>
                <div className="text-[10px] text-rose-400 font-medium">Due to freelancers</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Gross Margin</span>
                <div className="text-xl font-black text-theme-accent">{profitability.overallMarginPercent}%</div>
                <div className="text-[10px] text-theme-secondary font-medium">Linked client projects</div>
              </div>
            </div>

            {/* Quick Actions & High Priority Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Jobs Stream */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-theme-surface border border-theme-border-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-theme-accent" />
                    Active Outsource Assignments
                  </h3>
                  <button onClick={() => setActiveTab('jobs')} className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-12 text-center text-theme-secondary text-xs">
                    No outsource jobs created yet. Click "New Job" to assign your first external task.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {jobs.slice(0, 5).map(job => {
                      const fin = calculateJobFinancials(job, payments);
                      const statusObj = JOB_STATUSES.find(s => s.id === job.status) || JOB_STATUSES[0];
                      return (
                        <div key={job.id} className="p-3.5 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-theme-accent/40 transition-colors">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-theme-primary">{job.jobCode}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusObj.color}`}>
                                {job.status}
                              </span>
                              {job.priority === 'Urgent' && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  URGENT
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-extrabold text-theme-primary truncate">{job.project || job.description}</h4>
                            <div className="text-[11px] text-theme-secondary flex items-center gap-3">
                              <span>Vendor: <strong className="text-theme-primary">{job.vendorName || 'Unassigned'}</strong></span>
                              {job.client && <span>Client: <strong>{job.client}</strong></span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-theme-border-soft">
                            <div className="text-right">
                              <div className="text-xs font-black text-theme-primary">{formatCurrency(fin.agreedCost)}</div>
                              <div className="text-[10px] font-bold text-rose-500">
                                Due: {formatCurrency(fin.outstandingPayable)}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setPaymentTargetJob(job);
                                setPaymentTargetVendor(vendors.find(v => v.id === job.vendorId));
                                setPaymentModalOpen(true);
                              }}
                              disabled={fin.outstandingPayable === 0}
                              className="px-2.5 py-1.5 rounded-lg bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent text-xs font-bold border border-theme-accent/20 transition-all disabled:opacity-40"
                            >
                              Pay
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vendor Payable Summary */}
              <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                    <Users className="w-4 h-4 text-theme-accent" />
                    Top Vendor Payables
                  </h3>
                  <button onClick={() => setActiveTab('vendors')} className="text-xs font-bold text-theme-accent hover:underline flex items-center gap-1">
                    Directory <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {vendors.length === 0 ? (
                  <div className="py-12 text-center text-theme-secondary text-xs">
                    No vendors registered yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vendors.slice(0, 5).map(v => {
                      const v360 = calculateVendor360(v, jobs, payments);
                      return (
                        <div key={v.id} className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft flex items-center justify-between">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-theme-primary truncate">{v.name}</h4>
                            <p className="text-[10px] text-theme-secondary truncate">{v.category || 'Specialist'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-rose-500">{formatCurrency(v360.payable)}</div>
                            <div className="text-[10px] text-theme-secondary">{v360.totalJobs} jobs</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. VENDORS DIRECTORY TAB */}
        {/* ========================================================================= */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vendor name, skill, phone..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-theme-surface border border-theme-border-soft text-xs text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-theme-surface border border-theme-border-soft text-xs text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="ALL">All Categories</option>
                  {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-theme-surface border border-theme-border-soft text-xs text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Vendors Grid */}
            {filteredVendors.length === 0 ? (
              <div className="p-12 text-center bg-theme-surface rounded-2xl border border-theme-border-soft space-y-3">
                <Users className="w-8 h-8 text-theme-muted mx-auto" />
                <p className="text-xs text-theme-secondary">No vendors matching your search criteria.</p>
                <button
                  onClick={() => {
                    setEditingVendor(null);
                    setVendorModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-accent text-theme-accent-contrast text-xs font-bold"
                >
                  + Add First Vendor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map(vendor => {
                  const v360 = calculateVendor360(vendor, jobs, payments);
                  return (
                    <div key={vendor.id} className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft hover:border-theme-accent/30 transition-all shadow-sm flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-theme-primary truncate">{vendor.name}</h3>
                            <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/20 inline-block mt-0.5">
                              {vendor.category || 'Specialist'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${vendor.isActive !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                            {vendor.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="mt-3 space-y-1.5 text-xs text-theme-secondary">
                          {vendor.phone && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 truncate">
                                <Phone className="w-3 h-3 text-theme-muted" />
                                {vendor.phone}
                              </span>
                              {vendor.whatsapp && (
                                <a
                                  href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-0.5"
                                >
                                  WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-theme-muted" />
                              <span className="truncate">{vendor.email}</span>
                            </div>
                          )}
                          {vendor.paymentPreference && (
                            <div className="text-[10px] text-theme-muted pt-1">
                              Pay via: <strong>{vendor.paymentPreference}</strong> {vendor.upiId ? `(${vendor.upiId})` : ''}
                            </div>
                          )}
                        </div>

                        {/* Vendor 360 Mini Stats */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-theme-border-soft text-center">
                          <div className="p-1.5 rounded-lg bg-theme-surface-elevated">
                            <span className="text-[9px] font-bold text-theme-muted uppercase block">Jobs</span>
                            <span className="text-xs font-black text-theme-primary">{v360.totalJobs}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-theme-surface-elevated">
                            <span className="text-[9px] font-bold text-theme-muted uppercase block">Paid</span>
                            <span className="text-xs font-black text-emerald-500">{formatCurrency(v360.totalPaid)}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-theme-surface-elevated">
                            <span className="text-[9px] font-bold text-theme-muted uppercase block">Due</span>
                            <span className="text-xs font-black text-rose-500">{formatCurrency(v360.payable)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-theme-border-soft">
                        <button
                          onClick={() => {
                            setSelectedVendorForLedger(vendor);
                            setLedgerModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-primary flex items-center gap-1 border border-theme-border-soft transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-theme-accent" />
                          <span>360 Ledger</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingVendor(vendor);
                              setVendorModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary transition-colors"
                            title="Edit Vendor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-theme-secondary hover:text-rose-500 transition-colors"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. OUTSOURCE JOBS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search job code, project, client..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-theme-surface border border-theme-border-soft text-xs text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-theme-surface border border-theme-border-soft text-xs text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="ALL">All Statuses</option>
                  {JOB_STATUSES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                </select>
              </div>
            </div>

            {/* Jobs Table */}
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-theme-surface rounded-2xl border border-theme-border-soft space-y-3">
                <Briefcase className="w-8 h-8 text-theme-muted mx-auto" />
                <p className="text-xs text-theme-secondary">No outsource jobs found.</p>
                <button
                  onClick={() => {
                    setEditingJob(null);
                    setJobModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-accent text-theme-accent-contrast text-xs font-bold"
                >
                  + Create Outsource Job
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-theme-border-soft bg-theme-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border-soft bg-theme-surface-elevated text-[10px] font-black uppercase text-theme-muted tracking-wider">
                      <th className="py-3 px-4">Job Code</th>
                      <th className="py-3 px-4">Project & Client</th>
                      <th className="py-3 px-4">Assigned Vendor</th>
                      <th className="py-3 px-4 text-right">Agreed Cost</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Payable Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border-soft">
                    {filteredJobs.map(job => {
                      const fin = calculateJobFinancials(job, payments);
                      const statusObj = JOB_STATUSES.find(s => s.id === job.status) || JOB_STATUSES[0];
                      return (
                        <tr key={job.id} className="hover:bg-theme-surface-hover transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-theme-primary">
                            {job.jobCode}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-extrabold text-theme-primary truncate">{job.project || job.description}</div>
                            <div className="text-[11px] text-theme-secondary flex items-center gap-2">
                              {job.client && <span>Client: <strong>{job.client}</strong></span>}
                              {job.relatedInvoiceNumber && (
                                <span className="font-mono text-theme-accent">Inv: #{job.relatedInvoiceNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-theme-primary">{job.vendorName || 'Unassigned'}</div>
                            {job.deadline && <div className="text-[10px] text-theme-muted">Due: {job.deadline}</div>}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-theme-primary">
                            {formatCurrency(fin.agreedCost)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-500">
                            {formatCurrency(fin.totalPaid)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-rose-500">
                            {formatCurrency(fin.outstandingPayable)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${statusObj.color}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setPaymentTargetJob(job);
                                setPaymentTargetVendor(vendors.find(v => v.id === job.vendorId));
                                setPaymentModalOpen(true);
                              }}
                              disabled={fin.outstandingPayable === 0}
                              className="px-2 py-1 rounded bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent font-bold text-[11px] disabled:opacity-30 transition-all"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setJobModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary"
                              title="Edit Job"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id, job.jobCode)}
                              className="p-1 rounded hover:bg-rose-500/10 text-theme-secondary hover:text-rose-500"
                              title="Delete Job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. PAYOUTS & TRANSACTIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'payables' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-theme-primary">Freelancer & Vendor Payment History</h3>
                <p className="text-xs text-theme-secondary">All historical disbursements and advances linked with Internal Bank balances.</p>
              </div>
              <button
                onClick={() => {
                  setPaymentTargetJob(null);
                  setPaymentTargetVendor(null);
                  setPaymentModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-theme-accent text-theme-accent-contrast text-xs font-extrabold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Payout</span>
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center bg-theme-surface rounded-2xl border border-theme-border-soft space-y-3">
                <CreditCard className="w-8 h-8 text-theme-muted mx-auto" />
                <p className="text-xs text-theme-secondary">No payout transactions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-theme-border-soft bg-theme-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border-soft bg-theme-surface-elevated text-[10px] font-black uppercase text-theme-muted tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Job Code</th>
                      <th className="py-3 px-4">Method & Account</th>
                      <th className="py-3 px-4">Reference / Note</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border-soft">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-theme-surface-hover transition-colors">
                        <td className="py-3 px-4 font-mono text-theme-secondary">
                          {pay.date ? pay.date.split('T')[0] : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-bold text-theme-primary">
                          {pay.vendorName || 'Vendor'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-theme-accent">
                          {pay.jobCode || 'Direct Payout'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-theme-primary">{pay.paymentMethod || 'UPI'}</span>
                          {pay.bankAccount && (
                            <span className="text-[10px] text-theme-muted block">via {pay.bankAccount}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-theme-secondary truncate">
                          {pay.note || pay.reference || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-500">
                          {formatCurrency(pay.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeletePayment(pay.id, pay.amount)}
                            className="p-1 rounded hover:bg-rose-500/10 text-theme-secondary hover:text-rose-500"
                            title="Reverse Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. PROFITABILITY & MARGINS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Linked Client Revenue</span>
                <div className="text-xl font-black text-theme-primary">{formatCurrency(profitability.linkedClientRevenue)}</div>
                <div className="text-[10px] text-theme-secondary font-medium">From billed invoices</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Total Outsource Cost</span>
                <div className="text-xl font-black text-rose-500">{formatCurrency(profitability.totalOutsourceCost)}</div>
                <div className="text-[10px] text-theme-secondary font-medium">Direct vendor costs</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Gross Profit</span>
                <div className="text-xl font-black text-emerald-500">{formatCurrency(profitability.linkedGrossProfit)}</div>
                <div className="text-[10px] text-theme-secondary font-medium">Revenue - Outsource Cost</div>
              </div>

              <div className="p-4 rounded-xl bg-theme-surface border border-theme-border-soft shadow-sm space-y-1">
                <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider block">Profit Margin</span>
                <div className="text-xl font-black text-theme-accent">{profitability.overallMarginPercent}%</div>
                <div className="text-[10px] text-theme-secondary font-medium">Overall efficiency</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-border-soft space-y-4">
              <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                <Landmark className="w-4 h-4 text-theme-accent" />
                Project-Wise Cost & Profit Breakdown
              </h3>

              {profitability.projectBreakdown.length === 0 ? (
                <div className="py-12 text-center text-theme-secondary text-xs">
                  No projects with linked outsource jobs yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-theme-border-soft">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-theme-border-soft bg-theme-surface-elevated text-[10px] font-black uppercase text-theme-muted tracking-wider">
                        <th className="py-3 px-4">Job Code</th>
                        <th className="py-3 px-4">Project & Client</th>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4 text-right">Client Billed</th>
                        <th className="py-3 px-4 text-right">Outsource Cost</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft">
                      {profitability.projectBreakdown.map(item => (
                        <tr key={item.jobId} className="hover:bg-theme-surface-hover transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-theme-primary">{item.jobCode}</td>
                          <td className="py-3 px-4 font-bold text-theme-primary">
                            <div>{item.title}</div>
                            <div className="text-[10px] text-theme-muted">{item.client}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-theme-secondary">{item.invoiceNumber}</td>
                          <td className="py-3 px-4 text-right font-bold text-theme-primary">{formatCurrency(item.invoiceAmount)}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-500">{formatCurrency(item.agreedCost)}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-500">{formatCurrency(item.grossProfit)}</td>
                          <td className="py-3 px-4 text-right font-black text-theme-accent">{item.marginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT VENDOR MODAL */}
      {/* ========================================================================= */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-theme-border-soft flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-theme-accent" />
                {editingVendor ? 'Edit Vendor Profile' : 'Register New Vendor / Freelancer'}
              </h3>
              <button onClick={() => setVendorModalOpen(false)} className="p-1 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Vendor / Specialist Name *</label>
                <input
                  name="name"
                  defaultValue={editingVendor?.name || ''}
                  required
                  placeholder="e.g. John Doe, Alpha Creative Agency"
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Skill / Category</label>
                  <select
                    name="category"
                    defaultValue={editingVendor?.category || VENDOR_CATEGORIES[0]}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Phone Number</label>
                  <input
                    name="phone"
                    defaultValue={editingVendor?.phone || ''}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">WhatsApp (For Direct Chat)</label>
                  <input
                    name="whatsapp"
                    defaultValue={editingVendor?.whatsapp || ''}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingVendor?.email || ''}
                    placeholder="vendor@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Payment Preference</label>
                  <select
                    name="paymentPreference"
                    defaultValue={editingVendor?.paymentPreference || 'UPI'}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">UPI ID / Account Info</label>
                  <input
                    name="upiId"
                    defaultValue={editingVendor?.upiId || ''}
                    placeholder="e.g. user@okhdfcbank"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Default Rate (₹)</label>
                  <input
                    name="defaultRate"
                    type="number"
                    defaultValue={editingVendor?.defaultRate || ''}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Opening Payable Balance (₹)</label>
                  <input
                    name="openingBalance"
                    type="number"
                    defaultValue={editingVendor?.openingBalance || ''}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Notes & Terms</label>
                <textarea
                  name="notes"
                  defaultValue={editingVendor?.notes || ''}
                  rows={2}
                  placeholder="Portfolio link, turnaround time, payment terms..."
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  defaultChecked={editingVendor ? editingVendor.isActive !== false : true}
                  className="rounded border-theme-border-soft text-theme-accent focus:ring-0"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-theme-primary">
                  Active Vendor (Available for new jobs)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-theme-border-soft">
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-extrabold"
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT OUTSOURCE JOB MODAL */}
      {/* ========================================================================= */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-theme-border-soft flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-theme-accent" />
                {editingJob ? `Edit Job (${editingJob.jobCode})` : 'Create Outsource Job'}
              </h3>
              <button onClick={() => setJobModalOpen(false)} className="p-1 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Project / Task Title *</label>
                <input
                  name="project"
                  defaultValue={editingJob?.project || editingJob?.description || ''}
                  required
                  placeholder="e.g. 3D Product Animation, Wedding Album Retouch"
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Assign Vendor *</label>
                  <select
                    name="vendorId"
                    defaultValue={editingJob?.vendorId || (vendors[0]?.id || '')}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    {vendors.length === 0 && <option value="">No vendors available</option>}
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Link to Client Invoice</label>
                  <select
                    name="relatedInvoiceId"
                    defaultValue={editingJob?.relatedInvoiceId || ''}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    <option value="">-- No Linked Invoice --</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} · {inv.customerName} ({formatCurrency(inv.grandTotal || inv.total)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Agreed Cost (₹) *</label>
                  <input
                    name="agreedCost"
                    type="number"
                    required
                    defaultValue={editingJob?.agreedCost || ''}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>

                {!editingJob && (
                  <div className="space-y-1">
                    <label className="font-bold text-theme-secondary">Initial Advance Payout (₹)</label>
                    <input
                      name="advance"
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                    />
                  </div>
                )}
                {editingJob && (
                  <div className="space-y-1">
                    <label className="font-bold text-theme-secondary">Status</label>
                    <select
                      name="status"
                      defaultValue={editingJob.status || 'Assigned'}
                      className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                    >
                      {JOB_STATUSES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Priority</label>
                  <select
                    name="priority"
                    defaultValue={editingJob?.priority || 'Medium'}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent 🔥</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Deadline</label>
                  <input
                    name="deadline"
                    type="date"
                    defaultValue={editingJob?.deadline || ''}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Job Brief & Deliverable Notes</label>
                <textarea
                  name="description"
                  defaultValue={editingJob?.description || ''}
                  rows={2}
                  placeholder="Deliverable specifications, Dropbox / Figma link..."
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-theme-border-soft">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-extrabold"
                >
                  {editingJob ? 'Save Changes' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYOUT MODAL */}
      {/* ========================================================================= */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-theme-border-soft flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-theme-accent" />
                Record Freelancer / Vendor Payout
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Select Vendor *</label>
                <select
                  name="vendorId"
                  defaultValue={paymentTargetVendor?.id || paymentTargetJob?.vendorId || (vendors[0]?.id || '')}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Related Outsource Job (Optional)</label>
                <select
                  name="jobId"
                  defaultValue={paymentTargetJob?.id || ''}
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="">-- General / Advance Payout --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.jobCode} · {j.project || j.description} ({formatCurrency(j.agreedCost)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Payment Amount (₹) *</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    defaultValue={paymentTargetJob ? calculateJobFinancials(paymentTargetJob, payments).outstandingPayable : ''}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Payment Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Payment Method</label>
                  <select
                    name="paymentMethod"
                    defaultValue="UPI"
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-theme-secondary">Internal Bank Account</label>
                  <select
                    name="bankAccount"
                    defaultValue={bankAccounts[0] || 'Cash'}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                  >
                    {bankAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-theme-secondary">Transaction Ref / UTR / Note</label>
                <input
                  name="reference"
                  placeholder="e.g. UTR-98234710, Advance payout"
                  className="w-full px-3 py-2 rounded-lg bg-theme-surface-elevated border border-theme-border-soft text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div className="p-3 rounded-xl bg-theme-accent/5 border border-theme-accent/20 text-[11px] text-theme-secondary space-y-1">
                <div className="flex items-center gap-1.5 text-theme-accent font-bold">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Automatic Internal Bank Parity</span>
                </div>
                <p>This disbursement will decrease the vendor payable and automatically post an expense to your selected bank account.</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-theme-border-soft">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-theme-accent-contrast text-xs font-extrabold"
                >
                  Disburse & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VENDOR 360 & RUNNING STATEMENT LEDGER */}
      {/* ========================================================================= */}
      {ledgerModalOpen && selectedVendorForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-theme-border-soft flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-theme-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-theme-accent" />
                  Vendor 360 Statement: {selectedVendorForLedger.name}
                </h3>
                <span className="text-[10px] text-theme-secondary">{selectedVendorForLedger.category} · {selectedVendorForLedger.phone || 'No phone'}</span>
              </div>
              <button onClick={() => setLedgerModalOpen(false)} className="p-1 rounded-lg hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              {/* Top Summary Row */}
              {(() => {
                const ledger = getVendorLedger(selectedVendorForLedger, jobs, payments);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-center">
                        <span className="text-[9px] font-bold text-theme-muted uppercase block">Total Job Cost</span>
                        <span className="text-sm font-black text-theme-primary">{formatCurrency(ledger.totalJobCost)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-center">
                        <span className="text-[9px] font-bold text-theme-muted uppercase block">Total Paid</span>
                        <span className="text-sm font-black text-emerald-500">{formatCurrency(ledger.totalPaid)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-center">
                        <span className="text-[9px] font-bold text-theme-muted uppercase block">Net Balance Payable</span>
                        <span className="text-sm font-black text-rose-500">{formatCurrency(ledger.currentPayable)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-theme-border-soft">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-theme-border-soft bg-theme-surface-elevated text-[9px] font-black uppercase text-theme-muted tracking-wider">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Job Cost (Cr)</th>
                            <th className="py-2.5 px-3 text-right">Paid (Dr)</th>
                            <th className="py-2.5 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border-soft">
                          {ledger.statement.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-theme-muted">
                                No ledger transactions found for this vendor.
                              </td>
                            </tr>
                          ) : (
                            ledger.statement.map(st => (
                              <tr key={st.id} className="hover:bg-theme-surface-hover">
                                <td className="py-2 px-3 font-mono text-theme-secondary">{st.date ? st.date.split('T')[0] : ''}</td>
                                <td className="py-2 px-3 font-bold text-theme-primary">{st.type}</td>
                                <td className="py-2 px-3 text-theme-secondary">{st.description}</td>
                                <td className="py-2 px-3 text-right font-bold text-theme-primary">{st.credit > 0 ? formatCurrency(st.credit) : '—'}</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-500">{st.debit > 0 ? formatCurrency(st.debit) : '—'}</td>
                                <td className="py-2 px-3 text-right font-black text-rose-500">{formatCurrency(st.balance)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t border-theme-border-soft flex justify-end">
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover text-xs font-bold text-theme-primary"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutsourceVendors;
