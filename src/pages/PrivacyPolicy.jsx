import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = ({ setCurrentTab }) => {
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-theme-muted font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-theme-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, create an invoice, or communicate with us. This includes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Contact information (email, phone number)</li>
              <li>Business profile data and configuration</li>
              <li>Transaction data (invoices, customers, items)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to operate, maintain, and improve our billing platform, process your transactions, and communicate with you regarding your account and our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">3. Data Storage & Security</h2>
            <p>Our platform uses local-first architecture (IndexedDB) with cloud synchronization (Firebase). Your business data is encrypted in transit and securely stored in our cloud infrastructure. We implement standard security protocols to prevent unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">4. Third-Party Sharing</h2>
            <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact support.</p>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
