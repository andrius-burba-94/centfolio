import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "tests/e2e/**",
    ],
    coverage: {
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "**/*.config.*",
        "**/*.d.ts",
        "vitest.setup.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./vitest.server-only.stub.ts"),
    },
  },
});
