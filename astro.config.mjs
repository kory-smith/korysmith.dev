import { defineConfig } from "astro/config";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import prefetch from "@astrojs/prefetch";
import { astroImageTools } from "astro-imagetools";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
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
    astroImageTools
  ],
});
