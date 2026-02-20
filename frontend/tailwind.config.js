/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/static/**/*.{html,js}",
  ],
  theme: {
    screens: {
      'sm': '375px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        lcars: {
          orange: '#FF9900',
          'orange-light': '#FFCC99',
          blue: '#9999FF',
          'blue-dark': '#6688CC',
          magenta: '#CC6699',
          black: '#000000',
          white: '#FFFFFF',
          gray: '#444444',
        },
      },
      borderRadius: {
        'lcars': '24px',
        'lcars-pill': '50px',
      },
      fontSize: {
        'lcars-label': ['14px', { lineHeight: '1.2', textTransform: 'uppercase' }],
        'lcars-heading': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
