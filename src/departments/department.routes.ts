import { Router } from "express";
import { DeparmentController } from "./department.controller";
import { authController } from "../auth/auth.routes";
import passport from "passport";
import { validate } from "uuid";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { departmentSchema,departmentsSchema } from "../users/users.schema";
const departmentController = new DeparmentController()
const departmentRouter = Router()
departmentRouter.post("/createdepartment",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,departmentController.createDepartment)
departmentRouter.put("/addresponsabletodepartment/:id",validateSchemaMiddleware(departmentSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,departmentController.addResponsableToDepartment)
departmentRouter.put("/addresponsabletodepartments/:id",validateSchemaMiddleware(departmentsSchema), passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,departmentController.addResponsableToDepartments)
departmentRouter.get("/getdepartments",departmentController.getDepartments)
export default departmentRouter