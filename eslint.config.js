import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/build/**"],
  },

  {
    files: ["client/**/*.{js,jsx}"],

    ...js.configs.recommended,

    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      "react/react-in-jsx-scope": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "no-unused-vars": "warn",
      "no-console": "warn",
      "react/prop-types": "off",
    },
  },

  {
    files: ["server/**/*.js"],

    ...js.configs.recommended,

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
];
