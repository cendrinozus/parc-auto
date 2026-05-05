export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cipres: {
          50:  '#FDF5F0',
          100: '#FAE8DC',
          200: '#F4CEBC',
          300: '#EAA98C',
          400: '#DD7D57',
          500: '#C96039',
          600: '#AD522D',
          700: '#8B3F22',
          800: '#6B2F18',
          900: '#3D1A0A',
          950: '#1C0A04',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      }
    }
  },
  plugins: []
}