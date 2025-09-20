import { defineConfig } from "tsup"

export default defineConfig({
  bundle: false,
  clean: true,
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
  format: ["cjs"],
  legacyOutput: true,
  platform: "node",
  skipNodeModulesBundle: true,
  splitting: true,
  target: "esnext",
  treeshake: true,
  // outExtension({ format }) {
  //   return format === "esm" ? { js: ".mjs" } : { js: ".cjs" }
  // },
})
