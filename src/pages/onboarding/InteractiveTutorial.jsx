import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { CheckCircle2, Circle, PlayCircle, SkipForward, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InteractiveTutorial = ({ businessSettings, onSaveSettings, setCurrentTab }) => {
  const { onboardingData } = useOnboarding();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Create your first invoice', completed: false },
    { id: 2, title: 'Download PDF', completed: false },
    { id: 3, title: 'Test live payment link', completed: false }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const handleTaskClick = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  const handleCompleteSetup = () => {
    setIsSaving(true);
    
    const country = onboardingData.country || 'other';
    let currencySymbol = '$';
    let currencyCode = 'USD';
    let taxLabel = 'Tax';
    if (country === 'india') {
      currencySymbol = '₹';
      currencyCode = 'INR';
      taxLabel = 'GST';
    } else if (country === 'bangladesh') {
      currencySymbol = '৳';
      currencyCode = 'BDT';
      taxLabel = 'VAT';
    }

    const payload = {
      ...businessSettings,
      setupCompleted: true,
      onboardingCompleted: true,
      tutorialCompleted: completedCount === 3,
      country: country,
      businessName: onboardingData.businessDetails.businessName,
      ownerName: onboardingData.businessDetails.ownerName,
      phone: onboardingData.businessDetails.phone,
      address: onboardingData.businessDetails.address,
      logoUrl: onboardingData.businessDetails.logoUrl,
      experience: onboardingData.businessDetails.experience,
      paymentQrEnabled: onboardingData.paymentSetup.paymentEnabled,
      paymentMethod: onboardingData.paymentSetup.paymentMethod,
      upiId: onboardingData.paymentSetup.upiId,
      bkashNumber: onboardingData.paymentSetup.bkashNumber,
      nagadNumber: onboardingData.paymentSetup.nagadNumber,
      customPaymentLink: onboardingData.paymentSetup.bankAccountDetails,
      defaultBillingTemplate: onboardingData.templateChoice,
      pharmacyEnabled: onboardingData.pharmacyEnabled,
      currency: currencySymbol,
      currencyCode,
      taxLabel,
      customerLiveLinkSettings: {
        enableLiveInvoiceLink: true,
        showPaymentQr: onboardingData.paymentSetup.paymentEnabled,
        allowCustomerPdfDownload: true,
        allowPaymentProofSubmit: true,
        showPaidDueAmount: true,
        showContactButton: true
      }
    };

    setTimeout(() => {
      onSaveSettings(payload);
      setIsSaving(false);
      toast.success('BillQyro workspace successfully initialized!');
      setCurrentTab('dashboard');
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div className="max-w-4xl w-full bg-theme-card border border-theme-border-soft rounded-3xl shadow-premium overflow-hidden flex flex-col md:flex-row">
        
        {/* Video Simulation Section */}
        <div className="md:w-1/2 bg-slate-900 p-8 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 z-0"></div>
          <motion.div 
            className="z-10 bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 mb-4 cursor-pointer hover:scale-110 transition-transform"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <PlayCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h3 className="z-10 text-white font-extrabold text-lg">Watch 1-Minute Tutorial</h3>
          <p className="z-10 text-white/70 text-xs mt-2 font-medium max-w-xs">Learn how to create invoices, share live links, and collect payments instantly.</p>
        </div>

        {/* Task List Section */}
        <div className="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-theme-primary mb-2">Getting Started</h2>
            <p className="text-sm text-theme-muted font-semibold mb-6">Complete these basic tasks to get familiar with your new dashboard.</p>
            
            <div className="space-y-4">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => handleTaskClick(task.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-theme-border-soft bg-theme-surface hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-theme-muted" />
                  )}
                  <span className={`font-bold ${task.completed ? 'text-theme-muted line-through' : 'text-theme-primary'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-theme-muted">Progress</span>
                <span className="text-theme-accent">{completedCount} / 3 Complete</span>
              </div>
              <div className="h-2 bg-theme-surface rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-theme-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-10">
            <button 
              onClick={handleCompleteSetup} 
              disabled={isSaving}
              className="text-theme-muted font-bold text-sm hover:text-theme-primary transition-colors flex items-center gap-1.5"
            >
              <SkipForward className="w-4 h-4" /> Skip Tutorial
            </button>
            <button 
              onClick={handleCompleteSetup}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl font-black text-white bg-[image:var(--accent-gradient)] shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 text-sm uppercase tracking-wider"
            >
              {isSaving ? 'Finishing...' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveTutorial;
