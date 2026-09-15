// ============================================================
// COMPATIBILITY FACADE for the theme engine.
//
// The canonical implementation lives in src/services/themeApplier.js.
// This module only re-exports it under the historical `themeEngine`
// object shape so older imports and test suites keep working.
// Do NOT add logic here - update themeApplier.js instead.
// ============================================================
import { applyTheme, applyFullTheme, resolveThemeId } from './themeApplier.js';
import { ALL_THEME_COLORS, THEME_INFO } from '../utils/themeUtils.js';

export const themeEngine = {
  applyTheme,
  applyFullTheme,
  resolveThemeId,

  saveLocalThemePreference(themeId, darkMode) {
    try {
      localStorage.setItem('billqyro_theme_color', resolveThemeId(themeId) === 'custom' ? 'custom' : resolveThemeId(themeId));
      localStorage.setItem('billqyro_dark_mode', String(darkMode === true || darkMode === 'true'));
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },

  getLocalThemePreference() {
    try {
      const themeColor = resolveThemeId(localStorage.getItem('billqyro_theme_color'));
      return {
        themeColor,
        darkMode: localStorage.getItem('billqyro_dark_mode') === 'true'
      };
    } catch {
      return { themeColor: 'brand-premium', darkMode: false };
    }
  },

  getThemeInfo(id) {
    return THEME_INFO[id] || THEME_INFO['brand-premium'];
  },

  getAllThemes() {
    return Object.keys(ALL_THEME_COLORS).map(id => ({ id, ...this.getThemeInfo(id) }));
  },

  getThemePreviewColors(preset, forceMode = null) {
    const isDark = forceMode === 'dark' ? true : forceMode === 'light' ? false : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    const c = ALL_THEME_COLORS[preset] || ALL_THEME_COLORS['brand-premium'];
    return {
      background: isDark ? c.D : c.L,
      sidebar: isDark ? c.SD : c.S,
      card: isDark ? c.CD : c.C,
      text: isDark ? c.TD : c.T,
      muted: isDark ? c.MD : c.M,
      accent: isDark ? c.AD : c.A,
      border: isDark ? c.BD : c.B,
      btnFrom: isDark ? c.BFD : c.BF,
      btnTo: isDark ? c.BTD : c.BT,
      headerColor: isDark ? c.HD : c.H,
      tableHeaderBg: isDark ? c.THD : c.TH,
      totalBg: isDark ? c.TBD : c.TB
    };
  }
};
