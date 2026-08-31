import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";

import base from "./base.mjs";

const sourceFiles = ["**/*.{js,jsx,ts,tsx}"];

export default defineConfig(
  base,
  {
    ...nextPlugin.configs["core-web-vitals"],
    files: sourceFiles,
  },
  {
    ...reactHooks.configs.flat["recommended-latest"],
    files: sourceFiles,
  },
  globalIgnores([".next/**", "next-env.d.ts", "out/**"]),
);
