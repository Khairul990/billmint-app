import sys
import re

css_content = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
}

@layer base {
  /* 1. BillQyro Classic */
  :root, [data-theme="classic"] {
    --app-bg: #FCFBF8;
    --app-bg-soft: #F4F1E9;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #1C1917;
    --text-secondary: #44403C;
    --text-muted: #78716C;
    --button-text: #FFFFFF;
    --border-soft: rgba(249, 115, 22, 0.15);
    --border-strong: rgba(249, 115, 22, 0.3);
    --accent: #F97316;
    --accent-light: rgba(249, 115, 22, 0.08);
    --accent-dark: #C2410C;
    --accent-gradient: linear-gradient(135deg, #F97316, #FB923C);
    --accent-glow: rgba(249, 115, 22, 0.25);
    --sidebar-bg: #FCFBF8;
    --sidebar-active: rgba(249, 115, 22, 0.1);
    --sidebar-text: #1C1917;
    --input-bg: #FFFFFF;
    --chart-primary: #F97316;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark, .dark[data-theme="classic"], [data-theme="classic"].dark {
    --app-bg: #111111;
    --app-bg-soft: #1A1A1A;
    --surface: #111111;
    --surface-elevated: #1A1A1A;
    --card-bg: #1A1A1A;
    --text-primary: #F5F5F5;
    --text-secondary: #E5E5E5;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(249, 115, 22, 0.15);
    --border-strong: rgba(249, 115, 22, 0.3);
    --accent: #F97316;
    --accent-light: rgba(249, 115, 22, 0.15);
    --accent-dark: #FB923C;
    --accent-gradient: linear-gradient(135deg, #F97316, #FB923C);
    --accent-glow: rgba(249, 115, 22, 0.3);
    --sidebar-bg: #0A0A0A;
    --sidebar-active: rgba(249, 115, 22, 0.15);
    --sidebar-text: #F5F5F5;
    --input-bg: #222222;
    --chart-primary: #FB923C;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 2. Rose Gold Luxe */
  [data-theme="rose"] {
    --app-bg: #FFFBF9;
    --app-bg-soft: #FDF2EE;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #2C1A14;
    --text-secondary: #4A332C;
    --text-muted: #8C736C;
    --button-text: #FFFFFF;
    --border-soft: rgba(212, 163, 115, 0.15);
    --border-strong: rgba(212, 163, 115, 0.3);
    --accent: #B56576;
    --accent-light: rgba(181, 101, 118, 0.08);
    --accent-dark: #8C4755;
    --accent-gradient: linear-gradient(135deg, #B56576, #E5989B);
    --accent-glow: rgba(181, 101, 118, 0.25);
    --sidebar-bg: #FFFBF9;
    --sidebar-active: rgba(181, 101, 118, 0.1);
    --sidebar-text: #2C1A14;
    --input-bg: #FFFFFF;
    --chart-primary: #B56576;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="rose"] {
    --app-bg: #1A1210;
    --app-bg-soft: #241A17;
    --surface: #1A1210;
    --surface-elevated: #241A17;
    --card-bg: #241A17;
    --text-primary: #F9EBE5;
    --text-secondary: #E3D1CC;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(212, 163, 115, 0.15);
    --border-strong: rgba(212, 163, 115, 0.3);
    --accent: #E5989B;
    --accent-light: rgba(229, 152, 155, 0.15);
    --accent-dark: #FFB5A7;
    --accent-gradient: linear-gradient(135deg, #E5989B, #FFB5A7);
    --accent-glow: rgba(229, 152, 155, 0.3);
    --sidebar-bg: #140D0C;
    --sidebar-active: rgba(229, 152, 155, 0.15);
    --sidebar-text: #F9EBE5;
    --input-bg: #2C201C;
    --chart-primary: #E5989B;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 3. Ocean Mist */
  [data-theme="ocean"] {
    --app-bg: #F4F9F9;
    --app-bg-soft: #E6F2F2;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #0A2E36;
    --text-secondary: #1F4C59;
    --text-muted: #5C838F;
    --button-text: #FFFFFF;
    --border-soft: rgba(4, 147, 166, 0.15);
    --border-strong: rgba(4, 147, 166, 0.3);
    --accent: #0493A6;
    --accent-light: rgba(4, 147, 166, 0.08);
    --accent-dark: #026773;
    --accent-gradient: linear-gradient(135deg, #0493A6, #3EBDCC);
    --accent-glow: rgba(4, 147, 166, 0.25);
    --sidebar-bg: #F4F9F9;
    --sidebar-active: rgba(4, 147, 166, 0.1);
    --sidebar-text: #0A2E36;
    --input-bg: #FFFFFF;
    --chart-primary: #0493A6;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="ocean"] {
    --app-bg: #0B161A;
    --app-bg-soft: #122226;
    --surface: #0B161A;
    --surface-elevated: #122226;
    --card-bg: #122226;
    --text-primary: #E0F2F2;
    --text-secondary: #BDDEDF;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(62, 189, 204, 0.15);
    --border-strong: rgba(62, 189, 204, 0.3);
    --accent: #3EBDCC;
    --accent-light: rgba(62, 189, 204, 0.15);
    --accent-dark: #6BD2DF;
    --accent-gradient: linear-gradient(135deg, #3EBDCC, #6BD2DF);
    --accent-glow: rgba(62, 189, 204, 0.3);
    --sidebar-bg: #081114;
    --sidebar-active: rgba(62, 189, 204, 0.15);
    --sidebar-text: #E0F2F2;
    --input-bg: #192D33;
    --chart-primary: #3EBDCC;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 4. Emerald Elite */
  [data-theme="emerald"] {
    --app-bg: #F5F9F6;
    --app-bg-soft: #E6F1E9;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #112A1F;
    --text-secondary: #244C3A;
    --text-muted: #5B836F;
    --button-text: #FFFFFF;
    --border-soft: rgba(16, 185, 129, 0.15);
    --border-strong: rgba(16, 185, 129, 0.3);
    --accent: #10B981;
    --accent-light: rgba(16, 185, 129, 0.08);
    --accent-dark: #059669;
    --accent-gradient: linear-gradient(135deg, #10B981, #34D399);
    --accent-glow: rgba(16, 185, 129, 0.25);
    --sidebar-bg: #F5F9F6;
    --sidebar-active: rgba(16, 185, 129, 0.1);
    --sidebar-text: #112A1F;
    --input-bg: #FFFFFF;
    --chart-primary: #10B981;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="emerald"] {
    --app-bg: #09130E;
    --app-bg-soft: #111F18;
    --surface: #09130E;
    --surface-elevated: #111F18;
    --card-bg: #111F18;
    --text-primary: #E0F0E8;
    --text-secondary: #BDDFCC;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(52, 211, 153, 0.15);
    --border-strong: rgba(52, 211, 153, 0.3);
    --accent: #34D399;
    --accent-light: rgba(52, 211, 153, 0.15);
    --accent-dark: #6EE7B7;
    --accent-gradient: linear-gradient(135deg, #34D399, #6EE7B7);
    --accent-glow: rgba(52, 211, 153, 0.3);
    --sidebar-bg: #060D0A;
    --sidebar-active: rgba(52, 211, 153, 0.15);
    --sidebar-text: #E0F0E8;
    --input-bg: #182B21;
    --chart-primary: #34D399;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 5. Royal Indigo */
  [data-theme="indigo"] {
    --app-bg: #F7F7FA;
    --app-bg-soft: #ECECF2;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #171629;
    --text-secondary: #323055;
    --text-muted: #6C6A93;
    --button-text: #FFFFFF;
    --border-soft: rgba(99, 102, 241, 0.15);
    --border-strong: rgba(99, 102, 241, 0.3);
    --accent: #6366F1;
    --accent-light: rgba(99, 102, 241, 0.08);
    --accent-dark: #4F46E5;
    --accent-gradient: linear-gradient(135deg, #6366F1, #818CF8);
    --accent-glow: rgba(99, 102, 241, 0.25);
    --sidebar-bg: #F7F7FA;
    --sidebar-active: rgba(99, 102, 241, 0.1);
    --sidebar-text: #171629;
    --input-bg: #FFFFFF;
    --chart-primary: #6366F1;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="indigo"] {
    --app-bg: #0C0B14;
    --app-bg-soft: #141322;
    --surface: #0C0B14;
    --surface-elevated: #141322;
    --card-bg: #141322;
    --text-primary: #EBEBFA;
    --text-secondary: #CFCDEB;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(129, 140, 248, 0.15);
    --border-strong: rgba(129, 140, 248, 0.3);
    --accent: #818CF8;
    --accent-light: rgba(129, 140, 248, 0.15);
    --accent-dark: #A5B4FC;
    --accent-gradient: linear-gradient(135deg, #818CF8, #A5B4FC);
    --accent-glow: rgba(129, 140, 248, 0.3);
    --sidebar-bg: #08070D;
    --sidebar-active: rgba(129, 140, 248, 0.15);
    --sidebar-text: #EBEBFA;
    --input-bg: #1C1B2E;
    --chart-primary: #818CF8;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 6. Midnight Platinum */
  [data-theme="midnight"] {
    --app-bg: #F8F9FA;
    --app-bg-soft: #E9ECEF;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #212529;
    --text-secondary: #495057;
    --text-muted: #868E96;
    --button-text: #FFFFFF;
    --border-soft: rgba(134, 142, 150, 0.15);
    --border-strong: rgba(134, 142, 150, 0.3);
    --accent: #495057;
    --accent-light: rgba(73, 80, 87, 0.08);
    --accent-dark: #212529;
    --accent-gradient: linear-gradient(135deg, #495057, #868E96);
    --accent-glow: rgba(73, 80, 87, 0.25);
    --sidebar-bg: #F8F9FA;
    --sidebar-active: rgba(73, 80, 87, 0.1);
    --sidebar-text: #212529;
    --input-bg: #FFFFFF;
    --chart-primary: #495057;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="midnight"] {
    --app-bg: #000000;
    --app-bg-soft: #111111;
    --surface: #000000;
    --surface-elevated: #111111;
    --card-bg: #111111;
    --text-primary: #F8F9FA;
    --text-secondary: #DEE2E6;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #000000;
    --border-soft: rgba(222, 226, 230, 0.15);
    --border-strong: rgba(222, 226, 230, 0.3);
    --accent: #F8F9FA;
    --accent-light: rgba(248, 249, 250, 0.15);
    --accent-dark: #DEE2E6;
    --accent-gradient: linear-gradient(135deg, #F8F9FA, #DEE2E6);
    --accent-glow: rgba(248, 249, 250, 0.3);
    --sidebar-bg: #000000;
    --sidebar-active: rgba(248, 249, 250, 0.15);
    --sidebar-text: #F8F9FA;
    --input-bg: #1A1A1A;
    --chart-primary: #F8F9FA;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 7. Soft Sakura */
  [data-theme="sakura"] {
    --app-bg: #FFF5F7;
    --app-bg-soft: #FFE6EC;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #381A22;
    --text-secondary: #5E3240;
    --text-muted: #9A6678;
    --button-text: #FFFFFF;
    --border-soft: rgba(244, 114, 182, 0.15);
    --border-strong: rgba(244, 114, 182, 0.3);
    --accent: #F472B6;
    --accent-light: rgba(244, 114, 182, 0.08);
    --accent-dark: #DB2777;
    --accent-gradient: linear-gradient(135deg, #F472B6, #F9A8D4);
    --accent-glow: rgba(244, 114, 182, 0.25);
    --sidebar-bg: #FFF5F7;
    --sidebar-active: rgba(244, 114, 182, 0.1);
    --sidebar-text: #381A22;
    --input-bg: #FFFFFF;
    --chart-primary: #F472B6;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="sakura"] {
    --app-bg: #140A0D;
    --app-bg-soft: #1E1115;
    --surface: #140A0D;
    --surface-elevated: #1E1115;
    --card-bg: #1E1115;
    --text-primary: #FAEDF1;
    --text-secondary: #EAD0D9;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(249, 168, 212, 0.15);
    --border-strong: rgba(249, 168, 212, 0.3);
    --accent: #F9A8D4;
    --accent-light: rgba(249, 168, 212, 0.15);
    --accent-dark: #FBCFE8;
    --accent-gradient: linear-gradient(135deg, #F9A8D4, #FBCFE8);
    --accent-glow: rgba(249, 168, 212, 0.3);
    --sidebar-bg: #0A0507;
    --sidebar-active: rgba(249, 168, 212, 0.15);
    --sidebar-text: #FAEDF1;
    --input-bg: #29171D;
    --chart-primary: #F9A8D4;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 8. Arctic Frost */
  [data-theme="arctic"] {
    --app-bg: #F4F7FB;
    --app-bg-soft: #E5EBF4;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #121C26;
    --text-secondary: #2C3E50;
    --text-muted: #647B91;
    --button-text: #FFFFFF;
    --border-soft: rgba(148, 163, 184, 0.15);
    --border-strong: rgba(148, 163, 184, 0.3);
    --accent: #94A3B8;
    --accent-light: rgba(148, 163, 184, 0.08);
    --accent-dark: #64748B;
    --accent-gradient: linear-gradient(135deg, #94A3B8, #CBD5E1);
    --accent-glow: rgba(148, 163, 184, 0.25);
    --sidebar-bg: #F4F7FB;
    --sidebar-active: rgba(148, 163, 184, 0.1);
    --sidebar-text: #121C26;
    --input-bg: #FFFFFF;
    --chart-primary: #94A3B8;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="arctic"] {
    --app-bg: #080D14;
    --app-bg-soft: #101822;
    --surface: #080D14;
    --surface-elevated: #101822;
    --card-bg: #101822;
    --text-primary: #EDF1F5;
    --text-secondary: #D4DDE7;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #000000;
    --border-soft: rgba(203, 213, 225, 0.15);
    --border-strong: rgba(203, 213, 225, 0.3);
    --accent: #CBD5E1;
    --accent-light: rgba(203, 213, 225, 0.15);
    --accent-dark: #E2E8F0;
    --accent-gradient: linear-gradient(135deg, #CBD5E1, #E2E8F0);
    --accent-glow: rgba(203, 213, 225, 0.3);
    --sidebar-bg: #04070A;
    --sidebar-active: rgba(203, 213, 225, 0.15);
    --sidebar-text: #EDF1F5;
    --input-bg: #182331;
    --chart-primary: #CBD5E1;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 9. Desert Sand */
  [data-theme="desert"] {
    --app-bg: #FDF9F3;
    --app-bg-soft: #F6EDDF;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #3B2E24;
    --text-secondary: #5E4C3E;
    --text-muted: #968171;
    --button-text: #FFFFFF;
    --border-soft: rgba(212, 163, 115, 0.15);
    --border-strong: rgba(212, 163, 115, 0.3);
    --accent: #D4A373;
    --accent-light: rgba(212, 163, 115, 0.08);
    --accent-dark: #A67B54;
    --accent-gradient: linear-gradient(135deg, #D4A373, #E8C39E);
    --accent-glow: rgba(212, 163, 115, 0.25);
    --sidebar-bg: #FDF9F3;
    --sidebar-active: rgba(212, 163, 115, 0.1);
    --sidebar-text: #3B2E24;
    --input-bg: #FFFFFF;
    --chart-primary: #D4A373;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="desert"] {
    --app-bg: #1B1510;
    --app-bg-soft: #261E18;
    --surface: #1B1510;
    --surface-elevated: #261E18;
    --card-bg: #261E18;
    --text-primary: #F4EBE2;
    --text-secondary: #DFCCBD;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(232, 195, 158, 0.15);
    --border-strong: rgba(232, 195, 158, 0.3);
    --accent: #E8C39E;
    --accent-light: rgba(232, 195, 158, 0.15);
    --accent-dark: #F5DCC4;
    --accent-gradient: linear-gradient(135deg, #E8C39E, #F5DCC4);
    --accent-glow: rgba(232, 195, 158, 0.3);
    --sidebar-bg: #110D0A;
    --sidebar-active: rgba(232, 195, 158, 0.15);
    --sidebar-text: #F4EBE2;
    --input-bg: #322820;
    --chart-primary: #E8C39E;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 10. Lavender Dream */
  [data-theme="lavender"] {
    --app-bg: #F8F5FB;
    --app-bg-soft: #EFE8F5;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #221A2C;
    --text-secondary: #423555;
    --text-muted: #7E6C91;
    --button-text: #FFFFFF;
    --border-soft: rgba(168, 85, 247, 0.15);
    --border-strong: rgba(168, 85, 247, 0.3);
    --accent: #A855F7;
    --accent-light: rgba(168, 85, 247, 0.08);
    --accent-dark: #7E22CE;
    --accent-gradient: linear-gradient(135deg, #A855F7, #C084FC);
    --accent-glow: rgba(168, 85, 247, 0.25);
    --sidebar-bg: #F8F5FB;
    --sidebar-active: rgba(168, 85, 247, 0.1);
    --sidebar-text: #221A2C;
    --input-bg: #FFFFFF;
    --chart-primary: #A855F7;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="lavender"] {
    --app-bg: #120D1A;
    --app-bg-soft: #1D1526;
    --surface: #120D1A;
    --surface-elevated: #1D1526;
    --card-bg: #1D1526;
    --text-primary: #EBE5F2;
    --text-secondary: #D4C6E5;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(192, 132, 252, 0.15);
    --border-strong: rgba(192, 132, 252, 0.3);
    --accent: #C084FC;
    --accent-light: rgba(192, 132, 252, 0.15);
    --accent-dark: #D8B4FE;
    --accent-gradient: linear-gradient(135deg, #C084FC, #D8B4FE);
    --accent-glow: rgba(192, 132, 252, 0.3);
    --sidebar-bg: #0B0810;
    --sidebar-active: rgba(192, 132, 252, 0.15);
    --sidebar-text: #EBE5F2;
    --input-bg: #271E33;
    --chart-primary: #C084FC;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  body {
    @apply bg-theme-app text-theme-primary font-sans antialiased overflow-x-hidden;
    -webkit-tap-highlight-color: transparent;
  }
}

/* =========================================
   Hardware Accelerated Magical Transitions
========================================= */
body, 
#root,
.bg-theme-app,
.bg-theme-card,
.bg-theme-surface,
.bg-theme-sidebar,
.text-theme-primary,
.text-theme-secondary,
.text-theme-muted,
.text-theme-accent,
.border-theme-border-soft,
.border-theme-border-strong,
.shadow-premium,
.transition-theme,
button,
input,
svg,
path {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow, background-image;
  transition-duration: 0.75s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  will-change: background-color, border-color, color;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-strong, #cbd5e1);
  border-radius: 10px;
  transition: background 0.3s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent, #94a3b8);
}

@layer components {
  .glass-panel {
    @apply bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl;
  }
  .glass-panel-heavy {
    @apply bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl;
  }
}

:root {
  --sidebar-collapsed-width: 80px;
  --sidebar-expanded-width: 280px;
  --transition-smooth: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
"""

with open("e:/Khair_Murafiq_Empire/BillQyro/src/index.css", "w") as f:
    f.write(css_content)
