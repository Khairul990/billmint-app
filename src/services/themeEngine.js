import { updateFaviconForTheme } from '../utils/themeIcon';
// Note: If using offline engine, dbEngine will route appropriately based on the new architecture.

import { ALL_THEME_COLORS, THEME_INFO } from '../utils/themeUtils';

export const themeEngine = {
  hexToRgb(hex) {
    if (!hex) return null;
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    let fullHex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  },

  shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    R = Math.min(255, parseInt(R * (100 + percent) / 100));
    G = Math.min(255, parseInt(G * (100 + percent) / 100));
    B = Math.min(255, parseInt(B * (100 + percent) / 100));
    const toHex = (n) => (n.toString(16).length === 1 ? '0' + n.toString(16) : n.toString(16));
    return '#' + toHex(R) + toHex(G) + toHex(B);
  },

  applyTheme(themeId, brandColor = null, darkMode = false, persist = true) {
    this.applyFullTheme({ themeColor: themeId, brandColor, darkMode }, persist);
  },

  applyFullTheme(settings, persist = true) {
    if (!settings) return;
    const root = document.documentElement;
    
    const { themeColor, brandColor, darkMode, cornerRadius, shadowIntensity, animationSpeed } = settings;
    const themeId = themeColor || 'obsidian-gold';

    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (brandColor && themeId === 'custom') {
      const rgb = this.hexToRgb(brandColor);
      if (rgb) {
        root.removeAttribute('data-theme');
        root.style.setProperty('--accent', brandColor);
        root.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        root.style.setProperty('--border-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        root.style.setProperty('--border-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
        root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${brandColor}, ${this.shadeColor(brandColor, -20)})`);
        root.style.setProperty('--chart-primary', brandColor);
        root.style.setProperty('--sidebar-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
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
      root.setAttribute('data-theme', themeId);
    }

    if (cornerRadius !== undefined) root.style.setProperty('--radius-base', `${cornerRadius}px`);
    if (animationSpeed !== undefined) root.style.setProperty('--animation-multiplier', `${animationSpeed}s`);
    if (shadowIntensity !== undefined) root.style.setProperty('--shadow-opacity', `${shadowIntensity / 100}`);

    updateFaviconForTheme(themeId);
    
    // Engine handles storage. Instead of direct localStorage, we wrap it behind engine.
    if (persist) {
      this.saveLocalThemePreference(themeId, darkMode);
    }
  },

  saveLocalThemePreference(themeId, darkMode) {
    try {
      localStorage.setItem('billqyro_theme_color', themeId);
      localStorage.setItem('billqyro_dark_mode', String(darkMode));
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  },

  getLocalThemePreference() {
    try {
      return {
        themeColor: localStorage.getItem('billqyro_theme_color') || 'obsidian-gold',
        darkMode: localStorage.getItem('billqyro_dark_mode') === 'true'
      };
    } catch (e) {
      return { themeColor: 'obsidian-gold', darkMode: false };
    }
  },

  getThemeInfo(id) {
    return THEME_INFO[id] || THEME_INFO['obsidian-gold'];
  },

  getAllThemes() {
    return Object.keys(ALL_THEME_COLORS).map(id => ({ id, ...this.getThemeInfo(id) }));
  },

  getThemePreviewColors(preset, forceMode = null) {
    const isDark = forceMode === 'dark' ? true : forceMode === 'light' ? false : document.documentElement.classList.contains('dark');
    const c = ALL_THEME_COLORS[preset] || ALL_THEME_COLORS['obsidian-gold'];
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
