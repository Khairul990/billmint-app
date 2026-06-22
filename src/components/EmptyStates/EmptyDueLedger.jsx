import React from 'react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyDueLedger = ({ onViewInvoices, onLearnMore }) => (
  <PremiumEmptyState
    type="DUE_LEDGER"
    onAction={onViewInvoices}
  />
);

export default EmptyDueLedger;
