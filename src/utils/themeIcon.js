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
