import React from 'react';
import { LifeBuoy, ArrowLeft, Mail, MessageCircle, FileText } from 'lucide-react';

export default function Support({ onBack }) {
  return (
    <div className="min-h-screen bg-theme-app text-theme-primary font-sans">
      <div className="bg-theme-card border-b border-theme-border-soft sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-theme-app transition-colors text-theme-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-theme-accent" /> Support
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 text-theme-warning text-sm font-semibold">
          Disclaimer: BillQyro is not legal, tax, or accounting advice. This tool is provided for your convenience only.
        </div>

        <div className="text-center py-6">
          <h2 className="text-2xl font-black mb-2">How can we help you?</h2>
          <p className="text-theme-muted text-sm">Our support team is here to assist you with any questions or issues.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="mailto:support@billqyro.com" className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 block group">
            <div className="w-12 h-12 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Email Support</h3>
            <p className="text-sm text-theme-muted mb-4">Send us an email and we'll get back to you within 24 hours.</p>
            <span className="text-theme-accent font-bold text-sm">support@billqyro.com &rarr;</span>
          </a>

          <a href="#" className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium hover:shadow-lg hover:-translate-y-1 transition-all duration-300 block group">
            <div className="w-12 h-12 bg-theme-success/10 text-theme-success rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Live Chat</h3>
            <p className="text-sm text-theme-muted mb-4">Chat with our support agents directly via WhatsApp.</p>
            <span className="text-theme-success font-bold text-sm">Chat Now &rarr;</span>
          </a>
        </div>

        <section className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium mt-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-theme-accent" />
            <h2 className="text-lg font-black">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
              <h3 className="font-bold text-sm mb-1">How do I change my currency?</h3>
              <p className="text-xs text-theme-muted">Go to Settings &gt; Business Profile, and update your currency code.</p>
            </div>
            <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
              <h3 className="font-bold text-sm mb-1">Are my invoices backed up?</h3>
              <p className="text-xs text-theme-muted">Yes, if you have Firebase connected or use the offline-first IndexedDB system, your data is securely stored locally.</p>
            </div>
            <div className="p-4 bg-theme-app rounded-2xl border border-theme-border-soft">
              <h3 className="font-bold text-sm mb-1">How do I export my data?</h3>
              <p className="text-xs text-theme-muted">You can export data from the Data Management section under More Menu.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
