import React from 'react';
import PremiumEmptyState from '../PremiumEmptyState';

const EmptyReports = ({ onGenerateReport, onLearnMore }) => (
  <PremiumEmptyState
    type="REPORTS"
    onAction={onGenerateReport}
  />
);

export default EmptyReports;
