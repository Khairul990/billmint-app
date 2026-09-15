// ============================================================
// CANONICAL THEME APPLIER - the single source of truth for
// applying themes to the document. Pure DOM logic, no React.
//
// Everyone must import from here:
//   - src/hooks/useThemeEngine.jsx  (React hook + re-exports)
//   - src/services/themeEngine.js   (compat facade for old imports)
//
// Guards handled here:
//   1. Legacy mode values (light/dark/auto/classic) saved as themes
//      heal to the official default theme.
//   2. Unknown or removed theme ids (stale browser saves) heal to
//      the official default theme.
//   3. darkMode may arrive as boolean or "true"/"false" strings.
// ============================================================
import { updateFaviconForTheme } from '../utils/themeIcon.js';
import { ALL_THEME_COLORS } from '../utils/themeUtils.js';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.min(255, parseInt(R * (100 + percent) / 100));
  G = Math.min(255, parseInt(G * (100 + percent) / 100));
  B = Math.min(255, parseInt(B * (100 + percent) / 100));
  const toHex = (n) => (n.toString(16).length === 1 ? '0' + n.toString(16) : n.toString(16));
  return '#' + toHex(R) + toHex(G) + toHex(B);
};

export const LEGACY_THEME_VALUES = ['light', 'dark', 'auto', 'classic'];
export const DEFAULT_THEME_ID = 'sapphire-noir';

// Resolve any stored/raw theme id to a valid catalog id.
// Returns 'custom' untouched (custom brand colors are applied inline).
export const resolveThemeId = (themeId) => {
  let id = themeId || DEFAULT_THEME_ID;
  if (LEGACY_THEME_VALUES.includes(id)) id = DEFAULT_THEME_ID;
  if (id !== 'custom' && !ALL_THEME_COLORS[id]) id = DEFAULT_THEME_ID;
  return id;
};

// Normalize darkMode which may be boolean or string.
export const resolveDarkMode = (darkMode) => darkMode === true || darkMode === 'true';

export const applyTheme = (themeId, brandColor = null, darkMode = false, persist = true) => {
  applyFullTheme({ themeColor: themeId, brandColor, darkMode }, persist);
};

export const applyFullTheme = (settings, persist = true) => {
  if (!settings) return;
  const root = document.documentElement;

  const { themeColor, brandColor, cornerRadius, shadowIntensity, animationSpeed, themeType } = settings;
  const isDark = resolveDarkMode(settings.darkMode);
  const themeId = (themeType === 'custom' && brandColor) ? 'custom' : (themeColor || DEFAULT_THEME_ID);
  const effectiveThemeId = resolveThemeId(themeId);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Custom brand color path: inline CSS variables, no data-theme block.
  if (brandColor && effectiveThemeId === 'custom') {
    const rgb = hexToRgb(brandColor);
    if (rgb) {
      root.removeAttribute('data-theme');
      root.style.setProperty('--accent', brandColor);
      root.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      root.style.setProperty('--border-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      root.style.setProperty('--border-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
      root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${brandColor}, ${shadeColor(brandColor, -20)})`);
      root.style.setProperty('--chart-primary', brandColor);
      root.style.setProperty('--sidebar-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      root.style.setProperty('--luxury-accent', shadeColor(brandColor, isDark ? 20 : -10));
      root.style.setProperty('--theme-tint-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.04 : 0.02})`);
      root.style.setProperty('--theme-tint-surface', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.06 : 0.03})`);
      root.style.setProperty('--theme-tint-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.12 : 0.08})`);
      root.style.setProperty('--theme-tint-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.10 : 0.05})`);
    }
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-light');
    root.style.removeProperty('--border-soft');
    root.style.removeProperty('--border-strong');
    root.style.removeProperty('--accent-glow');
    root.style.removeProperty('--accent-gradient');
    root.style.removeProperty('--chart-primary');
    root.style.removeProperty('--sidebar-active');
    root.style.removeProperty('--luxury-accent');
    root.style.removeProperty('--theme-tint-bg');
    root.style.removeProperty('--theme-tint-surface');
    root.style.removeProperty('--theme-tint-border');
    root.style.removeProperty('--theme-tint-hover');
    root.setAttribute('data-theme', effectiveThemeId);
  }

  // Modifiers
  if (cornerRadius !== undefined) root.style.setProperty('--radius-base', `${cornerRadius}px`);
  if (animationSpeed !== undefined) root.style.setProperty('--animation-multiplier', `${animationSpeed}s`);
  if (shadowIntensity !== undefined) root.style.setProperty('--shadow-opacity', `${shadowIntensity / 100}`);

  updateFaviconForTheme(effectiveThemeId);

  if (persist) {
    try {
      localStorage.setItem('billqyro_theme_color', effectiveThemeId === 'custom' ? 'custom' : effectiveThemeId);
      localStorage.setItem('billqyro_dark_mode', String(isDark));
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  }
};
