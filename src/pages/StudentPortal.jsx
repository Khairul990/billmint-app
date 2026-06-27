import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, BookOpen, GraduationCap, Calendar, FileText, Bell, CheckCircle, ShieldCheck, Download, User, Wallet } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getStudentInvoices, getStudentProfile } from '../services/dbEngine';
import StudentLogin from '../components/portal/StudentLogin';
import ClassicLoader from '../components/ClassicLoader';
import { formatCurrency } from '../utils/invoiceUtils';
import { downloadInvoicePDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';

export default function StudentPortal({ studentId }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('fees');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && studentId) {
      loadPortalData();
    }
  }, [user, studentId]);

  const loadPortalData = async () => {
    setLoadingData(true);
    try {
      const fetchedInvoices = await getStudentInvoices(studentId, user.email);
      const fetchedProfile = await getStudentProfile(studentId, user.email);
      
      setInvoices(fetchedInvoices);
      setProfile(fetchedProfile || { name: 'Student', email: user.email, id: studentId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setInvoices([]);
    setProfile(null);
    toast.success('Securely logged out.');
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><ClassicLoader /></div>;
  }

  if (!user) {
    return <StudentLogin studentId={studentId} onLoginSuccess={setUser} />;
  }

  if (loadingData) {
    return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center"><ClassicLoader /><p className="text-slate-600 mt-4 font-bold animate-pulse">Loading Student Records...</p></div>;
  }

  // Calculate Dashboard Metrics
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || (inv.grandTotal - (inv.amountPaid || 0))), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const overdueInvoices = invoices.filter(inv => inv.paymentStatus !== 'Paid' && new Date(inv.dueDate) < new Date());

  const activeSymbol = invoices[0]?.regionalSettingsSnapshot?.currency || '₹';

  const tabs = [
    { id: 'fees', label: 'Fee Details', icon: Wallet },
    { id: 'notices', label: 'Notice Board', icon: Bell },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'results', label: 'Academic Results', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{profile?.name || 'Student Portal'}</h1>
              <p className="text-slate-500 text-sm flex items-center gap-2 font-medium mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> ID: {studentId} • {profile?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all font-bold text-sm relative z-10"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'fees' && (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Wallet className="w-4 h-4" /> Total Due Fees</h3>
                    <p className="text-4xl font-black text-rose-500">{formatCurrency(totalDue, activeSymbol)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Fees Paid</h3>
                    <p className="text-4xl font-black text-emerald-500">{formatCurrency(totalPaid, activeSymbol)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Overdue Invoices</h3>
                    <p className="text-4xl font-black text-amber-500">{overdueInvoices.length}</p>
                  </div>
                </div>

                {/* Fee History */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> Fee Receipts & Invoices</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-lg">Invoice No</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Total Fee</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right rounded-tr-lg">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center">
                                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                                <span className="font-bold">No fee records found.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                              <td className="px-6 py-4 text-slate-500 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(inv.grandTotal, activeSymbol)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                                  inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                  inv.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {inv.paymentStatus || 'Unpaid'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => downloadInvoicePDF(inv, inv.businessSnapshot, false)}
                                  className="inline-flex items-center justify-center p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors font-semibold text-xs gap-2"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" /> PDF
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
            )}

            {activeTab === 'notices' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No active notices</h3>
                <p className="text-slate-500">You're all caught up! New announcements will appear here.</p>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Attendance Tracking</h3>
                <p className="text-slate-500">Coming soon in the next update.</p>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Results</h3>
                <p className="text-slate-500">Your examination results and report cards will be visible here.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
