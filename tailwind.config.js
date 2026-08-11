/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#141210',
        panel: '#1c1915',
        raised: '#26221b',
        line: '#38322a',
        cream: '#ece4d4',
        taupe: '#a0937c',
        glow: {
          DEFAULT: '#f5b841',
          bright: '#ffc95e',
        },
        signal: '#86c06b',
        alert: '#e76f51',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 14px rgba(245, 184, 65, 0.35)',
      },
    },
  },
  plugins: [],
};
