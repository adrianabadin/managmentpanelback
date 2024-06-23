import { PrismaClient } from "@prisma/client";
import { prismaClient } from "../app.middleware";
import { FodaService,fodaService as fodaServiceObject } from "../foda/foda.service";
import { logger } from "../Global.Services/logger";
import { PrismaError, returnPrismaError } from "../prisma/prisma.errors";
import { departmentCreateType, departmentSchemaCreate } from './department.schema';

export class DeparmentService{
    constructor(
        protected prisma=new PrismaClient(),
        protected fodaService:FodaService= fodaServiceObject
        ){
this.createDepartment=this.createDepartment.bind(this);
this.getDepartments=this.getDepartments.bind(this);
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
            if (username === undefined ) return await this.prisma.departments.findMany({})
            const response = await this.prisma.departments.findMany({
        where:{responsable:{username}}})
            return response 
        }
    catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"DeparmentService.getDepartments",error:newError})
        return newError
    }
}
}