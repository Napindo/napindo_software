/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        header: ['Poppins', 'Inter', 'sans-serif'],
      },
      colors: {
        napindo: {
          red: '#e63946',
          dark: '#9f0f0f',
        },
      },
      boxShadow: {
        card: '0 25px 60px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'napindo-gradient': 'linear-gradient(135deg, #e63946, #9f0f0f)',
      },
    },
  },
  plugins: [],
}
