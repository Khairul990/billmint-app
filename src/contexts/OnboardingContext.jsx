import React, { createContext, useContext, useState } from 'react';
import { getSettings } from '../services/dbEngine';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(() => {
    // Initialize with existing settings if available
    const existing = getSettings() || {};
    return {
      country: existing.country || null,
      businessDetails: {
        businessName: existing.businessName || '',
        ownerName: existing.ownerName || '',
        phone: existing.phone || '',
        whatsapp: existing.phone || '',
        address: existing.address || '',
        logoUrl: existing.logoUrl || '',
        experience: existing.experience || 'beginner'
      },
      paymentSetup: {
        paymentEnabled: existing.paymentQrEnabled !== false,
        paymentMethod: existing.paymentMethod || 'UPI',
        upiId: existing.upiId || '',
        bkashNumber: existing.bkashNumber || '',
        nagadNumber: existing.nagadNumber || '',
        bankAccountDetails: existing.customPaymentLink || ''
      },
      templateChoice: existing.defaultBillingTemplate || null,
      pharmacyEnabled: existing.pharmacyEnabled || false,
      tutorialCompleted: existing.tutorialCompleted || false,
    };
  });

  const updateData = (section, data) => {
    setOnboardingData(prev => ({
      ...prev,
      [section]: typeof data === 'object' ? { ...prev[section], ...data } : data
    }));
  };

  const nextStep = () => {
    setOnboardingStep(prev => prev + 1);
  };

  const prevStep = () => {
    setOnboardingStep(prev => Math.max(prev - 1, 1));
  };

  const skipToTutorial = () => {
    setOnboardingStep(7);
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        onboardingStep, 
        setOnboardingStep, 
        onboardingData, 
        updateData, 
        nextStep, 
        prevStep,
        skipToTutorial
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
