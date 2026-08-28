import React, { useState, useEffect } from 'react';
import LazyPreview from '../components/LazyPreview';
import PublicInvoice from './PublicInvoice';
import { getPortalLabelByType } from '../config/businessPresets';

import { motion } from 'framer-motion';
import { 
  Palette, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  Building2, 
  Briefcase, 
  Stethoscope, 
  Wrench,
  ShoppingBag,
  LayoutTemplate,
  Monitor,
  Tablet,
  QrCode,
  CreditCard,
  Globe,
  Star,
  Layers,
  Sun,
  X,
  Eye,
  FileText,
  Download,
  Settings,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Grid,
  Type,
  Image,
  Pen,
  Sliders,
  Plus,
  RotateCcw,
  Maximize,
  Minimize,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BUSINESS_PRESETS } from '../config/businessPresets';
import { getDemoInvoice } from '../utils/demoDataGenerator';

const liveLinkTemplates = [
  { id: 'classic', name: 'Clean Classic', type: 'free', icon: LayoutTemplate, desc: 'Simple, timeless layout.' },
  { id: 'cartoon', name: 'Cartoon Premium', type: 'free', icon: LayoutTemplate, desc: 'Premium modern layout with custom branding.' },
  { id: 'modern', name: 'Modern Card', type: 'free', icon: LayoutTemplate, desc: 'Card-based modern layout.' },
  { id: 'mobile', name: 'Mobile First', type: 'free', icon: Smartphone, desc: 'Optimized for mobile displays.' },
  { id: 'retail', name: 'Retail Checkout', type: 'free', icon: ShoppingBag, desc: 'POS checkout receipt style.' },
  { id: 'corporate', name: 'Premium Corporate', type: 'pro', icon: Building2, desc: 'Professional enterprise look.' },
  { id: 'boutique', name: 'Boutique / Tailor', type: 'pro', icon: Briefcase, desc: 'Elegant fashion/order style.' },
  { id: 'clinic', name: 'Clinic / Medical', type: 'pro', icon: Stethoscope, desc: 'Clean medical design.' },
  { id: 'repair', name: 'Service & Repair', type: 'pro', icon: Wrench, desc: 'Job/Service status focused.' },
  { id: 'executive', name: 'Executive Portal', type: 'pro', icon: Building2, desc: 'High-end executive client portal with premium branding.' },
  { id: 'saas', name: 'SaaS Dashboard', type: 'pro', icon: LayoutTemplate, desc: 'Modern SaaS subscription billing view.' },
  { id: 'teacher', name: 'Teacher Portal', type: 'pro', icon: Globe, desc: 'School fee collection portal for parents.' },
  { id: 'medical', name: 'Medical Portal', type: 'pro', icon: Stethoscope, desc: 'Clinic and hospital bill payment portal.' },
  { id: 'tailor', name: 'Tailor Studio', type: 'pro', icon: Briefcase, desc: 'Custom fashion and tailoring order portal.' },
  { id: 'embroidery', name: 'Embroidery Pro', type: 'pro', icon: Briefcase, desc: 'Embroidery design order view for clients.' }
];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

const templateCategory = {
  classic: 'Classic',
  cartoon: 'Modern',
  modern: 'Modern',
  mobile: 'Mobile-first',
  retail: 'Mobile-first',
  corporate: 'Corporate',
  boutique: 'Classic',
  clinic: 'Classic',
  repair: 'Corporate',
  executive: 'Corporate',
  saas: 'Modern',
  teacher: 'Classic',
  medical: 'Classic',
  tailor: 'Classic',
  embroidery: 'Classic'
};

const templateDevices = {
  classic: ['Desktop', 'Tablet', 'Mobile'],
  cartoon: ['Desktop', 'Tablet', 'Mobile'],
  modern: ['Desktop', 'Tablet', 'Mobile'],
  mobile: ['Mobile'],
  retail: ['Desktop', 'Mobile'],
  corporate: ['Desktop'],
  boutique: ['Desktop', 'Tablet'],
  clinic: ['Desktop', 'Tablet', 'Mobile'],
  repair: ['Desktop', 'Mobile'],
  executive: ['Desktop', 'Tablet'],
  saas: ['Desktop', 'Mobile'],
  teacher: ['Desktop', 'Mobile'],
  medical: ['Desktop', 'Tablet', 'Mobile'],
  tailor: ['Desktop', 'Tablet'],
  embroidery: ['Desktop', 'Mobile']
};

const templateFeatures = {
  classic: ['QR Code', 'Payment Links'],
  cartoon: ['QR Code', 'Payment Links', 'Branded'],
  modern: ['QR Code', 'Payment Links', 'Branded'],
  mobile: ['QR Code', 'Mobile Optimized'],
  retail: ['QR Code', 'Checkout'],
  corporate: ['QR Code', 'Payment Links', 'Branded', 'Analytics'],
  boutique: ['QR Code', 'Branded', 'Custom Colors'],
  clinic: ['QR Code', 'Payment Links', 'Medical'],
  repair: ['QR Code', 'Payment Links', 'Status'],
  executive: ['QR Code', 'Branded', 'Analytics', 'Watermark'],
  saas: ['QR Code', 'Auto-Pay', 'Analytics'],
  teacher: ['QR Code', 'Fee Details'],
  medical: ['QR Code', 'Insurance', 'Payment Links'],
  tailor: ['QR Code', 'Custom Colors', 'Branded'],
  embroidery: ['QR Code', 'Branded']
};

const featureBadgeMapping = {
  classic: ['QR', 'Payment'],
  cartoon: ['QR', 'Payment', 'Branded'],
  modern: ['QR', 'Payment', 'Branded'],
  mobile: ['QR', 'WhatsApp', 'Share'],
  retail: ['QR', 'Payment', 'Share'],
  corporate: ['QR', 'Payment', 'Branded', 'Share'],
  boutique: ['QR', 'Branded', 'WhatsApp'],
  clinic: ['QR', 'Payment'],
  repair: ['QR', 'Payment', 'WhatsApp'],
  executive: ['QR', 'Payment', 'Branded', 'Share'],
  saas: ['QR', 'Payment', 'Branded'],
  teacher: ['QR', 'Payment'],
  medical: ['QR', 'Payment'],
  tailor: ['QR', 'Branded', 'WhatsApp'],
  embroidery: ['QR', 'Branded']
};

const templateTheme = {
  classic: 'Light',
  cartoon: 'Light',
  modern: 'Dark',
  mobile: 'Both',
  retail: 'Light',
  corporate: 'Dark',
  boutique: 'Light',
  clinic: 'Light',
  repair: 'Dark',
  executive: 'Dark',
  saas: 'Dark',
  teacher: 'Light',
  medical: 'Light',
  tailor: 'Light',
  embroidery: 'Light'
};

const themePresets = [
  { id: 'light', name: 'Light', icon: Sun, colors: 'bg-amber-100 text-amber-600 border-amber-200' },
  { id: 'dark', name: 'Dark', icon: Monitor, colors: 'bg-gray-800 text-white border-gray-700' },
  { id: 'modern', name: 'Modern', icon: Layers, colors: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  { id: 'classic', name: 'Classic', icon: LayoutTemplate, colors: 'bg-blue-100 text-blue-600 border-blue-200' }
];

const ctaPresets = [
  { id: 'payNow', name: 'Pay Now', icon: CreditCard, desc: 'Direct payment CTA' },
  { id: 'viewInvoice', name: 'View Invoice', icon: FileText, desc: 'View before paying' },
  { id: 'download', name: 'Download', icon: Download, desc: 'Download invoice' },
  { id: 'contact', name: 'Contact', icon: Globe, desc: 'Contact business' }
];

const conversionLayouts = [
  { id: 'modern', name: 'Modern', icon: LayoutTemplate, desc: 'Card-based modern layout' },
  { id: 'classic', name: 'Classic', icon: FileText, desc: 'Traditional layout' },
  { id: 'minimal', name: 'Minimal', icon: Type, desc: 'Clean minimal design' },
  { id: 'bold', name: 'Bold', icon: Sparkles, desc: 'High-contrast bold style' }
];

// Removed hardcoded demoInvoice
const loadRatings = () => {
  try { return JSON.parse(localStorage.getItem('ll_template_ratings') || '{}'); } catch { return {}; }
};
const saveRatings = (r) => localStorage.setItem('ll_template_ratings', JSON.stringify(r));

const LiveLinkTemplateStudio = ({ settings, businessSettings, onSaveSettings, setSettings, setCurrentTab, userSubscription }) => {
  const currentSettings = businessSettings || settings || {};
  const saveHandler = onSaveSettings || setSettings || (() => {});

  const [selectedTemplate, setSelectedTemplate] = useState(
    currentSettings?.customerLiveLinkSettings?.selectedLiveLinkTemplate || currentSettings?.selectedLiveLinkTemplate || 'classic'
  );
  const [filterCategory, setFilterCategory] = useState('All');
  const [ratings, setRatings] = useState(loadRatings);
  const [previewModal, setPreviewModal] = useState(null);
  const portalLabel = getPortalLabelByType(currentSettings?.businessType);
  const [previewDevice, setPreviewDevice] = useState('mobile');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedCta, setSelectedCta] = useState('payNow');
  const [selectedConversion, setSelectedConversion] = useState('modern');
  const [showBrandPresets, setShowBrandPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const isProUser = userSubscription?.status === 'active';
  const categories = ['All', 'Classic', 'Modern', 'Mobile-first', 'Corporate'];

  const filteredTemplates = liveLinkTemplates.filter(t => {
    const matchesCategory = filterCategory === 'All' || templateCategory[t.id] === filterCategory;
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const activeConf = currentSettings?.customerLiveLinkSettings || {};
    const tpl = activeConf.selectedLiveLinkTemplate || currentSettings?.selectedLiveLinkTemplate;
    if (tpl) setSelectedTemplate(tpl);
    if (activeConf.themePreset) setSelectedTheme(activeConf.themePreset);
    if (activeConf.ctaPreset) setSelectedCta(activeConf.ctaPreset);
    if (activeConf.conversionLayout) setSelectedConversion(activeConf.conversionLayout);
  }, [currentSettings]);

  const handleApplyTemplate = async (template) => {
    if (template.type === 'pro' && !isProUser) {
      toast.error('This is a Premium template. Please upgrade to unlock.');
      if (setCurrentTab) setCurrentTab('subscription');
      return;
    }

    const currentConf = currentSettings?.customerLiveLinkSettings || {};
    const updatedSettings = {
      ...currentSettings,
      selectedLiveLinkTemplate: template.id,
      customerLiveLinkSettings: {
        ...currentConf,
        selectedLiveLinkTemplate: template.id,
        themePreset: selectedTheme,
        ctaPreset: selectedCta,
        conversionLayout: selectedConversion
      }
    };

    if (saveHandler) {
      await saveHandler(updatedSettings);
      setSelectedTemplate(template.id);
      toast.success(`${template.name} template applied to ${portalLabel}!`);
    }
  };

  // Preview renderer
  const renderPreview = (tplId) => {
    const mock = JSON.parse(JSON.stringify(getDemoInvoice(settings?.businessCategory)));
    mock.paymentSettingsSnapshot.customerLiveLinkSettings.selectedLiveLinkTemplate = tplId;
    return (
       <LazyPreview fallback={<div className="h-full w-full bg-theme-app animate-pulse flex items-center justify-center text-xs font-bold text-theme-muted">Loading preview...</div>}>
           <div className="w-[800px] h-full transform origin-top-left scale-[0.35] lg:scale-[0.4] pointer-events-none">
                <PublicInvoice initialInvoice={mock} />
           </div>
       </LazyPreview>
    );
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="p-4 md:p-8 w-full space-y-6">
      {/* Back to Settings Button */}
      {setCurrentTab && (
        <button
          onClick={() => setCurrentTab('settings')}
          className="btn-premium flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-xl font-bold text-xs mb-4 shadow-sm w-fit transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-theme-muted" /> Back to Settings Studio
        </button>
      )}

      <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-6 mb-6 section-header">
        <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 flex items-center justify-center shadow-sm">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">{portalLabel} Design Studio</h1>
          <p className="text-xs text-theme-muted font-bold mt-1">Select how your customers see your public invoice payment links.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-card border border-theme-border-soft text-theme-primary text-sm font-semibold placeholder:text-theme-muted/60 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30 transition-all input-premium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all chip-premium ${
              filterCategory === cat 
                ? 'bg-theme-accent text-white shadow-md' 
                : 'bg-theme-app dark:bg-theme-surface text-theme-muted hover:bg-theme-card border border-theme-border-soft'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Theme Presets */}
      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 glass">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-theme-accent" />
          <span className="text-[10px] font-extrabold text-theme-primary uppercase tracking-wider">Theme Presets</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {themePresets.map(tp => (
            <button
              key={tp.id}
              onClick={() => setSelectedTheme(tp.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTheme === tp.id
                  ? 'bg-theme-accent text-white shadow-md ring-2 ring-theme-accent/30'
                  : 'bg-theme-app text-theme-muted hover:bg-theme-card border border-theme-border-soft'
              }`}
            >
              <tp.icon className="w-4 h-4" />
              {tp.name}
            </button>
          ))}
        </div>
      </div>

      {/* CTA Presets */}
      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 glass">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-theme-accent" />
          <span className="text-[10px] font-extrabold text-theme-primary uppercase tracking-wider">CTA Presets</span>
          <span className="text-[7px] text-theme-muted font-bold ml-auto">Choose what action button appears</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {ctaPresets.map(cta => (
            <button
              key={cta.id}
              onClick={() => setSelectedCta(cta.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCta === cta.id
                  ? 'bg-theme-accent text-white shadow-md ring-2 ring-theme-accent/30'
                  : 'bg-theme-app text-theme-muted hover:bg-theme-card border border-theme-border-soft'
              }`}
            >
              <cta.icon className="w-4 h-4" />
              <span>{cta.name}</span>
              <span className="text-[7px] opacity-70 hidden md:inline">{cta.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Layouts */}
      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 glass">
        <div className="flex items-center gap-2 mb-3">
          <Grid className="w-4 h-4 text-theme-accent" />
          <span className="text-[10px] font-extrabold text-theme-primary uppercase tracking-wider">Conversion Layouts</span>
          <span className="text-[7px] text-theme-muted font-bold ml-auto">Page layout style</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {conversionLayouts.map(layout => (
            <button
              key={layout.id}
              onClick={() => setSelectedConversion(layout.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedConversion === layout.id
                  ? 'bg-theme-accent text-white shadow-md ring-2 ring-theme-accent/30'
                  : 'bg-theme-app text-theme-muted hover:bg-theme-card border border-theme-border-soft'
              }`}
            >
              <layout.icon className="w-4 h-4" />
              <span>{layout.name}</span>
              <span className="text-[7px] opacity-70 hidden md:inline">{layout.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Presets Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowBrandPresets(!showBrandPresets)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            showBrandPresets
              ? 'bg-theme-accent text-white shadow-md'
              : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          Brand Presets
          <motion.span animate={{ rotate: showBrandPresets ? 180 : 0 }}><ArrowRight className="w-3 h-3" /></motion.span>
        </button>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            showAnalytics
              ? 'bg-theme-accent text-white shadow-md'
              : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Analytics
          <motion.span animate={{ rotate: showAnalytics ? 180 : 0 }}><ArrowRight className="w-3 h-3" /></motion.span>
        </button>
      </div>

      {/* Brand Presets Section */}
      {showBrandPresets && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-4 glass">
          <div className="flex items-center gap-2 mb-1">
            <Image className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">Brand Presets</span>
            <span className="text-[8px] text-theme-muted font-bold ml-auto">Pick your business type for suggested templates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {BUSINESS_PRESETS.filter(p => p.id !== 'billing_only').slice(0, 10).map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset.id);
                  const llCategories = {
                    retail: 'Mobile-first',
                    grocery: 'Mobile-first',
                    service: 'Corporate',
                    doctor: 'Classic',
                    teacher: 'Classic',
                    tailor: 'Classic',
                    embroidery: 'Classic',
                    freelance: 'Corporate',
                    restaurant: 'Mobile-first',
                    custom: 'All'
                  };
                  setFilterCategory(llCategories[preset.id] || 'All');
                  toast.success(`Showing ${preset.label} templates`);
                }}
                className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.03] ${
                  selectedPreset === preset.id
                    ? 'bg-theme-accent/10 border-theme-accent text-theme-accent'
                    : 'bg-theme-app border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
                }`}
              >
                <p className="text-[10px] font-extrabold text-theme-primary truncate">{preset.label}</p>
                <p className="text-[7px] text-theme-muted font-medium mt-0.5 line-clamp-1">{preset.shortDesc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analytics Section */}
      {showAnalytics && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-4 glass">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">Live Link Analytics</span>
            <span className="text-[8px] text-theme-muted font-bold ml-auto">Mock data — upgrade for live tracking</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Views</p>
              <p className="text-2xl font-black text-theme-primary mt-1">1,284</p>
              <p className="text-[8px] text-theme-muted font-medium mt-1 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-emerald-500" /> +12% vs last month</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Clicks</p>
              <p className="text-2xl font-black text-theme-primary mt-1">847</p>
              <p className="text-[8px] text-theme-muted font-medium mt-1 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-emerald-500" /> 66% click rate</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Conversions</p>
              <p className="text-2xl font-black text-theme-primary mt-1">523</p>
              <p className="text-[8px] text-theme-muted font-medium mt-1 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-emerald-500" /> 61.7% conversion</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-black text-theme-primary mt-1">$12.4k</p>
              <p className="text-[8px] text-theme-muted font-medium mt-1 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-emerald-500" /> +8.3% vs last month</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-[9px] text-theme-muted font-bold p-2 rounded-lg bg-theme-app border border-dashed border-theme-border-soft">
            <RefreshCw className="w-3 h-3" /> Real-time analytics available on Premium plan
          </div>
        </motion.div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-theme-muted font-semibold">No templates matching your search.</p>
          <button onClick={() => { setSearchQuery(''); setFilterCategory('All'); }} className="mt-2 text-xs text-theme-accent font-bold hover:underline flex items-center gap-1 justify-center">
            <RefreshCw className="w-3 h-3" /> Reset filters
          </button>
        </div>
      ) : (
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => {
          const isActive = selectedTemplate === template.id;
          const Icon = template.icon;
          const isLocked = template.type === 'pro' && !isProUser;
          const devices = templateDevices[template.id] || [];
          const features = templateFeatures[template.id] || [];

          return (
            <motion.div 
              key={template.id} 
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`relative bg-theme-card dark:bg-theme-card rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-premium flex flex-col card-premium ${isActive ? 'border-theme-accent ring-4 ring-theme-accent/20 scale-[1.02]' : 'border-theme-border-soft hover:border-theme-accent/50'}`}
            >
              {/* Type Badge */}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                {template.type === 'free' ? (
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm backdrop-blur-md badge-premium">FREE</span>
                ) : (
                  <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-sm badge-premium">PRO</span>
                )}
                {isActive && (
                  <span className="bg-theme-accent text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {/* Device Preview Indicators */}
              <div className="absolute top-3 left-3 z-10 flex gap-1">
                {devices.map(device => {
                  const DeviceIcon = device === 'Desktop' ? Monitor : device === 'Tablet' ? Tablet : Smartphone;
                  return (
                    <span key={device} className="bg-black/40 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                      <DeviceIcon className="w-2.5 h-2.5" />
                    </span>
                  );
                })}
              </div>

              {/* Preview Window */}
              <div className="h-48 w-full bg-theme-app dark:bg-theme-card/50 relative overflow-hidden group border-b border-theme-border-soft">
                {renderPreview(template.id)}
                
                {/* Lock Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-theme-card/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md border border-white/20">
                      <Lock className="w-5 h-5 text-amber-300" />
                    </div>
                    <span className="text-xs font-bold tracking-wider">PREMIUM</span>
                  </div>
                )}
              </div>

              {/* Content & Controls */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="font-extrabold text-theme-primary flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-theme-muted" />
                    {template.name}
                  </h3>
                  <p className="text-[10px] text-theme-muted font-medium mb-2">{template.desc}</p>

                  {/* Theme + View Mode Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${templateTheme[template.id] === 'Both' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : templateTheme[template.id] === 'Dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-theme-card text-theme-primary border-theme-border-soft'}`}>
                      {templateTheme[template.id] === 'Both' ? <Layers className="w-2 h-2" /> : templateTheme[template.id] === 'Dark' ? <Monitor className="w-2 h-2" /> : <Sun className="w-2 h-2" />} {templateTheme[template.id]} Mode
                    </span>
                  </div>

                  {/* Feature Badges (QR, Payment, Branded, WhatsApp, Share) */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(featureBadgeMapping[template.id] || []).map(feat => {
                      const featColors = {
                        QR: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                        Payment: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        Branded: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                        WhatsApp: 'bg-green-500/10 text-green-500 border-green-500/20',
                        Share: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      };
                      return (
                        <span key={feat} className={`text-[7px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${featColors[feat] || 'bg-theme-accent/10 text-theme-accent border-theme-accent/20'}`}>
                          {feat === 'QR' && <QrCode className="w-2 h-2" />}
                          {feat === 'Payment' && <CreditCard className="w-2 h-2" />}
                          {feat === 'Branded' && <Star className="w-2 h-2" />}
                          {feat === 'WhatsApp' && <Globe className="w-2 h-2" />}
                          {feat === 'Share' && <Layers className="w-2 h-2" />}
                          {feat}
                        </span>
                      );
                    })}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={(e) => { e.stopPropagation(); const r = { ...ratings, [template.id]: star }; setRatings(r); saveRatings(r); }} className="transition-transform hover:scale-110">
                        <Star className={`w-3 h-3 ${(ratings[template.id] || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-theme-border-soft'}`} />
                      </button>
                    ))}
                    <span className="text-[7px] text-theme-muted font-bold ml-1">{ratings[template.id] ? `${ratings[template.id]}/5` : ''}</span>
                  </div>

                  {/* Existing feature badges */}
                  <div className="flex flex-wrap gap-1">
                    {features.map(feat => (
                      <span key={feat} className="text-[7px] font-bold bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded border border-theme-accent/20 flex items-center gap-1">
                        <Star className="w-2 h-2" /> {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 btn-premium ${
                    isActive 
                      ? 'bg-theme-accent/10 text-theme-accent cursor-default border border-theme-accent/20' 
                      : isLocked
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:scale-[1.02]'
                        : 'bg-theme-app dark:bg-theme-surface hover:bg-theme-accent hover:text-white border border-theme-border-soft text-theme-primary hover:scale-[1.02]'
                  }`}
                >
                  {isActive ? (
                    <>Applied <CheckCircle2 className="w-4 h-4" /></>
                  ) : isLocked ? (
                    <>Unlock Pro <Lock className="w-3.5 h-3.5" /></>
                  ) : (
                    'Apply Template'
                  )}
                </button>
                <button
                  onClick={() => setPreviewModal(template.id)}
                  className="py-3 px-4 rounded-xl text-xs font-bold transition-all bg-theme-app dark:bg-theme-surface border border-theme-border-soft text-theme-muted hover:bg-theme-accent hover:text-white flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      )}

      {/* Preview Modal */}
      {previewModal && (() => {
        const tpl = liveLinkTemplates.find(t => t.id === previewModal);
        if (!tpl) return null;
        const devices = templateDevices[tpl.id] || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setPreviewModal(null); setPreviewDevice('mobile'); }}>
            <div className="bg-theme-card rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-theme-border-soft" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-theme-border-soft">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-theme-primary text-sm">{tpl.name}</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tpl.type === 'free' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'}`}>
                    {tpl.type === 'free' ? 'FREE' : 'PRO'}
                  </span>
                  <span className="text-[8px] font-bold text-theme-muted bg-theme-app px-2 py-0.5 rounded-full border border-theme-border-soft">
                    {selectedConversion.charAt(0).toUpperCase() + selectedConversion.slice(1)} Layout
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Device toggle */}
                  {devices.length > 0 && (
                    <div className="flex bg-theme-surface rounded-lg p-0.5 gap-0.5">
                      {devices.includes('Mobile') && (
                        <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                          <Smartphone className="w-4 h-4" />
                        </button>
                      )}
                      {devices.includes('Tablet') && (
                        <button onClick={() => setPreviewDevice('tablet')} className={`p-1.5 rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                          <Tablet className="w-4 h-4" />
                        </button>
                      )}
                      {devices.includes('Desktop') && (
                        <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                          <Monitor className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <button onClick={() => { setPreviewModal(null); setPreviewDevice('mobile'); }} className="p-1.5 rounded-lg hover:bg-theme-app text-theme-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="bg-gradient-to-br from-theme-app to-theme-surface p-6 flex items-center justify-center min-h-[320px] relative overflow-hidden">
                <div className={`${previewDevice === 'mobile' ? 'w-[280px] rounded-[2.5rem] border-4 border-gray-800 dark:border-gray-600 shadow-2xl overflow-hidden bg-theme-card h-[500px]' : previewDevice === 'tablet' ? 'w-[450px] rounded-2xl border-4 border-gray-800 dark:border-gray-600 shadow-2xl overflow-hidden bg-theme-card h-[400px]' : 'w-full max-w-2xl rounded-xl border border-theme-border-soft shadow-xl overflow-hidden bg-theme-card h-[380px]'} transition-all duration-300`}>
                  <div className="h-full w-full relative overflow-hidden">
                    {/* Device top bar for mobile/tablet */}
                    {(previewDevice === 'mobile' || previewDevice === 'tablet') && (
                      <div className="h-6 bg-gray-800 dark:bg-gray-900 flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                    )}
                    <div className={`${(previewDevice === 'mobile' || previewDevice === 'tablet') ? 'h-[calc(100%-24px)]' : 'h-full'}`}>
                      {renderPreview(tpl.id)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-theme-border-soft flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-theme-muted font-semibold">Previewing:</span>
                  <span className="text-[10px] font-bold text-theme-primary capitalize">{previewDevice}</span>
                  <span className="w-px h-3 bg-theme-border-soft mx-1" />
                  <span className="text-[10px] text-theme-muted font-semibold">CTA:</span>
                  <span className="text-[10px] font-bold text-theme-primary capitalize">{ctaPresets.find(c => c.id === selectedCta)?.name || 'Pay Now'}</span>
                  <span className="w-px h-3 bg-theme-border-soft mx-1" />
                  <span className="text-[10px] text-theme-muted font-semibold">Theme:</span>
                  <span className="text-[10px] font-bold text-theme-primary capitalize">{selectedTheme}</span>
                </div>
                <button
                  onClick={() => { handleApplyTemplate(tpl); setPreviewModal(null); setPreviewDevice('mobile'); }}
                  className="px-4 py-2 bg-theme-accent text-white text-xs font-bold rounded-xl hover:shadow-md transition-all active:scale-95"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default LiveLinkTemplateStudio;
