export const getStudioHeaderTarget = (portalId) => {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const suffix = isMobile ? '-mobile' : '';
  return document.getElementById(`${portalId}${suffix}`) || document.getElementById(portalId);
};
