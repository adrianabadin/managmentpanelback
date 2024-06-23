import { Router } from "express";
import { DeparmentController } from "./department.controller";
import { authController } from "../auth/auth.routes";
import passport from "passport";
const departmentController = new DeparmentController()
const departmentRouter = Router()
departmentRouter.post("/createdepartment",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,departmentController.createDepartment)
departmentRouter.get("/getdepartments",departmentController.getDepartments)
export default departmentRouter