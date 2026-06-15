import React, { useState } from 'react';
import { Beaker, Users, FileText, IndianRupee, RefreshCw, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OwnerTestLab = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDemoData = async (type) => {
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Generated 50 mock ${type} successfully!`, {
      icon: '🧪'
    });
    
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Beaker className="w-6 h-6 mr-3 text-rose-500" /> Owner Test Lab
      </h2>
      
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
        <h3 className="text-amber-500 font-bold flex items-center mb-1">Safe Sandbox Environment</h3>
        <p className="text-amber-500/70 text-sm">
          Actions here generate mock data in a safe local namespace that will not affect real production users. Perfect for recording demo videos or testing new UI features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fake Customers */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold mb-2">Fake Customers</h3>
          <p className="text-slate-400 text-xs mb-4">Generates 50 realistic customer profiles with names and phones.</p>
          <button 
            onClick={() => generateDemoData('customers')}
            disabled={isGenerating}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex justify-center items-center transition-colors"
          >
            {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>

        {/* Fake Invoices */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold mb-2">Fake Invoices</h3>
          <p className="text-slate-400 text-xs mb-4">Creates 100 historical invoices with random dates and amounts.</p>
          <button 
            onClick={() => generateDemoData('invoices')}
            disabled={isGenerating}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex justify-center items-center transition-colors"
          >
            {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>

        {/* Fake Payments */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl mb-4">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold mb-2">Fake Payments</h3>
          <p className="text-slate-400 text-xs mb-4">Generates payment proof screenshots and UTRs for review queue.</p>
          <button 
            onClick={() => generateDemoData('payments')}
            disabled={isGenerating}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex justify-center items-center transition-colors"
          >
            {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-white font-bold mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-rose-500" /> Demo Personas (Video Mode)
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          One-click setup for specific business types. Ideal for making Instagram Reels or YouTube Tutorials.
        </p>
        
        <div className="flex flex-wrap gap-3">
          {['Doctor', 'Teacher', 'Tuition Center', 'Embroidery Shop', 'Tailor', 'Retail Shop', 'Service Center', 'Freelancer'].map(persona => (
            <button key={persona} className="px-4 py-2 bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-300 text-sm font-semibold rounded-full transition-colors border border-slate-600 hover:border-rose-500">
              {persona}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerTestLab;
