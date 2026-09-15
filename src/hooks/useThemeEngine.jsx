// React entry point for the theme engine.
// All applying logic lives in src/services/themeApplier.js (single source
// of truth). This file only re-exports it and provides the React hook.
import { useEffect } from 'react';
import { applyTheme, applyFullTheme, resolveThemeId, resolveDarkMode } from '../services/themeApplier.js';

export { applyTheme, applyFullTheme, resolveThemeId, resolveDarkMode };

export const useThemeEngine = (businessSettings) => {
  useEffect(() => {
    if (!businessSettings) return;

    applyFullTheme(businessSettings);
  }, [businessSettings?.themeColor, businessSettings?.brandColor, businessSettings?.themeType, businessSettings?.darkMode, businessSettings?.plan, businessSettings?.cornerRadius, businessSettings?.animationSpeed, businessSettings?.shadowIntensity]);
};
