import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".venv/**",
    "node_modules/**",
    ".next/**",
    "out/**",
    "dist/**",
    "build/**",
    "mygeotab-api-adapter/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
