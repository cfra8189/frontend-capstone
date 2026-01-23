/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#ffffff",
      },
      fontFamily: {
        mono: ["Chicago", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
