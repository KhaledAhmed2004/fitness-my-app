/** @type {import('tailwindcss').Config} */
const { tailwindColors, tailwindFonts, tailwindRadius } = require('./constants/tokens');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindColors,
      borderRadius: tailwindRadius,
      fontFamily: tailwindFonts,
    },
  },
  plugins: [],
};
