import React from 'react';
import { BarChart } from 'lucide-react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyReports = ({ onGenerateReport, onLearnMore }) => (
  <PremiumEmptyState
    icon={BarChart}
    title="No reports available"
    description="Generate invoices and payments to see your business insights"
    actionLabel="Generate Report"
    onAction={onGenerateReport}
    secondaryLabel="Learn More"
    onSecondary={onLearnMore}
  />
);

export default EmptyReports;
