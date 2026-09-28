/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#B30E2E',
          reddark: '#8A0B22',
          redlight: '#FFF0F2',
          green: '#0D5235',
          greendark: '#083B25',
          greenlight: '#EBF5F0',
          50: '#fff0f2',
          100: '#fde2e6',
          200: '#fcc7ce',
          500: '#b30e2e',
          600: '#990a25',
          700: '#80071e',
          800: '#660417',
          900: '#40020d',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Poppins', 'sans-serif'],
        cursive: ['Sacramento', 'Dancing Script', 'cursive']
      }
    },
  },
  plugins: [],
}
