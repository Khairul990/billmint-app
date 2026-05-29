const fs = require('fs');

let content = fs.readFileSync('e:/Billmint/src/pages/CreateInvoice.jsx', 'utf8');

const targetRegex = /<div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium space-y-3">[\s\S]*?<\/button>\s*<\/div>/;

const replacement = `<div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <h3 className="text-sm font-extrabold text-theme-primary border-b border-theme-border-soft pb-3 mb-4">Invoice Actions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleSave('Draft')}
                className="w-full h-[52px] bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted rounded-xl font-bold hover:bg-theme-border-soft transition-all flex items-center justify-center gap-2 text-[13px] border border-theme-border-soft/50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              
              <button
                onClick={() => setShowPreview(true)}
                className="w-full h-[52px] bg-theme-surface dark:bg-theme-card text-theme-primary dark:text-theme-muted rounded-xl font-bold hover:bg-theme-border-soft transition-all flex items-center justify-center gap-2 text-[13px] border border-theme-border-soft/50 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="w-full h-[52px] bg-theme-surface dark:bg-theme-card border border-theme-accent text-theme-accent rounded-xl font-bold hover:bg-theme-accent-light dark:hover:bg-theme-card transition-all flex items-center justify-center gap-2 text-[13px] shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              
              <button
                onClick={() => handleSave()}
                className="w-full h-[52px] bg-[image:var(--accent-gradient)] bg-theme-accent text-theme-button-text rounded-xl font-bold hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 text-[13px] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Invoice</span>
              </button>

              {/* Copy Live Link */}
              <button
                onClick={() => { if(editingInvoice) handleCopyLiveLink(); }}
                disabled={!editingInvoice}
                title={!editingInvoice ? "Save invoice first to create live link" : "Copy Live Link"}
                className={\`w-full h-[52px] rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-[13px] transition-all shadow-sm border \${
                  editingInvoice
                    ? 'bg-theme-surface border-theme-border-soft text-theme-primary hover:bg-theme-border-soft cursor-pointer'
                    : 'bg-theme-surface/50 border-theme-border-soft/40 text-theme-muted cursor-not-allowed'
                }\`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Link className="w-4 h-4" />
                  <span>Copy Live Link</span>
                </div>
                {!editingInvoice && (
                  <span className="text-[9px] text-theme-muted font-medium leading-none">Save invoice first</span>
                )}
              </button>

              {/* Send WhatsApp Reminder */}
              <button
                onClick={() => { if(editingInvoice && customerPhone) handleSendWhatsAppReminder(); }}
                disabled={!editingInvoice || !customerPhone}
                title={!editingInvoice ? "Save invoice first" : (!customerPhone ? "Customer phone required" : "Send reminder")}
                className={\`w-full h-[52px] rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-[13px] transition-all shadow-sm border \${
                  (editingInvoice && customerPhone)
                    ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 cursor-pointer'
                    : 'bg-theme-surface/50 border-theme-border-soft/40 text-theme-muted cursor-not-allowed'
                }\`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>WhatsApp Reminder</span>
                </div>
                {(!editingInvoice || !customerPhone) && (
                  <span className="text-[9px] text-theme-muted font-medium leading-none">
                    {!editingInvoice ? 'Save invoice first' : 'Add customer phone'}
                  </span>
                )}
              </button>
            </div>`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('e:/Billmint/src/pages/CreateInvoice.jsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Target not found');
}
