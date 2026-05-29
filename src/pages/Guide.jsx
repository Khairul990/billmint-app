import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, Settings, Users, Plus, ListChecks, FileDown, 
    BarChart3, CheckCircle2, Calculator, HelpCircle, FileText, LayoutDashboard, ChevronDown, MousePointer2, Search
} from 'lucide-react';

/**
 * FAQ Accordion Component
 */
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-theme-border-soft rounded-2xl overflow-hidden bg-theme-card dark:bg-theme-card mb-3 shadow-sm hover:border-theme-border-soft transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 text-left flex items-center justify-between focus:outline-none hover:bg-theme-app dark:bg-theme-surface transition-colors"
            >
                <span className="font-bold text-theme-primary dark:text-theme-primary text-sm">{question}</span>
                <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-4 text-xs font-medium text-theme-muted leading-relaxed border-t border-theme-border-soft dark:border-theme-border-soft pt-3 bg-theme-app dark:bg-theme-surface">
                    {answer}
                </div>
            )}
        </div>
    );
};

// --- MINI UI ILLUSTRATIONS (HTML/CSS ONLY) - MADE BIGGER & CLEARER ---
const UIProfileMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex items-center gap-3 mb-2 border-b border-theme-border-soft pb-3">
            <div className="w-10 h-10 bg-theme-accent-light rounded-full flex items-center justify-center"><Settings className="w-5 h-5 text-theme-accent"/></div>
            <div>
                <div className="text-xs font-bold text-theme-primary dark:text-theme-primary">Business Settings</div>
                <div className="text-[10px] text-theme-muted">Business Profile</div>
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-8 w-full bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-md flex items-center px-3 text-[10px] text-theme-muted">Shop Name...</div>
            <div className="h-8 w-full bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-md flex items-center px-3 text-[10px] text-theme-muted">Phone Number...</div>
            <div className="h-8 w-2/3 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-md flex items-center px-3 text-[10px] text-theme-muted">GST/Tax details...</div>
        </div>
        <div className="mt-auto h-9 w-full bg-theme-accent hover:opacity-90 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-md">
            Save Profile
        </div>
    </div>
);

const UICustomerMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-theme-primary dark:text-theme-primary">Customers</div>
            <div className="bg-theme-accent text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold shadow-sm">
                <Plus className="w-3 h-3"/> Add New
            </div>
        </div>
        <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft pb-3">
                <div className="w-10 h-10 bg-theme-accent-light text-theme-accent rounded-full flex items-center justify-center font-bold text-sm">RA</div>
                <div>
                    <div className="text-xs font-bold text-theme-primary dark:text-theme-primary">Rahim Ahmed</div>
                    <div className="text-[10px] text-theme-muted">+91 98765 43210</div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-2 w-3/4 bg-theme-surface dark:bg-theme-card rounded"></div>
                <div className="h-2 w-1/2 bg-theme-surface dark:bg-theme-card rounded"></div>
            </div>
        </div>
    </div>
);

const UIInvoiceMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex justify-between items-center border-b border-theme-border-soft pb-3">
            <div className="text-sm font-black text-theme-accent">Create Bill</div>
            <div className="text-[10px] font-bold text-theme-muted">INV-1001</div>
        </div>
        <div className="bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="text-[11px] font-bold text-theme-muted">Select Customer...</div>
            <ChevronDown className="w-4 h-4 text-theme-muted"/>
        </div>
        <div className="flex gap-3">
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg h-20 p-3 flex flex-col justify-center shadow-sm">
                <div className="text-[10px] text-theme-muted mb-1">Issue Date</div>
                <div className="text-xs font-bold text-theme-primary dark:text-theme-muted">Today</div>
            </div>
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg h-20 p-3 flex flex-col justify-center shadow-sm">
                <div className="text-[10px] text-theme-muted mb-1">Due Date</div>
                <div className="text-xs font-bold text-theme-primary dark:text-theme-muted">Next Week</div>
            </div>
        </div>
    </div>
);

const UIItemsMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-4 flex flex-col shadow-inner">
        <div className="flex border-b border-theme-border-soft pb-2 mb-3 text-[9px] font-black text-theme-muted uppercase tracking-wider">
            <div className="flex-[2]">Item / Service</div>
            <div className="flex-1 text-center">Qty</div>
            <div className="flex-1 text-center">Price</div>
            <div className="flex-1 text-right">Total</div>
        </div>
        <div className="flex items-center mb-3 text-[10px] font-bold text-theme-primary dark:text-theme-muted">
            <div className="flex-[2] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded px-2 py-1.5 truncate">Embroidery</div>
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded mx-1 px-2 py-1.5 text-center">2</div>
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded mx-1 px-2 py-1.5 text-center">500</div>
            <div className="flex-1 text-right text-theme-primary dark:text-theme-primary">1000</div>
        </div>
        <div className="mt-auto flex justify-end">
            <div className="w-2/3 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-3 shadow-sm space-y-2">
                <div className="flex justify-between text-[10px]"><span className="text-theme-muted">Subtotal</span><span className="font-bold">₹1000</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-theme-muted">Paid</span><span className="font-bold text-theme-accent">₹500</span></div>
                <div className="flex justify-between text-xs border-t border-theme-border-soft dark:border-theme-border-soft pt-1 mt-1"><span className="font-black">Due</span><span className="font-black text-theme-danger">₹500</span></div>
            </div>
        </div>
    </div>
);

const UIStatusMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-5 flex flex-col gap-4 shadow-inner justify-center">
        <div className="flex items-center justify-between w-full bg-theme-card dark:bg-theme-card p-3.5 rounded-xl border border-theme-border-soft shadow-sm">
            <div className="text-xs font-bold text-theme-primary dark:text-theme-muted">Invoice #1001</div>
            <div className="px-3 py-1 bg-theme-accent-light text-theme-accent rounded-full text-[10px] font-black tracking-wide">PAID</div>
        </div>
        <div className="flex items-center justify-between w-full bg-theme-card dark:bg-theme-card p-3.5 rounded-xl border border-theme-border-soft shadow-sm">
            <div className="text-xs font-bold text-theme-primary dark:text-theme-muted">Invoice #1002</div>
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black tracking-wide">PENDING</div>
        </div>
        <div className="flex items-center justify-between w-full bg-theme-card dark:bg-theme-card p-3.5 rounded-xl border border-theme-border-soft shadow-sm">
            <div className="text-xs font-bold text-theme-primary dark:text-theme-muted">Order #205</div>
            <div className="px-3 py-1 bg-theme-accent-light text-theme-accent rounded-full text-[10px] font-black tracking-wide">IN PROGRESS</div>
        </div>
    </div>
);

const UIPDFMockup = () => (
    <div className="w-full h-full bg-theme-border-soft rounded-xl p-5 flex items-center justify-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
        <div className="w-[140px] h-full bg-theme-card dark:bg-theme-card shadow-xl border border-theme-border-soft flex flex-col p-3 relative z-10">
            <div className="flex justify-between items-start mb-4 border-b border-theme-border-soft pb-3">
                <div className="w-10 h-10 bg-theme-surface dark:bg-theme-card flex items-center justify-center rounded"><Settings className="w-5 h-5 text-theme-muted"/></div>
                <div className="text-[8px] font-black text-theme-primary dark:text-theme-primary text-right uppercase">INVOICE<br/><span className="text-theme-muted font-medium">#1001</span></div>
            </div>
            <div className="space-y-1.5 mb-4">
                <div className="h-1.5 w-full bg-theme-border-soft rounded"></div>
                <div className="h-1.5 w-5/6 bg-theme-border-soft rounded"></div>
                <div className="h-1.5 w-3/4 bg-theme-border-soft rounded"></div>
            </div>
            <div className="mt-auto border-t border-theme-border-soft pt-2 flex justify-end">
                <div className="bg-theme-accent text-white text-[8px] font-bold px-2 py-1 rounded">Download PDF</div>
            </div>
        </div>
    </div>
);

const UIDashboardMockup = () => (
    <div className="w-full h-full bg-theme-app dark:bg-theme-surface rounded-xl border-2 border-theme-border-soft p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex gap-3">
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-3 shadow-sm">
                <div className="text-[9px] text-theme-muted font-bold mb-1 uppercase tracking-wide">Revenue</div>
                <div className="text-sm font-black text-theme-primary dark:text-theme-primary">₹24,500</div>
            </div>
            <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-3 shadow-sm">
                <div className="text-[9px] text-theme-muted font-bold mb-1 uppercase tracking-wide">Pending</div>
                <div className="text-sm font-black text-theme-danger">₹3,200</div>
            </div>
        </div>
        <div className="flex-1 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-lg p-4 flex items-end justify-between gap-2 shadow-sm">
            <div className="w-full bg-theme-accent-light rounded-t h-1/4"></div>
            <div className="w-full bg-theme-accent-light rounded-t h-2/4"></div>
            <div className="w-full bg-theme-accent rounded-t h-3/4"></div>
            <div className="w-full bg-theme-accent rounded-t h-[90%]"></div>
            <div className="w-full bg-theme-accent rounded-t h-full"></div>
        </div>
    </div>
);


/**
 * Main Visual User Guide Component
 */
const Guide = ({ setCurrentTab }) => {
    const [activeStep, setActiveStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const steps = [
        {
            id: 1,
            title: 'Complete Business Profile',
            explanation: 'First add your business/shop name, phone number, WhatsApp, email, address, logo, currency, invoice prefix, and tax settings.',
            whereToClick: 'Sidebar > Settings',
            buttonText: 'Open Settings',
            tab: 'settings',
            tip: 'This information will appear on your invoice PDF.',
            Mockup: UIProfileMockup,
            color: 'text-theme-accent',
            bg: 'bg-theme-accent-light'
        },
        {
            id: 2,
            title: 'Add Customer',
            explanation: 'Add customer name, phone number, address, and order details before creating a bill.',
            whereToClick: 'Sidebar > Customers > Add Customer',
            buttonText: 'Add Customer',
            tab: 'customers',
            tip: 'Saved customers can be reused in future invoices.',
            Mockup: UICustomerMockup,
            color: 'text-theme-accent',
            bg: 'bg-theme-accent-light'
        },
        {
            id: 3,
            title: 'Create New Bill',
            explanation: 'Click Create Bill or Create Invoice, then select customer and fill invoice details.',
            whereToClick: 'Sidebar > Invoices > Create Bill',
            buttonText: 'Create Bill',
            tab: 'create-invoice',
            tip: 'You can save as draft before final invoice.',
            Mockup: UIInvoiceMockup,
            color: 'text-theme-accent',
            bg: 'bg-theme-accent-light'
        },
        {
            id: 4,
            title: 'Add Items or Services',
            explanation: 'Add item/service name, description, quantity, price, tax, discount, paid amount, and due amount.',
            whereToClick: 'Invoice Form > Add Item',
            buttonText: 'Open Invoice Form',
            tab: 'create-invoice',
            tip: 'Total, paid, and due amount should calculate automatically.',
            Mockup: UIItemsMockup,
            color: 'text-theme-accent',
            bg: 'bg-theme-accent-light'
        },
        {
            id: 5,
            title: 'Track Payment Status',
            explanation: 'Update payment status as Paid, Pending, Due, or Overdue. Update order status as Pending, In Progress, Ready, Delivered, or Cancelled.',
            whereToClick: 'Invoices > Payment Status',
            buttonText: 'View Invoices',
            tab: 'invoices',
            tip: 'Status badges help you quickly understand customer/order progress.',
            Mockup: UIStatusMockup,
            color: 'text-theme-warning',
            bg: 'bg-amber-100'
        },
        {
            id: 6,
            title: 'Download PDF Invoice',
            explanation: 'After creating the bill, preview the invoice and download a professional PDF invoice.',
            whereToClick: 'Invoice Preview > Download PDF',
            buttonText: 'View Invoices',
            tab: 'invoices',
            tip: 'PDF should use real invoice and business profile data.',
            Mockup: UIPDFMockup,
            color: 'text-theme-danger',
            bg: 'bg-rose-100'
        },
        {
            id: 7,
            title: 'Send WhatsApp Reminders',
            explanation: 'You can instantly send payment reminders and invoice links directly to your customers via WhatsApp.',
            whereToClick: 'Invoices > WhatsApp Button',
            buttonText: 'View Invoices',
            tab: 'invoices',
            tip: 'The reminder message is pre-formatted with due amount and bill number automatically.',
            Mockup: UIStatusMockup,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            id: 8,
            title: 'View Reports & Manage Data',
            explanation: 'Use dashboard reports to check revenue, and go to Settings to backup your data safely.',
            whereToClick: 'Dashboard or Settings',
            buttonText: 'View Dashboard',
            tab: 'dashboard',
            tip: 'You can export JSON backups of all your data from Settings anytime.',
            Mockup: UIDashboardMockup,
            color: 'text-theme-accent',
            bg: 'bg-theme-accent-light'
        }
    ];

    const faqs = [
        { q: "How do I create my first bill quickly?", a: "Use the 'Quick Bill' button on the bottom menu on mobile, or navigate to Create Invoice from the sidebar. You can create bills without selecting existing customers or products to save time." },
        { q: "How do I add customer details?", a: "Go to the Customers tab and click 'New Customer'. Fill out their contact information. This allows you to quickly select them later when making bills." },
        { q: "How do I download PDF?", a: "Once an invoice is created, go to the Invoices list or dashboard, and click the 'Download PDF' icon on the specific invoice card." },
        { q: "How do I send WhatsApp Reminders?", a: "Open any Invoice card and tap the WhatsApp 'Send Reminder' button. It will open WhatsApp with a ready-made message containing the total due and invoice link." },
        { q: "How do I mark payment as paid?", a: "Open the invoice from the Invoices tab and adjust the 'Amount Paid' field to match the 'Grand Total', or simply change the payment status badge." },
        { q: "How do I Backup or Restore my data?", a: "Go to Settings > Data Backup. From here, you can 'Export Database' to download a backup file, 'Import Database' to restore, or force a 'Sync to Cloud'." },
        { q: "What happens if internet is offline?", a: "BillQyro works completely offline! All data is securely stored in your browser's LocalStorage. It will sync automatically when you reconnect." },
        { q: "How do I refresh data on mobile?", a: "Simply pull down from the top of the screen on Dashboard, Invoices, Customers, or Expenses to trigger a manual refresh (Pull-to-refresh)." }
    ];

    const filteredFaqs = faqs.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setActiveStep(prev => prev < steps.length ? prev + 1 : prev);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveStep(prev => prev > 1 ? prev - 1 : prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [steps.length]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    return (
        <motion.div 
            className="w-full bg-theme-app dark:bg-theme-surface min-h-screen py-8 px-4 md:px-8 font-sans antialiased"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* PAGE HEADER */}
                <div className="text-center md:text-left space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-surface dark:bg-theme-surface text-theme-accent text-xs font-bold uppercase tracking-wider mb-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>Official User Guide</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">
                        How to Use BillQyro
                    </h1>
                    <p className="text-sm md:text-base text-theme-muted font-medium max-w-3xl leading-relaxed">
                        Learn step by step how to create bills, manage customers, track payments, and download professional PDF invoices.
                    </p>
                </div>

                {/* SECTION 1: Quick Start Overview */}
                <motion.div variants={itemVariants} className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-10 shadow-premium border border-theme-border-soft dark:border-theme-border-soft flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
                        <div className="w-12 h-12 bg-theme-accent-light rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                            <Sparkles className="w-6 h-6 text-theme-accent" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-theme-primary dark:text-theme-primary">
                            New to BillQyro?
                        </h2>
                        <p className="text-sm text-theme-muted font-medium">
                            Follow these steps to create your first professional bill in minutes. Setup is quick and entirely visual.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('create-invoice')}
                            className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 px-6 py-3.5 rounded-xl font-bold text-sm shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Start First Bill</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('settings')}
                            className="bg-theme-card dark:bg-theme-card border-2 border-theme-border-soft text-theme-primary dark:text-theme-muted hover:border-theme-border-soft hover:bg-theme-app dark:bg-theme-surface px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Complete Business Profile</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* NEW SECTION: Full First Bill Flow */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary px-2 text-center md:text-left">Full First Bill Flow</h2>
                    <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-10 shadow-premium border border-theme-border-soft dark:border-theme-border-soft overflow-x-auto">
                        <div className="flex items-center min-w-[700px] justify-between text-center gap-2">
                            {/* Flow Step 1 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-accent-light border-2 border-theme-border-soft text-theme-accent flex items-center justify-center shadow-sm">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Complete Profile</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0 mb-6" />
                            
                            {/* Flow Step 2 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-accent-light border-2 border-theme-border-soft text-theme-accent flex items-center justify-center shadow-sm">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Add Customer</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0 mb-6" />
                            
                            {/* Flow Step 3 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-accent-light border-2 border-theme-border-soft text-theme-accent flex items-center justify-center shadow-sm">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Create Bill</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0 mb-6" />

                            {/* Flow Step 4 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-accent-light border-2 border-theme-border-soft text-theme-accent flex items-center justify-center shadow-sm">
                                    <ListChecks className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Add Items</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0 mb-6" />

                            {/* Flow Step 5 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-warning/5 border-2 border-theme-warning/30 text-theme-warning flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Save Invoice</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-theme-muted shrink-0 mb-6" />

                            {/* Flow Step 6 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-theme-danger/5 border-2 border-theme-danger/30 text-theme-danger flex items-center justify-center shadow-sm">
                                    <FileDown className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-theme-primary dark:text-theme-muted tracking-tight leading-tight">Download PDF</span>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* SECTION 2: Visual Step-by-Step Guide */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Interactive Guide</h2>
                            <p className="text-sm text-theme-muted font-medium mt-1">Click on the steps or use Arrow Keys to navigate.</p>
                            
                            {/* PROGRESS BAR */}
                            <div className="mt-4 flex items-center gap-4 max-w-md">
                                <div className="h-2 flex-1 bg-theme-border-soft rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-theme-accent rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${(activeStep / steps.length) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-theme-muted">{activeStep} / {steps.length} completed</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-theme-muted bg-theme-card dark:bg-theme-card border border-theme-border-soft px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                            <MousePointer2 className="w-3.5 h-3.5" />
                            Interactive Mode
                        </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
                        {/* LEFT: Stepper List */}
                        <div className="w-full lg:w-5/12 flex flex-col gap-2.5">
                            {steps.map((step) => {
                                const isActive = activeStep === step.id;
                                
                                return (
                                    <div 
                                        key={step.id}
                                        onClick={() => setActiveStep(step.id)}
                                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 flex items-center gap-4 group ${isActive ? 'bg-theme-card dark:bg-theme-card shadow-md border-theme-border-soft scale-[1.02]' : 'border-transparent hover:bg-theme-card dark:bg-theme-card/60 hover:border-theme-border-soft/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isActive ? `${step.bg} ${step.color} shadow-sm border border-white/50` : 'bg-theme-border-soft text-theme-muted group-hover:bg-theme-border-strong'}`}>
                                            {step.id}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-extrabold text-sm md:text-base ${isActive ? 'text-theme-primary dark:text-theme-primary' : 'text-theme-muted group-hover:text-theme-primary dark:text-theme-primary'}`}>
                                                {step.title}
                                            </h3>
                                            {!isActive && (
                                                <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-1">{step.explanation}</p>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-theme-muted transition-transform ${isActive ? '-rotate-90' : '-rotate-90 opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT: Active Content & Mockup */}
                        <div className="w-full lg:w-7/12 bg-theme-card dark:bg-theme-card rounded-[2rem] p-6 md:p-8 shadow-premium border border-theme-border-soft dark:border-theme-border-soft flex flex-col">
                            <AnimatePresence mode="wait">
                                {steps.map((step) => step.id === activeStep && (
                                    <motion.div 
                                        key={step.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col h-full gap-6"
                                    >
                                        {/* Info Box */}
                                        <div className="flex-none space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center font-black text-xl shadow-sm border border-white/50 shrink-0`}>
                                                    {step.id}
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">{step.title}</h3>
                                            </div>
                                            
                                            <p className="text-sm text-theme-muted font-medium leading-relaxed max-w-lg">
                                                {step.explanation}
                                            </p>

                                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                <div className="flex items-center gap-2 bg-theme-app dark:bg-theme-surface py-2 px-3 rounded-lg border border-theme-border-soft text-xs font-bold text-theme-primary dark:text-theme-muted shrink-0">
                                                    <MousePointer2 className="w-4 h-4 text-theme-muted" />
                                                    <span>Click:</span>
                                                    <span className="text-theme-accent">{step.whereToClick}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 bg-theme-accent-light py-2 px-3 rounded-lg border border-theme-border-soft text-xs text-theme-muted font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />
                                                    <span className="line-clamp-2">{step.tip}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setCurrentTab(step.tab)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text px-5 py-2.5 rounded-xl text-sm font-bold shadow-glow border-0 hover:opacity-90 transition-opacity mt-2"
                                            >
                                                <span>{step.buttonText}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Mockup Area */}
                                        <div className="flex-1 mt-2 rounded-2xl bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft p-4 flex items-center justify-center relative overflow-hidden group min-h-[250px] md:min-h-[300px]">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>
                                            <div className="w-full max-w-[360px] h-[220px] md:h-[260px] relative z-10 transition-transform duration-500 group-hover:scale-105">
                                                <step.Mockup />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 3: First Bill Example Calculation */}
                <motion.div variants={itemVariants} className="bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[2rem] p-8 md:p-12 text-theme-primary dark:text-theme-primary shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-theme-accent/10 text-theme-accent mb-2 border border-theme-accent/20">
                                <Calculator className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-theme-primary dark:text-theme-primary">First Bill Example</h2>
                            <p className="text-sm text-theme-muted font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
                                This example shows how BillQyro calculates total, paid amount, and due amount.
                            </p>
                        </div>

                        <div className="flex-[1.5] w-full bg-theme-card dark:bg-theme-card text-theme-primary dark:text-theme-primary rounded-2xl p-6 shadow-xl border border-theme-border-soft dark:border-theme-border-soft">
                            <div className="space-y-3 text-sm font-semibold">
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Customer:</span>
                                    <span className="font-extrabold text-theme-primary dark:text-theme-primary">Rahim Ahmed</span>
                                </div>
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Service:</span>
                                    <span>Embroidery Work</span>
                                </div>
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Qty:</span>
                                    <span>2</span>
                                </div>
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Price:</span>
                                    <span>₹500</span>
                                </div>
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Paid:</span>
                                    <span className="text-theme-accent font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between border-b border-theme-border-soft dark:border-theme-border-soft pb-2">
                                    <span className="text-theme-muted">Due:</span>
                                    <span className="text-theme-danger font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-theme-muted">Status:</span>
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-black uppercase">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 4: Common Questions */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                        <h2 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary text-center md:text-left">Common Questions</h2>
                        
                        <div className="relative max-w-sm w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-theme-muted" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="max-w-3xl mx-auto md:mx-0 min-h-[300px]">
                        <AnimatePresence>
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq) => (
                                    <motion.div
                                        key={faq.q}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <FAQItem question={faq.q} answer={faq.a} />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-theme-muted text-sm font-medium">
                                    No questions found for "{searchQuery}".
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* SECTION 5: Final CTA */}
                <motion.div variants={itemVariants} className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-[2rem] p-8 md:p-12 text-center text-white shadow-xl shadow-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-theme-card dark:bg-theme-card/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-theme-card dark:bg-theme-card/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">
                            Ready to create your first bill?
                        </h2>
                        <p className="text-sm md:text-base font-medium text-teal-50 max-w-xl mx-auto mb-8">
                            Start now and generate your first professional invoice with BillQyro.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => setCurrentTab('create-invoice')}
                                className="bg-theme-card dark:bg-theme-card text-theme-accent px-8 py-4 rounded-xl font-black text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                <span>Create First Bill</span>
                            </button>
                            <button
                                onClick={() => setCurrentTab('dashboard')}
                                className="bg-theme-accent/30 border border-theme-accent/50 hover:bg-theme-accent/50 text-white px-8 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Go to Dashboard</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default Guide;
