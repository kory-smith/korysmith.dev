import { defineConfig } from "astro/config";
// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import prefetch from "@astrojs/prefetch";

// https://astro.build/config
export default defineConfig({
  output: "server",
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
  ],
});
