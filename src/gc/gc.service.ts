import { Prisma, PrismaClient } from "@prisma/client";
import { prismaClient } from "../app.middleware";
import { logger } from "../Global.Services/logger";
import { returnPrismaError } from "../prisma/prisma.errors";
import { Intervention, NewKindOfIssue, UserIssue } from './gc.schemas';
import { docsManager } from "../google/google.service";
import { GoogleError, StreamError } from "../google/google.errors";
import { connect } from "http2";
export class GCService {
    constructor(
        protected prisma=new PrismaClient(),
        protected googleService= docsManager
        ){
        this.getInterventionsById=this.getInterventionsById.bind(this)
        this.createNewKindOfIssue=this.createNewKindOfIssue.bind(this);
        this.getKindOfIssues=this.getKindOfIssues.bind(this);
        this.deleteKindOfIssue=this.deleteKindOfIssue.bind(this);
        this.updateKindOfIssue=this.updateKindOfIssue.bind(this);
        this.createIssue=this.createIssue.bind(this);
        this.getIssues=this.getIssues.bind(this);
        this.addPhone=this.addPhone.bind(this);
        this.addMail=this.addMail.bind(this);
        this.addIntervention=this.addIntervention.bind(this);
    }
    async createNewKindOfIssue(issue:NewKindOfIssue){
        try{
            const response  = await this.prisma.kindOfIssue.create({data:issue})
            return response
        }
        catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"createNewKindOfIssue",error})
            return error
        }
    }
    async getKindOfIssues(id?:string){
        try{
            const response = await this.prisma.kindOfIssue.findMany({where:{id}})
            return response 
        }
        catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"getKindOfIssues",error})
            return error
        }
    }
    async deleteKindOfIssue(id:string){
        try{
            const response = await this.prisma.kindOfIssue.delete({where:{id},select:{id:true}})
            return response
        }catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"deleteKindOfIssue",error})
            return error
        }
    }
    async updateKindOfIssue(id:string,issue:Partial<NewKindOfIssue>){
        try{
            const response = await this.prisma.kindOfIssue.update({where:{id},data:{...issue}})
            return response
        }
        catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"UpdateKindOfIssue",error})
            return error
        }
    }
    async createIssue(issue:UserIssue){
        try{
            const {description,kind,lastName,name,socialSecurityNumber,state,email,files:filesData,phone}=issue
            const response = await this.prisma.issuesByUser.create(
                {
                    data:{
                        description,
                        phone,
                        email:email?.toUpperCase(),
                        name,
                        lastName,
                        socialSecurityNumber,
                        files:filesData === undefined ? undefined : {create:filesData.map(file=>({...file}))},                        
                        state:{connect:{state}},
                        kind:{connect:{name:kind}}
                    }
                ,select:{id:true}})
                return response
        }
        catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"createIssue",error})
            return error

        }
    }
    async getIssues(id?:string){
        try{
            if (id === undefined){
                const response = await this.prisma.issuesByUser.findMany(
                    {
                        include:
                        {
                            files:{select:{driveId:true,description:true,id:true}},
                            kind:{select:{name:true}},
                            state:{select:{state:true}}
                        }
                    })
                   return response
                // return await Promise.all (response.map(async (item)=>
                //     {   const files =  await Promise.all(item.files.map(
                //         async (file)=>{
                //             const response= await this.googleService.getFile(file.driveId)
                //             if (response instanceof GoogleError) throw response
                //             return {data:response,name:file.description,id:file.id}

                //         }))
                //         return {
                //         ...item,
                //         state:item.state.state,
                //         kind:item.kind.name,
                //         updatedAt:undefined,
                //         kindOfIssueId:undefined,
                //         demographyId:undefined,
                //         files
                //         }}))
                    }
            else {
               const response = await this.prisma.issuesByUser.findUniqueOrThrow(
                {
                    where:{id},
                    include:{                            
                        files:{select:{driveId:true,description:true,id:true}},
                        kind:{select:{name:true}},
                        state:{select:{state:true}}
                            }
                })
               const files=(await Promise.all(response.files.map(async (file)=>{
                   const response = await this.googleService.getFile(file.driveId)
                if (response instanceof GoogleError) throw response
                return {data:response,name:file.description,id:file.id}
            })))
               return {
                ...response,
                state:response.state.state,
                kind:response.kind.name,
                updatedAt:undefined,
                kindOfIssueId:undefined,
                demographyId:undefined,
                files
            }
        }
        } catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"getIssues",error})
            return error

        }
    }
    async addPhone(phone:string,id:string){
        try{
            const response = await  this.prisma.issuesByUser.update({where:{id},data:{phone2:phone},select:{id:true}})
            return response
        }catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"addMail",error})
            return error

        }
    }
    async addMail(mail:string,id:string){
        try{
            const response = await this.prisma.issuesByUser.update({where:{id},data:{email2:mail.toUpperCase()},select:{id:true}})
            return response
        }catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"addMail",error})
            return error
        }
    }
    async addIntervention(data:Intervention){
        try{
            const response = await this.prisma.issueIntervention.create
            ({data:
                    {
                        text:data.description,
                        user:{connect:{id:data.userId}},
                        IssuesByUser:{connect:{id:data.id}},
                        files:data.files !== undefined ?  {create:data.files?.map((file)=>file)}:undefined
                    }
                })
                return response
        }catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"addMail",error})
            return error
        }
    }
   async getInterventionsById(id:string){
        try{
            const response =await this.prisma.issuesByUser.findUnique({where:{id},include:{interventions:{ include:{files:{select:{driveId:true,description:true,name:true}},user:{select:{username:true,name:true,lastname:true}}}}}})
            logger.debug({function:"getInterventionsById",response})
            return response
        }catch(e){
            const error= returnPrismaError(e as Error)
            logger.error({function:"addMail",error})
            return error

        }
    }
}
export const gcService=new GCService()