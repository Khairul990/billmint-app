import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Palette,
  Eye,
  Crown,
  FileText,
  Tag,
  Layers,
  Star,
  X,
  Search,
  Globe,
  QrCode,
  Pen,
  Image,
  Sliders,
  RefreshCw,
  ArrowRight,
  Maximize,
  Minimize,
  Download,
  Filter,
  ArrowLeft,
  Sparkles,
  Check,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { settingsEngine } from '../services/settingsEngine';
import { BUSINESS_PRESETS } from '../config/businessPresets';
import InvoicePreview from '../components/InvoicePreview';
import LazyPreview from '../components/LazyPreview';
import { getDemoInvoice } from '../utils/demoDataGenerator';
import { LivePreviewLayouts } from '../components/invoice-templates/layouts/LivePreviewLayouts';
import PublicInvoice from './PublicInvoice';
import { UNIVERSAL_TEMPLATES, getTemplateFeatures, getTemplateGradient } from '../services/TemplateEngine';
import { downloadInvoicePDF } from '../utils/pdfUtils';

const templateStyles = {
  classic: 'Clean', cartoon: 'Modern', modern: 'Modern', minimal: 'Minimal',
  retail: 'Thermal', 'premium-gold': 'Luxury', 'classic-elegant': 'Corporate',
  corporate: 'Corporate', boutique: 'Fashion', clinic: 'Healthcare', repair: 'Utility',
  executive: 'Luxury', saas: 'Modern', teacher: 'Education', medical: 'Healthcare', tailor: 'Fashion', embroidery: 'Design',
  'minimal-classic': 'Minimal', 'modern-corporate': 'Corporate', 'teal-bold-header': 'Modern',
  'sage-green-curved': 'Modern', 'creative-agency': 'Creative', 'purple-corporate': 'Corporate',
  'orange-gradient-modern': 'Modern', 'orange-geometric': 'Modern', 'black-orange-bold': 'Bold',
  'luxury-gold-black': 'Luxury', 'black-header-professional': 'Professional', 'blue-rounded-modern': 'Modern',
  'red-corporate-clean': 'Corporate', 'clean-two-column': 'Modern'
};

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } }
};

const PdfTemplateStudio = ({ businessSettings, setSettings, setCurrentTab, subscription, viewMode, setViewMode, templateOverride, onSelectTemplate }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [useAnimId, setUseAnimId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enableWatermark, setEnableWatermark] = useState(Boolean(businessSettings?.pdfWatermark));
  const [signaturePlacement, setSignaturePlacement] = useState(businessSettings?.pdfSignaturePlacement || 'none');
  const [qrPlacement, setQrPlacement] = useState(businessSettings?.pdfQrPlacement || 'none');
  const [previewSize, setPreviewSize] = useState('A4');
  const [showOptions, setShowOptions] = useState(false);
  const [showBrandPresets, setShowBrandPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [internalViewMode, setInternalViewMode] = useState('pdf');
  const [downloadingSample, setDownloadingSample] = useState(false);

  const activeViewMode = viewMode || internalViewMode;
  const handleSetViewMode = setViewMode || setInternalViewMode;

  const activeTemplate = templateOverride || businessSettings?.selectedPdfTemplate || businessSettings?.defaultBillingTemplate || 'classic';
  const [pendingTemplate, setPendingTemplate] = useState(activeTemplate);
  const isDirty = pendingTemplate !== activeTemplate;
  const isPremium = subscription?.features?.includes('premiumTemplates') || subscription?.status === 'premium' || businessSettings?.planStatus === 'premium' || businessSettings?.planStatus === 'Monthly' || businessSettings?.plan === 'Monthly';
  
  const categories = ['All', 'Classic', 'Modern', 'Corporate', 'Luxury', 'Minimal', 'Business', 'Healthcare', 'Utility'];

  const filteredTemplates = UNIVERSAL_TEMPLATES.filter(t => {
    const styleTag = templateStyles[t.id] || '';
    const matchesCategory = filterCategory === 'All' || 
      t.tags.some(tag => tag.toLowerCase() === filterCategory.toLowerCase()) || 
      styleTag.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApplyInstant = async (templateId, type) => {
    if (type === 'PRO' && !isPremium) {
      setCurrentTab?.('subscription');
      toast('Upgrade to Premium to unlock this template!', { icon: '👑' });
      return;
    }
    
    setPendingTemplate(templateId);
    onSelectTemplate?.(templateId);

    const updated = { 
      ...businessSettings, 
      selectedPdfTemplate: templateId, 
      defaultBillingTemplate: templateId,
      pdfTemplate: templateId
    };
    
    updated.customerLiveLinkSettings = {
      ...(updated.customerLiveLinkSettings || {}),
      selectedLiveLinkTemplate: templateId
    };

    if (enableWatermark) updated.pdfWatermark = true;
    if (signaturePlacement !== 'none') updated.pdfSignaturePlacement = signaturePlacement;
    if (qrPlacement !== 'none') updated.pdfQrPlacement = qrPlacement;

    setUseAnimId(templateId);
    setTimeout(() => setUseAnimId(null), 2000);

    try {
      await settingsEngine.saveSettings(updated);
      if (setSettings) setSettings(updated);
      toast.success(`${UNIVERSAL_TEMPLATES.find(t => t.id === templateId)?.name || 'Template'} applied successfully!`);
    } catch (err) {
      toast.error('Failed to save template selection.');
    }
  };

  const handleSaveAndApply = async () => {
    if (!pendingTemplate) return;
    await handleApplyInstant(pendingTemplate, UNIVERSAL_TEMPLATES.find(t => t.id === pendingTemplate)?.type);
  };

  const handleDiscard = () => {
    setPendingTemplate(activeTemplate);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    const presetCategories = {
      retail: 'Business',
      grocery: 'Business',
      service: 'Utility',
      doctor: 'Healthcare',
      teacher: 'Education',
      tailor: 'Fashion',
      embroidery: 'Design',
      freelance: 'Creative',
      restaurant: 'Business',
      custom: 'All',
      billing_only: 'Classic'
    };
    const targetCat = presetCategories[preset.id] || 'All';
    setFilterCategory(targetCat);
    toast.success(`Filtered for ${preset.label}`);
  };

  const handleDownloadSamplePDF = async (templateId) => {
    try {
      setDownloadingSample(true);
      const demoInvoice = getDemoInvoice(businessSettings?.businessCategory);
      demoInvoice.selectedTemplate = templateId;
      demoInvoice.pdfTemplate = templateId;
      const sampleSettings = {
        ...businessSettings,
        selectedPdfTemplate: templateId,
        defaultBillingTemplate: templateId
      };
      await downloadInvoicePDF(demoInvoice, sampleSettings, isPremium);
    } catch (error) {
      toast.error('Sample PDF export failed.');
    } finally {
      setDownloadingSample(false);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      {/* Back to Settings Button */}
      {setCurrentTab && (
        <button
          onClick={() => setCurrentTab('settings')}
          className="btn-premium flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-xl font-bold text-xs mb-2 shadow-xs w-fit transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-theme-muted" /> Back to Settings Studio
        </button>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-theme-card via-theme-surface to-theme-card border border-theme-border-soft shadow-xs relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-theme-accent/15 flex items-center justify-center text-theme-accent border border-theme-accent/20 shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-theme-primary tracking-tight">
                PDF Invoice Template Studio
              </h2>
              <p className="text-xs text-theme-muted font-medium">
                Choose and apply high-definition billing templates for all downloaded PDFs, print bills & online links.
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-theme-app/80 border border-theme-border-soft px-4 py-2 rounded-xl">
          <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Active Style:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-theme-accent/10 text-theme-accent border border-theme-accent/30 rounded-lg text-xs font-black tracking-tight">
            <CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" />
            {UNIVERSAL_TEMPLATES.find(t => t.id === activeTemplate)?.name || activeTemplate}
          </span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Search templates by name, style, or industry..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-theme-card border border-theme-border-soft text-theme-primary text-xs font-semibold placeholder:text-theme-muted/60 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options & Presets Toggles */}
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${showOptions ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-card border-theme-border-soft text-theme-muted hover:text-theme-primary'}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Options</span>
            </button>
            <button
              onClick={() => setShowBrandPresets(!showBrandPresets)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${showBrandPresets ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-card border-theme-border-soft text-theme-muted hover:text-theme-primary'}`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Industry Presets</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-2xs ${filterCategory === cat
                  ? 'bg-theme-accent text-white border-theme-accent shadow-sm scale-102'
                  : 'bg-theme-card text-theme-muted hover:text-theme-primary border-theme-border-soft hover:border-theme-accent/40'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Design Options */}
      <AnimatePresence>
        {showOptions && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-4 shadow-xs overflow-hidden">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-theme-accent" />
              <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">PDF Export Preferences</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Watermark Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-theme-surface border border-theme-border-soft">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                    <Pen className="w-4 h-4 text-theme-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">PDF Watermark</p>
                    <p className="text-[10px] text-theme-muted font-medium">Render subtle company watermark</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableWatermark(!enableWatermark)}
                  className={`relative w-11 h-6 rounded-full transition-all ${enableWatermark ? 'bg-theme-accent' : 'bg-theme-border-soft'}`}
                >
                  <motion.div animate={{ x: enableWatermark ? 22 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Signature Placement */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-theme-surface border border-theme-border-soft">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-theme-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">Signatory Zone</p>
                    <p className="text-[10px] text-theme-muted font-medium">Authorized signature box</p>
                  </div>
                </div>
                <select
                  value={signaturePlacement}
                  onChange={e => setSignaturePlacement(e.target.value)}
                  className="text-xs font-bold bg-theme-card border border-theme-border-soft rounded-lg px-2.5 py-1.5 text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="none">None</option>
                  <option value="right">Bottom Right</option>
                  <option value="left">Bottom Left</option>
                  <option value="bottom">Bottom Full</option>
                </select>
              </div>

              {/* QR Code Placement */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-theme-surface border border-theme-border-soft">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-theme-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">Payment QR</p>
                    <p className="text-[10px] text-theme-muted font-medium">Dynamic scannable QR</p>
                  </div>
                </div>
                <select
                  value={qrPlacement}
                  onChange={e => setQrPlacement(e.target.value)}
                  className="text-xs font-bold bg-theme-card border border-theme-border-soft rounded-lg px-2.5 py-1.5 text-theme-primary focus:outline-none focus:border-theme-accent"
                >
                  <option value="none">Standard</option>
                  <option value="header">Header Badge</option>
                  <option value="footer">Footer Card</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Industry Presets */}
      <AnimatePresence>
        {showBrandPresets && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-3 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-theme-accent" />
                <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">Tailored Industry Presets</span>
              </div>
              <span className="text-[10px] text-theme-muted font-semibold">Click to filter tailored templates</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {BUSINESS_PRESETS.filter(p => p.id !== 'billing_only').slice(0, 12).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-102 ${selectedPreset === preset.id
                      ? 'bg-theme-accent/10 border-theme-accent text-theme-accent shadow-xs'
                      : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:border-theme-accent/40'
                    }`}
                >
                  <p className="text-xs font-extrabold text-theme-primary truncate">{preset.label}</p>
                  <p className="text-[9px] text-theme-muted font-medium mt-0.5 line-clamp-1">{preset.shortDesc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Grid Container */}
      <div className="space-y-4">
        {/* Unsaved Changes Action Bar */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">Pending Template Selection</p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    Selected <strong className="font-black">{UNIVERSAL_TEMPLATES.find(t => t.id === pendingTemplate)?.name || pendingTemplate}</strong>. Click Save & Apply to update all PDF exports.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDiscard}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-theme-muted bg-theme-card hover:bg-theme-surface border border-theme-border-soft transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveAndApply}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black text-white bg-theme-accent hover:bg-theme-accent-dark transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save & Apply Template
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-theme-card rounded-2xl border border-theme-border-soft">
            <Palette className="w-10 h-10 text-theme-muted/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-theme-primary">No templates found matching your query.</p>
            <p className="text-xs text-theme-muted mt-1">Try searching with a different keyword or resetting filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
              className="mt-4 px-4 py-2 bg-theme-accent/10 text-theme-accent border border-theme-accent/30 rounded-xl text-xs font-bold hover:bg-theme-accent hover:text-white transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTemplates.map((tpl) => {
              const isActive = activeTemplate === tpl.id;
              const isPending = pendingTemplate === tpl.id;
              const isLocked = tpl.type === 'PRO' && !isPremium;
              const tags = tpl.tags || [];
              const features = getTemplateFeatures(tpl.id);
              const previewGradient = getTemplateGradient(tpl.id);

              return (
                <motion.div
                  key={tpl.id}
                  variants={staggerItem}
                  whileHover={{ y: -4 }}
                  className={`group relative rounded-2xl overflow-hidden border transition-all flex flex-col bg-theme-card shadow-xs ${
                    isActive 
                      ? 'border-theme-accent ring-2 ring-theme-accent/30 shadow-md' 
                      : isPending 
                      ? 'border-theme-accent/60 border-dashed ring-1 ring-theme-accent/20' 
                      : 'border-theme-border-soft hover:border-theme-accent/40 hover:shadow-md'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    {tpl.type === 'PRO' ? (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Crown className="w-3 h-3" /> PRO
                      </span>
                    ) : (
                      <span className="bg-theme-card/90 backdrop-blur-xs text-theme-muted text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-theme-border-soft shadow-2xs">
                        FREE
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="bg-theme-accent text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Active
                      </span>
                    </div>
                  )}

                  {/* Thumbnail / Mockup Viewport */}
                  <div 
                    onClick={() => setPreviewTemplate(tpl.id)}
                    className={`h-48 w-full bg-gradient-to-br ${previewGradient} flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:opacity-95 transition-opacity`}
                  >
                    <LazyPreview fallback={<div className="text-white/70 text-[10px] font-bold uppercase tracking-widest animate-pulse">Loading {tpl.name}...</div>}>
                      <div className="w-[595px] origin-top scale-[0.32] pointer-events-none mt-14 bg-white shadow-2xl rounded-sm overflow-hidden select-none">
                        <InvoicePreview invoice={getDemoInvoice(businessSettings?.businessCategory)} businessSettings={{ ...businessSettings, selectedPdfTemplate: tpl.id }} templateOverride={tpl.id} />
                      </div>
                    </LazyPreview>

                    {/* Hover Overlay with Preview Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-black shadow-lg flex items-center gap-1.5 backdrop-blur-xs transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Eye className="w-3.5 h-3.5 text-theme-accent" /> Click to Preview
                      </span>
                    </div>

                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <div className="bg-black/80 p-3 rounded-2xl text-center border border-amber-500/30">
                          <Lock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                          <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Pro Template</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Info & Actions */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3 border-t border-theme-border-soft bg-theme-card">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-extrabold text-sm text-theme-primary truncate">{tpl.name}</h3>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-theme-surface text-theme-muted border border-theme-border-soft shrink-0">
                          {templateStyles[tpl.id] || 'Modern'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-theme-muted line-clamp-2 leading-relaxed">{tpl.desc}</p>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-wrap gap-1">
                      {features.slice(0, 3).map(feat => (
                        <span key={feat} className="text-[8px] font-bold bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded border border-theme-accent/20 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> {feat}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-theme-border-soft flex items-center gap-2">
                      {isLocked ? (
                        <button
                          onClick={() => { setCurrentTab?.('subscription'); toast('Upgrade to Pro to unlock all templates!', { icon: '👑' }); }}
                          className="flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:scale-102"
                        >
                          <Lock className="w-3.5 h-3.5" /> Unlock Pro
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyInstant(tpl.id, tpl.type)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                            isActive
                              ? 'bg-theme-accent/15 text-theme-accent border border-theme-accent/30 hover:bg-theme-accent/25'
                              : 'bg-theme-accent text-white hover:bg-theme-accent-dark active:scale-95 shadow-xs'
                          }`}
                        >
                          {useAnimId === tpl.id ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Applied!</span>
                          ) : isActive ? (
                            <span className="flex items-center gap-1 text-theme-accent"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                          ) : (
                            <span>Apply Template</span>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setPreviewTemplate(tpl.id)}
                        title="Full Screen Preview"
                        className="py-2 px-2.5 rounded-xl text-xs font-bold transition-all bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-app flex items-center justify-center"
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
      </div>

      {/* Interactive Full-Screen Preview Modal */}
      {previewTemplate && (() => {
        const tpl = UNIVERSAL_TEMPLATES.find(t => t.id === previewTemplate);
        if (!tpl) return null;
        const isCurrentActive = activeTemplate === tpl.id;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 md:p-6" onClick={() => setPreviewTemplate(null)}>
            <div className="bg-theme-card rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-theme-border-soft overflow-hidden" onClick={e => e.stopPropagation()}>
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border-soft bg-theme-card/90 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent border border-theme-accent/20">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-theme-primary text-sm flex items-center gap-2">
                      {tpl.name}
                      {tpl.type === 'PRO' && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                          PRO
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-theme-muted font-medium">{tpl.desc}</p>
                  </div>
                </div>

                {/* Direct Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={downloadingSample}
                    onClick={() => handleDownloadSamplePDF(tpl.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-surface hover:bg-theme-app text-theme-primary border border-theme-border-soft flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-theme-accent" />
                    <span>{downloadingSample ? 'Generating PDF...' : 'Download Sample PDF'}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleApplyInstant(tpl.id, tpl.type);
                      setPreviewTemplate(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-theme-accent hover:bg-theme-accent-dark text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCurrentActive ? 'Active Template' : 'Apply This Template'}</span>
                  </button>

                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="p-2 rounded-xl bg-theme-surface hover:bg-theme-app text-theme-muted hover:text-theme-primary transition-all border border-theme-border-soft ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Preview Canvas */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-900/5 dark:bg-black/30">
                <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
                  <InvoicePreview 
                    invoice={getDemoInvoice(businessSettings?.businessCategory)} 
                    businessSettings={{ ...businessSettings, selectedPdfTemplate: tpl.id }} 
                    templateOverride={tpl.id} 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default PdfTemplateStudio;
