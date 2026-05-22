import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, Settings, Users, Plus, ListChecks, FileDown, 
    BarChart3, CheckCircle2, Calculator, HelpCircle, FileText, LayoutDashboard, ChevronDown, MousePointer2
} from 'lucide-react';

/**
 * FAQ Accordion Component
 */
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mb-3 shadow-sm hover:border-teal-200 transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 text-left flex items-center justify-between focus:outline-none hover:bg-slate-50 transition-colors"
            >
                <span className="font-bold text-slate-800 text-sm">{question}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-4 text-xs font-medium text-slate-500 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50">
                    {answer}
                </div>
            )}
        </div>
    );
};

// --- MINI UI ILLUSTRATIONS (HTML/CSS ONLY) - MADE BIGGER & CLEARER ---
const UIProfileMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center"><Settings className="w-5 h-5 text-indigo-600"/></div>
            <div>
                <div className="text-xs font-bold text-slate-800">Business Settings</div>
                <div className="text-[10px] text-slate-400">Business Profile</div>
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-8 w-full bg-white border border-slate-200 rounded-md flex items-center px-3 text-[10px] text-slate-400">Shop Name...</div>
            <div className="h-8 w-full bg-white border border-slate-200 rounded-md flex items-center px-3 text-[10px] text-slate-400">Phone Number...</div>
            <div className="h-8 w-2/3 bg-white border border-slate-200 rounded-md flex items-center px-3 text-[10px] text-slate-400">GST/Tax details...</div>
        </div>
        <div className="mt-auto h-9 w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-md">
            Save Profile
        </div>
    </div>
);

const UICustomerMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-800">Customers</div>
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold shadow-sm">
                <Plus className="w-3 h-3"/> Add New
            </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">RA</div>
                <div>
                    <div className="text-xs font-bold text-slate-800">Rahim Ahmed</div>
                    <div className="text-[10px] text-slate-500">+91 98765 43210</div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
            </div>
        </div>
    </div>
);

const UIInvoiceMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div className="text-sm font-black text-teal-600">Create Bill</div>
            <div className="text-[10px] font-bold text-slate-400">INV-1001</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="text-[11px] font-bold text-slate-600">Select Customer...</div>
            <ChevronDown className="w-4 h-4 text-slate-400"/>
        </div>
        <div className="flex gap-3">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg h-20 p-3 flex flex-col justify-center shadow-sm">
                <div className="text-[10px] text-slate-400 mb-1">Issue Date</div>
                <div className="text-xs font-bold text-slate-700">Today</div>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-lg h-20 p-3 flex flex-col justify-center shadow-sm">
                <div className="text-[10px] text-slate-400 mb-1">Due Date</div>
                <div className="text-xs font-bold text-slate-700">Next Week</div>
            </div>
        </div>
    </div>
);

const UIItemsMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-4 flex flex-col shadow-inner">
        <div className="flex border-b border-slate-200 pb-2 mb-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
            <div className="flex-[2]">Item / Service</div>
            <div className="flex-1 text-center">Qty</div>
            <div className="flex-1 text-center">Price</div>
            <div className="flex-1 text-right">Total</div>
        </div>
        <div className="flex items-center mb-3 text-[10px] font-bold text-slate-700">
            <div className="flex-[2] bg-white border border-slate-200 rounded px-2 py-1.5 truncate">Embroidery</div>
            <div className="flex-1 bg-white border border-slate-200 rounded mx-1 px-2 py-1.5 text-center">2</div>
            <div className="flex-1 bg-white border border-slate-200 rounded mx-1 px-2 py-1.5 text-center">500</div>
            <div className="flex-1 text-right text-slate-800">1000</div>
        </div>
        <div className="mt-auto flex justify-end">
            <div className="w-2/3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2">
                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Subtotal</span><span className="font-bold">₹1000</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Paid</span><span className="font-bold text-emerald-600">₹500</span></div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1 mt-1"><span className="font-black">Due</span><span className="font-black text-rose-500">₹500</span></div>
            </div>
        </div>
    </div>
);

const UIStatusMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4 shadow-inner justify-center">
        <div className="flex items-center justify-between w-full bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-700">Invoice #1001</div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black tracking-wide">PAID</div>
        </div>
        <div className="flex items-center justify-between w-full bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-700">Invoice #1002</div>
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black tracking-wide">PENDING</div>
        </div>
        <div className="flex items-center justify-between w-full bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-700">Order #205</div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black tracking-wide">IN PROGRESS</div>
        </div>
    </div>
);

const UIPDFMockup = () => (
    <div className="w-full h-full bg-slate-200 rounded-xl p-5 flex items-center justify-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        <div className="w-[140px] h-full bg-white shadow-xl border border-slate-300 flex flex-col p-3 relative z-10">
            <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-3">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded"><Settings className="w-5 h-5 text-slate-300"/></div>
                <div className="text-[8px] font-black text-slate-800 text-right uppercase">INVOICE<br/><span className="text-slate-400 font-medium">#1001</span></div>
            </div>
            <div className="space-y-1.5 mb-4">
                <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                <div className="h-1.5 w-5/6 bg-slate-200 rounded"></div>
                <div className="h-1.5 w-3/4 bg-slate-200 rounded"></div>
            </div>
            <div className="mt-auto border-t border-slate-200 pt-2 flex justify-end">
                <div className="bg-teal-600 text-white text-[8px] font-bold px-2 py-1 rounded">Download PDF</div>
            </div>
        </div>
    </div>
);

const UIDashboardMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-slate-200 p-5 flex flex-col gap-4 shadow-inner">
        <div className="flex gap-3">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-wide">Revenue</div>
                <div className="text-sm font-black text-slate-800">₹24,500</div>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-wide">Pending</div>
                <div className="text-sm font-black text-rose-500">₹3,200</div>
            </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 flex items-end justify-between gap-2 shadow-sm">
            <div className="w-full bg-teal-100 rounded-t h-1/4"></div>
            <div className="w-full bg-teal-200 rounded-t h-2/4"></div>
            <div className="w-full bg-teal-300 rounded-t h-3/4"></div>
            <div className="w-full bg-teal-400 rounded-t h-[90%]"></div>
            <div className="w-full bg-teal-500 rounded-t h-full"></div>
        </div>
    </div>
);


/**
 * Main Visual User Guide Component
 */
const Guide = ({ setCurrentTab }) => {
    const [activeStep, setActiveStep] = useState(1);

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
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
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
            color: 'text-blue-600',
            bg: 'bg-blue-100'
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
            color: 'text-teal-600',
            bg: 'bg-teal-100'
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
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
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
            color: 'text-amber-600',
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
            color: 'text-rose-600',
            bg: 'bg-rose-100'
        },
        {
            id: 7,
            title: 'View Reports',
            explanation: 'Use dashboard reports to check revenue, pending amount, paid invoices, total customers, and recent invoices.',
            whereToClick: 'Dashboard or Reports',
            buttonText: 'View Dashboard',
            tab: 'dashboard',
            tip: 'Dashboard data should come from real invoices/customers.',
            Mockup: UIDashboardMockup,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100'
        }
    ];

    const faqs = [
        { q: "How do I create my first bill?", a: "Navigate to the Create Invoice section from the sidebar or dashboard. Select an existing customer or add a new one, fill in the items, adjust pricing, and click Save." },
        { q: "How do I add customer details?", a: "Go to the Customers tab and click 'New Customer'. Fill out their contact information. This allows you to quickly select them later when making bills." },
        { q: "How do I download PDF?", a: "Once an invoice is created, go to the Invoices list or dashboard, and click the 'Download PDF' icon on the specific invoice card." },
        { q: "How do I mark payment as paid?", a: "Open the invoice from the Invoices tab and adjust the 'Amount Paid' field to match the 'Grand Total', or simply change the payment status badge." },
        { q: "How do I change business name or logo?", a: "Navigate to the Settings tab. There you can upload a new logo, change your business name, set GST details, and update your address." },
        { q: "What happens if internet/Firebase is offline?", a: "BillQyro works completely offline! All data is securely stored in your browser's LocalStorage and will sync automatically when you reconnect if Firebase is enabled." },
    ];

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
            className="w-full bg-slate-50 min-h-screen py-8 px-4 md:px-8 font-sans antialiased"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* PAGE HEADER */}
                <div className="text-center md:text-left space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>Official User Guide</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        How to Use BillQyro
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium max-w-3xl leading-relaxed">
                        Learn step by step how to create bills, manage customers, track payments, and download professional PDF invoices.
                    </p>
                </div>

                {/* SECTION 1: Quick Start Overview */}
                <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-10 shadow-premium border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                            <Sparkles className="w-6 h-6 text-teal-500" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                            New to BillQyro?
                        </h2>
                        <p className="text-sm text-slate-600 font-medium">
                            Follow these steps to create your first professional bill in minutes. Setup is quick and entirely visual.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('create-invoice')}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Start First Bill</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentTab('settings')}
                            className="bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Complete Business Profile</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* NEW SECTION: Full First Bill Flow */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 px-2 text-center md:text-left">Full First Bill Flow</h2>
                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-premium border border-slate-100 overflow-x-auto">
                        <div className="flex items-center min-w-[700px] justify-between text-center gap-2">
                            {/* Flow Step 1 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Complete Profile</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mb-6" />
                            
                            {/* Flow Step 2 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Add Customer</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mb-6" />
                            
                            {/* Flow Step 3 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-600 flex items-center justify-center shadow-sm">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Create Bill</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mb-6" />

                            {/* Flow Step 4 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                                    <ListChecks className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Add Items</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mb-6" />

                            {/* Flow Step 5 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Save Invoice</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mb-6" />

                            {/* Flow Step 6 */}
                            <div className="flex flex-col items-center gap-3 w-24">
                                <div className="w-12 h-12 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
                                    <FileDown className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight leading-tight">Download PDF</span>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* SECTION 2: Visual Step-by-Step Guide */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Guide</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Click on the steps to see how each feature works.</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
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
                                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 flex items-center gap-4 group ${isActive ? 'bg-white shadow-md border-slate-200 scale-[1.02]' : 'border-transparent hover:bg-white/60 hover:border-slate-200/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isActive ? `${step.bg} ${step.color} shadow-sm border border-white/50` : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                                            {step.id}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-extrabold text-sm md:text-base ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                {step.title}
                                            </h3>
                                            {!isActive && (
                                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{step.explanation}</p>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${isActive ? '-rotate-90' : '-rotate-90 opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT: Active Content & Mockup */}
                        <div className="w-full lg:w-7/12 bg-white rounded-[2rem] p-6 md:p-8 shadow-premium border border-slate-100 flex flex-col">
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
                                                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{step.title}</h3>
                                            </div>
                                            
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-lg">
                                                {step.explanation}
                                            </p>

                                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                <div className="flex items-center gap-2 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 shrink-0">
                                                    <MousePointer2 className="w-4 h-4 text-slate-400" />
                                                    <span>Click:</span>
                                                    <span className="text-[#071B3A]">{step.whereToClick}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100 text-xs text-slate-600 font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span className="line-clamp-2">{step.tip}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setCurrentTab(step.tab)}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#071B3A] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#071B3A]/10 hover:bg-[#0a2652] transition-colors mt-2"
                                            >
                                                <span>{step.buttonText}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Mockup Area */}
                                        <div className="flex-1 mt-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-center relative overflow-hidden group min-h-[250px] md:min-h-[300px]">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white opacity-50 pointer-events-none"></div>
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
                <motion.div variants={itemVariants} className="bg-[#071B3A] rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 mb-2 border border-teal-500/30">
                                <Calculator className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">First Bill Example</h2>
                            <p className="text-sm text-slate-300 font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
                                This example shows how BillQyro calculates total, paid amount, and due amount.
                            </p>
                        </div>

                        <div className="flex-[1.5] w-full bg-white text-slate-800 rounded-2xl p-6 shadow-xl border border-slate-100">
                            <div className="space-y-3 text-sm font-semibold">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Customer:</span>
                                    <span className="font-extrabold text-slate-900">Rahim Ahmed</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Service:</span>
                                    <span>Embroidery Work</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Qty:</span>
                                    <span>2</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Price:</span>
                                    <span>₹500</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Paid:</span>
                                    <span className="text-emerald-600 font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Due:</span>
                                    <span className="text-rose-500 font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Status:</span>
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-black uppercase">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 4: Common Questions */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 px-2 text-center md:text-left">Common Questions</h2>
                    <div className="max-w-3xl mx-auto md:mx-0">
                        {faqs.map((faq, idx) => (
                            <FAQItem key={idx} question={faq.q} answer={faq.a} />
                        ))}
                    </div>
                </motion.div>

                {/* SECTION 5: Final CTA */}
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2rem] p-8 md:p-12 text-center text-white shadow-xl shadow-teal-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

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
                                className="bg-white text-teal-600 px-8 py-4 rounded-xl font-black text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                <span>Create First Bill</span>
                            </button>
                            <button
                                onClick={() => setCurrentTab('dashboard')}
                                className="bg-teal-600/30 border border-teal-400/50 hover:bg-teal-600/50 text-white px-8 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
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
