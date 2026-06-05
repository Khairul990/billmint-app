import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Switch from 'react-switch';
import { ChevronLeft, ChevronRight, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentSetup = () => {
  const { onboardingData, updateData, nextStep, prevStep } = useOnboarding();
  const { country } = onboardingData;
  const [formData, setFormData] = useState(onboardingData.paymentSetup);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (checked) => {
    setFormData({ ...formData, paymentEnabled: checked });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.paymentEnabled) {
      if (country === 'india' && !formData.upiId?.trim()) {
        toast.error('Please enter your UPI ID');
        return;
      }
      if (country === 'bangladesh' && !formData.bkashNumber?.trim() && !formData.nagadNumber?.trim()) {
        toast.error('Please enter at least one mobile banking number');
        return;
      }
      if (country === 'other' && !formData.bankAccountDetails?.trim()) {
        toast.error('Please enter your bank account or payment link details');
        return;
      }
    }
    updateData('paymentSetup', formData);
    nextStep();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div className="max-w-3xl w-full bg-theme-card border border-theme-border-soft rounded-3xl shadow-premium p-6 md:p-10">
        <div className="mb-8">
          <span className="text-[10px] bg-theme-accent/10 text-theme-accent px-3 py-1 rounded-full uppercase tracking-wider font-extrabold mb-3 inline-block">Step 3 of 5</span>
          <h2 className="text-2xl font-black text-theme-primary flex items-center gap-3">
            <QrCode className="w-8 h-8 text-theme-accent" />
            Enable Online Payments
          </h2>
          <p className="text-sm font-semibold text-theme-muted mt-1">Collect payments faster by generating QR codes on your invoices.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between p-5 bg-theme-surface border border-theme-border-soft rounded-2xl">
            <div>
              <h3 className="font-extrabold text-theme-primary text-sm uppercase tracking-wider">Enable Automated Scan-to-Pay</h3>
              <p className="text-xs text-theme-muted font-semibold mt-1">Add QR code and payment instructions on your bills.</p>
            </div>
            <Switch 
              checked={formData.paymentEnabled} 
              onChange={handleToggle} 
              onColor="#14b8a6"
              uncheckedIcon={false}
              checkedIcon={false}
              height={28}
              width={56}
              handleDiameter={22}
            />
          </div>
          
          <AnimatePresence>
            {formData.paymentEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                {country === 'india' && (
                  <div>
                    <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">UPI ID *</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="e.g. yourname@paytm or number@ybl"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
                    />
                  </div>
                )}
                
                {country === 'bangladesh' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">bKash Number</label>
                      <input
                        type="text"
                        name="bkashNumber"
                        value={formData.bkashNumber}
                        onChange={handleChange}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Nagad Number</label>
                      <input
                        type="text"
                        name="nagadNumber"
                        value={formData.nagadNumber}
                        onChange={handleChange}
                        placeholder="e.g. 019XXXXXXXX"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold"
                      />
                    </div>
                  </>
                )}
                
                {(country === 'other' || country === null) && (
                  <div>
                    <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase">Bank Account / Payment Link *</label>
                    <textarea
                      name="bankAccountDetails"
                      value={formData.bankAccountDetails}
                      onChange={handleChange}
                      placeholder="Account Name: ...&#10;Account Number: ...&#10;Bank Name: ..."
                      rows="3"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary font-bold resize-none"
                    />
                  </div>
                )}
                
                <p className="text-xs font-bold text-theme-accent bg-theme-accent/10 p-3 rounded-xl">
                  ✓ Valid QR Codes or payment buttons will be automatically generated for your customers.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-6 border-t border-theme-border-soft mt-6">
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-xl font-bold text-theme-muted bg-theme-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-[image:var(--accent-gradient)] shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 text-sm uppercase tracking-wider">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PaymentSetup;
