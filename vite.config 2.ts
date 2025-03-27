import { sveltekit } from "@sveltejs/kit/vite";
import mkcert from 'vite-plugin-mkcert'
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), mkcert()],
  server: {
    https: true,
  },
});
