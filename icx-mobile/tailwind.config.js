/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.js", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
       
        earth: {
          bg: "#F5E8D5",       
          primary: "#5F8063",  
          dark: "#2F3E32",      
          card: "#FFF8F0",      
          accent: "#D4A373",    
        }
      }
    },
  },
  plugins: [],
}
