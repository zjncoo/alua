/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'bergen-mono': ['Bergen Mono', 'monospace'],
        'neue-haas': ['Inter', 'sans-serif'], // Keeping Inter for compatibility with App.jsx
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
