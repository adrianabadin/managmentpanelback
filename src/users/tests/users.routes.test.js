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
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const node_test_1 = require("node:test");
const auth_service_1 = require("../../auth/auth.service");
const app_middleware_1 = __importDefault(require("../../app.middleware"));
const uuid_1 = require("uuid");
const updateSpy = vitest_1.vi.spyOn(auth_service_1.prismaClient.users, "update");
const userReturn = { createdAt: new Date(), updatedAt: new Date(), hash: "texto", id: "bhbhbh", isAdmin: true, lastname: "adrian", name: "abadin", phone: "888888", username: "aabadin@gmail.com" };
const id = (0, uuid_1.v4)();
console.log(id);
(0, vitest_1.describe)("UserRoutes", () => {
    (0, vitest_1.describe)("/setAdmin/:id", () => __awaiter(void 0, void 0, void 0, function* () {
        (0, node_test_1.beforeEach)(() => {
            vitest_1.vi.resetAllMocks();
            updateSpy.mockResolvedValue(userReturn);
        });
        (0, vitest_1.it)("Should call update, get a 200 status aand a userResponse if id param is provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/setadmin/${id}`).expect(200);
            (0, vitest_1.expect)(updateSpy).toBeCalled();
            (0, vitest_1.expect)(response.status).toBe(200);
        }));
        (0, vitest_1.it)("Should not call update, get a 404 status  if id param is not provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/setadmin`).expect(404);
            (0, vitest_1.expect)(response.status).toBe(404);
        }));
    }));
    (0, vitest_1.describe)("/addDepartments/:id", () => __awaiter(void 0, void 0, void 0, function* () {
        (0, node_test_1.beforeEach)(() => {
            vitest_1.vi.resetAllMocks();
            updateSpy.mockResolvedValue(userReturn);
        });
        (0, vitest_1.afterEach)(() => {
            vitest_1.vi.resetAllMocks();
            updateSpy.mockResolvedValue(userReturn);
        });
        (0, vitest_1.it)("Should call update and get a 200 status if id param is provided and a query name=stringname[] is provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const nameArray = ["uno", "dos"];
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartments/${id}?name=${nameArray.join("&name=")}`).expect(200);
            (0, vitest_1.expect)(response.status).toEqual(200);
            (0, vitest_1.expect)(updateSpy).toBeCalled();
        }));
        (0, vitest_1.it)("Should not call update and get a 400 status if id param is provided and a query name=stringname[] is not provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartments/${id}}`).expect(400);
            (0, vitest_1.expect)(response.status).toEqual(400);
            (0, vitest_1.expect)(updateSpy).not.toBeCalled();
        }));
        (0, vitest_1.it)("Should not call update and get a 404 status if id param is not provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartments/`).expect(404);
            (0, vitest_1.expect)(response.status).toEqual(404);
            (0, vitest_1.expect)(updateSpy).not.toBeCalled();
        }));
    }));
    (0, vitest_1.describe)("/addDepartment", () => {
        (0, node_test_1.beforeEach)(() => {
            vitest_1.vi.resetAllMocks();
            updateSpy.mockResolvedValue(userReturn);
        });
        (0, vitest_1.afterEach)(() => {
            vitest_1.vi.resetAllMocks();
            updateSpy.mockResolvedValue(userReturn);
        });
        (0, vitest_1.it)("Should call update and get a 200 status if id param is provided and a query name=stringname[] is provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const nameArray = ["uno", "dos"];
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartment/${id}?name=texto`).expect(200);
            (0, vitest_1.expect)(response.status).toEqual(200);
            (0, vitest_1.expect)(updateSpy).toBeCalled();
        }));
        (0, vitest_1.it)("Should not call update and get a 400 status if id param is provided and a query name=stringname[] is not provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartment/${id}}`).expect(400);
            (0, vitest_1.expect)(response.status).toEqual(400);
            (0, vitest_1.expect)(updateSpy).not.toBeCalled();
        }));
        (0, vitest_1.it)("Should not call update and get a 404 status if id param is not provided ", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_middleware_1.default).get(`/users/addDepartment/`).expect(404);
            (0, vitest_1.expect)(response.status).toEqual(404);
            (0, vitest_1.expect)(updateSpy).not.toBeCalled();
        }));
    });
});
