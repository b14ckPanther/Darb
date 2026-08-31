import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

import base from "./base.mjs";

export default defineConfig(
  base,
  nextVitals,
  nextTypescript,
  globalIgnores([".next/**", "next-env.d.ts", "out/**"]),
);
