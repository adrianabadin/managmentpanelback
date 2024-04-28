"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const dotenv = require("dotenv");
const app_middleware_1 = __importDefault(require("./app.middleware"));
const logger_1 = require("./Global.Services/logger");
dotenv.config();
const port = process.env.PORT || 8080;
exports.server = app_middleware_1.default.listen(port, () => { logger_1.logger.info({ message: `Listening on port ${port}` }); });
