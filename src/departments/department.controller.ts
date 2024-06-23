import { Request, Response } from "express";
import { logger } from "../Global.Services/logger";
import { DeparmentService } from './deparment.service';
import { departmentCreateType } from "./department.schema";
import { PrismaError } from "../prisma/prisma.errors";
const departmentService=new DeparmentService()
export class DeparmentController{
    constructor(protected service = departmentService){
        this.createDepartment=this.createDepartment.bind(this);
this.getDepartments=this.getDepartments.bind(this);
    }
    async createDepartment(req:Request<any,any,departmentCreateType["body"]>,res:Response){
        try{
            const response = await this.service.createDepartment(req.body)
            if (response instanceof PrismaError) return res.status(500).send(response)
            return res.status(200).send(response)
        }
        catch(error){
            logger.error({function:"DeparmentController.createDepartment",error})
            return res.status(500).send(error)
        }
    }
    async getDepartments(req:Request<any,any,any,{state:string,username:string}>,res:Response){
        try{
            const {state,username}=req.query
            const response = await this.service.getDepartments(username)
            if (response instanceof PrismaError) return res.status(500).send(response)
            return res.status(200).send(response)
        }catch(error){
            logger.error({function:"DeparmentController.getDepartments",error})
            return res.status(500).send(error)
        }
    }
}