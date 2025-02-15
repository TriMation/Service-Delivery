/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'aurora': 'aurora 30s linear infinite'
      },
      keyframes: {
        aurora: {
          'from': {
            'background-position': '50% 50%, 50% 50%'
          },
          'to': {
            'background-position': '300% 50%, 300% 50%'
          }
        }
      }
    },
  },
  plugins: [],
};
