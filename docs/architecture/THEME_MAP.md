# BillQyro — Theme System Map
> VERIFIED from: `src/services/themeEngine.js`, `src/contexts/ThemeContext.jsx`, `src/hooks/useThemeEngine.jsx`, `src/utils/themeUtils.js`

---

## Theme Architecture Flow

```
User Changes Theme Setting
         │
         ▼
  SettingsStudioV2.jsx / ThemeStudio.jsx
         │
         │ dispatches window event:
         │ 'billqyro:settings-updated'
         ▼
  ThemeContext.jsx (ThemeProvider)
         │ listens to settings-updated event
         │ reads: themeColor, darkMode, brandColor, themeType
         ▼
  useThemeEngine.jsx → applyTheme()
         │
         ▼
  themeEngine.js → applyFullTheme()
         │
         ├── Sets document.documentElement.classList (dark/light)
         ├── Sets document.documentElement[data-theme="<themeId>"]
         │       └── CSS: themes.css applies [data-theme="X"] variables
         ├── For custom brandColor:
         │       └── Sets CSS variables directly on :root via style.setProperty()
         ├── Sets --radius-base, --animation-multiplier, --shadow-opacity
         └── updateFaviconForTheme() → themeIcon.js
                  │
                  ▼
         localStorage:
           billqyro_theme_color
           billqyro_dark_mode
```

---

## Theme Storage Locations

| Key | Location | Persisted By |
|-----|----------|-------------|
| `themeColor` / `themePreset` | Firestore `settings` doc | `settingsEngine` |
| `darkMode` | Firestore `settings` doc | `settingsEngine` |
| `brandColor` | Firestore `settings` doc | `settingsEngine` |
| `themeType` | Firestore `settings` doc | `settingsEngine` |
| `billqyro_theme_color` | localStorage | `themeEngine.saveLocalThemePreference()` |
| `billqyro_dark_mode` | localStorage | `themeEngine.saveLocalThemePreference()` |

---

## CSS Files & Their Roles

| File | Size | Role |
|------|------|------|
| `src/index.css` | 67 KB | Main stylesheet — base styles, utilities, component classes |
| `src/themes.css` | 27 KB | Theme variable definitions per `[data-theme="X"]` attribute |
| `src/premium-design.css` | 31 KB | Premium glass/dark UI overrides, micro-animation helpers |

---

## Theme Tokens (CSS Variables) — Applied by themeEngine

| Variable | Description | Source |
|----------|-------------|--------|
| `--accent` | Primary brand color | themes.css or inline style (custom) |
| `--accent-light` | Accent with opacity | themes.css or computed |
| `--border-soft` | Soft border color | themes.css or computed |
| `--border-strong` | Strong border color | themes.css or computed |
| `--accent-glow` | Glow effect color | themes.css or computed |
| `--accent-gradient` | Button gradient | themes.css or computed |
| `--chart-primary` | Chart line color | themes.css or computed |
| `--sidebar-active` | Active nav item bg | themes.css or computed |
| `--radius-base` | Corner radius | themeEngine from settings.cornerRadius |
| `--animation-multiplier` | Transition speed | themeEngine from settings.animationSpeed |
| `--shadow-opacity` | Shadow strength | themeEngine from settings.shadowIntensity |

---

## Default Theme

`ThemeContext` initializes with: `themeId: 'obsidian-gold'`  
`themeEngine.getLocalThemePreference()` defaults to: `'brand-premium'`

> [!NOTE]
> Minor discrepancy: ThemeContext defaults to 'obsidian-gold' while themeEngine defaults to 'brand-premium'.
> Actual applied theme depends on Firestore settings load order.

---

## Theme Consumers

| Consumer | How it uses theme |
|---------|-------------------|
| All React components | Via CSS variables — automatic |
| `PdfDocument.jsx` | `themeEngine.getThemePreviewColors()` for PDF color injection |
| `InvoicePreview.jsx` | CSS variable inheritance |
| `PublicInvoice.jsx` (portal) | Reads theme settings from invoice data |
| `LiveLinkTemplateStudio.jsx` | Template-specific color overrides |
| `DesignStudio.jsx` | Full theme customization UI |

---

## Theme Studio Location

- **User-facing:** `src/pages/studios/ThemeStudio.jsx` (inside SettingsStudio)
- **Advanced:** `src/pages/DesignStudio.jsx` (56 KB — full design customization)
- **Admin control:** `src/pages/admin/GlobalSettings.jsx`
