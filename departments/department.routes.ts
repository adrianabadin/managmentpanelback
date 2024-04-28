import { Router } from "express";
import { DeparmentController } from "./department.controller";
const departmentController = new DeparmentController()
const departmentRouter = Router()
departmentRouter.post("/createdepartment",departmentController.createDepartment)
departmentRouter.get("/getdepartments",departmentController.getDepartments)
export default departmentRouter