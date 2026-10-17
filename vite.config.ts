import { readFileSync } from "fs";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  base: "/endless-runner-phaser/",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
  },
  build: {
    // Phaser alone is ~1.4 MB minified and can't be split further.
    chunkSizeWarningLimit: 1500,
  },
});
