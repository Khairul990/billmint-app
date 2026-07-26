import { getCategoryExperience } from '../config/categoryExperience';

export const getCategoryLabel = (wsType, key) => {
  const exp = getCategoryExperience(wsType);
  return exp.labels[key] || key;
};

export const getCategoryHints = (wsType) => {
  const exp = getCategoryExperience(wsType);
  return {
    icon: exp.icon,
    labels: exp.labels,
    dashboardHints: exp.dashboardHints,
    quickTips: exp.quickTips
  };
};
