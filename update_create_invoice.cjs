const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// 1. Add state and handlers
const stateTarget = `const [amountPaid, setAmountPaid] = useState(0);`;
const stateReplacement = `const [amountPaid, setAmountPaid] = useState(0);
  const [paymentProofs, setPaymentProofs] = useState(editingInvoice?.paymentProofs || []);

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofs([...paymentProofs, { url: reader.result, date: new Date().toISOString() }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProof = (index) => {
    setPaymentProofs(paymentProofs.filter((_, i) => i !== index));
  };`;
code = code.replace(stateTarget, stateReplacement);

// 2. Update Payload
const payloadTarget = `paymentProofs: editingInvoice?.paymentProofs || [],`;
const payloadReplacement = `paymentProofs: paymentProofs,`;
code = code.replace(payloadTarget, payloadReplacement);

// 3. Add UI Button
const uiTarget = `<div>
                <label className="block mb-1 text-theme-muted">Amount Paid ({currencySymbol})</label>
                <input type="number" min="0" max={grandTotal} value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-black" />
              </div>`;

const uiReplacement = `<div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-theme-muted">Amount Paid ({currencySymbol})</label>
                  <label className="cursor-pointer text-[10px] font-bold text-theme-accent hover:text-theme-primary transition-colors flex items-center gap-1 bg-theme-accent-light px-2 py-0.5 rounded-lg">
                    <Plus size={12} /> Add Proof
                    <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
                  </label>
                </div>
                <input type="number" min="0" max={grandTotal} value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary font-black mb-2" />
                
                {/* Proof Thumbnails */}
                {paymentProofs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {paymentProofs.map((proof, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-lg border border-theme-border-soft overflow-hidden group">
                        <img src={proof.url} alt="Proof" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeProof(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check size={16} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/CreateInvoice.jsx', code);
console.log('CreateInvoice updated');
