import { Router } from "express";
import { TaskController } from "./task.controller";
const taskRouter=Router()
const taskController=new TaskController()
taskRouter.post("/create",taskController.createTask)
taskRouter.get("/getTasksByDepartment",taskController.getTasksByDepartment)
taskRouter.get("/getTasksByState",taskController.getTasksByState)
taskRouter.get("/getTasksByUserName",taskController.getTasksByUsername)
taskRouter.get("/get",taskController.getTasks)
taskRouter.delete('/delete',taskController.deleteTask)
taskRouter.put('/update',taskController.updateTask)
taskRouter.put('/close',taskController.closeTask)
export default taskRouter