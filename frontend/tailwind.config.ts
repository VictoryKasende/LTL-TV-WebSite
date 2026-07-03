import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080F19',
          900: '#0D1B2A',
          800: '#152238',
          700: '#1B2637',
          600: '#334155',
          500: '#4C566A',
        },
        gold: {
          50:  '#FEF9E7',
          100: '#FCE9B1',
          200: '#F9D678',
          300: '#F7C34E',
          400: '#F5B333',
          500: '#F5A623',
          600: '#D48A0F',
          700: '#A76B08',
        },
        cream: {
          50:  '#FDFBF7',
          100: '#F8F5EF',
          200: '#EFE9DE',
          300: '#E4DAC7',
        },
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 7vw, 6.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2rem, 3.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(13, 27, 42, 0.12)',
        'card-hover': '0 12px 40px -12px rgba(13, 27, 42, 0.24)',
      },
      transitionTimingFunction: {
        'out-editorial': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
