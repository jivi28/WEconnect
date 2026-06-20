import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wurth: {
          red: "#cc0000",
          dark: "#1a1a1a",
        },
        roi: {
          good: "#16a34a",
          mid: "#f59e0b",
          poor: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
