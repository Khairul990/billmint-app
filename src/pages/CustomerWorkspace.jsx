import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, FileText, CheckCircle, Clock, ShieldCheck, Download, Printer, User, Search, Eye, Building2, MapPin, Phone, Mail, FileCheck2, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getPortalLabelByType, getCustomerLabelByType, getInvoiceLabelByType, getIconForCustomer, getIconForInvoice } from '../config/businessPresets';
import { invoiceEngine } from '../services/invoiceEngine';
import CustomerPortalLogin from '../components/portal/CustomerPortalLogin';
import ClassicLoader from '../components/ClassicLoader';
import { formatCurrency } from '../utils/invoiceUtils';
import { downloadInvoicePDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';
import { staggerContainer, staggerItem, pageVariants, fadeInUp } from '../utils/animations';

export default function CustomerWorkspace({ customerId }) {
  const [sessionData, setSessionData] = useState(() => {
    return {
      id: sessionStorage.getItem('billqyro_customer_portal_id'),
      phone: sessionStorage.getItem('billqyro_customer_portal_phone')
    };
  });
  
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, invoices, payments, profile

  const activeCustomerId = customerId || sessionData.id;

  useEffect(() => {
    if (sessionData.id && sessionData.phone && sessionData.id === activeCustomerId) {
      loadPortalData(sessionData.id, sessionData.phone);
    }
  }, [sessionData, activeCustomerId]);

  const loadPortalData = async (id, phone) => {
    setLoadingData(true);
    try {
      const fetchedInvoices = await invoiceEngine.getCustomerPortalInvoices(id, phone);
      // Sort invoices by date descending
      fetchedInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
      setInvoices(fetchedInvoices);
      if (fetchedInvoices.length > 0) {
        const inv = fetchedInvoices[0];
        setProfile({
          name: inv.customerName,
          email: inv.customerEmail,
          phone: inv.customerPhone,
          id: inv.customerId,
          address: inv.customerAddress
        });
      } else {
        setProfile({ name: 'Customer', id });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load portal data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('billqyro_customer_portal_id');
    sessionStorage.removeItem('billqyro_customer_portal_phone');
    setSessionData({ id: null, phone: null });
    setInvoices([]);
    setProfile(null);
    toast.success('Securely logged out.');
  };

  const handleVerificationSuccess = (id, phone) => {
    sessionStorage.setItem('billqyro_customer_portal_id', id);
    sessionStorage.setItem('billqyro_customer_portal_phone', phone);
    setSessionData({ id, phone });
  };

  const { totalDue, totalPaid, totalBills, latestInvoiceDate, payments } = useMemo(() => {
    let tDue = 0;
    let tPaid = 0;
    let latestDate = null;
    let paymentHistory = [];

    invoices.forEach(inv => {
      const due = inv.balanceDue || (inv.grandTotal - (inv.amountPaid || 0));
      const paid = inv.amountPaid || 0;
      tDue += due;
      tPaid += paid;
      
      const invDate = new Date(inv.date);
      if (!latestDate || invDate > latestDate) {
        latestDate = invDate;
      }

      if (paid > 0) {
        paymentHistory.push({
          id: inv.id + '-pay',
          date: inv.date,
          amount: paid,
          method: inv.paymentMethod || 'Online / Cash',
          status: 'Completed',
          reference: inv.invoiceNumber
        });
      }
    });

    return {
      totalDue: tDue,
      totalPaid: tPaid,
      totalBills: invoices.length,
      latestInvoiceDate: latestDate,
      payments: paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }, [invoices]);

  const lastPaymentDate = payments.length > 0 ? new Date(payments[0].date) : null;

  // Search Filter
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.date?.includes(q) ||
      inv.grandTotal?.toString().includes(q) ||
      inv.paymentStatus?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  if (!sessionData.id || !sessionData.phone || sessionData.id !== activeCustomerId) {
    return <CustomerPortalLogin onVerificationSuccess={handleVerificationSuccess} prefillId={customerId} />;
  }

  if (loadingData) {
    return <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center"><ClassicLoader /><p className="text-theme-muted mt-4 font-bold animate-pulse">Loading Secure Workspace...</p></div>;
  }

  // Memoized Calculations
  const activeSymbol = invoices[0]?.regionalSettingsSnapshot?.currency || '₹';
  const businessInfo = invoices[0]?.businessSnapshot || {};
  const businessType = businessInfo.businessType || 'retail';
  const portalLabel = getPortalLabelByType(businessType);
  const customerLabel = getCustomerLabelByType(businessType);
  const invoiceLabel = getInvoiceLabelByType(businessType);

  const DynamicCustomerIcon = LucideIcons[getIconForCustomer(businessType)] || User;
  const DynamicInvoiceIcon = LucideIcons[getIconForInvoice(businessType)] || FileText;

  return (
    <div className="min-h-screen bg-theme-main text-theme-primary font-sans pb-24 md:pb-8">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-theme-main/80 backdrop-blur-xl border-b border-theme-border-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {businessInfo.logoUrl ? (
              <img src={businessInfo.logoUrl} alt="Business Logo" className="w-8 h-8 rounded-lg object-cover bg-theme-card" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-black">
                {businessInfo.businessName?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-theme-primary leading-tight">{businessInfo.businessName || portalLabel}</h1>
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">{portalLabel}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger rounded-lg transition-colors font-bold text-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Customer Welcome Card */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-5 z-10 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-theme-surface border-2 border-theme-accent/20 rounded-full flex items-center justify-center shrink-0">
              <DynamicCustomerIcon className="w-8 h-8 sm:w-10 sm:h-10 text-theme-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black text-theme-primary">{profile?.name}</h2>
                <div className="group relative">
                  <ShieldCheck className="w-5 h-5 text-theme-success" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-theme-card border border-theme-border-soft text-theme-primary text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Premium Verified {customerLabel}
                  </div>
                </div>
              </div>
              <p className="text-sm font-mono text-theme-muted mb-2">{profile?.id}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-theme-success/10 text-theme-success text-xs font-bold uppercase tracking-wider border border-theme-success/20">
                <CheckCircle className="w-3.5 h-3.5" /> Verified Access
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-16 bg-theme-border-soft z-10"></div>

          <div className="z-10 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-4">
             <div className="flex items-center gap-3 text-sm font-medium text-theme-muted">
                <Building2 className="w-4 h-4 text-theme-accent" /> {businessInfo.businessName || 'Business Name'}
             </div>
             <div className="flex items-center gap-3 text-sm font-medium text-theme-muted">
                <Phone className="w-4 h-4 text-theme-accent" /> {businessInfo.phone || 'Phone not provided'}
             </div>
          </div>
        </motion.div>

        {/* Dashboard Metrics */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div variants={staggerItem} className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft shadow-lg relative overflow-hidden group hover:border-theme-accent/30 transition-colors">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-accent/5 rounded-full blur-2xl group-hover:bg-theme-accent/10 transition-colors"></div>
            <div className="w-8 h-8 rounded-lg bg-theme-surface flex items-center justify-center mb-3">
              <DynamicInvoiceIcon className="w-4 h-4 text-theme-accent" />
            </div>
            <h3 className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Total {invoiceLabel}s</h3>
            <p className="text-xl sm:text-3xl font-black text-theme-primary">{totalBills}</p>
          </motion.div>
          
          <motion.div variants={staggerItem} className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft shadow-lg relative overflow-hidden group hover:border-theme-success/30 transition-colors">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-success/5 rounded-full blur-2xl group-hover:bg-theme-success/10 transition-colors"></div>
            <div className="w-8 h-8 rounded-lg bg-theme-surface flex items-center justify-center mb-3">
              <CheckCircle className="w-4 h-4 text-theme-success" />
            </div>
            <h3 className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Total Paid</h3>
            <p className="text-xl sm:text-3xl font-black text-theme-success">{formatCurrency(totalPaid, activeSymbol)}</p>
          </motion.div>
          
          <motion.div variants={staggerItem} className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft shadow-lg relative overflow-hidden group hover:border-theme-danger/30 transition-colors">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-danger/5 rounded-full blur-2xl group-hover:bg-theme-danger/10 transition-colors"></div>
            <div className="w-8 h-8 rounded-lg bg-theme-surface flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-theme-danger" />
            </div>
            <h3 className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Total Due</h3>
            <p className="text-xl sm:text-3xl font-black text-theme-danger">{formatCurrency(totalDue, activeSymbol)}</p>
          </motion.div>

          <motion.div variants={staggerItem} className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft shadow-lg relative overflow-hidden group hover:border-theme-accent/30 transition-colors">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-accent/5 rounded-full blur-2xl group-hover:bg-theme-accent/10 transition-colors"></div>
            <div className="w-8 h-8 rounded-lg bg-theme-surface flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4 text-theme-accent" />
            </div>
            <h3 className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Last Payment</h3>
            <p className="text-lg sm:text-xl font-black text-theme-primary mt-2">
              {lastPaymentDate ? lastPaymentDate.toLocaleDateString() : 'No Payments'}
            </p>
          </motion.div>
        </motion.div>

        {/* Content Tabs Desktop (Sticky Mobile Nav at bottom) */}
        <div className="hidden md:flex gap-2 p-1 bg-theme-surface border border-theme-border-soft rounded-xl w-fit">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft' : 'text-theme-muted hover:text-theme-primary'}`}>{invoiceLabel} Center</button>
          <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'payments' ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft' : 'text-theme-muted hover:text-theme-primary'}`}>Payment History</button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft' : 'text-theme-muted hover:text-theme-primary'}`}>Business & Profile</button>
        </div>

        <AnimatePresence mode="wait">
          {/* INVOICE CENTER */}
          {activeTab === 'dashboard' && (
            <motion.div key="invoices" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-card border border-theme-border-soft p-4 rounded-2xl">
                <h3 className="text-lg font-black flex items-center gap-2"><DynamicInvoiceIcon className="w-5 h-5 text-theme-accent" /> All {invoiceLabel}s</h3>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input 
                    type="text" 
                    placeholder={`Search ${invoiceLabel.toLowerCase()}s...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>
              <div className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-xl overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-theme-surface text-theme-muted text-xs uppercase font-bold">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Invoice No</th>
                        <th className="px-6 py-4 whitespace-nowrap">Date</th>
                        <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-theme-muted">
                              <DynamicInvoiceIcon className="w-12 h-12 mb-3 opacity-50" />
                              <p className="font-bold text-lg text-theme-primary">No {invoiceLabel.toLowerCase()}s found</p>
                              <p className="text-sm">Try adjusting your search or contact the business.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-theme-surface transition-colors group">
                            <td className="px-6 py-4 font-bold font-mono">{inv.invoiceNumber}</td>
                            <td className="px-6 py-4 text-theme-muted">{new Date(inv.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black">
                              {formatCurrency(
                                Number(inv.totals?.totalDue || ((inv.totals?.grandTotal || inv.grandTotal || 0) + (inv.totals?.oldDue || inv.oldDue || 0))), 
                                activeSymbol
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                inv.paymentStatus === 'Paid' ? 'bg-theme-success/10 text-theme-success border border-theme-success/20' :
                                inv.paymentStatus === 'Partial' ? 'bg-theme-warning/10 text-theme-warning border border-theme-warning/20' :
                                'bg-theme-danger/10 text-theme-danger border border-theme-danger/20'
                              }`}>
                                {inv.paymentStatus || 'Unpaid'}
                              </span>
                              {inv.paymentStatus !== 'Paid' && inv.dueDate && (
                                <div className="text-[10px] text-theme-muted mt-1">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a 
                                  href={`/invoice/${inv.publicToken}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center p-2 bg-theme-surface hover:bg-theme-accent/10 border border-theme-border-soft hover:border-theme-accent/30 text-theme-primary hover:text-theme-accent rounded-lg transition-colors tooltip-trigger"
                                  title="View Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button 
                                  onClick={() => downloadInvoicePDF(inv, inv.businessSnapshot, false)}
                                  className="inline-flex items-center justify-center p-2 bg-theme-surface hover:bg-theme-accent/10 border border-theme-border-soft hover:border-theme-accent/30 text-theme-primary hover:text-theme-accent rounded-lg transition-colors tooltip-trigger"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                      window.open(`/invoice/${inv.publicToken}?print=true`, '_blank');
                                  }}
                                  className="hidden sm:inline-flex items-center justify-center p-2 bg-theme-surface hover:bg-theme-accent/10 border border-theme-border-soft hover:border-theme-accent/30 text-theme-primary hover:text-theme-accent rounded-lg transition-colors tooltip-trigger"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col divide-y divide-theme-border-soft">
                  {filteredInvoices.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-theme-muted">
                      <DynamicInvoiceIcon className="w-10 h-10 mb-3 opacity-50" />
                      <p className="font-bold text-base text-theme-primary">No {invoiceLabel.toLowerCase()}s found</p>
                    </div>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <div key={inv.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold font-mono text-theme-primary">{inv.invoiceNumber}</span>
                            <div className="text-xs text-theme-muted mt-0.5">{new Date(inv.date).toLocaleDateString()}</div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            inv.paymentStatus === 'Paid' ? 'bg-theme-success/10 text-theme-success border border-theme-success/20' :
                            inv.paymentStatus === 'Partial' ? 'bg-theme-warning/10 text-theme-warning border border-theme-warning/20' :
                            'bg-theme-danger/10 text-theme-danger border border-theme-danger/20'
                          }`}>
                            {inv.paymentStatus || 'Unpaid'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-xs text-theme-muted uppercase font-bold tracking-wider mb-0.5">Amount</div>
                            <div className="text-lg font-black text-theme-primary">
                              {formatCurrency(Number(inv.totals?.totalDue || ((inv.totals?.grandTotal || inv.grandTotal || 0) + (inv.totals?.oldDue || inv.oldDue || 0))), activeSymbol)}
                            </div>
                            {inv.paymentStatus !== 'Paid' && inv.dueDate && (
                              <div className="text-[10px] text-theme-danger font-bold mt-1">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <a href={`/invoice/${inv.publicToken}`} target="_blank" rel="noreferrer" className="p-2.5 bg-theme-surface rounded-xl text-theme-primary hover:text-theme-accent border border-theme-border-soft transition-colors">
                              <Eye className="w-4 h-4" />
                            </a>
                            <button onClick={() => downloadInvoicePDF(inv, inv.businessSnapshot, false)} className="p-2.5 bg-theme-surface rounded-xl text-theme-primary hover:text-theme-accent border border-theme-border-soft transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <motion.div key="payments" variants={pageVariants} initial="initial" animate="in" exit="out" className="space-y-6">
               <div className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-theme-border-soft">
                  <h3 className="text-lg font-black flex items-center gap-2"><CreditCard className="w-5 h-5 text-theme-accent" /> Payment History</h3>
                  <p className="text-xs text-theme-muted mt-1">A record of your payments derived from settled invoices.</p>
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-theme-surface text-theme-muted text-xs uppercase font-bold">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Payment Date</th>
                        <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                        <th className="px-6 py-4 whitespace-nowrap">Method</th>
                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 whitespace-nowrap">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-soft">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-theme-muted">
                              <CreditCard className="w-12 h-12 mb-3 opacity-50" />
                              <p className="font-bold text-lg text-theme-primary">No payments found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-theme-surface transition-colors">
                            <td className="px-6 py-4 text-theme-muted">{new Date(pay.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black text-theme-success">+{formatCurrency(pay.amount, activeSymbol)}</td>
                            <td className="px-6 py-4 text-theme-muted">{pay.method}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-theme-success/10 text-theme-success border border-theme-success/20">
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4 text-theme-muted font-mono">{pay.reference || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View for Payments */}
                <div className="md:hidden flex flex-col divide-y divide-theme-border-soft">
                  {payments.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-theme-muted">
                      <CreditCard className="w-10 h-10 mb-3 opacity-50" />
                      <p className="font-bold text-base text-theme-primary">No payments found</p>
                    </div>
                  ) : (
                    payments.map((pay) => (
                      <div key={pay.id} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-theme-primary">{pay.method || 'Payment'}</span>
                            <div className="text-xs text-theme-muted">{new Date(pay.date).toLocaleDateString()}</div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-theme-success/10 text-theme-success border border-theme-success/20">
                            Completed
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <div className="text-[10px] text-theme-muted font-mono max-w-[150px] truncate">
                            Ref: {pay.reference || 'N/A'}
                          </div>
                          <div className="text-lg font-black text-theme-success">
                            +{formatCurrency(pay.amount, activeSymbol)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE & BUSINESS */}
          {activeTab === 'profile' && (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="in" exit="out" className="grid md:grid-cols-2 gap-6">
              
              {/* Business Profile */}
              <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-lg">
                <h3 className="text-lg font-black flex items-center gap-2 mb-6"><Building2 className="w-5 h-5 text-theme-accent" /> Business Information</h3>
                <div className="flex items-center gap-4 mb-6">
                   {businessInfo.logoUrl ? (
                      <img src={businessInfo.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-theme-surface border border-theme-border-soft" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-black text-2xl shadow-lg">
                        {businessInfo.businessName?.charAt(0) || 'B'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-black text-theme-primary">{businessInfo.businessName}</h4>
                      <p className="text-sm font-medium text-theme-muted">{businessInfo.ownerName}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-theme-accent mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Phone</p>
                      <p className="text-sm font-medium text-theme-primary">{businessInfo.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-theme-accent mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Email</p>
                      <p className="text-sm font-medium text-theme-primary">{businessInfo.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-theme-accent mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Address</p>
                      <p className="text-sm font-medium text-theme-primary whitespace-pre-wrap">{businessInfo.address || 'Not provided'}</p>
                    </div>
                  </div>
                  {businessInfo.gstin && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-theme-accent mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-theme-muted uppercase">Tax ID / GSTIN</p>
                        <p className="text-sm font-medium text-theme-primary">{businessInfo.gstin}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Profile */}
              <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-lg">
                <h3 className="text-lg font-black flex items-center gap-2 mb-6"><User className="w-5 h-5 text-theme-accent" /> Your Profile</h3>
                
                <div className="space-y-4">
                  <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft mb-6">
                     <p className="text-xs font-bold text-theme-muted uppercase mb-1">Lifetime Value</p>
                     <p className="text-2xl font-black text-theme-primary">{formatCurrency(totalPaid + totalDue, activeSymbol)}</p>
                     <p className="text-xs text-theme-muted mt-1">Total Purchased Amount</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Name</p>
                      <p className="text-sm font-medium text-theme-primary">{profile?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">{customerLabel} ID</p>
                      <p className="text-sm font-medium text-theme-primary font-mono">{profile?.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Phone</p>
                      <p className="text-sm font-medium text-theme-primary">{profile?.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-muted uppercase">Email</p>
                      <p className="text-sm font-medium text-theme-primary">{profile?.email || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-theme-muted uppercase">Address</p>
                      <p className="text-sm font-medium text-theme-primary">{profile?.address || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 mt-2 pt-4 border-t border-theme-border-soft">
                      <p className="text-xs font-bold text-theme-muted uppercase">{customerLabel} Since</p>
                      <p className="text-sm font-medium text-theme-primary">
                        {invoices.length > 0 ? new Date(invoices[invoices.length - 1].date).toLocaleDateString() : 'New'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-theme-card/90 backdrop-blur-xl border-t border-theme-border-soft z-50 p-2 pb-safe">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-theme-accent' : 'text-theme-muted hover:bg-theme-surface'}`}
          >
            <FileCheck2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Invoices</span>
          </button>
          <button 
            onClick={() => setActiveTab('payments')} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'payments' ? 'text-theme-accent' : 'text-theme-muted hover:bg-theme-surface'}`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Payments</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'text-theme-accent' : 'text-theme-muted hover:bg-theme-surface'}`}
          >
            <DynamicCustomerIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
