import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * How to Use BillQyro – Dashboard Card
 * Links to the full Guide page.
 */
const NewUserGuide = ({ setCurrentTab, isNewUser }) => {
    // If not a new user, we can still show it but maybe less prominently, 
    // or just show it as a normal card. The prompt says "Show it strongly when [new user]".
    // We'll give it a prominent gradient if they are a new user.
    
    return (
        <div className={`rounded-3xl p-6 md:p-8 border shadow-premium relative overflow-hidden transition-all duration-300 ${isNewUser ? 'bg-gradient-to-br from-slate-900 to-[#071B3A] text-white border-slate-800' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800/80'}`}>
            
            {isNewUser && (
                <>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-xl ${isNewUser ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'} shadow-sm`}>
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className={`font-extrabold text-lg md:text-xl tracking-tight ${isNewUser ? 'text-white' : 'text-slate-900'}`}>
                            How to Use BillQyro
                        </h3>
                    </div>
                    <p className={`text-sm md:text-base font-medium leading-relaxed ${isNewUser ? 'text-slate-300' : 'text-slate-500'}`}>
                        Learn how to complete your profile, add customers, create bills, track payments, and download PDF invoices.
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentTab('guide')}
                    className={`shrink-0 inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-4 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer ${isNewUser ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/20' : 'bg-[#071B3A] text-white hover:bg-[#0a2652] shadow-[#071B3A]/10'}`}
                >
                    <span>Open User Guide</span>
                    <ArrowRight className="w-4 h-4" />
                </motion.button>
            </div>
        </div>
    );
};

export default NewUserGuide;