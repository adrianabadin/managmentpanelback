import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15000, // 15 seconds for individual tests (default is 5000ms)
    hookTimeout: 30000, // 30 seconds for hooks like beforeAll/afterAll (default is 10000ms)
  },
});
