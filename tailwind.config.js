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
        sans: ['Inter', 'sans-serif'],
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
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          danger: 'var(--status-danger)',
        }
      },
      backgroundImage: {
        'theme-accent-gradient': 'var(--accent-gradient)',
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(7, 13, 25, 0.03), 0 2px 8px -1px rgba(7, 13, 25, 0.02)',
        'premium-hover': '0 10px 25px -3px rgba(7, 13, 25, 0.06), 0 4px 12px -2px rgba(7, 13, 25, 0.03)',
        'theme-glow': '0 4px 24px -4px var(--accent-glow)',
      },
      animation: {
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
      },
      keyframes: {
        "spin-around": {
          "0%": {
            transform: "translateZ(0) rotate(0)",
          },
          "15%, 35%": {
            transform: "translateZ(0) rotate(90deg)",
          },
          "65%, 85%": {
            transform: "translateZ(0) rotate(270deg)",
          },
          "100%": {
            transform: "translateZ(0) rotate(360deg)",
          },
        },
      }
    },
  },
  plugins: [],
}
