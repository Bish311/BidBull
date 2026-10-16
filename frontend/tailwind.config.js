/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "var(--bg-page)",
          card: "var(--bg-card)",
          subpanel: "var(--bg-subpanel)",
          border: "var(--border-color)",
          text: "var(--text-main)",
          muted: "var(--text-muted)",
          accent: "var(--accent-primary)",
          accentHover: "var(--accent-primary-hover)",
          danger: "var(--accent-danger)",
          dangerBg: "var(--accent-danger-bg)",
          badgeBg: "var(--accent-badge-bg)",
          badgeText: "var(--accent-badge-text)",
        },
      },
    },
  },
  plugins: [],
};
