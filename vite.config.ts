import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset URLs, so the build works under any path
  // (e.g. GitHub Pages at https://<user>.github.io/escaperoom/).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
