import React, { useState, useEffect } from 'react';
import { Beaker, Users, FileText, IndianRupee, RefreshCw, Loader, AlertTriangle, Trash2, Video, BarChart2, CheckCircle2, Play, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState('');
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    reports: false,
    persona: 'None'
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Load initial stats from local storage
  const loadStats = () => {
    const customers = JSON.parse(localStorage.getItem('billqyro_testlab_customers') || '[]');
    const invoices = JSON.parse(localStorage.getItem('billqyro_testlab_invoices') || '[]');
    const reports = localStorage.getItem('billqyro_testlab_reports') !== null;
    const persona = localStorage.getItem('billqyro_testlab_persona') || 'None';

    setStats({
      customers: customers.length,
      invoices: invoices.length,
      reports,
      persona
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const generateDemoCustomers = () => {
    const fakeCustomers = Array.from({ length: 50 }).map((_, i) => ({
      id: `test-cust-${Date.now()}-${i}`,
      name: `Demo Customer ${i + 1}`,
      phone: `+91 90000${Math.floor(10000 + Math.random() * 90000)}`,
      email: `demo${i+1}@example.com`,
      address: `123 Demo St, City ${i % 5}`,
      businessType: stats.persona !== 'None' ? stats.persona : 'General',
      isTestData: true,
      createdAt: new Date().toISOString()
    }));

    localStorage.setItem('billqyro_testlab_customers', JSON.stringify(fakeCustomers));
    loadStats();
  };

  const generateDemoInvoices = () => {
    const existingCustomers = JSON.parse(localStorage.getItem('billqyro_testlab_customers') || '[]');
    
    const fakeInvoices = Array.from({ length: 100 }).map((_, i) => {
      const isPaid = Math.random() > 0.4;
      const total = Math.floor(500 + Math.random() * 5000);
      return {
        id: `test-inv-${Date.now()}-${i}`,
        invoiceNumber: `DEMO-${1000 + i}`,
        customerId: existingCustomers.length > 0 ? existingCustomers[i % existingCustomers.length].id : 'unlinked',
        customerName: existingCustomers.length > 0 ? existingCustomers[i % existingCustomers.length].name : 'Walk-in Customer',
        totalAmount: total,
        paidAmount: isPaid ? total : (Math.random() > 0.5 ? Math.floor(total / 2) : 0),
        status: isPaid ? 'paid' : (Math.random() > 0.5 ? 'partial' : 'unpaid'),
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
        isTestData: true
      };
    });

    localStorage.setItem('billqyro_testlab_invoices', JSON.stringify(fakeInvoices));
    loadStats();
  };

  const generateDemoReports = () => {
    const existingInvoices = JSON.parse(localStorage.getItem('billqyro_testlab_invoices') || '[]');
    let totalSales = 0;
    let pendingDue = 0;
    let paidAmount = 0;

    existingInvoices.forEach(inv => {
      totalSales += inv.totalAmount;
      paidAmount += inv.paidAmount;
      pendingDue += (inv.totalAmount - inv.paidAmount);
    });

    const reportData = {
      totalSales: totalSales || 150000,
      pendingDue: pendingDue || 45000,
      paidAmount: paidAmount || 105000,
      customerCount: stats.customers || 50,
      invoiceCount: stats.invoices || 100,
      generatedAt: new Date().toISOString(),
      isTestData: true
    };

    localStorage.setItem('billqyro_testlab_reports', JSON.stringify(reportData));
    loadStats();
  };

  const setPersona = (personaName) => {
    localStorage.setItem('billqyro_testlab_persona', personaName);
    loadStats();
    toast.success(`${personaName} demo mode activated!`, { icon: '✨' });
  };

  const clearTestData = () => {
    if (window.confirm("Are you sure you want to delete all test lab data? Production data will NOT be affected.")) {
      localStorage.removeItem('billqyro_testlab_customers');
      localStorage.removeItem('billqyro_testlab_invoices');
      localStorage.removeItem('billqyro_testlab_reports');
      localStorage.removeItem('billqyro_testlab_persona');
      loadStats();
      toast.success('Test lab data cleared.', { icon: '🧹' });
    }
  };

  const handleAction = async (type) => {
    setIsGenerating(type);
    // Add artificial delay to simulate processing and give user visual feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (type === 'customers') {
      generateDemoCustomers();
      toast.success('50 fake customers generated!', { icon: '🧪' });
    } else if (type === 'invoices') {
      generateDemoInvoices();
      toast.success('100 fake invoices generated!', { icon: '🧪' });
    } else if (type === 'reports') {
      generateDemoReports();
      toast.success('Demo reports generated!', { icon: '📊' });
    } else if (type === 'clear') {
      clearTestData();
    }
    
    setIsGenerating('');
  };

  const personas = [
    { name: 'Doctor', icon: '🩺', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { name: 'Teacher', icon: '📚', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Embroidery', icon: '🧵', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { name: 'Tailor', icon: '✂️', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { name: 'Retail', icon: '🏪', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { name: 'Service', icon: '🔧', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    { name: 'Freelancer', icon: '💻', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  ];

  if (previewMode) {
    const reportData = JSON.parse(localStorage.getItem('billqyro_testlab_reports') || '{"totalSales":0,"pendingDue":0,"paidAmount":0}');
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <div>
            <h3 className="text-emerald-400 font-bold flex items-center">
              <Play className="w-4 h-4 mr-2" /> Live Demo Preview
            </h3>
            <p className="text-emerald-400/70 text-sm">Rendering static UI from local test lab data.</p>
          </div>
          <button 
            onClick={() => setPreviewMode(false)}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Preview
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50">
            <p className="text-slate-400 font-medium mb-1">Total {stats.persona === 'Doctor' ? 'Clinic Revenue' : 'Sales'}</p>
            <h2 className="text-3xl font-black text-white">₹{reportData.totalSales.toLocaleString()}</h2>
          </div>
          <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50">
            <p className="text-slate-400 font-medium mb-1">Total Collected</p>
            <h2 className="text-3xl font-black text-emerald-400">₹{reportData.paidAmount.toLocaleString()}</h2>
          </div>
          <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50">
            <p className="text-slate-400 font-medium mb-1">Pending Due</p>
            <h2 className="text-3xl font-black text-rose-400">₹{reportData.pendingDue.toLocaleString()}</h2>
          </div>
        </div>
        
        <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50 text-center h-64 flex flex-col justify-center items-center">
          <BarChart2 className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Chart visualization would render here using test data.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Beaker className="w-6 h-6 mr-3 text-rose-500" /> Owner Test Lab
          </h2>
          <p className="text-slate-400 text-sm mt-1">Generate sandbox data for testing and demos.</p>
        </div>
        {stats.reports && (
          <button 
            onClick={() => setPreviewMode(true)}
            className="flex items-center px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-sm font-bold rounded-lg transition-colors"
          >
            <Play className="w-4 h-4 mr-2" /> Preview Demo Dashboard
          </button>
        )}
      </div>
      
      {/* Visual Feedback Counters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Users className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-slate-400 text-sm mr-2">Test Customers:</span>
          <span className="text-white font-bold">{stats.customers}</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <FileText className="w-4 h-4 text-emerald-400 mr-2" />
          <span className="text-slate-400 text-sm mr-2">Test Invoices:</span>
          <span className="text-white font-bold">{stats.invoices}</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <BarChart2 className="w-4 h-4 text-purple-400 mr-2" />
          <span className="text-slate-400 text-sm mr-2">Demo Reports:</span>
          <span className={stats.reports ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
            {stats.reports ? 'Ready' : 'Not generated'}
          </span>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Video className="w-4 h-4 text-amber-400 mr-2" />
          <span className="text-slate-400 text-sm mr-2">Active Persona:</span>
          <span className="text-white font-bold">{stats.persona}</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-rose-400 font-bold mb-1">Safe Sandbox Environment</h3>
          <p className="text-rose-400/70 text-sm">
            Test Lab never touches real user data. All generated data is kept in a separate local namespace and will not affect production systems.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Fake Customers */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold mb-2">Fake Customers</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">Generates 50 realistic customer profiles with randomized names and phone numbers.</p>
          </div>
          <button 
            onClick={() => handleAction('customers')}
            disabled={isGenerating !== ''}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'customers' ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>

        {/* Fake Invoices */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold mb-2">Fake Invoices</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">Creates 100 historical invoices spanning the last 6 months with varied amounts.</p>
          </div>
          <button 
            onClick={() => handleAction('invoices')}
            disabled={isGenerating !== '' || stats.customers === 0}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'invoices' ? <Loader className="w-4 h-4 animate-spin" /> : (stats.customers === 0 ? 'Need Customers First' : 'Generate')}
          </button>
        </div>

        {/* Demo Report */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold mb-2">Demo Reports</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">Generates rich analytics and financial reports for the dashboard view.</p>
          </div>
          <button 
            onClick={() => handleAction('reports')}
            disabled={isGenerating !== '' || stats.invoices === 0}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'reports' ? <Loader className="w-4 h-4 animate-spin" /> : (stats.invoices === 0 ? 'Need Invoices First' : 'Generate')}
          </button>
        </div>

        {/* Clear Data */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-rose-500/50 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-center w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold mb-2">Clear Test Data</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">Wipes all mock data from the local sandbox. Does not affect real user data.</p>
          </div>
          <button 
            onClick={() => handleAction('clear')}
            disabled={isGenerating !== ''}
            className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'clear' ? <Loader className="w-4 h-4 animate-spin" /> : 'Clear Data'}
          </button>
        </div>

      </div>
      
      {/* Video Mode Personas */}
      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 mt-8">
        <h3 className="text-white font-bold mb-2 flex items-center text-lg">
          <Video className="w-5 h-5 mr-3 text-amber-500" /> Demo Personas (Video Mode)
        </h3>
        <p className="text-slate-400 text-sm mb-6 max-w-2xl">
          One-click setup to transform the dashboard into a specific business type. Ideal for recording Instagram Reels, TikToks, or YouTube Tutorials.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {personas.map(persona => (
            <button 
              key={persona.name} 
              onClick={() => setPersona(persona.name)}
              className={`flex items-center p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 hover:shadow-lg ${
                stats.persona === persona.name 
                  ? 'bg-amber-500/20 text-white border-amber-500 ring-2 ring-amber-500/50' 
                  : `${persona.color} hover:brightness-125`
              }`}
            >
              <span className="text-2xl mr-3">{persona.icon}</span>
              <span className="font-bold text-sm tracking-wide">{persona.name}</span>
              {stats.persona === persona.name && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OwnerTestLab;
