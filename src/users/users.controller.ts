import { Request, Response } from "express";
import { prismaClient } from "../auth/auth.service";
import { ChangePasswordType, DepartmentType, DepartmentsType, SetAdminType, setAdminSchema } from "./users.schema";
import { error } from 'console';
import { logger } from "../Global.Services/logger";
import { UsersService } from "./users.service";
import { PrismaError } from "../prisma/prisma.errors";
import { Logger } from "winston";
import { logging } from "googleapis/build/src/apis/logging";
import { UsersError } from "./users.errors";
const usersService=new UsersService()
export class UsersController{
constructor(protected prisma=prismaClient,protected service=usersService){
    this.setAdmin=this.setAdmin.bind(this)
    this.dropAdmin=this.dropAdmin.bind(this)
    this.addDepartment=this.addDepartment.bind(this)
    this.addDepartments=this.addDepartments.bind(this)
    this.getUsers=this.getUsers.bind(this)
    this.deleteUser=this.deleteUser.bind(this)
    this.rmDepartment=this.rmDepartment.bind(this)
    this.sendResetToken=this.sendResetToken.bind(this)
    this.resetPassword=this.resetPassword.bind(this)
    this.reviveUser=this.reviveUser.bind(this)
}

async resetPassword (req:Request<any,any,ChangePasswordType["body"]>,res:Response){
    try{
        const {password,token,username} = req.body
        const response = await this.service.resetPassword(token,username,password)
        if (response === undefined || response ===null) throw new Error("Error al cambiar la contraseña")
            return res.status(200).send(response);
    }catch(error){
        logger.error({function:"ResetPassword",error})
        if (error instanceof UsersError){
            return res.status(404).send(error)
        }
        return res.status(500).send(error)
    }
}
async sendResetToken(req:Request<{username:string}>,res:Response){
    try{
    const user= req.params.username
    if (user === undefined || user === null || !user.toString().includes("@")) return res.status(400).send("Debes enviar un mail correcto")
    await this.service.sendResetToken(user.toUpperCase())
    
    return res.send({ok:true})
    }catch(error){
     logger.error({function:"SendReset Token",error})
     if (error instanceof UsersError) return res.status(400).send(error)   
     return res.status(500).send(error)
    }
}
async setAdmin(req:Request<SetAdminType["params"]>,res:Response){
        //res.send(req.params)
         const response = await this.service.setAdmin(req.params.id)
         if (response instanceof PrismaError) return res.status(500).send(response)
         else return res.status(200).send(response)
    
        
}
async dropAdmin(req:Request<SetAdminType["params"]>,res:Response){
    try{
        const response= await this.service.dropAdmin(req.params.id)
        res.status(200).send(response)
    }catch(error){
        logger.error({function:"UsersController.dropAdmin",error})
        res.status(500).send({error})
    }

}
async addDepartment(req:Request<SetAdminType["params"],any,any,DepartmentType["query"]>,res:Response){
    try{
        const response = await this.service.addDepartment(req.params.id, req.query.name)
        res.status(200).send(response)
    }catch(error){
        logger.error({function:"UsersController.addDepartment",error})
        res.status(500).send({error})
    }
}
async rmDepartment(req:Request<SetAdminType["params"],any,any,DepartmentType["query"]>,res:Response){
    try{
        const response=await this.service.removeDepartment(req.params.id,req.query.name);
        if (!response) throw new Error("No se pudo eliminar el departamento");
        res.status(200).send(response);
    }catch(error){
        logger.error({function:"UsersController.rmDepartment",error})
        res.status(500).send({error})
    }
}
async addDepartments(req: Request<SetAdminType["params"],any,any,DepartmentsType["body"]>, res: Response){
try{
 
    const response =await this.service.addDepartments(req.params.id,req.body.name)
    res.status(200).send(response)
}catch(error){
    logger.error({function:"UsersController.addDepartments",error})
    res.status(500).send({error})
}
}
async getUsers(req:Request<{id:string}>,res:Response){
    try{
        const response = await this.service.getUsers(req.params.id)
        return res.status(200).send(response)
    }catch(error){
        logger.error({function:"UsersController.getUsers",error})
        return res.status(500).send({error})
    }
}
async deleteUser(req:Request<any,any,any,{id:string}>,res:Response){
    try{
        const response = await this.service.deleteUser(req.query.id)
        return res.status(200).send(response)
    }catch(error){
        logger.error({function:"UsersController.deleteUser",error})
        return res.status(500).send({error})
    }
}
async reviveUser(req:Request<any,any,any,{id:string}>,res:Response){
        try{
        const response = await this.service.reviveUser(req.query.id)
        return res.status(200).send(response)
    }catch(error){
        logger.error({function:"UsersController.deleteUser",error})
        return res.status(500).send({error})
    }
}}
