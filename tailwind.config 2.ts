import type { Config } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";

export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        primary: {
          100: "var(--primary-tint)",
          200: "var(--primary-tint)",
          300: "var(--primary-light)",
          400: "var(--primary-light)",
          500: "var(--primary-light)",
          600: "var(--primary)",
          700: "var(--primary)",
          800: "var(--primary-dark)",
          900: "var(--primary-dark)",
        },
        secondary: {
          100: "var(--secondary-tint)",
          200: "var(--secondary-tint)",
          300: "var(--secondary-light)",
          400: "var(--secondary-light)",
          500: "var(--secondary-light)",
          600: "var(--secondary)",
          700: "var(--secondary)",
          800: "var(--secondary-dark)",
          900: "var(--secondary-dark)",
        },
        error: {
          200: "#ff8a8a",
          700: "#ff3636",
        },
        warning: {
          300: "#ffcc00",
          900: "#524100",
        }
      },
    },
  },

  plugins: [flowbitePlugin],
} as Config;
