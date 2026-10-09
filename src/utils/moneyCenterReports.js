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

/** Print a professional Customer Account Statement / Party Ledger (A4 format). */
export const printCustomerStatement = ({ customer, ledger, currencySymbol = '₹', businessSettings = {} }) => {
  if (!customer) return false;
  const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (n) => `${currencySymbol}${(Math.round((parseFloat(n) || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const L = ledger || {};
  const b = businessSettings || {};
  const bName = b.businessName || 'BillQyro Store';
  const bPhone = b.phone || '';
  const bEmail = b.email || '';
  const bAddress = b.address || '';
  const bGst = b.gstNumber || b.taxId || '';

  const customerName = customer.name || 'Customer';
  const customerPhone = customer.phone || '';
  const customerEmail = customer.email || '';
  const customerAddress = customer.address || '';

  // Merge invoices and payments into chronological ledger events with running balance
  const events = [];
  const openingDue = parseFloat(L.openingDue) || 0;

  (L.invoices || []).forEach(inv => {
    const amt = parseFloat(inv.grandTotal || inv.total) || 0;
    events.push({
      date: inv.date || inv.createdAt || '',
      type: 'INVOICE',
      ref: inv.invoiceNumber || 'BILL',
      description: `Sales Bill / Invoice (${(inv.items || []).length} items)`,
      debit: amt,
      credit: 0
    });
  });

  (L.paymentHistory || []).forEach(p => {
    const amt = parseFloat(p.amount) || 0;
    events.push({
      date: p.date || p.createdAt || '',
      type: 'PAYMENT',
      ref: p.invoiceNumber ? `Against ${p.invoiceNumber}` : (p.reference || 'PAYMENT'),
      description: `Payment Received (${p.method || 'Cash'})${p.notes ? ' - ' + p.notes : ''}`,
      debit: 0,
      credit: amt
    });
  });

  events.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let runningBalance = openingDue;
  const rows = events.map(evt => {
    runningBalance += (evt.debit - evt.credit);
    return `
      <tr>
        <td>${esc(normalizeTxDate(evt.date))}</td>
        <td><span style="font-weight:700; font-size:10px; padding:2px 6px; border-radius:4px; background:${evt.type === 'INVOICE' ? '#eff6ff; color:#1d4ed8' : '#ecfdf5; color:#047857'}">${esc(evt.type)}</span></td>
        <td><b>${esc(evt.ref)}</b></td>
        <td>${esc(evt.description)}</td>
        <td style="text-align:right; font-weight:700; color:#1e293b">${evt.debit > 0 ? esc(fmt(evt.debit)) : '-'}</td>
        <td style="text-align:right; font-weight:700; color:#059669">${evt.credit > 0 ? esc(fmt(evt.credit)) : '-'}</td>
        <td style="text-align:right; font-weight:800; color:${runningBalance > 0 ? '#b91c1c' : '#0f766e'}">${esc(fmt(runningBalance))}</td>
      </tr>
    `;
  }).join('');

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Statement - ${esc(customerName)}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; font-size: 11px; line-height: 1.4; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
      .brand-title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
      .doc-title { font-size: 14px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
      .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
      .card-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
      .card-val { font-size: 14px; font-weight: 900; color: #0f172a; }
      .party-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 8px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #334155; }
      tfoot td { font-weight: 800; background: #f8fafc; }
      .bank-box { margin-top: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 10px; background: #fafafa; }
      .footer-sign { margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand-title">${esc(bName)}</div>
        ${bAddress ? `<div>${esc(bAddress.replace(/\n/g, ', '))}</div>` : ''}
        ${bPhone ? `<div>Phone: ${esc(bPhone)}</div>` : ''}
        ${bEmail ? `<div>Email: ${esc(bEmail)}</div>` : ''}
        ${bGst ? `<div><b>GSTIN:</b> ${esc(bGst)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="doc-title">CUSTOMER STATEMENT</div>
        <div style="color: #64748b; font-size: 10px;">Period: All Recorded Transactions</div>
        <div style="color: #64748b; font-size: 10px;">Generated: ${esc(new Date().toLocaleDateString('en-IN'))}</div>
      </div>
    </div>

    <div class="party-box">
      <div>
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Customer Details</div>
        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${esc(customerName)}</div>
        ${customerPhone ? `<div>Phone: ${esc(customerPhone)}</div>` : ''}
        ${customerEmail ? `<div>Email: ${esc(customerEmail)}</div>` : ''}
        ${customerAddress ? `<div>Address: ${esc(customerAddress)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Account Summary</div>
        <div>Total Bills: <b>${L.invoiceCount || (L.invoices || []).length}</b></div>
        <div>Status: <b>${(L.totalDue || 0) <= 0 ? '<span style="color:#059669">SETTLED</span>' : '<span style="color:#b91c1c">OUTSTANDING DUE</span>'}</b></div>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <div class="card-label">Opening Due</div>
        <div class="card-val">${esc(fmt(L.openingDue || 0))}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Invoiced</div>
        <div class="card-val">${esc(fmt(L.totalBilled || 0))}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Paid</div>
        <div class="card-val" style="color: #059669;">${esc(fmt(L.totalPaid || 0))}</div>
      </div>
      <div class="card" style="border-color: #fda4af; background: #fff1f2;">
        <div class="card-label" style="color: #e11d48;">Net Balance Due</div>
        <div class="card-val" style="color: #be123c;">${esc(fmt(L.totalDue || 0))}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Date</th>
          <th style="width: 12%;">Type</th>
          <th style="width: 16%;">Reference #</th>
          <th style="width: 26%;">Description</th>
          <th style="width: 10%; text-align: right;">Debit (+)</th>
          <th style="width: 10%; text-align: right;">Credit (-)</th>
          <th style="width: 12%; text-align: right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${openingDue > 0 ? `
          <tr>
            <td>-</td>
            <td><span style="font-weight:700; font-size:10px; padding:2px 6px; border-radius:4px; background:#fef3c7; color:#b45309">OPENING</span></td>
            <td><b>Opening Balance</b></td>
            <td>Initial balance carried forward</td>
            <td style="text-align:right; font-weight:700;">${esc(fmt(openingDue))}</td>
            <td style="text-align:right;">-</td>
            <td style="text-align:right; font-weight:800; color:#b91c1c;">${esc(fmt(openingDue))}</td>
          </tr>
        ` : ''}
        ${rows || '<tr><td colspan="7" style="text-align:center; padding:18px; color:#94a3b8;">No transactions found for this account</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align: right;">TOTALS:</td>
          <td style="text-align: right;">${esc(fmt(L.totalBilled || 0))}</td>
          <td style="text-align: right; color:#059669;">${esc(fmt(L.totalPaid || 0))}</td>
          <td style="text-align: right; font-weight:900; color:${(L.totalDue || 0) > 0 ? '#b91c1c' : '#0f766e'}; font-size: 12px;">${esc(fmt(L.totalDue || 0))}</td>
        </tr>
      </tfoot>
    </table>

    ${b.bankDetails?.bankName || b.bankDetails?.upiId ? `
      <div class="bank-box">
        <b>Payment Instructions:</b><br/>
        ${b.bankDetails?.bankName ? `Bank: ${esc(b.bankDetails.bankName)} | A/C: ${esc(b.bankDetails.accountNumber)} | IFSC: ${esc(b.bankDetails.ifscCode)}<br/>` : ''}
        ${b.bankDetails?.upiId ? `UPI ID: <b>${esc(b.bankDetails.upiId)}</b>` : ''}
      </div>
    ` : ''}

    <div class="footer-sign">
      <div style="font-size: 9px; color: #64748b;">
        This is a computer generated account statement.<br/>
        Thank you for your business!
      </div>
      <div style="text-align: center;">
        ${b.signatureUrl || b.signatureDataUrl ? `
          <img src="${b.signatureUrl || b.signatureDataUrl}" style="height: 48px; object-fit: contain; margin-bottom: 2px;" alt="Signature" /><br/>
        ` : '<div style="height: 36px; border-bottom: 1px dashed #94a3b8; width: 140px; margin-bottom: 4px;"></div>'}
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase;">Authorised Signatory</span>
      </div>
    </div>

    <script>window.onload=function(){setTimeout(function(){window.print();},200);};</script>
  </body>
  </html>`;

  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
};

