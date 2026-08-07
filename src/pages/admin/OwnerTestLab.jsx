import React, { useState, useEffect } from 'react';
import { Beaker, Users, FileText, RefreshCw, Loader, AlertTriangle, Trash2, Video, BarChart2, CheckCircle2, Play, ArrowLeft, Power, Box, ArrowRight, Eye, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { generateSmartDemoData } from '../../utils/demoDataGenerator';
import { clearDemoData, generateFakeAdminData } from '../../utils/demoDataManager';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState('');
  const [stats, setStats] = useState({
    customers: 0, invoices: 0, products: 0, reports: false, persona: 'None', videoCreator: false
  });
  const [demoActive, setDemoActive] = useState(false);
  const [demoPayments, setDemoPayments] = useState([]);
  const [adminSimActive, setAdminSimActive] = useState(false);

  const loadStats = () => {
    const customers = JSON.parse(localStorage.getItem('billqyro_demo_customers') || '[]');
    const invoices = JSON.parse(localStorage.getItem('billqyro_demo_invoices') || '[]');
    const products = JSON.parse(localStorage.getItem('billqyro_demo_products') || '[]');
    const reports = localStorage.getItem('billqyro_demo_reports') !== null;
    const persona = localStorage.getItem('billqyro_demo_session_persona') || 'None';
    const isActive = localStorage.getItem('billqyro_demo_session_active') === 'true';
    const videoCreator = localStorage.getItem('billqyro_demo_video_creator') === 'true';
    const payments = JSON.parse(localStorage.getItem('billqyro_demo_payments') || '[]');
    const adminData = localStorage.getItem('billqyro_demo_admin_data');

    setStats({ customers: customers.length, invoices: invoices.length, products: products.length, reports, persona, videoCreator });
    setDemoActive(isActive);
    setDemoPayments(payments);
    setAdminSimActive(!!adminData);
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
    
    let totalSales = 0, pendingDue = 0, paidAmount = 0;
    invoices.forEach(inv => { totalSales += inv.grandTotal; paidAmount += inv.amountPaid; pendingDue += inv.balanceDue; });
    const reportsPayload = { totalSales, pendingDue, paidAmount, customerCount: customers.length, invoiceCount: invoices.length, generatedAt: new Date().toISOString() };
    localStorage.setItem('billqyro_demo_reports', JSON.stringify(reportsPayload));
    
    loadStats();
    toast.success(`Complete realistic ${stats.persona} sandbox generated!`, { icon: '🧪' });
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
      toast.success('Video Creator Mode enabled.', { icon: '🎥' });
    }
    loadStats();
  };

  const clearTestData = () => {
    if (window.confirm("Delete all demo sandbox data?")) {
      clearDemoData();
      localStorage.removeItem('billqyro_demo_session_persona');
      localStorage.removeItem('billqyro_demo_session_active');
      localStorage.removeItem('billqyro_demo_video_creator');
      loadStats();
      toast.success('Demo sandbox cleared.', { icon: '🧹' });
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
      toast.success('Demo session started. Real data hidden.', { icon: '🎬' });
    }
    window.dispatchEvent(new Event('storage'));
  };

  const startDemoJourney = () => {
    if (window.confirm("Start Full Demo Journey?")) {
      clearDemoData();
      localStorage.removeItem('billqyro_demo_settings');
      localStorage.removeItem('billqyro_demo_logged_in');
      localStorage.setItem('billqyro_demo_session_active', 'true');
      localStorage.setItem('billqyro_demo_journey_mode', 'true');
      toast.success('Starting Full Demo Journey...', { icon: '🚀' });
      window.location.href = '/';
    }
  };

  const handleAdminPanelSimulator = () => {
    if (adminSimActive) {
      localStorage.removeItem('billqyro_demo_admin_data');
      toast.success('Admin Panel Simulator Cleared');
      setAdminSimActive(false);
    } else {
      generateFakeAdminData();
      toast.success('Fake Admin Data Generated! See Dashboard.');
      setAdminSimActive(true);
    }
  };

  const personas = [
    { name: 'Doctor', icon: '🩺', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
    { name: 'Teacher', icon: '📚', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    { name: 'Embroidery', icon: '🧵', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
    { name: 'Retail', icon: '🏪', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-theme-danger/10 text-theme-danger flex items-center justify-center border border-theme-danger/20 shadow-glass">
            <Beaker className="w-6 h-6" />
          </div>
          Premium Test Lab
        </h2>
        <p className="text-theme-secondary text-sm mt-2">Generate sandbox data, mock live links, and manage Demo Sessions safely with zero impact on production data.</p>
      </div>
      
      <div className="glass-panel border-theme-danger/30 bg-theme-danger/5 p-4 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-theme-danger/20 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-theme-danger" />
        </div>
        <div>
          <h3 className="text-theme-danger font-black mb-1">Strict Isolation Enabled</h3>
          <p className="text-theme-danger/80 text-xs font-semibold">
            Everything modified here stays in temporary local memory. Production Firestore writes are fully disabled during demo mode.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Persona */}
        <div className="glass-panel p-6">
          <div className="glass-content">
            <h3 className="text-theme-primary font-black text-lg flex items-center mb-4">
              <span className="w-6 h-6 rounded-full bg-theme-accent/20 text-theme-accent text-xs flex items-center justify-center mr-2">1</span> Choose Demo Persona
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {personas.map(persona => (
                <button 
                  key={persona.name} 
                  onClick={() => setPersona(persona.name)}
                  className={`flex items-center p-3 rounded-xl border transition-all ${
                    stats.persona === persona.name 
                      ? 'bg-theme-accent text-white border-theme-accent shadow-premium-sm scale-105' 
                      : `${persona.color}`
                  }`}
                >
                  <span className="text-xl mr-2">{persona.icon}</span>
                  <span className="font-bold text-xs">{persona.name}</span>
                  {stats.persona === persona.name && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Generation */}
        <div className="glass-panel p-6">
          <div className="glass-content flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-primary font-black text-lg flex items-center">
                <span className="w-6 h-6 rounded-full bg-theme-accent/20 text-theme-accent text-xs flex items-center justify-center mr-2">2</span> Generate Sandbox Data
              </h3>
              <span className="bg-theme-success/10 text-theme-success border border-theme-success/20 px-2 py-1 rounded-full text-[10px] font-black">
                {stats.customers} Cust / {stats.invoices} Inv
              </span>
            </div>
            <p className="text-xs text-theme-secondary mb-4 flex-1">
              Instantly create realistic fake customers, products, and invoices to preview the dashboard exactly how users see it.
            </p>
            <button onClick={generateDemoData} disabled={isGenerating !== ''} className="btn-premium w-full text-sm">
              {isGenerating === 'all' ? <Loader className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Generate Mock Dataset</>}
            </button>
          </div>
        </div>

        {/* Admin Panel Simulator */}
        <div className="glass-panel p-6">
          <div className="glass-content">
            <h3 className="text-theme-primary font-black text-lg flex items-center mb-4">
              <span className="w-6 h-6 rounded-full bg-theme-accent/20 text-theme-accent text-xs flex items-center justify-center mr-2">3</span> Admin Simulator
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Generate fake users, massive revenue figures, and cloud sync logs to make the Admin Dashboard look busy.
            </p>
            <button onClick={handleAdminPanelSimulator} className={`w-full text-sm font-bold flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${adminSimActive ? 'bg-theme-danger/10 text-theme-danger border-theme-danger/30 hover:bg-theme-danger/20' : 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 hover:bg-theme-accent/20'}`}>
              <BarChart2 className="w-4 h-4" /> {adminSimActive ? 'Clear Fake Admin Data' : 'Generate Fake Admin Stats'}
            </button>
            {adminSimActive && (
              <div className="mt-4 p-3 bg-theme-success/10 border border-theme-success/20 rounded-lg text-theme-success text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Admin metrics injected. Check Dashboard.
              </div>
            )}
          </div>
        </div>

        {/* Video Creator Mode */}
        <div className="glass-panel p-6">
          <div className="glass-content">
            <h3 className="text-theme-primary font-black text-lg flex items-center mb-4">
               <span className="w-6 h-6 rounded-full bg-theme-accent/20 text-theme-accent text-xs flex items-center justify-center mr-2">4</span> Video Creator Mode
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Mask sensitive emails, phone numbers, and keys for recording demo videos or YouTube tutorials.
            </p>
            <button onClick={toggleVideoCreatorMode} className={`w-full text-sm font-bold flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${stats.videoCreator ? 'bg-theme-success text-white shadow-premium-sm border-theme-success/50' : 'bg-theme-surface-hover text-theme-primary border-theme-border-soft'}`}>
              <Video className="w-4 h-4" /> {stats.videoCreator ? 'Creator Mode Active' : 'Enable Creator Mode'}
            </button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="glass-panel p-6 md:col-span-2 border-theme-danger/20 bg-theme-danger/5">
          <div className="glass-content flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-theme-danger font-black text-lg mb-1">Clear Sandbox Environment</h3>
              <p className="text-theme-danger/70 text-xs font-semibold">Deletes all fake data, payments, and generated reports from local memory.</p>
            </div>
            <button onClick={clearTestData} className="whitespace-nowrap bg-theme-danger text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-theme-danger/90 transition-all hover:-translate-y-[1px] shadow-lg shadow-theme-danger/30">
              <Trash2 className="w-4 h-4" /> Clear All Sandbox Data
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default OwnerTestLab;
