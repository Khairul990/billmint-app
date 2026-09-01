import { invoiceEngine } from './invoiceEngine.js';
import { 
  getInvoicePaymentStatus, 
  calculateCanonicalInvoiceFinancials, 
  allocatePayment, 
  roundTo2 
} from '../utils/invoiceMath.js';
import { db, firebaseReady } from './firebaseConfig.js';
import { doc, runTransaction } from 'firebase/firestore';
import { 
  submitPlatformPaymentProof as dbSubmitPlatformPaymentProof, 
  getUserPaymentProofs as dbGetUserPaymentProofs, 
  getUserRevenueState as dbGetUserRevenueState,
  logAudit 
} from './dbEngine.js';

class PaymentEngine {
  /**
   * CANONICAL UNIVERSAL TRANSACTION ROUTER
   * Single authoritative entry point for any manual financial transaction in BillQyro.
   */
  async recordTransaction(transactionData = {}) {
    const { type, category, sourceLocation, destinationLocation } = transactionData;
    const normType = (type || '').toLowerCase();
    const normCat = (category || '').toLowerCase();

    if (normType === 'customer_payment' || normCat.includes('invoice payment') || normCat.includes('sale')) {
      return await this.recordCustomerPayment(transactionData);
    } else if (normType === 'owner_salary' || normCat === 'my salary' || normCat.includes('owner salary')) {
      return await this.recordOwnerSalary(transactionData);
    } else if (normType === 'withdrawal' || normCat === 'withdrawal' || normCat.includes('withdraw')) {
      return await this.recordWithdrawal(transactionData);
    } else if (normType === 'transfer' || normCat.includes('transfer') || normCat.includes('dream')) {
      return await this.recordMoneyTransfer(transactionData);
    } else if (normType === 'personal_expense' || (sourceLocation === 'my_cash' || sourceLocation === 'phonepe')) {
      return await this.recordPersonalExpense(transactionData);
    } else if (normType === 'staff_salary' || normCat.includes('salary') || normCat.includes('wages')) {
      return await this.recordStaffPayment({ ...transactionData, paymentType: 'Salary / Wages' });
    } else if (normType === 'staff_advance' || normCat.includes('staff advance') || normCat.includes('advance')) {
      return await this.recordStaffPayment({ ...transactionData, paymentType: 'Staff Advance' });
    } else if (normType === 'other_staff_payment' || normCat.includes('staff payment')) {
      return await this.recordStaffPayment({ ...transactionData, paymentType: 'Staff Payment' });
    } else if (normType === 'vendor_payment' || normCat.includes('vendor') || normCat.includes('outsource') || normCat.includes('purchase')) {
      return await this.recordVendorPayment(transactionData);
    } else if (normType === 'customer_refund' || normCat.includes('refund')) {
      return await this.recordCustomerRefund(transactionData);
    } else if (normType === 'expense' || normCat.includes('expense')) {
      return await this.recordExpenseTransaction(transactionData);
    } else if (normType === 'money_in' || transactionData.direction === 'IN') {
      return await this.recordGeneralMoneyTransaction({ ...transactionData, type: 'moneyIn' });
    } else if (normType === 'money_out' || transactionData.direction === 'OUT') {
      return await this.recordGeneralMoneyTransaction({ ...transactionData, type: 'moneyOut' });
    } else {
      return await this.recordGeneralMoneyTransaction(transactionData);
    }
  }

  /**
   * CANONICAL CUSTOMER INVOICE PAYMENT RECORDING
   */
  async recordCustomerPayment({
    customerId = null,
    invoiceId,
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    source = 'manual_collection',
    proofId = null,
    createdBy = 'Merchant',
    workspaceId = null
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    const paymentAmount = roundTo2(rawAmt);

    const invoices = await invoiceEngine.getInvoices(true);
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found for payment collection.');
    }

    // Workspace Isolation Check
    if (workspaceId && invoice.workspaceId && invoice.workspaceId !== workspaceId) {
      throw new Error('Access denied: Invoice does not belong to the active workspace.');
    }

    if (!Array.isArray(invoice.paymentHistory)) invoice.paymentHistory = [];
    if (!Array.isArray(invoice.paymentProofs)) invoice.paymentProofs = [];

    // Canonical Financial Calculations
    const fin = calculateCanonicalInvoiceFinancials(invoice);
    const maxPayable = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

    // Overpayment Protection
    if (paymentAmount > maxPayable && maxPayable > 0) {
      throw new Error(`Payment amount (${paymentAmount}) cannot exceed outstanding liability (${maxPayable}).`);
    }

    // Previous Due Priority Allocation
    const allocation = allocatePayment(paymentAmount, fin.previousDue, fin.currentInvoiceTotal);

    const paymentId = proofId ? `pmt_${proofId}` : `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Idempotent duplicate check
    const existingIndex = invoice.paymentHistory.findIndex(p => 
      p.id === paymentId || (proofId && p.proofId === proofId) || (p.transactionId && reference && p.transactionId === reference && p.amount === paymentAmount)
    );

    if (existingIndex >= 0) {
      return {
        success: true,
        alreadyProcessed: true,
        invoice,
        payment: invoice.paymentHistory[existingIndex],
        allocation
      };
    }

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const paymentEntry = {
      id: paymentId,
      proofId: proofId || null,
      amount: paymentAmount,
      method: paymentMethod,
      transactionId: reference || '',
      reference: reference || '',
      date: effectiveDate,
      note: note || (source === 'live_link_approved' ? 'Payment proof approved' : 'Recorded in Money & Payment Center'),
      source,
      allocatedToOldDue: allocation.allocatedToOldDue,
      allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
      earlierBalancePaid: allocation.allocatedToOldDue,
      thisBillPaid: allocation.allocatedToCurrentInvoice,
      customerId: customerId || invoice.customer?.id || invoice.customerId || null,
      customerName: invoice.customer?.name || invoice.customerName || 'Walk-in Customer',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id.slice(0, 4)}`,
      createdBy,
      workspaceId: workspaceId || invoice.workspaceId || null,
      verified: true,
      createdAt: new Date().toISOString()
    };

    invoice.paymentHistory.push(paymentEntry);

    // Save normalized invoice
    const saved = await invoiceEngine.saveInvoice({
      ...invoice,
      paymentMethod: paymentMethod || invoice.paymentMethod || 'Cash'
    });

    // Structured Audit Log
    try {
      logAudit(
        'payment_recorded', 
        'invoice', 
        invoice.id, 
        { oldAmountPaid: fin.amountPaid }, 
        { 
          paymentId: paymentEntry.id,
          amount: paymentAmount, 
          source, 
          allocatedToOldDue: allocation.allocatedToOldDue,
          allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
          workspaceId: invoice.workspaceId 
        }
      );
    } catch (e) {
      console.warn('[AUDIT] Failed to log payment audit:', e);
    }

    // Mirror payment into Internal Bank ledger (idempotent, failure-isolated)
    try {
      const { bankEngine } = await import('./bankEngine.js');
      await bankEngine.autoPostPayment({
        id: paymentEntry.id,
        amount: paymentEntry.amount,
        method: paymentEntry.method,
        date: paymentEntry.date,
        invoiceId: saved.id,
        invoiceNumber: saved.invoiceNumber,
        customerId: paymentEntry.customerId,
        customerName: paymentEntry.customerName,
        note: paymentEntry.note
      });
    } catch (e) {
      console.warn('[BANK] auto-post payment skipped (non-blocking):', e);
    }

    // Dispatch Reactive App-Wide Events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: saved }));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: saved } }));
    }

    return {
      success: true,
      invoice: saved,
      payment: paymentEntry,
      allocation
    };
  }

  /**
   * CANONICAL STAFF / SALARY / ADVANCE RECORDING
   */
  async recordStaffPayment({
    staffId,
    staffName = '',
    amount,
    paymentType = 'Salary / Wages', // 'Salary / Wages' | 'Staff Advance' | 'Staff Payment'
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Merchant'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Staff payout amount must be greater than zero.');
    }
    const payoutAmount = roundTo2(rawAmt);

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: payoutAmount,
      category: paymentType,
      title: `${paymentType}: ${staffName || 'Staff Member'}`,
      account: paymentMethod || 'Cash',
      staffId: staffId || null,
      staffName: staffName || '',
      note: (note || `${paymentType} recorded in Money & Payment Center`).trim(),
      source: paymentType === 'Staff Advance' ? 'staff_advance' : 'staff_payout',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('staff_payment_recorded', 'staff', staffId || 'unknown', null, {
        amount: payoutAmount,
        paymentType,
        paymentMethod,
        staffName,
        transactionId: transaction.id
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to log staff payment:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro_staff_updated', { detail: { staffId, amount: payoutAmount } }));
    }

    return {
      success: true,
      transaction,
      staffId,
      amount: payoutAmount,
      paymentType
    };
  }

  /**
   * CANONICAL VENDOR / OUTSOURCE PAYMENT RECORDING
   */
  async recordVendorPayment({
    vendorId,
    vendorName = '',
    jobId = null,
    jobCode = '',
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Merchant'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Vendor payout amount must be greater than zero.');
    }
    const payoutAmount = roundTo2(rawAmt);

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    let outsourceRecord = null;
    try {
      const { recordOutsourcePayment } = await import('./outsourceEngine.js');
      if (typeof recordOutsourcePayment === 'function' && vendorId) {
        outsourceRecord = await recordOutsourcePayment({
          vendorId,
          vendorName,
          jobId,
          jobCode,
          amount: payoutAmount,
          paymentMethod,
          reference,
          note,
          date: effectiveDate,
          syncWithBank: false // We will handle bank post directly to ensure canonical schema
        });
      }
    } catch (e) {
      console.warn('[OUTSOURCE] engine record notice:', e);
    }

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: payoutAmount,
      category: 'Vendor Payment',
      title: `Vendor Payout: ${vendorName || 'Outsource'}${jobCode ? ` (${jobCode})` : ''}`,
      account: paymentMethod || 'Cash',
      vendorId: vendorId || null,
      vendorName: vendorName || '',
      note: (note || `Vendor payout for ${vendorName || 'specialist'}`).trim(),
      source: 'outsource_payout',
      sourceRefId: outsourceRecord?.id || null,
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('vendor_payment_recorded', 'vendor', vendorId || 'unknown', null, {
        amount: payoutAmount,
        vendorName,
        jobId,
        paymentMethod,
        transactionId: transaction.id
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to log vendor payment:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }

    return {
      success: true,
      transaction,
      outsourceRecord,
      amount: payoutAmount
    };
  }

  /**
   * CANONICAL CUSTOMER REFUND RECORDING
   */
  async recordCustomerRefund({
    customerId = null,
    customerName = '',
    invoiceId = null,
    invoiceNumber = '',
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    reason = '',
    workspaceId = null,
    createdBy = 'Merchant'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Refund amount must be greater than zero.');
    }
    const refundAmount = roundTo2(rawAmt);

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: refundAmount,
      category: 'Customer Refund',
      title: `Refund: ${customerName || 'Customer'}${invoiceNumber ? ` (${invoiceNumber})` : ''}`,
      account: paymentMethod || 'Cash',
      customerId: customerId || null,
      customerName: customerName || '',
      invoiceId: invoiceId || null,
      invoiceNumber: invoiceNumber || '',
      note: (note || reason || `Customer refund for ${customerName || 'Customer'}`).trim(),
      source: 'customer_refund',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('customer_refund_recorded', 'customer', customerId || 'unknown', null, {
        amount: refundAmount,
        customerName,
        invoiceId,
        invoiceNumber,
        paymentMethod,
        reason: reason || note,
        transactionId: transaction.id
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to log customer refund:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:customer-refund', { detail: { customerId, amount: refundAmount } }));
    }

    return {
      success: true,
      transaction,
      amount: refundAmount
    };
  }

  /**
   * CANONICAL EXPENSE / OPERATIONAL COST RECORDING
   */
  async recordExpenseTransaction({
    title = 'Expense',
    category = 'Expense',
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Merchant'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    const expenseAmount = roundTo2(rawAmt);

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: expenseAmount,
      category: category || 'Expense',
      title: title || 'Expense',
      account: paymentMethod || 'Cash',
      note: (note || `${category} recorded`).trim(),
      source: 'expense_entry',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('expense_recorded', 'expense', transaction.id, null, {
        amount: expenseAmount,
        title,
        category,
        paymentMethod
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to log expense audit:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro_expense_updated', { detail: transaction }));
    }

    return {
      success: true,
      transaction,
      amount: expenseAmount
    };
  }

  /**
   * CANONICAL GENERAL MONEY TRANSACTION (OTHER MONEY IN / OUT)
   */
  async recordGeneralMoneyTransaction({
    type = 'moneyIn', // 'moneyIn' | 'moneyOut'
    category = 'Other Income',
    title = '',
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    customerId = null,
    customerName = '',
    staffId = null,
    staffName = '',
    vendorId = null,
    vendorName = '',
    workspaceId = null,
    createdBy = 'Merchant'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }
    const txAmount = roundTo2(rawAmt);

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const normType = type === 'moneyOut' || type === 'OUT' ? 'moneyOut' : 'moneyIn';

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: normType,
      amountRupees: txAmount,
      category: category || (normType === 'moneyIn' ? 'Other Income' : 'Other Expense'),
      title: title || (normType === 'moneyIn' ? 'Money In' : 'Money Out'),
      account: paymentMethod || 'Cash',
      customerId: customerId || null,
      customerName: customerName || '',
      staffId: staffId || null,
      staffName: staffName || '',
      vendorId: vendorId || null,
      vendorName: vendorName || '',
      note: (note || '').trim(),
      source: 'general_transaction',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('general_transaction_recorded', 'bankLedger', transaction.id, null, {
        type: normType,
        amount: txAmount,
        category,
        paymentMethod
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to log general transaction:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }

    return {
      success: true,
      transaction,
      amount: txAmount
    };
  }

  /**
   * CANONICAL OWNER SALARY RECORDING
   * Allocates business/website funds to My Salary.
   */
  async recordOwnerSalary({
    amount,
    salaryPeriod = '',
    paymentMethod = 'Bank Transfer',
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Owner'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Salary amount must be greater than zero.');
    }
    const salaryAmount = roundTo2(rawAmt);
    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const periodNote = salaryPeriod ? ` [Period: ${salaryPeriod}]` : '';
    const fullNote = `${(note || 'Owner salary allocated from business income').trim()}${periodNote}`.trim();

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: salaryAmount,
      category: 'My Salary',
      title: 'Owner Salary Allocation',
      account: paymentMethod || 'Bank Transfer',
      sourceLocation: 'website_income',
      destinationLocation: 'owner_personal',
      salaryPeriod: salaryPeriod || '',
      note: fullNote,
      source: 'owner_salary',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('owner_salary_recorded', 'owner_salary', transaction.id, null, {
        amount: salaryAmount,
        paymentMethod,
        salaryPeriod,
        date: effectiveDate
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return { success: true, transaction, amount: salaryAmount, salaryPeriod };
  }

  /**
   * SALARY HISTORY EXTRACTOR & FILTER
   */
  getSalaryHistory({ bankLedger = [], workspaceId = null, timeframe = 'all', customStart = null, customEnd = null } = {}) {
    const scopedLedger = Array.isArray(bankLedger)
      ? bankLedger.filter(b => !b.reversed && (!workspaceId || !b.workspaceId || b.workspaceId === workspaceId))
      : [];

    const salaryTx = scopedLedger.filter(b => {
      const cat = (b.category || '').toLowerCase();
      const src = (b.source || '').toLowerCase();
      return cat === 'my salary' || src === 'owner_salary';
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalSalary = 0;
    let thisMonthSalary = 0;
    let lastMonthSalary = 0;
    let thisYearSalary = 0;

    const records = [];

    salaryTx.forEach(b => {
      const amt = roundTo2(b.amountRupees !== undefined ? b.amountRupees : (b.amountPaise ? b.amountPaise / 100 : 0));
      if (amt <= 0) return;

      totalSalary += amt;

      const d = new Date(b.date || b.createdAt || 0);
      const m = d.getMonth();
      const y = d.getFullYear();

      if (y === currentYear) {
        thisYearSalary += amt;
        if (m === currentMonth) {
          thisMonthSalary += amt;
        }
      }
      
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      if (m === lastMonth && y === lastMonthYear) {
        lastMonthSalary += amt;
      }

      // Timeframe check for record list
      let match = true;
      if (timeframe === 'this_month') {
        match = (m === currentMonth && y === currentYear);
      } else if (timeframe === 'last_month') {
        match = (m === lastMonth && y === lastMonthYear);
      } else if (timeframe === 'this_year') {
        match = (y === currentYear);
      } else if (timeframe === 'custom' && customStart && customEnd) {
        const start = new Date(customStart).getTime();
        const end = new Date(customEnd).getTime();
        const t = d.getTime();
        match = (t >= start && t <= end);
      }

      if (match) {
        records.push({
          id: b.id,
          amount: amt,
          date: b.date || b.createdAt,
          paymentMethod: b.account || 'Bank Transfer',
          reference: b.reference || '',
          salaryPeriod: b.salaryPeriod || '',
          note: b.note || ''
        });
      }
    });

    records.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return {
      totalSalary: roundTo2(totalSalary),
      thisMonthSalary: roundTo2(thisMonthSalary),
      lastMonthSalary: roundTo2(lastMonthSalary),
      thisYearSalary: roundTo2(thisYearSalary),
      records
    };
  }

  /**
   * CANONICAL WITHDRAWAL (WEBSITE INCOME -> PERSONAL POSSESSION)
   */
  async recordWithdrawal({
    amount,
    destination = 'my_cash', // 'my_cash' | 'phonepe'
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Owner'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Withdrawal amount must be greater than zero.');
    }
    const withdrawAmount = roundTo2(rawAmt);
    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const destName = destination === 'phonepe' ? 'PhonePe' : 'My Cash';

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: withdrawAmount,
      category: 'Withdrawal',
      title: `Withdrawal: Website Income → ${destName}`,
      account: paymentMethod || (destination === 'phonepe' ? 'PhonePe' : 'Cash'),
      sourceLocation: 'website_income',
      destinationLocation: destination || 'my_cash',
      note: (note || `Withdrawal of business funds to ${destName}`).trim(),
      source: 'owner_withdrawal',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('withdrawal_recorded', 'withdrawal', transaction.id, null, {
        amount: withdrawAmount,
        destination,
        date: effectiveDate
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return { success: true, transaction, amount: withdrawAmount, destination };
  }

  /**
   * CANONICAL MONEY TRANSFER (BETWEEN PERSONAL LOCATIONS / DREAMS)
   */
  async recordMoneyTransfer({
    fromLocation = 'my_cash', // 'my_cash' | 'phonepe' | 'my_dream' | 'website_income'
    toLocation = 'phonepe',   // 'my_cash' | 'phonepe' | 'my_dream'
    amount,
    dreamId = null,
    dreamName = null,
    paymentDate = null,
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Owner'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }
    if (fromLocation === toLocation) {
      throw new Error('Source and destination locations cannot be the same.');
    }
    const transferAmount = roundTo2(rawAmt);
    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const locLabels = {
      website_income: 'Website Income',
      my_cash: 'My Cash',
      phonepe: 'PhonePe',
      my_dream: dreamName ? `My Dream (${dreamName})` : 'My Dream'
    };

    const fromLabel = locLabels[fromLocation] || fromLocation;
    const toLabel = locLabels[toLocation] || toLocation;

    let category = 'Money Transfer';
    if (toLocation === 'my_dream') {
      category = 'Transfer to My Dream';
    } else if (fromLocation === 'my_dream') {
      category = 'Return from Dream';
    } else if (toLocation === 'phonepe') {
      category = 'Transfer to PhonePe';
    } else if (toLocation === 'my_cash') {
      category = 'Transfer to My Cash';
    }

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      isTransfer: true,
      amountRupees: transferAmount,
      category,
      title: `Transfer: ${fromLabel} → ${toLabel}`,
      account: fromLocation === 'phonepe' ? 'PhonePe' : 'Cash',
      sourceLocation: fromLocation,
      destinationLocation: toLocation,
      dreamId: dreamId || null,
      dreamName: dreamName || '',
      note: (note || `Internal transfer from ${fromLabel} to ${toLabel}`).trim(),
      source: 'money_transfer',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      let auditEvent = 'transfer_recorded';
      if (fromLocation === 'my_cash' && toLocation === 'phonepe') auditEvent = 'cash_transfer';
      else if (fromLocation === 'phonepe' && toLocation === 'my_cash') auditEvent = 'phonepe_transfer';
      else if (toLocation === 'my_dream') auditEvent = 'dream_transfer_in';
      else if (fromLocation === 'my_dream') auditEvent = 'dream_transfer_out';

      logAudit(auditEvent, 'transfer', transaction.id, null, {
        amount: transferAmount,
        fromLocation,
        toLocation,
        dreamId,
        date: effectiveDate
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return { success: true, transaction, amount: transferAmount, fromLocation, toLocation };
  }

  /**
   * CANONICAL PERSONAL EXPENSE RECORDING (MY CASH / PHONEPE)
   */
  async recordPersonalExpense({
    location = 'my_cash', // 'my_cash' | 'phonepe'
    category = 'Personal Expense', // 'Shopping' | 'Food' | 'Travel' | 'Personal' | ...
    title = '',
    amount,
    paymentDate = null,
    reason = '',
    reference = '',
    note = '',
    workspaceId = null,
    createdBy = 'Owner'
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    const expenseAmount = roundTo2(rawAmt);
    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const locLabel = location === 'phonepe' ? 'PhonePe' : 'My Cash';
    const displayCategory = category || 'Personal Expense';
    const displayTitle = title || reason || `${displayCategory} (${locLabel})`;

    const { bankEngine } = await import('./bankEngine.js');
    const transaction = await bankEngine.addTransaction({
      type: 'moneyOut',
      amountRupees: expenseAmount,
      category: displayCategory,
      title: displayTitle,
      account: location === 'phonepe' ? 'PhonePe' : 'Cash',
      sourceLocation: location,
      destinationLocation: 'expense',
      note: (note || reason || `${displayCategory} paid from ${locLabel}`).trim(),
      source: 'personal_expense',
      reference: reference || '',
      date: effectiveDate
    });

    try {
      logAudit('expense_recorded', 'personal_expense', transaction.id, null, {
        amount: expenseAmount,
        location,
        category: displayCategory,
        reason,
        date: effectiveDate
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return { success: true, transaction, amount: expenseAmount, location };
  }

  getDreamGoals(workspaceId = null) {
    const key = `billqyro_dream_goals_${workspaceId || 'default'}`;
    if (!this._memoryDreamGoals) this._memoryDreamGoals = {};

    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    if (this._memoryDreamGoals[key] && Array.isArray(this._memoryDreamGoals[key])) {
      return this._memoryDreamGoals[key];
    }

    const defaultGoals = [
      { id: 'dream_laptop', dreamId: 'dream_laptop', dreamName: 'New Laptop', name: 'New Laptop', targetAmount: 50000, targetDate: '2027-12-31', status: 'ACTIVE', category: 'Technology', icon: 'Laptop', note: 'Work workstation upgrade' },
      { id: 'dream_car', dreamId: 'dream_car', dreamName: 'New Car', name: 'New Car', targetAmount: 500000, targetDate: '2028-12-31', status: 'ACTIVE', category: 'Vehicle', icon: 'Car', note: 'Family vehicle' }
    ];
    this._memoryDreamGoals[key] = defaultGoals;
    return defaultGoals;
  }

  saveDreamGoal(goalData, workspaceId = null) {
    const key = `billqyro_dream_goals_${workspaceId || 'default'}`;
    if (!this._memoryDreamGoals) this._memoryDreamGoals = {};

    const goals = [...this.getDreamGoals(workspaceId)];
    const id = goalData.id || goalData.dreamId || `dream_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const dreamName = goalData.dreamName || goalData.name || 'Dream Goal';
    const isNew = !goals.some(g => g.id === id || g.dreamId === id);

    const newGoal = {
      id,
      dreamId: id,
      dreamName,
      name: dreamName,
      targetAmount: roundTo2(Number(goalData.targetAmount) || 0),
      targetDate: goalData.targetDate || '',
      description: goalData.description || goalData.note || '',
      note: goalData.note || goalData.description || '',
      status: goalData.status || 'ACTIVE',
      category: goalData.category || 'General',
      icon: goalData.icon || 'Star',
      workspaceId: workspaceId || null,
      updatedAt: new Date().toISOString(),
      createdAt: goalData.createdAt || new Date().toISOString()
    };

    const idx = goals.findIndex(g => g.id === id || g.dreamId === id);
    if (idx >= 0) {
      goals[idx] = { ...goals[idx], ...newGoal };
    } else {
      goals.push(newGoal);
    }

    this._memoryDreamGoals[key] = goals;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(goals));
      } catch (e) {}
    }

    try {
      logAudit(isNew ? 'dream_created' : 'dream_updated', 'dream', id, null, {
        dreamName,
        targetAmount: newGoal.targetAmount
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return newGoal;
  }

  updateDreamStatus(dreamId, status, workspaceId = null) {
    const key = `billqyro_dream_goals_${workspaceId || 'default'}`;
    const goals = [...this.getDreamGoals(workspaceId)];
    const idx = goals.findIndex(g => g.id === dreamId || g.dreamId === dreamId);
    if (idx < 0) return null;

    goals[idx] = {
      ...goals[idx],
      status,
      updatedAt: new Date().toISOString()
    };

    if (!this._memoryDreamGoals) this._memoryDreamGoals = {};
    this._memoryDreamGoals[key] = goals;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(goals));
      } catch (e) {}
    }

    try {
      let event = 'dream_updated';
      if (status === 'COMPLETED') event = 'dream_completed';
      if (status === 'ARCHIVED') event = 'dream_archived';
      logAudit(event, 'dream', dreamId, null, { status });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
    }
    return goals[idx];
  }

  /**
   * CANONICAL FINANCIAL BUCKETS CALCULATION
   * Computes exact ledger balances for Website Income, My Cash, PhonePe, My Dream, and My Salary without double-counting.
   */
  calculateFinancialBuckets({ invoices = [], bankLedger = [], workspaceId = null } = {}) {
    const scopedInvoices = workspaceId ? invoices.filter(inv => !inv.workspaceId || inv.workspaceId === workspaceId) : invoices;
    const scopedBankLedger = Array.isArray(bankLedger) 
      ? bankLedger.filter(b => !b.reversed && (!workspaceId || !b.workspaceId || b.workspaceId === workspaceId))
      : [];

    let totalCustomerPayments = 0;
    const seenInvoiceTxIds = new Set();
    scopedInvoices.forEach(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      const history = Array.isArray(inv.paymentHistory) ? inv.paymentHistory : [];
      history.forEach(p => {
        const amt = roundTo2(parseFloat(p.amount) || 0);
        if (amt > 0) {
          totalCustomerPayments += amt;
          if (p.id) seenInvoiceTxIds.add(p.id);
          if (p.proofId) seenInvoiceTxIds.add(p.proofId);
        }
      });
    });

    let otherBusinessIncome = 0;
    let businessExpenses = 0;
    let staffPayouts = 0;
    let vendorPayouts = 0;
    let customerRefunds = 0;
    let ownerSalaryTotal = 0;
    let websiteWithdrawals = 0;

    let myCashInflow = 0;
    let myCashOutflow = 0;
    let myCashExpenses = 0;

    let phonePeInflow = 0;
    let phonePeOutflow = 0;
    let phonePeExpenses = 0;

    let dreamInflow = 0;
    let dreamOutflow = 0;
    const dreamAllocations = {};
    const dreamTxHistory = {}; // dreamId -> Array of transactions

    scopedBankLedger.forEach(b => {
      if (b.source === 'invoice_payment' && (seenInvoiceTxIds.has(b.sourceRefId) || seenInvoiceTxIds.has(b.id))) {
        return;
      }

      const amt = roundTo2(b.amountRupees !== undefined ? b.amountRupees : (b.amountPaise ? b.amountPaise / 100 : (b.amount !== undefined ? b.amount : 0)));
      if (amt <= 0) return;

      const catLower = (b.category || '').toLowerCase();
      const srcLower = (b.source || '').toLowerCase();
      const srcLoc = (b.sourceLocation || '').toLowerCase();
      const destLoc = (b.destinationLocation || '').toLowerCase();

      // Internal Transfers
      if (b.isTransfer || catLower.includes('transfer') || srcLower === 'money_transfer' || srcLower === 'dream_transfer') {
        if (srcLoc === 'website_income') {
          websiteWithdrawals += amt;
        } else if (srcLoc === 'my_cash') {
          myCashOutflow += amt;
        } else if (srcLoc === 'phonepe') {
          phonePeOutflow += amt;
        } else if (srcLoc === 'my_dream') {
          dreamOutflow += amt;
          if (b.dreamId) {
            dreamAllocations[b.dreamId] = (dreamAllocations[b.dreamId] || 0) - amt;
            if (!dreamTxHistory[b.dreamId]) dreamTxHistory[b.dreamId] = [];
            dreamTxHistory[b.dreamId].push(b);
          }
        }

        if (destLoc === 'my_cash') {
          myCashInflow += amt;
        } else if (destLoc === 'phonepe') {
          phonePeInflow += amt;
        } else if (destLoc === 'my_dream') {
          dreamInflow += amt;
          if (b.dreamId) {
            dreamAllocations[b.dreamId] = (dreamAllocations[b.dreamId] || 0) + amt;
            if (!dreamTxHistory[b.dreamId]) dreamTxHistory[b.dreamId] = [];
            dreamTxHistory[b.dreamId].push(b);
          }
        }
        return;
      }

      // Owner Withdrawal
      if (catLower === 'withdrawal' || srcLower === 'owner_withdrawal') {
        websiteWithdrawals += amt;
        if (destLoc === 'phonepe') {
          phonePeInflow += amt;
        } else {
          myCashInflow += amt;
        }
        return;
      }

      // Owner Salary
      if (catLower === 'my salary' || srcLower === 'owner_salary') {
        ownerSalaryTotal += amt;
        return;
      }

      // Personal Expenses
      if (srcLoc === 'my_cash' && (destLoc === 'expense' || srcLower === 'personal_expense')) {
        myCashExpenses += amt;
        return;
      }
      if (srcLoc === 'phonepe' && (destLoc === 'expense' || srcLower === 'personal_expense')) {
        phonePeExpenses += amt;
        return;
      }

      // Business Outflows
      if (catLower.includes('salary') || catLower.includes('wages') || srcLower === 'staff_payout' || catLower.includes('staff advance')) {
        staffPayouts += amt;
      } else if (catLower.includes('vendor') || catLower.includes('outsource') || srcLower === 'outsource_payout') {
        vendorPayouts += amt;
      } else if (catLower.includes('refund') || srcLower === 'customer_refund') {
        customerRefunds += amt;
      } else if (catLower.includes('expense') || srcLower === 'expense_entry' || catLower.includes('supplies') || catLower.includes('utilities') || catLower.includes('rent')) {
        businessExpenses += amt;
      } else if (b.type === 'moneyIn') {
        otherBusinessIncome += amt;
      } else {
        businessExpenses += amt;
      }
    });

    const totalWebsiteRevenue = roundTo2(totalCustomerPayments + otherBusinessIncome);
    const totalWebsiteOutflows = roundTo2(businessExpenses + staffPayouts + vendorPayouts + customerRefunds + websiteWithdrawals + ownerSalaryTotal);
    const websiteIncomeAvailable = roundTo2(Math.max(0, totalWebsiteRevenue - totalWebsiteOutflows));

    const myCashBalance = roundTo2(Math.max(0, myCashInflow - myCashOutflow - myCashExpenses));
    const phonePeBalance = roundTo2(Math.max(0, phonePeInflow - phonePeOutflow - phonePeExpenses));
    const myDreamBalance = roundTo2(Math.max(0, dreamInflow - dreamOutflow));
    const personalAvailableTotal = roundTo2(myCashBalance + phonePeBalance + myDreamBalance);

    const dreamGoals = this.getDreamGoals(workspaceId).map(d => {
      const saved = roundTo2(Math.max(0, dreamAllocations[d.id || d.dreamId] || 0));
      const target = Number(d.targetAmount) || 0;
      const progress = target > 0 ? Math.min(100, Math.max(0, Math.round((saved / target) * 100))) : 0;
      const remaining = target > 0 ? Math.max(0, roundTo2(target - saved)) : 0;
      const isAutoCompleted = target > 0 && saved >= target;
      const status = d.status === 'ARCHIVED' || d.status === 'PAUSED' ? d.status : (isAutoCompleted ? 'COMPLETED' : (d.status || 'ACTIVE'));

      return {
        ...d,
        dreamId: d.id || d.dreamId,
        dreamName: d.dreamName || d.name,
        name: d.dreamName || d.name,
        savedAmount: saved,
        progressPercentage: isNaN(progress) ? 0 : progress,
        remainingAmount: isNaN(remaining) ? 0 : remaining,
        status,
        transactionHistory: dreamTxHistory[d.id || d.dreamId] || []
      };
    });

    return {
      websiteIncomeAvailable,
      totalWebsiteRevenue,
      totalWebsiteOutflows,
      myCashBalance,
      myCashExpenses,
      phonePeBalance,
      phonePeExpenses,
      myDreamBalance,
      mySalaryTotal: roundTo2(ownerSalaryTotal),
      personalAvailableTotal,
      websiteWithdrawals: roundTo2(websiteWithdrawals),
      dreamGoals
    };
  }

  async addPayment(invoiceId, paymentData = {}) {
    return (await this.recordCustomerPayment({
      invoiceId,
      amount: paymentData.amount,
      paymentMethod: paymentData.method || paymentData.paymentMethod || 'Cash',
      paymentDate: paymentData.date || null,
      reference: paymentData.transactionId || paymentData.reference || '',
      note: paymentData.notes || paymentData.note || '',
      source: paymentData.source || 'manual_collection'
    })).invoice;
  }

  async removePayment(invoiceId, paymentId) {
    const invoices = await invoiceEngine.getInvoices(true);
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;
    invoice.paymentHistory = Array.isArray(invoice.paymentHistory) 
      ? invoice.paymentHistory.filter(p => p.id !== paymentId && p.proofId !== paymentId) 
      : [];
    if (invoice.payments) invoice.payments = invoice.payments.filter(p => p.id !== paymentId);
    const totalPaid = Math.round(invoice.paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100;
    invoice.amountPaid = totalPaid;
    invoice.paidAmount = totalPaid;
    invoice.paymentStatus = getInvoicePaymentStatus(invoice);
    invoice.updatedAt = new Date().toISOString();
    const saved = await invoiceEngine.saveInvoice(invoice);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: saved }));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: saved } }));
    }
    return saved;
  }

  calculateTotalPaid(payments = []) { 
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0); 
  }

  async recordPaymentProof(invoiceId, proofData) {
    return await this.addPayment(invoiceId, { 
      amount: proofData.amount, 
      method: proofData.method || 'Transfer', 
      date: new Date().toISOString(), 
      proofUrl: proofData.url, 
      transactionId: proofData.transactionId || '' 
    });
  }

  getAllTransactions(invoices = [], workspaceId = null) {
    return this.getPaymentHistory(invoices, workspaceId);
  }

  /**
   * CANONICAL UNIFIED TRANSACTION HISTORY
   * Merges all customer payments, staff salaries/advances, vendor payouts, refunds, and bank entries into a single normalized stream.
   */
  getUnifiedTransactionHistory({ invoices = [], bankLedger = [], workspaceId = null } = {}) {
    const list = [];
    const seenTxIds = new Set();

    // 1. Ingest Customer Payments from Invoices
    const scopedInvoices = workspaceId ? invoices.filter(inv => !inv.workspaceId || inv.workspaceId === workspaceId) : invoices;
    scopedInvoices.forEach(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      const history = Array.isArray(inv.paymentHistory) ? inv.paymentHistory : [];
      history.forEach(p => {
        const amt = roundTo2(parseFloat(p.amount) || 0);
        if (amt > 0) {
          const txId = p.id || `pmt_${inv.id}_${p.date}`;
          seenTxIds.add(txId);
          if (p.proofId) seenTxIds.add(p.proofId);

          list.push({
            id: txId,
            type: 'customer_payment',
            direction: 'IN',
            category: 'Sale / Invoice Payment',
            amount: amt,
            paymentMethod: p.method || p.paymentMethod || 'Cash',
            date: p.date || inv.date || inv.createdAt,
            reference: p.transactionId || p.reference || '',
            note: p.note || p.notes || '',
            source: p.source || 'manual_collection',
            allocatedToOldDue: roundTo2(parseFloat(p.allocatedToOldDue) || 0),
            allocatedToCurrentInvoice: roundTo2(parseFloat(p.allocatedToCurrentInvoice) || amt),
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.slice(0, 4)}`,
            customerId: p.customerId || inv.customer?.id || inv.customerId || null,
            customerName: p.customerName || inv.customer?.name || inv.customerName || 'Walk-in Customer',
            customerPhone: inv.customer?.phone || inv.customerPhone || '',
            staffId: null,
            staffName: '',
            vendorId: null,
            vendorName: '',
            status: 'Confirmed',
            workspaceId: inv.workspaceId || null,
            createdAt: p.createdAt || p.date || new Date().toISOString()
          });
        }
      });
    });

    // 2. Ingest Bank Ledger Transactions (deduplicating mirrored invoice payments)
    const scopedBankLedger = Array.isArray(bankLedger) ? bankLedger : [];
    scopedBankLedger.forEach(b => {
      if (b.reversed) return;
      if (workspaceId && b.workspaceId && b.workspaceId !== workspaceId) return;

      // Avoid double-counting invoice auto-posted payments
      if (b.source === 'invoice_payment' && (seenTxIds.has(b.sourceRefId) || seenTxIds.has(b.id))) {
        return;
      }

      const amtRupees = roundTo2(b.amountRupees !== undefined ? b.amountRupees : (b.amountPaise ? b.amountPaise / 100 : (b.amount !== undefined ? b.amount : 0)));
      if (amtRupees <= 0) return;

      const catLower = (b.category || '').toLowerCase();
      const srcLower = (b.source || '').toLowerCase();
      const srcLoc = b.sourceLocation || (b.type === 'moneyIn' ? 'website_income' : (b.account === 'PhonePe' ? 'phonepe' : 'my_cash'));
      const destLoc = b.destinationLocation || (b.isTransfer ? (b.account === 'PhonePe' ? 'my_cash' : 'phonepe') : (b.type === 'moneyIn' ? 'website_income' : 'expense'));

      let txType = 'general';
      let isTransfer = false;
      let displayDirection = b.type === 'moneyIn' ? 'IN' : 'OUT';

      if (b.isTransfer || catLower.includes('transfer') || srcLower === 'money_transfer' || srcLower === 'dream_transfer') {
        txType = 'transfer';
        isTransfer = true;
        displayDirection = 'TRANSFER';
      } else if (catLower === 'withdrawal' || srcLower === 'owner_withdrawal') {
        txType = 'withdrawal';
        displayDirection = 'WITHDRAW';
      } else if (catLower === 'my salary' || srcLower === 'owner_salary') {
        txType = 'owner_salary';
        displayDirection = 'OUT';
      } else if (srcLower === 'personal_expense' || (b.sourceLocation === 'my_cash' || b.sourceLocation === 'phonepe')) {
        txType = 'personal_expense';
        displayDirection = 'OUT';
      } else if (catLower.includes('salary') || catLower.includes('wages') || (srcLower === 'staff_payout' && !catLower.includes('advance'))) {
        txType = 'staff_salary';
      } else if (catLower.includes('staff advance') || srcLower === 'staff_advance') {
        txType = 'staff_advance';
      } else if (catLower.includes('staff payment') || srcLower === 'staff_payout') {
        txType = 'other_staff_payment';
      } else if (catLower.includes('vendor') || catLower.includes('outsource') || srcLower === 'outsource_payout') {
        txType = 'vendor_payment';
      } else if (catLower.includes('refund') || srcLower === 'customer_refund') {
        txType = 'customer_refund';
      } else if (catLower.includes('expense') || srcLower === 'expense_entry' || catLower.includes('supplies') || catLower.includes('utilities') || catLower.includes('rent')) {
        txType = 'expense';
      } else if (b.type === 'moneyIn') {
        txType = 'money_in';
      } else {
        txType = 'money_out';
      }

      list.push({
        id: b.id || `bank_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: txType,
        direction: displayDirection,
        isTransfer,
        sourceLocation: srcLoc,
        destinationLocation: destLoc,
        dreamId: b.dreamId || null,
        dreamName: b.dreamName || '',
        category: b.category || (b.type === 'moneyIn' ? 'Other Income' : 'Other Expense'),
        title: b.title || '',
        amount: amtRupees,
        paymentMethod: b.account || 'Cash',
        date: b.date || b.createdAt || new Date().toISOString(),
        reference: b.reference || b.sourceRefId || '',
        note: b.note || '',
        source: b.source || 'bank_ledger',
        customerId: b.customerId || null,
        customerName: b.customerName || '',
        customerPhone: '',
        invoiceId: b.invoiceId || null,
        invoiceNumber: b.invoiceNumber || '',
        staffId: b.staffId || null,
        staffName: b.staffName || '',
        vendorId: b.vendorId || null,
        vendorName: b.vendorName || '',
        status: 'Confirmed',
        workspaceId: b.workspaceId || null,
        createdAt: b.createdAt || b.date || new Date().toISOString()
      });
    });

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  /**
   * CANONICAL PAYMENT HISTORY EXTRACTOR (Backwards compatible)
   */
  getPaymentHistory(invoices = [], workspaceId = null) {
    return this.getUnifiedTransactionHistory({ invoices, workspaceId }).filter(t => t.type === 'customer_payment');
  }

  async submitPlatformPaymentProof(proofData) { 
    return await dbSubmitPlatformPaymentProof(proofData); 
  }

  /**
   * APPROVE PAYMENT PROOF
   * Standardized to use the canonical recordCustomerPayment workflow.
   */
  async approvePaymentProof(payment, reviewer = 'Merchant') {
    if (!firebaseReady || !db) {
      // In offline/mock mode, record directly to local database
      if (payment.invoiceId) {
        return await this.recordCustomerPayment({
          invoiceId: payment.invoiceId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'UPI',
          reference: payment.transactionId || '',
          note: payment.notes || payment.note || 'Payment proof approved',
          source: 'live_link_approved',
          proofId: payment.id,
          createdBy: reviewer
        });
      }
      return;
    }

    const proofRef = doc(db, 'payment_proofs', payment.id);
    const paymentAmount = Math.max(0, Math.round((parseFloat(payment.amount) || 0) * 100) / 100);
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) throw new Error('Payment proof not found.');
      const proofData = proofDoc.data();
      if (proofData.status === 'approved') throw new Error('This payment has already been approved.');
      if (proofData.status === 'rejected') throw new Error('This payment has already been rejected.');
      transaction.update(proofRef, { 
        status: 'approved', 
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      });

      if (!payment.invoiceId) return;
      const localInvoices = await invoiceEngine.getInvoices(true);
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      if (!existingInvoice?.publicToken) return;
      const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
      const publicDoc = await transaction.get(publicInvRef);
      if (!publicDoc.exists()) return;

      const publicData = publicDoc.data();
      const history = Array.isArray(publicData.paymentHistory) ? [...publicData.paymentHistory] : [];
      const alreadyRecorded = history.some(p => p.proofId === payment.id || p.id === payment.id || p.id === `pmt_${payment.id}`);
      if (!alreadyRecorded) {
        history.push({ 
          id: `pmt_${payment.id}`, 
          proofId: payment.id, 
          amount: paymentAmount, 
          method: payment.paymentMethod || 'Proof Approval', 
          transactionId: payment.transactionId || '', 
          date: new Date().toISOString(), 
          note: payment.notes || payment.note || 'Payment proof approved', 
          source: 'live_link_approved' 
        });
      }

      const canonical = calculateCanonicalInvoiceFinancials({ ...publicData, paymentHistory: history });
      transaction.update(publicInvRef, { 
        paymentHistory: history, 
        amountPaid: canonical.amountPaid, 
        paidAmount: canonical.amountPaid, 
        balanceDue: canonical.balanceDue, 
        paymentStatus: canonical.paymentStatus, 
        status: canonical.paymentStatus, 
        updatedAt: new Date().toISOString() 
      });
    });

    if (payment.invoiceId) {
      await this.recordCustomerPayment({
        invoiceId: payment.invoiceId,
        amount: paymentAmount,
        paymentMethod: payment.paymentMethod || 'UPI',
        reference: payment.transactionId || '',
        note: payment.notes || payment.note || 'Payment proof approved',
        source: 'live_link_approved',
        proofId: payment.id,
        createdBy: reviewer
      });
    }
  }

  /**
   * REJECT PAYMENT PROOF
   */
  async rejectPaymentProof(payment, reason = '') {
    if (!firebaseReady || !db) {
      logAudit('payment_request_rejected', 'payment_proof', payment.id, {}, { reason });
      return;
    }
    const proofRef = doc(db, 'payment_proofs', payment.id);
    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) throw new Error('Payment proof not found.');
      const proofData = proofDoc.data();
      if (proofData.status === 'rejected') throw new Error('This payment has already been rejected.');
      if (proofData.status === 'approved') throw new Error('This payment has already been approved and cannot be rejected.');
      transaction.update(proofRef, { 
        status: 'rejected', 
        rejectionReason: reason || '',
        updatedAt: new Date().toISOString() 
      });
    });
    logAudit('payment_request_rejected', 'payment_proof', payment.id, {}, { reason });
  }

  getUnifiedHistory(params) {
    return this.getUnifiedTransactionHistory(params);
  }

  async getUserPaymentProofs(userId) { return await dbGetUserPaymentProofs(userId); }
  async getUserRevenueState(userId, invoices, subscription) { return await dbGetUserRevenueState(userId, invoices, subscription); }
}

export const paymentEngine = new PaymentEngine();
