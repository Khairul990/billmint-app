import React from 'react';
import { CheckCircle } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyPayments = ({ onCollectPayment, onLearnMore }) => (
  <PremiumEmptyState
    icon={CheckCircle}
    title="No payments recorded"
    description="Payments from your customers will appear here once they start paying their invoices"
    actionLabel="Collect Payment"
    onAction={onCollectPayment}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyPayments;
