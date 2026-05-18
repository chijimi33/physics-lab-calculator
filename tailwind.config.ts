import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#ffffff",
        rule: "#e2e8f0",
        accent: "#24577a",
      },
      boxShadow: {
        report: "none",
      },
    },
  },
  plugins: [],
};

export default config;
