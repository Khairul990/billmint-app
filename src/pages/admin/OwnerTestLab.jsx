import React, { useState, useEffect } from 'react';
import { Beaker, Users, FileText, RefreshCw, Loader, AlertTriangle, Trash2, Video, BarChart2, CheckCircle2, Play, ArrowLeft, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState('');
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    reports: false,
    persona: 'None'
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  // Load initial stats from local storage
  const loadStats = () => {
    const customers = JSON.parse(localStorage.getItem('billqyro_testlab_customers') || '[]');
    const invoices = JSON.parse(localStorage.getItem('billqyro_testlab_invoices') || '[]');
    const reports = localStorage.getItem('billqyro_testlab_reports') !== null;
    const persona = localStorage.getItem('billqyro_testlab_persona') || 'None';
    const isActive = localStorage.getItem('billqyro_demo_session_active') === 'true';

    setStats({
      customers: customers.length,
      invoices: invoices.length,
      reports,
      persona
    });
    setDemoActive(isActive);
  };

  useEffect(() => {
    loadStats();
    
    const handleStorageChange = () => loadStats();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    
    // Auto-generate reports
    let totalSales = 0;
    let pendingDue = 0;
    let paidAmount = 0;
    fakeInvoices.forEach(inv => {
      totalSales += inv.totalAmount;
      paidAmount += inv.paidAmount;
      pendingDue += (inv.totalAmount - inv.paidAmount);
    });
    const reportData = {
      totalSales: totalSales,
      pendingDue: pendingDue,
      paidAmount: paidAmount,
      customerCount: existingCustomers.length || 50,
      invoiceCount: fakeInvoices.length || 100,
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
      localStorage.removeItem('billqyro_demo_session_active');
      loadStats();
      toast.success('Test lab data cleared.', { icon: '🧹' });
      // Notify other tabs/components
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleAction = async (type) => {
    setIsGenerating(type);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (type === 'customers') {
      generateDemoCustomers();
      toast.success('50 fake customers generated!', { icon: '🧪' });
    } else if (type === 'invoices') {
      generateDemoInvoices();
      toast.success('100 fake invoices generated!', { icon: '🧪' });
    } else if (type === 'clear') {
      clearTestData();
    }
    
    setIsGenerating('');
  };

  const toggleDemoSession = () => {
    if (demoActive) {
      localStorage.removeItem('billqyro_demo_session_active');
      setDemoActive(false);
      toast.success('Demo session ended. Real data restored.', { icon: '🔒' });
    } else {
      localStorage.setItem('billqyro_demo_session_active', 'true');
      setDemoActive(true);
      toast.success('Demo session started. Real data is safe.', { icon: '🎬' });
    }
    // Dispatch event so main app catches it
    window.dispatchEvent(new Event('storage'));
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

  // Helper for persona labels
  const getLabels = (persona) => {
    switch (persona) {
      case 'Tailor': return { rev: 'Orders', cust: 'Measurements', inv: 'Delivery' };
      case 'Embroidery': return { rev: 'Designs', cust: 'Orders', inv: 'Delivery' };
      case 'Doctor': return { rev: 'Bills', cust: 'Patients', inv: 'Appointments' };
      case 'Teacher': return { rev: 'Fees', cust: 'Students', inv: 'Classes' };
      case 'Retail': return { rev: 'Sales', cust: 'Customers', inv: 'Products' };
      case 'Service': return { rev: 'Jobs', cust: 'Clients', inv: 'Devices' };
      default: return { rev: 'Revenue', cust: 'Customers', inv: 'Invoices' };
    }
  };
  const labels = getLabels(stats.persona);

  if (previewMode) {
    const reportData = JSON.parse(localStorage.getItem('billqyro_testlab_reports') || '{"totalSales":0,"pendingDue":0,"paidAmount":0,"customerCount":0,"invoiceCount":0}');
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
            <p className="text-slate-400 font-medium mb-1">Total {labels.rev}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50 text-center">
             <h3 className="text-4xl font-black text-blue-400">{reportData.customerCount}</h3>
             <p className="text-slate-400 font-medium mt-2">Fake {labels.cust}</p>
          </div>
          <div className="bg-[#1e293b]/60 p-6 rounded-2xl border border-slate-700/50 text-center">
             <h3 className="text-4xl font-black text-purple-400">{reportData.invoiceCount}</h3>
             <p className="text-slate-400 font-medium mt-2">Fake {labels.inv}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Beaker className="w-6 h-6 mr-3 text-rose-500" /> Owner Test Lab
          </h2>
          <p className="text-slate-400 text-sm mt-1">Generate sandbox data and manage demo sessions safely.</p>
        </div>
      </div>
      
      {/* Warning Banner */}
      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-rose-400 font-bold mb-1">Generated demo data is for preview and video recording only.</h3>
          <p className="text-rose-400/70 text-sm">
            It will not appear in real customer accounts. All generated data is kept in a separate local namespace and will not affect production systems.
          </p>
        </div>
      </div>

      {/* Step Guide UI */}
      <div className="space-y-6">
        
        {/* Step 1: Persona */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">1</div>
            <h3 className="text-white font-bold text-lg flex items-center">
              <Video className="w-5 h-5 mr-2 text-amber-500" /> Choose Persona
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-11">
            {personas.map(persona => (
              <button 
                key={persona.name} 
                onClick={() => setPersona(persona.name)}
                className={`flex items-center p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 hover:shadow-lg ${
                  stats.persona === persona.name 
                    ? 'bg-amber-500/20 text-white border-amber-500 ring-2 ring-amber-500/50' 
                    : `${persona.color} hover:brightness-125`
                }`}
              >
                <span className="text-xl mr-2">{persona.icon}</span>
                <span className="font-bold text-xs tracking-wide">{persona.name}</span>
                {stats.persona === persona.name && <CheckCircle2 className="w-3 h-3 ml-auto text-amber-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 & 3: Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">2</div>
                <h3 className="text-white font-bold text-lg">Generate Customers</h3>
              </div>
              <span className="text-slate-400 text-sm font-bold bg-slate-800 px-3 py-1 rounded-full">{stats.customers} ready</span>
            </div>
            <button 
              onClick={() => handleAction('customers')}
              disabled={isGenerating !== ''}
              className="ml-11 w-[calc(100%-2.75rem)] py-3 bg-[#0f172a] hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
            >
              {isGenerating === 'customers' ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate 50 Fake Customers'}
            </button>
          </div>

          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">3</div>
                <h3 className="text-white font-bold text-lg">Generate Invoices</h3>
              </div>
              <span className="text-slate-400 text-sm font-bold bg-slate-800 px-3 py-1 rounded-full">{stats.invoices} ready</span>
            </div>
            <button 
              onClick={() => handleAction('invoices')}
              disabled={isGenerating !== '' || stats.customers === 0}
              className="ml-11 w-[calc(100%-2.75rem)] py-3 bg-[#0f172a] hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
            >
              {isGenerating === 'invoices' ? <Loader className="w-4 h-4 animate-spin" /> : (stats.customers === 0 ? 'Need Customers First' : 'Generate 100 Fake Invoices')}
            </button>
          </div>
        </div>

        {/* Step 4: Preview Dashboard */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">4</div>
              <h3 className="text-white font-bold text-lg">Preview & Verify</h3>
            </div>
          </div>
          <p className="ml-11 text-slate-400 text-sm mb-4">Check how your demo data looks with the active persona labels.</p>
          <button 
            onClick={() => setPreviewMode(true)}
            disabled={!stats.reports}
            className="ml-11 w-[calc(100%-2.75rem)] py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            <BarChart2 className="w-4 h-4 mr-2" /> {stats.reports ? 'Preview Demo Dashboard' : 'Generate Data First'}
          </button>
        </div>

        {/* Step 5: Demo Session Control */}
        <div className={`backdrop-blur-md p-6 rounded-3xl border transition-all ${demoActive ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-[#1e293b]/60 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${demoActive ? 'bg-amber-500 text-amber-950' : 'bg-slate-700 text-white'}`}>5</div>
              <h3 className={`${demoActive ? 'text-amber-400' : 'text-white'} font-bold text-lg`}>Demo Session</h3>
            </div>
            {demoActive && <span className="bg-amber-500 text-amber-950 px-3 py-1 rounded-full text-xs font-bold animate-pulse">ACTIVE</span>}
          </div>
          <p className="ml-11 text-slate-400 text-sm mb-4">
            Starting a demo session will temporarily override the entire app to show your generated fake data.
          </p>
          <div className="ml-11 flex flex-col md:flex-row gap-4 w-[calc(100%-2.75rem)]">
            <button 
              onClick={toggleDemoSession}
              disabled={!stats.reports && !demoActive}
              className={`flex-1 py-3 font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50 ${
                demoActive 
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-amber-950'
              }`}
            >
              <Power className="w-4 h-4 mr-2" /> {demoActive ? 'End Demo Session' : 'Start Demo Session'}
            </button>
            <button 
              onClick={() => handleAction('clear')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl flex justify-center items-center transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Test Data
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default OwnerTestLab;
