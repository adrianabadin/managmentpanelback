import { Request, Response } from "express";
import { TaskService } from "./task.service";
import { logger } from "../Global.Services/logger";
import { CloseTaskType, TasKDeleteType, TaskType } from './task.schema';
import { PrismaError } from "../prisma/prisma.errors";
import { Prisma } from "@prisma/client";
const taskService= new TaskService()

export class TaskController{

    constructor(protected service = taskService){
        this.createTask=this.createTask.bind(this)
        this.getTasksByDepartment=this.getTasksByDepartment.bind(this)
        this.getTasksByState=this.getTasksByState.bind(this)
        this.getTasksByUsername=this.getTasksByUsername.bind(this)
        this.getTasks=this.getTasks.bind(this)
        this.deleteTask=this.deleteTask.bind(this)
        this.updateTask=this.updateTask.bind(this)
        this.closeTask=this.closeTask.bind(this)
    }
    async createTask (req:Request<any,any,TaskType>,res:Response){
        try{
        const response = await this.service.createTask(req.body)
        res.status(200).send(response)
        }catch(error){
            logger.error({function:"TaskController.createTask",error})
            res.status(500).send(error)
        }
    }
    async getTasksByDepartment(req:Request<any,any,any,{department:string}>,res:Response){
        try{
            const {department}=req.query
            const response = await this.service.getTasksByDepartment(department)
            res.status(200).send(response)
        }catch(error){
            logger.error({function:"TaskController.getTasksByDepartment",error})
            res.status(500).send(error)
        }
    }
    async getTasksByState(req:Request<any,any,any,{state:string}>,res:Response){
        try{
            const {state}=req.query
            const response = await this.service.getTasksByState(state)
            res.status(200).send(response)

        }catch(error)
        {
            logger.error({function:"TaskController.getTasksByState",error})
            res.status(500).send(error)
        }
    }
    async getTasksByUsername(req:Request<any,any,any,{username:string}>,res:Response){
        try{
            const {username}= req.query
            const response = await this.service.getTasksByUserName(username)
            res.status(200).send(response)
        }
        catch(error){
            logger.error({function:"TaskController.getTasksByUsername",error})
            res.status(500).send(error)
        }
    }
    async getTasks(req:Request<any,any,any,{username?:string,state?:string,department?:string,isCompleted?:"true"|"false"}>,res:Response){
        try{
            const {department,state,username,isCompleted} = req.query
            console.log(isCompleted)
            const response= await this.service.getTasks(username,state,department,isCompleted !== undefined ? JSON.parse(isCompleted):undefined)
            console.log(response,"controller")
            if (response instanceof PrismaError) {
                res.status(500).send(response)
                return
            }
            res.status(200).send(response)
        return 
        }catch(error){
            logger.error({function:"TaskController.getTasks",error})
            res.status(500).send(error)
            return
        }
    }
    async deleteTask(req:Request<any,any,any,TasKDeleteType>,res:Response){
        try{
            const {id} =req.query
            const response = await this.service.deleteTask(id)
            if (response instanceof PrismaError) {

                res.status(500).send(response)
                return
            }
            
            res.status(200).send(response)
        }catch(error){
            logger.error({function:"TaskController.deleteTask",error})
            res.status(500).json(error)
        }
    }
    async updateTask(req:Request<any,any,TaskType&{id:string}>,res:Response){
        try{
            const response = await this.service.updateTask(req.body)
            if (response instanceof PrismaError) {
                res.status(500).json(response)
                return
            }
            res.status(200).send(response)
            return
        }
        catch(error){
            logger.error({function:"TaskController.updateTask",error})
            res.status(500).json(error)
            return
        }
    }
    async closeTask(req:Request<any,any,CloseTaskType>,res:Response){
        try{
            const response = await this.service.closeTask(req.body)
            if (response instanceof PrismaError) {
                res.status(500).send(response)
                return
            }
            res.status(200).send(response)
        }catch(error){
            logger.error({function:"TaskController.closeTask",error})
            res.status(500).json(error)
            return
        }
    }
}