import fs from 'fs';

let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /const handleDeleteInvoice = async \(id, permanent = false, skipConfirmation = false\) => \{\n\s*if \(isDemoSessionActive\) \{/g,
  const handleDeleteInvoice = async (id, permanent = false, skipConfirmation = false) => {
    const targetInv = (invoices || []).find(inv => inv.id === id);
    if (targetInv) {
      let paidVal = 0;
      if (Array.isArray(targetInv.paymentHistory) && targetInv.paymentHistory.length > 0) {
        paidVal = targetInv.paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      } else {
        paidVal = Number(targetInv.paidAmount ?? targetInv.amountPaid ?? 0);
      }
      if (paidVal > 0) {
        toast.error('Cannot delete invoices with collected revenue. Void payments first.');
        return;
      }
    }

    if (isDemoSessionActive) {
);

app = app.replace(
  /const handleDeleteCustomer = async \(id\) => \{\n\s*if \(isDemoSessionActive\) \{/g,
  const handleDeleteCustomer = async (id) => {
    const targetCust = (customers || []).find(c => c.id === id);
    if (targetCust) {
      const custInvoices = (invoices || []).filter(inv => (inv.customerId || inv.customer?.id) === id && !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
      const openingDue = parseFloat(targetCust.previousDue ?? targetCust.openingDue ?? targetCust.openingBalance) || 0;
      let totalBilled = 0;
      let totalPaid = 0;
      custInvoices.forEach(inv => {
        totalBilled += parseFloat(inv.grandTotal || inv.total) || 0;
        if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
          totalPaid += inv.paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        } else {
          totalPaid += Number(inv.paidAmount ?? inv.amountPaid ?? 0);
        }
      });
      const totalDue = openingDue + totalBilled - totalPaid;
      if (totalDue > 0.05) {
        toast.error('Cannot delete a customer with an active outstanding balance.');
        return;
      }
    }

    if (isDemoSessionActive) {
);

fs.writeFileSync('src/App.jsx', app);
console.log("App.jsx fixed!");

let invoices = fs.readFileSync('src/pages/Invoices.jsx', 'utf8');

invoices = invoices.replace(
  /disabled=\{deleteConfirmText !== 'DELETE'\}/g,
  disabled={deleteConfirmText !== 'DELETE' || getInvoicePaidTotal(permanentDeleteTarget) > 0}
);

invoices = invoices.replace(
  /Move To Trash\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/motion.div>\s*<\/div>,\s*document\.body\s*\)/g,
  {getInvoicePaidTotal(paidDeleteTarget) > 0 ? "Cannot Trash Paid Invoice" : "Move To Trash"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )
);

invoices = invoices.replace(
  /onClick=\{\(\) => \{\s*onDeleteInvoice\(paidDeleteTarget\.id, false, true\);\s*setPaidDeleteTarget\(null\);\s*\}\}/g,
  disabled={getInvoicePaidTotal(paidDeleteTarget) > 0}
                    onClick={() => {
                      onDeleteInvoice(paidDeleteTarget.id, false, true);
                      setPaidDeleteTarget(null);
                    }}
);

fs.writeFileSync('src/pages/Invoices.jsx', invoices);
console.log("Invoices.jsx fixed!");