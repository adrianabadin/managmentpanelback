import { Prisma, PrismaClient } from "@prisma/client";
import { InvalidParameterException } from "./foda.errors";
import { logger } from "../Global.Services/logger";

import { returnPrismaError, NotFoundError } from "../prisma/prisma.errors";
import { FODA, fodaSchema } from "./foda.schema";
import { ElementFromArray, NoUndefined } from "../Global.Services/Entitites/Utility.Types";
import winston from 'winston';
import { prismaClient } from '../app.middleware';


export class FodaService {
    constructor(protected prisma=new PrismaClient()){
        this.addStrategyWM=this.addStrategyWM.bind(this);
        this.removeStrategyWMById=this.removeStrategyWMById.bind(this);
        this.addStrategyWO=this.addStrategyWO.bind(this);
        this.removeStrategyWOById=this.removeStrategyWOById.bind(this);
        this.addStrategySO=this.addStrategySO.bind(this);
        this.removeStrategySOById=this.removeStrategySOById.bind(this);
        this.addStrategySM=this.addStrategySM.bind(this);
        this.removeStrategySMById=this.removeStrategySMById.bind(this);
        this.addWeakness=this.addWeakness.bind(this);
        this.removeWeaknessById=this.removeWeaknessById.bind(this);
        this.addMenace=this.addMenace.bind(this);
        this.removeMenaceById=this.removeMenaceById.bind(this);
        this.addOportunity=this.addOportunity.bind(this);
        this.removeOportunityById=this.removeOportunityById.bind(this);
        this.removeStrengthById=this.removeStrengthById.bind(this);
        this.create=this.create.bind(this);
        this.getOne=this.getOne.bind(this);
        this.removeMenace=this.removeMenace.bind(this);
        this.removeOportunity=this.removeOportunity.bind(this);
        this.removeStrength=this.removeStrength.bind(this);
        this.removeWeakness=this.removeWeakness.bind(this);
        this.update=this.update.bind(this)
        this.getFODAHistory=this.getFODAHistory.bind(this)
        this.getFODAActiveHistory=this.getFODAActiveHistory.bind(this)
        this.addStrength=this.addStrength.bind(this)
        this.listFoda=this.listFoda.bind(this)
    }
    // en este caso si el param es undefined no buscara por ese criterio si quieres buscar uno de esos campos como vacio 
    // debe tener valor null
    async getFODAHistory(state?: string|null,service?:string|null){
        try{
            const response = await this.prisma.fODA.findMany(
                {
                    where:{
                        Demography:state === undefined 
                            ? undefined 
                            : state === null ? null: {state:state},
                        Departments:service === undefined 
                            ?undefined
                            : service === null?null :{name:service}},
                    include:{
                        Menace:{ 
                            select:{  title:true,description:true}},
                        Oportunity:{
                            select:{ title:true,description:true}},
                        Strength:{
                            select:{ title:true,description:true}},
                        Weakness:{
                            select:{title:true,description:true}},
                    }})
            if (response !== null)
                return response.map(({Menace,Oportunity,Strength,Weakness})=>({state,service,Strength,Weakness, Menace,Oportunity}))
            else throw new NotFoundError("Unable to find any FODA items for the state provided")
        }
        catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaStateService.create",newError})
            return newError
        }
    }
    async getFODAActiveHistory(state?: string|null,service?:string|null){
        try{
            const response = await this.prisma.fODA.findMany(
                {
                    where:{
                        Demography:state === undefined 
                            ? undefined 
                            : state ===null?null: {state:state},
                        Departments:service === undefined 
                            ?undefined
                            : service ===null ?null: {name:service}},
                    include:{
                        Menace:{ 
                            where:{isActive:true},
                            select:{  title:true,description:true}},
                        Oportunity:{
                            where:{isActive:true},
                            select:{ title:true,description:true}},
                        Strength:{
                            where:{isActive:true},
                            select:{ title:true,description:true}},
                        Weakness:{
                            where:{isActive:true},
                            select:{title:true,description:true}},
                    }})
            if (response !== null)
                return response.map(({Menace,Oportunity,Strength,Weakness})=>({state,service,Strength,Weakness, Menace,Oportunity}))
            else throw new NotFoundError("Unable to find any FODA items for the state provided")
        }
        catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaStateService.create",newError})
            return newError
        }
    }    
    async create(stateSTR?:string,serviceSTR?:string){
        try {
            const response = await this.prisma.fODA.create({
                data:{
                    Demography:stateSTR ===undefined ?undefined:{connect:{state: stateSTR}},
                    Departments:serviceSTR ===undefined ?undefined : {connect:{name:serviceSTR}}
                    },
                    include:{
                        Departments:{select:{name:true}},
                        Demography:{select:{state:true}}

                }
            
            })
                
        return {
            ...response,
            state:response.Demography !==null ? response.Demography.state :undefined,
            service:response.Departments !== undefined ? response.Departments?.name : undefined
        }
        }catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaStateService.create",newError})
            return newError
        }
    }
    async update(data:FODA["body"]){
        try{
            const result =fodaSchema.safeParse({body:data})
            if (!result.success) {                
                throw new InvalidParameterException("FodaService.update: "+result.error.message)}
            const fodaObject = await this.prisma.fODA.findFirst(
                {where:{
                    Demography:data.state === undefined 
                        ? null 
                        : {state:data.state},
                    Departments:data.service === undefined 
                        ?null
                        :{name:data.service}},
                    include:{Menace:true,Oportunity:true,Strength:true,Weakness:true}})   
            if (fodaObject !==null){
                let {Strength,Menace,Oportunity,Weakness,id}=fodaObject
                const response= await this.prisma.fODA.update(
                    {
                        where:{id},
                        data:{
                            Menace:{connect:Menace,create:data.menaces},
                            Oportunity:{connect:Oportunity,create:data.oportunities},
                            Strength:{connect:Strength,create:data.strengths},
                            Weakness:{connect:Weakness,create:data.weakneses}
                        },include:{
                            Menace:{where:{isActive:true}, select:{title:true,description:true}},
                            Oportunity:{where:{isActive:true},select:{title:true,description:true}},
                            Strength:{where:{isActive:true},select:{title:true,description:true}},
                            Weakness:{where:{isActive:true},select:{title:true,description:true}},
                            Demography:{select:{state:true}},
                            Departments:{select:{name:true}}

                        
                        }})
                        return {
                            ...response,
                            state:response?.Demography === null ?null:response.Demography.state,
                            service:response?.Departments === null ?null:response.Departments.name,
                            strengths:response.Strength,
                            oportunities:response.Oportunity,
                            weaknesses:response.Weakness,
                            menaces:response.Menace,
                        }
            }
            
        }catch(error){
            if (error instanceof InvalidParameterException) return error
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaStateService.create",newError})
            return newError
        }
    }
    async getOne(state?: string,service?:string){
        try{
            const whereQ:Prisma.FODAFindManyArgs["where"]={                       
                Demography:state === undefined 
                
                ? null 
                : {state},
            Departments:service === undefined 
                ?null
                :{name:service}}
                console.log(whereQ)
            const response = await this.prisma.fODA.findFirst(
                {
                    where:{
                        Demography:state === undefined 
                            ? null 
                            : {state:state},
                        Departments:service === undefined 
                            ?null
                            :{name:service}},
                    include:{
                        Menace:{ 
                            where:{isActive:true},
                            select:{  title:true,description:true,id:true}},
                        Oportunity:{
                            where:{isActive:true},
                            select:{ title:true,description:true,id:true}},
                        Strength:{
                            where:{isActive:true},
                            select:{ title:true,description:true,id:true}},
                            
                        Weakness:{
                            where:{isActive:true},
                            select:{title:true,description:true,id:true}},
                        StrategySO:{
                                where:{isActive:true},
                                select:{title:true,description:true,id:true}},
                        StrategySM:{
                                where:{isActive:true},
                                select:{title:true,description:true,id:true}},
                        StrategyWM:{
                                where:{isActive:true},
                                select:{title:true,description:true,id:true}},
                        StrategyWO:{
                                where:{isActive:true},
                                select:{title:true,description:true,id:true}}
        
        

        
    
                    }})
            if (response !== null)
                {
                    return {
                    ...response,
                    Demography:state,
                    Department:service
                }}
            else throw new NotFoundError("Unable to find any FODA items for the state provided")
        }
        catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaService.GetOne",newError})
            return newError
        }
    }
    async listFoda(){
        try{
            const response = await this.prisma.fODA.findMany({})
            return response
        }catch(error){
            const newError= returnPrismaError(error as Error)
            logger.error({function:"FodaService.List",newError})
            return newError
        }
    }

    async removeMenace(title:string,state?:string,service?:string){
        try{
           const fODAId=(await this.prisma.fODA.findFirst(
           {
            where:{
                Demography:state === undefined 
                    ? null 
                    : {state:state},
                Departments:service === undefined 
                    ?null
                    :{name:service}}
           }))?.id
           const response=await  this.prisma.menace.updateMany(
            {where: 
                {
                    fODAId,
                    title
                },
                data:{isActive:false}})
                if (response.count===0) throw new NotFoundError()
                return {title,state,service,ok:true}
        }catch(error){
            const newError = returnPrismaError(error as Error)
            logger.error({function:"FodaStateService.create",newError})
            return newError
        }
       } 

async removeWeakness(title:string,state?:string,service?:string){
    try{
        const fODAId=(await this.prisma.fODA.findFirst(
            {
             where:{
                 Demography:state === undefined 
                     ? null 
                     : {state:state},
                 Departments:service === undefined 
                     ?null
                     :{name:service}}
            }))?.id
       const response=await  this.prisma.weakness.updateMany(
        {where: 
            {
                AND:[
                    {
                        title:title,
                        fODAId
                    }
                ]
            },
            data:{isActive:false}})
            if (response.count===0) throw new NotFoundError()
            return {title,state,service,ok:true}
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaStateService.create",newError})
        return newError
    }
   }    async removeStrength(title:string,state?:string,service?:string){
     
    try{
        const fODAId=(await this.prisma.fODA.findFirst(
            {
             where:{
                 Demography:state === undefined 
                     ? null 
                     : {state:state},
                 Departments:service === undefined 
                     ?null
                     :{name:service}}
            }))?.id
       const response=await  this.prisma.strength.updateMany(
        {where: 
            {
                AND:[
                    {
                        title:title,
                        fODAId
                    }
                ]
            },
            data:{isActive:false}})
            if (response.count===0) throw new NotFoundError()
            return {title,state,service,ok:true}
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaStateService.create",newError})
        return newError
    }
   } 

   async removeOportunity(title:string,state?:string,service?:string){
    try{
        const fODAId=(await this.prisma.fODA.findFirst(
            {
             where:{
                 Demography:state === undefined 
                     ? null 
                     : {state:state},
                 Departments:service === undefined 
                     ?null
                     :{name:service}}
            }))?.id
       const response=await  this.prisma.oportunity.updateMany(
        {where: 
            {
                AND:[
                    {
                        title:title,
                        fODAId
                    }
                ]
            },
            data:{isActive:false}})
            if (response.count===0) throw new NotFoundError()
            return {title,state,service,ok:true}
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaStateService.create",newError})
        return newError
    }
   } 
/**
 * addSingle member and remove by id 
 */
async addStrength(data:ElementFromArray<NoUndefined<FODA["body"]["strengths"]>>,state?:string,service?:string){
    try{
        console.log("add Strength", state,service," X")
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{Strength:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) {
                const createData:Prisma.FODACreateArgs={data:{
                    Demography: (state === undefined ) ?undefined :{connect:{state:state}},
                    Departments:service=== undefined ?undefined :  {connect:{name:service}}
                    },include:{Strength:{select:{title:true,description:true,id:true}}}}
                
                    console.log(createData,"query",state,service)
                findResponse=await this.prisma.fODA.create(
                    {data:{
                        Demography: (state === undefined ) ?undefined :{connect:{state:state}},
                        Departments:service=== undefined ?undefined :  {connect:{name:service}}
                        },include:{Strength:{select:{title:true,description:true,id:true}}}}
                    )
                }
                //throw new NotFoundError()}
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    Strength:
                        {
                            connect:findResponse.Strength,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addStrength",error:newError})
        return newError
    }
}
async removeStrengthById(id:string){
    try{
    const response = await this.prisma.strength.update({where:{id},data:{isActive:false}})
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeStrength",newError})
        return newError
    }
}

async addOportunity(data:ElementFromArray<NoUndefined<FODA["body"]["oportunities"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{Oportunity:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{Oportunity:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    Oportunity:
                        {
                            connect:findResponse.Oportunity,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addOportunity",error:newError})
        return newError
    }
}
async removeOportunityById(id:string){
    try{
    const response = await this.prisma.oportunity.update({where:{id},data:{isActive:false}})
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeOportunity",newError})
        return newError
    }
}
async addMenace(data:ElementFromArray<NoUndefined<FODA["body"]["menaces"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{Menace:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{Menace:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    Menace:
                        {
                            connect:findResponse.Menace,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addMenace",error:newError})
        return newError
    }
}
async removeMenaceById(id:string){
    try{
    const response = await this.prisma.menace.update({where:{id},data:{isActive:false}})
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeMenace",newError})
        return newError
    }
}
async addWeakness(data:ElementFromArray<NoUndefined<FODA["body"]["weakneses"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{Weakness:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{Weakness:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    Weakness:
                        {
                            connect:findResponse.Weakness,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addWeakness",error:newError})
        return newError
    }
}
async removeWeaknessById(id:string){
    
    try{
    const response = await this.prisma.weakness.update({where:{id},data:{isActive:false}})
    console.log(response,id)
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeWeakness",newError})
        return newError
    }
}
async addStrategySO(data:ElementFromArray<NoUndefined<FODA["body"]["strategySO"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{StrategySO:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{StrategySO:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    StrategySO:
                        {
                            connect:findResponse.StrategySO,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addStrategySO",error:newError})
        return newError
    }
}
async removeStrategySOById(id:string){
    
    try{
    const response = await this.prisma.strategySO.update({where:{id},data:{isActive:false}})
    console.log(response,id)
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeStrategySO",newError})
        return newError
    }
}
async addStrategySM(data:ElementFromArray<NoUndefined<FODA["body"]["strategySM"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{StrategySM:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{StrategySM:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    StrategySM:
                        {
                            connect:findResponse.StrategySM,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addStrategySM",error:newError})
        return newError
    }
}
async removeStrategySMById(id:string){
    
    try{
    const response = await this.prisma.strategySM.update({where:{id},data:{isActive:false}})
    console.log(response,id)
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeStrategySM",newError})
        return newError
    }
}
async addStrategyWO(data:ElementFromArray<NoUndefined<FODA["body"]["strategyWO"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{StrategyWO:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{StrategyWO:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    StrategyWO:
                        {
                            connect:findResponse.StrategyWO,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addStrategyWO",error:newError})
        return newError
    }
}
async removeStrategyWOById(id:string){
    
    try{
    const response = await this.prisma.strategyWO.update({where:{id},data:{isActive:false}})
    console.log(response,id)
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeStrategyWO",newError})
        return newError
    }
}
async addStrategyWM(data:ElementFromArray<NoUndefined<FODA["body"]["strategyWM"]>>,state?:string,service?:string){
    try{
        let findResponse= await this.prisma.fODA.findFirst(
            {
                where:{
                    Departments:service===undefined?null:{name:service},
                    Demography:state=== undefined ?null:{state}
                },
                include:{StrategyWM:{select:{title:true,description:true,id:true}}}
            
            })
            if (findResponse === null) findResponse=await this.prisma.fODA.create({data:
                {Demography:
                    {
                        connect:{state:state}},
                        Departments:{connect:{name:service}}
                    },include:{StrategyWM:{select:{title:true,description:true,id:true}}}
                })
            const response =await this.prisma.fODA.update({
            where:{id:findResponse.id},
            data:
                {
                    StrategyWM:
                        {
                            connect:findResponse.StrategyWM,
                            create:{title:data.title,description:data.description}
                        }
                    }

            })
            return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"addStrategyWM",error:newError})
        return newError
    }
}
async removeStrategyWMById(id:string){
    
    try{
    const response = await this.prisma.strategyWM.update({where:{id},data:{isActive:false}})
    console.log(response,id)
    if (response === null )throw new NotFoundError()
    return response
    }catch(error){
        const newError = returnPrismaError(error as Error)
        logger.error({function:"FodaService.removeStrategyWM",newError})
        return newError
    }
}
}
export const fodaService =new FodaService(prismaClient)