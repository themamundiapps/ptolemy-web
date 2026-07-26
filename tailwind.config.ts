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
        background: "#0D0D1A",
        surface: "#15152A",
        gold: "#C9A84C",
        ink: "#E8E8E8",
        muted: "#9C9CB0",
        // Landing-page-only palette, matching ptolemy-landing-en.html exactly.
        // Kept separate from the dark theme above, which the rest of the app
        // (/chart, /chart/[id]) still uses.
        parchment: "#EDE6D6",
        parchment2: "#E4DAC5",
        navy: "#1B2438",
        navy2: "#2A3550",
        bronze: "#B08D57",
        "bronze-dark": "#8A6B3D",
        terracotta: "#8C3B2E",
        hairline: "rgba(27,36,56,0.18)",
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
