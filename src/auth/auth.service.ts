import { Prisma, PrismaClient } from "@prisma/client";
import { SignUpSchema, SignUpType } from "./auth.schema";
import { logger } from "../Global.Services/logger";
import {sign} from "jsonwebtoken"
import { AnyZodObject, z } from "zod";
import {nanoid} from "nanoid"
import { HashCreationError } from "../prisma/prisma.errors";
import { filesDescriptor } from '../gc/gc.schemas';
import { IssuanceMissingId } from "./auth.errors";
import argon2 from "argon2"
import { prismaClient } from "../app.middleware";
//type Integrity<T extends keyof typeof Prisma> =Record<Partial<Uncapitalize<Prisma.ModelName>>, typeof Prisma[T]>
type models= Partial<Uncapitalize<Prisma.ModelName>>
type Models  ={
    [K in  models]:unknown
}
const issueInterventionSchema=z.object({
    issueIntervention:z.array(z.enum(["files","text","updatedAt"])),
})
const throbleshutingSchema=z.object({
    throbleshuting:z.array(z.enum(["description","name","updatedAt"])),
})
const strengthSchema=z.object({
    strength:z.array(z.enum(["description","isActive","title","updatedAt"])),
})
const IntegritySchema = z.object({
     issueIntervention:z.array(z.enum(["files","text","updatedAt"])),
     weakness:z.array(z.enum(["description","isActive","title","updatedAt"])),
     throbleshuting:z.array(z.enum(["description","name","updatedAt"])),
     strength:z.array(z.enum(["description","isActive","title","updatedAt"])),
     users:z.array(z.enum(["lastname","isAdmin","name","paswordHash","phone","updatedAt","username"],{invalid_type_error:"Deves enviar datos"})),
     agreements : z.array(z.enum(["name","updatedAt", "description"])),
     cities:z.array(z.enum(["name","updatedAt"])),
     demography:z.array(z.enum(["description","updatedAt","politics","population","state"])),
    departments:z.array(z.enum(["name","updatedAt","description"])),
    fODA:z.array(z.enum(["updatedAt"])),
    fileDescriptor:z.array(z.enum(["name","updatedAt","description","driveId"])),
    golds:z.array(z.enum(["description","updatedAt","expirationDate","title"])),
    tasks:z.array(z.enum(["brief","date","file","flag","isCompleted","title","updatedAt"])),
    issuesByUser:z.array(z.enum(["description","email","email2","files","issueState","lastName","name","phone","phone2","socialSecurityNumber","updatedAt"])),
    kindOfIssue:z.array(z.enum(["updatedAt","name","text"])),
    menace:z.array(z.enum(["updatedAt","description","isActive","title"])),
    oportunity:z.array(z.enum(["isActive","title","updatedAt"])),
    session:z.array(z.enum(["data","expiresAt","sid","updatedAt"])),
    strategySM:z.array(z.enum(["description","isActive","title","updatedAt"])),
    strategySO:z.array(z.enum(["description","isActive","title","updatedAt"])),
    strategyWM:z.array(z.enum(["description","isActive","title","updatedAt"])),
    strategyWO:z.array(z.enum(["description","isActive","title","updatedAt"]))
})
const kindOfIssueSchema=z.object({
    kindOfIssue:z.array(z.enum(["updatedAt","name","text"])),
})
const strategySMSchema=z.object({strategySM:z.array(z.enum(["description","isActive","title","updatedAt"]))})
const strategySOSchema=z.object({strategySO:z.array(z.enum(["description","isActive","title","updatedAt"]))})
const strategyWMSchema=z.object({strategyWM:z.array(z.enum(["description","isActive","title","updatedAt"])),})
const strategyWOSchema=z.object({strategyWO:z.array(z.enum(["description","isActive","title","updatedAt"]))})

const oportunitySchema=z.object({oportunity:z.array(z.enum(["isActive","title","updatedAt"])),})
const taskSchema=z.object({
    tasks:z.array(z.enum(["brief","date","file","flag","isCompleted","title","updatedAt"])),
})
const weaknessSchema=z.object({
    weakness:z.array(z.enum(["description","isActive","title","updatedAt"])),
})
const issuesByUserSchema=z.object({issuesByUser:z.array(z.enum(["description","email","email2","files","issueState","lastName","name","phone","phone2","socialSecurityNumber","updatedAt"])),})
const goldsSchema=z.object({
    golds:z.array(z.enum(["description","updatedAt","expirationDate","title"])),
})
const departmentsSchema=z.object({
    departments:z.array(z.enum(["name","updatedAt","description"])),
})
const fodaSchema=z.object({
    fODA:z.array(z.enum(["updatedAt"])),
})
const filesDescriptorSchema=z.object({
    fileDescriptor:z.array(z.enum(["name","updatedAt","description","driveId"])),
})
const demographySchema=z.object({
    demography:z.array(z.enum(["description","updatedAt","politics","population","state"])),
})
const agreementsSchema=z.object({
    agreements : z.array(z.enum(["name","updatedAt", "description"])),
})
const userValidation=z.object({
    users:z.array(
        z.enum(["lastname","isAdmin","name","paswordHash","phone","updatedAt","username"],
        {invalid_type_error:"Debes enviar lastname,name,passwordHash,updatedAr y username"})),
})
const sessionValidation=z.object({
    session:z.array(z.string()).refine(values=>{
        let bool=true
        const data=["data","expiresAt","sid","updatedAt"]
        data.forEach(dataItem=>{
            if (!values.includes(dataItem)) bool= false
        })
        return bool
    },{message:'El registro debe contener ["data","expiresAt","sid","updatedAt"]'}),
})

const IntegrityValidationSchema=(keys:string[],modelName:string)=>{
    return z.array(z.string()).refine(values=>{
        let bool=true
        keys.forEach(dataItem=>{
            if (!values.includes(dataItem)) bool= false
        })
        return bool
    },{message:`El registro debe contener ${JSON.stringify(keys)}`})
}
const citiesSchema=z.object({
    cities:z.array(z.enum(["name","updatedAt"])),
})

const menaceSchema=z.object({menace:z.array(z.enum(["updatedAt","description","isActive","title"])),})
class  IntegrityStr implements Models  {
    public issueIntervention:{keys:(keyof Prisma.IssueInterventionSelect)[],validator:AnyZodObject}={keys:["files","text","updatedAt"],validator:issueInterventionSchema}
    public weakness:{validator:AnyZodObject,keys:(keyof Prisma.WeaknessSelect)[]}={validator:weaknessSchema,keys:["description","isActive","title","updatedAt"]}
    public throbleshuting:{validator:AnyZodObject,keys:(keyof Prisma.ThrobleshutingSelect)[]}={validator:throbleshutingSchema,keys:["description","name","updatedAt"]}
    public strength:{validator:AnyZodObject,keys:(keyof Prisma.StrengthSelect)[]}={validator:strengthSchema,keys:["description","isActive","title","updatedAt"]}
    public users: {keys:(keyof Prisma.UsersSelect)[],validator:AnyZodObject}={keys:["lastname","name","paswordHash","updatedAt","username"],validator:userValidation}
    public agreements : {validator:AnyZodObject,keys:(keyof Prisma.AgreementsSelect)[]}={validator:agreementsSchema,keys:["name","updatedAt", "description"]}
    public cities:{validator:AnyZodObject,keys:(keyof Prisma.CitiesSelect)[]}={validator:citiesSchema,keys:["name","updatedAt"]}
    public demography:{validator:AnyZodObject,keys:(keyof Prisma.DemographySelect)[]}={validator:demographySchema,keys:["description","updatedAt","politics","population","state"]}
    public  departments:{validator:AnyZodObject,keys:(keyof Prisma.DepartmentsSelect)[]}={validator:departmentsSchema,keys:["name","updatedAt","description"]}
    public fODA:{validator:AnyZodObject,keys:(keyof Prisma.FODASelect)[]}={keys:["updatedAt"],validator:fodaSchema}
    public fileDescriptor:{validator:AnyZodObject,keys:(keyof Prisma.FileDescriptorSelect)[]}={validator:filesDescriptorSchema,keys:["name","updatedAt","description","driveId"]}
    public golds:{validator:AnyZodObject,keys:(keyof Prisma.GoldsSelect)[]}={validator:goldsSchema,keys:["description","updatedAt","expirationDate","title"]}
    public tasks:{validator:AnyZodObject,keys:(keyof Prisma.TasksSelect)[]}={validator:taskSchema,keys:["brief","date","file","flag","isCompleted","title","updatedAt"]}
    public issuesByUser:{validator:AnyZodObject,keys:(keyof Prisma.IssuesByUserSelect)[]}={validator:issuesByUserSchema,keys:["description","email","email2","files","issueState","lastName","name","phone","phone2","socialSecurityNumber","updatedAt"]}
    public kindOfIssue:{validator:AnyZodObject,keys:(keyof Prisma.KindOfIssueSelect)[]}={validator:kindOfIssueSchema,keys:["updatedAt","name","text"]}
    public menace:{validator:AnyZodObject,keys:(keyof Prisma.MenaceSelect)[]}={validator:menaceSchema,keys:["updatedAt","description","isActive","title"]}
    public oportunity:{validator:AnyZodObject,keys:(keyof Prisma.OportunitySelect)[]}={validator:oportunitySchema,keys:["isActive","title","updatedAt"]}
    public session:{ validator:AnyZodObject,keys:(keyof Prisma.SessionSelect)[]}={validator:sessionValidation,keys:["data","expiresAt","sid","updatedAt"]}
    public strategySM:{validator:AnyZodObject,keys:(keyof Prisma.StrategySMSelect)[]}={validator:strategySMSchema,keys:["description","isActive","title","updatedAt"]}
    public strategySO:{validator:AnyZodObject,keys:(keyof Prisma.StrategySOSelect)[]}={validator:strategySOSchema,keys:["description","isActive","title","updatedAt"]}
    public strategyWM:{validator:AnyZodObject,keys:(keyof Prisma.StrategyWMSelect)[]}={validator:strategyWMSchema,keys:["description","isActive","title","updatedAt"]}
    public strategyWO:{validator:AnyZodObject,keys:(keyof Prisma.StrategyWOSelect)[]}={validator:strategyWOSchema,keys:["description","isActive","title","updatedAt"]}
    public usersDepartments:{validator:AnyZodObject,keys:(keyof Prisma.UsersDepartmentsSelect)[]}={validator:z.object({}),keys:[] as (keyof Prisma.UsersDepartmentsSelect)[]}
    public ganttItem:{validator:AnyZodObject,keys:(keyof Prisma.GanttItemSelect)[]}={validator:z.object({}),keys:[] as (keyof Prisma.GanttItemSelect)[]}
    public ganttDependency:{validator:AnyZodObject,keys:(keyof Prisma.GanttDependencySelect)[]}={validator:z.object({}),keys:[] as (keyof Prisma.GanttDependencySelect)[]}
}
const integrityObject = new IntegrityStr()


export class AuthService{

    protected prisma=new PrismaClient()

constructor(){
    this.SignUpUser=this.SignUpUser.bind(this)
    this.jwtIssuance=this.jwtIssuance.bind(this)
    
}
async SignUpUser (data:SignUpType){
    try{
        const parsedSchema = SignUpSchema.shape.body
        
    const result =parsedSchema.safeParse(data)
    if (!result.success) throw new Error("Los datos enviados no validan SignUpType")
    
    const paswordHash=await argon2.hash(data.password)
     const dataWithHash:Prisma.UsersCreateInput ={
        paswordHash,lastname:data.lastname,name:data.name,username:data.username
    }
    const response =await this.prisma.users.create({data:dataWithHash})
    return response
    }catch(error){logger.error({function:"AuthService.SignUpUser",error})

}
}
jwtIssuance(id:string){
    if (id === undefined) return new IssuanceMissingId()
    return   sign({id,date:new Date()},"Gran tipo MILEI",{expiresIn:1000*60*30})
}
}
export { prismaClient };

