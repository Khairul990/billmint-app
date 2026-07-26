const fs = require('fs');
const filePath = 'D:/Khair_Murafiq_Empire/BillQyro/src/pages/PendingPayments.jsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/import \{ db \} from '\.\.\/services\/firebaseConfig';\r?\n/, '');
code = code.replace(/import \{ doc, runTransaction \} from 'firebase\/firestore';\r?\n/, "import { paymentEngine } from '../services/paymentEngine';\n");

const handleApproveOriginal = `  const handleApprove = async (payment) => {
    try {
      setProcessingId(payment.id);

      const proofRef = doc(db, 'payment_proofs', payment.id);
      
      // Use transaction to prevent duplicate approvals and race conditions
      await runTransaction(db, async (transaction) => {
        const proofDoc = await transaction.get(proofRef);
        if (!proofDoc.exists()) {
          throw new Error('Payment proof not found.');
        }
        const proofData = proofDoc.data();
        if (proofData.status === 'approved') {
          throw new Error('This payment has already been approved.');
        }
        if (proofData.status === 'rejected') {
          throw new Error('This payment has already been rejected.');
        }

        transaction.update(proofRef, { 
          status: 'approved',
          updatedAt: new Date().toISOString()
        });

        if (payment.invoiceId) {
          const localInvoices = await invoiceEngine.getInvoices();
          const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
          
          if (existingInvoice && existingInvoice.publicToken) {
            const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
            const pInvDoc = await transaction.get(publicInvRef);
            if (pInvDoc.exists()) {
              const pData = pInvDoc.data();
              const grandTotal = pData.grandTotal || 0;
              const currentPaid = parseFloat(pData.amountPaid) || 0;
              const paymentAmount = parseFloat(payment.amount) || 0;
              const newPaid = currentPaid + paymentAmount;
              const newBalance = Math.max(0, grandTotal - newPaid);
              let newStatus = pData.paymentStatus;
              if (newBalance <= 0) newStatus = 'Paid';
              else if (newPaid > 0) newStatus = 'Partially Paid';
              
              transaction.update(publicInvRef, { 
                paymentStatus: newStatus,
                status: newStatus,
                amountPaid: newPaid,
                balanceDue: newBalance
              });
            }
          }
        }
      });`;

const handleApproveNew = `  const handleApprove = async (payment) => {
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
      await paymentEngine.approvePaymentProof(payment.id, payment.amount, publicToken);`;

code = code.replace(handleApproveOriginal, handleApproveNew);

const handleRejectOriginal = `  const handleReject = async (payment) => {
    try {
      setProcessingId(payment.id);

      const proofRef = doc(db, 'payment_proofs', payment.id);
      
      // Use transaction to prevent duplicate rejections
      await runTransaction(db, async (transaction) => {
        const proofDoc = await transaction.get(proofRef);
        if (!proofDoc.exists()) throw new Error('Payment proof not found.');
        
        const proofData = proofDoc.data();
        if (proofData.status !== 'pending') {
          throw new Error(\`Payment is already \${proofData.status}\`);
        }

        transaction.update(proofRef, { 
          status: 'rejected',
          updatedAt: new Date().toISOString()
        });

        // If it was attached to an invoice, revert payment status
        if (payment.invoiceId) {
          const localInvoices = await invoiceEngine.getInvoices();
          const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
          
          if (existingInvoice && existingInvoice.publicToken) {
            const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
            const pInvDoc = await transaction.get(publicInvRef);
            if (pInvDoc.exists()) {
              const pData = pInvDoc.data();
              const grandTotal = pData.grandTotal || 0;
              const currentPaid = parseFloat(pData.amountPaid) || 0;
              const paymentAmount = parseFloat(payment.amount) || 0;
              const revertedPaid = Math.max(0, currentPaid - paymentAmount);
              const revertedBalance = Math.max(0, grandTotal - revertedPaid);
              let revertedStatus = pData.paymentStatus;
              if (revertedBalance <= 0 && revertedPaid > 0) revertedStatus = 'Paid';
              else if (revertedPaid <= 0) revertedStatus = 'Unpaid';
              else revertedStatus = 'Partially Paid';
  
              transaction.update(publicInvRef, {
                paymentStatus: revertedStatus,
                status: revertedStatus,
                amountPaid: revertedPaid,
                balanceDue: revertedBalance
              });
            }
          }
        }
      });`;

const handleRejectNew = `  const handleReject = async (payment) => {
    try {
      setProcessingId(payment.id);

      await paymentEngine.rejectPaymentProof(payment.id);`;

code = code.replace(handleRejectOriginal, handleRejectNew);

fs.writeFileSync(filePath, code);
console.log("Rewrite completed successfully!");
