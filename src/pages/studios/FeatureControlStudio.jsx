import React, { useState, useEffect } from 'react';
import { Settings, Shield, Zap, Box, Users, FileText, CreditCard, Link as LinkIcon, Database, Bell, Palette, HardDrive, Cpu, AlertTriangle, Briefcase } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { featureControlEngine } from '../../services/featureControlEngine';
import ClassicLoader from '../../components/ClassicLoader';
import { toast } from 'react-hot-toast';

const CATEGORY_ICONS = {
  invoice: FileText,
  customers: Users,
  products: Box,
  payments: CreditCard,
  liveLink: LinkIcon,
  treasury: Database,
  reports: Settings,
  notifications: Bell,
  security: Shield,
  appearance: Palette,
  backup: HardDrive,
  advanced: Cpu,
  operations: Briefcase
};

const FeatureControlStudio = ({ workspaceId }) => {
  const [features, setFeatures] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feats, cats] = await Promise.all([
        featureControlEngine.getAllFeatures(workspaceId),
        featureControlEngine.getAllCategories(workspaceId)
      ]);
      setFeatures(feats);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load feature controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const handleToggleFeature = async (featureId, currentValue) => {
    try {
      // Optimistic update
      setFeatures(prev => ({
        ...prev,
        [featureId]: {
          ...prev[featureId],
          state: { ...prev[featureId].state, enabled: !currentValue },
          effectiveEnabled: !currentValue && prev[featureId].categoryEnabled && prev[featureId].dependenciesEnabled
        }
      }));
      await featureControlEngine.toggleFeature(workspaceId, featureId, !currentValue);
      toast.success('Feature updated.');
      loadData(); // Re-sync to get correct effective states
    } catch (err) {
      toast.error('Update failed.');
      loadData();
    }
  };

  const handleToggleCategory = async (categoryId, currentValue) => {
    try {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], enabled: !currentValue }
      }));
      await featureControlEngine.toggleCategory(workspaceId, categoryId, !currentValue);
      toast.success('Category updated.');
      loadData();
    } catch (err) {
      toast.error('Update failed.');
      loadData();
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><ClassicLoader /></div>;
  }

  // Group features by category
  const featuresByCategory = Object.values(features).reduce((acc, feat) => {
    if (!acc[feat.category]) acc[feat.category] = [];
    acc[feat.category].push(feat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Module Manager</h2>
            <p className="text-xs text-theme-muted">Enable or disable core modules and advanced capabilities.</p>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(featuresByCategory).map(([categoryId, catFeatures]) => {
            const cat = categories[categoryId] || { enabled: true };
            const Icon = CATEGORY_ICONS[categoryId] || Settings;

            return (
              <div key={categoryId} className="border border-theme-border-soft rounded-2xl bg-theme-surface/30 overflow-hidden">
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-theme-surface/50 border-b border-theme-border-soft">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-theme-accent" />
                    <div>
                      <h3 className="text-sm font-black text-theme-primary capitalize">{categoryId} Modules</h3>
                      <p className="text-[10px] text-theme-muted">Master toggle for all {categoryId} features.</p>
                    </div>
                  </div>
                  <Switch 
                    checked={cat.enabled} 
                    onChange={() => handleToggleCategory(categoryId, cat.enabled)} 
                  />
                </div>

                {/* Features List */}
                <div className={`p-4 grid gap-4 grid-cols-1 md:grid-cols-2 transition-all ${!cat.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                  {catFeatures.map(feat => {
                    const hasDepError = !feat.dependenciesEnabled;
                    return (
                      <div key={feat.id} className="flex items-start justify-between p-4 rounded-xl bg-theme-main border border-theme-border-soft">
                        <div className="pr-4">
                          <h4 className="text-xs font-bold text-theme-primary">{feat.name}</h4>
                          <p className="text-[10px] text-theme-muted mt-1 leading-relaxed">{feat.description}</p>
                          
                          {feat.dependencies.length > 0 && (
                            <div className="mt-2 text-[9px] font-mono text-theme-muted flex items-center gap-1">
                              <span className="opacity-70">Requires:</span>
                              {feat.dependencies.join(', ')}
                            </div>
                          )}
                          
                          {hasDepError && (
                            <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-theme-warning bg-theme-warning/10 px-2 py-1 rounded">
                              <AlertTriangle className="w-3 h-3" /> Dependencies disabled
                            </div>
                          )}
                        </div>
                        <div className="pt-1">
                          <Switch 
                            checked={feat.state.enabled} 
                            onChange={() => handleToggleFeature(feat.id, feat.state.enabled)} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

export default FeatureControlStudio;
