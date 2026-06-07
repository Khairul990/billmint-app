export const getThemePreviewColors = (preset, forceMode = null) => {
  let isDark = false;
  if (forceMode === 'light') isDark = false;
  else if (forceMode === 'dark') isDark = true;
  else isDark = document.documentElement.classList.contains('dark');
  
  const themes = {
    'obsidian-gold': {
      background: isDark ? '#08080C' : '#F8F3E7',
      sidebar: isDark ? '#08080C' : '#F8F3E7',
      card: isDark ? '#131318' : '#FFFFFF',
      text: isDark ? '#F5F0E8' : '#1A1A1A',
      muted: isDark ? '#B8A98D' : '#6B5B3E',
      accent: isDark ? '#C9A84C' : '#B8860B',
      border: isDark ? 'rgba(201,168,76,0.22)' : 'rgba(184,134,11,0.25)',
      btnFrom: isDark ? '#C9A84C' : '#B8860B',
      btnTo: isDark ? '#E8C97A' : '#1F2937',
      headerColor: isDark ? '#F5F0E8' : '#1A1A1A',
      tableHeaderBg: isDark ? '#0F0F14' : '#FFF9EC',
      totalBg: isDark ? '#08080C' : '#FFFFFF'
    },
    'arctic-teal': {
      background: isDark ? '#050D0F' : '#EAF7F5',
      sidebar: isDark ? '#050D0F' : '#EAF7F5',
      card: isDark ? '#0C1518' : '#FFFFFF',
      text: isDark ? '#E8F5F2' : '#10201D',
      muted: isDark ? '#7CB8A8' : '#4B6F68',
      accent: isDark ? '#00C896' : '#009E7F',
      border: isDark ? 'rgba(0,200,150,0.22)' : 'rgba(0,158,127,0.24)',
      btnFrom: isDark ? '#00C896' : '#009E7F',
      btnTo: isDark ? '#34E8B0' : '#0F766E',
      headerColor: isDark ? '#E8F5F2' : '#10201D',
      tableHeaderBg: isDark ? '#080F12' : '#F4FFFD',
      totalBg: isDark ? '#050D0F' : '#FFFFFF'
    },
    'sapphire-noir': {
      background: isDark ? '#04060F' : '#EEF4FF',
      sidebar: isDark ? '#04060F' : '#EEF4FF',
      card: isDark ? '#0A0E1A' : '#FFFFFF',
      text: isDark ? '#E8EEFF' : '#0F172A',
      muted: isDark ? '#8EA6D9' : '#4B5D7A',
      accent: isDark ? '#4F8EF7' : '#2563EB',
      border: isDark ? 'rgba(79,142,247,0.22)' : 'rgba(37,99,235,0.22)',
      btnFrom: isDark ? '#4F8EF7' : '#2563EB',
      btnTo: isDark ? '#82B1FF' : '#1E3A8A',
      headerColor: isDark ? '#E8EEFF' : '#0F172A',
      tableHeaderBg: isDark ? '#060914' : '#F7FAFF',
      totalBg: isDark ? '#04060F' : '#FFFFFF'
    },
    'rose-platinum': {
      background: isDark ? '#0C080A' : '#FFF1F5',
      sidebar: isDark ? '#0C080A' : '#FFF1F5',
      card: isDark ? '#180F13' : '#FFFFFF',
      text: isDark ? '#F5EEF0' : '#2A1118',
      muted: isDark ? '#B98A98' : '#7A4B58',
      accent: isDark ? '#E8A0B0' : '#C75C75',
      border: isDark ? 'rgba(232,160,176,0.22)' : 'rgba(199,92,117,0.24)',
      btnFrom: isDark ? '#E8A0B0' : '#C75C75',
      btnTo: isDark ? '#F5C6D2' : '#8B3A4A',
      headerColor: isDark ? '#F5EEF0' : '#2A1118',
      tableHeaderBg: isDark ? '#120C0F' : '#FFF7FA',
      totalBg: isDark ? '#0C080A' : '#FFFFFF'
    },
    'carbon-violet': {
      background: isDark ? '#06040C' : '#F3EFFF',
      sidebar: isDark ? '#06040C' : '#F3EFFF',
      card: isDark ? '#0D0A18' : '#FFFFFF',
      text: isDark ? '#EEEAFF' : '#1E1238',
      muted: isDark ? '#A893D9' : '#67548A',
      accent: isDark ? '#9B6FFF' : '#7C3AFF',
      border: isDark ? 'rgba(155,111,255,0.22)' : 'rgba(124,58,255,0.22)',
      btnFrom: isDark ? '#9B6FFF' : '#7C3AFF',
      btnTo: isDark ? '#C4A0FF' : '#4C1D95',
      headerColor: isDark ? '#EEEAFF' : '#1E1238',
      tableHeaderBg: isDark ? '#090612' : '#FAF7FF',
      totalBg: isDark ? '#06040C' : '#FFFFFF'
    },
    'graphite-copper': {
      background: isDark ? '#0A0806' : '#FFF2E8',
      sidebar: isDark ? '#0A0806' : '#FFF2E8',
      card: isDark ? '#161008' : '#FFFFFF',
      text: isDark ? '#F5EDE8' : '#24130C',
      muted: isDark ? '#B88A72' : '#7A5642',
      accent: isDark ? '#D4825A' : '#B76535',
      border: isDark ? 'rgba(212,130,90,0.22)' : 'rgba(183,101,53,0.25)',
      btnFrom: isDark ? '#D4825A' : '#B76535',
      btnTo: isDark ? '#EAA880' : '#4B2A1A',
      headerColor: isDark ? '#F5EDE8' : '#24130C',
      tableHeaderBg: isDark ? '#100C08' : '#FFF8F2',
      totalBg: isDark ? '#0A0806' : '#FFFFFF'
    },
    'arctic-diamond': {
      background: isDark ? '#0B1220' : '#F8FBFF',
      sidebar: isDark ? '#0B1220' : '#F8FBFF',
      card: isDark ? '#1E293B' : '#FFFFFF',
      text: isDark ? '#F8FAFC' : '#0F172A',
      muted: isDark ? '#94A3B8' : '#64748B',
      accent: isDark ? '#93C5FD' : '#60A5FA',
      border: isDark ? 'rgba(147,197,253,0.20)' : 'rgba(96,165,250,0.20)',
      btnFrom: isDark ? '#93C5FD' : '#60A5FA',
      btnTo: isDark ? '#E2E8F0' : '#CBD5E1',
      headerColor: isDark ? '#F8FAFC' : '#0F172A',
      tableHeaderBg: isDark ? '#111827' : '#F3F7FC',
      totalBg: isDark ? '#0B1220' : '#FFFFFF'
    },
    'emerald-royal': {
      background: isDark ? '#08120D' : '#F7FCF9',
      sidebar: isDark ? '#08120D' : '#F7FCF9',
      card: isDark ? '#14261C' : '#FFFFFF',
      text: isDark ? '#ECFDF5' : '#052E16',
      muted: isDark ? '#A7C7B7' : '#4B635A',
      accent: isDark ? '#34D399' : '#10B981',
      border: isDark ? 'rgba(52,211,153,0.20)' : 'rgba(16,185,129,0.20)',
      btnFrom: isDark ? '#34D399' : '#10B981',
      btnTo: isDark ? '#F4D03F' : '#D4AF37',
      headerColor: isDark ? '#ECFDF5' : '#052E16',
      tableHeaderBg: isDark ? '#102018' : '#F0FDF4',
      totalBg: isDark ? '#08120D' : '#FFFFFF'
    },
    'midnight-ruby': {
      background: isDark ? '#090506' : '#FFF8F8',
      sidebar: isDark ? '#090506' : '#FFF8F8',
      card: isDark ? '#1C0D10' : '#FFFFFF',
      text: isDark ? '#FEF2F2' : '#2B0D0D',
      muted: isDark ? '#C9A6A6' : '#7C4A4A',
      accent: isDark ? '#E74C3C' : '#C0392B',
      border: isDark ? 'rgba(231,76,60,0.20)' : 'rgba(192,57,43,0.20)',
      btnFrom: isDark ? '#E74C3C' : '#C0392B',
      btnTo: isDark ? '#FCA5A5' : '#7F1D1D',
      headerColor: isDark ? '#FEF2F2' : '#2B0D0D',
      tableHeaderBg: isDark ? '#13090B' : '#FFF1F2',
      totalBg: isDark ? '#090506' : '#FFFFFF'
    },
    'titanium-blue': {
      background: isDark ? '#0A0F1A' : '#F4F8FC',
      sidebar: isDark ? '#0A0F1A' : '#F4F8FC',
      card: isDark ? '#172033' : '#FFFFFF',
      text: isDark ? '#F8FAFC' : '#0F172A',
      muted: isDark ? '#A1AFC7' : '#64748B',
      accent: isDark ? '#60A5FA' : '#2563EB',
      border: isDark ? 'rgba(96,165,250,0.20)' : 'rgba(37,99,235,0.20)',
      btnFrom: isDark ? '#60A5FA' : '#2563EB',
      btnTo: isDark ? '#CBD5E1' : '#94A3B8',
      headerColor: isDark ? '#F8FAFC' : '#0F172A',
      tableHeaderBg: isDark ? '#111827' : '#F8FAFC',
      totalBg: isDark ? '#0A0F1A' : '#FFFFFF'
    }
  };
  return themes[preset] || themes['obsidian-gold'];
};
