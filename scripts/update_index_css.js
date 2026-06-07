const fs = require('fs');

const cssContent = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

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

/* Global Theme Transition */
body, body *, ::before, ::after {
  transition: background-color 700ms ease-in-out, 
              border-color 700ms ease-in-out, 
              color 700ms ease-in-out, 
              box-shadow 700ms ease-in-out,
              fill 700ms ease-in-out,
              stroke 700ms ease-in-out;
}

/* Override for elements that define their own transitions (e.g. Tailwind transition-all) so hover states aren't sluggish */
.transition, .transition-all, .transition-colors, .transition-opacity, .transition-shadow, .transition-transform {
  transition-duration: 300ms;
}

@layer base {
  /* 1. BillQyro Classic (Professional + Friendly) */
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
    --app-bg: #14110F;
    --app-bg-soft: #1C1815;
    --surface: #14110F;
    --surface-elevated: #1C1815;
    --card-bg: #1C1815;
    --text-primary: #FAF9F6;
    --text-secondary: #EAE6DF;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(249, 115, 22, 0.15);
    --border-strong: rgba(249, 115, 22, 0.3);
    --accent: #F97316;
    --accent-light: rgba(249, 115, 22, 0.15);
    --accent-dark: #FB923C;
    --accent-gradient: linear-gradient(135deg, #F97316, #FB923C);
    --accent-glow: rgba(249, 115, 22, 0.3);
    --sidebar-bg: #0F0D0B;
    --sidebar-active: rgba(249, 115, 22, 0.15);
    --sidebar-text: #FAF9F6;
    --input-bg: #241E1A;
    --chart-primary: #FB923C;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }

  /* 2. Rose Gold Luxe (Premium Luxury SaaS) */
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

  /* 3. Ocean Mist (Modern Technology) */
  [data-theme="ocean"] {
    --app-bg: #F0F8FA;
    --app-bg-soft: #E1F2F5;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #0F2E35;
    --text-secondary: #1F4A55;
    --text-muted: #5C838F;
    --button-text: #FFFFFF;
    --border-soft: rgba(4, 147, 166, 0.15);
    --border-strong: rgba(4, 147, 166, 0.3);
    --accent: #0493A6;
    --accent-light: rgba(4, 147, 166, 0.08);
    --accent-dark: #026773;
    --accent-gradient: linear-gradient(135deg, #0493A6, #3EBDCC);
    --accent-glow: rgba(4, 147, 166, 0.25);
    --sidebar-bg: #F0F8FA;
    --sidebar-active: rgba(4, 147, 166, 0.1);
    --sidebar-text: #0F2E35;
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

  /* 4. Emerald Prestige (Business & Finance) */
  [data-theme="emerald"] {
    --app-bg: #F2F9F5;
    --app-bg-soft: #E2F2E9;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #112A1F;
    --text-secondary: #1F4533;
    --text-muted: #5B836F;
    --button-text: #FFFFFF;
    --border-soft: rgba(16, 185, 129, 0.15);
    --border-strong: rgba(16, 185, 129, 0.3);
    --accent: #10B981;
    --accent-light: rgba(16, 185, 129, 0.08);
    --accent-dark: #059669;
    --accent-gradient: linear-gradient(135deg, #10B981, #34D399);
    --accent-glow: rgba(16, 185, 129, 0.25);
    --sidebar-bg: #F2F9F5;
    --sidebar-active: rgba(16, 185, 129, 0.1);
    --sidebar-text: #112A1F;
    --input-bg: #FFFFFF;
    --chart-primary: #10B981;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="emerald"] {
    --app-bg: #0A140F;
    --app-bg-soft: #122119;
    --surface: #0A140F;
    --surface-elevated: #122119;
    --card-bg: #122119;
    --text-primary: #E0F0E8;
    --text-secondary: #BDDFCC;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #112A1F;
    --border-soft: rgba(52, 211, 153, 0.15);
    --border-strong: rgba(52, 211, 153, 0.3);
    --accent: #34D399;
    --accent-light: rgba(52, 211, 153, 0.15);
    --accent-dark: #6EE7B7;
    --accent-gradient: linear-gradient(135deg, #34D399, #6EE7B7);
    --accent-glow: rgba(52, 211, 153, 0.3);
    --sidebar-bg: #070E0A;
    --sidebar-active: rgba(52, 211, 153, 0.15);
    --sidebar-text: #E0F0E8;
    --input-bg: #1A2E22;
    --chart-primary: #34D399;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 5. Royal Indigo (Startup SaaS) */
  [data-theme="indigo"] {
    --app-bg: #F6F6FA;
    --app-bg-soft: #EDEDF5;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #1B1A31;
    --text-secondary: #323055;
    --text-muted: #6C6A93;
    --button-text: #FFFFFF;
    --border-soft: rgba(79, 70, 229, 0.15);
    --border-strong: rgba(79, 70, 229, 0.3);
    --accent: #4F46E5;
    --accent-light: rgba(79, 70, 229, 0.08);
    --accent-dark: #3730A3;
    --accent-gradient: linear-gradient(135deg, #4F46E5, #818CF8);
    --accent-glow: rgba(79, 70, 229, 0.25);
    --sidebar-bg: #F6F6FA;
    --sidebar-active: rgba(79, 70, 229, 0.1);
    --sidebar-text: #1B1A31;
    --input-bg: #FFFFFF;
    --chart-primary: #4F46E5;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="indigo"] {
    --app-bg: #0E0D14;
    --app-bg-soft: #171622;
    --surface: #0E0D14;
    --surface-elevated: #171622;
    --card-bg: #171622;
    --text-primary: #EBEBFA;
    --text-secondary: #C8C7E8;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(129, 140, 248, 0.15);
    --border-strong: rgba(129, 140, 248, 0.3);
    --accent: #818CF8;
    --accent-light: rgba(129, 140, 248, 0.15);
    --accent-dark: #A5B4FC;
    --accent-gradient: linear-gradient(135deg, #818CF8, #A5B4FC);
    --accent-glow: rgba(129, 140, 248, 0.3);
    --sidebar-bg: #0A090E;
    --sidebar-active: rgba(129, 140, 248, 0.15);
    --sidebar-text: #EBEBFA;
    --input-bg: #201E2E;
    --chart-primary: #818CF8;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 6. Midnight Platinum (Apple / Notion Inspired) */
  [data-theme="midnight"] {
    --app-bg: #F5F5F7;
    --app-bg-soft: #EBEBEF;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #1D1D1F;
    --text-secondary: #515154;
    --text-muted: #86868B;
    --button-text: #FFFFFF;
    --border-soft: rgba(0, 0, 0, 0.08);
    --border-strong: rgba(0, 0, 0, 0.16);
    --accent: #1D1D1F;
    --accent-light: rgba(0, 0, 0, 0.05);
    --accent-dark: #000000;
    --accent-gradient: linear-gradient(135deg, #434343, #1D1D1F);
    --accent-glow: rgba(0, 0, 0, 0.15);
    --sidebar-bg: #F5F5F7;
    --sidebar-active: rgba(0, 0, 0, 0.06);
    --sidebar-text: #1D1D1F;
    --input-bg: #FFFFFF;
    --chart-primary: #1D1D1F;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="midnight"] {
    --app-bg: #000000;
    --app-bg-soft: #121212;
    --surface: #000000;
    --surface-elevated: #121212;
    --card-bg: #121212;
    --text-primary: #F5F5F7;
    --text-secondary: #A1A1A6;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #000000;
    --border-soft: rgba(255, 255, 255, 0.1);
    --border-strong: rgba(255, 255, 255, 0.2);
    --accent: #F5F5F7;
    --accent-light: rgba(255, 255, 255, 0.1);
    --accent-dark: #FFFFFF;
    --accent-gradient: linear-gradient(135deg, #EBEBEF, #FFFFFF);
    --accent-glow: rgba(255, 255, 255, 0.2);
    --sidebar-bg: #0A0A0A;
    --sidebar-active: rgba(255, 255, 255, 0.1);
    --sidebar-text: #F5F5F7;
    --input-bg: #1C1C1E;
    --chart-primary: #F5F5F7;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 7. Soft Sakura (Elegant Modern) */
  [data-theme="sakura"] {
    --app-bg: #FFF5F7;
    --app-bg-soft: #FFEAF0;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #3A1B28;
    --text-secondary: #5C3246;
    --text-muted: #8C5C74;
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
    --sidebar-text: #3A1B28;
    --input-bg: #FFFFFF;
    --chart-primary: #F472B6;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="sakura"] {
    --app-bg: #140D10;
    --app-bg-soft: #201318;
    --surface: #140D10;
    --surface-elevated: #201318;
    --card-bg: #201318;
    --text-primary: #FFEAF0;
    --text-secondary: #E3BCCC;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(249, 168, 212, 0.15);
    --border-strong: rgba(249, 168, 212, 0.3);
    --accent: #F9A8D4;
    --accent-light: rgba(249, 168, 212, 0.15);
    --accent-dark: #FBCFE8;
    --accent-gradient: linear-gradient(135deg, #F9A8D4, #FBCFE8);
    --accent-glow: rgba(249, 168, 212, 0.3);
    --sidebar-bg: #0D080A;
    --sidebar-active: rgba(249, 168, 212, 0.15);
    --sidebar-text: #FFEAF0;
    --input-bg: #291820;
    --chart-primary: #F9A8D4;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 8. Desert Sand (Retail / Boutique) */
  [data-theme="desert"] {
    --app-bg: #FCF9F5;
    --app-bg-soft: #F2EBE1;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #382C22;
    --text-secondary: #574637;
    --text-muted: #8C7867;
    --button-text: #FFFFFF;
    --border-soft: rgba(212, 163, 115, 0.15);
    --border-strong: rgba(212, 163, 115, 0.3);
    --accent: #D4A373;
    --accent-light: rgba(212, 163, 115, 0.08);
    --accent-dark: #A87B51;
    --accent-gradient: linear-gradient(135deg, #D4A373, #E6C2A1);
    --accent-glow: rgba(212, 163, 115, 0.25);
    --sidebar-bg: #FCF9F5;
    --sidebar-active: rgba(212, 163, 115, 0.1);
    --sidebar-text: #382C22;
    --input-bg: #FFFFFF;
    --chart-primary: #D4A373;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="desert"] {
    --app-bg: #14110E;
    --app-bg-soft: #211A15;
    --surface: #14110E;
    --surface-elevated: #211A15;
    --card-bg: #211A15;
    --text-primary: #F2EBE1;
    --text-secondary: #D1C5B6;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #211A15;
    --border-soft: rgba(230, 194, 161, 0.15);
    --border-strong: rgba(230, 194, 161, 0.3);
    --accent: #E6C2A1;
    --accent-light: rgba(230, 194, 161, 0.15);
    --accent-dark: #F5DEC9;
    --accent-gradient: linear-gradient(135deg, #E6C2A1, #F5DEC9);
    --accent-glow: rgba(230, 194, 161, 0.3);
    --sidebar-bg: #0D0A08;
    --sidebar-active: rgba(230, 194, 161, 0.15);
    --sidebar-text: #F2EBE1;
    --input-bg: #2E231B;
    --chart-primary: #E6C2A1;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 9. Obsidian Gold (Ultra Premium Executive) */
  [data-theme="obsidian"] {
    --app-bg: #F0F0F0;
    --app-bg-soft: #E0E0E0;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #0F0F0F;
    --text-secondary: #333333;
    --text-muted: #666666;
    --button-text: #FFFFFF;
    --border-soft: rgba(212, 175, 55, 0.2);
    --border-strong: rgba(212, 175, 55, 0.4);
    --accent: #D4AF37;
    --accent-light: rgba(212, 175, 55, 0.1);
    --accent-dark: #9E8224;
    --accent-gradient: linear-gradient(135deg, #D4AF37, #F3E5AB);
    --accent-glow: rgba(212, 175, 55, 0.3);
    --sidebar-bg: #F0F0F0;
    --sidebar-active: rgba(212, 175, 55, 0.1);
    --sidebar-text: #0F0F0F;
    --input-bg: #FFFFFF;
    --chart-primary: #D4AF37;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="obsidian"] {
    --app-bg: #050505;
    --app-bg-soft: #0F0F0F;
    --surface: #050505;
    --surface-elevated: #0F0F0F;
    --card-bg: #0F0F0F;
    --text-primary: #F3E5AB;
    --text-secondary: #D4AF37;
    --text-muted: rgba(212, 175, 55, 0.6);
    --button-text: #050505;
    --border-soft: rgba(212, 175, 55, 0.15);
    --border-strong: rgba(212, 175, 55, 0.3);
    --accent: #D4AF37;
    --accent-light: rgba(212, 175, 55, 0.15);
    --accent-dark: #F3E5AB;
    --accent-gradient: linear-gradient(135deg, #D4AF37, #F3E5AB);
    --accent-glow: rgba(212, 175, 55, 0.3);
    --sidebar-bg: #000000;
    --sidebar-active: rgba(212, 175, 55, 0.15);
    --sidebar-text: #F3E5AB;
    --input-bg: #1A1A1A;
    --chart-primary: #D4AF37;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

  /* 10. Crimson Executive (Corporate Leadership) */
  [data-theme="crimson"] {
    --app-bg: #F8F4F5;
    --app-bg-soft: #EFE7E9;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-primary: #2C181D;
    --text-secondary: #4A2E35;
    --text-muted: #7A5C64;
    --button-text: #FFFFFF;
    --border-soft: rgba(139, 0, 0, 0.1);
    --border-strong: rgba(139, 0, 0, 0.25);
    --accent: #8B0000;
    --accent-light: rgba(139, 0, 0, 0.06);
    --accent-dark: #5C0000;
    --accent-gradient: linear-gradient(135deg, #8B0000, #C21807);
    --accent-glow: rgba(139, 0, 0, 0.2);
    --sidebar-bg: #F8F4F5;
    --sidebar-active: rgba(139, 0, 0, 0.08);
    --sidebar-text: #2C181D;
    --input-bg: #FFFFFF;
    --chart-primary: #8B0000;
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-danger: #EF4444;
  }
  .dark[data-theme="crimson"] {
    --app-bg: #120A0C;
    --app-bg-soft: #1C1114;
    --surface: #120A0C;
    --surface-elevated: #1C1114;
    --card-bg: #1C1114;
    --text-primary: #F0E6E8;
    --text-secondary: #CBB9BD;
    --text-muted: rgba(255, 255, 255, 0.5);
    --button-text: #FFFFFF;
    --border-soft: rgba(194, 24, 7, 0.15);
    --border-strong: rgba(194, 24, 7, 0.3);
    --accent: #C21807;
    --accent-light: rgba(194, 24, 7, 0.15);
    --accent-dark: #E34234;
    --accent-gradient: linear-gradient(135deg, #C21807, #E34234);
    --accent-glow: rgba(194, 24, 7, 0.3);
    --sidebar-bg: #0A0506;
    --sidebar-active: rgba(194, 24, 7, 0.15);
    --sidebar-text: #F0E6E8;
    --input-bg: #26161A;
    --chart-primary: #C21807;
    --status-success: #34D399;
    --status-warning: #FBBF24;
    --status-danger: #F87171;
  }

}

@layer utilities {
  .shadow-premium {
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }
  
  .glow-emerald {
    box-shadow: 0 0 24px -4px var(--accent-glow);
  }

  .text-gradient {
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: var(--accent-gradient);
  }

  /* Scrollbar hide utility */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

/* Base custom styles for body background */
body {
  background-color: var(--app-bg);
  color: var(--text-primary);
  min-height: 100vh;
}

/* Range input styling */
input[type=range] {
  -webkit-appearance: none;
  background: transparent;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: var(--border-strong);
  border-radius: 2px;
}
.dark input[type=range]::-webkit-slider-runnable-track {
  background: var(--border-soft);
}
\`;

fs.writeFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/index.css', cssContent);
console.log('index.css fully updated!');
