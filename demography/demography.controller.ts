import { Request, Response } from "express";
import { DemographyService } from "./demography.service";
import { logger } from "../Global.Services/logger";
import { DemographyType } from "./demography.schema";
import { PrismaError } from "../prisma/prisma.errors";
const demographyService=new DemographyService()
export class DemographyController
{
    constructor(protected service = demographyService){
        this.createState=this.createState.bind(this)
        this.getStates=this.getStates.bind(this)
    }
    async createState(req:Request<any,any,DemographyType["body"]>,res:Response){
        try{
            const response = await this.service.createState(req.body)
            if (response instanceof PrismaError) return res.status(500).send(response)
            return res.status(200).send(response)
        }
        catch(error){
            logger.error({function:"DemographyController.createState",error})
            return res.status(500).send(error) 
}
    }
    async getStates(_req:Request,res:Response){
        try{
            const response = await this.service.getStates();
            if (response instanceof PrismaError) return res.status(500).send(response)
            return res.status(200).send(response)
        }
        catch(error){
            logger.error({function:"DemographyController.createState",error})
            return res.status(500).send(error) 
}

    }
}