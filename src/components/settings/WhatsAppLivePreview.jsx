import React from 'react';
import { Smartphone, CheckCheck } from 'lucide-react';

const WhatsAppLivePreview = ({ template, businessSettings }) => {
  // Dummy data replacement
  let message = String(template || '');
  
  // Basic variable replacements
  message = message
    .replace(/\{\{customerName\}\}/g, 'John Doe')
    .replace(/\{\{invoiceNo\}\}/g, 'INV-2024-001')
    .replace(/\{\{grandTotal\}\}/g, '₹1,500.00')
    .replace(/\{\{amountPaid\}\}/g, '₹0.00')
    .replace(/\{\{balanceDue\}\}/g, '₹1,500.00')
    .replace(/\{\{dueDate\}\}/g, '31 Dec 2024')
    .replace(/\{\{pdfUrl\}\}/g, 'https://billqyro.com/pdf/sample')
    .replace(/\{\{liveLinkUrl\}\}/g, 'https://billqyro.com/pay/sample')
    .replace(/\{\{businessName\}\}/g, businessSettings?.businessName || 'Your Business');

  // WhatsApp applies some markdown formatting: *bold*, _italic_, ~strikethrough~
  // We'll do a simple mock for bold just for the preview
  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*[^*]+\*)/g).map((part, index) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={index}>{part.slice(1, -1)}</strong>;
          }
          return part;
        })}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-[#efeae2] flex flex-col rounded-[2.5rem] overflow-hidden border-[8px] border-gray-900 shadow-2xl relative" style={{ height: '500px' }}>
      {/* Phone Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 relative z-10 shadow-md shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Customer</h3>
          <p className="text-[10px] text-white/80">online</p>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 p-4 overflow-y-auto scrollbar-hide relative" 
        style={{ 
          backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', 
          opacity: 0.9, 
          backgroundColor: '#efeae2', 
          backgroundBlendMode: 'overlay' 
        }}
      >
        
        {/* Date Pill */}
        <div className="flex justify-center mb-4">
          <span className="bg-[#e1f3fb] text-[#54656f] text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
            Today
          </span>
        </div>

        {/* Message Bubble */}
        <div className="flex justify-end mb-4">
          <div className="bg-[#dcf8c6] max-w-[85%] rounded-lg p-2 shadow-sm relative text-[13px] leading-relaxed text-[#111b21] break-words">
            {formatText(message)}
            
            {/* Timestamp & Ticks */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] float-right">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
            
            {/* Tail */}
            <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-2 text-[#dcf8c6]">
              <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
              <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Fake Input Area */}
      <div className="bg-[#f0f2f5] p-2 flex gap-2 items-center shrink-0">
        <div className="bg-white rounded-full flex-1 h-10 px-4 flex items-center text-gray-400 text-sm">
          Type a message
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" className="ml-1">
            <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppLivePreview;
