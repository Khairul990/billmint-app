import React, { useState } from 'react';
import {
    Building2,
    UserPlus,
    FilePlus2,
    ListChecks,
    FileDown,
    BarChart3,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Sparkles,
    CheckCircle2,
    Circle,
} from 'lucide-react';

/**
 * “How to Use BillMint” — Step‑by‑Step Guide with pagination
 * @param {Function} setCurrentTab - navigation dispatcher
 * @param {boolean}  isNewUser - true ⇒ show full guide; false ⇒ collapsible compact
 */
const NewUserGuide = ({ setCurrentTab, isNewUser = true }) => {
    // If user is new → show guide expanded, otherwise collapsed by default
    const [collapsed, setCollapsed] = useState(!isNewUser);
    // Pagination state – we show 2 steps per page (6 steps → 3 pages)
    const stepsPerPage = 2;
    const [pageIdx, setPageIdx] = useState(0);

    const steps = [
        {
            id: 1,
            icon: Building2,
            title: 'Complete Business Profile',
            desc: 'Add your shop name, phone number, WhatsApp, email, address, logo, and invoice settings.',
            btnLabel: 'Open Settings',
            tab: 'admin-panel',
            gradient: 'from-emerald-400 to-teal-400',
            bgLight: 'bg-emerald-50',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            id: 2,
            icon: UserPlus,
            title: 'Add Customer Details',
            desc: 'Save customer name, phone number, address, and order information before creating a bill.',
            btnLabel: 'Add Customer',
            tab: 'customers',
            gradient: 'from-blue-400 to-cyan-400',
            bgLight: 'bg-blue-50',
            iconBg: 'bg-blue-100 text-blue-600',
        },
        {
            id: 3,
            icon: FilePlus2,
            title: 'Create Your First Bill',
            desc: 'Click Create Bill, add items or services, quantity, price, discount, paid amount, and due amount.',
            btnLabel: 'Create Bill',
            tab: 'create-invoice',
            gradient: 'from-emerald-400 to-teal-400',
            bgLight: 'bg-emerald-50',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
        {
            id: 4,
            icon: ListChecks,
            title: 'Track Payment & Order Status',
            desc: 'Mark invoices as Paid, Pending, In Progress, Ready, Delivered, or Cancelled.',
            btnLabel: 'View Invoices',
            tab: 'invoices',
            gradient: 'from-indigo-400 to-blue-400',
            bgLight: 'bg-indigo-50',
            iconBg: 'bg-indigo-100 text-indigo-600',
        },
        {
            id: 5,
            icon: FileDown,
            title: 'Download PDF Invoice',
            desc: 'Generate and download a professional PDF invoice for customers.',
            btnLabel: 'Download PDF Guide',
            tab: 'invoices',
            gradient: 'from-cyan-400 to-teal-400',
            bgLight: 'bg-cyan-50',
            iconBg: 'bg-cyan-100 text-cyan-600',
        },
        {
            id: 6,
            icon: BarChart3,
            title: 'Check Dashboard Reports',
            desc: 'View total revenue, pending amount, total invoices, customers, and recent activity.',
            btnLabel: 'View Dashboard',
            tab: 'dashboard',
            gradient: 'from-emerald-400 to-teal-400',
            bgLight: 'bg-emerald-50',
            iconBg: 'bg-emerald-100 text-emerald-600',
        },
    ];

    // --- Pagination helpers -------------------------------------------------
    const pageCount = Math.ceil(steps.length / stepsPerPage);
    const visibleSteps = steps.slice(pageIdx * stepsPerPage, (pageIdx + 1) * stepsPerPage);
    const canPrev = pageIdx > 0;
    const canNext = pageIdx < pageCount - 1;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-premium overflow-hidden transition-all duration-300">
            {/* Header – always visible */}
            <div className="flex items-center justify-between p-5 md:p-6">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
                            How to Use BillMint
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">
                            Follow these simple steps to create bills, manage customers, and download professional invoices.
                        </p>
                    </div>
                </div>
                {/* Collapse toggle for returning users */}
                {!isNewUser && (
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                        {collapsed ? (
                            <>
                                <span>Show Guide</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </>
                        ) : (
                            <>
                                <span>Hide Guide</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Guide cards – hidden when collapsed */}
            {!collapsed && (
                <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {visibleSteps.map(step => {
                            const IconComp = step.icon;
                            return (
                                <div
                                    key={step.id}
                                    className="group relative p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 hover:shadow-premium-hover hover:border-emerald-200 dark:hover:border-emerald-800/40 transition-all duration-300 flex flex-col"
                                >
                                    {/* Step number badge */}
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                        {step.id}
                                    </div>
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step.iconBg} dark:bg-slate-800 dark:text-emerald-400 mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                        <IconComp className="w-6 h-6" />
                                    </div>
                                    {/* Title */}
                                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1.5 leading-snug">
                                        {step.title}
                                    </h4>
                                    {/* Description */}
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 flex-1">
                                        {step.desc}
                                    </p>
                                    {/* Action Button */}
                                    <button
                                        onClick={() => setCurrentTab(step.tab)}
                                        className={`inline-flex items-center justify-center gap-1.5 bg-gradient-to-r ${step.gradient} text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] w-full cursor-pointer`}
                                    >
                                        <span>{step.btnLabel}</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {/* Pagination controls */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setPageIdx(idx => Math.max(idx - 1, 0))}
                            disabled={!canPrev}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium ${canPrev ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <ChevronDown className="w-3 h-3 transform rotate-90" />
                            <span>Previous</span>
                        </button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Page {pageIdx + 1} of {pageCount}
                        </span>
                        <button
                            onClick={() => setPageIdx(idx => Math.min(idx + 1, pageCount - 1))}
                            disabled={!canNext}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium ${canNext ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <span>Next</span>
                            <ChevronDown className="w-3 h-3 transform -rotate-90" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewUserGuide;