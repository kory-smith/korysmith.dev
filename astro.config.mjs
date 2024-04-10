import { defineConfig, passthroughImageService } from "astro/config";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

let site = "";
const isProd = process.env.ENVIRONMENT === "production";
if (isProd) {
  site = "https://korysmith.dev";
} else {
  site = "https://stage.korysmith.dev";
}

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  image: {
    service: passthroughImageService(),
  },
  site,
  adapter: cloudflare({
    mode: "directory",
  }),
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: true,
    experimental: {
      clientPrerender: true,
    },
  },
  markdown: {
    shikiConfig: {
      theme: "dracula"
    }
  },
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    isProd && sitemap(),
  ],
  experimental: {
    contentCollectionCache: true,
  },
});
