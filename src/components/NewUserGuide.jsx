import React from 'react';
import {
    Building2,
    UserPlus,
    FilePlus2,
    ListChecks,
    FileDown,
    BarChart3,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Circle,
} from 'lucide-react';

/**
 * How to Use BillQyro – Static Guide Page
 * Renders six step cards in a responsive grid and a "Get Started" button.
 * @param {Function} setCurrentTab - navigation dispatcher (e.g., switch to dashboard)
 */
const NewUserGuide = ({ setCurrentTab }) => {
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
            title: 'Add Customer Details',
            desc: 'Save customer name, phone number, address, and order information before creating a bill.',
            btnLabel: 'Add Customer',
            tab: 'customers',
            gradient: 'from-blue-400 to-cyan-400',
        },
        {
            id: 3,
            icon: FilePlus2,
            title: 'Create Your First Bill',
            desc: 'Click Create Bill, add items or services, quantity, price, discount, paid amount, and due amount.',
            btnLabel: 'Create Bill',
            tab: 'create-invoice',
            gradient: 'from-emerald-400 to-teal-400',
        },
        {
            id: 4,
            icon: ListChecks,
            title: 'Track Payment & Order Status',
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
            title: 'Check Dashboard Reports',
            desc: 'View total revenue, pending amount, total invoices, customers, and recent activity.',
            btnLabel: 'View Dashboard',
            tab: 'dashboard',
            gradient: 'from-emerald-400 to-teal-400',
        },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-premium overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-sm">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 tracking-tight">
                        How to Use BillQyro
                    </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight mb-6">
                    Follow these simple steps to create bills, manage customers, and download professional invoices.
                </p>
                {/* Grid of cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {steps.map(step => {
                        const IconComp = step.icon;
                        return (
                            <div key={step.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 hover:shadow-premium-hover hover:border-emerald-200 dark:hover:border-emerald-800/40 transition-all duration-300 flex flex-col">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-lg bg-emerald-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600`}> {step.id} </div>
                                    <IconComp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                                    {step.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3 flex-1">
                                    {step.desc}
                                </p>
                                <button
                                    onClick={() => setCurrentTab(step.tab)}
                                    className={`inline-flex items-center justify-center gap-1.5 bg-gradient-to-r ${step.gradient} text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] w-full`}
                                >
                                    <span>{step.btnLabel}</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                {/* Get Started Button */}
                <div className="text-center">
                    <button
                        onClick={() => setCurrentTab('dashboard')}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewUserGuide;