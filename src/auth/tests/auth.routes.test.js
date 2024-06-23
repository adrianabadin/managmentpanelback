//@ts-nocheck
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSpy = void 0;
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_middleware_1 = __importDefault(require("../../app.middleware"));
const auth_service_1 = require("../auth.service");
const argon2_1 = __importDefault(require("argon2"));
//app.listen(8080,()=>console.log("listening on port 8080"))
const createSpy = vitest_1.vi.spyOn(auth_service_1.prismaClient.users, "create");
const findUniqueSpy = vitest_1.vi.spyOn(auth_service_1.prismaClient.users, "findUnique");
const createReturn = { hash: "tefsfw", username: "aabadin@gmail.com", lastname: "Abadin", name: "Adrian", id: "texto" };
const argonSpy = vitest_1.vi.spyOn(argon2_1.default, "verify");
exports.logSpy = vitest_1.vi.fn();
(0, vitest_1.describe)("AuthRouter", () => {
    (0, vitest_1.it)("Should login when passed a username and password that validates", () => __awaiter(void 0, void 0, void 0, function* () {
        findUniqueSpy.mockResolvedValue(createReturn);
        argonSpy.mockResolvedValue(true);
        createSpy.mockResolvedValue(createReturn);
        const response = yield (0, supertest_1.default)(app_middleware_1.default).post("/auth/login")
            .send({ username: "adrian@abadin.com", password: "11ssss1111" })
            .expect(200);
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(findUniqueSpy).toHaveBeenCalled();
        (0, vitest_1.expect)(findUniqueSpy).toReturnWith(createReturn);
    }));
    (0, vitest_1.it)("Should Create a user if passed a body that validates schema", () => __awaiter(void 0, void 0, void 0, function* () {
        findUniqueSpy.mockResolvedValue(null);
        createSpy.mockResolvedValue(createReturn);
        const response = yield (0, supertest_1.default)(app_middleware_1.default).post("/auth/signup").send({ lastname: "adrian", name: "adrian", password: "qwedsaqw", username: "aabadin@gmail.com" }).expect(200);
        (0, vitest_1.expect)(findUniqueSpy).toBeCalled();
        (0, vitest_1.expect)(findUniqueSpy).toReturnWith(null);
        (0, vitest_1.expect)(createSpy).toBeCalled();
        (0, vitest_1.expect)(createSpy).toReturnWith(createReturn);
        (0, vitest_1.expect)(response.status).toBe(200);
    }));
});
