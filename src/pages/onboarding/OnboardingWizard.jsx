import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, CheckCircle2, ChevronRight, ChevronLeft, Building2, User, Paintbrush, Play,
  ShoppingBag, Stethoscope, Wrench, GraduationCap, Scissors, Briefcase
} from 'lucide-react';

const ALL_MODULES = [
  { id: 'billing', name: 'Invoicing & Billing', default: true },
  { id: 'customers', name: 'Customers (CRM)', default: true },
  { id: 'products', name: 'Products & Inventory', default: true },
  { id: 'dueLedger', name: 'Due Ledger', default: false },
  { id: 'expenses', name: 'Expenses Tracking', default: false },
  { id: 'reports', name: 'Reports & Analytics', default: true }
];

const THEMES = [
  { id: 'titanium-blue', name: 'Titanium Blue', color: '#2563EB' },
  { id: 'obsidian-gold', name: 'Obsidian Gold', color: '#B8860B' },
  { id: 'arctic-teal', name: 'Arctic Teal', color: '#009E7F' },
  { id: 'emerald-royal', name: 'Emerald Royal', color: '#10B981' },
  { id: 'midnight-ruby', name: 'Midnight Ruby', color: '#C0392B' },
  { id: 'deep-bluish-green', name: 'Deep Bluish Green', color: '#0f9d58' },
  { id: 'deep-blue-premium', name: 'Deep Blue Premium', color: '#1e40af' },
  { id: 'crimson-gold', name: 'Crimson Gold', color: '#d4af37' },
  { id: 'royal-black', name: 'Royal Black', color: '#eab308' },
  { id: 'luxury-cream', name: 'Luxury Cream', color: '#b48c59' }
];

const BUSINESS_TYPES = [
  { id: 'retail', name: 'Retail & Shop', icon: ShoppingBag, desc: 'For stores, boutiques, and groceries' },
  { id: 'service', name: 'Service & Repair', icon: Wrench, desc: 'For mechanics, plumbers, and technicians' },
  { id: 'doctor', name: 'Clinic / Doctor', icon: Stethoscope, desc: 'For clinics, hospitals, and pharmacies' },
  { id: 'teacher', name: 'Tutor / Teacher', icon: GraduationCap, desc: 'For coaching centers and tutors' },
  { id: 'tailor', name: 'Tailor / Fashion', icon: Scissors, desc: 'For tailors and fashion designers' },
  { id: 'freelance', name: 'Freelance / Agency', icon: Briefcase, desc: 'For consultants and digital agencies' },
];

const OnboardingWizard = ({ businessSettings = {}, onSaveSettings, setCurrentTab }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: 'retail',
    enabledModules: ['billing', 'customers', 'products', 'reports'],
    businessName: businessSettings.businessName || '',
    ownerName: businessSettings.ownerName || '',
    phone: businessSettings.phone || '',
    theme: 'titanium-blue'
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    // Create Default Workspace
    const defaultWs = {
      id: 'ws_default_' + Date.now(),
      name: 'Main Workspace',
      type: formData.businessType,
      enabledModules: formData.enabledModules,
      archived: false
    };

    const updatedSettings = {
      ...businessSettings,
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      phone: formData.phone,
      setupCompleted: true,
      businessWorkspaces: [defaultWs],
      activeWorkspaceId: defaultWs.id
    };

    // Apply Theme
    localStorage.setItem('billqyro_admin_default_theme', formData.theme);
    document.documentElement.setAttribute('data-theme', formData.theme);

    await onSaveSettings(updatedSettings);
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-theme-main flex flex-col font-sans relative overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-theme-surface fixed top-0 left-0 z-50">
        <div 
          className="h-full bg-theme-accent transition-all duration-500 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <Store className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-theme-primary tracking-tight">What describes your business?</h1>
                <p className="text-sm font-bold text-theme-muted">This helps us customize your workspace</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                    className={`p-5 rounded-3xl border text-left transition-all ${formData.businessType === type.id ? 'bg-theme-accent/5 border-theme-accent ring-2 ring-theme-accent/20' : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/50'}`}
                  >
                    <type.icon className={`w-8 h-8 mb-3 ${formData.businessType === type.id ? 'text-theme-accent' : 'text-theme-muted'}`} />
                    <h3 className="font-extrabold text-theme-primary text-sm">{type.name}</h3>
                    <p className="text-[10px] text-theme-muted font-semibold mt-1">{type.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your modules</h1>
                <p className="text-sm font-bold text-theme-muted">Enable the features you need</p>
              </div>

              <div className="space-y-3 bg-theme-card p-4 rounded-3xl border border-theme-border-soft shadow-premium">
                {ALL_MODULES.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      const enabled = formData.enabledModules;
                      if (enabled.includes(mod.id)) {
                        setFormData({ ...formData, enabledModules: enabled.filter(id => id !== mod.id) });
                      } else {
                        setFormData({ ...formData, enabledModules: [...enabled, mod.id] });
                      }
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors ${formData.enabledModules.includes(mod.id) ? 'bg-theme-accent/5 border-theme-accent/30' : 'bg-theme-app border-theme-border-soft hover:bg-theme-surface'}`}
                  >
                    <span className="font-extrabold text-sm text-theme-primary">{mod.name}</span>
                    {formData.enabledModules.includes(mod.id) ? (
                      <CheckCircle2 className="w-6 h-6 text-theme-accent" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-theme-border-soft" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <User className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-theme-primary tracking-tight">Business Details</h1>
                <p className="text-sm font-bold text-theme-muted">What should we call your workspace?</p>
              </div>

              <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
                <div>
                  <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. BillQyro Embroidery"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <Paintbrush className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-theme-primary tracking-tight">Choose your theme</h1>
                <p className="text-sm font-bold text-theme-muted">Make your workspace yours</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setFormData({ ...formData, theme: theme.id })}
                    className={`p-4 rounded-3xl border text-left transition-all flex items-center gap-3 ${formData.theme === theme.id ? 'bg-theme-accent/5 border-theme-accent ring-2 ring-theme-accent/20' : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.color }} />
                    <span className="font-extrabold text-theme-primary text-sm">{theme.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-10">
              <div className="w-24 h-24 bg-theme-success/10 text-theme-success rounded-[2rem] mx-auto flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h1 className="text-4xl font-black text-theme-primary tracking-tight">You're All Set!</h1>
              <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto">
                Your workspace is ready. Let's create your first invoice and start growing your business.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-10 flex items-center gap-4">
          {step > 1 && step < 5 && (
            <button 
              onClick={prevStep}
              className="py-4 px-6 bg-theme-card text-theme-primary font-black rounded-2xl border border-theme-border-soft hover:bg-theme-surface transition-colors"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button 
              onClick={nextStep}
              disabled={step === 3 && !formData.businessName.trim()}
              className="flex-1 py-4 bg-[image:var(--accent-gradient)] text-white font-black rounded-2xl shadow-premium flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="w-full py-4 bg-theme-success text-white font-black rounded-2xl shadow-premium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-current" /> Go To Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
