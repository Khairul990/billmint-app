import { useState, useEffect } from 'react';
import { invoiceEngine } from '../services/invoiceEngine';
import { formatCurrency } from '../utils/invoiceUtils';
import { downloadInvoicePDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';

export default function BillingPortal({ customerId }) {
  const [sessionData, setSessionData] = useState(() => {
    return {
      id: sessionStorage.getItem('billqyro_customer_portal_id'),
      phone: sessionStorage.getItem('billqyro_customer_portal_phone')
    };
  });
  
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

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
      setInvoices(fetchedInvoices);
      if (fetchedInvoices.length > 0) {
        const inv = fetchedInvoices[0];
        setProfile({
          name: inv.customerName,
          email: inv.customerEmail,
          phone: inv.customerPhone,
          id: inv.customerId
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

  if (!sessionData.id || !sessionData.phone || sessionData.id !== activeCustomerId) {
    return <CustomerPortalLogin onVerificationSuccess={handleVerificationSuccess} />;
  }

  if (loadingData) {
    return <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center"><ClassicLoader /><p className="text-white mt-4 font-bold animate-pulse">Loading Secure Portal...</p></div>;
  }

  // Calculate Dashboard Metrics
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || (inv.grandTotal - (inv.amountPaid || 0))), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const overdueInvoices = invoices.filter(inv => inv.paymentStatus !== 'Paid' && new Date(inv.dueDate) < new Date());

  const activeSymbol = invoices[0]?.regionalSettingsSnapshot?.currency || '₹';

  return (
    <div className="min-h-screen bg-theme-main text-theme-primary font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-theme-accent/10 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-theme-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{profile?.name || 'Billing Portal'}</h1>
              <p className="text-theme-muted text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-theme-success" /> Verified Customer • {profile?.id}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger rounded-xl transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-theme-danger/5 rounded-full blur-2xl"></div>
            <h3 className="text-theme-muted text-xs font-bold uppercase mb-2">Total Due</h3>
            <p className="text-3xl font-black text-theme-danger">{formatCurrency(totalDue, activeSymbol)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-theme-success/5 rounded-full blur-2xl"></div>
            <h3 className="text-theme-muted text-xs font-bold uppercase mb-2">Total Paid</h3>
            <p className="text-3xl font-black text-theme-success">{formatCurrency(totalPaid, activeSymbol)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <h3 className="text-theme-muted text-xs font-bold uppercase mb-2">Overdue Bills</h3>
            <p className="text-3xl font-black text-amber-500">{overdueInvoices.length}</p>
          </motion.div>
        </div>

        {/* Invoice History */}
        <div className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-theme-border-soft">
            <h2 className="text-xl font-black flex items-center gap-2"><FileText className="w-5 h-5 text-theme-accent" /> Billing History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-theme-main/50 text-theme-muted text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-soft">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-theme-muted font-bold">No invoices found for this account.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-theme-accent/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-theme-muted">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(inv.grandTotal, activeSymbol)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                          inv.paymentStatus === 'Paid' ? 'bg-theme-success/20 text-theme-success' :
                          inv.paymentStatus === 'Partial' ? 'bg-theme-warning/20 text-theme-warning' :
                          'bg-theme-danger/20 text-theme-danger'
                        }`}>
                          {inv.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => downloadInvoicePDF(inv, inv.businessSnapshot, false)}
                          className="inline-flex items-center justify-center p-2 bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
