import { defineConfig } from "astro/config";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import prefetch from "@astrojs/prefetch";
import subfont from "@ernxst/subfont/astro";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  site: "https://korysmith.dev/",
  adapter: cloudflare({
    mode: "directory",
  }),
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    prefetch({ throttle: 3 }),
    subfont(),
    sitemap(),
  ],
});
