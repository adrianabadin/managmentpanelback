import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "../Global.Services/logger";
import { prismaClient } from "../app.middleware";
import { NotFoundError, PrismaError, TimeoutOrConnectionError, UnknownPrismaError, isTimeout, notFound, returnPrismaError } from '../prisma/prisma.errors';
import { CloseTaskType, TaskType } from "./task.schema";
export class TaskService{
    constructor(protected prisma=new PrismaClient()){
        this.createTask=this.createTask.bind(this);
        this.getTasksByDepartment=this.getTasksByDepartment.bind(this);
        this.getTasksByState=this.getTasksByState.bind(this)
        this.getTasksByUserName=this.getTasksByUserName.bind(this)
        this.getTasks=this.getTasks.bind(this)
        this.deleteTask=this.deleteTask.bind(this)
        this.updateTask=this.updateTask.bind(this)
        this.closeTask=this.closeTask.bind(this)
    }
async createTask(data:TaskType){
    try{
        const response= await this.prisma.tasks.create(
            {data:{date:new Date(data.date),flag:data.flag,title:data.title,
                Demography:{connect:{state :data.state}},
                Users:{connect:{username:data.username}},
                Departments:{connect:{name:data.department}}
            },
            include:
                {
                Departments:
                    {select:{name:true}},
                Demography:{select:{state:true}},
                Users:{select:{username:true}}
            
            }})
            return response
    }catch(error){
        logger.error({function: "TaskService.createTask",error})
    }
}
async getTasks(username?:string,state?:string,department?:string,isCompleted?:boolean){
    try{

//if (username!==undefined)       

const manyQuery:Prisma.TasksFindManyArgs["where"]={
    AND:[{
        Users:{username}
        },
        {isCompleted:(isCompleted !==undefined ?isCompleted :false)},
        {OR:
            [
                {Departments:department === undefined ? undefined : {name:department}},
                {Demography:state ===undefined ? undefined : {state:state}}
            ]}
        ]}
logger.debug(manyQuery)
const response =await this.prisma.tasks.findMany(
    { 
        where:manyQuery
                ,include:{Departments:{select:{name:true}},Demography:{select:{state:true}},Users:{select:{username:true}}}
            })

            console.log(response,"service")
            return response
    }catch(error){
        let response= notFound(error as Error)
        if (response === undefined) 
        {
            response=new UnknownPrismaError(error)           
        }
        logger.error({function:"TaskService.getTasks",error:response})
        return response
    }
}
async getTasksByDepartment(department?:string){
    try{
        if (department===undefined) {
    return await this.prisma.tasks.findMany({
        where:{},
        include:{
            Departments:{select:{name:true}},
            Demography:{select:{state:true}},
            Users:{select:{username:true}},
        }
    })}
else{return await this.prisma.tasks.findMany({
    where:{
        Departments:{name:department}
    },
    include:{
        Departments:{select:{name:true}},
        Demography:{select:{state:true}},
        Users:{select:{username:true}}
    
    }})
    
    }

    }catch(error){
        logger.error({function: "TaskService.getTasks",error})
    }
}
async getTasksByState(state?:string){
    try{
        if (state === undefined) return await this.prisma.tasks.findMany({
            where:{},
            include:{
                Departments:{select:{name:true}},
                Demography:{select:{state:true}},
                Users:{select:{username:true}},
            }
        })
        else return await this.prisma.tasks.findMany({
            where:{Demography:{state}},
            include:{
                Demography:{select:{state:true}},
                Departments:{select:{name:true}},
                Users:{select:{username:true}}
            }})
    }catch(error){
        logger.error({function:"TaskService.getTasksByState",error})
    }
}
async getTasksByUserName(username:string){
    try{
        if(username === undefined) return await this.prisma.tasks.findMany({
            where:{},
            include:{
                Departments:{select:{name:true}},
                Demography:{select:{state:true}},
                Users:{select:{username:true}},
            }
        })
        else return await this.prisma.tasks.findMany({
             where:{Users:{username}},
             include:{
                Departments:{select:{name:true}},
                Demography:{select:{state:true}},
                Users:{select:{username:true}}
            }})
    }
    catch(error){
        logger.error({function:"TaskService.getTasksByState",error})
    
}

}
async deleteTask(id:string)
{
    try{
        const response=await this.prisma.tasks.delete({where:{id}})
        return response
    }catch(error){
        
        if (typeof error === "object" && error!==null &&"code" in error && error.code==="P2025") {
            logger.error({function:"TaskService.deleteTask",error:new NotFoundError()})
            return new NotFoundError()}
         
            logger.error({function:"TaskService.deleteTask",error:new UnknownPrismaError(error)})
        return    new UnknownPrismaError(error)
    }
    
}
async updateTask(data:TaskType&{id:string})
{
    try{
        logger.debug({function:"updateTask",data})
       const response= await  this.prisma.tasks.update(
            {
                where:
                    {id:data.id},
                    data:{
                        title:data.title,
                        date:data.date,
                        flag:data.flag,
                        Users:{
                            connect:{username:data.username}
                        },
                        Departments:{
                            connect:{name:data.department}
                        },
                        Demography:{
                            connect:{state:data.state}
                        }
                    }})
    
                    return response
                }
    catch(error){
        console.log(error)
        if (notFound(error as Error) !== undefined) {
            logger.error({function:'TaskService.updateTask',error:new NotFoundError()})
            return new NotFoundError()}
        else {
            if (isTimeout(error as Error) !== undefined) {
                logger.error({function:'TaskService.updateTask',error:new TimeoutOrConnectionError(error) })
                return new TimeoutOrConnectionError(error)
            } 
            else{
            logger.error({function:'TaskService.updateTask',error:new UnknownPrismaError(error)})
            return new UnknownPrismaError(error)}

    }
}
}
async closeTask(data:CloseTaskType){
    try{
        const response = await this.prisma.tasks.update({where:{id:data.id},data:{brief:data.brief,file:data.file,isCompleted:true},select:{id:true}})
        return response
    }catch(error){
        const typedError = returnPrismaError(error as Error)
        logger.error({function:"TaskService.closeTask",error: typedError})
        return typedError
    }
}
}