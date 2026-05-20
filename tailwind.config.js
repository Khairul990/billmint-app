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
        // Redefining standard colors to map perfectly to the BillQyro logo style
        slate: {
          50: '#f4f7f9',   // Cool soft white background
          100: '#e8edf2',  // Very soft border
          200: '#d5dee8',
          300: '#b0c0d4',
          400: '#849bba',
          500: '#5a759c',  // Muted gray-blue secondary text
          600: '#435b80',
          700: '#324663',
          800: '#1b273b',  // Premium dark surface border/details
          900: '#0f172a',  // Rich dark navy primary text / surfaces
          950: '#070d19',  // Deepest luxury dark mode navy background
        },
        indigo: {
          50: '#effaf5',   // Soft minty surface accent
          100: '#d7f5e9',  // Light mint border
          200: '#aff0d6',
          300: '#7ce7bf',
          400: '#4adba5',
          500: '#10B981',  // Brand Mint highlight (standard emerald/mint)
          600: '#059669',  // Rich brand mint
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        blue: {
          50: '#ecfeff',   // Soft teal-cyan surface
          100: '#cffafe',  // Light teal-cyan border
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // Brand Teal-Cyan secondary highlight
          600: '#0891b2',  // Rich brand teal
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        }
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(7, 13, 25, 0.03), 0 2px 8px -1px rgba(7, 13, 25, 0.02)',
        'premium-hover': '0 10px 25px -3px rgba(7, 13, 25, 0.06), 0 4px 12px -2px rgba(7, 13, 25, 0.03)',
      }
    },
  },
  plugins: [],
}
