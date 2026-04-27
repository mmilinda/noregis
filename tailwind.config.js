/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A1628',
          blue: {
            DEFAULT: '#1E40AF',
            bright: '#3B82F6',
            light: '#DBEAFE',
          },
          green: {
            DEFAULT: '#065F46',
            bright: '#10B981',
            light: '#D1FAE5',
          },
          amber: {
            DEFAULT: '#92400E',
            bright: '#F59E0B',
            light: '#FEF3C7',
          },
          red: {
            DEFAULT: '#991B1B',
            bright: '#EF4444',
            light: '#FEE2E2',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
