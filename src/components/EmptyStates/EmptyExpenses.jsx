import React from 'react';
import { Receipt } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyExpenses = ({ onAddExpense, onLearnMore }) => (
  <PremiumEmptyState
    icon={Receipt}
    title="No expenses recorded"
    description="Track your business expenses to get a complete picture of your profitability"
    actionLabel="Add Expense"
    onAction={onAddExpense}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyExpenses;
