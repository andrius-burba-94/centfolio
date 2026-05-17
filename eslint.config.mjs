import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Defaults from eslint-config-next
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // PocketBase artifacts — not application source
    "pocketbase/**",

    // Skills framework cache (mirrors gitignore)
    ".agents/**",

    // Test setup file pulls in jest-dom matchers; no app code
    "vitest.setup.ts",
  ]),
]);

export default eslintConfig;
