import * as dbEngine from './dbEngine';

class ExpenseEngine {
  async getExpenses() {
    if (dbEngine.getExpenses) {
      return await dbEngine.getExpenses();
    }
    const raw = localStorage.getItem(dbEngine.KEYS.EXPENSES || 'billqyro_demo_expenses');
    return raw ? JSON.parse(raw) : [];
  }

  async getExpenseById(expenseId) {
    const expenses = await this.getExpenses();
    return expenses.find(e => e.id === expenseId);
  }

  async saveExpense(expenseData) {
    if (!expenseData.id) {
      expenseData.id = `exp_${Date.now()}`;
    }
    expenseData.updatedAt = new Date().toISOString();
    
    if (dbEngine.saveExpense) {
      return await dbEngine.saveExpense(expenseData);
    }
    
    // Fallback
    const expenses = await this.getExpenses();
    const index = expenses.findIndex(e => e.id === expenseData.id);
    if (index >= 0) {
      expenses[index] = expenseData;
    } else {
      expenses.push(expenseData);
    }
    localStorage.setItem(dbEngine.KEYS.EXPENSES || 'billqyro_demo_expenses', JSON.stringify(expenses));
    return { updatedExpenses: expenses };
  }

  async deleteExpense(expenseId) {
    if (dbEngine.deleteExpense) {
      return await dbEngine.deleteExpense(expenseId);
    }
    
    // Fallback
    const expenses = await this.getExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    localStorage.setItem(dbEngine.KEYS.EXPENSES || 'billqyro_demo_expenses', JSON.stringify(filtered));
    return { updatedExpenses: filtered };
  }

  // Calculate total expenses for reporting
  calculateTotalExpenses(expenses) {
    return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }
}

export const expenseEngine = new ExpenseEngine();
