/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#05070c",
        bgAlt: "#090d16",
        panel: "#0c111c",
        line: "rgba(120,165,255,0.14)",
        lineStrong: "rgba(120,165,255,0.32)",
        blue: {
          DEFAULT: "#2f6fed",
          bright: "#5b9cff",
          glow: "#9fd2ff",
        },
        ink: "#e9edf7",
        muted: "#8a93a8",
        danger: "#ff6b6b",
        ok: "#4fd6a8",
      },
      fontFamily: {
        display: ["'Zen Kaku Gothic New'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        jp: ["'Noto Sans JP'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
