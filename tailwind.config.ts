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
    },
  },
  plugins: [],
} satisfies Config;
