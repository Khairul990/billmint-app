import { updateFaviconForTheme } from '../utils/themeIcon';
// Note: If using offline engine, dbEngine will route appropriately based on the new architecture.

export const ALL_THEME_COLORS = {
  'obsidian-gold': { L: '#F8F3E7', D: '#08080C', S: '#F8F3E7', SD: '#08080C', C: '#FFFFFF', CD: '#131318', T: '#1A1A1A', TD: '#F5F0E8', M: '#6B5B3E', MD: '#B8A98D', A: '#B8860B', AD: '#C9A84C', B: 'rgba(184,134,11,0.25)', BD: 'rgba(201,168,76,0.22)', BF: '#B8860B', BFD: '#C9A84C', BT: '#1F2937', BTD: '#E8C97A', H: '#1A1A1A', HD: '#F5F0E8', TH: '#FFF9EC', THD: '#0F0F14', TB: '#FFFFFF', TBD: '#08080C' },
  'arctic-teal': { L: '#EAF7F5', D: '#050D0F', S: '#EAF7F5', SD: '#050D0F', C: '#FFFFFF', CD: '#0C1518', T: '#10201D', TD: '#E8F5F2', M: '#4B6F68', MD: '#7CB8A8', A: '#009E7F', AD: '#00C896', B: 'rgba(0,158,127,0.24)', BD: 'rgba(0,200,150,0.22)', BF: '#009E7F', BFD: '#00C896', BT: '#0F766E', BTD: '#34E8B0', H: '#10201D', HD: '#E8F5F2', TH: '#F4FFFD', THD: '#080F12', TB: '#FFFFFF', TBD: '#050D0F' },
  'sapphire-noir': { L: '#EEF4FF', D: '#04060F', S: '#EEF4FF', SD: '#04060F', C: '#FFFFFF', CD: '#0A0E1A', T: '#0F172A', TD: '#E8EEFF', M: '#4B5D7A', MD: '#8EA6D9', A: '#2563EB', AD: '#4F8EF7', B: 'rgba(37,99,235,0.22)', BD: 'rgba(79,142,247,0.22)', BF: '#2563EB', BFD: '#4F8EF7', BT: '#1E3A8A', BTD: '#82B1FF', H: '#0F172A', HD: '#E8EEFF', TH: '#F7FAFF', THD: '#060914', TB: '#FFFFFF', TBD: '#04060F' },
  'rose-platinum': { L: '#FFF1F5', D: '#0C080A', S: '#FFF1F5', SD: '#0C080A', C: '#FFFFFF', CD: '#180F13', T: '#2A1118', TD: '#F5EEF0', M: '#7A4B58', MD: '#B98A98', A: '#C75C75', AD: '#E8A0B0', B: 'rgba(199,92,117,0.24)', BD: 'rgba(232,160,176,0.22)', BF: '#C75C75', BFD: '#E8A0B0', BT: '#8B3A4A', BTD: '#F5C6D2', H: '#2A1118', HD: '#F5EEF0', TH: '#FFF7FA', THD: '#120C0F', TB: '#FFFFFF', TBD: '#0C080A' },
  'carbon-violet': { L: '#F3EFFF', D: '#06040C', S: '#F3EFFF', SD: '#06040C', C: '#FFFFFF', CD: '#0D0A18', T: '#1E1238', TD: '#EEEAFF', M: '#67548A', MD: '#A893D9', A: '#7C3AFF', AD: '#9B6FFF', B: 'rgba(124,58,255,0.22)', BD: 'rgba(155,111,255,0.22)', BF: '#7C3AFF', BFD: '#9B6FFF', BT: '#4C1D95', BTD: '#C4A0FF', H: '#1E1238', HD: '#EEEAFF', TH: '#FAF7FF', THD: '#090612', TB: '#FFFFFF', TBD: '#06040C' },
  'graphite-copper': { L: '#FFF2E8', D: '#0A0806', S: '#FFF2E8', SD: '#0A0806', C: '#FFFFFF', CD: '#161008', T: '#24130C', TD: '#F5EDE8', M: '#7A5642', MD: '#B88A72', A: '#B76535', AD: '#D4825A', B: 'rgba(183,101,53,0.25)', BD: 'rgba(212,130,90,0.22)', BF: '#B76535', BFD: '#D4825A', BT: '#4B2A1A', BTD: '#EAA880', H: '#24130C', HD: '#F5EDE8', TH: '#FFF8F2', THD: '#100C08', TB: '#FFFFFF', TBD: '#0A0806' },
  'arctic-diamond': { L: '#F8FBFF', D: '#0B1220', S: '#F8FBFF', SD: '#0B1220', C: '#FFFFFF', CD: '#1E293B', T: '#0F172A', TD: '#F8FAFC', M: '#64748B', MD: '#94A3B8', A: '#60A5FA', AD: '#93C5FD', B: 'rgba(96,165,250,0.20)', BD: 'rgba(147,197,253,0.20)', BF: '#60A5FA', BFD: '#93C5FD', BT: '#CBD5E1', BTD: '#E2E8F0', H: '#0F172A', HD: '#F8FAFC', TH: '#F3F7FC', THD: '#111827', TB: '#FFFFFF', TBD: '#0B1220' },
  'emerald-royal': { L: '#F7FCF9', D: '#08120D', S: '#F7FCF9', SD: '#08120D', C: '#FFFFFF', CD: '#14261C', T: '#052E16', TD: '#ECFDF5', M: '#4B635A', MD: '#A7C7B7', A: '#10B981', AD: '#34D399', B: 'rgba(16,185,129,0.20)', BD: 'rgba(52,211,153,0.20)', BF: '#10B981', BFD: '#34D399', BT: '#D4AF37', BTD: '#F4D03F', H: '#052E16', HD: '#ECFDF5', TH: '#F0FDF4', THD: '#102018', TB: '#FFFFFF', TBD: '#08120D' },
  'midnight-ruby': { L: '#FFF8F8', D: '#090506', S: '#FFF8F8', SD: '#090506', C: '#FFFFFF', CD: '#1C0D10', T: '#2B0D0D', TD: '#FEF2F2', M: '#7C4A4A', MD: '#C9A6A6', A: '#C0392B', AD: '#E74C3C', B: 'rgba(192,57,43,0.20)', BD: 'rgba(231,76,60,0.20)', BF: '#C0392B', BFD: '#E74C3C', BT: '#7F1D1D', BTD: '#FCA5A5', H: '#2B0D0D', HD: '#FEF2F2', TH: '#FFF1F2', THD: '#13090B', TB: '#FFFFFF', TBD: '#090506' },
  'titanium-blue': { L: '#F4F8FC', D: '#0A0F1A', S: '#F4F8FC', SD: '#0A0F1A', C: '#FFFFFF', CD: '#172033', T: '#0F172A', TD: '#F8FAFC', M: '#64748B', MD: '#A1AFC7', A: '#2563EB', AD: '#60A5FA', B: 'rgba(37,99,235,0.20)', BD: 'rgba(96,165,250,0.20)', BF: '#2563EB', BFD: '#60A5FA', BT: '#94A3B8', BTD: '#CBD5E1', H: '#0F172A', HD: '#F8FAFC', TH: '#F8FAFC', THD: '#111827', TB: '#FFFFFF', TBD: '#0A0F1A' },
  'pink-blossom': { L: '#FFF1F7', D: '#120811', S: '#FFF1F7', SD: '#120811', C: '#FFFFFF', CD: '#1F0F1C', T: '#2D0F1F', TD: '#FDE8F0', M: '#7A4B63', MD: '#BA8CA5', A: '#EC4899', AD: '#F472B6', B: 'rgba(236,72,153,0.20)', BD: 'rgba(244,114,182,0.20)', BF: '#EC4899', BFD: '#F472B6', BT: '#BE185D', BTD: '#F9A8D4', H: '#2D0F1F', HD: '#FDE8F0', TH: '#FDF2F8', THD: '#160A14', TB: '#FFFFFF', TBD: '#120811' },
  'ocean-waves': { L: '#EEF9FF', D: '#04141F', S: '#EEF9FF', SD: '#04141F', C: '#FFFFFF', CD: '#0B2030', T: '#0C2D48', TD: '#E0F2FE', M: '#4B7B9B', MD: '#7EADCE', A: '#0EA5E9', AD: '#38BDF8', B: 'rgba(14,165,233,0.20)', BD: 'rgba(56,189,248,0.20)', BF: '#0EA5E9', BFD: '#38BDF8', BT: '#0284C7', BTD: '#7DD3FC', H: '#0C2D48', HD: '#E0F2FE', TH: '#F0F9FF', THD: '#082034', TB: '#FFFFFF', TBD: '#04141F' },
  'lush-green': { L: '#EEFCF2', D: '#04140A', S: '#EEFCF2', SD: '#04140A', C: '#FFFFFF', CD: '#0B2414', T: '#0B3D1A', TD: '#DCFCE7', M: '#4B7B5E', MD: '#7EAD92', A: '#22C55E', AD: '#4ADE80', B: 'rgba(34,197,94,0.20)', BD: 'rgba(74,222,128,0.20)', BF: '#22C55E', BFD: '#4ADE80', BT: '#16A34A', BTD: '#86EFAC', H: '#0B3D1A', HD: '#DCFCE7', TH: '#F0FDF4', THD: '#082014', TB: '#FFFFFF', TBD: '#04140A' },
  'sunset-orange': { L: '#FFF3ED', D: '#140A06', S: '#FFF3ED', SD: '#140A06', C: '#FFFFFF', CD: '#24140C', T: '#3D1A0B', TD: '#FFEDD5', M: '#7B5A4B', MD: '#AE9588', A: '#F97316', AD: '#FB923C', B: 'rgba(249,115,22,0.20)', BD: 'rgba(251,146,60,0.20)', BF: '#F97316', BFD: '#FB923C', BT: '#EA580C', BTD: '#FDBA74', H: '#3D1A0B', HD: '#FFEDD5', TH: '#FFF7ED', THD: '#1C0F08', TB: '#FFFFFF', TBD: '#140A06' },
  'midnight-blue': { L: '#EEF2FF', D: '#040814', S: '#EEF2FF', SD: '#040814', C: '#FFFFFF', CD: '#0C1428', T: '#0F1B2D', TD: '#E0E7FF', M: '#4B5E7B', MD: '#8A9FBF', A: '#1E3A5F', AD: '#2D5A8E', B: 'rgba(30,58,95,0.20)', BD: 'rgba(45,90,142,0.20)', BF: '#1E3A5F', BFD: '#2D5A8E', BT: '#0F1B2D', BTD: '#5B8FC4', H: '#0F1B2D', HD: '#E0E7FF', TH: '#F0F4FF', THD: '#080E20', TB: '#FFFFFF', TBD: '#040814' },
  'royal-purple': { L: '#F5F0FF', D: '#0C0418', S: '#F5F0FF', SD: '#0C0418', C: '#FFFFFF', CD: '#180C2C', T: '#2D0F4D', TD: '#EDE0FF', M: '#6B4B8A', MD: '#A68DC4', A: '#A855F7', AD: '#C084FC', B: 'rgba(168,85,247,0.20)', BD: 'rgba(192,132,252,0.20)', BF: '#A855F7', BFD: '#C084FC', BT: '#7C3AED', BTD: '#D8B4FE', H: '#2D0F4D', HD: '#EDE0FF', TH: '#FAF5FF', THD: '#140824', TB: '#FFFFFF', TBD: '#0C0418' },
  'crimson-red': { L: '#FFF0F0', D: '#140404', S: '#FFF0F0', SD: '#140404', C: '#FFFFFF', CD: '#280C0C', T: '#3D0B0B', TD: '#FEE2E2', M: '#7B4B4B', MD: '#AE8888', A: '#DC2626', AD: '#EF4444', B: 'rgba(220,38,38,0.20)', BD: 'rgba(239,68,68,0.20)', BF: '#DC2626', BFD: '#EF4444', BT: '#B91C1C', BTD: '#FCA5A5', H: '#3D0B0B', HD: '#FEE2E2', TH: '#FEF2F2', THD: '#1C0808', TB: '#FFFFFF', TBD: '#140404' },
  'slate-gray': { L: '#F1F5F9', D: '#080B10', S: '#F1F5F9', SD: '#080B10', C: '#FFFFFF', CD: '#141821', T: '#1E293B', TD: '#F1F5F9', M: '#64748B', MD: '#94A3B8', A: '#64748B', AD: '#94A3B8', B: 'rgba(100,116,139,0.20)', BD: 'rgba(148,163,184,0.20)', BF: '#64748B', BFD: '#94A3B8', BT: '#475569', BTD: '#CBD5E1', H: '#1E293B', HD: '#F1F5F9', TH: '#F8FAFC', THD: '#0F1420', TB: '#FFFFFF', TBD: '#080B10' },
  'warm-amber': { L: '#FFF8ED', D: '#140C04', S: '#FFF8ED', SD: '#140C04', C: '#FFFFFF', CD: '#24180C', T: '#3D280B', TD: '#FEF3C7', M: '#7B6B4B', MD: '#AEA188', A: '#D97706', AD: '#F59E0B', B: 'rgba(217,119,6,0.20)', BD: 'rgba(245,158,11,0.20)', BF: '#D97706', BFD: '#F59E0B', BT: '#B45309', BTD: '#FCD34D', H: '#3D280B', HD: '#FEF3C7', TH: '#FFFBEB', THD: '#1C1408', TB: '#FFFFFF', TBD: '#140C04' },
  'cyber-teal': { L: '#EEFDF9', D: '#04140F', S: '#EEFDF9', SD: '#04140F', C: '#FFFFFF', CD: '#0C241C', T: '#0B3D30', TD: '#DCFCE7', M: '#4B7B6E', MD: '#8AAEA4', A: '#14B8A6', AD: '#2DD4BF', B: 'rgba(20,184,166,0.20)', BD: 'rgba(45,212,191,0.20)', BF: '#14B8A6', BFD: '#2DD4BF', BT: '#0D9488', BTD: '#5EEAD4', H: '#0B3D30', HD: '#CCFBF1', TH: '#F0FDFA', THD: '#082018', TB: '#FFFFFF', TBD: '#04140F' },
  'soft-lavender': { L: '#F8F5FF', D: '#0C0818', S: '#F8F5FF', SD: '#0C0818', C: '#FFFFFF', CD: '#1C1430', T: '#2D1F4D', TD: '#EDE0FF', M: '#7B6B9B', MD: '#AEA8C8', A: '#C4B5FD', AD: '#DDD6FE', B: 'rgba(196,181,253,0.20)', BD: 'rgba(221,214,254,0.20)', BF: '#C4B5FD', BFD: '#DDD6FE', BT: '#A78BFA', BTD: '#E9D5FF', H: '#2D1F4D', HD: '#EDE0FF', TH: '#FAF5FF', THD: '#140C24', TB: '#FFFFFF', TBD: '#0C0818' },
  'ocean-deep': { L: '#EEF4FF', D: '#040814', S: '#EEF4FF', SD: '#040814', C: '#FFFFFF', CD: '#0C1428', T: '#1E3A5F', TD: '#DBEAFE', M: '#4B6B8B', MD: '#8EAECF', A: '#1D4ED8', AD: '#3B82F6', B: 'rgba(29,78,216,0.20)', BD: 'rgba(59,130,246,0.20)', BF: '#1D4ED8', BFD: '#3B82F6', BT: '#1E40AF', BTD: '#60A5FA', H: '#1E3A5F', HD: '#DBEAFE', TH: '#EFF6FF', THD: '#081028', TB: '#FFFFFF', TBD: '#040814' },
  'forest-pine': { L: '#EEFCF4', D: '#04140A', S: '#EEFCF4', SD: '#04140A', C: '#FFFFFF', CD: '#0C2414', T: '#0B3D2A', TD: '#DCFCE7', M: '#4B7B6E', MD: '#8AAEA4', A: '#047857', AD: '#059669', B: 'rgba(4,120,87,0.20)', BD: 'rgba(5,150,105,0.20)', BF: '#047857', BFD: '#059669', BT: '#065F46', BTD: '#34D399', H: '#0B3D2A', HD: '#DCFCE7', TH: '#ECFDF5', THD: '#082014', TB: '#FFFFFF', TBD: '#04140A' },
  'cherry-blossom': { L: '#FFF0F2', D: '#140408', S: '#FFF0F2', SD: '#140408', C: '#FFFFFF', CD: '#280C14', T: '#4D0B1B', TD: '#FEE2E6', M: '#8B4B5B', MD: '#BE889E', A: '#F43F5E', AD: '#FB7185', B: 'rgba(244,63,94,0.20)', BD: 'rgba(251,113,133,0.20)', BF: '#F43F5E', BFD: '#FB7185', BT: '#E11D48', BTD: '#FDA4AF', H: '#4D0B1B', HD: '#FEE2E6', TH: '#FFF1F2', THD: '#1C0810', TB: '#FFFFFF', TBD: '#140408' },
  'gold-coast': { L: '#FFFBED', D: '#140E04', S: '#FFFBED', SD: '#140E04', C: '#FFFFFF', CD: '#281C0C', T: '#3D2D0B', TD: '#FEF3C7', M: '#7B734B', MD: '#AEA888', A: '#F59E0B', AD: '#FBBF24', B: 'rgba(245,158,11,0.20)', BD: 'rgba(251,191,36,0.20)', BF: '#F59E0B', BFD: '#FBBF24', BT: '#D97706', BTD: '#FCD34D', H: '#3D2D0B', HD: '#FEF3C7', TH: '#FFFBEB', THD: '#1C1408', TB: '#FFFFFF', TBD: '#140E04' }
};

export const THEME_INFO = {
  'obsidian-gold': { name: 'Obsidian Gold', category: 'Premium', colors: ['#B8860B', '#1F2937', '#FFF9EC', '#1A1A1A', '#6B5B3E'] },
  'arctic-teal': { name: 'Arctic Teal', category: 'Business', colors: ['#009E7F', '#0F766E', '#F4FFFD', '#10201D', '#4B6F68'] },
  'sapphire-noir': { name: 'Sapphire Noir', category: 'Business', colors: ['#2563EB', '#1E3A8A', '#F7FAFF', '#0F172A', '#4B5D7A'] },
  'rose-platinum': { name: 'Rose Platinum', category: 'Premium', colors: ['#C75C75', '#8B3A4A', '#FFF7FA', '#2A1118', '#7A4B58'] },
  'carbon-violet': { name: 'Carbon Violet', category: 'Business', colors: ['#7C3AFF', '#4C1D95', '#FAF7FF', '#1E1238', '#67548A'] },
  'graphite-copper': { name: 'Graphite Copper', category: 'Premium', colors: ['#B76535', '#4B2A1A', '#FFF8F2', '#24130C', '#7A5642'] },
  'arctic-diamond': { name: 'Arctic Diamond', category: 'Light', colors: ['#60A5FA', '#CBD5E1', '#F3F7FC', '#0F172A', '#64748B'] },
  'emerald-royal': { name: 'Emerald Royal', category: 'Premium', colors: ['#10B981', '#D4AF37', '#F0FDF4', '#052E16', '#4B635A'] },
  'midnight-ruby': { name: 'Midnight Ruby', category: 'Premium', colors: ['#C0392B', '#7F1D1D', '#FFF1F2', '#2B0D0D', '#7C4A4A'] },
  'titanium-blue': { name: 'Titanium Blue', category: 'Business', colors: ['#2563EB', '#94A3B8', '#F8FAFC', '#0F172A', '#64748B'] },
  'pink-blossom': { name: 'Pink Blossom', category: 'Light', colors: ['#F472B6', '#EC4899', '#FFF1F2', '#2D0F1F', '#7A4B63'] },
  'ocean-waves': { name: 'Ocean Waves', category: 'Business', colors: ['#0EA5E9', '#0284C7', '#F0F9FF', '#0C2D48', '#4B7B9B'] },
  'lush-green': { name: 'Lush Green', category: 'Business', colors: ['#22C55E', '#16A34A', '#F0FDF4', '#0B3D1A', '#4B7B5E'] },
  'sunset-orange': { name: 'Sunset Orange', category: 'Business', colors: ['#F97316', '#EA580C', '#FFF7ED', '#3D1A0B', '#7B5A4B'] },
  'midnight-blue': { name: 'Midnight Blue', category: 'Dark', colors: ['#1E3A5F', '#0F1B2D', '#F8FAFC', '#0F1B2D', '#4B5E7B'] },
  'royal-purple': { name: 'Royal Purple', category: 'Business', colors: ['#A855F7', '#7C3AED', '#FAF5FF', '#2D0F4D', '#6B4B8A'] },
  'crimson-red': { name: 'Crimson Red', category: 'Business', colors: ['#DC2626', '#B91C1C', '#FEF2F2', '#3D0B0B', '#7B4B4B'] },
  'slate-gray': { name: 'Slate Gray', category: 'Dark', colors: ['#64748B', '#475569', '#F8FAFC', '#1E293B', '#64748B'] },
  'warm-amber': { name: 'Warm Amber', category: 'Business', colors: ['#D97706', '#B45309', '#FFFBEB', '#3D280B', '#7B6B4B'] },
  'cyber-teal': { name: 'Cyber Teal', category: 'Business', colors: ['#14B8A6', '#0D9488', '#F0FDFA', '#0B3D30', '#4B7B6E'] },
  'soft-lavender': { name: 'Soft Lavender', category: 'Light', colors: ['#C4B5FD', '#A78BFA', '#FAF5FF', '#2D1F4D', '#7B6B9B'] },
  'ocean-deep': { name: 'Ocean Deep', category: 'Dark', colors: ['#1D4ED8', '#1E40AF', '#EFF6FF', '#1E3A5F', '#4B6B8B'] },
  'forest-pine': { name: 'Forest Pine', category: 'Dark', colors: ['#047857', '#065F46', '#ECFDF5', '#0B3D2A', '#4B7B6E'] },
  'cherry-blossom': { name: 'Cherry Blossom', category: 'Light', colors: ['#F43F5E', '#E11D48', '#FFF1F2', '#4D0B1B', '#8B4B5B'] },
  'gold-coast': { name: 'Gold Coast', category: 'Premium', colors: ['#F59E0B', '#D97706', '#FFFBEB', '#3D2D0B', '#7B734B'] }
};

export const themeEngine = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
