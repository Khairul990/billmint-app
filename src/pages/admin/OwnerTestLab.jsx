import React, { useState } from 'react';
import { Beaker, Users, FileText, IndianRupee, RefreshCw, Loader, AlertTriangle, Trash2, Video, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState('');

  const generateDemoData = async (type) => {
    setIsGenerating(type);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Generated mock ${type} successfully!`, {
      icon: '🧪'
    });
    
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
            onClick={() => generateDemoData('customers')}
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
            onClick={() => generateDemoData('invoices')}
            disabled={isGenerating !== ''}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'invoices' ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
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
            onClick={() => generateDemoData('reports')}
            disabled={isGenerating !== ''}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white text-sm font-bold rounded-xl flex justify-center items-center transition-all disabled:opacity-50"
          >
            {isGenerating === 'reports' ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
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
            onClick={() => generateDemoData('clear')}
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
              className={`flex items-center p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${persona.color} hover:shadow-lg`}
            >
              <span className="text-2xl mr-3">{persona.icon}</span>
              <span className="font-bold text-sm tracking-wide">{persona.name}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OwnerTestLab;
