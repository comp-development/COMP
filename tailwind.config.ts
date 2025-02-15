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
          50: "#FFFCFC",
          100: "#99CAA2",
          200: "#87c993",
          300: "#4F7F62",
          400: "#1C6825",
          500: "#30653A",
          600: "#1c4f25",
          700: "#1F4B2A",
          800: "#0d2b14",
          900: "#212E1A",
        },
        secondary: {
          500: "#497B83",
          800: "#254b6d",
          900: "#111c3e",
        },
      },
    },
  },

  plugins: [flowbitePlugin],
} as Config;
