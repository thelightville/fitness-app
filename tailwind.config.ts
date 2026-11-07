import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Manrope', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
        flame: {
          100: '#ffedd5',
          300: '#fdba74',
          500: '#f97316',
          600: '#ea580c',
        },
        ink: {
          900: '#10130f',
          800: '#191d16',
          700: '#262b20',
        },
        brand: {
          paper: 'rgb(var(--brand-paper) / <alpha-value>)',
          card: 'rgb(var(--brand-card) / <alpha-value>)',
          ink: 'rgb(var(--brand-ink) / <alpha-value>)',
          muted: 'rgb(var(--brand-muted) / <alpha-value>)',
          line: 'rgb(var(--brand-line) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
          flame: 'rgb(var(--brand-flame) / <alpha-value>)',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 18px 45px -30px rgb(16 19 15 / 0.55)',
        'card-hover': '0 28px 70px -42px rgb(16 19 15 / 0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
