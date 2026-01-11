/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.js", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Renamed 'glass' to 'earth' to match the new vibe
        earth: {
          bg: "#F5E8D5",        // Cream Background (The main canvas)
          primary: "#5F8063",   // Sage Green (Buttons, Active Icons)
          dark: "#2F3E32",      // Deep Forest Green (Text, Headlines)
          card: "#FFF8F0",      // Light Cream (Cards, Input Fields)
          accent: "#D4A373",    // Warm Brown/Orange (Highlights, Streaks)
        }
      }
    },
  },
  plugins: [],
}