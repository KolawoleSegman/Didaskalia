import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      // Give every build its own service-worker cache so returning visitors always get the new version.
      name: "stamp-service-worker",
      apply: "build",
      closeBundle() {
        try {
          const file = "dist/sw.js";
          writeFileSync(file, readFileSync(file, "utf8").replace("__BUILD__", Date.now().toString(36)));
        } catch {
          /* no service worker in this build */
        }
      },
    },
  ],
  build: { outDir: "dist", target: "es2019" },
});
