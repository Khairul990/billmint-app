import React from 'react';
import {
    CheckCircle2,
    Circle,
    Building2,
    Users,
    FileText,
    FileDown,
    HardDrive,
    Activity,
    Sparkles,
} from 'lucide-react';

/**
 * Setup Progress Tracker — shows how far along the user is in configuring BillMint
 * @param {Object}  businessSettings - current business profile settings
 * @param {Array}   customers        - list of saved customers
 * @param {Array}   invoices         - list of created invoices
 */
const SetupProgress = ({ businessSettings = {}, customers = [], invoices = [] }) => {
    // Check each milestone
    const profileComplete = !!businessSettings.businessName;
    const customerAdded = customers.length > 0;
    const firstBillCreated = invoices.length > 0;

    const items = [
        {
            id: 'profile',
            label: 'Business Profile',
            icon: Building2,
            complete: profileComplete,
            detail: profileComplete ? 'Complete' : 'Incomplete',
        },
        {
            id: 'customer',
            label: 'Customer Added',
            icon: Users,
            complete: customerAdded,
            detail: customerAdded ? 'Complete' : 'Incomplete',
        },
        {
            id: 'bill',
            label: 'First Bill Created',
            icon: FileText,
            complete: firstBillCreated,
            detail: firstBillCreated ? 'Complete' : 'Incomplete',
        },
        {
            id: 'pdf',
            label: 'PDF Download',
            icon: FileDown,
            complete: true,
            detail: 'Ready',
        },
        {
            id: 'backup',
            label: 'Firebase / Local Backup',
            icon: HardDrive,
            complete: true,
            detail: 'Active',
        },
    ];

    const completedCount = items.filter((it) => it.complete).length;
    const progressPercent = Math.round((completedCount / items.length) * 100);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-sm">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                            <span>Setup Progress</span>
                            {progressPercent === 100 && (
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                            )}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {progressPercent}% Complete
                        </p>
                    </div>
                </div>

                {/* Percentage Circle */}
                <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                        {/* Background circle */}
                        <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            className="text-slate-100 dark:text-slate-800"
                            strokeWidth="3"
                        />
                        {/* Progress arc */}
                        <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${(progressPercent / 100) * 100.53} 100.53`}
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            {/* Milestone List */}
            <div className="space-y-2.5">
                {items.map((item) => {
                    const IconComp = item.icon;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/50 transition-all"
                        >
                            <div className="flex items-center gap-2.5">
                                {/* Status icon */}
                                <div
                                    className={`p-1.5 rounded-xl ${item.complete
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {item.label}
                                </span>
                            </div>

                            {/* Status badge */}
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${item.complete
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                                    }`}
                            >
                                {item.complete ? (
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                ) : (
                                    <Circle className="w-2.5 h-2.5" />
                                )}
                                <span>{item.detail}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SetupProgress;