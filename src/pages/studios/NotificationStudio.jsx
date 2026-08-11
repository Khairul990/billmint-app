import React from 'react';
import { toast } from 'react-hot-toast';
import { Bell, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import MessageTemplateStudio from './MessageTemplateStudio';

const NotificationStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
          <Bell className="w-6 h-6 text-theme-accent drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">Notification Studio</h2>
          <p className="text-xs text-theme-secondary font-medium">Configure Email, SMS, WhatsApp, and Push templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Templates */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-premium-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[50px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Email Automation</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">Invoice Sent</p>
                <p className="text-[10px] text-theme-secondary mt-1">When you email an invoice</p>
              </div>
              <button onClick={() => toast('Premium feature locked', { icon: '🔒' })} className="text-[10px] font-bold text-theme-accent hover:text-white transition-colors bg-theme-accent/10 px-3 py-1.5 rounded-lg border border-theme-accent/20">Edit Template</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">Payment Reminder</p>
                <p className="text-[10px] text-theme-secondary mt-1">3 days before due date</p>
              </div>
              <button onClick={() => toast('Premium feature locked', { icon: '🔒' })} className="text-[10px] font-bold text-theme-accent hover:text-white transition-colors bg-theme-accent/10 px-3 py-1.5 rounded-lg border border-theme-accent/20">Edit Template</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">Thank You Note</p>
                <p className="text-[10px] text-theme-secondary mt-1">After payment received</p>
              </div>
              <button onClick={() => toast('Premium feature locked', { icon: '🔒' })} className="text-[10px] font-bold text-theme-accent hover:text-white transition-colors bg-theme-accent/10 px-3 py-1.5 rounded-lg border border-theme-accent/20">Edit Template</button>
            </div>
          </div>
        </div>

        {/* WhatsApp & SMS */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-premium-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[50px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">WhatsApp & SMS</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">WhatsApp Integration</p>
                <p className="text-[10px] text-theme-secondary mt-1">Send bills via WhatsApp API</p>
              </div>
              <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 border ${settings?.whatsappEnabled ? 'bg-theme-accent border-theme-accent' : 'bg-theme-surface border-theme-border-strong'}`} onClick={() => onUpdate({ whatsappEnabled: !settings?.whatsappEnabled })}>
                <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.whatsappEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">SMS Notifications</p>
                <p className="text-[10px] text-theme-secondary mt-1">Twilio or local gateway</p>
              </div>
              <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 border ${settings?.smsEnabled ? 'bg-theme-accent border-theme-accent' : 'bg-theme-surface border-theme-border-strong'}`} onClick={() => onUpdate({ smsEnabled: !settings?.smsEnabled })}>
                <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          
          <Button onClick={() => toast('Premium feature locked', { icon: '🔒' })} variant="secondary" className="w-full" leftIcon={Send}>
            Configure Gateways
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <MessageTemplateStudio 
          settings={settings}
          whatsappMessageTemplate={settings?.whatsappMessageTemplate || ''}
          setWhatsappMessageTemplate={(val) => onUpdate({ whatsappMessageTemplate: val })}
        />
      </div>
    </div>
  );
};

export default NotificationStudio;
