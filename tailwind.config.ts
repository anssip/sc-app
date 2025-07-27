import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
        },
        accent: {
          1: "var(--color-accent-1)",
          2: "var(--color-accent-2)",
        },
        gray: {
          100: "var(--color-gray-100)",
          300: "var(--color-gray-300)",
          500: "var(--color-gray-500)",
        },
        background: {
          secondary: "var(--color-background-secondary)",
        },
      },
      fontFamily: {
        sans: ["var(--font-secondary)"],
        primary: ["var(--font-primary)"],
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-bg": "var(--gradient-bg)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-green": "var(--shadow-glow-green)",
        card: "var(--shadow-card)",
      },
      borderColor: {
        DEFAULT: "var(--border-color)",
        highlight: "var(--border-color-highlight)",
      },
      colors: {
        "pricing-green": "var(--color-pricing-green)",
      },
    },
  },
  plugins: [],
} satisfies Config;
