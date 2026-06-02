const fs = require('fs');

let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// 1. Add handlers for WhatsApp and Email
const handlerTarget = `  const handlePdfClick = () => {`;
const handlerReplacement = `  const handleShareWhatsApp = () => {
    if (!customerPhone) {
      toast.error('Please enter customer phone number.');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');
    const activeCurrency = businessSettings?.currency || '₹';
    const msg = \`Hello \${customerName || 'Customer'},\n\nHere is your invoice *\${invoiceNumber || 'Draft'}* for \${activeCurrency}\${grandTotal}.\nAmount Paid: \${activeCurrency}\${amountPaid}\nBalance Due: *\${activeCurrency}\${balanceDue}*\n\nThank you for your business!\`;
    window.open(\`https://api.whatsapp.com/send?phone=\${cleanPhone}&text=\${encodeURIComponent(msg)}\`, '_blank');
  };

  const handleShareEmail = () => {
    if (!customerEmail) {
      toast.error('Please enter customer email.');
      return;
    }
    const activeCurrency = businessSettings?.currency || '₹';
    const subject = \`Invoice \${invoiceNumber || 'Draft'} from \${businessSettings?.businessName || 'Business'}\`;
    const body = \`Hello \${customerName || 'Customer'},\n\nPlease find the details of your invoice \${invoiceNumber || 'Draft'}.\n\nTotal Amount: \${activeCurrency}\${grandTotal}\nAmount Paid: \${activeCurrency}\${amountPaid}\nBalance Due: \${activeCurrency}\${balanceDue}\n\nThank you for your business!\`;
    window.location.href = \`mailto:\${customerEmail}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
  };

  const handlePdfClick = () => {`;
code = code.replace(handlerTarget, handlerReplacement);

// 2. Add buttons in Modal Top Actions Header Bar
const uiTarget = `                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}`;

const uiReplacement = `                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShareWhatsApp}
                      className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      title="Share via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] font-bold hidden sm:block uppercase tracking-wider">WhatsApp</span>
                    </button>
                    <button
                      onClick={handleShareEmail}
                      className="p-2 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      title="Share via Email"
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-[10px] font-bold hidden sm:block uppercase tracking-wider">Email</span>
                    </button>
                    <div className="w-px h-5 bg-theme-border-soft mx-1" />
                    <button
                      onClick={() => window.print()}`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/CreateInvoice.jsx', code);
console.log('WhatsApp and Email logic injected successfully');
