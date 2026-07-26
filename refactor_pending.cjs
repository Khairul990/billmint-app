const fs = require('fs');
const filePath = 'D:/Khair_Murafiq_Empire/BillQyro/src/pages/PendingPayments.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Remove direct db imports
code = code.replace(/import \{ db \} from '\.\.\/services\/firebaseConfig';\r?\n/, '');
code = code.replace(/import \{ doc, runTransaction \} from 'firebase\/firestore';\r?\n/, "import { paymentEngine } from '../services/paymentEngine';\n");

// Replace handleApprove
const approveRegex = /const handleApprove = async \(payment\) => \{[\s\S]*?\/\/ Update local invoice data after successful transaction/m;
const newApproveLogic = `const handleApprove = async (payment) => {
    try {
      setProcessingId(payment.id);

      let publicToken = null;
      if (payment.invoiceId) {
        const localInvoices = await invoiceEngine.getInvoices();
        const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
        if (existingInvoice) {
          publicToken = existingInvoice.publicToken;
        }
      }
      await paymentEngine.approvePaymentProof(payment.id, payment.amount, publicToken);

      // Update local invoice data after successful transaction`;
code = code.replace(approveRegex, newApproveLogic);

// Replace handleReject
const rejectRegex = /const handleReject = async \(payment\) => \{[\s\S]*?const proofRef = doc\(db, 'payment_proofs', payment\.id\);[\s\S]*?await runTransaction\(db, async \(transaction\) => \{[\s\S]*?\}\);/m;
const newRejectLogic = `const handleReject = async (payment) => {
    try {
      setProcessingId(payment.id);
      
      await paymentEngine.rejectPaymentProof(payment.id);`;
code = code.replace(rejectRegex, newRejectLogic);

fs.writeFileSync(filePath, code);
console.log("Rewrite completed successfully!");
