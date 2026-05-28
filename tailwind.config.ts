import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#08090f',
        surface: '#0e1018',
        elevated: '#14171f',
        hover: '#1a1d27',
        border: '#1f2330',
        divider: '#262a36',

        ink: {
          950: '#08090f',
          900: '#0e1018',
          850: '#14171f',
          800: '#1a1d27',
          700: '#262a36',
          600: '#3a3f4f',
        },

        mute: '#6b7080',
        soft: '#9aa0b0',
        text: '#e6e8ec',

        star: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#fbc02d',
          500: '#f5b400',
          600: '#d99a00',
          700: '#b07c00',
        },

        success: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        violet: '#8b5cf6',
        teal: '#14b8a6',
        rose: '#f43f5e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', '1rem'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        lift: '0 6px 30px -6px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        glow: '0 0 0 1px rgba(245,180,0,0.18), 0 8px 30px -10px rgba(245,180,0,0.25)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
