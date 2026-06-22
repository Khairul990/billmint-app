import React from 'react';
import { User } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyCustomers = ({ onAddCustomer, onLearnMore }) => (
  <PremiumEmptyState
    icon={User}
    title="No customers registered"
    description="Add your first customer to start building your client base"
    actionLabel="Add Customer"
    onAction={onAddCustomer}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyCustomers;
