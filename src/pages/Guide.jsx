import React from 'react';
import {
    Building2,
    UserPlus,
    FilePlus2,
    ListChecks,
    FileDown,
    BarChart3,
    ArrowRight,
    Sparkles
} from 'lucide-react';

/**
 * How to Use BillQyro Page
 * Matches Reference Image 2: Centered title, 6 guide cards, get started button
 */
const Guide = ({ setCurrentTab }) => {
    const steps = [
        {
            id: 1,
            icon: Building2,
            title: 'Complete Business Profile',
            desc: 'Add your shop name, phone number, WhatsApp, email, address, logo, and invoice settings.',
            btnLabel: 'Open Settings',
            tab: 'admin-panel',
            gradient: 'from-emerald-400 to-teal-400',
        },
        {
            id: 2,
            icon: UserPlus,
            title: 'Add Customers',
            desc: 'Save customer name, phone number, address, and order information before creating a bill.',
            btnLabel: 'Add Customer',
            tab: 'customers',
            gradient: 'from-blue-400 to-cyan-400',
        },
        {
            id: 3,
            icon: FilePlus2,
            title: 'Create Bill',
            desc: 'Click Create Bill, add items or services, quantity, price, discount, paid amount, and due amount.',
            btnLabel: 'Create Bill',
            tab: 'create-invoice',
            gradient: 'from-emerald-400 to-teal-400',
        },
        {
            id: 4,
            icon: ListChecks,
            title: 'Track Payments',
            desc: 'Mark invoices as Paid, Pending, In Progress, Ready, Delivered, or Cancelled.',
            btnLabel: 'View Invoices',
            tab: 'invoices',
            gradient: 'from-indigo-400 to-blue-400',
        },
        {
            id: 5,
            icon: FileDown,
            title: 'Download PDF Invoice',
            desc: 'Generate and download a professional PDF invoice for customers.',
            btnLabel: 'Download PDF Guide',
            tab: 'invoices',
            gradient: 'from-cyan-400 to-teal-400',
        },
        {
            id: 6,
            icon: BarChart3,
            title: 'View Reports',
            desc: 'View total revenue, pending amount, total invoices, customers, and recent activity.',
            btnLabel: 'View Dashboard',
            tab: 'dashboard',
            gradient: 'from-emerald-400 to-teal-400',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
            
            <div className="w-full max-w-5xl space-y-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-slate-100 mb-2">
                        <Sparkles className="w-8 h-8 text-teal-500" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        How to Use BillQyro
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl mx-auto">
                        Follow these simple steps to set up your business profile, manage customers, and generate premium PDF invoices in seconds.
                    </p>
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {steps.map(step => {
                        const IconComp = step.icon;
                        return (
                            <div key={step.id} className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 hover:border-teal-200 hover:shadow-premium-hover transition-all duration-300 flex flex-col items-start relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                                
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <IconComp className="w-6 h-6" />
                                </div>
                                
                                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400">
                                    {step.id}
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">
                                    {step.title}
                                </h3>
                                
                                <p className="text-xs text-slate-500 font-medium leading-relaxed flex-1 mb-6">
                                    {step.desc}
                                </p>
                                
                                <button
                                    onClick={() => setCurrentTab(step.tab)}
                                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r ${step.gradient} text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer`}
                                >
                                    <span>{step.btnLabel}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Action */}
                <div className="pt-8 text-center border-t border-slate-200/60 mt-10">
                    <button
                        onClick={() => setCurrentTab('dashboard')}
                        className="inline-flex items-center gap-2 bg-[#071B3A] text-white font-bold text-sm tracking-wide px-8 py-4 rounded-xl hover:bg-[#0a2652] transition-colors shadow-lg shadow-[#071B3A]/20 active:scale-[0.98]"
                    >
                        <span>Get Started Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Guide;
