import { PrismaClient } from "@prisma/client";
import { logger } from "../Global.Services/logger";
import { prismaClient } from "../auth/auth.service";
import { PrismaError, returnPrismaError } from "../prisma/prisma.errors";
import { DemographySchema, DemographyType } from "./demography.schema";
import { FodaService, fodaService as fodaServiceInstance } from "../foda/foda.service";

export class DemographyService{
    constructor(
        protected prisma=prismaClient,
        protected fodaService:FodaService=fodaServiceInstance
        ){
        this.createState=this.createState.bind(this);
        this.getStates=this.getStates.bind(this);
        
    }
    async createState(data:DemographyType["body"]){
        try{
            DemographySchema.parse({body:data})
            const response= await this.prisma.demography.create({data})
            const fodaResponse =await this.fodaService.create(data.state)
            if (fodaResponse instanceof PrismaError) throw fodaResponse
            return {...response,FODAstateId:fodaResponse.id}
        }
        catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"DemographyService.createState",error:newError})
            return newError
        }
    }
    async getStates(){
        try{
            const response = await this.prisma.demography.findMany({})
            return response
        }
        catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"DemographyService.getStates",error:newError})
            return newError
        }
    }

}