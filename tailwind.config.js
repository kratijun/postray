/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffef0',
          100: '#fffde6',
          200: '#fff9cc',
          300: '#fff4b3',
          400: '#ffef99',
          500: '#ffe880',
          600: '#e6d173',
          700: '#ccba66',
          800: '#b3a359',
          900: '#998c4d',
        },
        status: {
          open: '#ef4444',
          delivered: '#22c55e',
          unclear: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

