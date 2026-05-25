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
        brand: {
          green: {
            DEFAULT: '#1B4332',
            50: '#E8F5EE',
            100: '#D1EBDD',
            200: '#A3D7BB',
            300: '#75C299',
            400: '#47AE77',
            500: '#2D8A58',
            600: '#236E46',
            700: '#1B4332',
            800: '#122C22',
            900: '#091611',
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
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
