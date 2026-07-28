import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Traditional parchment/bronze palette, used across every page.
        // Kept 1:1 with the CSS custom properties in globals.css.
        parchment: "#EDE6D6",
        "parchment-2": "#E3DBC7",
        ink: "#1B2438",
        "ink-2": "#3C4658",
        bronze: "#B08D57",
        "bronze-dark": "#8F6A35",
        terracotta: "#A8553C",
        line: "rgba(27,36,56,0.14)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        cinzel: ["var(--font-cinzel)", "Georgia", "serif"],
        crimson: ["var(--font-crimson)", "Georgia", "serif"],
        ebgaramond: ["var(--font-ebgaramond)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
