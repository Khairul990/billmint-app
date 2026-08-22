import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Shield, Zap, Box, Users, FileText, CreditCard, 
  Link as LinkIcon, Database, Bell, Palette, HardDrive, Cpu, 
  AlertTriangle, Briefcase, Check, ShoppingBag, Sliders, CheckCircle2,
  HelpCircle, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { featureControlEngine } from '../../services/featureControlEngine';
import { BUSINESS_SETUP_PRESETS } from '../../services/featureRegistry';
import ClassicLoader from '../../components/ClassicLoader';
import { toast } from 'react-hot-toast';

const CATEGORY_ICONS = {
  invoice: FileText,
  customers: Users,
  products: Box,
  payments: CreditCard,
  treasury: Database,
  reports: Settings,
  liveLink: LinkIcon,
  staff: Briefcase,
  notifications: Bell,
  security: Shield,
  appearance: Palette,
  backup: HardDrive,
  advanced: Cpu,
  operations: Layers
};

const PRESET_ICONS = {
  just_billing: FileText,
  billing_customers: Users,
  retail: ShoppingBag,
  service: Briefcase,
  custom: Sliders
};

const FeatureControlStudio = ({ workspaceId }) => {
  const [features, setFeatures] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [applyingPreset, setApplyingPreset] = useState(null);
  const [activePresetId, setActivePresetId] = useState('custom');

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const activeWs = workspaceId || 'default';
      const [feats, cats] = await Promise.all([
        featureControlEngine.getAllFeatures(activeWs),
        featureControlEngine.getAllCategories(activeWs)
      ]);
      setFeatures(feats);
      setCategories(cats);

      // Determine matched preset if any
      if (cats.products && !cats.products.enabled && cats.customers && !cats.customers.enabled) {
        setActivePresetId('just_billing');
      } else if (cats.products && !cats.products.enabled && cats.customers && cats.customers.enabled) {
        setActivePresetId('billing_customers');
      } else if (cats.products && cats.products.enabled && cats.customers && cats.customers.enabled) {
        setActivePresetId('retail');
      } else {
        setActivePresetId('custom');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load feature controls.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFeature = async (featureId, currentValue) => {
    const activeWs = workspaceId || 'default';
    const target = features[featureId];
    
    // If enabling a feature whose dependencies are disabled, offer to enable prerequisites
    if (!currentValue && target && !target.dependenciesEnabled) {
      const confirmAuto = window.confirm(
        `"${target.name}" requires the following prerequisite modules:\n` +
        target.dependencies.map(d => `• ${d}`).join('\n') +
        `\n\nWould you like to enable "${target.name}" and all required prerequisites automatically?`
      );
      if (confirmAuto) {
        try {
          await featureControlEngine.enableFeatureWithDependencies(activeWs, featureId);
          toast.success(`Enabled ${target.name} and prerequisites.`);
          loadData(false);
          return;
        } catch (err) {
          toast.error('Failed to enable dependencies: ' + err.message);
          return;
        }
      }
    }

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
      await featureControlEngine.toggleFeature(activeWs, featureId, !currentValue);
      toast.success(`${target?.name || 'Feature'} updated.`);
      loadData(false);
    } catch (err) {
      console.error('Feature toggle error:', err);
      toast.error('Update failed: ' + (err.message || 'Unknown error'));
      loadData();
    }
  };

  const handleToggleCategory = async (categoryId, currentValue) => {
    const activeWs = workspaceId || 'default';
    try {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], enabled: !currentValue }
      }));
      await featureControlEngine.toggleCategory(activeWs, categoryId, !currentValue);
      toast.success(`${categoryId.toUpperCase()} module ${!currentValue ? 'enabled' : 'disabled'}.`);
      loadData(false);
    } catch {
      toast.error('Update failed.');
      loadData(false);
    }
  };

  const handleApplyPreset = async (presetId) => {
    if (presetId === 'custom') {
      setActivePresetId('custom');
      return;
    }
    const preset = BUSINESS_SETUP_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    if (!window.confirm(`Apply "${preset.name}" preset? This will adjust active modules to match this workflow. Your existing data will NOT be deleted.`)) {
      return;
    }

    setApplyingPreset(presetId);
    try {
      const activeWs = workspaceId || 'default';
      await featureControlEngine.applyBusinessPreset(activeWs, presetId);
      setActivePresetId(presetId);
      toast.success(`Applied "${preset.name}" preset.`);
      await loadData(false);
    } catch (err) {
      toast.error('Failed to apply preset: ' + err.message);
    } finally {
      setApplyingPreset(null);
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

  const activeFeaturesCount = Object.values(features).filter(f => f.effectiveEnabled).length;
  const totalFeaturesCount = Object.keys(features).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* HEADER HERO */}
      <div className="bg-[image:var(--accent-gradient)] text-white rounded-3xl p-6 sm:p-8 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Module Control Center
              </span>
              <span className="text-[10px] font-bold text-white/80">
                Workspace: <span className="text-white font-extrabold">{workspaceId || 'Default'}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Business Modules & Features
            </h2>
            <p className="text-sm text-white/80 max-w-xl mt-1.5 leading-relaxed">
              Tailor BillQyro to your exact business needs. Keep only what you use for a fast, focused interface. Disabling a module never removes existing data.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 shrink-0">
            <div className="text-center px-2">
              <p className="text-2xl font-black tabular-nums">{activeFeaturesCount}</p>
              <p className="text-[9px] uppercase font-bold text-white/70 tracking-wider">Active Features</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <p className="text-2xl font-black tabular-nums">{totalFeaturesCount}</p>
              <p className="text-[9px] uppercase font-bold text-white/70 tracking-wider">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK BUSINESS SETUP PRESETS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-theme-primary tracking-tight">
              1. Quick Business Presets
            </h3>
            <p className="text-xs text-theme-muted font-medium">
              Choose a recommended template to instantly configure modules for your business type.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BUSINESS_SETUP_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id] || Sliders;
            const isCurrent = activePresetId === preset.id;
            const isApplying = applyingPreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                disabled={isApplying}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 relative flex flex-col justify-between group ${
                  isCurrent 
                    ? 'bg-theme-card border-theme-accent shadow-premium shadow-theme-accent/10 ring-2 ring-theme-accent/20' 
                    : 'bg-theme-card border-theme-border-soft hover:border-theme-border hover:bg-theme-surface/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isCurrent 
                        ? 'bg-[image:var(--accent-gradient)] text-white shadow-sm' 
                        : 'bg-theme-surface text-theme-muted group-hover:text-theme-primary'
                    }`}>
                      {isApplying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-theme-primary mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-theme-muted leading-snug line-clamp-3">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-theme-border-soft/60 flex items-center justify-between text-[10px] font-bold text-theme-accent">
                  <span>{isCurrent ? 'Current Setup' : 'Apply Preset'}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULES & SUB-FEATURES BREAKDOWN */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-black text-theme-primary tracking-tight">
            2. Detailed Module Configuration
          </h3>
          <p className="text-xs text-theme-muted font-medium">
            Toggle whole categories or fine-tune individual sub-features. Changes apply instantly.
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(featuresByCategory).map(([categoryId, catFeatures]) => {
            const cat = categories[categoryId] || { enabled: true };
            const Icon = CATEGORY_ICONS[categoryId] || Settings;
            const enabledSubCount = catFeatures.filter(f => f.effectiveEnabled).length;
            const isCore = categoryId === 'invoice' || categoryId === 'security' || categoryId === 'backup';

            return (
              <div 
                key={categoryId} 
                className="border border-theme-border-soft rounded-3xl bg-theme-card shadow-sm overflow-hidden transition-all"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-5 bg-theme-surface/40 border-b border-theme-border-soft">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-theme-primary capitalize">
                          {categoryId === 'products' ? 'Products & Inventory' : categoryId === 'treasury' ? 'Treasury & Expenses' : `${categoryId} Module`}
                        </h4>
                        {isCore && (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-theme-accent/10 text-theme-accent rounded-full uppercase tracking-wider">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-theme-muted font-medium mt-0.5">
                        {enabledSubCount} of {catFeatures.length} features active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-theme-muted hidden sm:inline">
                      {cat.enabled ? 'Module Enabled' : 'Module Disabled'}
                    </span>
                    <Switch 
                      checked={cat.enabled} 
                      onChange={() => handleToggleCategory(categoryId, cat.enabled)} 
                    />
                  </div>
                </div>

                {/* Features Grid */}
                <div className={`p-5 grid gap-4 grid-cols-1 md:grid-cols-2 transition-all ${
                  !cat.enabled ? 'opacity-40 pointer-events-none grayscale' : ''
                }`}>
                  {catFeatures.map(feat => {
                    const hasDepError = !feat.dependenciesEnabled;
                    const isEffective = feat.effectiveEnabled;

                    return (
                      <div 
                        key={feat.id} 
                        className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                          isEffective 
                            ? 'bg-theme-main/60 border-theme-border-soft hover:border-theme-accent/40' 
                            : 'bg-theme-surface/30 border-dashed border-theme-border-soft'
                        }`}
                      >
                        <div className="pr-4 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-black text-theme-primary">
                              {feat.name}
                            </h5>
                            {isEffective && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-theme-success shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-theme-muted mt-1 leading-relaxed">
                            {feat.description}
                          </p>
                          
                          {feat.dependencies.length > 0 && (
                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] uppercase font-bold text-theme-muted/80">Requires:</span>
                              {feat.dependencies.map(dep => (
                                <span key={dep} className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-theme-surface text-theme-muted border border-theme-border-soft">
                                  {dep}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {hasDepError && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-theme-warning bg-theme-warning/10 px-2.5 py-1 rounded-xl w-max">
                              <AlertTriangle className="w-3.5 h-3.5" /> Prerequisite modules disabled
                            </div>
                          )}
                        </div>

                        <div className="pt-0.5 shrink-0">
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
