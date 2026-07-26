import React from 'react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyCustomers = ({ onAddCustomer, onLearnMore }) => (
  <PremiumEmptyState
    type="CUSTOMERS"
    onAction={onAddCustomer}
  />
);

export default EmptyCustomers;
