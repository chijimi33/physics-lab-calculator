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
        ink: "#1f2933",
        paper: "#f8fafc",
        rule: "#cbd5e1",
        accent: "#2563eb",
      },
      boxShadow: {
        report: "0 18px 45px rgba(31, 41, 51, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
