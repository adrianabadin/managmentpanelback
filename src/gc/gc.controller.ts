import { Request, Response } from "express";
import { gcService } from "./gc.service";
import { Intervention, NewKindOfIssue, UserIssue } from "./gc.schemas";
import { GoogleError, MissingFile } from "../google/google.errors";
import { idIsMissing } from "./gc.errors";
import { PrismaError } from "../prisma/prisma.errors";
import { InvalidParameterException } from "../foda/foda.errors";
import { docsManager, GoogleService } from "../google/google.service";

export class GCController{
    constructor(protected service=gcService,protected googleService=docsManager){
        this.getInterventions=this.getInterventions.bind(this);
        this.createKindOfIssue=this.createKindOfIssue.bind(this);
        this.getKindOfIssues=this.getKindOfIssues.bind(this);
        this.deleteKindOfIssue=this.deleteKindOfIssue.bind(this);
        this.updateKindOfIssue=this.updateKindOfIssue.bind(this);
        this.createIssue=this.createIssue.bind(this);
        this.getIssues=this.getIssues.bind(this);
        this.addPhone=this.addPhone.bind(this);
        this.addMail=this.addMail.bind(this)
        this.addIntervention=this.addIntervention.bind(this)
        this.closeIssue=this.closeIssue.bind(this)
    }
    async getInterventions(req:Request<any,any,any,{id:string}>,res:Response){
        const {id}=req.query
    if (id === undefined) return res.status(404).send(new InvalidParameterException("Debes enviar un id"))
        const response = await this.service.getInterventionsById(id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }

    async createKindOfIssue(req:Request<any,any,NewKindOfIssue>,res:Response){
        const issue = req.body
        const response = await this.service.createNewKindOfIssue(issue)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async getKindOfIssues(req:Request<any,any,any,{id?:string}>,res:Response){
        const response = await this.service.getKindOfIssues(req.query.id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async deleteKindOfIssue(req:Request<any,any,any,{id:string}>,res:Response){
        const {id} = req.query
        if (id === undefined || id === null || typeof id !== "string") return res.status(404).send(new idIsMissing())
        const response = await this.service.deleteKindOfIssue(id)
    if (response instanceof PrismaError) return res.status(500).send(response)
    else return res.status(200).send(response)
    }
    async updateKindOfIssue(req:Request<any,any,NewKindOfIssue&{id:string}>,res:Response){
        const {id,...issue}=req.body
        console.log(id,issue,"texto")
        if (id === undefined || id === null || typeof id !== "string") return res.status(404).send(new idIsMissing())
        const response = await this.service.updateKindOfIssue(id,issue)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async uploadImage(req:Request<any,any,UserIssue>,res:Response){
        if (req.file !==undefined && req.file.path !==undefined)
            {
                const response = await this.googleService.uploadFile(req.file?.path)
                if (response instanceof GoogleError) return res.status(500).send(response)
                else {
                    
                    return  res.status(200).send({id:response})}
            }else return res.status(400).send(new MissingFile())
        
    }
    async createIssue(req:Request<any,any,UserIssue>,res:Response){
        const response = await this.service.createIssue(req.body)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }

    async getIssues(req:Request<any,any,any,{id?:string}>,res:Response){
        const {id}= req.query
        const response = await this.service.getIssues(id)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async addPhone(req:Request<any,any,{id:string,phone:string}>,res:Response){
        const {id,phone} =req.body
        if (id === undefined || phone === undefined) return res.status(404).send(new InvalidParameterException("Debes proveer un campo id y un campo phone para usar este metodo"))
        const response = await this.service.addPhone(phone,id)
        if (response instanceof PrismaError) res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async addMail(req:Request<any,any,{id:string,mail:string}>,res:Response){
        const {id,mail}=req.body
        if (id === undefined || mail === undefined) return res.status(404).send(new InvalidParameterException("Debes proveer un campo id y un campo mail para usar este metodo"))
        const response = await this.service.addMail(mail,id)
        if (response instanceof PrismaError) res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async addIntervention(req:Request<any,any,Intervention>,res:Response){
        const data=req.body
        console.log(data)
        const response = await this.service.addIntervention(data)
        if (response instanceof PrismaError) return res.status(500).send(response)
        else return res.status(200).send(response)
    }
    async closeIssue(req:Request<any,any,Intervention>,res:Response){
        const data = req.body
        const response = await this.service.closeIssue(data)
        if (response instanceof PrismaError) return res.status(500).send(response)
            else return res.status(200).send(response)
    }
}
export const gcController = new GCController()