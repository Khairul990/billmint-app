import React from 'react';
import { CreditCard } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyDueLedger = ({ onViewInvoices, onLearnMore }) => (
  <PremiumEmptyState
    icon={CreditCard}
    title="No dues to collect"
    description="You're all caught up! When you create invoices with payment terms, they'll appear here for collection"
    actionLabel="View Invoices"
    onAction={onViewInvoices}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyDueLedger;
