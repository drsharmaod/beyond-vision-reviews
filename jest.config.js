// jest.config.js
const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });

const config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  setupFilesAfterFramework: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathPattern: ["<rootDir>/tests/"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/*.ts",
    "!src/**/*.d.ts",
  ],
};

module.exports = createJestConfig(config);
