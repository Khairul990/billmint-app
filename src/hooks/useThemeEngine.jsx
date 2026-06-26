import { useEffect } from 'react';
import { updateFaviconForTheme } from '../utils/themeIcon';

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

export const applyTheme = (themeId, brandColor = null, darkMode = false) => {
  const root = document.documentElement;

  if (darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (brandColor && themeId === 'custom') {
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

  updateFaviconForTheme(themeId);
  localStorage.setItem('billqyro_theme_color', themeId);
  localStorage.setItem('billqyro_dark_mode', String(darkMode));
};

export const useThemeEngine = (businessSettings) => {
  useEffect(() => {
    if (!businessSettings) return;

    const themeId = businessSettings.themeColor || businessSettings.themePreset || 'obsidian-gold';
    const brandColor = businessSettings.brandColor || null;
    const darkMode = businessSettings.darkMode ?? false;
    const themeType = businessSettings.themeType || 'built-in';

    const effectiveThemeId = themeType === 'custom' && brandColor ? 'custom' : themeId;
    applyTheme(effectiveThemeId, brandColor, darkMode);
  }, [businessSettings?.themeColor, businessSettings?.brandColor, businessSettings?.themeType, businessSettings?.darkMode, businessSettings?.plan]);
};
