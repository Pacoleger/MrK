import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff9ff",
          100: "#dbf1ff",
          200: "#b9e6ff",
          300: "#7ad4ff",
          400: "#33bdff",
          500: "#0aa4f0",
          600: "#0084cf",
          700: "#0169a7",
          800: "#06598a",
          900: "#0b4a72",
        },
        accent: {
          50:  "#effefb",
          100: "#c9fef2",
          200: "#93fce7",
          300: "#55f2d9",
          400: "#22dfc5",
          500: "#0ac3ad",
          600: "#039d8d",
          700: "#087d72",
          800: "#0b635c",
          900: "#0e524d",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
