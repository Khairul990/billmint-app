import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ChevronLeft, ChevronRight, Stethoscope, Store, ShoppingBasket, Wrench, Scissors, PenTool, LayoutTemplate, Pill } from 'lucide-react';
import Switch from 'react-switch';

const templatesList = [
  { id: 'doctor', label: 'Doctor / Clinic', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'retail', label: 'Shopping Mall', icon: Store, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'grocery', label: 'Small Shop / Grocery', icon: ShoppingBasket, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'repair', label: 'Service / Repair', icon: Wrench, color: 'text-theme-muted', bg: 'bg-theme-surface/10 border-theme-border-soft/30' },
  { id: 'embroidery', label: 'Embroidery / Tailor', icon: Scissors, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/30' },
  { id: 'custom', label: 'Custom (General)', icon: PenTool, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'all', label: 'All Templates', icon: LayoutTemplate, color: 'text-theme-accent', bg: 'bg-theme-accent/10 border-theme-accent/30' }
];

const TemplateSelection = () => {
  const { onboardingData, updateData, nextStep, prevStep } = useOnboarding();
  const [selectedTemplate, setSelectedTemplate] = useState(onboardingData.templateChoice || 'custom');
  const [pharmacyEnabled, setPharmacyEnabled] = useState(onboardingData.pharmacyEnabled || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData('templateChoice', selectedTemplate);
    updateData('pharmacyEnabled', pharmacyEnabled);
    nextStep();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div className="max-w-4xl w-full bg-theme-card border border-theme-border-soft rounded-3xl shadow-premium p-6 md:p-10">
        <div className="mb-8 text-center">
          <span className="text-[10px] bg-theme-accent/10 text-theme-accent px-3 py-1 rounded-full uppercase tracking-wider font-extrabold mb-3 inline-block">Step 4 of 5</span>
          <h2 className="text-2xl font-black text-theme-primary">Select Your Industry</h2>
          <p className="text-sm font-semibold text-theme-muted mt-1">This configures your default invoice columns (e.g. Size, Warranty, etc.)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templatesList.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-3 ${
                    isSelected 
                      ? `${tpl.bg} shadow-md scale-105` 
                      : 'border-theme-border-soft bg-theme-surface hover:bg-theme-app dark:hover:bg-theme-surface'
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-theme-card shadow-sm ${isSelected ? tpl.color : 'text-theme-muted'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className={`font-extrabold text-xs tracking-tight ${isSelected ? 'text-theme-primary' : 'text-theme-muted'}`}>
                    {tpl.label}
                  </h3>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedTemplate === 'doctor' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-blue-900 dark:text-blue-300 text-sm">Do you also run a Pharmacy?</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 font-semibold mt-0.5">Enable this to generate combined Medicine & Prescription bills.</p>
                  </div>
                </div>
                <Switch 
                  checked={pharmacyEnabled} 
                  onChange={setPharmacyEnabled} 
                  onColor="#3b82f6"
                  uncheckedIcon={false}
                  checkedIcon={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-6 border-t border-theme-border-soft mt-6">
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-xl font-bold text-theme-muted bg-theme-surface hover:bg-theme-app dark:hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-[image:var(--accent-gradient)] shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 text-sm uppercase tracking-wider">
              Complete Setup <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TemplateSelection;
