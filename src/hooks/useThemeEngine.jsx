import { useEffect } from 'react';
import { updateFaviconForTheme } from '../utils/themeIcon';

// Helper to convert HEX to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper to darken a hex color (for gradients)
const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

export const useThemeEngine = (businessSettings) => {
  useEffect(() => {
    if (!businessSettings) return;

    const isPremium = businessSettings?.plan === 'premium' || businessSettings?.plan === 'lifetime';
    const hasCustomTheme = businessSettings?.themeType === 'custom' && businessSettings?.brandColor;
    const root = document.documentElement;

    // Default built-in theme
    const validThemes = ['obsidian-gold', 'arctic-teal', 'sapphire-noir', 'rose-platinum', 'carbon-violet', 'graphite-copper', 'arctic-diamond', 'emerald-royal', 'midnight-ruby', 'titanium-blue', 'pink', 'indigo', 'emerald', 'rose', 'midnight', 'champagne', 'ruby', 'ocean-blue', 'sunset-orange', 'forest-green', 'golden-luxury', 'purple-haze', 'crimson-red', 'silver-elite', 'cyber-blue', 'deep-bluish-green', 'deep-blue-premium', 'crimson-business', 'luxury-brown', 'noir-black', 'crimson-gold', 'royal-black', 'luxury-cream'];
    let themeName = businessSettings?.themeColor;
    
    if (!themeName || !validThemes.includes(themeName)) {
      themeName = localStorage.getItem('billqyro_admin_default_theme') || 'obsidian-gold';
    }
    
    if (!validThemes.includes(themeName)) {
      themeName = 'obsidian-gold';
    }
    
    if (isPremium && hasCustomTheme) {
      // 1. Dynamic SVG Smart Theme Engine (Custom Brand Color)
      const hex = businessSettings.brandColor;
      const rgb = hexToRgb(hex);
      
      if (rgb) {
        // Remove data-theme to prevent conflicts
        root.removeAttribute('data-theme');
        
        // Define Custom CSS Variables mapping Tailwind tokens
        root.style.setProperty('--accent', hex);
        root.style.setProperty('--accent-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        root.style.setProperty('--border-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        root.style.setProperty('--border-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
        
        // Generate a smart gradient based on the brand color
        const gradientEnd = shadeColor(hex, -20); // darken by 20%
        root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${hex}, ${gradientEnd})`);
        
        // Ensure chart colors update
        root.style.setProperty('--chart-primary', hex);
        
        // Apply a subtle tint to the active sidebar items
        root.style.setProperty('--sidebar-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
        
        // Ensure favicon reflects standard theme even if custom color is used
        updateFaviconForTheme(themeName);
      }
    } else {
      // 2. Pre-built Theme (Free/Pro users)
      // Clear inline styles to fallback to index.css
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-light');
      root.style.removeProperty('--border-soft');
      root.style.removeProperty('--border-strong');
      root.style.removeProperty('--accent-glow');
      root.style.removeProperty('--accent-gradient');
      root.style.removeProperty('--chart-primary');
      root.style.removeProperty('--sidebar-active');
      
      root.setAttribute('data-theme', themeName);
      updateFaviconForTheme(themeName);
    }
  }, [businessSettings?.themeColor, businessSettings?.brandColor, businessSettings?.themeType, businessSettings?.plan]);
};
