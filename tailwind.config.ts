import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EA",
        "cream-dark": "#EDE5D3",
        ink: "#2B2620",
        forest: "#2F4F3E",
        "forest-dark": "#22392E",
        ochre: "#C98A2B",
        card: "#FFFDF8",
      },
      fontFamily: {
        display: ['"Lora"', "Georgia", "serif"],
        body: ['"Work Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
