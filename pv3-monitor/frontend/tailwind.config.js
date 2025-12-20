/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Energy monitoring color palette
        battery: {
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
          charging: '#3b82f6',
        },
        grid: {
          import: '#8b5cf6',
          export: '#f97316',
        },
        solar: {
          DEFAULT: '#fbbf24',
          bright: '#fcd34d',
        },
        house: {
          DEFAULT: '#64748b',
        },
        status: {
          online: '#22c55e',
          offline: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'flow': 'flow 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}

