const fs = require('fs');
let content = fs.readFileSync('e:/Billmint/src/utils/storage.js', 'utf8');

const oldStr = `if (firebaseReady) {
    try {
      console.log('[DEBUG] ensureInvoicePublicToken - Force writing public copy to publicInvoices/' + token);
      await firestoreSave('publicInvoices', token, invoice);

      const userId = getFirebaseUserId();
      if (userId && invoice.id) {
        console.log('[DEBUG] ensureInvoicePublicToken - Force writing private copy to invoices/' + userId + '/items/' + invoice.id);
        await setDoc(doc(db, 'invoices', userId, 'items', invoice.id), invoice);
      }
    } catch (e) {
      console.error('[ERROR] Failed to sync publicToken to Firestore in ensureInvoicePublicToken:', e);
    }
  }`;

const newStr = `if (firebaseReady) {
    (async () => {
      try {
        console.log('[DEBUG] ensureInvoicePublicToken - Force writing public copy to publicInvoices/' + token);
        await firestoreSave('publicInvoices', token, invoice);

        const userId = getFirebaseUserId();
        if (userId && invoice.id) {
          console.log('[DEBUG] ensureInvoicePublicToken - Force writing private copy to invoices/' + userId + '/items/' + invoice.id);
          await setDoc(doc(db, 'invoices', userId, 'items', invoice.id), invoice);
        }
      } catch (e) {
        console.error('[ERROR] Failed to sync publicToken to Firestore in ensureInvoicePublicToken:', e);
      }
    })();
  }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('e:/Billmint/src/utils/storage.js', content);
console.log('Done!');
