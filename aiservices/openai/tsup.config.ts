import { defineConfig } from "tsup"

export default defineConfig({
  bundle: false,
  dts: true,
  entry: [
    "./**/*.ts",
    /** test related files */
    "!**/__tests__/**",
    "!./**/*.test.*",
    "!./**/*.tests.*",
    /** config related files */
    "!./**/*.config.ts",
    "!./**/*.config.js",
    /** no node_modules */
    "!node_modules",
  ],
  format: ["esm", "cjs"],
  platform: "node",
  splitting: true,
  target: "node16",
  treeshake: true,
  outExtension({ format }) {
    return format === "esm" ? { js: ".mjs" } : { js: ".cjs" }
  },
})
