import React from 'react';
import { OnboardingProvider, useOnboarding } from '../../contexts/OnboardingContext';
import { motion, AnimatePresence } from 'framer-motion';

// Steps
import CountrySelection from './CountrySelection';
import BusinessDetailsForm from './BusinessDetailsForm';
import PaymentSetup from './PaymentSetup';
import TemplateSelection from './TemplateSelection';
import WelcomeBoard from './WelcomeBoard';
import InteractiveTutorial from './InteractiveTutorial';

const OnboardingSteps = ({ businessSettings, onSaveSettings, setCurrentTab }) => {
  const { onboardingStep } = useOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:to-indigo-950 flex flex-col justify-center font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={onboardingStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {onboardingStep === 2 && <CountrySelection />}
          {onboardingStep === 3 && <BusinessDetailsForm />}
          {onboardingStep === 4 && <PaymentSetup />}
          {onboardingStep === 5 && <TemplateSelection />}
          {onboardingStep === 6 && <WelcomeBoard />}
          {onboardingStep === 7 && <InteractiveTutorial businessSettings={businessSettings} onSaveSettings={onSaveSettings} setCurrentTab={setCurrentTab} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const OnboardingWizard = ({ businessSettings, onSaveSettings, setCurrentTab }) => {
  return (
    <OnboardingProvider>
      <OnboardingSteps 
        businessSettings={businessSettings} 
        onSaveSettings={onSaveSettings} 
        setCurrentTab={setCurrentTab} 
      />
    </OnboardingProvider>
  );
};

export default OnboardingWizard;
