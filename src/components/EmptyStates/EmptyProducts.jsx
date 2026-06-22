import React from 'react';
import { Package } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyProducts = ({ onAddProduct, onLearnMore }) => (
  <PremiumEmptyState
    type="ORDERS"
    icon={Package}
    title="No products or services"
    description="Add your first product or service to start including them in your invoices"
    actionLabel="Add Product"
    onAction={onAddProduct}
    gradient="from-teal-500/20 to-cyan-500/10 dark:from-teal-500/15 dark:to-cyan-500/5"
  />
);

export default EmptyProducts;
