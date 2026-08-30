import { query } from '../../db/pool.js';

export class ReportRepository {
  static async getDashboardSummary(workspaceId) {
    // 1. Invoices stats
    const invRes = await query(
      `SELECT 
         COUNT(*) AS total_invoices,
         COUNT(*) FILTER (WHERE status = 'Paid') AS paid_invoices,
         COUNT(*) FILTER (WHERE status = 'Unpaid') AS unpaid_invoices,
         COUNT(*) FILTER (WHERE status = 'Partially Paid') AS partially_paid_invoices,
         COALESCE(SUM(grand_total), 0) AS total_sales,
         COALESCE(SUM(amount_paid), 0) AS total_paid_invoices,
         COALESCE(SUM(balance_due), 0) AS total_due
       FROM invoices
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 2. Payments stats
    const payRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_payments
       FROM payments
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 3. Expenses stats
    const expRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM expenses
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    const inv = invRes.rows[0] || {};
    const totalSales = parseFloat(inv.total_sales || 0);
    const totalPaid = Math.max(parseFloat(inv.total_paid_invoices || 0), parseFloat(payRes.rows[0]?.total_payments || 0));
    const totalDue = parseFloat(inv.total_due || 0);
    const totalExpenses = parseFloat(expRes.rows[0]?.total_expenses || 0);
    const netAmount = Math.round((totalPaid - totalExpenses) * 100) / 100;

    return {
      totalInvoices: parseInt(inv.total_invoices || 0, 10),
      paidInvoices: parseInt(inv.paid_invoices || 0, 10),
      unpaidInvoices: parseInt(inv.unpaid_invoices || 0, 10),
      partiallyPaidInvoices: parseInt(inv.partially_paid_invoices || 0, 10),
      totalSales: Math.round(totalSales * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netAmount
    };
  }

  static async getSalesReport(workspaceId, { from = null, to = null, status = null, limit = 50, offset = 0 } = {}) {
    const params = [workspaceId];
    let whereSql = ` WHERE workspace_id = $1 AND is_deleted = FALSE`;

    if (from) {
      params.push(from);
      whereSql += ` AND date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      whereSql += ` AND date <= $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereSql += ` AND status = $${params.length}`;
    }

    // Totals query
    const totalsRes = await query(
      `SELECT 
         COUNT(*) AS invoice_count,
         COALESCE(SUM(subtotal), 0) AS subtotal,
         COALESCE(SUM(tax_total), 0) AS tax_total,
         COALESCE(SUM(discount_total), 0) AS discount_total,
         COALESCE(SUM(grand_total), 0) AS grand_total,
         COALESCE(SUM(amount_paid), 0) AS amount_paid,
         COALESCE(SUM(balance_due), 0) AS balance_due
       FROM invoices
       ${whereSql}`,
      params
    );

    // List query
    const listParams = [...params, limit, offset];
    const listRes = await query(
      `SELECT id, invoice_number, date, due_date, status, subtotal, tax_total, discount_total, grand_total, amount_paid, balance_due, created_at
       FROM invoices
       ${whereSql}
       ORDER BY date DESC, created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const totals = totalsRes.rows[0] || {};
    return {
      summary: {
        invoiceCount: parseInt(totals.invoice_count || 0, 10),
        subtotal: parseFloat(totals.subtotal || 0),
        tax: parseFloat(totals.tax_total || 0),
        discount: parseFloat(totals.discount_total || 0),
        grandTotal: parseFloat(totals.grand_total || 0),
        amountPaid: parseFloat(totals.amount_paid || 0),
        balanceDue: parseFloat(totals.balance_due || 0)
      },
      invoices: listRes.rows.map(r => ({
        ...r,
        subtotal: parseFloat(r.subtotal),
        tax_total: parseFloat(r.tax_total),
        discount_total: parseFloat(r.discount_total),
        grand_total: parseFloat(r.grand_total),
        amount_paid: parseFloat(r.amount_paid),
        balance_due: parseFloat(r.balance_due)
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(totals.invoice_count || 0, 10)
      }
    };
  }

  static async getPaymentsReport(workspaceId, { from = null, to = null, limit = 50, offset = 0 } = {}) {
    const params = [workspaceId];
    let whereSql = ` WHERE workspace_id = $1 AND is_deleted = FALSE`;

    if (from) {
      params.push(from);
      whereSql += ` AND payment_date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      whereSql += ` AND payment_date <= $${params.length}`;
    }

    // Totals query
    const totalsRes = await query(
      `SELECT 
         COUNT(*) AS payment_count,
         COALESCE(SUM(amount), 0) AS total_amount
       FROM payments
       ${whereSql}`,
      params
    );

    // List query
    const listParams = [...params, limit, offset];
    const listRes = await query(
      `SELECT id, invoice_id, payment_number, amount, payment_method, payment_date, reference_note, created_at
       FROM payments
       ${whereSql}
       ORDER BY payment_date DESC, created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const totals = totalsRes.rows[0] || {};
    return {
      summary: {
        paymentCount: parseInt(totals.payment_count || 0, 10),
        totalAmount: parseFloat(totals.total_amount || 0)
      },
      payments: listRes.rows.map(r => ({
        ...r,
        amount: parseFloat(r.amount)
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(totals.payment_count || 0, 10)
      }
    };
  }

  static async getExpensesReport(workspaceId, { from = null, to = null } = {}) {
    const params = [workspaceId];
    let whereSql = ` WHERE workspace_id = $1 AND is_deleted = FALSE`;

    if (from) {
      params.push(from);
      whereSql += ` AND date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      whereSql += ` AND date <= $${params.length}`;
    }

    const summaryRes = await query(
      `SELECT 
         COUNT(*) AS expense_count,
         COALESCE(SUM(amount), 0) AS total_amount
       FROM expenses
       ${whereSql}`,
      params
    );

    const breakdownRes = await query(
      `SELECT 
         category,
         COUNT(*) AS count,
         COALESCE(SUM(amount), 0) AS total_amount
       FROM expenses
       ${whereSql}
       GROUP BY category
       ORDER BY total_amount DESC`,
      params
    );

    const summary = summaryRes.rows[0] || {};
    return {
      summary: {
        expenseCount: parseInt(summary.expense_count || 0, 10),
        totalAmount: parseFloat(summary.total_amount || 0)
      },
      byCategory: breakdownRes.rows.map(r => ({
        category: r.category,
        count: parseInt(r.count, 10),
        totalAmount: parseFloat(r.total_amount)
      }))
    };
  }

  static async getBankLedgerReport(workspaceId, { from = null, to = null, limit = 50, offset = 0 } = {}) {
    const params = [workspaceId];
    let whereSql = ` WHERE workspace_id = $1 AND is_deleted = FALSE`;

    if (from) {
      params.push(from);
      whereSql += ` AND date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      whereSql += ` AND date <= $${params.length}`;
    }

    const summaryRes = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS total_expense,
         COUNT(*) AS entry_count
       FROM bank_ledger_entries
       ${whereSql}`,
      params
    );

    const listParams = [...params, limit, offset];
    const listRes = await query(
      `SELECT id, type, amount, description, date, created_at
       FROM bank_ledger_entries
       ${whereSql}
       ORDER BY date DESC, created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const summary = summaryRes.rows[0] || {};
    const totalIncome = parseFloat(summary.total_income || 0);
    const totalExpense = parseFloat(summary.total_expense || 0);
    const netBalance = Math.round((totalIncome - totalExpense) * 100) / 100;

    return {
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netBalance,
        entryCount: parseInt(summary.entry_count || 0, 10)
      },
      entries: listRes.rows.map(r => ({
        ...r,
        amount: parseFloat(r.amount)
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(summary.entry_count || 0, 10)
      }
    };
  }
}
