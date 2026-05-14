module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00D66A',
        secondary: '#004D37',
        'mongo-green': '#00D66A',
        'mongo-green-light': '#2FE691',
        'mongo-green-dark': '#00A652',
        'mongo-dark': '#001E2B',
        'mongo-forest': '#004D37',
        'mongo-leaf': '#0B7F4A',
        'mongo-soft': '#C8F7E0',
        'mongo-mist': '#E1F5ED',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 214, 106, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 214, 106, 0.5)',
      },
      backdropBlur: {
        'xl': '20px',
      },
    },
  },
  plugins: [],
}
