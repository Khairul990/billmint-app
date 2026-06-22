import React, { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const liveLinkTemplates = [
  { id: 'classic', name: 'Clean Classic', type: 'free', icon: LayoutTemplate, desc: 'Simple, timeless layout.' },
  { id: 'modern', name: 'Modern Card', type: 'free', icon: LayoutTemplate, desc: 'Card-based modern layout.' },
  { id: 'mobile', name: 'Mobile First', type: 'free', icon: Smartphone, desc: 'Optimized for mobile displays.' },
  { id: 'retail', name: 'Retail Checkout', type: 'free', icon: ShoppingBag, desc: 'POS checkout receipt style.' },
  { id: 'corporate', name: 'Premium Corporate', type: 'pro', icon: Building2, desc: 'Professional enterprise look.' },
  { id: 'boutique', name: 'Boutique / Tailor', type: 'pro', icon: Briefcase, desc: 'Elegant fashion/order style.' },
  { id: 'clinic', name: 'Clinic / Medical', type: 'pro', icon: Stethoscope, desc: 'Clean medical design.' },
  { id: 'repair', name: 'Service & Repair', type: 'pro', icon: Wrench, desc: 'Job/Service status focused.' }
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const templateCategory = {
  classic: 'Classic',
  modern: 'Modern',
  mobile: 'Mobile-first',
  retail: 'Mobile-first',
  corporate: 'Corporate',
  boutique: 'Classic',
  clinic: 'Classic',
  repair: 'Corporate'
};

const templateDevices = {
  classic: ['Desktop', 'Tablet', 'Mobile'],
  modern: ['Desktop', 'Tablet', 'Mobile'],
  mobile: ['Mobile'],
  retail: ['Desktop', 'Mobile'],
  corporate: ['Desktop'],
  boutique: ['Desktop', 'Tablet'],
  clinic: ['Desktop', 'Tablet', 'Mobile'],
  repair: ['Desktop', 'Mobile']
};

const templateFeatures = {
  classic: ['QR Code', 'Payment Links'],
  modern: ['QR Code', 'Payment Links', 'Branded'],
  mobile: ['QR Code', 'Mobile Optimized'],
  retail: ['QR Code', 'Checkout'],
  corporate: ['QR Code', 'Payment Links', 'Branded', 'Analytics'],
  boutique: ['QR Code', 'Branded', 'Custom Colors'],
  clinic: ['QR Code', 'Payment Links', 'Medical'],
  repair: ['QR Code', 'Payment Links', 'Status']
};

const featureBadgeMapping = {
  classic: ['QR', 'Payment'],
  modern: ['QR', 'Payment', 'Branded'],
  mobile: ['QR', 'WhatsApp', 'Share'],
  retail: ['QR', 'Payment', 'Share'],
  corporate: ['QR', 'Payment', 'Branded', 'Share'],
  boutique: ['QR', 'Branded', 'WhatsApp'],
  clinic: ['QR', 'Payment'],
  repair: ['QR', 'Payment', 'WhatsApp']
};

const templateTheme = {
  classic: 'Light',
  modern: 'Dark',
  mobile: 'Both',
  retail: 'Light',
  corporate: 'Dark',
  boutique: 'Light',
  clinic: 'Light',
  repair: 'Dark'
};

const loadRatings = () => {
  try { return JSON.parse(localStorage.getItem('ll_template_ratings') || '{}'); } catch { return {}; }
};
const saveRatings = (r) => localStorage.setItem('ll_template_ratings', JSON.stringify(r));

const LiveLinkTemplateStudio = ({ settings, onSaveSettings, subscription, setCurrentTab }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [filterCategory, setFilterCategory] = useState('All');
  const [ratings, setRatings] = useState(loadRatings);
  const [previewModal, setPreviewModal] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('mobile');
  const isProUser = subscription?.status === 'active';
  const categories = ['All', 'Classic', 'Modern', 'Mobile-first', 'Corporate'];

  const filteredTemplates = filterCategory === 'All'
    ? liveLinkTemplates
    : liveLinkTemplates.filter(t => templateCategory[t.id] === filterCategory);

  useEffect(() => {
    if (settings && settings.customerLiveLinkSettings && settings.customerLiveLinkSettings.selectedLiveLinkTemplate) {
      setSelectedTemplate(settings.customerLiveLinkSettings.selectedLiveLinkTemplate);
    }
  }, [settings]);

  const handleApplyTemplate = async (template) => {
    if (template.type === 'pro' && !isProUser) {
      // Direct them to subscription page
      toast.error('This is a Premium template. Please upgrade to unlock.');
      if (setCurrentTab) setCurrentTab('subscription');
      return;
    }

    const updatedSettings = {
      ...settings,
      customerLiveLinkSettings: {
        ...(settings.customerLiveLinkSettings || {}),
        selectedLiveLinkTemplate: template.id
      }
    };

    if (onSaveSettings) {
      await onSaveSettings(updatedSettings);
      setSelectedTemplate(template.id);
      toast.success(`${template.name} template applied to Live Links!`);
    }
  };

  // Preview renderer
  const renderPreview = (tplId) => {
    switch (tplId) {
      case 'classic':
        return (
          <div className="flex flex-col gap-1 p-2 bg-theme-card dark:bg-slate-800 h-full w-full border border-gray-200">
            <div className="h-4 w-1/3 bg-gray-300"></div>
            <div className="h-2 w-1/4 bg-gray-200 mt-2"></div>
            <div className="mt-auto h-8 w-full bg-blue-500 rounded text-[6px] text-white flex items-center justify-center font-bold">Pay Now</div>
          </div>
        );
      case 'modern':
        return (
          <div className="flex flex-col gap-1 p-2 bg-gray-100 h-full w-full">
              <div className="bg-theme-card p-2 rounded shadow-sm flex flex-col gap-1 h-full">
              <div className="h-3 w-1/3 bg-indigo-500 rounded"></div>
              <div className="h-2 w-1/2 bg-gray-200 rounded mt-2"></div>
              <div className="mt-auto h-8 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded text-[6px] text-white flex items-center justify-center font-bold">Pay Now</div>
            </div>
          </div>
        );
      case 'mobile':
        return (
          <div className="flex flex-col gap-1 px-4 py-2 bg-black h-full w-full rounded-[2rem] border-4 border-gray-800">
            <div className="h-3 w-1/2 bg-gray-400 mx-auto rounded mt-2"></div>
            <div className="h-10 w-full bg-gray-800 rounded mt-4"></div>
            <div className="mt-auto h-10 w-full bg-emerald-500 rounded-full text-[6px] text-white flex items-center justify-center font-bold">Pay Now</div>
          </div>
        );
      case 'retail':
        return (
          <div className="flex flex-col gap-1 p-2 bg-amber-50 h-full w-full border-dashed border-2 border-amber-200">
            <div className="h-3 w-full bg-amber-800 text-center"></div>
            <div className="h-1 border-b-2 border-dashed border-amber-300 my-1"></div>
            <div className="h-2 w-full bg-amber-100"></div>
            <div className="h-2 w-full bg-amber-100"></div>
            <div className="mt-auto h-8 w-full bg-amber-800 text-[6px] text-white flex items-center justify-center font-bold">Checkout</div>
          </div>
        );
      case 'corporate':
        return (
          <div className="flex flex-col gap-1 p-2 bg-theme-card h-full w-full border border-theme-border-strong">
            <div className="h-4 w-1/3 bg-emerald-500"></div>
            <div className="h-1 border-b border-theme-border-strong w-full my-1"></div>
            <div className="h-10 w-full bg-theme-surface"></div>
            <div className="mt-auto h-8 w-full bg-theme-card text-[6px] text-theme-primary flex items-center justify-center font-bold">Secure Payment</div>
          </div>
        );
      case 'boutique':
        return (
          <div className="flex flex-col gap-1 p-2 bg-rose-50 h-full w-full border border-rose-200">
            <div className="h-4 w-1/2 bg-rose-400 mx-auto rounded-full"></div>
            <div className="h-10 w-full bg-theme-card border border-rose-100 rounded mt-2"></div>
            <div className="mt-auto h-8 w-full bg-rose-500 rounded text-[6px] text-white flex items-center justify-center font-bold">Complete Order</div>
          </div>
        );
      case 'clinic':
        return (
          <div className="flex flex-col gap-1 p-2 bg-blue-50 h-full w-full border-t-8 border-blue-500">
            <div className="h-4 w-1/4 bg-blue-600 rounded"></div>
            <div className="h-8 w-full bg-theme-card rounded shadow-sm mt-2"></div>
            <div className="h-4 w-full bg-red-100 mt-1"></div>
            <div className="mt-auto h-8 w-full bg-blue-600 rounded text-[6px] text-white flex items-center justify-center font-bold">Pay Bill</div>
          </div>
        );
      case 'repair':
        return (
          <div className="flex flex-col gap-1 p-2 bg-zinc-800 h-full w-full border-l-4 border-yellow-500">
            <div className="h-4 w-1/3 bg-zinc-300"></div>
            <div className="h-8 w-full bg-zinc-700 mt-2"></div>
            <div className="h-2 w-1/2 bg-yellow-500 mt-1"></div>
            <div className="mt-auto h-8 w-full bg-yellow-500 text-[6px] text-zinc-900 flex items-center justify-center font-bold uppercase tracking-widest">Pay Invoice</div>
          </div>
        );
      default:
        return <div className="bg-gray-100 h-full w-full"></div>;
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="p-4 md:p-8 w-full space-y-6">
      <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-6 mb-6 section-header">
        <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 flex items-center justify-center shadow-sm">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Live Link Template Studio</h1>
          <p className="text-xs text-theme-muted font-bold mt-1">Select how your customers see your public invoice payment links.</p>
        </div>
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

      {filteredTemplates.length === 0 ? (
        <p className="text-sm text-theme-muted text-center py-12 font-semibold">No templates in this category yet.</p>
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
