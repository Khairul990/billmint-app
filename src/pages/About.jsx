import React from 'react';
import { ArrowLeft, Users, Target, Heart, Globe, Shield, Zap } from 'lucide-react';

const About = ({ setCurrentTab }) => {
  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans animate-fade-in">
      <button 
        onClick={() => setCurrentTab('landing')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-theme-card rounded-3xl p-6 md:p-10 border border-theme-border-soft shadow-premium">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-theme-border-soft">
            <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-theme-primary tracking-tight">About BillQyro</h1>
              <p className="text-sm text-theme-muted font-medium mt-1">BillQyro Technologies</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-theme-secondary leading-relaxed">
            <section>
              <p className="text-base text-theme-primary font-semibold leading-relaxed">
                BillQyro is a free, offline-first invoicing and billing platform built for small businesses in India and Bangladesh. We help shop owners, tailors, clinics, repair businesses, coaching centers, and service providers manage their billing with zero internet dependency.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-theme-accent" /> Our Mission
              </h2>
              <p>
                To make professional billing accessible to every small business — regardless of internet connectivity, technical skill, or budget. BillQyro started with a simple observation: millions of small shops in South Asia still rely on paper receipts and manual ledgers. We built the digital equivalent — beautiful, fast, and free.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-theme-accent" /> Why We Built This
              </h2>
              <p>
                Most invoicing tools are designed for English-speaking, always-online businesses. BillQyro was built from day one for the realities of South Asian small business: intermittent connectivity, bilingual needs (English and Bengali), UPI-first payments, and GST/VAT compliance. Our offline-first architecture means your billing never stops — even when the internet does.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-theme-accent" /> Where We Operate
              </h2>
              <p>
                BillQyro serves businesses across India and Bangladesh. Our platform supports English and Bengali (Bangla), UPI QR code payments, and business categories specific to the region — from tailoring shops and coaching centers to clinics and repair businesses.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-theme-accent" /> Built with Trust
              </h2>
              <p>
                Your business data is yours. BillQyro uses local-first architecture (IndexedDB) with optional cloud sync via Firebase. Your data is encrypted in transit using industry-standard TLS. We do not sell, share, or monetize your business data. For details, see our{' '}
                <button onClick={() => setCurrentTab('privacy')} className="text-theme-accent underline hover:no-underline cursor-pointer font-bold">Privacy Policy</button>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-theme-accent" /> Key Features
              </h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Offline-first — works without internet</li>
                <li>PDF invoice generation (A4/A5 templates)</li>
                <li>UPI QR code payment collection</li>
                <li>Customer ledger with balance tracking</li>
                <li>WhatsApp payment reminders</li>
                <li>Voice billing in Bengali</li>
                <li>Multi-workspace support</li>
                <li>Live invoice sharing links</li>
                <li>Expense tracking and profit/loss reports</li>
                <li>Product and inventory management</li>
              </ul>
            </section>

            <section className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60">
              <p className="text-xs text-theme-muted font-semibold text-center">
                Contact us at <a href="mailto:support@billqyro.com" className="text-theme-accent font-bold">support@billqyro.com</a> or WhatsApp <a href="https://wa.me/919477738769" target="_blank" rel="noopener noreferrer" className="text-theme-accent font-bold">+91 94777 38769</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
