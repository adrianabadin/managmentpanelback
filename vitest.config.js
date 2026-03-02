"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        testTimeout: 15000, // 15 seconds for individual tests (default is 5000ms)
        hookTimeout: 30000, // 30 seconds for hooks like beforeAll/afterAll (default is 10000ms)
    },
});
