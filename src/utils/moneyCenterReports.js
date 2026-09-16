/**
 * Money Center Reports — Day Book, CSV export, statements & UPI links
 * Pure helpers used by the Money & Payment Center (CollectionCenter)
 * and the Customer Ledger statement share.
 */

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

/** Normalize any stored date (ISO / YYYY-MM-DD / timestamp) to YYYY-MM-DD */
export const normalizeTxDate = (d) => {
  if (!d) return '';
  const s = String(d);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  return '';
};

export const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Build a Day Book (single-day cash summary) from the unified
 * transaction history produced by paymentEngine.getUnifiedTransactionHistory.
 */
export const buildDayBook = (transactions = [], dateStr) => {
  const day = dateStr || todayStr();
  const dayTx = (Array.isArray(transactions) ? transactions : [])
    .filter(t => normalizeTxDate(t.date) === day)
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  const isInternal = (t) => t.isTransfer || t.direction === 'TRANSFER' || t.direction === 'WITHDRAW' || t.type === 'transfer' || t.type === 'withdrawal';
  const isIn = (t) => t.direction === 'IN' && !isInternal(t);
  const isOut = (t) => t.direction === 'OUT' && !isInternal(t);

  const collections = dayTx.filter(isIn);
  const outflows = dayTx.filter(isOut);
  const internal = dayTx.filter(isInternal);

  const sum = (arr, fn) => round2(arr.reduce((s, t) => s + (fn ? fn(t) : (parseFloat(t.amount) || 0)), 0));

  const groupSum = (arr, keyFn) => {
    const out = {};
    arr.forEach(t => {
      const k = keyFn(t) || 'Other';
      out[k] = round2((out[k] || 0) + (parseFloat(t.amount) || 0));
    });
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  };

  return {
    date: day,
    transactions: dayTx,
    collections,
    outflows,
    internal,
    totals: {
      collected: sum(collections),
      spent: sum(outflows),
      internal: sum(internal),
      net: round2(sum(collections) - sum(outflows)),
      count: dayTx.length
    },
    collectionsByMethod: groupSum(collections, t => t.paymentMethod || 'Cash'),
    outflowsByCategory: groupSum(outflows, t => t.category || t.title || 'Expense')
  };
};

/** Download rows as a CSV file (Excel-friendly: BOM + CRLF). */
export const downloadCSV = (filename, rows, headers) => {
  const esc = (v) => `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [];
  if (headers && headers.length) lines.push(headers.map(esc).join(','));
  (rows || []).forEach(r => {
    const vals = Array.isArray(r) ? r : (headers || Object.keys(r)).map(k => (typeof r === 'object' ? r[k] : r));
    lines.push(vals.map(esc).join(','));
  });
  const blob = new Blob(["\uFEFF" + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

/** Build a UPI deep link (opens any UPI app with amount prefilled). */
export const buildUPILink = ({ upiId, payeeName = '', amount = 0, note = '' } = {}) => {
  if (!upiId) return '';
  const params = new URLSearchParams();
  params.set('pa', upiId);
  if (payeeName) params.set('pn', payeeName);
  const amt = round2(amount);
  if (amt > 0) params.set('am', String(amt));
  params.set('cu', 'INR');
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

/** Full account-statement text for WhatsApp sharing. */
export const buildCustomerStatementText = ({ customer, ledger, currencySymbol = '\u20B9', businessName = '', upiLink = '' } = {}) => {
  const fmt = (n) => `${currencySymbol}${(round2(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const name = customer?.name || 'Customer';
  const L = ledger || {};
  const lines = [];
  lines.push('*ACCOUNT STATEMENT*');
  if (businessName) lines.push(`_${businessName}_`);
  lines.push(`Customer: ${name}`);
  lines.push(`Bills: ${L.invoiceCount || 0}`);
  lines.push('');
  lines.push(`Opening Due: ${fmt(L.openingDue || 0)}`);
  lines.push(`Total Billed: +${fmt(L.totalBilled || 0)}`);
  lines.push(`Total Paid: -${fmt(L.totalPaid || 0)}`);
  lines.push('*BALANCE DUE: ' + fmt(L.totalDue || 0) + '*');
  const a = L.aging || {};
  const agingParts = [];
  if (a.overdue0to30 > 0) agingParts.push(`0-30d: ${fmt(a.overdue0to30)}`);
  if (a.overdue31to60 > 0) agingParts.push(`31-60d: ${fmt(a.overdue31to60)}`);
  if (a.overdue61to90 > 0) agingParts.push(`61-90d: ${fmt(a.overdue61to90)}`);
  if (a.overdue90Plus > 0) agingParts.push(`90d+: ${fmt(a.overdue90Plus)}`);
  if (agingParts.length) {
    lines.push('');
    lines.push(`Overdue aging \u2014 ${agingParts.join(' | ')}`);
  }
  const invs = (L.invoices || []).slice(-5);
  if (invs.length) {
    lines.push('');
    lines.push('Recent bills:');
    invs.forEach(inv => {
      const fin = inv._statementFin || null;
      const total = fin ? fin.grandTotal : (inv.grandTotal || inv.total || 0);
      const due = fin ? fin.balanceDue : (inv.balanceDue !== undefined ? inv.balanceDue : total);
      lines.push(`\u2022 ${inv.invoiceNumber || '-'} (${normalizeTxDate(inv.date)}) ${fmt(total)} \u2192 Due ${fmt(due)}`);
    });
  }
  if (upiLink) {
    lines.push('');
    lines.push(`Pay online (UPI): ${upiLink}`);
  }
  lines.push('');
  lines.push('Thank you for your business!');
  return lines.join('\n');
};

/** Open a printable Day Book window (browser print dialog). */
export const printDayBook = ({ dayBook, currencySymbol = '\u20B9', businessName = 'Business' }) => {
  const fmt = (n) => `${currencySymbol}${(Math.round((parseFloat(n) || 0) * 100) / 100).toLocaleString('en-IN')}`;
  const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const t = dayBook.totals;
  const rows = dayBook.transactions.map(tx => `
    <tr>
      <td>${esc(normalizeTxDate(tx.date))}${tx.date && String(tx.date).length > 10 ? ' ' + esc(String(tx.date).slice(11, 16)) : ''}</td>
      <td>${esc(tx.direction)}</td>
      <td>${esc(tx.customerName || tx.staffName || tx.vendorName || tx.title || tx.category || '')}</td>
      <td>${esc(tx.category || '')}</td>
      <td>${esc(tx.invoiceNumber || tx.reference || '')}</td>
      <td>${esc(tx.paymentMethod || '')}</td>
      <td style="text-align:right">${esc(fmt(tx.amount))}</td>
    </tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Day Book ${esc(dayBook.date)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;}
    h1{font-size:20px;margin:0 0 2px;} .sub{color:#555;font-size:12px;margin-bottom:16px;}
    .cards{display:flex;gap:10px;margin-bottom:14px;}
    .card{border:1px solid #ddd;border-radius:8px;padding:8px 14px;font-size:12px;}
    .card b{display:block;font-size:16px;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;}
    th{background:#f3f4f6;}
    tfoot td{font-weight:bold;background:#f9fafb;}
  </style></head><body>
  <h1>${esc(businessName)} \u2014 Day Book</h1>
  <div class="sub">Date: ${esc(dayBook.date)} \u2022 ${t.count} transactions \u2022 Printed ${esc(new Date().toLocaleString())}</div>
  <div class="cards">
    <div class="card">Collected<b style="color:#059669">${esc(fmt(t.collected))}</b></div>
    <div class="card">Spent<b style="color:#e11d48">${esc(fmt(t.spent))}</b></div>
    <div class="card">Net Cash Flow<b>${esc(fmt(t.net))}</b></div>
    <div class="card">Internal Transfers<b>${esc(fmt(t.internal))}</b></div>
  </div>
  <table>
    <thead><tr><th>Date/Time</th><th>Dir</th><th>Party</th><th>Category</th><th>Ref</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#888">No transactions on this date</td></tr>'}</tbody>
    <tfoot><tr><td colspan="6" style="text-align:right">Collected</td><td style="text-align:right">${esc(fmt(t.collected))}</td></tr>
    <tr><td colspan="6" style="text-align:right">Spent</td><td style="text-align:right">${esc(fmt(t.spent))}</td></tr>
    <tr><td colspan="6" style="text-align:right">Net</td><td style="text-align:right">${esc(fmt(t.net))}</td></tr></tfoot>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print();},150);};</script>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
};
