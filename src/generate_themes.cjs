const fs = require('fs');

const themes = [
    {
        "id": "sunset-orange",
        "name": "Sunset Orange",
        "accent": "#ff6b35",
        "accent_dark": "#e05320",
        "accent_rgb": "255, 107, 53",
        "dark_bg": "#1a0f0f",
        "dark_surface": "#2d1b1b",
        "dark_card": "#3d2626",
        "light_bg": "#fff5f0",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#1a0f0f",
        "dark_text": "#ffe5db"
    },
    {
        "id": "forest-green",
        "name": "Forest Green",
        "accent": "#52b788",
        "accent_dark": "#40916c",
        "accent_rgb": "82, 183, 136",
        "dark_bg": "#0d1b0d",
        "dark_surface": "#1a2f1a",
        "dark_card": "#2d4a2d",
        "light_bg": "#f0fdf4",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#0d1b0d",
        "dark_text": "#d8f3dc"
    },
    {
        "id": "golden-luxury",
        "name": "Golden Luxury",
        "accent": "#d4af37",
        "accent_dark": "#aa8c2c",
        "accent_rgb": "212, 175, 55",
        "dark_bg": "#1a1510",
        "dark_surface": "#2d2415",
        "dark_card": "#3d3520",
        "light_bg": "#fffef0",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#1a1510",
        "dark_text": "#fff8dc"
    },
    {
        "id": "purple-haze",
        "name": "Purple Haze",
        "accent": "#a855f7",
        "accent_dark": "#9333ea",
        "accent_rgb": "168, 85, 247",
        "dark_bg": "#1a0f1f",
        "dark_surface": "#2d1b3d",
        "dark_card": "#3d2652",
        "light_bg": "#faf5ff",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#1a0f1f",
        "dark_text": "#f3e8ff"
    },
    {
        "id": "crimson-red",
        "name": "Crimson Red",
        "accent": "#dc2626",
        "accent_dark": "#b91c1c",
        "accent_rgb": "220, 38, 38",
        "dark_bg": "#1f0a0a",
        "dark_surface": "#3d1515",
        "dark_card": "#522020",
        "light_bg": "#fef2f2",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#1f0a0a",
        "dark_text": "#fee2e2"
    },
    {
        "id": "silver-elite",
        "name": "Silver Elite",
        "accent": "#94a3b8",
        "accent_dark": "#64748b",
        "accent_rgb": "148, 163, 184",
        "dark_bg": "#0f1419",
        "dark_surface": "#1a2029",
        "dark_card": "#2d3748",
        "light_bg": "#f8fafc",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#0f1419",
        "dark_text": "#f1f5f9"
    },
    {
        "id": "cyber-blue",
        "name": "Cyber Blue",
        "accent": "#00ffff",
        "accent_dark": "#00cccc",
        "accent_rgb": "0, 255, 255",
        "dark_bg": "#0a0e27",
        "dark_surface": "#0f1429",
        "dark_card": "#1a1f3a",
        "light_bg": "#e0f7ff",
        "light_surface": "#ffffff",
        "light_card": "#ffffff",
        "light_text": "#0a0e27",
        "dark_text": "#e0ffff",
        "is_neon": true
    }
];

let out = [];
themes.forEach((t, i) => {
    let index = i + 9;
    out.push(`  /* ${index}. ${t.name} */`);
    
    // LIGHT MODE
    out.push(`  [data-theme="${t.id}"] {`);
    out.push(`    --app-bg: ${t.light_bg};`);
    out.push(`    --app-bg-soft: ${t.light_bg};`);
    out.push(`    --surface: ${t.light_surface};`);
    out.push(`    --surface-elevated: ${t.light_surface};`);
    out.push(`    --card-bg: ${t.light_card};`);
    
    out.push(`    --text-primary: ${t.light_text};`);
    out.push(`    --text-secondary: ${t.light_text};`);
    out.push(`    --text-muted: ${t.light_text}99;`);
    out.push(`    --button-text: #FFFFFF;`);
    
    out.push(`    --border-soft: rgba(${t.accent_rgb}, 0.15);`);
    out.push(`    --border-strong: rgba(${t.accent_rgb}, 0.3);`);
    
    out.push(`    --accent: ${t.accent};`);
    out.push(`    --accent-light: rgba(${t.accent_rgb}, 0.08);`);
    out.push(`    --accent-dark: ${t.accent_dark};`);
    out.push(`    --accent-gradient: linear-gradient(135deg, ${t.accent}, ${t.accent_dark});`);
    out.push(`    --accent-glow: rgba(${t.accent_rgb}, 0.25);`);
    
    out.push(`    --sidebar-bg: ${t.light_bg};`);
    out.push(`    --sidebar-active: rgba(${t.accent_rgb}, 0.1);`);
    out.push(`    --sidebar-text: ${t.light_text};`);
    
    out.push(`    --input-bg: ${t.light_surface};`);
    out.push(`    --chart-primary: ${t.accent};`);
    
    out.push(`    --status-success: #10B981;`);
    out.push(`    --status-warning: #F59E0B;`);
    out.push(`    --status-danger: #EF4444;`);
    
    if (t.is_neon) {
        out.push(`    --glow-sm: 0 0 10px ${t.accent};`);
        out.push(`    --glow-md: 0 0 20px ${t.accent}, 0 0 30px ${t.accent};`);
        out.push(`    --glow-lg: 0 0 30px ${t.accent}, 0 0 60px ${t.accent}, 0 0 90px ${t.accent};`);
    }
    
    out.push(`  }`);
    
    // DARK MODE
    out.push(`  .dark[data-theme="${t.id}"] {`);
    out.push(`    --app-bg: ${t.dark_bg};`);
    out.push(`    --app-bg-soft: ${t.dark_surface};`);
    out.push(`    --surface: ${t.dark_bg};`);
    out.push(`    --surface-elevated: ${t.dark_surface};`);
    out.push(`    --card-bg: ${t.dark_card};`);
    
    out.push(`    --text-primary: ${t.dark_text};`);
    out.push(`    --text-secondary: ${t.dark_text};`);
    out.push(`    --text-muted: rgba(255, 255, 255, 0.5);`);
    out.push(`    --button-text: #FFFFFF;`);
    
    out.push(`    --border-soft: rgba(${t.accent_rgb}, 0.15);`);
    out.push(`    --border-strong: rgba(${t.accent_rgb}, 0.3);`);
    
    out.push(`    --accent: ${t.accent};`);
    out.push(`    --accent-light: rgba(${t.accent_rgb}, 0.15);`);
    out.push(`    --accent-dark: ${t.accent_dark};`);
    out.push(`    --accent-gradient: linear-gradient(135deg, ${t.accent}, ${t.accent_dark});`);
    out.push(`    --accent-glow: rgba(${t.accent_rgb}, 0.3);`);
    
    out.push(`    --sidebar-bg: ${t.dark_bg};`);
    out.push(`    --sidebar-active: rgba(${t.accent_rgb}, 0.15);`);
    out.push(`    --sidebar-text: ${t.dark_text};`);
    
    out.push(`    --input-bg: ${t.dark_card};`);
    out.push(`    --chart-primary: ${t.accent};`);
    
    out.push(`    --status-success: #10B981;`);
    out.push(`    --status-warning: #F59E0B;`);
    out.push(`    --status-danger: #EF4444;`);
    
    if (t.is_neon) {
        out.push(`    --glow-sm: 0 0 10px ${t.accent};`);
        out.push(`    --glow-md: 0 0 20px ${t.accent}, 0 0 30px ${t.accent};`);
        out.push(`    --glow-lg: 0 0 30px ${t.accent}, 0 0 60px ${t.accent}, 0 0 90px ${t.accent};`);
    }
    
    out.push(`  }`);
    
    // Custom Gradient Overrides
    out.push(`  [data-theme="${t.id}"] .gradient-bg {`);
    out.push(`    background: linear-gradient(135deg, ${t.dark_bg} 0%, ${t.dark_surface} 100%);`);
    out.push(`  }`);
});

// Cyber blue neon effects
out.push(`  /* Cyber Blue special effects */`);
out.push(`  .dark[data-theme="cyber-blue"] .btn-primary,`);
out.push(`  .dark[data-theme="cyber-blue"] .bg-theme-accent {`);
out.push(`    box-shadow: var(--glow-md);`);
out.push(`    transition: box-shadow 0.3s ease;`);
out.push(`  }`);
out.push(`  .dark[data-theme="cyber-blue"] .btn-primary:hover,`);
out.push(`  .dark[data-theme="cyber-blue"] .bg-theme-accent:hover {`);
out.push(`    box-shadow: var(--glow-lg);`);
out.push(`  }`);
out.push(`  .dark[data-theme="cyber-blue"] .card,`);
out.push(`  .dark[data-theme="cyber-blue"] .bg-theme-surface {`);
out.push(`    border: 1px solid var(--accent);`);
out.push(`    box-shadow: var(--glow-sm);`);
out.push(`  }`);

fs.writeFileSync('e:\\\\Khair_Murafiq_Empire\\\\BillQyro\\\\src\\\\themes.css', out.join('\\n'));
