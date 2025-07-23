/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const { createDefaultPreset } = require("ts-jest")

const tsJestTransformCfg = createDefaultPreset().transform

/** @type {import("jest").Config} **/
module.exports = {
  cacheDirectory: ".cache/jest",
  rootDir: "./",
  setupFilesAfterEnv: ["./src/setup.jest.ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.tests.(ts|tsx|js)"],
  transform: {
    ...tsJestTransformCfg,
  },
}
