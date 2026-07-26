import React from 'react';
import { Receipt } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyExpenses = ({ onAddExpense, onLearnMore }) => (
  <PremiumEmptyState
    type="DUE_LEDGER"
    icon={Receipt}
    title="No expenses recorded"
    description="Track your business expenses to get a complete picture of your profitability"
    actionLabel="Add Expense"
    onAction={onAddExpense}
    gradient="from-red-500/20 to-rose-500/10 dark:from-red-500/15 dark:to-rose-500/5"
  />
);

export default EmptyExpenses;
