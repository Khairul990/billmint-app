import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToggleRight, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getGlobalAdminSettings, updateGlobalAdminSettings } from '../../services/dbEngine';

const FeatureSwitchCenter = () => {
  const [features, setFeatures] = useState({
    liveLink: true,
    paymentProof: true,
    pdfTemplates: true,
    multiWorkspace: true,
    premiumFeatures: true,
    reports: true,
    dueLedger: true,
    demoMode: false,
    customerPortal: true,
    studentPortal: true,
    offlineMode: true,
    qrCode: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const settings = await getGlobalAdminSettings();
        if (settings && settings.features) {
          setFeatures(prev => ({ ...prev, ...settings.features }));
        }
      } catch (e) {
        console.error('Failed to load global features', e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  const handleToggle = async (key) => {
    const nextState = { ...features, [key]: !features[key] };
    setFeatures(nextState);
    toast.success(`Feature ${key} ${nextState[key] ? 'enabled' : 'disabled'}`);
    
    // Save to Firestore
    try {
      await updateGlobalAdminSettings({ features: nextState });
    } catch (e) {
      toast.error('Failed to sync global settings to cloud.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ToggleRight className="w-6 h-6 mr-3 text-indigo-500" /> Feature Switch Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Globally enable or disable platform features.</p>
        </div>
      </div>

      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-rose-400 text-sm font-bold">Disabling a feature will hide it for all users immediately.</p>
          <p className="text-rose-400/70 text-xs mt-1">Users will see a polite message: "This feature is temporarily disabled by the platform owner."</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-colors">
                <span className="text-sm font-bold text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button 
                  onClick={() => handleToggle(key)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FeatureSwitchCenter;
