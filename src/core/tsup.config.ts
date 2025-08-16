import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["./**/*.ts"],
  splitting: true,
  target: "es5",
  format: "cjs",
  dts: true,
  treeshake: true,
  bundle: false,
})
