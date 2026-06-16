import React, { useState, useEffect } from 'react';
import { Beaker, Users, FileText, RefreshCw, Loader, AlertTriangle, Trash2, Video, BarChart2, CheckCircle2, Play, ArrowLeft, Power, Box, ArrowRight, Eye, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateSmartDemoData } from '../../utils/demoDataGenerator';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState('');
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    products: 0,
    reports: false,
    persona: 'None',
    videoCreator: false
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [demoPayments, setDemoPayments] = useState([]);

  const loadStats = () => {
    const customers = JSON.parse(localStorage.getItem('billqyro_demo_customers') || '[]');
    const invoices = JSON.parse(localStorage.getItem('billqyro_demo_invoices') || '[]');
    const products = JSON.parse(localStorage.getItem('billqyro_demo_products') || '[]');
    const reports = localStorage.getItem('billqyro_demo_reports') !== null;
    const persona = localStorage.getItem('billqyro_demo_session_persona') || 'None';
    const isActive = localStorage.getItem('billqyro_demo_session_active') === 'true';
    const videoCreator = localStorage.getItem('billqyro_demo_video_creator') === 'true';
    const payments = JSON.parse(localStorage.getItem('billqyro_demo_payments') || '[]');

    setStats({
      customers: customers.length,
      invoices: invoices.length,
      products: products.length,
      reports,
      persona,
      videoCreator
    });
    setDemoActive(isActive);
    setDemoPayments(payments);
  };

  useEffect(() => {
    loadStats();
    const handleStorageChange = () => loadStats();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const generateDemoData = async () => {
    setIsGenerating('all');
    await new Promise(resolve => setTimeout(resolve, 800));

    const { products, customers, invoices, payments } = generateSmartDemoData(stats.persona);

    localStorage.setItem('billqyro_demo_products', JSON.stringify(products));
    localStorage.setItem('billqyro_demo_customers', JSON.stringify(customers));
    localStorage.setItem('billqyro_demo_invoices', JSON.stringify(invoices));
    localStorage.setItem('billqyro_demo_payments', JSON.stringify(payments));
    
    // Auto-generate reports metadata
    let totalSales = 0, pendingDue = 0, paidAmount = 0;
    invoices.forEach(inv => {
      totalSales += inv.totalAmount;
      paidAmount += inv.paidAmount;
      pendingDue += (inv.totalAmount - inv.paidAmount);
    });
    
    const reportsPayload = {
      totalSales, pendingDue, paidAmount,
      customerCount: customers.length, invoiceCount: invoices.length,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem('billqyro_demo_reports', JSON.stringify(reportsPayload));
    
    loadStats();
    toast.success(`Complete realistic ${stats.persona} sandbox generated!`, { icon: '🧪' });
    setIsGenerating('');
  };
    
    loadStats();
    toast.success('Complete realistic demo sandbox generated!', { icon: '🧪' });
    setIsGenerating('');
  };

  const setPersona = (personaName) => {
    localStorage.setItem('billqyro_demo_session_persona', personaName);
    loadStats();
    toast.success(`${personaName} demo mode activated!`, { icon: '✨' });
  };

  const toggleVideoCreatorMode = () => {
    if (stats.videoCreator) {
      localStorage.removeItem('billqyro_demo_video_creator');
      toast.success('Video Creator Mode disabled.');
    } else {
      localStorage.setItem('billqyro_demo_video_creator', 'true');
      toast.success('Video Creator Mode enabled. Sensitive info will be masked.', { icon: '🎥' });
    }
    loadStats();
  };

  const clearTestData = () => {
    if (window.confirm("Are you sure you want to delete all demo sandbox data? Production data is strictly isolated and will NOT be affected.")) {
      localStorage.removeItem('billqyro_demo_customers');
      localStorage.removeItem('billqyro_demo_invoices');
      localStorage.removeItem('billqyro_demo_products');
      localStorage.removeItem('billqyro_demo_reports');
      localStorage.removeItem('billqyro_demo_payments');
      localStorage.removeItem('billqyro_demo_session_persona');
      localStorage.removeItem('billqyro_demo_session_active');
      localStorage.removeItem('billqyro_demo_video_creator');
      loadStats();
      toast.success('Demo sandbox cleared.', { icon: '🧹' });
      window.dispatchEvent(new Event('storage'));
    }
  };

  const toggleDemoSession = () => {
    if (demoActive) {
      localStorage.removeItem('billqyro_demo_session_active');
      setDemoActive(false);
      toast.success('Demo session ended. Real data restored.', { icon: '🔒' });
    } else {
      localStorage.setItem('billqyro_demo_session_active', 'true');
      setDemoActive(true);
      toast.success('Demo session started. Real data is completely hidden.', { icon: '🎬' });
    }
    window.dispatchEvent(new Event('storage'));
  };

  const startDemoJourney = () => {
    if (window.confirm("Start Full Demo Journey? This will clear old demo data and simulate a completely new user experience.")) {
      localStorage.removeItem('billqyro_demo_customers');
      localStorage.removeItem('billqyro_demo_invoices');
      localStorage.removeItem('billqyro_demo_products');
      localStorage.removeItem('billqyro_demo_reports');
      localStorage.removeItem('billqyro_demo_payments');
      localStorage.removeItem('billqyro_demo_settings');
      localStorage.removeItem('billqyro_demo_logged_in');
      
      localStorage.setItem('billqyro_demo_session_active', 'true');
      localStorage.setItem('billqyro_demo_journey_mode', 'true');
      
      toast.success('Starting Full Demo Journey...', { icon: '🚀' });
      window.location.href = '/';
    }
  };

  const handleDemoProof = (id, action) => {
    const updated = demoPayments.map(p => {
      if (p.id === id) p.status = action;
      return p;
    });
    localStorage.setItem('billqyro_demo_payments', JSON.stringify(updated));
    setDemoPayments(updated);
    toast.success(`Demo proof ${action === 'approved' ? 'approved' : 'rejected'}.`);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Beaker className="w-6 h-6 mr-3 text-rose-500" /> Owner Test Lab
          </h2>
          <p className="text-slate-400 text-sm mt-1">Generate sandbox data, mock live links, and manage Demo Sessions safely.</p>
        </div>
      </div>
      
      {/* Warning Banner */}
      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-rose-400 font-bold mb-1">Strict Isolation Enabled. Real User Data Is Never Touched.</h3>
          <p className="text-rose-400/70 text-sm">
            Everything generated or modified during a Demo Session is stored entirely inside temporary local sandbox keys (`billqyro_demo_*`). Production Firestore writes are fully disabled during demo mode.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Step 1: Persona */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">1</div>
            <h3 className="text-white font-bold text-lg flex items-center">
               Choose Demo Persona
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

        {/* Step 2: Generation */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">2</div>
              <h3 className="text-white font-bold text-lg">Generate Sandbox Data</h3>
            </div>
            <span className="text-slate-400 text-sm font-bold bg-slate-800 px-3 py-1 rounded-full">
              {stats.customers} Cust / {stats.products} Prod / {stats.invoices} Inv
            </span>
          </div>
          <button 
            onClick={generateDemoData}
            disabled={isGenerating !== ''}
            className="ml-11 w-[calc(100%-2.75rem)] py-3 bg-[#0f172a] hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'all' ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate Complete Persona Dataset'}
          </button>
        </div>

        {/* Demo Preview Reports */}
        {stats.reports && (() => {
          const rep = JSON.parse(localStorage.getItem('billqyro_demo_reports') || '{}');
          return (
            <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-indigo-500/30">
              <h3 className="text-indigo-400 font-bold text-lg mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2" /> Demo Preview Reports
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Collection</p>
                  <p className="text-white text-xl font-black">₹{rep.paidAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-rose-400 text-xs font-bold uppercase mb-1">Pending Due</p>
                  <p className="text-white text-xl font-black">₹{rep.pendingDue?.toLocaleString()}</p>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Sales</p>
                  <p className="text-white text-xl font-black">₹{rep.totalSales?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Step 3: Video Creator Mode */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">3</div>
              <h3 className="text-white font-bold text-lg">Video Creator Mode</h3>
            </div>
            {stats.videoCreator && <span className="text-amber-500 text-xs font-bold border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-full">Active</span>}
          </div>
          <p className="ml-11 text-slate-400 text-sm mb-4">
            Masks your real email, phone, and business logos with generic placeholders for clean YouTube or Instagram recording.
          </p>
          <button 
            onClick={toggleVideoCreatorMode}
            className={`ml-11 w-[calc(100%-2.75rem)] py-3 font-bold rounded-xl flex justify-center items-center transition-all ${
              stats.videoCreator ? 'bg-amber-500 hover:bg-amber-400 text-amber-950' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
            }`}
          >
            <Video className="w-4 h-4 mr-2" /> {stats.videoCreator ? 'Disable Video Creator Mode' : 'Enable Video Creator Mode'}
          </button>
        </div>

        {/* Step 4 & 5: Demo Session Control & Guided Journey */}
        <div className={`backdrop-blur-md p-6 rounded-3xl border transition-all ${demoActive ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-[#1e293b]/60 border-slate-700/50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${demoActive ? 'bg-amber-500 text-amber-950' : 'bg-slate-700 text-white'}`}>4</div>
              <h3 className={`${demoActive ? 'text-amber-400' : 'text-white'} font-bold text-lg`}>Guided Demo Journey</h3>
            </div>
            {demoActive && <span className="bg-amber-500 text-amber-950 px-3 py-1 rounded-full text-xs font-bold animate-pulse">LIVE</span>}
          </div>
          <p className="ml-11 text-slate-400 text-sm mb-4">
            Follow the guided journey to experience BillQyro from a new user's perspective, or open the workspace directly.
          </p>

          {/* Guided Checklist UI */}
          <div className="ml-11 mb-6 p-4 bg-black/20 rounded-xl border border-slate-700/50">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Journey Flow Preview</h4>
            <div className="flex flex-wrap gap-2">
              {['Login Demo', 'Welcome Board', 'Business Setup', 'Dashboard', 'Create Invoice', 'Download PDF', 'Live Link', 'View Reports'].map((step, idx) => (
                <div key={idx} className="flex items-center text-xs font-semibold text-slate-300">
                  <span className="text-emerald-500 mr-1.5">•</span> {step}
                </div>
              ))}
            </div>
          </div>

          <div className="ml-11 flex flex-col md:flex-row gap-4 w-[calc(100%-2.75rem)]">
            <button 
              onClick={toggleDemoSession}
              disabled={!stats.reports && !demoActive}
              className={`flex-1 py-3 font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50 ${
                demoActive 
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
              }`}
            >
              <Power className="w-4 h-4 mr-2" /> {demoActive ? 'End Session' : 'Direct Demo Mode'}
            </button>
            <button 
              onClick={() => {
                if (!demoActive) toast.error('Start Demo Session first!');
                else window.location.href = '/';
              }}
              disabled={!demoActive}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
            >
              <Eye className="w-4 h-4 mr-2" /> Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
          
          <div className="ml-11 mt-4 w-[calc(100%-2.75rem)] relative group">
            <button 
              onClick={startDemoJourney}
              className="w-full py-4 bg-[image:var(--accent-gradient)] hover:brightness-110 text-white font-black rounded-xl flex justify-center items-center transition-all shadow-glow"
            >
              <Play className="w-5 h-5 mr-2" fill="currentColor" /> START FULL GUIDED JOURNEY
            </button>
          </div>
        </div>

        {/* Step 6: Clear Safety */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold mr-3">5</div>
            <h3 className="text-white font-bold text-lg">Clear Sandbox Data</h3>
          </div>
          <button 
            onClick={clearTestData}
            className="ml-11 px-6 py-3 w-[calc(100%-2.75rem)] bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/30 hover:text-rose-400 text-slate-300 font-bold rounded-xl flex justify-center items-center transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Sandbox Data
          </button>
        </div>

        {/* Demo Payment Proofs Review */}
        {demoPayments.length > 0 && (
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-blue-500/30">
            <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" /> Demo Payment Proofs (Isolated)
            </h3>
            <div className="space-y-3">
              {demoPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-700">
                  <div>
                    <p className="text-white font-bold">₹{payment.amount} <span className="text-slate-400 text-sm font-normal">via</span> {payment.method}</p>
                    <p className="text-slate-400 text-xs mt-1">Inv: {payment.invoiceId} • UTR: {payment.utr}</p>
                  </div>
                  {payment.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleDemoProof(payment.id, 'approved')} className="text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1 rounded-md text-xs font-bold">Approve</button>
                      <button onClick={() => handleDemoProof(payment.id, 'rejected')} className="text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-3 py-1 rounded-md text-xs font-bold">Reject</button>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${payment.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default OwnerTestLab;
