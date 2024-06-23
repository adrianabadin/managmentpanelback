import { Request, Response } from "express";
import { logger } from "../Global.Services/logger";
import { GoogleService } from "./google.service";
import { DocumentCreateType, Mail } from "./google.schemas";
import { GoogleError, MissingFile } from "./google.errors";
import { InvalidParameterException } from "../foda/foda.errors";
import { idIsMissing } from "../gc/gc.errors";

export class GoogleController {
    constructor(protected googleService=new GoogleService()){
this.createDocument=this.createDocument.bind(this);
this.uploadImage=this.uploadImage.bind(this);
this.deleteImage=this.deleteImage.bind(this);    
this.listFiles=this.listFiles.bind(this)
this.deleteAll=this.deleteAll.bind(this)
this.sendMail=this.sendMail.bind(this)
this.getFile=this.getFile.bind(this)
}

async createDocument (req:Request<any,any,DocumentCreateType>,res:Response){
    try{
       const response =await  this.googleService.createDocument(req.body.text,req.body.title,req.body.user)
       console.log(response,"controller")
       if (response) {
        res.status(200).send({id:response})
    return
    }
       else {res.status(500).json(response)
    return
    }
    }catch(error){
        logger.error({function:"GoogleController.createDocument",error})
        res.status(500).json(error)
    return
    }
}
async uploadImage(req:Request,res:Response){
    if (req.file !==undefined && req.file.path !==undefined)
    {
        const response = await this.googleService.uploadFile(req.file?.path)
        if (response instanceof GoogleError) return res.status(500).send(response)
        else return  res.status(200).send({id:response})
    }else return res.status(400).send(new MissingFile())
}
async deleteImage(req:Request<any,any,any,{id:string}>,res:Response){
    if (req.query.id === undefined) return res.status(400).send(new InvalidParameterException("Id is required"))
    const response = await this.googleService.deleteFile(req.query.id)
if (response instanceof GoogleError) return res.status(500).send(response)
else return res.status(200).send(response)
}
async listFiles(req:Request<any,any,any,{id:string}>,res:Response){
    const response= await this.googleService.listFiles()
    if (response instanceof GoogleError) return res.status(500).send(response)
    else return res.status(200).send(response)
}
async deleteAll(req:Request<any,any,any,{id:string}>,res:Response){
    const response= await this.googleService.deleteAll()
    if (response instanceof GoogleError) return res.status(500).send(response)
    return res.send(response)
}
async getFile(req:Request<any,any,any,{id:string}>,res:Response){
    const {id} = req.query
    if (id === undefined) return res.status(404).send(new idIsMissing(undefined,"Debes proveer un ID por query Para para getFile"))
    const response = await this.googleService.getFile(id)
if (response instanceof GoogleError) return res.status(500).send(response)
else return res.status(200).send({data:response})
}
async sendMail(req:Request<any,any,Mail>,res:Response){
    const {autor,body,nombre,to}=req.body
    const response = await this.googleService.sendMail(body,to,nombre,autor)
    if (response instanceof GoogleError) return res.status(500).send(response)
    else return res.status(200).send(response)
}
}