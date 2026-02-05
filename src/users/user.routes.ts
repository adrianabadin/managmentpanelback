import { Response, Router,Request, NextFunction } from "express";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { changePasswordSchema, departmentSchema, departmentsSchema, setAdminSchema } from "./users.schema";
import { UsersController } from './users.controller';
import { authController } from "../auth/auth.routes";
import passport from "passport";
const usersController=new UsersController()
const userRouter=Router()
userRouter.put("/setadmin/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.setAdmin)
userRouter.put("/dropadmin/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.dropAdmin)
userRouter.put("/adddepartment/:id",validateSchemaMiddleware(departmentSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.addDepartment)
userRouter.put("/rmdepartment/:id",validateSchemaMiddleware(departmentSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.rmDepartment)
userRouter.put("/adddepartments/:id",(req:Request,res:Response,next:NextFunction)=>{console.log(req.body);next()},validateSchemaMiddleware(departmentsSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.addDepartments)
userRouter.get("/getusers/:id?", passport.authenticate('jwt',{session:false}),usersController.getUsers)
userRouter.get("/sendresettoken/:username",usersController.sendResetToken)
userRouter.delete("/delete",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.deleteUser)
userRouter.put("/revive",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,usersController.reviveUser)
userRouter.post("/resetpassword",validateSchemaMiddleware(changePasswordSchema),usersController.resetPassword)
export default userRouter