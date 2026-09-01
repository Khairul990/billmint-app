/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        numbers: ['"Space Grotesk"', 'JetBrains Mono', 'monospace'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      colors: {
        theme: {
          app: 'var(--app-bg)',
          'app-soft': 'var(--app-bg-soft)',
          surface: 'var(--surface)',
          'surface-elevated': 'var(--surface-elevated)',
          card: 'var(--card-bg)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          'button-text': 'var(--button-text)',
          'border-soft': 'var(--border-soft)',
          'border-strong': 'var(--border-strong)',
          accent: 'var(--accent)',
          'accent-light': 'var(--accent-light)',
          'accent-dark': 'var(--accent-dark)',
          'sidebar-bg': 'var(--sidebar-bg)',
          'sidebar-active': 'var(--sidebar-active)',
          'sidebar-text': 'var(--sidebar-text)',
          'input-bg': 'var(--input-bg)',
          'chart-primary': 'var(--chart-primary)',
          'luxury-accent': 'var(--luxury-accent, var(--accent))',
          'luxury-companion': 'var(--luxury-companion, var(--surface))',
          'tint-bg': 'var(--theme-tint-bg, transparent)',
          'tint-surface': 'var(--theme-tint-surface, transparent)',
          'tint-border': 'var(--theme-tint-border, var(--border-soft))',
          'tint-hover': 'var(--theme-tint-hover, var(--sidebar-active))',
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          danger: 'var(--status-danger)',
        },
        brand: {
          pink: '#C81E5C',
          gold: '#D4AF7A',
          cream: '#FAF7F2',
          charcoal: '#1F1B1D'
        }
      },
      backgroundImage: {
        'theme-accent-gradient': 'var(--accent-gradient)',
        'theme-glass': 'var(--glass-bg)',
      },
      boxShadow: {
        'premium-sm': '0 4px 16px -2px rgba(7, 13, 25, 0.02), 0 2px 6px -1px rgba(7, 13, 25, 0.015)',
        'premium': '0 8px 24px -4px rgba(7, 13, 25, 0.04), 0 4px 10px -2px rgba(7, 13, 25, 0.02)',
        'premium-hover': '0 12px 32px -6px rgba(7, 13, 25, 0.05), 0 6px 14px -4px rgba(7, 13, 25, 0.025)',
        'premium-lg': '0 16px 48px -12px rgba(7, 13, 25, 0.06), 0 8px 20px -6px rgba(7, 13, 25, 0.03)',
        'premium-xl': '0 24px 64px -16px rgba(7, 13, 25, 0.10), 0 12px 32px -8px rgba(7, 13, 25, 0.05)',
        'theme-glow': '0 4px 24px -4px var(--accent-glow)',
        'theme-glow-lg': '0 8px 40px -8px var(--accent-glow)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.10)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        'premium': '0.75rem',
        'premium-lg': '1rem',
        'premium-xl': '1.25rem',
        'premium-2xl': '1.5rem',
      },
      letterSpacing: {
        'premium': '0.02em',
        'premium-wide': '0.05em',
        'premium-wider': '0.08em',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "fade-in-down": "fadeInDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
        "skeleton": "skeleton 1.5s ease-in-out infinite",
        "count-up": "countUp 0.6s ease-out",
        "blob": "blob 10s infinite alternate ease-in-out",
      },
      keyframes: {
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        skeleton: {
          "0%": { opacity: "0.6" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.6" },
        },
        countUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
            borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%"
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
            borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%"
          }
        }
      }
    },
  },
  plugins: [],
}
