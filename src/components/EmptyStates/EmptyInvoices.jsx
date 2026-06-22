import React from 'react';
import { FileText } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyInvoices = ({ onCreateInvoice, onLearnMore, invoiceLabel = 'Bills' }) => (
  <PremiumEmptyState
    icon={FileText}
    title={`No ${invoiceLabel.toLowerCase()} yet`}
    description={`Create your first ${invoiceLabel.toLowerCase()} to start billing your customers and tracking payments`}
    actionLabel={`Create ${invoiceLabel.slice(0, -1)}`}
    onAction={onCreateInvoice}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyInvoices;
