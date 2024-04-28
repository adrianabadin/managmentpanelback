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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_controller_1 = require("../auth.controller");
const auth_service_1 = require("../auth.service");
const authController = new auth_controller_1.AuthController();
const doneSpy = vitest_1.vi.fn();
const findUniqueSpy = vitest_1.vi.spyOn(auth_service_1.prismaClient.users, "findUnique");
const createReturn = { hash: "tefsfw", username: "aabadin@gmail.com", lastname: "Abadin", name: "Adrian", id: "texto" };
(0, vitest_1.describe)("AuthController", () => {
    (0, vitest_1.describe)("serializeUser", () => {
        (0, vitest_1.it)("should call done callback", () => __awaiter(void 0, void 0, void 0, function* () {
            yield authController.serialize(createReturn, doneSpy);
            (0, vitest_1.expect)(doneSpy).toBeCalledWith(null, "texto");
        }));
    });
    (0, vitest_1.describe)("deSerializeUser", () => {
        findUniqueSpy.mockResolvedValue(createReturn);
        (0, vitest_1.it)("should call done callback with createRetun", () => __awaiter(void 0, void 0, void 0, function* () {
            yield authController.deSerialize("texto", doneSpy);
            (0, vitest_1.expect)(doneSpy).toBeCalledWith(null, createReturn);
        }));
    });
});
