import React, { useState } from 'react';
import {
    Sparkles, ArrowRight, Settings, Users, Plus, ListChecks, FileDown, 
    BarChart3, CheckCircle2, Calculator, HelpCircle, FileText, LayoutDashboard, ChevronDown
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

// --- MINI UI ILLUSTRATIONS (HTML/CSS ONLY) ---
const UIProfileMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><Settings className="w-4 h-4 text-indigo-500"/></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
        </div>
        <div className="space-y-2">
            <div className="h-6 w-full bg-white border border-slate-200 rounded-md"></div>
            <div className="h-6 w-full bg-white border border-slate-200 rounded-md"></div>
            <div className="h-6 w-3/4 bg-white border border-slate-200 rounded-md"></div>
        </div>
        <div className="mt-auto h-7 w-full bg-indigo-500 rounded-md flex items-center justify-center">
            <div className="h-2 w-10 bg-white/50 rounded"></div>
        </div>
    </div>
);

const UICustomerMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center justify-between mb-2">
            <div className="h-3 w-16 bg-slate-300 rounded"></div>
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center"><Plus className="w-3 h-3 text-blue-500"/></div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="w-6 h-6 bg-slate-100 rounded-full"></div>
                <div className="space-y-1"><div className="h-2 w-16 bg-slate-200 rounded"></div><div className="h-1.5 w-10 bg-slate-100 rounded"></div></div>
            </div>
            <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-50 rounded"></div>
                <div className="h-2 w-full bg-slate-50 rounded"></div>
            </div>
        </div>
    </div>
);

const UIInvoiceMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <div className="h-4 w-16 bg-teal-500 rounded"></div>
            <div className="h-3 w-12 bg-slate-300 rounded"></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between">
            <div className="h-2 w-16 bg-slate-200 rounded"></div>
            <ChevronDown className="w-3 h-3 text-slate-300"/>
        </div>
        <div className="flex gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg h-16 p-2 space-y-1"><div className="h-2 w-10 bg-slate-100 rounded"></div></div>
            <div className="flex-1 bg-white border border-slate-200 rounded-lg h-16 p-2 space-y-1"><div className="h-2 w-10 bg-slate-100 rounded"></div></div>
        </div>
    </div>
);

const UIItemsMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col shadow-inner">
        <div className="flex border-b border-slate-200 pb-2 mb-2">
            <div className="flex-[2] h-2 bg-slate-300 rounded"></div>
            <div className="flex-1 h-2 bg-slate-300 rounded mx-1"></div>
            <div className="flex-1 h-2 bg-slate-300 rounded mx-1"></div>
            <div className="flex-1 h-2 bg-slate-300 rounded"></div>
        </div>
        <div className="flex items-center mb-2">
            <div className="flex-[2] h-3 bg-white border border-slate-200 rounded"></div>
            <div className="flex-1 h-3 bg-white border border-slate-200 rounded mx-1"></div>
            <div className="flex-1 h-3 bg-white border border-slate-200 rounded mx-1"></div>
            <div className="flex-1 h-3 bg-slate-200 rounded"></div>
        </div>
        <div className="flex items-center mb-2">
            <div className="flex-[2] h-3 bg-white border border-slate-200 rounded"></div>
            <div className="flex-1 h-3 bg-white border border-slate-200 rounded mx-1"></div>
            <div className="flex-1 h-3 bg-white border border-slate-200 rounded mx-1"></div>
            <div className="flex-1 h-3 bg-slate-200 rounded"></div>
        </div>
        <div className="mt-auto flex justify-end">
            <div className="w-1/2 space-y-1 border-t border-slate-200 pt-1">
                <div className="flex justify-between"><div className="h-1.5 w-8 bg-slate-200 rounded"></div><div className="h-1.5 w-8 bg-slate-300 rounded"></div></div>
                <div className="flex justify-between"><div className="h-2 w-10 bg-slate-300 rounded"></div><div className="h-2 w-12 bg-teal-500 rounded"></div></div>
            </div>
        </div>
    </div>
);

const UIStatusMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-4 shadow-inner justify-center items-center">
        <div className="flex items-center justify-between w-full bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="h-2 w-12 bg-slate-200 rounded"></div>
            <div className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold">PAID</div>
        </div>
        <div className="flex items-center justify-between w-full bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="h-2 w-12 bg-slate-200 rounded"></div>
            <div className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-[8px] font-bold">PENDING</div>
        </div>
        <div className="flex items-center justify-between w-full bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="h-2 w-12 bg-slate-200 rounded"></div>
            <div className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-[8px] font-bold">IN PROGRESS</div>
        </div>
    </div>
);

const UIPDFMockup = () => (
    <div className="w-full h-full bg-slate-200 rounded-xl p-4 flex items-center justify-center shadow-inner">
        <div className="w-[120px] h-full bg-white shadow-md border border-slate-300 flex flex-col p-2">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                <div className="w-8 h-8 bg-slate-200 rounded"></div>
                <div className="h-2 w-10 bg-slate-300 rounded"></div>
            </div>
            <div className="space-y-1 mb-4">
                <div className="h-1 w-full bg-slate-200 rounded"></div>
                <div className="h-1 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-1 w-1/2 bg-slate-200 rounded"></div>
            </div>
            <div className="mt-auto border-t border-slate-100 pt-1 flex justify-end">
                <div className="h-2 w-12 bg-teal-500 rounded"></div>
            </div>
        </div>
    </div>
);

const UIDashboardMockup = () => (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded p-2 h-10"><div className="h-1.5 w-8 bg-slate-200 rounded mb-1"></div><div className="h-2 w-10 bg-slate-400 rounded"></div></div>
            <div className="flex-1 bg-white border border-slate-200 rounded p-2 h-10"><div className="h-1.5 w-8 bg-slate-200 rounded mb-1"></div><div className="h-2 w-10 bg-slate-400 rounded"></div></div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded p-3 flex items-end justify-between gap-1">
            <div className="w-full bg-teal-200 rounded-t h-1/4"></div>
            <div className="w-full bg-teal-300 rounded-t h-2/4"></div>
            <div className="w-full bg-teal-400 rounded-t h-3/4"></div>
            <div className="w-full bg-teal-500 rounded-t h-full"></div>
        </div>
    </div>
);

/**
 * Main Visual User Guide Component
 */
const Guide = ({ setCurrentTab }) => {

    const steps = [
        {
            id: 1,
            title: 'Complete Business Profile',
            explanation: 'First add your business/shop name, phone number, WhatsApp, email, address, logo, currency, invoice prefix, and tax settings.',
            buttonText: 'Open Settings',
            tab: 'admin-panel',
            tip: 'This information will appear on your invoice PDF.',
            Mockup: UIProfileMockup,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        },
        {
            id: 2,
            title: 'Add Customer',
            explanation: 'Add customer name, phone number, address, and order details before creating a bill.',
            buttonText: 'Add Customer',
            tab: 'customers',
            tip: 'Saved customers can be reused in future invoices.',
            Mockup: UICustomerMockup,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            id: 3,
            title: 'Create New Bill',
            explanation: 'Click Create Bill or Create Invoice, then select customer and fill invoice details.',
            buttonText: 'Create Bill',
            tab: 'create-invoice',
            tip: 'You can save as draft before final invoice.',
            Mockup: UIInvoiceMockup,
            color: 'text-teal-500',
            bg: 'bg-teal-50'
        },
        {
            id: 4,
            title: 'Add Items or Services',
            explanation: 'Add item/service name, description, quantity, price, tax, discount, paid amount, and due amount.',
            buttonText: 'Open Invoice Form',
            tab: 'create-invoice',
            tip: 'Total, paid, and due amount should calculate automatically.',
            Mockup: UIItemsMockup,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            id: 5,
            title: 'Track Payment and Order Status',
            explanation: 'Update payment status as Paid, Pending, Due, or Overdue. Update order status as Pending, In Progress, Ready, Delivered, or Cancelled.',
            buttonText: 'View Invoices',
            tab: 'invoices',
            tip: 'Status badges help you quickly understand customer/order progress.',
            Mockup: UIStatusMockup,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
        {
            id: 6,
            title: 'Preview and Download PDF',
            explanation: 'After creating the bill, preview the invoice and download a professional PDF invoice.',
            buttonText: 'View Invoices',
            tab: 'invoices',
            tip: 'PDF should use real invoice and business profile data.',
            Mockup: UIPDFMockup,
            color: 'text-rose-500',
            bg: 'bg-rose-50'
        },
        {
            id: 7,
            title: 'Check Reports and Dashboard',
            explanation: 'Use dashboard reports to check revenue, pending amount, paid invoices, total customers, and recent invoices.',
            buttonText: 'View Dashboard',
            tab: 'dashboard',
            tip: 'Dashboard data should come from real invoices/customers.',
            Mockup: UIDashboardMockup,
            color: 'text-cyan-500',
            bg: 'bg-cyan-50'
        }
    ];

    const faqs = [
        { q: "How do I create my first bill?", a: "Navigate to the Create Invoice section from the sidebar or dashboard. Select an existing customer or add a new one, fill in the items, adjust pricing, and click Save." },
        { q: "How do I add customer details?", a: "Go to the Customers tab and click 'New Customer'. Fill out their contact information. This allows you to quickly select them later when making bills." },
        { q: "How do I download PDF invoice?", a: "Once an invoice is created, go to the Invoices list or dashboard, and click the 'Download PDF' icon on the specific invoice card." },
        { q: "How do I mark payment as paid?", a: "Open the invoice from the Invoices tab and adjust the 'Amount Paid' field to match the 'Grand Total', or simply change the payment status badge." },
        { q: "How do I change business name/logo?", a: "Navigate to the Admin Settings tab. There you can upload a new logo, change your business name, set GST details, and update your address." },
        { q: "What if Firebase is offline?", a: "BillQyro works completely offline! All data is securely stored in your browser's LocalStorage and will sync automatically when you reconnect if Firebase is enabled." },
    ];

    return (
        <div className="w-full bg-slate-50 min-h-screen py-8 px-4 md:px-8 font-sans antialiased">
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
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-premium border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
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
                        <button
                            onClick={() => setCurrentTab('create-invoice')}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Start First Bill</span>
                        </button>
                        <button
                            onClick={() => setCurrentTab('admin-panel')}
                            className="bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Complete Business Profile</span>
                        </button>
                    </div>
                </div>

                {/* SECTION 2: Visual Step-by-Step Guide */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-extrabold text-slate-900 px-2">Visual Step-by-Step Guide</h2>
                    
                    <div className="space-y-6">
                        {steps.map((step, index) => {
                            const isEven = index % 2 !== 0;
                            return (
                                <div key={step.id} className={`bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch gap-8 hover:shadow-premium-hover hover:border-teal-100 transition-all duration-300`}>
                                    
                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${step.bg} ${step.color} flex items-center justify-center font-black text-sm`}>
                                                {step.id}
                                            </div>
                                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{step.title}</h3>
                                        </div>
                                        
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                            {step.explanation}
                                        </p>
                                        
                                        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600 font-semibold">
                                                <span className="text-slate-800 font-bold">Tip: </span>{step.tip}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setCurrentTab(step.tab)}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#071B3A] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md shadow-[#071B3A]/10 hover:bg-[#0a2652] transition-colors mt-2"
                                        >
                                            <span>{step.buttonText}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Image / Mockup Area */}
                                    <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 p-2 overflow-hidden flex items-center justify-center relative group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white opacity-50 pointer-events-none"></div>
                                        <div className="w-full max-w-[320px] h-[200px] relative z-10 transition-transform duration-500 group-hover:scale-105">
                                            <step.Mockup />
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SECTION 3: First Bill Example Calculation */}
                <div className="bg-gradient-to-br from-[#071B3A] to-[#14284B] rounded-[2rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-teal-400 mb-2">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">First Bill Example</h2>
                            <p className="text-sm text-slate-300 font-medium max-w-md mx-auto md:mx-0">
                                This is how BillQyro automatically calculates your total, paid, and due amounts based on simple inputs.
                            </p>
                        </div>

                        <div className="flex-[1.5] w-full bg-white text-slate-800 rounded-2xl p-6 shadow-2xl">
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
                                    <span className="text-slate-500">Quantity:</span>
                                    <span>2</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Price per unit:</span>
                                    <span>₹500</span>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-xl mt-4 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-bold">Subtotal:</span>
                                        <span className="font-bold">₹1000</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-bold">Paid Amount:</span>
                                        <span className="font-bold text-emerald-600">₹500</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                                        <span className="font-black text-slate-900">Balance Due:</span>
                                        <span className="font-black text-rose-500">₹500</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Common Questions */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 px-2">Common Questions</h2>
                    <div className="max-w-3xl">
                        {faqs.map((faq, idx) => (
                            <FAQItem key={idx} question={faq.q} answer={faq.a} />
                        ))}
                    </div>
                </div>

                {/* SECTION 5: Final CTA */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2rem] p-8 md:p-12 text-center text-white shadow-xl shadow-teal-500/20">
                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
                        Ready to create your first bill?
                    </h2>
                    <p className="text-sm md:text-base font-medium text-teal-50 max-w-xl mx-auto mb-8">
                        Start now and generate your first professional invoice with BillQyro.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setCurrentTab('create-invoice')}
                            className="bg-white text-teal-600 px-8 py-4 rounded-xl font-black text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Create First Bill</span>
                        </button>
                        <button
                            onClick={() => setCurrentTab('dashboard')}
                            className="bg-teal-600/30 border border-teal-400/50 hover:bg-teal-600/50 text-white px-8 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Go to Dashboard</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Guide;
