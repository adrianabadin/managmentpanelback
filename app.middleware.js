"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth/auth.controller");
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
require("./auth/local.strategy");
require("./auth/jwt.strategy");
const user_routes_1 = __importDefault(require("./users/user.routes"));
const department_routes_1 = __importDefault(require("./departments/department.routes"));
const demography_routes_1 = __importDefault(require("./demography/demography.routes"));
const task_routes_1 = __importDefault(require("./tasks/task.routes"));
const google_routes_1 = __importDefault(require("./google/google.routes"));
const foda_routes_1 = require("./foda/foda.routes");
const gc_routes_1 = require("./gc/gc.routes");
const authController = new auth_controller_1.AuthController();
const app = (0, express_1.default)();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url({ message: "Debes proveer un url de la base de datos" }),
    ENVIROMENT: zod_1.z.enum(["DEV", "PRODUCTION"], { invalid_type_error: "ENVIROMENT debe ser DEV o PRODUCTION" }),
    LOGS: zod_1.z.string().min(1, { message: "Debes proveer la ruta de los logs" }),
    MAIL: zod_1.z.string({ required_error: "Must provide an email account key" }),
    PORT: zod_1.z.string().refine(value => {
        const parsedNumber = parseInt(value);
        if (isNaN(parsedNumber))
            return false;
        else
            return true;
    }, { message: "PORT debe ser un string de numero" })
});
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true,
    preflightContinue: false,
    //methods:['get', 'post', 'put', 'delete','patch']
}));
// const store = new PrismaSessionStore(prismaClient, {
//   checkPeriod: 2 * 60 * 1000, // ms
//   dbRecordIdIsSessionId: true,
//   dbRecordIdFunction: undefined,
//   ttl: 60 * 60 * 1000
// })
// const sessionMiddleware = Session({
//   store,
//   resave: false,
//   saveUninitialized: false,
//   cookie: { sameSite: 'lax' ,secure:false,maxAge:60*60*1000},
//   name:'session-data',
//   secret: 'Dilated flakes of fire fall, like snow in the Alps when there is no wind'
// })
//app.use(cookieParser()) // "Whether 'tis nobler in the mind to suffer"
// app.use(sessionMiddleware)
app.use(passport_1.default.initialize());
// app.use(passport.session())
passport_1.default.serializeUser(authController.serialize);
passport_1.default.deserializeUser(authController.deSerialize);
app.use("/auth", auth_routes_1.default);
app.use("/users", user_routes_1.default);
app.use("/departments", department_routes_1.default);
app.use("/demography", demography_routes_1.default);
app.use("/tasks", task_routes_1.default);
app.use("/google", google_routes_1.default);
app.use("/foda", foda_routes_1.fodaRouter);
app.use("/gc", gc_routes_1.gcRoutes);
//app.use("/fodaService",fodaServiceRouter)
exports.default = app;
