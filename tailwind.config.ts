import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Polaris palette — deep navy + a warm gold "north-star" accent.
        ink: {
          950: '#0a0f1f',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        star: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        good: '#22c55e',
        bad: '#ef4444',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
