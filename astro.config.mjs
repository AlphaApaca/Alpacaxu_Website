import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.alpacaxu.cn",
  output: "static",
  trailingSlash: "always",
  prefetch: { prefetchAll: false, defaultStrategy: "hover" }
});
