/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0c0f",
        surface: "#14141a",
        surface2: "#1c1c26",
        border: "#2a2a38",
        accent: "#7c6aff", // Purple
        accent2: "#ff6a6a", // Red
        accent3: "#43e8a0", // Green
        accent4: "#f9c846", // Yellow
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['Figtree', 'sans-serif'],
      },
    },
  },
  plugins: [],
}