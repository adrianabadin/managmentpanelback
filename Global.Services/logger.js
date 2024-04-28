"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const logPath = (_a = process.env.LOGS) !== null && _a !== void 0 ? _a : '';
console.log(logPath);
if (logPath !== undefined && !fs_1.default.existsSync(logPath))
    fs_1.default.mkdirSync(logPath);
exports.logger = winston_1.default.createLogger({
    level: 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.prettyPrint(), winston_1.default.format.timestamp()),
    transports: [new winston_1.default.transports.File({
            filename: path_1.default.join(logPath, 'errors.log'),
            level: 'error'
        }),
        new winston_1.default.transports.File({ filename: path_1.default.join(logPath, 'debug.log') })]
});
if (process.env.ENVIROMENT !== 'PRODUCTION') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.prettyPrint(), winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp())
    }));
}
