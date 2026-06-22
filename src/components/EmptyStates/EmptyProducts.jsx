import React from 'react';
import { Package } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyProducts = ({ onAddProduct, onLearnMore }) => (
  <PremiumEmptyState
    icon={Package}
    title="No products or services"
    description="Add your first product or service to start including them in your invoices"
    actionLabel="Add Product"
    onAction={onAddProduct}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyProducts;
