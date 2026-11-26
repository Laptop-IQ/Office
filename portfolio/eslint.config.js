import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]), // build output is not source
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"], // Vite uses the automatic JSX runtime: no `import React` needed
  {
    // React 19 ignores propTypes at runtime and this project has no `prop-types` package;
    // component props are documented with JSDoc instead.
    rules: { "react/prop-types": "off" },
  },
]);
