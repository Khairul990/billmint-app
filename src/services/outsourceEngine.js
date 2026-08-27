import { BillQyroDB } from './localDb.js';
import { bankEngine } from './bankEngine.js';

const KEYS = {
  VENDORS: 'billqyro_vendors',
  JOBS: 'billqyro_outsource_jobs',
  PAYMENTS: 'billqyro_outsource_payments',
  SETTINGS: 'billqyro_settings'
};

const getLocalUserId = () => {
  try {
    const raw = localStorage.getItem('billqyro_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.uid || parsed.id || 'local-user';
    }
  } catch (e) { console.warn(e); }
  return 'local-user';
};

const getActiveWorkspaceId = () => {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.activeWorkspaceId || 'default';
    }
  } catch (e) { console.warn(e); }
  return 'default';
};

const getCachedList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const setCachedList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
};

const stampRecord = (record, userId, workspaceId) => {
  const now = new Date().toISOString();
  return {
    ...record,
    userId: userId || record.userId || getLocalUserId(),
    workspaceId: workspaceId || record.workspaceId || getActiveWorkspaceId(),
    updatedAt: now,
    createdAt: record.createdAt || now,
    __version: (record.__version || 0) + 1,
    syncStatus: 'pending'
  };
};

// =========================================================================
// 1. VENDORS MANAGEMENT
// =========================================================================

export const getVendors = async (includeDeleted = false) => {
  try {
    const userId = getLocalUserId();
    const workspaceId = getActiveWorkspaceId();
    let data = [];
    try {
      data = await BillQyroDB.getAll('vendors');
    } catch (e) {
      data = getCachedList(KEYS.VENDORS);
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = getCachedList(KEYS.VENDORS);
    }
    let filtered = Array.isArray(data) ? data : [];
    if (!includeDeleted) {
      filtered = filtered.filter(v => !v.isDeleted);
    }
    if (userId) filtered = filtered.filter(v => v.userId === userId);
    if (workspaceId) filtered = filtered.filter(v => v.workspaceId === workspaceId);
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (e) {
    console.warn('Error in getVendors:', e);
    return [];
  }
};

export const saveVendor = async (vendor) => {
  const userId = getLocalUserId();
  const workspaceId = getActiveWorkspaceId();
  let allVendors = [];
  try {
    allVendors = await BillQyroDB.getAll('vendors');
  } catch (e) {
    allVendors = getCachedList(KEYS.VENDORS);
  }
  if (!allVendors || !Array.isArray(allVendors) || allVendors.length === 0) {
    allVendors = getCachedList(KEYS.VENDORS);
  }

  if (!vendor.id) {
    vendor.id = 'vnd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  const stamped = stampRecord(vendor, userId, workspaceId);
  const idx = allVendors.findIndex(v => v.id === stamped.id);
  if (idx !== -1) {
    allVendors[idx] = stamped;
  } else {
    allVendors.push(stamped);
  }

  setCachedList(KEYS.VENDORS, allVendors);
  try {
    await BillQyroDB.put('vendors', stamped);
  } catch (e) { console.warn(e); }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  return stamped;
};

export const deleteVendor = async (id, permanent = false) => {
  let allVendors = [];
  try {
    allVendors = await BillQyroDB.getAll('vendors');
  } catch (e) {
    allVendors = getCachedList(KEYS.VENDORS);
  }
  if (!allVendors || !Array.isArray(allVendors) || allVendors.length === 0) {
    allVendors = getCachedList(KEYS.VENDORS);
  }

  const idx = allVendors.findIndex(v => v.id === id);
  if (idx === -1) return false;

  if (permanent) {
    const updated = allVendors.filter(v => v.id !== id);
    setCachedList(KEYS.VENDORS, updated);
    try { await BillQyroDB.delete('vendors', id); } catch (e) { console.warn(e); }
  } else {
    allVendors[idx].isDeleted = true;
    allVendors[idx].deletedAt = new Date().toISOString();
    allVendors[idx] = stampRecord(allVendors[idx]);
    setCachedList(KEYS.VENDORS, allVendors);
    try { await BillQyroDB.put('vendors', allVendors[idx]); } catch (e) { console.warn(e); }
  }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  return true;
};

// =========================================================================
// 2. OUTSOURCE JOBS MANAGEMENT
// =========================================================================

export const getOutsourceJobs = async (includeDeleted = false) => {
  try {
    const userId = getLocalUserId();
    const workspaceId = getActiveWorkspaceId();
    let data = [];
    try {
      data = await BillQyroDB.getAll('outsourceJobs');
    } catch (e) {
      data = getCachedList(KEYS.JOBS);
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = getCachedList(KEYS.JOBS);
    }
    let filtered = Array.isArray(data) ? data : [];
    if (!includeDeleted) {
      filtered = filtered.filter(j => !j.isDeleted);
    }
    if (userId) filtered = filtered.filter(j => j.userId === userId);
    if (workspaceId) filtered = filtered.filter(j => j.workspaceId === workspaceId);
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (e) {
    console.warn('Error in getOutsourceJobs:', e);
    return [];
  }
};

export const saveOutsourceJob = async (job) => {
  const userId = getLocalUserId();
  const workspaceId = getActiveWorkspaceId();
  let allJobs = [];
  try {
    allJobs = await BillQyroDB.getAll('outsourceJobs');
  } catch (e) {
    allJobs = getCachedList(KEYS.JOBS);
  }
  if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
    allJobs = getCachedList(KEYS.JOBS);
  }

  if (!job.id) {
    job.id = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }
  if (!job.jobCode) {
    job.jobCode = 'OUT-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  const stamped = stampRecord(job, userId, workspaceId);
  const idx = allJobs.findIndex(j => j.id === stamped.id);
  if (idx !== -1) {
    allJobs[idx] = stamped;
  } else {
    allJobs.push(stamped);
  }

  setCachedList(KEYS.JOBS, allJobs);
  try {
    await BillQyroDB.put('outsourceJobs', stamped);
  } catch (e) { console.warn(e); }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  return stamped;
};

export const deleteOutsourceJob = async (id, permanent = false) => {
  let allJobs = [];
  try {
    allJobs = await BillQyroDB.getAll('outsourceJobs');
  } catch (e) {
    allJobs = getCachedList(KEYS.JOBS);
  }
  if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
    allJobs = getCachedList(KEYS.JOBS);
  }

  const idx = allJobs.findIndex(j => j.id === id);
  if (idx === -1) return false;

  if (permanent) {
    const updated = allJobs.filter(j => j.id !== id);
    setCachedList(KEYS.JOBS, updated);
    try { await BillQyroDB.delete('outsourceJobs', id); } catch (e) { console.warn(e); }
  } else {
    allJobs[idx].isDeleted = true;
    allJobs[idx].deletedAt = new Date().toISOString();
    allJobs[idx] = stampRecord(allJobs[idx]);
    setCachedList(KEYS.JOBS, allJobs);
    try { await BillQyroDB.put('outsourceJobs', allJobs[idx]); } catch (e) { console.warn(e); }
  }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  return true;
};

// =========================================================================
// 3. OUTSOURCE PAYMENTS & FINANCIAL ENGINE
// =========================================================================

export const getOutsourcePayments = async (includeDeleted = false) => {
  try {
    const userId = getLocalUserId();
    const workspaceId = getActiveWorkspaceId();
    let data = [];
    try {
      data = await BillQyroDB.getAll('outsourcePayments');
    } catch (e) {
      data = getCachedList(KEYS.PAYMENTS);
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = getCachedList(KEYS.PAYMENTS);
    }
    let filtered = Array.isArray(data) ? data : [];
    if (!includeDeleted) {
      filtered = filtered.filter(p => !p.isDeleted);
    }
    if (userId) filtered = filtered.filter(p => p.userId === userId);
    if (workspaceId) filtered = filtered.filter(p => p.workspaceId === workspaceId);
    return filtered.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
  } catch (e) {
    console.warn('Error in getOutsourcePayments:', e);
    return [];
  }
};

/**
 * Record an outsource payment.
 * Formula: Outstanding = MAX(0, Agreed Cost - Total Valid Payments)
 * Dispatches to Internal Bank (moneyOut) if bankAccount specified.
 */
export const recordOutsourcePayment = async (paymentData) => {
  const userId = getLocalUserId();
  const workspaceId = getActiveWorkspaceId();
  let allPayments = [];
  try {
    allPayments = await BillQyroDB.getAll('outsourcePayments');
  } catch (e) {
    allPayments = getCachedList(KEYS.PAYMENTS);
  }
  if (!allPayments || !Array.isArray(allPayments) || allPayments.length === 0) {
    allPayments = getCachedList(KEYS.PAYMENTS);
  }

  const amount = Number(paymentData.amount) || 0;
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const paymentRecord = {
    id: paymentData.id || 'opay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    jobId: paymentData.jobId || null,
    jobCode: paymentData.jobCode || '',
    vendorId: paymentData.vendorId,
    vendorName: paymentData.vendorName || '',
    amount: amount,
    date: paymentData.date || new Date().toISOString(),
    paymentMethod: paymentData.paymentMethod || 'UPI',
    reference: paymentData.reference || '',
    note: paymentData.note || '',
    bankAccount: paymentData.bankAccount || '',
    isAdvance: Boolean(paymentData.isAdvance)
  };

  const stamped = stampRecord(paymentRecord, userId, workspaceId);
  allPayments.push(stamped);
  setCachedList(KEYS.PAYMENTS, allPayments);
  try {
    await BillQyroDB.put('outsourcePayments', stamped);
  } catch (e) { console.warn(e); }

  // Check and update related Outsource Job status if jobId is provided
  if (paymentData.jobId) {
    let allJobs = [];
    try {
      allJobs = await BillQyroDB.getAll('outsourceJobs');
    } catch (e) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    const jobIdx = allJobs.findIndex(j => j.id === paymentData.jobId);
    if (jobIdx !== -1) {
      const job = allJobs[jobIdx];
      const validJobPayments = allPayments.filter(p => p.jobId === job.id && !p.isDeleted);
      const totalPaid = validJobPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const agreedCost = Number(job.agreedCost) || 0;
      const outstanding = Math.max(0, agreedCost - totalPaid);

      job.totalPaid = totalPaid;
      job.remainingPayable = outstanding;
      if (outstanding === 0 && job.status !== 'Completed' && job.status !== 'Cancelled') {
        job.status = 'Approved';
      }
      job.updatedAt = new Date().toISOString();
      allJobs[jobIdx] = stampRecord(job);
      setCachedList(KEYS.JOBS, allJobs);
      try { await BillQyroDB.put('outsourceJobs', allJobs[jobIdx]); } catch (e) { console.warn(e); }
    }
  }

  // Internal Bank integration: Deduct from bank account
  if (paymentData.bankAccount || paymentData.syncWithBank) {
    try {
      await bankEngine.addTransaction({
        type: 'moneyOut',
        amountRupees: amount,
        category: 'Staff Payment',
        title: `Vendor Payout: ${paymentData.vendorName || 'Outsource'} (${paymentData.jobCode || 'Job'})`,
        account: paymentData.bankAccount || 'Cash',
        note: `Outsource payment for ${paymentData.jobCode || ''} ${paymentData.note || ''}`.trim(),
        source: 'outsource_payout',
        sourceRefId: stamped.id,
        date: paymentData.date || new Date().toISOString()
      });
    } catch (bankErr) {
      console.warn('Bank transaction auto-post notice:', bankErr);
    }
  }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
  return stamped;
};

export const deleteOutsourcePayment = async (paymentId, permanent = false) => {
  let allPayments = [];
  try {
    allPayments = await BillQyroDB.getAll('outsourcePayments');
  } catch (e) {
    allPayments = getCachedList(KEYS.PAYMENTS);
  }
  if (!allPayments || !Array.isArray(allPayments) || allPayments.length === 0) {
    allPayments = getCachedList(KEYS.PAYMENTS);
  }
  const idx = allPayments.findIndex(p => p.id === paymentId);
  if (idx === -1) return false;

  const payment = allPayments[idx];

  if (permanent) {
    const updated = allPayments.filter(p => p.id !== paymentId);
    setCachedList(KEYS.PAYMENTS, updated);
    try { await BillQyroDB.delete('outsourcePayments', paymentId); } catch (e) { console.warn(e); }
  } else {
    allPayments[idx].isDeleted = true;
    allPayments[idx].deletedAt = new Date().toISOString();
    allPayments[idx] = stampRecord(allPayments[idx]);
    setCachedList(KEYS.PAYMENTS, allPayments);
    try { await BillQyroDB.put('outsourcePayments', allPayments[idx]); } catch (e) { console.warn(e); }
  }

  // Recalculate Job
  if (payment.jobId) {
    let allJobs = [];
    try {
      allJobs = await BillQyroDB.getAll('outsourceJobs');
    } catch (e) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    const jobIdx = allJobs.findIndex(j => j.id === payment.jobId);
    if (jobIdx !== -1) {
      const activePayments = allPayments.filter(p => p.jobId === payment.jobId && !p.isDeleted);
      const totalPaid = activePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const agreedCost = Number(allJobs[jobIdx].agreedCost) || 0;
      allJobs[jobIdx].totalPaid = totalPaid;
      allJobs[jobIdx].remainingPayable = Math.max(0, agreedCost - totalPaid);
      allJobs[jobIdx] = stampRecord(allJobs[jobIdx]);
      setCachedList(KEYS.JOBS, allJobs);
      try { await BillQyroDB.put('outsourceJobs', allJobs[jobIdx]); } catch (e) { console.warn(e); }
    }
  }

  window.dispatchEvent(new CustomEvent('billqyro_outsource_updated'));
  window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
  return true;
};

// =========================================================================
// 4. FINANCIAL CALCULATIONS & LEDGER INVARIANTS
// =========================================================================

export const calculateJobFinancials = (job, allPayments = []) => {
  const agreedCost = Number(job?.agreedCost) || 0;
  const jobPayments = allPayments.filter(p => p.jobId === job?.id && !p.isDeleted);
  const totalPaid = jobPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const advancePaid = jobPayments.filter(p => p.isAdvance).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const outstandingPayable = Math.max(0, agreedCost - totalPaid);

  return {
    agreedCost,
    advancePaid,
    totalPaid,
    outstandingPayable,
    isSettled: outstandingPayable === 0 && agreedCost > 0,
    paymentCount: jobPayments.length
  };
};

export const calculateVendor360 = (vendor, allJobs = [], allPayments = []) => {
  const vendorId = typeof vendor === 'string' ? vendor : vendor?.id;
  const vendorJobs = allJobs.filter(j => j.vendorId === vendorId && !j.isDeleted);
  const vendorPayments = allPayments.filter(p => p.vendorId === vendorId && !p.isDeleted);

  const totalJobs = vendorJobs.length;
  const completedJobs = vendorJobs.filter(j => j.status === 'Completed' || j.status === 'Approved').length;
  const pendingJobs = vendorJobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length;

  const totalCost = vendorJobs.reduce((acc, j) => acc + (Number(j.agreedCost) || 0), 0);
  const totalPaid = vendorPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const openingBalance = Number(vendor?.openingBalance) || 0;
  const payable = Math.max(0, openingBalance + totalCost - totalPaid);

  return {
    totalJobs,
    completedJobs,
    pendingJobs,
    totalCost,
    totalPaid,
    payable,
    openingBalance
  };
};

export const getVendorLedger = (vendor, allJobs = [], allPayments = []) => {
  const vendorId = typeof vendor === 'string' ? vendor : vendor?.id;
  const opening = Number(vendor?.openingBalance) || 0;
  const vendorJobs = allJobs.filter(j => j.vendorId === vendorId && !j.isDeleted);
  const vendorPayments = allPayments.filter(p => p.vendorId === vendorId && !p.isDeleted);

  const ledgerEntries = [];

  if (opening > 0) {
    ledgerEntries.push({
      id: 'open-bal',
      date: vendor?.createdAt || new Date().toISOString(),
      type: 'OPENING',
      description: 'Opening Payable Balance',
      debit: 0,
      credit: opening,
      reference: 'N/A'
    });
  }

  vendorJobs.forEach(job => {
    ledgerEntries.push({
      id: `job-${job.id}`,
      date: job.startDate || job.createdAt,
      type: 'JOB_COST',
      description: `Job: ${job.jobCode || job.title || 'Outsource Task'} (${job.project || 'Direct'})`,
      debit: 0,
      credit: Number(job.agreedCost) || 0,
      reference: job.jobCode || job.id
    });
  });

  vendorPayments.forEach(pay => {
    ledgerEntries.push({
      id: `pay-${pay.id}`,
      date: pay.date || pay.createdAt,
      type: 'PAYMENT',
      description: `Payment via ${pay.paymentMethod || 'UPI'}${pay.note ? ` · ${pay.note}` : ''}`,
      debit: Number(pay.amount) || 0,
      credit: 0,
      reference: pay.reference || pay.jobCode || 'Payout'
    });
  });

  // Sort chronological
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningPayable = 0;
  const statement = ledgerEntries.map(entry => {
    runningPayable = runningPayable + entry.credit - entry.debit;
    return {
      ...entry,
      balance: runningPayable
    };
  });

  return {
    statement,
    currentPayable: Math.max(0, runningPayable),
    totalJobCost: vendorJobs.reduce((s, j) => s + (Number(j.agreedCost) || 0), 0),
    totalPaid: vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  };
};

/**
 * Profitability calculations linking Client Invoices -> Outsource Jobs
 */
export const calculateOutsourceProfitability = (invoices = [], jobs = [], payments = []) => {
  const activeJobs = jobs.filter(j => !j.isDeleted);
  const activeInvoices = invoices.filter(i => !i.isDeleted);

  let linkedOutsourceCost = 0;
  const projectBreakdown = [];

  const invoiceMap = new Map();
  activeInvoices.forEach(inv => {
    invoiceMap.set(inv.id, inv);
    if (inv.invoiceNumber) invoiceMap.set(inv.invoiceNumber, inv);
  });

  const uniqueLinkedInvoiceIds = new Set();

  activeJobs.forEach(job => {
    const cost = Number(job.agreedCost) || 0;
    const inv = job.relatedInvoiceId ? invoiceMap.get(job.relatedInvoiceId) : null;
    const invRevenue = inv ? (Number(inv.total || inv.grandTotal || inv.subTotal) || 0) : 0;

    linkedOutsourceCost += cost;
    if (inv) {
      uniqueLinkedInvoiceIds.add(inv.id || inv.invoiceNumber);
    }

    projectBreakdown.push({
      jobId: job.id,
      jobCode: job.jobCode,
      title: job.description || job.project || 'Outsource Task',
      client: job.client || inv?.customerName || 'Direct Client',
      invoiceNumber: inv?.invoiceNumber || job.relatedInvoiceNumber || 'Unlinked',
      invoiceAmount: invRevenue,
      agreedCost: cost,
      grossProfit: invRevenue - cost,
      marginPercent: invRevenue > 0 ? Math.round(((invRevenue - cost) / invRevenue) * 100) : 0,
      status: job.status
    });
  });

  let linkedClientRevenue = 0;
  uniqueLinkedInvoiceIds.forEach(id => {
    const inv = invoiceMap.get(id);
    if (inv) {
      linkedClientRevenue += (Number(inv.total || inv.grandTotal || inv.subTotal) || 0);
    }
  });

  const totalCost = activeJobs.reduce((acc, j) => acc + (Number(j.agreedCost) || 0), 0);
  const totalPaid = payments.filter(p => !p.isDeleted).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalOutstanding = Math.max(0, totalCost - totalPaid);

  return {
    totalJobsCount: activeJobs.length,
    totalOutsourceCost: totalCost,
    totalPaid,
    totalOutstanding,
    linkedClientRevenue,
    linkedGrossProfit: linkedClientRevenue - linkedOutsourceCost,
    overallMarginPercent: linkedClientRevenue > 0 ? Math.round(((linkedClientRevenue - linkedOutsourceCost) / linkedClientRevenue) * 100) : 0,
    projectBreakdown
  };
};

export const outsourceEngine = {
  getVendors,
  saveVendor,
  deleteVendor,
  getOutsourceJobs,
  saveOutsourceJob,
  deleteOutsourceJob,
  getOutsourcePayments,
  recordOutsourcePayment,
  deleteOutsourcePayment,
  calculateJobFinancials,
  calculateVendor360,
  getVendorLedger,
  calculateOutsourceProfitability
};
