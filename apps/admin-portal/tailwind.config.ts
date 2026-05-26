import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          muted: '#475569',
          text: '#CBD5E1',
          heading: '#F1F5F9',
        },
        brand: {
          green: {
            DEFAULT: '#22C55E',
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
          },
          gold: {
            DEFAULT: '#D4AF37',
            50: '#FBF5DC',
            100: '#F7EBB9',
            200: '#EDD873',
            300: '#E4C44D',
            400: '#D4AF37',
            500: '#B8922A',
            600: '#9C761E',
            700: '#7F5A13',
            800: '#623E08',
            900: '#462200',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
