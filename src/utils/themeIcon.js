const themeFolderMap = {
  // Original 8 folders
  'classic': 'billqyro-classic',
  'pink': 'pink-premium',
  'emerald': 'emerald-business',
  'indigo': 'royal-indigo',
  'rose': 'rose-gold-luxe',
  'midnight': 'midnight-blue',
  'ruby': 'ruby-burgundy',
  'champagne': 'champagne-black',

  // Map the new 25 valid themes to the closest matching physical folder
  'obsidian-gold': 'champagne-black',
  'arctic-teal': 'emerald-business',
  'sapphire-noir': 'midnight-blue',
  'rose-platinum': 'rose-gold-luxe',
  'carbon-violet': 'royal-indigo',
  'graphite-copper': 'champagne-black',
  'arctic-diamond': 'billqyro-classic',
  'emerald-royal': 'emerald-business',
  'midnight-ruby': 'ruby-burgundy',
  'titanium-blue': 'midnight-blue',
  'ocean-blue': 'billqyro-classic',
  'sunset-orange': 'ruby-burgundy',
  'forest-green': 'emerald-business',
  'deep-bluish-green': 'emerald-business',
  'deep-blue-premium': 'midnight-blue',
  'crimson-business': 'ruby-burgundy',
  'luxury-brown': 'champagne-black',
  'noir-black': 'champagne-black',
  'cyber-blue': 'billqyro-classic',
  'silver-elite': 'billqyro-classic',
  'crimson-red': 'ruby-burgundy',
  'purple-haze': 'royal-indigo',
  'golden-luxury': 'champagne-black',
  
  // Missing ones added to fix favicon updates
  'pink-blossom': 'pink-premium',
  'ocean-waves': 'billqyro-classic',
  'lush-green': 'emerald-business',
  'royal-purple': 'royal-indigo',
  'slate-gray': 'midnight-blue',
  'warm-amber': 'champagne-black',
  'cyber-teal': 'emerald-business',
  'soft-lavender': 'royal-indigo',
  'ocean-deep': 'midnight-blue',
  'forest-pine': 'emerald-business',
  'cherry-blossom': 'pink-premium',
  'gold-coast': 'champagne-black'
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
    
    // Update PWA Manifest dynamically
    const dynamicManifest = {
      name: 'BillQyro',
      short_name: 'BillQyro',
      description: 'Modern Billing & Invoicing Platform',
      theme_color: '#071B3A',
      background_color: '#f8fafc',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: `/icons/themes/${folder}/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `/icons/themes/${folder}/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: `/icons/themes/${folder}/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    };
    const manifestStr = JSON.stringify(dynamicManifest);
    const manifestDataUrl = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(manifestStr);
    
    let mLink = document.querySelector('link[rel="manifest"]');
    if (mLink) {
       mLink.href = manifestDataUrl;
    } else {
       mLink = document.createElement('link');
       mLink.rel = 'manifest';
       mLink.href = manifestDataUrl;
       document.head.appendChild(mLink);
    }
    
  } catch (error) {
    console.error("Failed to update dynamic favicon:", error);
  }
};
