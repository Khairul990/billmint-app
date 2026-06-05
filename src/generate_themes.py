import os

themes = [
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
        "is_neon": True
    }
]

out = []
for i, t in enumerate(themes, start=9):
    out.append(f'  /* {i}. {t["name"]} */')
    # LIGHT MODE
    out.append(f'  [data-theme="{t["id"]}"] {{')
    out.append(f'    --app-bg: {t["light_bg"]};')
    out.append(f'    --app-bg-soft: {t["light_bg"]};')
    out.append(f'    --surface: {t["light_surface"]};')
    out.append(f'    --surface-elevated: {t["light_surface"]};')
    out.append(f'    --card-bg: {t["light_card"]};')
    
    out.append(f'    --text-primary: {t["light_text"]};')
    out.append(f'    --text-secondary: {t["light_text"]};')
    out.append(f'    --text-muted: {t["light_text"]}99;')
    out.append(f'    --button-text: #FFFFFF;')
    
    out.append(f'    --border-soft: rgba({t["accent_rgb"]}, 0.15);')
    out.append(f'    --border-strong: rgba({t["accent_rgb"]}, 0.3);')
    
    out.append(f'    --accent: {t["accent"]};')
    out.append(f'    --accent-light: rgba({t["accent_rgb"]}, 0.08);')
    out.append(f'    --accent-dark: {t["accent_dark"]};')
    out.append(f'    --accent-gradient: linear-gradient(135deg, {t["accent"]}, {t["accent_dark"]});')
    out.append(f'    --accent-glow: rgba({t["accent_rgb"]}, 0.25);')
    
    out.append(f'    --sidebar-bg: {t["light_bg"]};')
    out.append(f'    --sidebar-active: rgba({t["accent_rgb"]}, 0.1);')
    out.append(f'    --sidebar-text: {t["light_text"]};')
    
    out.append(f'    --input-bg: {t["light_surface"]};')
    out.append(f'    --chart-primary: {t["accent"]};')
    
    out.append(f'    --status-success: #10B981;')
    out.append(f'    --status-warning: #F59E0B;')
    out.append(f'    --status-danger: #EF4444;')
    
    if t.get("is_neon"):
        out.append(f'    --glow-sm: 0 0 10px {t["accent"]};')
        out.append(f'    --glow-md: 0 0 20px {t["accent"]}, 0 0 30px {t["accent"]};')
        out.append(f'    --glow-lg: 0 0 30px {t["accent"]}, 0 0 60px {t["accent"]}, 0 0 90px {t["accent"]};')
    
    out.append(f'  }}')
    
    # DARK MODE
    out.append(f'  .dark[data-theme="{t["id"]}"] {{')
    out.append(f'    --app-bg: {t["dark_bg"]};')
    out.append(f'    --app-bg-soft: {t["dark_surface"]};')
    out.append(f'    --surface: {t["dark_bg"]};')
    out.append(f'    --surface-elevated: {t["dark_surface"]};')
    out.append(f'    --card-bg: {t["dark_card"]};')
    
    out.append(f'    --text-primary: {t["dark_text"]};')
    out.append(f'    --text-secondary: {t["dark_text"]};')
    out.append(f'    --text-muted: rgba(255, 255, 255, 0.5);')
    out.append(f'    --button-text: #FFFFFF;')
    
    out.append(f'    --border-soft: rgba({t["accent_rgb"]}, 0.15);')
    out.append(f'    --border-strong: rgba({t["accent_rgb"]}, 0.3);')
    
    out.append(f'    --accent: {t["accent"]};')
    out.append(f'    --accent-light: rgba({t["accent_rgb"]}, 0.15);')
    out.append(f'    --accent-dark: {t["accent_dark"]};')
    out.append(f'    --accent-gradient: linear-gradient(135deg, {t["accent"]}, {t["accent_dark"]});')
    out.append(f'    --accent-glow: rgba({t["accent_rgb"]}, 0.3);')
    
    out.append(f'    --sidebar-bg: {t["dark_bg"]};')
    out.append(f'    --sidebar-active: rgba({t["accent_rgb"]}, 0.15);')
    out.append(f'    --sidebar-text: {t["dark_text"]};')
    
    out.append(f'    --input-bg: {t["dark_card"]};')
    out.append(f'    --chart-primary: {t["accent"]};')
    
    out.append(f'    --status-success: #10B981;')
    out.append(f'    --status-warning: #F59E0B;')
    out.append(f'    --status-danger: #EF4444;')
    
    if t.get("is_neon"):
        out.append(f'    --glow-sm: 0 0 10px {t["accent"]};')
        out.append(f'    --glow-md: 0 0 20px {t["accent"]}, 0 0 30px {t["accent"]};')
        out.append(f'    --glow-lg: 0 0 30px {t["accent"]}, 0 0 60px {t["accent"]}, 0 0 90px {t["accent"]};')
    
    out.append(f'  }}')
    
    # Custom Gradient Overrides
    out.append(f'  [data-theme="{t["id"]}"] .gradient-bg {{')
    out.append(f'    background: linear-gradient(135deg, {t["dark_bg"]} 0%, {t["dark_surface"]} 100%);')
    out.append(f'  }}')

# Cyber blue neon effects
out.append(f'  /* Cyber Blue special effects */')
out.append(f'  .dark[data-theme="cyber-blue"] .btn-primary,')
out.append(f'  .dark[data-theme="cyber-blue"] button.bg-theme-accent {{')
out.append(f'    box-shadow: var(--glow-md);')
out.append(f'    transition: box-shadow 0.3s ease;')
out.append(f'  }}')
out.append(f'  .dark[data-theme="cyber-blue"] .btn-primary:hover,')
out.append(f'  .dark[data-theme="cyber-blue"] button.bg-theme-accent:hover {{')
out.append(f'    box-shadow: var(--glow-lg);')
out.append(f'  }}')
out.append(f'  .dark[data-theme="cyber-blue"] .card,')
out.append(f'  .dark[data-theme="cyber-blue"] .bg-theme-surface {{')
out.append(f'    border: 1px solid var(--accent);')
out.append(f'    box-shadow: var(--glow-sm);')
out.append(f'  }}')

with open("e:\\Khair_Murafiq_Empire\\BillQyro\\src\\generate_themes.py", "w") as f:
    f.write("\n".join([
        "themes = " + str(themes),
        "out = " + str(out),
        "with open('e:\\\\Khair_Murafiq_Empire\\\\BillQyro\\\\src\\\\themes.css', 'w') as fh:",
        "    fh.write('\\n'.join(out))"
    ]))
