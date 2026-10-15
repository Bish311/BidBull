/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#0f1115",
          panel: "#16181f",
          border: "#252836",
          accent: "#2563eb",
          accentHover: "#1d4ed8",
          danger: "#ef4444",
          success: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};
