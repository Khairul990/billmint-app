import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../../context/OnboardingContext';

const CountrySelection = () => {
  const { onboardingData, updateData, nextStep } = useOnboarding();

  const handleSelect = (country) => {
    updateData('country', country);
    
    // Auto-configure default payment setups based on country
    let paymentMethod = 'Manual';
    if (country === 'india') paymentMethod = 'UPI';
    if (country === 'bangladesh') paymentMethod = 'bKash';
    
    updateData('paymentSetup', { paymentMethod });
    nextStep();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div 
        className="max-w-2xl w-full bg-theme-card border border-theme-border-soft rounded-3xl shadow-premium p-8 md:p-12"
      >
        <h1 className="text-2xl md:text-3xl font-black text-center mb-2 text-theme-primary">Welcome to BillQyro!</h1>
        <p className="text-center text-theme-muted font-semibold mb-8">Select your country to configure regional settings automatically.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bangladesh */}
          <button 
            onClick={() => handleSelect('bangladesh')}
            className={`p-6 border-2 rounded-2xl hover:border-green-500 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center bg-theme-surface ${onboardingData.country === 'bangladesh' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-theme-border-soft'}`}
          >
            <div className="text-5xl mb-3">🇧🇩</div>
            <h3 className="font-extrabold text-lg text-theme-primary">Bangladesh</h3>
            <p className="text-xs font-bold text-theme-muted mt-1">bKash, Nagad, BDT</p>
          </button>
          
          {/* India */}
          <button 
            onClick={() => handleSelect('india')}
            className={`p-6 border-2 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center bg-theme-surface ${onboardingData.country === 'india' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-theme-border-soft'}`}
          >
            <div className="text-5xl mb-3">🇮🇳</div>
            <h3 className="font-extrabold text-lg text-theme-primary">India</h3>
            <p className="text-xs font-bold text-theme-muted mt-1">UPI, PhonePe, INR</p>
          </button>
          
          {/* Other */}
          <button 
            onClick={() => handleSelect('other')}
            className={`p-6 border-2 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center bg-theme-surface ${onboardingData.country === 'other' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-theme-border-soft'}`}
          >
            <div className="text-5xl mb-3">🌍</div>
            <h3 className="font-extrabold text-lg text-theme-primary">Other</h3>
            <p className="text-xs font-bold text-theme-muted mt-1">Bank Transfer, USD</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CountrySelection;
