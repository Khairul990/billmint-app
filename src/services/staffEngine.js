import { getStaffs, saveStaff, deleteStaff, restoreStaff } from './dbEngine.js';

class StaffEngine {
  async getStaffs(includeDeleted = false) {
    return await getStaffs(includeDeleted);
  }

  async getStaffById(staffId) {
    const staffs = await this.getStaffs();
    return staffs.find(c => c.id === staffId);
  }

  async saveStaff(staffData) {
    if (!staffData.createdAt) staffData.createdAt = new Date().toISOString();
    staffData.updatedAt = new Date().toISOString();
    return await saveStaff(staffData);
  }

  async deleteStaff(staffId) {
    return await deleteStaff(staffId);
  }

  async restoreStaff(staffId) {
    return await restoreStaff(staffId);
  }

  // Canonical staff payable ledger. New invoices use line-level workAllocations;
  // legacy invoices using staffId are still supported for backward compatibility.
  calculatePayableLedger(staff, invoices = [], bankTransactions = []) {
    let totalEarned = 0;

    invoices.forEach(inv => {
      const allocations = Array.isArray(inv.workAllocations) ? inv.workAllocations : [];
      const allocated = allocations
        .filter(a => a.type === 'staff' && a.staffId === staff.id)
        .reduce((sum, a) => sum + (Number(a.costAmount) || 0), 0);

      if (allocated > 0) {
        totalEarned += allocated;
      } else if (inv.staffId === staff.id) {
        // Legacy invoice compatibility: old records may have only staffId.
        totalEarned += Number(inv.total || inv.grandTotal || 0) || 0;
      }
    });

    const staffPayments = bankTransactions.filter(tx =>
      tx.staffId === staff.id || tx.staff?.id === staff.id
    );
    let totalPaid = 0;
    let totalAdvance = 0;

    staffPayments.forEach(tx => {
      const amount = Number(tx.amountRupees || tx.amount || 0) || 0;
      if (tx.category === 'Staff Payment' && tx.direction === 'OUT') totalPaid += amount;
      if (tx.category === 'Staff Advance' && tx.direction === 'OUT') totalAdvance += amount;
    });

    const remainingPayable = Math.max(0, totalEarned - totalPaid - totalAdvance);
    return { totalEarned, totalPaid, totalAdvance, remainingPayable };
  }
}

export const staffEngine = new StaffEngine();
