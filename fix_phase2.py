import os
import re

app_path = 'src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

# 1. Inject handleDeleteInvoice Guard
find_invoice = r"const handleDeleteInvoice = async \(id, permanent = false, skipConfirmation = false\) => \{\s*if \(isDemoSessionActive\) \{"
replace_invoice = """const handleDeleteInvoice = async (id, permanent = false, skipConfirmation = false) => {
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

    if (isDemoSessionActive) {"""

app_text = re.sub(find_invoice, replace_invoice, app_text)

# 2. Inject handleDeleteCustomer Guard
find_cust = r"const handleDeleteCustomer = async \(id\) => \{\s*if \(isDemoSessionActive\) \{"
replace_cust = """const handleDeleteCustomer = async (id) => {
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

    if (isDemoSessionActive) {"""

app_text = re.sub(find_cust, replace_cust, app_text)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_text)
print("App.jsx fixed!")

invoices_path = 'src/pages/Invoices.jsx'
with open(invoices_path, 'r', encoding='utf-8') as f:
    invoices_text = f.read()

invoices_text = invoices_text.replace("disabled={deleteConfirmText !== 'DELETE'}", "disabled={deleteConfirmText !== 'DELETE' || getInvoicePaidTotal(permanentDeleteTarget) > 0}")

find_trash = r"Move To Trash\s*</button>\s*</div>\s*</div>\s*</motion.div>\s*</div>,\s*document.body\s*\)"
replace_trash = """{getInvoicePaidTotal(paidDeleteTarget) > 0 ? "Cannot Trash Paid Invoice" : "Move To Trash"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )"""

invoices_text = re.sub(find_trash, replace_trash, invoices_text)

find_onclick = r"onClick=\{\(\) => \{\s*onDeleteInvoice\(paidDeleteTarget\.id, false, true\);\s*setPaidDeleteTarget\(null\);\s*\}\}"
replace_onclick = """disabled={getInvoicePaidTotal(paidDeleteTarget) > 0}
                    onClick={() => {
                      onDeleteInvoice(paidDeleteTarget.id, false, true);
                      setPaidDeleteTarget(null);
                    }}"""

invoices_text = re.sub(find_onclick, replace_onclick, invoices_text)

with open(invoices_path, 'w', encoding='utf-8') as f:
    f.write(invoices_text)
print("Invoices.jsx fixed!")