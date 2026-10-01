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
// 1. WORK PARTNER / CONTRACTOR MANAGEMENT
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

    // Normalize entity fields for Work Partner
    const normalized = filtered.map(v => {
      const spec = v.specialization || v.category || 'Specialist';
      const status = v.status || (v.isActive !== false ? 'active' : 'inactive');
      return {
        ...v,
        specialization: spec,
        category: spec,
        status,
        isActive: status === 'active',
        totalWorkValue: Number(v.totalWorkValue) || 0,
        totalPaid: Number(v.totalPaid) || 0,
        totalDue: Number(v.totalDue) || 0
      };
    });

    return normalized.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  const spec = vendor.specialization || vendor.category || 'Specialist';
  const status = vendor.status || (vendor.isActive !== false ? 'active' : 'inactive');

  const normalized = {
    ...vendor,
    specialization: spec,
    category: spec,
    status,
    isActive: status === 'active',
    totalWorkValue: Number(vendor.totalWorkValue) || 0,
    totalPaid: Number(vendor.totalPaid) || 0,
    totalDue: Number(vendor.totalDue) || 0
  };

  const stamped = stampRecord(normalized, userId, workspaceId);
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
// 2. WORK ASSIGNMENT & CONTRACTOR BILL SYSTEM
// =========================================================================

export const generateNextContractorBillNumber = (existingJobs = []) => {
  let maxNum = 0;
  (existingJobs || []).forEach(job => {
    const billNum = job.contractorBillNumber || job.billNumber || job.jobCode || '';
    const match = billNum.match(/(?:WB|CB)-(\d+)/i);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) maxNum = val;
    }
  });
  return `WB-${String(maxNum + 1).padStart(4, '0')}`;
};

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

    // Normalize dual aliases so both contractor and legacy job properties resolve seamlessly
    const normalized = filtered.map(job => {
      const contractorId = job.contractorId || job.vendorId || '';
      const contractorName = job.contractorName || job.vendorName || '';
      const customerId = job.customerId || null;
      const customerName = job.customerName || job.client || '';
      const invoiceId = job.invoiceId || job.relatedInvoiceId || null;
      const invoiceNumber = job.invoiceNumber || job.relatedInvoiceNumber || '';
      const workDesc = job.workDescription || job.description || job.project || 'Outsource Work';
      const assignedQuantity = Number(job.assignedQuantity) || 1;
      const contractorRate = Number(job.contractorRate) || (Number(job.totalContractorCost || job.agreedCost) / (assignedQuantity || 1)) || 0;
      const totalCost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
      const paid = Number(job.paidAmount !== undefined ? job.paidAmount : job.totalPaid) || 0;
      const due = Math.max(0, totalCost - paid);

      let paymentStatus = job.paymentStatus;
      if (!paymentStatus) {
        if (due === 0 && totalCost > 0) paymentStatus = 'Paid';
        else if (paid > 0) paymentStatus = 'Partially Paid';
        else paymentStatus = 'Unpaid';
      }

      const workStatus = job.workStatus || job.status || 'Assigned';
      const contractorBillNumber = job.contractorBillNumber || job.billNumber || job.jobCode || 'WB-0001';

      return {
        ...job,
        contractorId,
        vendorId: contractorId,
        contractorName,
        vendorName: contractorName,
        customerId,
        customerName,
        client: customerName,
        invoiceId,
        relatedInvoiceId: invoiceId,
        invoiceNumber,
        relatedInvoiceNumber: invoiceNumber,
        productId: job.productId || null,
        productName: job.productName || job.designName || '',
        designNumber: job.designNumber || '',
        workDescription: workDesc,
        description: workDesc,
        assignedQuantity,
        completionPercentage: Number(job.completionPercentage) || 0,
        ownerWorkPercentage: Number(job.ownerWorkPercentage !== undefined ? job.ownerWorkPercentage : 50),
        contractorWorkPercentage: Number(job.contractorWorkPercentage !== undefined ? job.contractorWorkPercentage : 50),
        contractorRate,
        totalContractorCost: totalCost,
        agreedCost: totalCost,
        paidAmount: paid,
        totalPaid: paid,
        dueAmount: due,
        remainingPayable: due,
        paymentStatus,
        workStatus,
        status: workStatus,
        contractorBillNumber,
        jobCode: contractorBillNumber,
        assignedAt: job.assignedAt || job.startDate || job.createdAt,
        completedAt: job.completedAt || null
      };
    });

    return normalized.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  const contractorBillNumber = job.contractorBillNumber || job.billNumber || job.jobCode || generateNextContractorBillNumber(allJobs);
  const contractorId = job.contractorId || job.vendorId || '';
  const contractorName = job.contractorName || job.vendorName || '';
  const customerId = job.customerId || null;
  const customerName = job.customerName || job.client || '';
  const invoiceId = job.invoiceId || job.relatedInvoiceId || null;
  const invoiceNumber = job.invoiceNumber || job.relatedInvoiceNumber || '';
  const workDesc = job.workDescription || job.description || job.project || 'Outsource Work';
  const assignedQuantity = Number(job.assignedQuantity) || 1;
  const contractorRate = Number(job.contractorRate) || 0;
  const totalCost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : (contractRateOrAgreed(job, assignedQuantity, contractorRate)));
  const paid = Number(job.paidAmount !== undefined ? job.paidAmount : job.totalPaid) || 0;
  const due = Math.max(0, totalCost - paid);

  let paymentStatus = job.paymentStatus;
  if (!paymentStatus) {
    if (due === 0 && totalCost > 0) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partially Paid';
    else paymentStatus = 'Unpaid';
  }

  const workStatus = job.workStatus || job.status || 'Assigned';
  const completedAt = (workStatus === 'Completed' || workStatus === 'Delivered')
    ? (job.completedAt || new Date().toISOString())
    : null;

  const normalized = {
    ...job,
    contractorId,
    vendorId: contractorId,
    contractorName,
    vendorName: contractorName,
    customerId,
    customerName,
    client: customerName,
    invoiceId,
    relatedInvoiceId: invoiceId,
    invoiceNumber,
    relatedInvoiceNumber: invoiceNumber,
    productId: job.productId || null,
    productName: job.productName || job.designName || '',
    designNumber: job.designNumber || '',
    workDescription: workDesc,
    description: workDesc,
    assignedQuantity,
    completionPercentage: Number(job.completionPercentage) || 0,
    ownerWorkPercentage: Number(job.ownerWorkPercentage !== undefined ? job.ownerWorkPercentage : 50),
    contractorWorkPercentage: Number(job.contractorWorkPercentage !== undefined ? job.contractorWorkPercentage : 50),
    contractorRate,
    totalContractorCost: totalCost,
    agreedCost: totalCost,
    paidAmount: paid,
    totalPaid: paid,
    dueAmount: due,
    remainingPayable: due,
    paymentStatus,
    workStatus,
    status: workStatus,
    contractorBillNumber,
    jobCode: contractorBillNumber,
    assignedAt: job.assignedAt || job.startDate || new Date().toISOString(),
    completedAt
  };

  const stamped = stampRecord(normalized, userId, workspaceId);
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

function contractRateOrAgreed(job, qty, rate) {
  if (rate > 0) return rate * qty;
  if (Number(job.agreedCost) > 0) return Number(job.agreedCost);
  return 0;
}

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

  // Reconcile bank and clean up linked disbursements
  try {
    const allPayments = await getOutsourcePayments();
    const linked = allPayments.filter(p => (p.jobId === id || p.contractorBillId === id) && !p.isDeleted);
    for (const p of linked) {
      await deleteOutsourcePayment(p.id, permanent);
    }
  } catch (err) {
    console.warn('Disbursement cascade cleanup notice on job deletion:', err);
  }

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
// 3. OUTSOURCE & CONTRACTOR PAYMENTS & INTERNAL BANK INTEGRATION
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
 * Record a contractor payment (full or partial).
 * Invariant: Customer's invoice amount is NEVER decreased by contractor cost.
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

  const contractorBillId = paymentData.contractorBillId || paymentData.jobId || null;
  const contractorId = paymentData.contractorId || paymentData.vendorId;
  const contractorName = paymentData.contractorName || paymentData.vendorName || '';

  const paymentRecord = {
    id: paymentData.id || 'cpay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    paymentId: paymentData.paymentId || ('cpay-' + Date.now()),
    jobId: contractorBillId,
    contractorBillId,
    jobCode: paymentData.jobCode || paymentData.contractorBillNumber || '',
    contractorBillNumber: paymentData.contractorBillNumber || paymentData.jobCode || '',
    vendorId: contractorId,
    contractorId,
    vendorName: contractorName,
    contractorName,
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

  // Check and update related Outsource Job / Work Assignment status
  if (contractorBillId) {
    let allJobs = [];
    try {
      allJobs = await BillQyroDB.getAll('outsourceJobs');
    } catch (e) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    const jobIdx = allJobs.findIndex(j => j.id === contractorBillId || j.contractorBillNumber === contractorBillId || j.jobCode === contractorBillId);
    if (jobIdx !== -1) {
      const job = allJobs[jobIdx];
      const validJobPayments = allPayments.filter(p => (p.jobId === job.id || p.contractorBillId === job.id) && !p.isDeleted);
      const totalPaid = validJobPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const agreedCost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
      const outstanding = Math.max(0, agreedCost - totalPaid);

      job.totalPaid = totalPaid;
      job.paidAmount = totalPaid;
      job.remainingPayable = outstanding;
      job.dueAmount = outstanding;

      if (outstanding === 0 && agreedCost > 0) {
        job.paymentStatus = 'Paid';
        if (job.status !== 'Completed' && job.status !== 'Cancelled') {
          job.status = 'Approved';
          job.workStatus = 'Approved';
        }
      } else if (totalPaid > 0) {
        job.paymentStatus = 'Partially Paid';
      } else {
        job.paymentStatus = 'Unpaid';
      }

      job.updatedAt = new Date().toISOString();
      allJobs[jobIdx] = stampRecord(job);
      setCachedList(KEYS.JOBS, allJobs);
      try { await BillQyroDB.put('outsourceJobs', allJobs[jobIdx]); } catch (e) { console.warn(e); }
    }
  }

  // Internal Bank integration: Deduct from bank account as business payout
  if (paymentData.bankAccount || paymentData.syncWithBank) {
    try {
      const bankState = await bankEngine.getState();
      const alreadyHasTx = (bankState?.ledger || []).some(t => t.sourceRefId === stamped.id && !t.reversed);
      if (!alreadyHasTx) {
        await bankEngine.addTransaction({
          type: 'moneyOut',
          amountRupees: amount,
          category: 'Staff Payment',
          title: `Contractor Payout: ${contractorName || 'Contractor'} (${paymentRecord.contractorBillNumber || 'Bill'})`,
          account: paymentData.bankAccount || 'Cash',
          note: `Contractor disbursement for ${paymentRecord.contractorBillNumber || ''} ${paymentData.note || ''}`.trim(),
          source: 'outsource_payout',
          sourceRefId: stamped.id,
          date: paymentData.date || new Date().toISOString()
        });
      }
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
  const idx = allPayments.findIndex(p => p.id === paymentId || p.paymentId === paymentId);
  if (idx === -1) return false;

  const payment = allPayments[idx];

  // Reconcile and reverse bank transaction if exists
  try {
    const bankState = await bankEngine.getState();
    const matchedTx = (bankState?.ledger || []).find(t => (t.sourceRefId === payment.id || t.sourceRefId === paymentId) && !t.reversed);
    if (matchedTx) {
      await bankEngine.reverseTransaction(matchedTx.id, 'Contractor payment deletion');
    }
  } catch (bErr) {
    console.warn('Bank reverse notice on payment deletion:', bErr);
  }

  if (permanent) {
    const updated = allPayments.filter(p => p.id !== payment.id);
    setCachedList(KEYS.PAYMENTS, updated);
    try { await BillQyroDB.delete('outsourcePayments', payment.id); } catch (e) { console.warn(e); }
  } else {
    allPayments[idx].isDeleted = true;
    allPayments[idx].deletedAt = new Date().toISOString();
    allPayments[idx] = stampRecord(allPayments[idx]);
    setCachedList(KEYS.PAYMENTS, allPayments);
    try { await BillQyroDB.put('outsourcePayments', allPayments[idx]); } catch (e) { console.warn(e); }
  }

  // Recalculate Job
  const targetJobId = payment.jobId || payment.contractorBillId;
  if (targetJobId) {
    let allJobs = [];
    try {
      allJobs = await BillQyroDB.getAll('outsourceJobs');
    } catch (e) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    if (!allJobs || !Array.isArray(allJobs) || allJobs.length === 0) {
      allJobs = getCachedList(KEYS.JOBS);
    }
    const jobIdx = allJobs.findIndex(j => j.id === targetJobId || j.contractorBillNumber === targetJobId || j.jobCode === targetJobId);
    if (jobIdx !== -1) {
      const activePayments = allPayments.filter(p => (p.jobId === allJobs[jobIdx].id || p.contractorBillId === allJobs[jobIdx].id) && !p.isDeleted);
      const totalPaid = activePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const agreedCost = Number(allJobs[jobIdx].totalContractorCost !== undefined ? allJobs[jobIdx].totalContractorCost : allJobs[jobIdx].agreedCost) || 0;
      allJobs[jobIdx].totalPaid = totalPaid;
      allJobs[jobIdx].paidAmount = totalPaid;
      allJobs[jobIdx].remainingPayable = Math.max(0, agreedCost - totalPaid);
      allJobs[jobIdx].dueAmount = Math.max(0, agreedCost - totalPaid);

      if (allJobs[jobIdx].dueAmount === 0 && agreedCost > 0) {
        allJobs[jobIdx].paymentStatus = 'Paid';
      } else if (totalPaid > 0) {
        allJobs[jobIdx].paymentStatus = 'Partially Paid';
      } else {
        allJobs[jobIdx].paymentStatus = 'Unpaid';
      }

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

export const calculateWorkSplit = (totalCustomerPrice = 0, contractorPercentage = 50) => {
  const price = Math.max(0, Number(totalCustomerPrice) || 0);
  const contractorPct = Math.min(100, Math.max(0, Number(contractorPercentage) || 0));
  const ownerPct = 100 - contractorPct;
  const contractorAmount = Math.round((price * contractorPct) / 100);
  const ownerAmount = price - contractorAmount;
  return {
    contractorPercentage: contractorPct,
    ownerPercentage: ownerPct,
    contractorAmount,
    ownerAmount
  };
};

export const calculateJobFinancials = (job, allPayments = []) => {
  const agreedCost = Number(job?.totalContractorCost !== undefined ? job?.totalContractorCost : job?.agreedCost) || 0;
  const jobPayments = allPayments.filter(p => (p.jobId === job?.id || p.contractorBillId === job?.id) && !p.isDeleted);
  const totalPaid = jobPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const advancePaid = jobPayments.filter(p => p.isAdvance).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const outstandingPayable = Math.max(0, agreedCost - totalPaid);

  let paymentStatus = 'Unpaid';
  if (outstandingPayable === 0 && agreedCost > 0) paymentStatus = 'Paid';
  else if (totalPaid > 0) paymentStatus = 'Partially Paid';

  return {
    agreedCost,
    totalContractorCost: agreedCost,
    advancePaid,
    totalPaid,
    paidAmount: totalPaid,
    outstandingPayable,
    dueAmount: outstandingPayable,
    paymentStatus,
    isSettled: outstandingPayable === 0 && agreedCost > 0,
    paymentCount: jobPayments.length
  };
};

export const calculateVendor360 = (vendor, allJobs = [], allPayments = []) => {
  const vendorId = typeof vendor === 'string' ? vendor : vendor?.id;
  const vendorJobs = allJobs.filter(j => (j.contractorId === vendorId || j.vendorId === vendorId) && !j.isDeleted);
  const vendorPayments = allPayments.filter(p => (p.contractorId === vendorId || p.vendorId === vendorId) && !p.isDeleted);

  const totalJobs = vendorJobs.length;
  const completedJobs = vendorJobs.filter(j => j.workStatus === 'Completed' || j.status === 'Completed' || j.status === 'Approved').length;
  const pendingJobs = vendorJobs.filter(j => j.workStatus !== 'Completed' && j.status !== 'Completed' && j.status !== 'Cancelled').length;

  const totalCost = vendorJobs.reduce((acc, j) => acc + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0);
  const totalPaid = vendorPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const openingBalance = Number(vendor?.openingBalance) || 0;
  const payable = Math.max(0, openingBalance + totalCost - totalPaid);

  return {
    totalJobs,
    completedJobs,
    pendingJobs,
    totalCost,
    totalWorkValue: totalCost,
    totalPaid,
    payable,
    totalDue: payable,
    openingBalance
  };
};

export const getVendorLedger = (vendor, allJobs = [], allPayments = []) => {
  const vendorId = typeof vendor === 'string' ? vendor : vendor?.id;
  const opening = Number(vendor?.openingBalance) || 0;
  const vendorJobs = allJobs.filter(j => (j.contractorId === vendorId || j.vendorId === vendorId) && !j.isDeleted);
  const vendorPayments = allPayments.filter(p => (p.contractorId === vendorId || p.vendorId === vendorId) && !p.isDeleted);

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
    const cost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
    const billNum = job.contractorBillNumber || job.jobCode || job.id;
    ledgerEntries.push({
      id: `job-${job.id}`,
      date: job.assignedAt || job.startDate || job.createdAt,
      type: 'WORK_COST',
      description: `Bill ${billNum}: ${job.workDescription || job.description || 'Assignment'}${job.customerName ? ` (Client: ${job.customerName})` : ''}`,
      debit: 0,
      credit: cost,
      reference: billNum
    });
  });

  vendorPayments.forEach(pay => {
    ledgerEntries.push({
      id: `pay-${pay.id}`,
      date: pay.date || pay.createdAt,
      type: 'PAYMENT',
      description: `Disbursement via ${pay.paymentMethod || 'UPI'}${pay.note ? ` · ${pay.note}` : ''}`,
      debit: Number(pay.amount) || 0,
      credit: 0,
      reference: pay.reference || pay.contractorBillNumber || pay.jobCode || 'Payout'
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
    totalJobCost: vendorJobs.reduce((s, j) => s + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0),
    totalPaid: vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  };
};

/**
 * Profitability calculations linking Client Invoices -> Contractor Assignments
 * CORE INVARIANT: Customer's invoice amount is NEVER decreased by contractor cost.
 * Revenue remains customer invoice amount.
 * Contractor cost is an internal business cost/expense.
 * Net Margin = Revenue - Contractor Cost.
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
    const cost = Number(job.totalContractorCost !== undefined ? job.totalContractorCost : job.agreedCost) || 0;
    const inv = (job.invoiceId || job.relatedInvoiceId) ? invoiceMap.get(job.invoiceId || job.relatedInvoiceId) : null;
    const invRevenue = inv ? (Number(inv.total || inv.grandTotal || inv.subTotal) || 0) : 0;

    linkedOutsourceCost += cost;
    if (inv) {
      uniqueLinkedInvoiceIds.add(inv.id || inv.invoiceNumber);
    }

    projectBreakdown.push({
      jobId: job.id,
      billNumber: job.contractorBillNumber || job.jobCode,
      jobCode: job.contractorBillNumber || job.jobCode,
      title: job.workDescription || job.description || job.productName || 'Outsource Task',
      client: job.customerName || job.client || inv?.customerName || 'Direct Client',
      invoiceNumber: inv?.invoiceNumber || job.invoiceNumber || job.relatedInvoiceNumber || 'Unlinked',
      designNumber: job.designNumber || '',
      invoiceAmount: invRevenue,
      agreedCost: cost,
      totalContractorCost: cost,
      grossProfit: invRevenue - cost,
      marginPercent: invRevenue > 0 ? Math.round(((invRevenue - cost) / invRevenue) * 100) : 0,
      workStatus: job.workStatus || job.status || 'Assigned',
      paymentStatus: job.paymentStatus || 'Unpaid'
    });
  });

  let linkedClientRevenue = 0;
  uniqueLinkedInvoiceIds.forEach(id => {
    const inv = invoiceMap.get(id);
    if (inv) {
      linkedClientRevenue += (Number(inv.total || inv.grandTotal || inv.subTotal) || 0);
    }
  });

  const totalCost = activeJobs.reduce((acc, j) => acc + (Number(j.totalContractorCost !== undefined ? j.totalContractorCost : j.agreedCost) || 0), 0);
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
  generateNextContractorBillNumber,
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
