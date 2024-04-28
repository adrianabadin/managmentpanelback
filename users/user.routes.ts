import { Response, Router,Request, NextFunction } from "express";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { departmentSchema, departmentsSchema, setAdminSchema } from "./users.schema";
import { UsersController } from './users.controller';
const usersController=new UsersController()
const userRouter=Router()
userRouter.put("/setadmin/:id",usersController.setAdmin)
userRouter.put("/dropadmin/:id",validateSchemaMiddleware(setAdminSchema),usersController.dropAdmin)
userRouter.put("/adddepartment/:id",validateSchemaMiddleware(departmentSchema),usersController.addDepartment)
userRouter.put("/adddepartments/:id",(req:Request,res:Response,next:NextFunction)=>{console.log(req.body);next()},validateSchemaMiddleware(departmentsSchema),usersController.addDepartments)
userRouter.get("/getusers",usersController.getUsers)
userRouter.delete("/delete",usersController.deleteUser)
export default userRouter