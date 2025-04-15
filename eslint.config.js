import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // typescript eslint
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // eslint config
  {
    ignores: [
      "node_modules/*",
      "docs/*",
      "docs-src/*",
      "rollup-config.js",
      "custom-elements.json",
      "custom-elements-manifest.config.json",
      "web-dev-server.config.js",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
    },
  },
  // prettier eslint
  eslintConfigPrettier,
];
