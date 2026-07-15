import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep royal navy = main brand (from PC logo #212870)
        brand: {
          50:  '#EEF0FF',
          100: '#D8DDFF',
          200: '#B0BAFF',
          300: '#8492FF',
          400: '#5C6EF5',
          500: '#3D53EA', // bright blue accent / CTA
          600: '#2D40D0',
          700: '#212870', // primary deep navy
          800: '#1B2058',
          900: '#141640',
        },
        ink: {
          950: '#0F1114',
          900: '#242428', // deep dark section (contact block)
          800: '#2C2C2C',
          700: '#3D3E49',
          500: '#707070',
          400: '#7E7E7E',
          300: '#9C9CA5',
        },
        paper: {
          50:  '#FFFFFF',
          100: '#FAFAFA',
          200: '#F1F1F3',
          300: '#E4E4E8',
        },
        dlp:  '#E85521', // Dans Les Profondeurs
        raf:  '#3D53EA', // Rafraîchissement
        live: '#E23737', // LIVE badge
        amber: {
          400: '#F5C24E',
          500: '#F5A623',
        },
        cream: '#FBF6EE', // warm wall background (témoignages)
        terracotta: '#E2711D', // avatar gradient accent (témoignages)
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'Impact', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)',    { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1',    letterSpacing: '-0.01em' }],
        'display-md': ['clamp(1.75rem, 3.2vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.005em' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        card: '0 6px 24px -8px rgba(15, 17, 20, 0.08)',
        'card-hover': '0 16px 40px -12px rgba(15, 17, 20, 0.18)',
        'brand-glow': '0 12px 40px -8px rgba(61, 83, 234, 0.35)',
      },
      transitionTimingFunction: {
        'out-editorial': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.85)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'marquee-slow': 'marquee 52s linear infinite',
        'marquee-fast': 'marquee 38s linear infinite reverse',
      },
    },
  },
  plugins: [],
};

export default config;
