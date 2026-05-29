const themeFolderMap = {
  classic: 'billqyro-classic',
  pink: 'pink-premium',
  emerald: 'emerald-business',
  indigo: 'royal-indigo',
  rose: 'rose-gold-luxe',
  midnight: 'midnight-blue',
  ruby: 'ruby-burgundy',
  champagne: 'champagne-black'
};

export const updateFaviconForTheme = (themeId) => {
  try {
    const folder = themeFolderMap[themeId];
    if (!folder) return;
    
    const f32 = document.getElementById('favicon-32');
    if (f32) f32.href = `/icons/themes/${folder}/favicon-32x32.png`;
    
    const f16 = document.getElementById('favicon-16');
    if (f16) f16.href = `/icons/themes/${folder}/favicon-16x16.png`;
    
    const aIcon = document.getElementById('apple-touch-icon');
    if (aIcon) aIcon.href = `/icons/themes/${folder}/apple-touch-icon.png`;
    
    const fIco = document.getElementById('favicon-ico');
    if (fIco) fIco.href = `/icons/themes/${folder}/favicon.ico`;
    
  } catch (error) {
    console.error("Failed to update dynamic favicon:", error);
  }
};
