import { Router } from "express";
import { TaskController } from "./task.controller";
import passport from "passport";
import { authController } from "../auth/auth.routes";
const taskRouter=Router()
const taskController=new TaskController()
taskRouter.post("/create",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.createTask)
taskRouter.get("/getTasksByDepartment",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.getTasksByDepartment)
taskRouter.get("/getTasksByState",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.getTasksByState)
taskRouter.get("/getTasksByUserName",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.getTasksByUsername)
taskRouter.get("/get",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.getTasks)
taskRouter.delete('/delete',passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.deleteTask)
taskRouter.put('/update',passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.updateTask)
taskRouter.put('/close',passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,taskController.closeTask)
export default taskRouter