import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService = ({ setCurrentTab }) => {
  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans animate-fade-in">
      <button 
        onClick={() => setCurrentTab('more')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="space-y-6">
        <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 text-theme-warning text-sm font-semibold">
          Disclaimer: BillQyro is not legal, tax, or accounting advice. This tool is provided for your convenience only.
        </div>

        <div className="bg-theme-card rounded-3xl p-6 md:p-10 border border-theme-border-soft shadow-premium">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-theme-border-soft">
          <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Terms of Service</h1>
            <p className="text-sm text-theme-muted font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-theme-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using this SaaS billing platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">2. Description of Service</h2>
            <p>We provide a web-based invoicing and billing management software. You understand that the Service is provided "as is" and we assume no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">3. User Conduct</h2>
            <p>You agree to use the Service only for lawful purposes. You are solely responsible for the knowledge of and adherence to any and all laws, rules, and regulations pertaining to your use of the Service. You agree not to use the Service in any way that violates applicable federal, state, local, or international law or regulation.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors. The Service is protected by copyright, trademark, and other laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">5. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TermsOfService;
