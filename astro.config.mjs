import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

import solidJs from "@astrojs/solid-js";

export default defineConfig({
  output: "server",

  adapter: node({
    mode: "standalone",
  }),
  security: {
    checkOrigin: false,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [solidJs()],
});

