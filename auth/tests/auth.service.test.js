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
const auth_service_1 = require("../auth.service");
const auth_service_2 = require("../auth.service");
const authService = new auth_service_1.AuthService();
const createReturn = { hash: "tefsfw", username: "aabadin@gmail.com", lastname: "Abadin", name: "Adrian", id: "texto" };
(0, vitest_1.describe)("AuthService.SignUpUser", () => {
    const createSpy = vitest_1.vi.spyOn(auth_service_2.prismaClient.users, "create").mockImplementation(() => Promise.resolve(createReturn));
    (0, vitest_1.afterEach)(() => { vitest_1.vi.restoreAllMocks(); });
    (0, vitest_1.it)("Should call Prisma.user.create and should return an object containing the createReturn variable", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield authService.SignUpUser({ username: "aabadin@gmail.com", lastname: "Abadin", name: "Adrian", password: "tttttttt" });
        console.log(response, "texto", typeof response);
        (0, vitest_1.expect)(createSpy).toBeCalled();
        (0, vitest_1.expect)(response).toEqual(Object.assign({}, createReturn));
    }));
    // @ts-ignore
    (0, vitest_1.it)("Should throw if a param is not provided", () => __awaiter(void 0, void 0, void 0, function* () {
        (0, vitest_1.expect)(yield authService.SignUpUser()).toBeUndefined();
    }));
    // @ts-ignore
    (0, vitest_1.it)("Should throw if username is not provided", () => __awaiter(void 0, void 0, void 0, function* () { (0, vitest_1.expect)(yield authService.SignUpUser({ lastname: "ada", name: "fwefw", password: "vvrev" })).toBeUndefined(); }));
    // @ts-ignore
    (0, vitest_1.it)("Should throw if lastname is not provided", () => __awaiter(void 0, void 0, void 0, function* () { (0, vitest_1.expect)(yield authService.SignUpUser({ username: "texto", name: "fwefw", password: "vvrev" })).toBeUndefined(); }));
    // @ts-ignore
    (0, vitest_1.it)("Should throw if name is not provided", () => __awaiter(void 0, void 0, void 0, function* () { (0, vitest_1.expect)(yield authService.SignUpUser({ username: "texto", lastname: "fwefw", password: "vvrev" })).toBeUndefined(); }));
    //it('Should return a object containing {id:"texto"}',async ()=>{expect(await authService.SignUpUser({username:"aabadin@gmail.com",lastname:"fwssssefw",password:"ssssssss",name:"Adrian"})).toContain({id:"texto"})})
});
