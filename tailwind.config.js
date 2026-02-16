/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 预设一些深色模式的高级灰配色，后续UI用到
        background: '#0a0a0a',
        surface: '#171717',
        primary: '#3b82f6', 
      }
    },
  },
  plugins: [],
}