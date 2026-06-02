const fs = require('fs');
let code = fs.readFileSync('src/components/InvoicePreview.jsx', 'utf-8');

// Import DynamicQRCode
if (!code.includes('DynamicQRCode')) {
  code = code.replace("import React from 'react';", "import React from 'react';\nimport DynamicQRCode from './DynamicQRCode';");
}

// Replace the entire section for QR code generation
const qrRegex = /\{\/\* 4\.5\. PREMIUM PAYMENT QR CARD[\s\S]*?(?=\{\/\* 5\. FOOTER NOTES \*\/)/;

const newQrSection = `{/* 4.5. PREMIUM LIVE LINK QR CARD (CLIENT VIEW) */}
      {paymentPrefs?.paymentQrEnabled && paymentPrefs?.showQrInPreview && (
        (() => {
          const liveLink = \`\${window.location.origin}/invoice/\${invoice.publicToken || invoice.id}\`;
          return (
            <div className="mt-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-theme-surface to-theme-card text-white shadow-xl relative overflow-hidden border border-slate-700/50 dark:border-theme-border-soft/80">
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -top-20 w-60 h-60 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="p-3 bg-theme-card dark:bg-theme-card rounded-2xl shadow-lg border border-white/10 shrink-0">
                  <DynamicQRCode value={liveLink} size={120} logoUrl={businessPrefs.logoUrl || "https://placehold.co/50x50/111827/FFFFFF?text=BillQyro"} />
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-xl font-bold font-sans">Scan to Pay & View Live Invoice</h3>
                  <p className="text-theme-muted text-sm max-w-sm">Scan this QR code to securely view your invoice online or make a payment directly via the live portal.</p>
                </div>
              </div>
            </div>
          );
        })()
      )}
      
      `;

code = code.replace(qrRegex, newQrSection);

fs.writeFileSync('src/components/InvoicePreview.jsx', code);
console.log('Updated InvoicePreview.jsx');
