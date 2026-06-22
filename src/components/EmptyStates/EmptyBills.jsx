import React from 'react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyBills = ({ onCreateInvoice, onLearnMore }) => (
  <PremiumEmptyState
    type="TEMPLATES"
    icon={PremiumEmptyState.PRESETS.TEMPLATES.icon}
    title="No bills yet"
    description="Create your first invoice to start billing your customers"
    actionLabel="Create Invoice"
    onAction={onCreateInvoice}
  />
);

export default EmptyBills;
