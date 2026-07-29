/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16241F",
        paper: "#F5F6F1",
        surface: "#FFFFFF",
        line: "#DCE3DD",
        pine: {
          50: "#EAF3F0",
          100: "#CFE4DD",
          300: "#7FB3A3",
          500: "#0F6B5C",
          600: "#0B564A",
          700: "#08453B",
        },
        clay: {
          400: "#E48A6C",
          500: "#D9714F",
          600: "#B65B3D",
        },
        amber: {
          400: "#E3A63E",
          500: "#CC8F2A",
        },
        slate: {
          400: "#8B948E",
          500: "#6B7570",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.55)", opacity: "0.55" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        sweep: "sweep 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};
