import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, CheckCircle2, ChevronRight, ChevronLeft, Building2, User, Paintbrush, Play,
  ShoppingBag, Stethoscope, Wrench, GraduationCap, Scissors, Briefcase, FileText,
  CreditCard, ShieldCheck, Globe, Coffee, Settings, Info, Monitor, Phone, Mail, MapPin, Smartphone, Check
} from 'lucide-react';
import { BUSINESS_PRESETS, ALL_MODULES } from '../../config/businessPresets';
import { authEngine } from '../../services/authEngine';
import { featureControlEngine } from '../../services/featureControlEngine';
import { soundEngine } from '../../utils/soundEngine';

const iconMap = {
  ShoppingBag, Stethoscope, Wrench, GraduationCap, Scissors, Briefcase, FileText, Store, Palette: Paintbrush, Coffee, Settings, Monitor
};

const MODULE_FEATURES = {
  billing: ['invoice'],
  customers: ['customer'],
  patients: ['customer'],
  students: ['customer'],
  clients: ['customer'],
  products: ['product'],
  dueLedger: ['treasury'],
  expenses: ['treasury', 'treasury.moneyOut'],
  reports: ['reports'],
  paymentProofs: ['payment'],
  orders: ['operations.orders'],
  appointments: ['operations.appointments'],
  delivery: ['operations.delivery'],
  measurements: ['operations.measurements'],
  designBook: ['operations.designBook'],
  devices: ['operations.devices'],
  serviceJobs: ['operations.serviceJobs'],
  projects: ['operations.projects']
};

const COUNTRIES = [
  {
    id: 'India',
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    desc: 'INR (₹) · UPI & Bank Transfers'
  },
  {
    id: 'Bangladesh',
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    currency: 'BDT',
    currencySymbol: '৳',
    locale: 'bn-BD',
    timezone: 'Asia/Dhaka',
    desc: 'BDT (৳) · bKash, Nagad & Bank Transfers'
  },
  {
    id: 'Other',
    code: 'GLOBAL',
    name: 'Other Region',
    flag: '🌐',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timezone: 'UTC',
    desc: 'USD ($) / Custom · Global manual billing'
  }
];

const OnboardingWizard = ({ businessSettings = {}, onSaveSettings, onComplete, setCurrentTab }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    country: businessSettings.country || 'India',
    countryCode: businessSettings.countryCode || 'IN',
    currency: businessSettings.currency || 'INR',
    currencySymbol: businessSettings.currencySymbol || '₹',
    locale: businessSettings.locale || 'en-IN',
    timezone: businessSettings.timezone || 'Asia/Kolkata',
    businessType: '',
    enabledModules: [],
    businessName: businessSettings.businessName || '',
    ownerName: businessSettings.ownerName || '',
    ownerEmail: authEngine.getAuthSession()?.userEmail || businessSettings.email || '',
    phone: businessSettings.phone || '',
    address: businessSettings.address || '',
    whatsapp: businessSettings.whatsapp || '',
    paymentMethod: 'skip',
    legalAgreed: false,
    language: 'English'
  });

  const [paymentForm, setPaymentForm] = useState({
    indiaUpi: businessSettings.upiId || '',
    bdBkash: businessSettings.bkashNumber || '',
    bdNagad: businessSettings.nagadNumber || '',
    bankName: businessSettings.bankDetails?.bankName || '',
    accHolder: businessSettings.bankDetails?.accountHolder || '',
    accNum: businessSettings.bankDetails?.accountNumber || '',
    skipPayment: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const selectedPreset = useMemo(() => {
    return BUSINESS_PRESETS.find(p => p.id === formData.businessType) || BUSINESS_PRESETS[0];
  }, [formData.businessType]);

  // When business type changes, auto-select recommended modules
  useEffect(() => {
    if (formData.businessType) {
      const preset = BUSINESS_PRESETS.find(p => p.id === formData.businessType);
      if (preset) {
        setFormData(prev => ({
          ...prev,
          enabledModules: [...preset.recommendedModules]
        }));
      }
    }
  }, [formData.businessType]);

  const selectCountry = (countryItem) => {
    setFormData(prev => ({
      ...prev,
      country: countryItem.id,
      countryCode: countryItem.code,
      currency: countryItem.currency,
      currencySymbol: countryItem.currencySymbol,
      locale: countryItem.locale,
      timezone: countryItem.timezone
    }));
  };

  const nextStep = () => {
    setStep(s => {
      const next = Math.min(s + 1, 7);
      if (next === 7) {
        import('../../utils/feedback').then(({ triggerPaymentSuccessFeedback, triggerVoiceFeedback }) => {
          triggerPaymentSuccessFeedback();
          triggerVoiceFeedback("You're all set! Welcome to BillQyro.");
          window.dispatchEvent(new Event('trigger-confetti'));
        }).catch(() => {});
      }
      return next;
    });
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isAddWorkspaceMode = businessSettings?.setupCompleted === true;

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 1. Client validations
      if (!formData.businessType) {
        toast.error('Please select your business type');
        setStep(2);
        setIsSaving(false);
        return;
      }

      if (!isAddWorkspaceMode) {
        if (!formData.ownerName.trim()) {
          toast.error('Full Name is required');
          setStep(3);
          setIsSaving(false);
          return;
        }
        if (!formData.phone.trim() || formData.phone.trim().length < 7) {
          toast.error('A valid phone number is required');
          setStep(3);
          setIsSaving(false);
          return;
        }
        if (!formData.businessName.trim()) {
          toast.error('Business Name is required');
          setStep(3);
          setIsSaving(false);
          return;
        }
        if (!formData.legalAgreed) {
          toast.error('Please accept the legal terms to proceed');
          setStep(6);
          setIsSaving(false);
          return;
        }
      }

      const paymentMethod = paymentForm.indiaUpi
        ? 'UPI'
        : paymentForm.bdBkash
          ? 'bKash'
          : paymentForm.bdNagad
            ? 'Nagad'
            : (paymentForm.bankName || paymentForm.accNum)
              ? 'Bank Transfer'
              : 'Manual';

      // 2. Create Workspace
      const defaultWs = {
        id: 'ws_' + Date.now(),
        name: formData.businessName.trim() || selectedPreset.label,
        type: formData.businessType,
        enabledModules: formData.enabledModules.length > 0 ? formData.enabledModules : selectedPreset.recommendedModules,
        archived: false,
        createdAt: Date.now()
      };

      const currentWorkspaces = businessSettings?.businessWorkspaces || [];
      
      let updatedSettings = {
        ...businessSettings,
        country: formData.country,
        countryCode: formData.countryCode,
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        locale: formData.locale,
        timezone: formData.timezone,
        businessWorkspaces: [...currentWorkspaces, defaultWs],
        activeWorkspaceId: defaultWs.id
      };

      if (!isAddWorkspaceMode) {
        updatedSettings = {
          ...updatedSettings,
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          ownerName: formData.ownerName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
          setupCompleted: true,
          profileSetupCompleted: true,
          businessSetupCompleted: true,
          paymentSetupCompleted: true,
          legalAccepted: true,
          legalAcceptedAt: Date.now(),
          language: formData.language,
          defaultBillingTemplate: formData.businessType,
          paymentMethod,
          paymentQrEnabled: Boolean(paymentForm.indiaUpi || paymentForm.bdBkash || paymentForm.bdNagad),
          upiId: paymentForm.indiaUpi.trim(),
          bkashNumber: paymentForm.bdBkash.trim(),
          nagadNumber: paymentForm.bdNagad.trim(),
          bankDetails: {
            bankName: paymentForm.bankName.trim(),
            accountHolder: paymentForm.accHolder.trim(),
            accountNumber: paymentForm.accNum.trim()
          }
        };
      }

      soundEngine.playPaymentSuccess();

      // 3. Save settings via provided callback
      if (typeof onComplete === 'function') {
        await onComplete(updatedSettings);
      } else if (typeof onSaveSettings === 'function') {
        await onSaveSettings(updatedSettings);
      }

      // 4. Initialize feature toggles
      const featureIds = [...new Set(defaultWs.enabledModules.flatMap(module => MODULE_FEATURES[module] || []))];
      for (const featureId of featureIds) {
        await featureControlEngine.toggleFeature(defaultWs.id, featureId, true).catch(() => null);
      }

      if (typeof setCurrentTab === 'function') {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Onboarding save error:', err);
      toast.error('Failed to complete onboarding. Please retry.');
      setIsSaving(false);
    }
  };

  // STEP 1: Country / Region
  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your Region & Currency</h1>
        <p className="text-sm font-bold text-theme-muted">Configure currency, phone format, and local payment methods.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COUNTRIES.map(c => {
          const isSelected = formData.country === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                selectCountry(c);
              }}
              className={`relative p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col items-start group ${
                isSelected
                  ? 'bg-theme-accent/5 border-theme-accent shadow-[0_8px_30px_var(--accent-glow)] ring-2 ring-theme-accent/30 scale-[1.02]'
                  : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/40 hover:shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-4xl">{c.flag}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-theme-accent bg-theme-accent' : 'border-theme-border-soft'
                }`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />}
                </div>
              </div>
              <h3 className="font-black text-lg text-theme-primary mb-1">{c.name}</h3>
              <p className="text-xs font-bold text-theme-accent mb-2">{c.currencySymbol} ({c.currency})</p>
              <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">{c.desc}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // STEP 2: Business Type
  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your Business Type</h1>
        <p className="text-sm font-bold text-theme-muted">Select ONE main business to start. You can add more workspaces later.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-5">
        {BUSINESS_PRESETS.map(type => {
          const IconComponent = iconMap[type.iconName] || Store;
          const isSelected = formData.businessType === type.id;
          return (
            <button
              key={type.id}
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => {
                soundEngine.playClick();
                setFormData({ ...formData, businessType: type.id });
              }}
              className={`relative overflow-hidden p-5 md:p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col items-start hover:-translate-y-1 group ${
                isSelected 
                  ? 'bg-theme-accent/5 border-theme-accent shadow-[0_8px_30px_var(--accent-glow)] ring-2 ring-theme-accent/30 scale-[1.02]' 
                  : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/40 hover:shadow-xl'
              }`}
            >
              <div className={`absolute -inset-10 bg-gradient-to-br from-theme-accent/20 to-transparent opacity-0 transition-opacity duration-500 blur-3xl ${isSelected ? 'opacity-100' : 'group-hover:opacity-40'}`}></div>
              
              <div className="relative z-10 w-full flex flex-col h-full">
                <div className="flex items-start justify-between w-full mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${isSelected ? 'bg-[image:var(--accent-gradient)] text-white shadow-lg shadow-theme-accent/40 scale-110' : 'bg-theme-surface border border-theme-border-soft text-theme-muted group-hover:text-theme-accent group-hover:border-theme-accent/30 group-hover:bg-theme-accent/10'}`}>
                    <IconComponent className="w-6 h-6 relative z-10" />
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-theme-accent bg-theme-accent scale-100' : 'border-theme-border-soft group-hover:border-theme-accent/30 scale-90 opacity-50 group-hover:opacity-100'}`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />}
                  </div>
                </div>
                
                <h3 className={`font-black text-sm md:text-[15px] mb-1.5 transition-colors duration-300 ${isSelected ? 'text-theme-accent' : 'text-theme-primary group-hover:text-theme-accent'}`}>{type.label}</h3>
                <p className={`text-[10px] md:text-xs font-bold leading-relaxed transition-colors ${isSelected ? 'text-theme-accent/80' : 'text-theme-muted group-hover:text-theme-muted/80'}`}>{type.shortDesc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // STEP 3: Owner Profile & Business Profile
  const renderStep3 = () => (
    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Owner & Business Details</h1>
        <p className="text-sm font-bold text-theme-muted">Configure your official billing identity.</p>
      </div>

      <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        <div className="p-4 bg-theme-surface rounded-xl border border-theme-border-soft mb-2 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" />
          <p className="text-xs text-theme-muted font-bold leading-relaxed">
            Your name, phone number, and business details appear on customer invoices and live payment receipts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-1 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Owner Full Name <span className="text-theme-accent">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>
          
          <div className="md:col-span-1 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Phone Number <span className="text-theme-accent">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={formData.country === 'Bangladesh' ? '+880 1712 345678' : '+91 98765 43210'}
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>

          <div className="md:col-span-2 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={formData.ownerEmail}
                readOnly
                className="w-full bg-theme-surface border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-muted opacity-70 cursor-not-allowed"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <span className="text-[9px] font-black uppercase text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-md">Verified Auth</span>
              </span>
            </div>
          </div>

          <div className="md:col-span-1 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Business Name <span className="text-theme-accent">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder={`e.g. Apex ${selectedPreset.label || 'Enterprises'}`}
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>

          <div className="md:col-span-1 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">WhatsApp Number (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <Smartphone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="WhatsApp for bill delivery"
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>

          <div className="md:col-span-2 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Business Address (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Shop 12, Market Complex, City"
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // STEP 4: Module Selection
  const renderStep4 = () => {
    const availableModules = ALL_MODULES.filter(m => !selectedPreset.hiddenModules.includes(m.id));

    return (
      <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your modules</h1>
          <p className="text-sm font-bold text-theme-muted">We pre-selected recommended features for a {selectedPreset.label}. You can toggle them anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 bg-theme-card p-4 md:p-5 rounded-3xl border border-theme-border-soft shadow-premium">
          {availableModules.map(mod => {
            const isRecommended = selectedPreset.recommendedModules.includes(mod.id);
            const isEnabled = formData.enabledModules.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick();
                  if (isEnabled) {
                    setFormData({ ...formData, enabledModules: formData.enabledModules.filter(id => id !== mod.id) });
                  } else {
                    setFormData({ ...formData, enabledModules: [...formData.enabledModules, mod.id] });
                  }
                }}
                className={`w-full flex flex-col p-4 rounded-2xl border transition-all hover-glow-effect relative overflow-hidden group ${isEnabled ? 'bg-theme-accent/5 border-theme-accent/50 shadow-[0_0_15px_var(--accent-glow)]' : 'bg-theme-app border-theme-border-soft hover:bg-theme-surface hover:border-theme-border'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-theme-accent/10 to-transparent transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
                
                <div className="flex items-start justify-between w-full relative z-10 mb-1">
                  <div className="flex flex-col gap-1 items-start text-left">
                    {isRecommended && <span className="bg-theme-accent text-white text-[8px] uppercase px-1.5 py-0.5 rounded-sm tracking-widest shadow-sm font-black">Recommended</span>}
                    <span className="font-extrabold text-[13px] md:text-sm text-theme-primary leading-tight">
                      {mod.name}
                    </span>
                  </div>
                  {isEnabled ? (
                    <CheckCircle2 className="w-5 h-5 text-theme-accent drop-shadow-sm shrink-0 ml-2" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-theme-border-soft transition-colors group-hover:border-theme-accent/30 shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-[10px] text-theme-muted font-bold mt-1 text-left relative z-10 leading-relaxed pr-2">{mod.desc}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // STEP 5: Payment Setup
  const renderStep5 = () => (
    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Payment Receiving Setup</h1>
        <p className="text-sm font-bold text-theme-muted">Configure how customers pay you. (Optional · You can skip for now)</p>
      </div>

      <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        
        {/* India Payment Methods */}
        {formData.country === 'India' && (
          <div className="p-5 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-4 hover-glow-effect transition-all relative overflow-hidden group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest relative z-10 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-theme-accent" /> India UPI ID (for QR payment on bills)
            </label>
            <input 
              value={paymentForm.indiaUpi}
              onChange={(e) => setPaymentForm({...paymentForm, indiaUpi: e.target.value})}
              placeholder="e.g. yourbusiness@okhdfcbank" 
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-4 px-5 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border" 
            />
          </div>
        )}

        {/* Bangladesh Payment Methods */}
        {formData.country === 'Bangladesh' && (
          <div className="p-5 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-4 hover-glow-effect transition-all relative overflow-hidden group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest relative z-10 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-theme-accent" /> Bangladesh Mobile Financial Services (MFS)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                value={paymentForm.bdBkash}
                onChange={(e) => setPaymentForm({...paymentForm, bdBkash: e.target.value})}
                placeholder="bKash Merchant / Personal No." 
                className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-4 px-5 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border" 
              />
              <input 
                value={paymentForm.bdNagad}
                onChange={(e) => setPaymentForm({...paymentForm, bdNagad: e.target.value})}
                placeholder="Nagad Merchant / Personal No." 
                className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-4 px-5 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border" 
              />
            </div>
          </div>
        )}

        {/* Bank Details */}
        <div className="p-5 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-4 hover-glow-effect transition-all relative overflow-hidden group">
          <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest relative z-10 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-theme-accent" /> Bank Transfer Details (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              value={paymentForm.bankName}
              onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
              placeholder="Bank Name (e.g. HDFC / City Bank)" 
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-4 px-5 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border" 
            />
            <input 
              value={paymentForm.accNum}
              onChange={(e) => setPaymentForm({...paymentForm, accNum: e.target.value})}
              placeholder="Account Number / IBAN" 
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-4 px-5 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border" 
            />
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-theme-muted font-bold">
            💡 You can always configure or update payment details in <span className="text-theme-accent">Settings Studio</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );

  // STEP 6: Legal & Consent
  const renderStep6 = () => {
    const legalTextEnglish = "BillQyro provides enterprise software for billing and financial management. We are not responsible for any direct financial disputes, fraudulent transactions, or incorrect data entry. You agree to use this software legally. Fake invoice generation, tax evasion, and scam activities are strictly prohibited.";
    const legalTextBengali = "বিলকায়রো বিলিং এবং পরিচালনার জন্য সফটওয়্যার প্রদান করে। আমরা কোনো আর্থিক বিরোধ, জালিয়াতি, বা ভুল ডেটা এন্ট্রির জন্য দায়ী নই। আপনি এই সফ্টওয়্যারটি আইনত ব্যবহার করতে সম্মত। জাল চালান তৈরি, কর ফাঁকি, এবং কেলেঙ্কারী কার্যক্রম কঠোরভাবে নিষিদ্ধ।";
    const legalTextHindi = "বিলকায়রো বিলিং এবং আর্থিক ব্যবস্থাপনার জন্য সফটওয়্যার প্রদান করে। আমরা কোনো আর্থিক বিরোধ বা ভুল এন্ট্রির জন্য দায়ী নই। জাল চালান তৈরি ও প্রতারণামূলক কার্যক্রম সম্পূর্ণ নিষিদ্ধ।";

    return (
      <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Legal Consent & Language</h1>
          <p className="text-sm font-bold text-theme-muted">Final verification before you enter your Dashboard.</p>
        </div>

        <div className="space-y-6 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
          <div>
            <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4"/> Select Interface Language
            </label>
            <select 
              value={formData.language} 
              onChange={(e) => setFormData({...formData, language: e.target.value})}
              className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors appearance-none"
            >
              <option value="English">English</option>
              <option value="Bengali">Bengali / বাংলা</option>
              <option value="Hindi">Hindi / हिन्दी</option>
            </select>
          </div>

          <div className="p-5 bg-theme-app border border-theme-border-soft rounded-2xl hover-glow-effect transition-all">
            <h4 className="text-theme-primary text-sm font-black mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-theme-accent" /> Legal Compliance & Platform Safety Agreement
            </h4>
            <p className="text-xs text-theme-muted font-bold leading-relaxed mb-5">
              {legalTextEnglish}
            </p>
          </div>

          <label className="flex items-center gap-3 p-4 bg-theme-app rounded-2xl border border-theme-border-soft cursor-pointer hover:bg-theme-surface transition-colors">
            <input 
              type="checkbox" 
              checked={formData.legalAgreed} 
              onChange={(e) => setFormData({...formData, legalAgreed: e.target.checked})}
              className="w-5 h-5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent" 
            />
            <span className="text-sm font-bold text-theme-primary">I have read, understood, and agree to the Terms of Service & Privacy Policy.</span>
          </label>
        </div>
      </motion.div>
    );
  };

  // STEP 7: Final Completion
  const renderStep7 = () => (
    <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-10">
      <div className="w-24 h-24 bg-theme-success/10 text-theme-success rounded-[2rem] mx-auto flex items-center justify-center mb-6">
        <Play className="w-12 h-12 ml-2 fill-current" />
      </div>
      <h1 className="text-4xl font-black text-theme-primary tracking-tight">You're All Set!</h1>
      <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto">
        Your {selectedPreset.label} workspace is configured for <strong>{formData.country}</strong> ({formData.currencySymbol}). Click below to start invoicing.
      </p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-theme-main flex flex-col font-sans relative overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-theme-surface fixed top-0 left-0 z-50">
        <div 
          className="h-full bg-[image:var(--accent-gradient)] transition-all duration-700 ease-out shadow-[0_0_10px_var(--accent-glow)]"
          style={{ width: `${(step / 7) * 100}%` }}
        />
      </div>

      <div className={`flex-1 w-full mx-auto p-6 md:p-12 flex flex-col justify-center pb-24 transition-all duration-500 relative z-10 ${step === 2 || step === 4 ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-10 flex items-center gap-4 max-w-2xl w-full mx-auto">
          {step > 1 && step < 7 && (
            <button 
              type="button"
              onClick={() => { soundEngine.playClick(); prevStep(); }}
              className="py-4 px-6 bg-theme-card text-theme-primary font-black rounded-2xl border border-theme-border-soft hover:bg-theme-surface transition-colors"
            >
              Back
            </button>
          )}
          {step < 7 ? (
            <button 
              type="button"
              onClick={() => { soundEngine.playClick(); nextStep(); }}
              disabled={
                (step === 1 && !formData.country) ||
                (step === 2 && !formData.businessType) || 
                (step === 3 && !isAddWorkspaceMode && (!formData.ownerName.trim() || !formData.phone.trim() || !formData.businessName.trim())) ||
                (step === 6 && !isAddWorkspaceMode && !formData.legalAgreed)
              }
              className="flex-1 py-4 bg-theme-accent text-white font-black rounded-2xl shadow-lg shadow-theme-accent/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => { soundEngine.playClick(); handleFinish(); }}
              disabled={isSaving}
              className="w-full py-4 bg-theme-success text-white font-black rounded-2xl shadow-premium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving Workspace..." : <> <Play className="w-5 h-5 fill-current" /> Go To Dashboard </>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
