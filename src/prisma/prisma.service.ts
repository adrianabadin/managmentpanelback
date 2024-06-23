import { Prisma, PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import argon2 from "argon2";
import { logger } from "../Global.Services/logger";
import { CreateManyNotArray, NotFoundError, returnPrismaError } from "./prisma.errors";
export const prismaClient2 =new PrismaClient().$extends({
query:{$allModels:{
    async create({args,model,operation,query}){
        try{
            const updatedAt=new Date()
            args.data.createdAt=updatedAt
            args.data.updatedAt=updatedAt
            args.data.id=nanoid()
            args.data.hash=await argon2.hash(JSON.stringify(args.data))
            return await query(args)
        }catch(e){
            const error = returnPrismaError(e as Error)
            logger.error({function:"Prisma Client",error})
            return error
        }
  
    },
    async createMany({args,query,model,operation}){
        try{ const updatedAt= new Date()
            if (Array.isArray(args.data)){
                const data =await Promise.all(args.data.map(async (item)=>{
                    item.updatedAt=updatedAt
                    item.createdAt=updatedAt
                    item.id=nanoid()
                    item.hash=await argon2.hash(JSON.stringify(args.data))
                    return item
                }))
                return await query({...args,data})
            } throw new CreateManyNotArray()
        }catch(e){
            const error = returnPrismaError(e as Error)
            logger.error({function:"Prisma Client",error})
            return error
        }
    },
    async update({args,model,operation,query}){
        try{
            const model2:keyof typeof  prismaClient2=`${model.slice(0,1).toLowerCase()}${model.slice(1,model.length)}` as keyof typeof prismaClient2
            let data:any= await  (prismaClient2[model2] as any).findUnique({where:args.where})  //await context.findUnique({where:args.where})
            if (data === null) return new NotFoundError()
            data ={...data,...args.data,updatedAt:new Date()}
            data={...data,hash: await argon2.hash(JSON.stringify(data))}    
            console.log(args.where,data,"XXXXXXXx")
            return await query({...args,data})

        }catch(e){
            const error = returnPrismaError(e as Error)
            logger.error({function:"Prisma Client",error})
            return error
        }
    },
    // async updateMany({args,model,operation,query}){
    //     try{
    //         const updatedAt=new Date()
    //         const model2:keyof typeof  prismaClient2=`${model.slice(0,1).toLowerCase()}${model.slice(1,model.length)}` as keyof typeof prismaClient2
    //         let data:any= await  (prismaClient2[model2] as any).findMany({where:args.where})  //await context.findUnique({where:args.where})
    //         if (data === null) return new NotFoundError()
    //             if (Array.isArray(data)){
    //                let response = await Promise.all(data.map(async (item)=>{
    //                 let newData= {...args.data,updatedAt}
    //                 newData={...newData,hash:await argon2.hash(JSON.stringify(newData))}
    //                 //newData={...newData,hash:}
    //                 return newData


    //                }))
    //                console.log(response,"UPDATEMANY")
    //                return await query({...args,data:response})
    //             }else return new NotFoundError()

    //     }catch(e){
    //         const error = returnPrismaError(e as Error)
    //         logger.error({function:"Prisma Client",error})
    //         return error
    //     }
    // }
    // async findUnique(){
    //     try
    // }

}}
})
