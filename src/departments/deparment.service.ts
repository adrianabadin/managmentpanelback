import { PrismaClient } from "@prisma/client";
import { prismaClient } from "../app.middleware";
import { FodaService,fodaService as fodaServiceObject } from "../foda/foda.service";
import { logger } from "../Global.Services/logger";
import { PrismaError, returnPrismaError } from "../prisma/prisma.errors";
import { departmentCreateType, departmentSchemaCreate } from './department.schema';
import { Task } from "vitest";

export class DeparmentService{
    constructor(
        protected prisma=new PrismaClient(),
        protected fodaService:FodaService= fodaServiceObject
        ){
this.createDepartment=this.createDepartment.bind(this);
this.getDepartments=this.getDepartments.bind(this);
this.addResponsableToDepartment=this.addResponsableToDepartment.bind(this);
this.addResponsableToDepartments=this.addResponsableToDepartments.bind(this);
}
async addResponsableToDepartment(departmentName:string,userId:string){
    const response= await  this.prisma.$transaction(async (tx)=>{
        const responsable = await tx.departments.update({where:{name:departmentName},data:{responsable:{connect:{id:userId}}}})
        const departmentId= (await tx.departments.findUnique({where:{name:departmentName},select:{id:true}}))?.id;
        if (departmentId === undefined) throw new Error("Department not found");
        const asignado= await tx.usersDepartments.findFirst({where:{departmentId:departmentId,userId:userId}})
        if (asignado ===null){
            await tx.usersDepartments.create({data:{Departments:{connect:{name:departmentName}},Users:{connect:{id:userId}}}})
        }
        
        return responsable;
    })
    return response
}
async addResponsableToDepartments(departmentName:string[],userId:string){
    const response = await this.prisma.$transaction(async (tx)=>{
        const responsable= await tx.departments.updateMany({where:{name:{in:departmentName}},data:{usersId:userId}})
        const departmentIds= await tx.departments.findMany({where:{name:{in:departmentName}},select:{id:true}})
        
        if (Array.isArray(departmentIds)){
          let   promesas=departmentIds.map((dep)=>{
                const salida = (tx.usersDepartments.upsert({where:{userId_departmentId:{departmentId:dep.id,userId:userId}},update:{},create:{Departments:{connect:{id:dep.id}},Users:{connect:{id:userId}}}}))
            return salida 
            }
                )
        await Promise.all(promesas)     
        }else throw new Error("Departments not found");
        console.log("******",responsable,"********")
        return responsable;
    });
    return response
}
    async createDepartment(data:departmentCreateType["body"]){
        try{
            departmentSchemaCreate.parse({body:data})
            const response = await this.prisma.departments.create({data})
            const fodaResponse = await this.fodaService.create(undefined,data.name)
            if (fodaResponse instanceof PrismaError) throw fodaResponse
            return {...response,FODAServiceId:fodaResponse.id}
        }catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"DeparmentService.createDepartment",error:newError})
            return newError
        }
    }
    async getDepartments(username:string){
        try{
            if (username === undefined ) return await this.prisma.departments.findMany({orderBy:{name:"asc"}})
            const response = await this.prisma.departments.findMany({
        where:{responsable:{username}}, orderBy:{name:"asc"}})
            return response
        }
    catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"DeparmentService.getDepartments",error:newError})
        return newError
    }
}
}