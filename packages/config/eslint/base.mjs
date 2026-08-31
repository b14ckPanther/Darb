import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const typescriptRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}"],
}));

export default defineConfig(
  globalIgnores([".next/**", ".turbo/**", "coverage/**", "dist/**", "node_modules/**"]),
  {
    ...eslint.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
  },
  ...typescriptRecommended,
);
