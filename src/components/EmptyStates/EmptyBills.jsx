import React from 'react';
import { FileText } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyBills = ({ onCreateInvoice, onLearnMore }) => (
  <PremiumEmptyState
    icon={FileText}
    title="No bills yet"
    description="Create your first invoice to start billing your customers"
    actionLabel="Create Invoice"
    onAction={onCreateInvoice}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyBills;
