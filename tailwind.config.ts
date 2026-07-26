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
        parchment: "#EDE6D6",
        "parchment-2": "#E4DAC5",
        ink: "#1B2438",
        "ink-2": "#2A3550",
        bronze: "#B08D57",
        "bronze-dark": "#8A6B3D",
        terracotta: "#8C3B2E",
        line: "rgba(27,36,56,0.18)",
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
