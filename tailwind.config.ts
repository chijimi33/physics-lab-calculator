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
        ink: "#1f2937",
        paper: "#ffffff",
        rule: "#d1d5db",
        accent: "#1f4e79",
      },
      boxShadow: {
        report: "none",
      },
    },
  },
  plugins: [],
};

export default config;
