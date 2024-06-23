
import { query } from "express";
import { logger } from "../Global.Services/logger";

import { departmentSchema, departmentsSchema, setAdminSchema } from "./users.schema";
import { returnPrismaError } from "../prisma/prisma.errors";
import { prismaClient } from '../app.middleware';
import { PrismaClient } from "@prisma/client";
export class UsersService {
    constructor(protected prisma=new PrismaClient()){
        this.setAdmin=this.setAdmin.bind(this)
        this.dropAdmin=this.dropAdmin.bind(this)
        this.addDepartment=this.addDepartment.bind(this)
        this.addDepartments=this.addDepartments.bind(this)
        this.getUsers=this.getUsers.bind(this)
        this.deleteUser=this.deleteUser.bind(this)
    }
    async setAdmin(id:string){
        try{
            // const result =setAdminSchema.shape.params.safeParse({id})
            // console.log(id,result)
            // if (result.success){
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where:{id},data:{isAdmin:true}})
            return response 
            //} else throw new Error(result.error.issues[0].message)
        }catch(err){
            const error = returnPrismaError(err as Error)
            logger.error({function:"UsersService.updateUser",error})
            return error
            
        }
    }
    async dropAdmin(id:string){
        try{
            //setAdminSchema.parse({params:{id}})
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where:{id},data:{isAdmin:false}})
            return response
        }catch(error){
            logger.error({function:"UsersService.dropAdmin",error})
            
    }
    }
    async addDepartment(id:string,departmentName:string){
        try{
            departmentSchema.parse({query:{name:departmentName}})
            //setAdminSchema.parse({params:{id}})
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where:{id},data:{Departments:{connect:{name:departmentName}}}})
            return response
        }catch(error){{logger.error({function:"UsersService.addDepartment",error})}}
    }
    async addDepartments(id:string,departmentArray:string[]){
        try{
            departmentsSchema.parse({body:{name:departmentArray}})
            //setAdminSchema.parse({params:{id}})
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where: {id},data:{Departments:{set:departmentArray.map(name=>({name}))}}})
            return response
        }catch(error){{logger.error({function:"UsersService.addDepartments",error})}}
    }
    async getUsers(){
        try{
            const response = await this.prisma.users.findMany({where:{},include:{Departments:{select:{name:true,id:true}}}})
            return response
        }catch(error){
            logger.error({function:"UsersService.getUsers",error})
        }
    }
    async deleteUser(id:string){
        try{
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
           const response = await this.prisma.users.delete({where:{id}})
            return response
        }catch(error){
            logger.error({function:"UsersService.deleteUser",error})
        }
    }
}