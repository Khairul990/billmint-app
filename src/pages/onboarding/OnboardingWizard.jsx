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
      const next = Math.min(s + 1, 4);
      if (next === 4) {
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
        setStep(3);
        setIsSaving(false);
        return;
      }

      if (!isAddWorkspaceMode) {
        if (!formData.ownerName.trim()) {
          toast.error('Full Name is required');
          setStep(1);
          setIsSaving(false);
          return;
        }
        if (!formData.phone.trim() || formData.phone.trim().length < 7) {
          toast.error('A valid phone number is required');
          setStep(1);
          setIsSaving(false);
          return;
        }
        if (!formData.businessName.trim()) {
          toast.error('Business Name is required');
          setStep(2);
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

      // 2. Create or Update Primary Workspace
      const currentWorkspaces = Array.isArray(businessSettings?.businessWorkspaces) ? businessSettings.businessWorkspaces : [];
      
      const defaultWs = {
        id: 'ws_' + Date.now(),
        name: formData.businessName.trim() || selectedPreset.label,
        type: formData.businessType,
        enabledModules: formData.enabledModules.length > 0 ? formData.enabledModules : selectedPreset.recommendedModules,
        archived: false,
        createdAt: Date.now()
      };

      let updatedWorkspaces;
      if (isAddWorkspaceMode) {
        updatedWorkspaces = [...currentWorkspaces, defaultWs];
      } else {
        if (currentWorkspaces.length > 0) {
          const existingWs = currentWorkspaces[0];
          updatedWorkspaces = [{
            ...existingWs,
            name: formData.businessName.trim() || existingWs.name || selectedPreset.label,
            type: formData.businessType || existingWs.type,
            enabledModules: formData.enabledModules.length > 0 ? formData.enabledModules : (existingWs.enabledModules || selectedPreset.recommendedModules),
            archived: false
          }, ...currentWorkspaces.slice(1)];
        } else {
          updatedWorkspaces = [defaultWs];
        }
      }

      const activeWsId = isAddWorkspaceMode ? defaultWs.id : (updatedWorkspaces[0]?.id || defaultWs.id);
      
      let updatedSettings = {
        ...businessSettings,
        country: formData.country,
        countryCode: formData.countryCode,
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        locale: formData.locale,
        timezone: formData.timezone,
        businessWorkspaces: updatedWorkspaces,
        activeWorkspaceId: activeWsId
      };

      if (!isAddWorkspaceMode) {
        updatedSettings = {
          ...updatedSettings,
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          businessCategory: formData.businessType,
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
          defaultTax: 0,
          defaultTaxRate: 0,
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

  
  // STEP 1: Basic Profile
  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Your Profile</h1>
        <p className="text-sm font-bold text-theme-muted">Let's start with your basic details.</p>
      </div>

      <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-1 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Full Name <span className="text-theme-accent">*</span></label>
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
                placeholder="+91 98765 43210"
                className="w-full bg-theme-app border border-theme-border-soft rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all hover:border-theme-border"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // STEP 2: Create Business
  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Business Details</h1>
        <p className="text-sm font-bold text-theme-muted">What is the name of your business?</p>
      </div>

      <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 relative group">
            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 ml-1">Business Name <span className="text-theme-accent">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted group-focus-within:text-theme-accent transition-colors">
                <Store className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Apex Enterprises"
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

  // STEP 3: Choose Category
  const renderStep3 = () => (
    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your Category</h1>
        <p className="text-sm font-bold text-theme-muted">We will tailor the app to your industry.</p>
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
              className={`relative overflow-hidden p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border text-left transition-all duration-300 flex flex-col items-start hover:-translate-y-1 group min-h-[140px] ${
                isSelected 
                  ? 'bg-theme-accent/5 border-theme-accent shadow-[0_8px_30px_var(--accent-glow)] ring-2 ring-theme-accent/30 scale-[1.02]' 
                  : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/40 hover:shadow-xl'
              }`}
            >
              <div className={`absolute -inset-10 bg-gradient-to-br from-theme-accent/20 to-transparent opacity-0 transition-opacity duration-500 blur-3xl ${isSelected ? 'opacity-100' : 'group-hover:opacity-40'}`}></div>
              
              <div className="relative z-10 w-full flex flex-col h-full">
                <div className="flex items-start justify-between w-full mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 relative ${isSelected ? 'bg-[image:var(--accent-gradient)] text-white shadow-lg shadow-theme-accent/40 scale-110' : 'bg-theme-surface border border-theme-border-soft text-theme-muted group-hover:text-theme-accent group-hover:border-theme-accent/30 group-hover:bg-theme-accent/10'}`}>
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                  </div>
                  
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-theme-accent bg-theme-accent scale-100' : 'border-theme-border-soft group-hover:border-theme-accent/30 scale-90 opacity-50 group-hover:opacity-100'}`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-sm" />}
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

  // STEP 4: Ready
  const renderStep4 = () => (
    <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-10">
      <div className="w-24 h-24 bg-theme-success/10 text-theme-success rounded-[2rem] mx-auto flex items-center justify-center mb-6">
        <Play className="w-12 h-12 ml-2 fill-current" />
      </div>
      <h1 className="text-4xl font-black text-theme-primary tracking-tight">You're All Set!</h1>
      <p className="text-base font-bold text-theme-muted max-w-sm mx-auto">
        Your workspace is ready. You can configure advanced options like payments, taxes, and branding from the Settings Studio later.
      </p>
    </motion.div>
  );

return (
    <div className="min-h-screen bg-theme-main flex flex-col font-sans relative overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-theme-surface fixed top-0 left-0 z-50">
        <div 
          className="h-full bg-[image:var(--accent-gradient)] transition-all duration-700 ease-out shadow-[0_0_10px_var(--accent-glow)]"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className={`flex-1 w-full mx-auto p-6 md:p-12 flex flex-col justify-center pb-24 transition-all duration-500 relative z-10 ${step === 2 || step === 4 ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <AnimatePresence mode="wait">
                    {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-10 flex items-center gap-4 max-w-2xl w-full mx-auto">
          {step > 1 && step < 4 && (
            <button 
              type="button"
              onClick={() => { soundEngine.playClick(); prevStep(); }}
              className="py-4 px-6 bg-theme-card text-theme-primary font-black rounded-2xl border border-theme-border-soft hover:bg-theme-surface transition-colors"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button 
              type="button"
              onClick={() => { soundEngine.playClick(); nextStep(); }}
              disabled={
                (step === 1 && (!formData.ownerName.trim() || !formData.phone.trim())) ||
                (step === 2 && !formData.businessName.trim()) ||
                (step === 3 && !formData.businessType)
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
