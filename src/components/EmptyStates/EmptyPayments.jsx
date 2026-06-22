import React from 'react';
import { CheckCircle } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyPayments = ({ onCollectPayment, onLearnMore }) => (
  <PremiumEmptyState
    type="DUE_LEDGER"
    icon={CheckCircle}
    title="No payments recorded"
    description="Payments from your customers will appear here once they start paying their invoices"
    actionLabel="Collect Payment"
    onAction={onCollectPayment}
    gradient="from-emerald-500/20 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/5"
  />
);

export default EmptyPayments;
