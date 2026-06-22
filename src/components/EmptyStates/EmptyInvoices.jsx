import React from 'react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyInvoices = ({ onCreateInvoice, onLearnMore, invoiceLabel = 'Bills' }) => (
  <PremiumEmptyState
    type="TEMPLATES"
    icon={PremiumEmptyState.PRESETS.TEMPLATES.icon}
    title={`No ${invoiceLabel.toLowerCase()} yet`}
    description={`Create your first ${invoiceLabel.toLowerCase()} to start billing your customers and tracking payments`}
    actionLabel={`Create ${invoiceLabel.slice(0, -1)}`}
    onAction={onCreateInvoice}
  />
);

export default EmptyInvoices;
