import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ToggleRight, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../../services/adminEngine';
import { Card, CardContent } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';

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
        const settings = await adminEngine.getGlobalSettings();
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
    
    try {
      await adminEngine.updateGlobalSettings({ features: nextState });
    } catch {
      toast.error('Failed to sync global settings to cloud.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <ToggleRight className="w-8 h-8 mr-3 text-theme-accent" /> Feature Switch Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Globally enable or disable platform features.</p>
        </div>
      </div>

      <Card className="bg-theme-danger/10 border-theme-danger/20 shadow-none">
        <CardContent className="p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-theme-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-theme-danger text-sm font-bold">Disabling a feature will hide it for all users immediately.</p>
            <p className="text-theme-danger/80 text-xs mt-1">Users will see a polite message: "This feature is temporarily disabled by the platform owner."</p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <CardContent className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-theme-surface-elevated border border-theme-border-soft rounded-xl hover:border-theme-accent/30 transition-colors">
                  <span className="text-sm font-bold text-theme-primary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Switch checked={value} onChange={() => handleToggle(key)} />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default memo(FeatureSwitchCenter);
