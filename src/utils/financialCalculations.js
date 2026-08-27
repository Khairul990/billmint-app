/**
 * BillQyro Financial Calculation Engine
 * Pure, deterministic mathematical functions for business reporting, analytics,
 * dashboard metrics, P&L, customer ledgers, and inventory valuation.
 */

// Helper to round to 2 decimal places safely
export const roundTo2 = (num) => {
  const n = parseFloat(num);
  if (isNaN(n) || !isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
};

/**
 * CANONICAL PAYMENT AMOUNT RESOLVER
 * Resolves the single authoritative paid amount for an invoice.
 * Guaranteed invariant:
 * 1. If paymentHistory is present and has items with positive amounts, sum(paymentHistory) is authoritative.
 * 2. Otherwise read amountPaid / paidAmount safely.
 * 3. Fallback: if explicitly marked 'Paid', grandTotal is paid.
 */
export const getInvoicePaidTotal = (inv) => {
  if (!inv) return 0;
  if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
    const sum = inv.paymentHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    if (sum > 0) return roundTo2(sum);
  }
  const val = parseFloat(inv.amountPaid ?? inv.paidAmount);
  if (!isNaN(val) && val >= 0) return roundTo2(val);
  if (inv.paymentStatus === 'Paid') {
    return roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  }
  return 0;
};

/**
 * CANONICAL BALANCE DUE RESOLVER
 * Invariant: balanceDue = Math.max(0, grandTotal - paidTotal)
 */
export const getInvoiceBalanceDue = (inv) => {
  if (!inv) return 0;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  return Math.max(0, roundTo2(grandTotal - paidTotal));
};

/**
 * CANONICAL PAYMENT STATUS RESOLVER
 */
export const getInvoicePaymentStatus = (inv) => {
  if (!inv) return 'Unpaid';
  if (inv.status === 'Cancelled' || inv.status === 'Void') return inv.status;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  if (paidTotal >= grandTotal && grandTotal > 0) return 'Paid';
  if (paidTotal > 0 && paidTotal < grandTotal) return 'Partially Paid';
  if (inv.paymentStatus === 'Pending Verification' || (Array.isArray(inv.paymentProofs) && inv.paymentProofs.some(p => p.status === 'Pending Verification' || p.status === 'pending'))) {
    return 'Pending Verification';
  }
  return 'Unpaid';
};

/**
 * CANONICAL PAYMENT ALLOCATION ENGINE
 * Deterministically allocates an incoming payment when creating/updating an invoice with previous outstanding due.
 * 
 * Order of Priority:
 * 1. Settle Previous / Old Due first.
 * 2. Any remaining payment is allocated toward the Current Invoice.
 */
export const allocatePayment = (paymentAmount = 0, oldDue = 0, currentInvoiceTotal = 0) => {
  const payVal = roundTo2(parseFloat(paymentAmount) || 0);
  const previousDueVal = roundTo2(parseFloat(oldDue) || 0);
  const currentTotalVal = roundTo2(parseFloat(currentInvoiceTotal) || 0);

  // 1. Priority: Settle Old / Previous Due
  const allocatedToOldDue = roundTo2(Math.min(payVal, previousDueVal));
  const remainingOldDue = roundTo2(Math.max(0, previousDueVal - allocatedToOldDue));

  // 2. Priority: Settle Current Invoice with remainder
  const unallocatedPayment = roundTo2(Math.max(0, payVal - allocatedToOldDue));
  const allocatedToCurrentInvoice = roundTo2(Math.min(unallocatedPayment, currentTotalVal));
  const remainingCurrentInvoiceDue = roundTo2(Math.max(0, currentTotalVal - allocatedToCurrentInvoice));

  // 3. Overall Customer Balance Due
  const totalReceivable = roundTo2(previousDueVal + currentTotalVal);
  const customerTotalDue = roundTo2(remainingOldDue + remainingCurrentInvoiceDue);

  let currentInvoicePaymentStatus = 'Unpaid';
  if (allocatedToCurrentInvoice >= currentTotalVal && currentTotalVal > 0) {
    currentInvoicePaymentStatus = 'Paid';
  } else if (allocatedToCurrentInvoice > 0) {
    currentInvoicePaymentStatus = 'Partial';
  }

  return {
    paymentAmount: payVal,
    previousDue: previousDueVal,
    currentInvoiceTotal: currentTotalVal,
    totalReceivable,
    allocatedToOldDue,
    remainingOldDue,
    allocatedToCurrentInvoice,
    remainingCurrentInvoiceDue,
    customerTotalDue,
    currentInvoicePaymentStatus,
    isCurrentInvoicePaid: currentInvoicePaymentStatus === 'Paid',
    isSettled: customerTotalDue === 0
  };
};

/**
 * CANONICAL MULTI-PAYMENT ALLOCATION
 * Allocates an array of payment entries (or numbers) chronologically against Old Due then Current Invoice.
 */
export const allocateMultiplePayments = (payments = [], oldDue = 0, currentInvoiceTotal = 0) => {
  const totalPaid = Array.isArray(payments)
    ? payments.reduce((sum, p) => sum + (typeof p === 'number' ? p : (parseFloat(p?.amount) || 0)), 0)
    : (parseFloat(payments) || 0);

  const allocation = allocatePayment(totalPaid, oldDue, currentInvoiceTotal);

  let runningOldDueToCover = roundTo2(parseFloat(oldDue) || 0);
  let runningCurrentTotalToCover = roundTo2(parseFloat(currentInvoiceTotal) || 0);

  const paymentBreakdown = (Array.isArray(payments) ? payments : []).map(p => {
    const amt = roundTo2(typeof p === 'number' ? p : (parseFloat(p?.amount) || 0));
    const toOldDue = roundTo2(Math.min(amt, runningOldDueToCover));
    runningOldDueToCover = roundTo2(Math.max(0, runningOldDueToCover - toOldDue));

    const rem = roundTo2(Math.max(0, amt - toOldDue));
    const toCurrent = roundTo2(Math.min(rem, runningCurrentTotalToCover));
    runningCurrentTotalToCover = roundTo2(Math.max(0, runningCurrentTotalToCover - toCurrent));

    return {
      ...(typeof p === 'object' ? p : { amount: amt }),
      amount: amt,
      allocatedToOldDue: toOldDue,
      allocatedToCurrentInvoice: toCurrent
    };
  });

  return {
    ...allocation,
    totalPaid: roundTo2(totalPaid),
    paymentBreakdown
  };
};

/**
 * NORMALIZE INVOICE FINANCIALS
 * Enforces zero divergence between amountPaid, paidAmount, balanceDue, and paymentStatus.
 */
export const normalizeInvoiceFinancials = (inv) => {
  if (!inv) return inv;
  const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
  const paidTotal = getInvoicePaidTotal(inv);
  const balanceDue = Math.max(0, roundTo2(grandTotal - paidTotal));
  const paymentStatus = getInvoicePaymentStatus({ ...inv, grandTotal, amountPaid: paidTotal, paidAmount: paidTotal });

  return {
    ...inv,
    grandTotal,
    amountPaid: paidTotal,
    paidAmount: paidTotal,
    balanceDue,
    paymentStatus
  };
};

/**
 * Filter items by date range.
 * Supports: 'Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Year', 'All Time', 'Custom'
 */
export const filterByDateRange = (items = [], dateField = 'date', rangeType = 'This Month', customStart = null, customEnd = null) => {
  if (!Array.isArray(items)) return [];
  if (rangeType === 'All Time' || !rangeType) return [...items];

  const now = new Date();
  
  // Normalize reference dates to midnight
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return items.filter(item => {
    const rawDate = item[dateField] || item.createdAt || item.paymentDate;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;

    if (rangeType === 'Today') {
      return d >= todayStart && d <= todayEnd;
    }

    if (rangeType === 'Yesterday') {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      const yestEnd = new Date(todayEnd);
      yestEnd.setDate(yestEnd.getDate() - 1);
      return d >= yestStart && d <= yestEnd;
    }

    if (rangeType === 'This Week') {
      const currentDay = todayStart.getDay(); // 0 = Sun, 1 = Mon ...
      const startOfWeek = new Date(todayStart);
      startOfWeek.setDate(todayStart.getDate() - currentDay);
      const endOfWeek = new Date(todayEnd);
      endOfWeek.setDate(todayStart.getDate() + (6 - currentDay));
      return d >= startOfWeek && d <= endOfWeek;
    }

    if (rangeType === 'This Month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    if (rangeType === 'Last Month') {
      const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    }

    if (rangeType === 'This Year') {
      return d.getFullYear() === now.getFullYear();
    }

    if (rangeType === 'Custom') {
      const s = customStart ? new Date(customStart) : null;
      if (s) s.setHours(0, 0, 0, 0);
      const e = customEnd ? new Date(customEnd) : null;
      if (e) e.setHours(23, 59, 59, 999);

      if (s && e) return d >= s && d <= e;
      if (s) return d >= s;
      if (e) return d <= e;
      return true;
    }

    return true;
  });
};

/**
 * Filter items by workspace ID.
 */
export const filterByWorkspace = (items = [], targetWorkspaceId = 'default') => {
  if (!Array.isArray(items)) return [];
  const wsId = targetWorkspaceId || 'default';
  return items.filter(item => {
    const itemWs = item.workspaceId || 'default';
    return itemWs === wsId || (!item.workspaceId && wsId === 'default');
  });
};

/**
 * Compute Sales Summary from invoices.
 */
export const computeSalesSummary = (invoices = []) => {
  const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  
  // Filter for actual billable documents (Invoices)
  const billable = activeInvoices.filter(inv => {
    const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
    return type === 'Invoice';
  });

  let totalSales = 0;
  let totalCollected = 0;
  let totalDue = 0;
  let totalOverdue = 0;

  const counts = {
    total: billable.length,
    paid: 0,
    partial: 0,
    unpaid: 0,
    overdue: 0
  };

  const amounts = {
    paid: 0,
    partial: 0,
    unpaid: 0,
    overdue: 0
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  billable.forEach(inv => {
    const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const paid = getInvoicePaidTotal(inv);
    const due = Math.max(0, roundTo2(grandTotal - paid));

    totalSales += grandTotal;
    totalCollected += paid;
    totalDue += due;

    // Check overdue status
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    const isOverdue = (inv.paymentStatus === 'Overdue') || (dueDate && !isNaN(dueDate.getTime()) && dueDate < now && due > 0);

    if (isOverdue && due > 0) {
      counts.overdue += 1;
      amounts.overdue += due;
      totalOverdue += due;
    }

    if (paid >= grandTotal && grandTotal > 0) {
      counts.paid += 1;
      amounts.paid += grandTotal;
    } else if (paid > 0 && paid < grandTotal) {
      counts.partial += 1;
      amounts.partial += paid;
    } else if (paid === 0) {
      counts.unpaid += 1;
      amounts.unpaid += grandTotal;
    }
  });

  totalSales = roundTo2(totalSales);
  totalCollected = roundTo2(totalCollected);
  totalDue = roundTo2(totalDue);
  totalOverdue = roundTo2(totalOverdue);

  const avgInvoiceValue = counts.total > 0 ? roundTo2(totalSales / counts.total) : 0;

  return {
    totalSales,
    totalCollected,
    totalDue,
    totalOverdue,
    invoiceCount: counts.total,
    avgInvoiceValue,
    counts,
    amounts
  };
};

/**
 * Compute Collection Report from invoices.
 */
export const computeCollectionsSummary = (invoices = []) => {
  const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  const billable = activeInvoices.filter(inv => {
    const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
    return type === 'Invoice';
  });

  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalDue = 0;

  const paymentMethods = {};

  billable.forEach(inv => {
    const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const paid = getInvoicePaidTotal(inv);
    const due = Math.max(0, roundTo2(grandTotal - paid));

    totalInvoiced += grandTotal;
    totalCollected += paid;
    totalDue += due;

    if (paid > 0) {
      const method = inv.paymentMethod || inv.paymentType || 'Cash';
      paymentMethods[method] = roundTo2((paymentMethods[method] || 0) + paid);
    }
  });

  totalInvoiced = roundTo2(totalInvoiced);
  totalCollected = roundTo2(totalCollected);
  totalDue = roundTo2(totalDue);

  const collectionRate = totalInvoiced > 0 ? roundTo2((totalCollected / totalInvoiced) * 100) : (totalCollected > 0 ? 100 : 0);

  const paymentMethodBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
    method,
    amount: roundTo2(amount),
    percentage: totalCollected > 0 ? roundTo2((amount / totalCollected) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  return {
    totalInvoiced,
    totalCollected,
    totalDue,
    collectionRate,
    paymentMethodBreakdown
  };
};


/**
 * Compute Expense Summary from expenses.
 */
export const computeExpenseSummary = (expenses = []) => {
  const activeExpenses = expenses.filter(exp => !exp.isDeleted);
  let totalExpenses = 0;
  const categoryMap = {};

  activeExpenses.forEach(exp => {
    const amt = roundTo2(parseFloat(exp.amount) || 0);
    totalExpenses += amt;
    const cat = exp.category || 'General';
    categoryMap[cat] = roundTo2((categoryMap[cat] || 0) + amt);
  });

  totalExpenses = roundTo2(totalExpenses);

  const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount: roundTo2(amount),
    percentage: totalExpenses > 0 ? roundTo2((amount / totalExpenses) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return {
    totalExpenses,
    expenseCount: activeExpenses.length,
    categoryBreakdown,
    highestCategory
  };
};

/**
 * Compute Profit & Loss.
 * Net Profit = Total Sales - Total Expenses
 * Profit Margin = (Net Profit / Total Sales) * 100
 */
export const computeProfitLoss = (invoices = [], expenses = []) => {
  const { totalSales } = computeSalesSummary(invoices);
  const { totalExpenses } = computeExpenseSummary(expenses);

  const netProfit = roundTo2(totalSales - totalExpenses);
  const profitMargin = totalSales > 0 ? roundTo2((netProfit / totalSales) * 100) : 0;

  return {
    revenue: totalSales,
    expenses: totalExpenses,
    netProfit,
    profitMargin: isFinite(profitMargin) ? profitMargin : 0,
    isProfitable: netProfit >= 0
  };
};

/**
 * Compute Customer Report from invoices and customers.
 */
export const computeCustomerReport = (invoices = [], customers = []) => {
  const activeInvoices = invoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled');
  const billable = activeInvoices.filter(inv => {
    const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
    return type === 'Invoice';
  });

  const customerStats = {};

  billable.forEach(inv => {
    const custId = inv.customerId ? String(inv.customerId).trim() : (inv.customer?.id ? String(inv.customer.id).trim() : (inv.customerName ? ('name_' + inv.customerName.trim().toLowerCase()) : 'Unknown'));
    const custName = inv.customerName || inv.customer?.name || 'Unknown';
    const total = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const paid = getInvoicePaidTotal(inv);
    const due = Math.max(0, roundTo2(total - paid));

    if (!customerStats[custId]) {
      customerStats[custId] = {
        id: custId,
        name: custName,
        phone: inv.customerPhone || '',
        invoiceCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalDue: 0
      };
    }

    customerStats[custId].invoiceCount += 1;
    customerStats[custId].totalBilled = roundTo2(customerStats[custId].totalBilled + total);
    customerStats[custId].totalPaid = roundTo2(customerStats[custId].totalPaid + paid);
    customerStats[custId].totalDue = roundTo2(customerStats[custId].totalDue + due);
  });

  const customerList = Object.values(customerStats);

  const topByBilling = [...customerList].sort((a, b) => b.totalBilled - a.totalBilled);
  const topByDue = [...customerList].filter(c => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);

  const settledCount = customerList.filter(c => c.totalDue === 0 && c.totalBilled > 0).length;
  const outstandingCount = customerList.filter(c => c.totalDue > 0).length;

  return {
    totalCustomersWithInvoices: customerList.length,
    topByBilling: topByBilling.slice(0, 10),
    topByDue: topByDue.slice(0, 10),
    settledCount,
    outstandingCount,
    allCustomerStats: customerList
  };
};

/**
 * Compute Product / Inventory Report.
 */
export const computeInventoryReport = (products = [], invoices = []) => {
  const activeProducts = products.filter(p => !p.isDeleted);
  
  let totalStockValuation = 0;
  let totalRetailValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockItems = [];
  const outOfStockItems = [];

  activeProducts.forEach(prod => {
    const stock = parseFloat(prod.stock || prod.quantity) || 0;
    const cost = parseFloat(prod.costPrice || prod.purchasePrice || prod.rate || prod.price) || 0;
    const sellingPrice = parseFloat(prod.price || prod.rate || prod.sellingPrice) || 0;
    const threshold = parseFloat(prod.minStock || prod.lowStockThreshold) || 5;

    totalStockValuation += roundTo2(Math.max(0, stock) * cost);
    totalRetailValuation += roundTo2(Math.max(0, stock) * sellingPrice);

    if (stock <= 0) {
      outOfStockCount += 1;
      outOfStockItems.push(prod);
    } else if (stock <= threshold) {
      lowStockCount += 1;
      lowStockItems.push(prod);
    }
  });

  // Calculate best-selling items from invoice history
  const itemSalesMap = {};
  invoices.forEach(inv => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach(item => {
        const name = item.item || item.description || item.name || 'Unknown';
        const qty = parseFloat(item.qty || item.quantity) || 1;
        const amount = parseFloat(item.amount || (qty * (item.rate || item.price || 0))) || 0;

        if (!itemSalesMap[name]) {
          itemSalesMap[name] = { name, totalQty: 0, totalRevenue: 0 };
        }
        itemSalesMap[name].totalQty += qty;
        itemSalesMap[name].totalRevenue = roundTo2(itemSalesMap[name].totalRevenue + amount);
      });
    }
  });

  const bestSellers = Object.values(itemSalesMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  return {
    totalProducts: activeProducts.length,
    totalStockValuation: roundTo2(totalStockValuation),
    totalRetailValuation: roundTo2(totalRetailValuation),
    lowStockCount,
    outOfStockCount,
    lowStockItems,
    outOfStockItems,
    bestSellers
  };
};

/**
 * Canonical Customer Ledger & Due Calculation
 * Pure mathematical helper ensuring exact financial parity across:
 * - Customer Ledger modal
 * - Customer CRM list
 * - CreateInvoice (for auto-populating previous / old due)
 * - Due Ledger
 * - Reports & Dashboard
 *
 * @param {Object} customer - Customer object { id, name, phone, ... }
 * @param {Array} invoices - All workspace invoices
 * @param {string|null} excludeInvoiceId - Invoice ID to exclude (e.g. current invoice draft in edit mode)
 */
export const computeCustomerLedger = (customer, invoices = [], excludeInvoiceId = null) => {
  if (!customer) {
    return {
      totalBilled: 0,
      totalPaid: 0,
      totalDue: 0,
      invoiceCount: 0,
      isSettled: true,
      invoices: [],
      paymentHistory: []
    };
  }

  const custId = customer.id ? String(customer.id).trim() : null;
  const custName = (customer.name || '').trim().toLowerCase();
  const custPhone = (customer.phone || '').trim().replace(/[^0-9]/g, '');

  const customerInvoices = invoices.filter(inv => {
    if (!inv || inv.isDeleted) return false;
    if (inv.status === 'Cancelled' || inv.status === 'Void') return false;
    if (excludeInvoiceId && (inv.id === excludeInvoiceId || inv.invoiceNumber === excludeInvoiceId)) return false;

    const invCustId = inv.customerId ? String(inv.customerId).trim() : (inv.customer?.id ? String(inv.customer.id).trim() : null);
    const invCustName = (inv.customerName || inv.customer?.name || '').trim().toLowerCase();
    const invCustPhone = (inv.customerPhone || inv.customer?.phone || '').trim().replace(/[^0-9]/g, '');

    // 1. Primary Identity: customerId
    if (custId && invCustId) {
      return custId === invCustId;
    }

    // 2. Safe Fallback: only if customerId is missing from either customer or invoice
    if (custPhone && invCustPhone && custPhone.length >= 7 && invCustPhone.length >= 7) {
      if (custPhone === invCustPhone) return true;
    }

    if (custName && invCustName) {
      return custName === invCustName;
    }

    return false;
  });

  let totalBilled = 0;
  let totalPaid = 0;
  let totalDue = 0;
  const paymentHistory = [];

  customerInvoices.forEach(inv => {
    const grandTotal = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const paid = getInvoicePaidTotal(inv);
    const due = Math.max(0, roundTo2(grandTotal - paid));

    totalBilled += grandTotal;
    totalPaid += paid;
    totalDue += due;

    if (Array.isArray(inv.paymentHistory) && inv.paymentHistory.length > 0) {
      inv.paymentHistory.forEach(p => {
        paymentHistory.push({
          ...p,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber
        });
      });
    } else if (paid > 0) {
      paymentHistory.push({
        date: inv.paymentDate || inv.date || inv.createdAt,
        amount: paid,
        method: inv.paymentMethod || 'Cash',
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        notes: inv.paymentNote || ''
      });
    }
  });

  totalBilled = roundTo2(totalBilled);
  totalPaid = roundTo2(totalPaid);
  totalDue = roundTo2(totalDue);

  const sortedInvoices = [...customerInvoices].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  const sortedPayments = [...paymentHistory].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return {
    totalBilled,
    totalPaid,
    totalDue,
    invoiceCount: customerInvoices.length,
    isSettled: totalDue === 0,
    invoices: sortedInvoices,
    paymentHistory: sortedPayments
  };
};

