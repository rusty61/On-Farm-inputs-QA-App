import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0525a8",
          dark: "#03197d",
          light: "#4a80ff"
        },
        accent: {
          DEFAULT: "#00b300",
          dark: "#008f26",
          light: "#38f87c"
        },
        surface: {
          DEFAULT: "#050d24",
          foreground: "#e2e8f0",
          "100": "#07122f",
          "200": "#0b1a3d",
          "300": "#122550"
        }
      }
    }
  },
  plugins: []
};

export default config;
