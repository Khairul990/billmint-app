import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, CheckCircle2, ChevronRight, ChevronLeft, Building2, User, Paintbrush, Play,
  ShoppingBag, Stethoscope, Wrench, GraduationCap, Scissors, Briefcase, FileText,
  CreditCard, ShieldCheck, Globe, Coffee, Settings
} from 'lucide-react';
import { BUSINESS_PRESETS, ALL_MODULES } from '../../config/businessPresets';

const iconMap = {
  ShoppingBag, Stethoscope, Wrench, GraduationCap, Scissors, Briefcase, FileText, Store, Palette: Paintbrush, Coffee, Settings
};

const OnboardingWizard = ({ businessSettings = {}, onSaveSettings, setCurrentTab }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: '', // Empty initially
    enabledModules: [],
    businessName: businessSettings.businessName || '',
    ownerName: businessSettings.ownerName || '',
    phone: businessSettings.phone || '',
    address: businessSettings.address || '',
    theme: 'titanium-blue',
    paymentMethod: 'skip',
    legalAgreed: false,
    language: 'English'
  });

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

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isAddWorkspaceMode = businessSettings?.setupCompleted === true;

  const handleFinish = async () => {
    // Create Workspace
    const defaultWs = {
      id: 'ws_' + Date.now(),
      name: formData.businessName.trim() || selectedPreset.label,
      type: formData.businessType,
      enabledModules: formData.enabledModules,
      archived: false,
      createdAt: Date.now()
    };

    const currentWorkspaces = businessSettings?.businessWorkspaces || [];
    
    let updatedSettings = {
      ...businessSettings,
      businessWorkspaces: [...currentWorkspaces, defaultWs],
      activeWorkspaceId: defaultWs.id
    };

    if (!isAddWorkspaceMode) {
      updatedSettings = {
        ...updatedSettings,
        businessName: formData.businessName.trim() || selectedPreset.label,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        setupCompleted: true,
        businessSetupCompleted: true,
        paymentSetupCompleted: true,
        legalAccepted: true,
        legalAcceptedAt: Date.now(),
        language: formData.language,
        paymentMethod: paymentForm
      };
      
      // Theme defaults handled outside in App/Settings
    }

    await onSaveSettings(updatedSettings);
    setCurrentTab('dashboard');
  };

  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your Business Type</h1>
        <p className="text-sm font-bold text-theme-muted">Select ONE main business to start. You can add more later.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {BUSINESS_PRESETS.map(type => {
          const IconComponent = iconMap[type.iconName] || Store;
          return (
            <button
              key={type.id}
              onClick={() => {
                setFormData({ ...formData, businessType: type.id });
                if (type.id === 'billing_only') {
                  // Pre-set and skip to payment/legal maybe?
                }
              }}
              className={`p-4 rounded-3xl border text-left transition-all flex flex-col items-start ${formData.businessType === type.id ? 'bg-theme-accent/5 border-theme-accent ring-2 ring-theme-accent/20' : 'bg-theme-card border-theme-border-soft hover:border-theme-accent/50'}`}
            >
              <IconComponent className={`w-8 h-8 mb-3 ${formData.businessType === type.id ? 'text-theme-accent' : 'text-theme-muted'}`} />
              <h3 className="font-extrabold text-theme-primary text-sm">{type.label}</h3>
              <p className="text-[10px] text-theme-muted font-semibold mt-1">{type.shortDesc}</p>
            </button>
          )
        })}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Business Details</h1>
        <p className="text-sm font-bold text-theme-muted">Tell us about {selectedPreset.label} (Optional)</p>
      </div>

      <div className="space-y-5 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        <div>
          <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Business Name</label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            placeholder={`e.g. My ${selectedPreset.label}`}
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
        <div>
          <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. 123 Main Street"
            className="w-full bg-theme-app border border-theme-border-soft rounded-xl p-4 text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => {
    if (formData.businessType === 'billing_only') {
      return (
        <motion.div key="step3_billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center py-10">
          <div className="w-24 h-24 bg-theme-accent/10 text-theme-accent rounded-[2rem] mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Billing Only Mode</h1>
          <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto">
            You have selected the simple mode. Your workspace will only show essential billing features.
          </p>
        </motion.div>
      );
    }

    const availableModules = ALL_MODULES.filter(m => !selectedPreset.hiddenModules.includes(m.id));

    return (
      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Select your modules</h1>
          <p className="text-sm font-bold text-theme-muted">We have pre-selected recommended features for a {selectedPreset.label}.</p>
        </div>

        <div className="space-y-3 bg-theme-card p-4 rounded-3xl border border-theme-border-soft shadow-premium">
          {availableModules.map(mod => {
            const isRecommended = selectedPreset.recommendedModules.includes(mod.id);
            const isEnabled = formData.enabledModules.includes(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => {
                  if (isEnabled) {
                    setFormData({ ...formData, enabledModules: formData.enabledModules.filter(id => id !== mod.id) });
                  } else {
                    setFormData({ ...formData, enabledModules: [...formData.enabledModules, mod.id] });
                  }
                }}
                className={`w-full flex flex-col p-4 rounded-2xl border transition-colors ${isEnabled ? 'bg-theme-accent/5 border-theme-accent/30' : 'bg-theme-app border-theme-border-soft hover:bg-theme-surface'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-sm text-theme-primary flex items-center gap-2">
                    {mod.name}
                    {isRecommended && <span className="bg-theme-accent text-white text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider">Recommended</span>}
                  </span>
                  {isEnabled ? (
                    <CheckCircle2 className="w-6 h-6 text-theme-accent" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-theme-border-soft" />
                  )}
                </div>
                <p className="text-xs text-theme-muted font-medium mt-1 text-left">{mod.desc}</p>
              </button>
            )
          })}
        </div>
      </motion.div>
    );
  };

  const [paymentForm, setPaymentForm] = useState({
    indiaUpi: '',
    bdBkash: '',
    bdNagad: '',
    bankName: '',
    accHolder: '',
    accNum: ''
  });

  const handleSpeak = (text, langCode) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const renderStep4 = () => (
    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-theme-primary tracking-tight">Payment Setup</h1>
        <p className="text-sm font-bold text-theme-muted">How do you want to get paid? (You can skip this for now)</p>
      </div>

      <div className="space-y-4 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
        
        {/* India Payment */}
        <div className="p-4 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-3">
          <label className="block text-xs font-black text-theme-muted uppercase tracking-wider">India (UPI ID)</label>
          <input 
            value={paymentForm.indiaUpi}
            onChange={(e) => setPaymentForm({...paymentForm, indiaUpi: e.target.value})}
            placeholder="e.g. name@okhdfcbank" 
            className="w-full bg-theme-surface border border-theme-border-soft rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-theme-accent" 
          />
        </div>

        {/* Bangladesh Payment */}
        <div className="p-4 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-3">
          <label className="block text-xs font-black text-theme-muted uppercase tracking-wider">Bangladesh (MFS)</label>
          <div className="flex gap-2">
            <input 
              value={paymentForm.bdBkash}
              onChange={(e) => setPaymentForm({...paymentForm, bdBkash: e.target.value})}
              placeholder="bKash Number" 
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-theme-accent" 
            />
            <input 
              value={paymentForm.bdNagad}
              onChange={(e) => setPaymentForm({...paymentForm, bdNagad: e.target.value})}
              placeholder="Nagad Number" 
              className="w-full bg-theme-surface border border-theme-border-soft rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-theme-accent" 
            />
          </div>
        </div>

        {/* Other Bank */}
        <div className="p-4 border border-theme-border-soft rounded-2xl bg-theme-app text-left space-y-3">
          <label className="block text-xs font-black text-theme-muted uppercase tracking-wider">Bank Transfer (Other)</label>
          <input 
            value={paymentForm.bankName}
            onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
            placeholder="Bank Name" 
            className="w-full bg-theme-surface border border-theme-border-soft rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-theme-accent mb-2" 
          />
          <input 
            value={paymentForm.accNum}
            onChange={(e) => setPaymentForm({...paymentForm, accNum: e.target.value})}
            placeholder="Account Number / IBAN" 
            className="w-full bg-theme-surface border border-theme-border-soft rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-theme-accent" 
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep5 = () => {
    if (isAddWorkspaceMode) {
      return (
        <motion.div key="step5_skip" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center py-10">
          <div className="w-24 h-24 bg-theme-accent/10 text-theme-accent rounded-[2rem] mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Legal Already Accepted</h1>
          <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto">
            You have already accepted the platform legal terms globally. Click continue.
          </p>
        </motion.div>
      );
    }

    const legalTextEnglish = "BillQyro provides software for billing and management. We are not responsible for any financial disputes, fraudulent transactions, or incorrect data entry. You agree to use this software legally. Fake invoice generation, tax evasion, and scam activities are strictly prohibited.";
    const legalTextBengali = "বিলকায়রো বিলিং এবং পরিচালনার জন্য সফটওয়্যার প্রদান করে। আমরা কোনো আর্থিক বিরোধ, জালিয়াতি, বা ভুল ডেটা এন্ট্রির জন্য দায়ী নই। আপনি এই সফ্টওয়্যারটি আইনত ব্যবহার করতে সম্মত। জাল চালান তৈরি, কর ফাঁকি, এবং কেলেঙ্কারী কার্যক্রম কঠোরভাবে নিষিদ্ধ।";
    const legalTextHindi = "बिलकायरो बिलिंग और प्रबंधन के लिए सॉफ्टवेयर प्रदान करता है। हम किसी भी वित्तीय विवाद, धोखाधड़ी वाले लेनदेन या गलत डेटा प्रविष्टि के लिए ज़िम्मेदार नहीं हैं। आप इस सॉफ़्टवेयर का कानूनी रूप से उपयोग करने के लिए सहमत हैं। नकली चालान, कर चोरी और घोटाले की गतिविधियाँ सख्त वर्जित हैं।";

    return (
      <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-theme-accent/10 text-theme-accent rounded-3xl mx-auto flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight">Legal & Language</h1>
          <p className="text-sm font-bold text-theme-muted">Final step before you enter the dashboard</p>
        </div>

        <div className="space-y-6 bg-theme-card p-6 rounded-3xl border border-theme-border-soft shadow-premium">
          <div>
            <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-2"><Globe className="w-4 h-4"/> Select Language</label>
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

          <div className="p-4 bg-theme-danger/5 border border-theme-danger/20 rounded-2xl">
            <h4 className="text-theme-danger text-sm font-black mb-2 flex items-center gap-2">Fraud Warning</h4>
            <p className="text-xs text-theme-danger/80 font-semibold leading-relaxed mb-4">
              {legalTextEnglish}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleSpeak(legalTextEnglish, 'en-US')} className="text-[10px] bg-theme-danger/10 text-theme-danger px-3 py-1.5 rounded-full font-bold hover:bg-theme-danger/20 flex items-center gap-1">
                <Play className="w-3 h-3"/> Listen (EN)
              </button>
              <button onClick={() => handleSpeak(legalTextBengali, 'bn-BD')} className="text-[10px] bg-theme-danger/10 text-theme-danger px-3 py-1.5 rounded-full font-bold hover:bg-theme-danger/20 flex items-center gap-1">
                <Play className="w-3 h-3"/> Listen (BN)
              </button>
              <button onClick={() => handleSpeak(legalTextHindi, 'hi-IN')} className="text-[10px] bg-theme-danger/10 text-theme-danger px-3 py-1.5 rounded-full font-bold hover:bg-theme-danger/20 flex items-center gap-1">
                <Play className="w-3 h-3"/> Listen (HI)
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-theme-app rounded-2xl border border-theme-border-soft cursor-pointer hover:bg-theme-surface transition-colors">
            <input 
              type="checkbox" 
              checked={formData.legalAgreed} 
              onChange={(e) => setFormData({...formData, legalAgreed: e.target.checked})}
              className="w-5 h-5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent" 
            />
            <span className="text-sm font-bold text-theme-primary">I have read and agree.</span>
          </label>
        </div>
      </motion.div>
    );
  };

  const renderStep6 = () => (
    <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-10">
      <div className="w-24 h-24 bg-theme-success/10 text-theme-success rounded-[2rem] mx-auto flex items-center justify-center mb-6">
        <Play className="w-12 h-12 ml-2 fill-current" />
      </div>
      <h1 className="text-4xl font-black text-theme-primary tracking-tight">You're All Set!</h1>
      <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto">
        Your {selectedPreset.label} workspace is ready. Let's create your first record and start growing your business.
      </p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-theme-main flex flex-col font-sans relative overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-theme-surface fixed top-0 left-0 z-50">
        <div 
          className="h-full bg-theme-accent transition-all duration-500 ease-out"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center pb-24">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-10 flex items-center gap-4">
          {step > 1 && step < 6 && (
            <button 
              onClick={prevStep}
              className="py-4 px-6 bg-theme-card text-theme-primary font-black rounded-2xl border border-theme-border-soft hover:bg-theme-surface transition-colors"
            >
              Back
            </button>
          )}
          {step < 6 ? (
            <button 
              onClick={nextStep}
              disabled={(step === 1 && !formData.businessType) || (step === 5 && !isAddWorkspaceMode && !formData.legalAgreed)}
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
