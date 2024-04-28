import { Request, Response } from "express";
import { FodaService, fodaService } from "./foda.service";
import { FODA, Item, RemoveMember, memberSchema } from './foda.schema';
import { InvalidParameterException } from "./foda.errors";
import { Member } from "./foda.schema";
import { PrismaError } from "../prisma/prisma.errors";
import { NoUndefined, ElementFromArray } from '../Global.Services/Entitites/Utility.Types';
import { Prisma } from "@prisma/client";

export class FodaController{
    constructor(protected service:FodaService){
        this.addStrategyWM=this.addStrategyWM.bind(this);
        this.removeStrategyWMById=this.removeStrategyWMById.bind(this);
        this.addStrategyWO=this.addStrategyWO.bind(this);
        this.removeStrategyWOById=this.removeStrategyWOById.bind(this);
        this.addStrategySM=this.addStrategySM.bind(this);
        this.addStrategySO=this.addStrategySO.bind(this);
        this.removeStrategySMById=this.removeStrategySMById.bind(this);
        this.removeStrategySOById=this.removeStrategySOById.bind(this);
        this.removeMember=this.removeMember.bind(this)
        this.addStrength=this.addStrength.bind(this)
        this.addWeakness=this.addWeakness.bind(this);
        this.removeWeaknessById=this.removeWeaknessById.bind(this);
        this.addMenace=this.addMenace.bind(this);
        this.removeMenaceById=this.removeMenaceById.bind(this)
        this.removeOportunityById=this.removeOportunityById.bind(this)
        this.addOportunity=this.addOportunity.bind(this)
        this.removeStrengthById=this.removeStrengthById.bind(this);
        this.create=this.create.bind(this);
        this.update=this.update.bind(this);
        this.getOne=this.getOne.bind(this)
        this.listFoda=this.listFoda.bind(this)
        this.addMenace=this.addMenace.bind(this)

    }
    async create(req:Request<any,any,any,Member["query"]>,res:Response){
        const query= req.query
        const result=memberSchema.safeParse(req)
        if (result.success){
            const response =await this.service.create(query.state,query.service)
            console.log(response)
        if (response instanceof PrismaError)return  res.status(500).send(response)
        else return res.status(200).send(response)
    }else res.status(404).send(new InvalidParameterException("Must provide a state String to make the request",undefined,result.error))
    }
    async update(req:Request<any,any,FODA["body"]>,res:Response){
        const data=req.body
        const response = await this.service.update(data)
        if (response instanceof PrismaError) res.status(500).send(response)
        if (response instanceof InvalidParameterException) res.status(404).send(response)
        res.status(200).send(response)
    }
    async getOne(req:Request<any,any,any,Member["query"]>,res:Response){
        const {service,state}=req.query
        const response = await this.service.getOne(state,service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }

    // async getAllFODAByStateHistory(req:Request<any,any,any,{state:string}>,res:Response){
    //     const state=req.query.state
    //     if (state === undefined)  return res.status(404).send(new InvalidParameterException("Must provide a state string"))
    //     const response = await this.service.getByStateHistory(state)
    //     if (response instanceof PrismaError) return res.status(500).send(response)
    //     return res.status(200).send(response)
    // }
    async removeMember(req:Request<any,any,any,RemoveMember["query"]>,res:Response){
        const {member,title,state,service}= req.query
        let response
        switch(member){
            case "strengths":
                {
                    response = await this.service.removeStrength(title,state,service)         
                    break;
                }
            case "menace":
                {
                    response = await this.service.removeMenace(title,state,service)         
                    break;
                }
            case "oportunity":
                {
                        response = await this.service.removeOportunity(title,state,service)         
                        break;   
                }
            case "weakness":
                {
                    response = await this.service.removeWeakness(title,state,service)         
                    break;
                }
            default: return res.status(404).send(new InvalidParameterException("Member query is invalid"))
                
        }
    if (response instanceof PrismaError) return res.status(500).send(response)
    return res.status(200).send(response)
    }
    async listFoda(req:Request,res:Response){
        const response = await this.service.listFoda()
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }

    /** 
     * Add single Member and remove by id 
    */
    async addStrength(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response = await this.service.addStrength(req.body,req.query.state,req.query.service)
        console.log("hecho",response)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async removeStrengthById(req:Request<{id:string}>,res:Response){
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        const response = await this.service.removeStrengthById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async addOportunity(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response = await this.service.addOportunity(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async removeOportunityById(req:Request<{id:string}>,res:Response){
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        const response = await this.service.removeOportunityById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async addMenace(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response = await this.service.addMenace(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async removeMenaceById(req:Request<{id:string}>,res:Response){
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        const response = await this.service.removeMenaceById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async addWeakness(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response = await this.service.addWeakness(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async removeWeaknessById(req:Request<{id:string}>,res:Response){
        console.log(req.params.id, "removeWeka")
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        
        const response = await this.service.removeWeaknessById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async addStrategySO(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response =await this.service.addStrategySO(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async removeStrategySOById(req:Request<{id:string}>,res:Response){
       // console.log(req.params.id, "removeWeka")
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        
        const response = await this.service.removeStrategySOById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async addStrategySM(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response =await this.service.addStrategySM(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async removeStrategySMById(req:Request<{id:string}>,res:Response){
       // console.log(req.params.id, "removeWeka")
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        
        const response = await this.service.removeStrategySMById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }

    async addStrategyWO(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response =await this.service.addStrategyWO(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async removeStrategyWOById(req:Request<{id:string}>,res:Response){
       // console.log(req.params.id, "removeWeka")
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        const response = await this.service.removeStrategyWOById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }

    async addStrategyWM(req:Request<any,any,Item["body"],Member["query"]>,res:Response){
        const response =await this.service.addStrategyWM(req.body,req.query.state,req.query.service)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
    async removeStrategyWMById(req:Request<{id:string}>,res:Response){
       // console.log(req.params.id, "removeWeka")
        if (req.params.id === undefined || req.params.id === null) return res.status(400).send(new InvalidParameterException("Must provide an string ID"))
        const response = await this.service.removeStrategyWMById(req.params.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        return res.status(200).send(response)
    }
}
export const fodaController = new FodaController(fodaService)