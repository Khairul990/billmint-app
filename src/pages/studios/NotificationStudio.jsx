import React from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Send } from 'lucide-react';

const NotificationStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
          <Bell className="w-6 h-6 text-violet-400 drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Notification Studio</h2>
          <p className="text-xs text-theme-muted font-medium">Configure Email, SMS, WhatsApp, and Push templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Templates */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[50px] group-hover:bg-violet-500/20 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-black text-white">Email Automation</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Invoice Sent</p>
                <p className="text-[10px] text-theme-muted mt-1">When you email an invoice</p>
              </div>
              <button className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">Edit Template</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Payment Reminder</p>
                <p className="text-[10px] text-theme-muted mt-1">3 days before due date</p>
              </div>
              <button className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">Edit Template</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Thank You Note</p>
                <p className="text-[10px] text-theme-muted mt-1">After payment received</p>
              </div>
              <button className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">Edit Template</button>
            </div>
          </div>
        </div>

        {/* WhatsApp & SMS */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white">WhatsApp & SMS</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">WhatsApp Integration</p>
                <p className="text-[10px] text-theme-muted mt-1">Send bills via WhatsApp API</p>
              </div>
              <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 ${settings?.whatsappEnabled ? 'bg-emerald-500' : 'bg-white/10'}`} onClick={() => onUpdate({ whatsappEnabled: !settings?.whatsappEnabled })}>
                <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.whatsappEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">SMS Notifications</p>
                <p className="text-[10px] text-theme-muted mt-1">Twilio or local gateway</p>
              </div>
              <button className={`relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 ${settings?.smsEnabled ? 'bg-blue-500' : 'bg-white/10'}`} onClick={() => onUpdate({ smsEnabled: !settings?.smsEnabled })}>
                <span className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${settings?.smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Configure Gateways
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationStudio;
