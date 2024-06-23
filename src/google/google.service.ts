//import docs from "@googleapis/docs"
import {Auth, google} from "googleapis"
import { logger } from "../Global.Services/logger"
import { DocumentCreateError, DocumentUpdateError, FileCreateError, GoogleError, StreamError, UnknownGoogleError, UnlinkError, invalidCredentials, isNotFound } from './google.errors';
import fs, { createReadStream } from 'fs';
import { v4 } from "uuid";
import request from 'supertest';
import {createTransport} from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
const transport =  createTransport({
    service:"gmail",
    auth:{
        user:"rsxabadin@gmail.com",
        pass:process.env.MAIL
    }
})
export class GoogleService {
static authClient:Auth.GoogleAuth  |undefined
    constructor(
        protected mailTransport=transport
    ){
        this.createDocument=this.createDocument.bind(this);
        this.uploadFile=this.uploadFile.bind(this);
        this.deleteFile=this.deleteFile.bind(this);
        this.listFiles=this.listFiles.bind(this);
        this.deleteAll=this.deleteAll.bind(this);
        this.getFile=this.getFile.bind(this);
        this.sendMail=this.sendMail.bind(this)
}
    /**
     * 
     * ,
     * "https://www.googleapis.com/auth/calendar",
     */
    async initiateService(){
        //const datab= await fs.promises.readFile("./rsx.json", "utf8");
        const authClient= new google.auth.GoogleAuth({
            keyFilename: "../rsx.json", //process.env.ENVIROMENT!=="DEV"? "rsx.json":"../rsx.json",
            scopes:
                [             
                "https://www.googleapis.com/auth/documents",'https://www.googleapis.com/auth/drive']})
        GoogleService.authClient =  authClient
    }
      
    async createDocument(text:string,title:string,user:string){
        try{
            if (GoogleService.authClient === undefined) await this.initiateService()
            const client= google.docs({version:"v1", auth:GoogleService.authClient})
            const drive= google.drive({version:"v3", auth:GoogleService.authClient})
            //const client = docs.docs({version:"v1",auth:GoogleService.authClient})
        const document= await client.documents.create({  requestBody:{body:{content:[{paragraph:{elements:[{textRun:{ content:text}}]}}]}, title}})
        console.log(document.data.documentId,"Id del documento creado")
        if (document.data.documentId !== undefined && document.data.documentId !==null){
            const updatedDocument = await client.documents.batchUpdate(
                {
                    documentId:document.data.documentId,
                    requestBody:{
                        requests:[{
                            insertText:{endOfSegmentLocation:{},text:title+"\n"}
                        },
                        {
                            updateTextStyle:{range:{startIndex:1,endIndex:title.length+2},textStyle:{bold:true},fields:'bold'}
                        },
                        {
                            updateTextStyle:{range:{startIndex:1,endIndex:title.length+2},textStyle:{fontSize:{magnitude:16,unit:'PT'}},fields:'fontSize'}
                        },
                        {
                            insertText:{endOfSegmentLocation:{},text:text+"\n\n"},
                            
                        },{updateTextStyle:{range:{startIndex:title.length+2,endIndex:title.length+2+text.length+2},textStyle:{fontSize:{magnitude:12,unit:'PT'}},fields:'fontSize'}}]
                    }
                })
console.log(updatedDocument.data.documentId,"id del documento modificado")
                if (updatedDocument.data.documentId !== undefined&& updatedDocument.data.documentId!==null) {
    const permisions=await drive.permissions.create({fileId:updatedDocument.data.documentId,requestBody:{
        role:"writer",
        type:"user",
        emailAddress:user
    }})     
    const documents=await client.documents.get({documentId:updatedDocument.data.documentId})
            }else throw new DocumentUpdateError()
                if (updatedDocument.data.documentId !== undefined) return updatedDocument.data.documentId
                else throw new DocumentUpdateError()
            }else throw new DocumentCreateError()    
        }catch(error){
            let parsedError =invalidCredentials(error as Error)    
        if ( parsedError instanceof GoogleError) {
            logger.error({function:"GoogleService.createDocument",error:parsedError})
            return parsedError}
            if (error instanceof GoogleError){
                logger.error({function:"GoogleService.createDocument",error})
                return error
            } else {
                logger.error({function:"GoogleService.createDocument",error:new UnknownGoogleError(error)})
                return new UnknownGoogleError(error)}
        }
    }
    async uploadFile (path:string){
    try{
        if (GoogleService.authClient === undefined) await this.initiateService()
        const drive = google.drive({version:"v3", auth:GoogleService.authClient})
        const response = await drive.files.create({
            requestBody:{mimeType:"image/jpeg",name:v4()},
            media:{body:createReadStream(path)}
    })
    if(response.status !==200) throw new FileCreateError(response)
    if (response.data === undefined || response.data===null || response.data.id === undefined || response.data.id === null)throw new FileCreateError(response)
    
    fs.promises.unlink(path).then().catch(error=>{throw new UnlinkError(error)
})
    return response.data.id

}catch(error){
    if (error instanceof UnlinkError) return error
    if(typeof error ==="object" && error !==null && "code" in error && error.code===1004) {
        logger.error({function:"GoogleService.uploadFile",error})
        return error as FileCreateError
    }else {
        logger.error({function:"GoogleService.uploadFile",error:new UnknownGoogleError(error)})
        return new UnknownGoogleError(error)}
}

}
async deleteFile(id:string){
    try {
        if (GoogleService.authClient === undefined) await this.initiateService()
        const drive = google.drive({version:"v3", auth:GoogleService.authClient})
    const response = await drive.files. delete({
        fileId:id
    })
    if (response.status >200 && response.status<<300) return response.data
    else throw new UnknownGoogleError(response)
    }catch(error){
        const newError = isNotFound(error as any)
        logger.error({function:"GoogleService.deleteFile",error:newError})
        return newError
    }
}
async listFiles(){
    try{
        if (GoogleService.authClient === undefined) await this.initiateService()
        const drive = google.drive({version:"v3", auth:GoogleService.authClient})
    const response = await drive.files.list({})
    return response.data.files

    }catch(error){
        logger.error({function:"listFiles",error})
        return new UnknownGoogleError(error)
    }
}
async deleteAll(){
    try{
        const files= await this.listFiles()
        if (files instanceof GoogleError) throw files
       files?.forEach(async (file)=>{
            if (file.id !== undefined && file?.id !==null) {
                await this.deleteFile(file.id)}
        })
    }catch(err){
        const error = isNotFound(err)
        logger.error({function:"deleteAll",error})
        return error
    }
}
async getFile(id:string){
    try{
        if (GoogleService.authClient === undefined) await this.initiateService()
        const drive = google.drive({version:"v3", auth:GoogleService.authClient})
    const response = await drive.files.get({
        fileId:id,
        alt:"media"
    },{responseType:"stream"})
    if (response.status !==200) throw new UnknownGoogleError(undefined,"Request failed")
    return  new Promise((resolve,reject)=>{
        let buf:Buffer[]=[]
        let data:string
        response.data.on("data",(data)=>buf.push(data))
        response.data.on("error",(e)=>reject(new StreamError(e)))
        response.data.on("end",()=>{
             data = Buffer.concat(buf).toString("base64")
            resolve(data)
        })
        
})
    }catch(error){
        logger.error({function:"listFiles",error})
        return new UnknownGoogleError(error)
    }
}
async sendMail(body:string,to:string,nombre:string,autor:string){
    try{
        const html = `<article>
        <h2 style="font-weight: bold; font-size: 22px;">Estimado ${nombre.toUpperCase()} :</h2>
        <p style="text-align: justify;">${body}</p>
        <div style=" align-items: flex-start;">
          <h4 style="font-weight: bold; text-align: left;">${autor.toUpperCase()}</h4>
          <h4 style="font-weight: bold; text-align: left;">Region Sanitaria X</h4>
        </div>  
      </article>`
      
       const {accepted,rejected,messageId} = await  this.mailTransport.sendMail({to,from:"rsxabadin@gmail.com",subject:"Intervencion sobre tu solicitud",html})
       return {accepted,rejected,messageId}
       
    }catch(error){
        logger.error({function:"listFiles",error})
        return new UnknownGoogleError(error)
    }
}
}
export const docsManager= new GoogleService()