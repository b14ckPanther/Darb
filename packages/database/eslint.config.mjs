import { defineConfig, globalIgnores } from "eslint/config";

import base from "@darb/config/eslint/base";

export default defineConfig(base, globalIgnores(["src/database.types.ts"]));
