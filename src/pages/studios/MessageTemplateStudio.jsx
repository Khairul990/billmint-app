import React, { useState } from 'react';
import { MessageCircle, Sparkles, RefreshCcw } from 'lucide-react';
import WhatsAppLivePreview from '../../components/settings/WhatsAppLivePreview';

const AI_TEMPLATES = [
  {
    id: 'default',
    label: 'Professional English (Default)',
    content: `👋 Hello {{customerName}},

Thank you for your business! Your invoice is ready. 🎉

🧾 Invoice #: {{invoiceNo}}
💰 Total Amount: *{{grandTotal}}*
✅ Amount Paid: {{amountPaid}}
🔴 Balance Due: *{{balanceDue}}*
📅 Due Date: {{dueDate}}

📄 View/Download PDF:
{{pdfUrl}}

🔗 View Invoice & Pay Securely:
{{liveLinkUrl}}

Need any help? Just reply to this message 💬

Thank you,
*{{businessName}}*`
  },
  {
    id: 'bengali',
    label: 'Friendly Bengali',
    content: `প্রিয় {{customerName}},

আপনার ইনভয়েস #{{invoiceNo}} তৈরি হয়েছে। 🎉

মোট পরিমাণ: *{{grandTotal}}*
জমা দেওয়া হয়েছে: {{amountPaid}}
বাকি আছে: *{{balanceDue}}*

📄 PDF দেখুন/ডাউনলোড করুন:
{{pdfUrl}}

🔗 অনলাইনে বিল দেখুন ও পেমেন্ট করুন:
{{liveLinkUrl}}

ধন্যবাদ,
*{{businessName}}*`
  },
  {
    id: 'short',
    label: 'Short & Sweet',
    content: `Hi {{customerName}}! 👋 

Your invoice {{invoiceNo}} for *{{grandTotal}}* is ready. 
Balance due: *{{balanceDue}}*

Pay here: {{liveLinkUrl}}

Thanks,
*{{businessName}}*`
  }
];

export const DEFAULT_WHATSAPP_TEMPLATE = AI_TEMPLATES[0].content;

const MessageTemplateStudio = ({ settings, whatsappMessageTemplate, setWhatsappMessageTemplate }) => {
  const [showAiMenu, setShowAiMenu] = useState(false);

  const applyTemplate = (content) => {
    setWhatsappMessageTemplate(content);
    setShowAiMenu(false);
  };

  const handleReset = () => {
    applyTemplate(AI_TEMPLATES[0].content);
  };

  return (
    <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden shadow-premium-sm mt-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-full blur-[50px] pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Editor Side */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 border-b border-theme-border-soft pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-theme-primary">WhatsApp Message Template</h2>
              <p className="text-[10px] text-theme-secondary font-medium">Design how your invoice looks when shared via WhatsApp</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-theme-secondary uppercase tracking-wide">
                Message Content
              </label>
              
              <div className="flex gap-2 relative">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-theme-secondary bg-theme-surface-elevated hover:text-theme-primary border border-theme-border-soft transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Default
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Templates
                  </button>
                  
                  {showAiMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-theme-surface-elevated rounded-xl shadow-xl border border-theme-border-soft overflow-hidden z-20">
                      {AI_TEMPLATES.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => applyTemplate(t.content)}
                          className="w-full text-left px-4 py-3 text-xs font-bold text-theme-primary hover:bg-theme-accent/5 border-b border-theme-border-soft last:border-0 transition-colors"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <textarea
              value={whatsappMessageTemplate || AI_TEMPLATES[0].content}
              onChange={(e) => setWhatsappMessageTemplate(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-theme-surface-elevated border border-theme-border-soft rounded-xl resize-y text-[13px] font-medium text-theme-primary font-mono focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
              placeholder="Enter your WhatsApp message format here..."
            />
            
            <div className="bg-theme-surface-elevated border border-theme-border-soft p-4 rounded-xl">
              <h4 className="text-[10px] font-bold text-theme-secondary mb-3 uppercase tracking-wider">Available Variables (tap to use):</h4>
              <div className="flex flex-wrap gap-2">
                {['{{customerName}}', '{{invoiceNo}}', '{{grandTotal}}', '{{amountPaid}}', '{{balanceDue}}', '{{dueDate}}', '{{pdfUrl}}', '{{liveLinkUrl}}', '{{businessName}}'].map(v => (
                  <button 
                    key={v}
                    onClick={() => setWhatsappMessageTemplate((prev) => (prev || AI_TEMPLATES[0].content) + ' ' + v)} 
                    className="px-2.5 py-1.5 bg-theme-surface border border-theme-border-soft rounded-lg text-[11px] font-mono font-bold text-theme-primary hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-colors cursor-pointer shadow-sm"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="lg:w-80 shrink-0">
          <div className="mb-4 text-center lg:text-left">
            <h3 className="text-xs font-black text-theme-primary uppercase tracking-wide">Live Preview</h3>
            <p className="text-[9px] text-theme-secondary">This is how your customer sees it</p>
          </div>
          <div className="flex justify-center lg:justify-start">
            <WhatsAppLivePreview 
              template={whatsappMessageTemplate || AI_TEMPLATES[0].content} 
              businessSettings={settings}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageTemplateStudio;
