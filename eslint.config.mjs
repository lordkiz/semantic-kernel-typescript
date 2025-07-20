import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

const OFF = "off"

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  rules: {
    "@typescript-eslint/no-explicit-any": OFF,
    "@typescript-eslint/no-unsafe-function-type": OFF,
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],

    // ... other rules
  },
})
