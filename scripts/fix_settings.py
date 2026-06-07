import re

with open("e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx", "r") as f:
    content = f.read()

missing_code = """
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.8);
        resolve(compressedBase64);
      };
    };
  });
};

const getThemePreviewColors = (preset) => {
  const isDark = document.documentElement.classList.contains('dark');
  
  const themes = {
    classic: {
      background: isDark ? '#111111' : '#FCFBF8',
      sidebar: isDark ? '#0A0A0A' : '#FCFBF8',
      card: isDark ? '#1A1A1A' : '#FFFFFF',
      text: isDark ? '#F5F5F5' : '#1C1917',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#78716C',
      accent: isDark ? '#F97316' : '#F97316',
      border: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.15)',
      headerColor: isDark ? '#F5F5F5' : '#1C1917',
      tableHeaderBg: isDark ? '#222222' : '#F4F1E9',
      totalBg: isDark ? '#111111' : '#FDFDFD'
    },
    rose: {
      background: isDark ? '#1A1210' : '#FFFBF9',
      sidebar: isDark ? '#140D0C' : '#FFFBF9',
      card: isDark ? '#241A17' : '#FFFFFF',
      text: isDark ? '#F9EBE5' : '#2C1A14',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#8C736C',
      accent: isDark ? '#E5989B' : '#B56576',
      border: isDark ? 'rgba(212, 163, 115, 0.15)' : 'rgba(212, 163, 115, 0.15)',
      headerColor: isDark ? '#F9EBE5' : '#2C1A14',
      tableHeaderBg: isDark ? '#2C201C' : '#FDF2EE',
      totalBg: isDark ? '#1A1210' : '#FFFFFF'
    },
    ocean: {
      background: isDark ? '#0B161A' : '#F4F9F9',
      sidebar: isDark ? '#081114' : '#F4F9F9',
      card: isDark ? '#122226' : '#FFFFFF',
      text: isDark ? '#E0F2F2' : '#0A2E36',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#5C838F',
      accent: isDark ? '#3EBDCC' : '#0493A6',
      border: isDark ? 'rgba(62, 189, 204, 0.15)' : 'rgba(4, 147, 166, 0.15)',
      headerColor: isDark ? '#E0F2F2' : '#0A2E36',
      tableHeaderBg: isDark ? '#192D33' : '#E6F2F2',
      totalBg: isDark ? '#0B161A' : '#FFFFFF'
    },
    emerald: {
      background: isDark ? '#09130E' : '#F5F9F6',
      sidebar: isDark ? '#060D0A' : '#F5F9F6',
      card: isDark ? '#111F18' : '#FFFFFF',
      text: isDark ? '#E0F0E8' : '#112A1F',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#5B836F',
      accent: isDark ? '#34D399' : '#10B981',
      border: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      headerColor: isDark ? '#E0F0E8' : '#112A1F',
      tableHeaderBg: isDark ? '#182B21' : '#E6F1E9',
      totalBg: isDark ? '#09130E' : '#FFFFFF'
    },
    indigo: {
      background: isDark ? '#0C0B14' : '#F7F7FA',
      sidebar: isDark ? '#08070D' : '#F7F7FA',
      card: isDark ? '#141322' : '#FFFFFF',
      text: isDark ? '#EBEBFA' : '#171629',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6C6A93',
      accent: isDark ? '#818CF8' : '#6366F1',
      border: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.15)',
      headerColor: isDark ? '#EBEBFA' : '#171629',
      tableHeaderBg: isDark ? '#1C1B2E' : '#ECECF2',
      totalBg: isDark ? '#0C0B14' : '#FFFFFF'
    },
    midnight: {
      background: isDark ? '#000000' : '#F8F9FA',
      sidebar: isDark ? '#000000' : '#F8F9FA',
      card: isDark ? '#111111' : '#FFFFFF',
      text: isDark ? '#F8F9FA' : '#212529',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#868E96',
      accent: isDark ? '#F8F9FA' : '#495057',
      border: isDark ? 'rgba(222, 226, 230, 0.15)' : 'rgba(134, 142, 150, 0.15)',
      headerColor: isDark ? '#F8F9FA' : '#212529',
      tableHeaderBg: isDark ? '#1A1A1A' : '#E9ECEF',
      totalBg: isDark ? '#000000' : '#FFFFFF'
    },
    sakura: {
      background: isDark ? '#140A0D' : '#FFF5F7',
      sidebar: isDark ? '#0A0507' : '#FFF5F7',
      card: isDark ? '#1E1115' : '#FFFFFF',
      text: isDark ? '#FAEDF1' : '#381A22',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9A6678',
      accent: isDark ? '#F9A8D4' : '#F472B6',
      border: isDark ? 'rgba(249, 168, 212, 0.15)' : 'rgba(244, 114, 182, 0.15)',
      headerColor: isDark ? '#FAEDF1' : '#381A22',
      tableHeaderBg: isDark ? '#29171D' : '#FFE6EC',
      totalBg: isDark ? '#140A0D' : '#FFFFFF'
    },
    arctic: {
      background: isDark ? '#080D14' : '#F4F7FB',
      sidebar: isDark ? '#04070A' : '#F4F7FB',
      card: isDark ? '#101822' : '#FFFFFF',
      text: isDark ? '#EDF1F5' : '#121C26',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#647B91',
      accent: isDark ? '#CBD5E1' : '#94A3B8',
      border: isDark ? 'rgba(203, 213, 225, 0.15)' : 'rgba(148, 163, 184, 0.15)',
      headerColor: isDark ? '#EDF1F5' : '#121C26',
      tableHeaderBg: isDark ? '#182331' : '#E5EBF4',
      totalBg: isDark ? '#080D14' : '#FFFFFF'
    },
    desert: {
      background: isDark ? '#1B1510' : '#FDF9F3',
      sidebar: isDark ? '#110D0A' : '#FDF9F3',
      card: isDark ? '#261E18' : '#FFFFFF',
      text: isDark ? '#F4EBE2' : '#3B2E24',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#968171',
      accent: isDark ? '#E8C39E' : '#D4A373',
      border: isDark ? 'rgba(232, 195, 158, 0.15)' : 'rgba(212, 163, 115, 0.15)',
      headerColor: isDark ? '#F4EBE2' : '#3B2E24',
      tableHeaderBg: isDark ? '#322820' : '#F6EDDF',
      totalBg: isDark ? '#1B1510' : '#FFFFFF'
    },
    lavender: {
      background: isDark ? '#120D1A' : '#F8F5FB',
      sidebar: isDark ? '#0B0810' : '#F8F5FB',
      card: isDark ? '#1D1526' : '#FFFFFF',
      text: isDark ? '#EBE5F2' : '#221A2C',
      muted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#7E6C91',
      accent: isDark ? '#C084FC' : '#A855F7',
      border: isDark ? 'rgba(192, 132, 252, 0.15)' : 'rgba(168, 85, 247, 0.15)',
      headerColor: isDark ? '#EBE5F2' : '#221A2C',
      tableHeaderBg: isDark ? '#271E33' : '#EFE8F5',
      totalBg: isDark ? '#120D1A' : '#FFFFFF'
    }
  };
  return themes[preset] || themes.classic;
};

/**
 * Normal User Business Settings Page reorganized into 5 beautiful clean tabs.
 * Allows standard users to configure their own firm's profile.
 * If isAdmin is true, it also renders the Admin console section with simple Plan & Feature Control.
 */
const Settings = ({
  settings,
  onSaveSettings,
  isAdmin,
"""

target = "width = maxWidth;\n        }\n"
if target in content:
    new_content = content.replace(target, target + missing_code)
    with open("e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx", "w") as f:
        f.write(new_content)
    print("Fixed Settings.jsx successfully.")
else:
    print("Could not find the target string.")
