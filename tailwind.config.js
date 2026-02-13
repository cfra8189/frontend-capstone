/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "theme-primary": "var(--text-primary)",
        "theme-secondary": "var(--text-secondary)",
        "theme-muted": "var(--text-muted)",
      },
      backgroundColor: {
        "theme-primary": "var(--bg-primary)",
        "theme-secondary": "var(--bg-secondary)",
        "theme-tertiary": "var(--bg-tertiary)",
      },
      borderColor: {
        theme: "var(--border-color)",
        accent: "var(--accent)",
      },
      fontFamily: {
        mono: ["Chicago", "JetBrains Mono", "monospace"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
}
