/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf7',
          100: '#d8f3e8',
          200: '#b4e6d3',
          300: '#7ed0b0',
          400: '#49b98d',
          500: '#1c9f73',
          600: '#0f865f',
          700: '#0d6a4c',
          800: '#0c533f',
          900: '#0a4435',
        },
        medical: {
          50: '#f1f9ff',
          100: '#dfeefd',
          200: '#bdddfb',
          300: '#8ec3fb',
          400: '#5ca9f5',
          500: '#2e88e8',
          600: '#226fca',
          700: '#1d59a5',
          800: '#1c4d87',
          900: '#1c446f',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 133, 95, 0.12)',
      },
    },
  },
  plugins: [],
};
