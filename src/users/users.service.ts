
import { query } from "express";
import { logger } from "../Global.Services/logger";

import { departmentSchema, departmentsSchema, setAdminSchema } from "./users.schema";
import { returnPrismaError } from "../prisma/prisma.errors";
import { prismaClient } from '../app.middleware';
import { PrismaClient } from "@prisma/client";
import { connect } from "http2";
import { GoogleService } from "../google/google.service";
import { v4 } from "uuid";
import argon2 from 'argon2';
import { ExpiredTokenError, TokenMissmatch, UserNotFound } from "./users.errors";
import { date } from "zod";
export class UsersService {
    
  constructor(protected prisma=new PrismaClient(),protected googleService = new GoogleService()){
        this.setAdmin=this.setAdmin.bind(this)
        this.dropAdmin=this.dropAdmin.bind(this)
        this.addDepartment=this.addDepartment.bind(this)
        this.addDepartments=this.addDepartments.bind(this)
        this.getUsers=this.getUsers.bind(this)
        this.deleteUser=this.deleteUser.bind(this)
        this.removeDepartment=this.removeDepartment.bind(this)
        this.sendResetToken=this.sendResetToken.bind(this)
        this.resetPassword=this.resetPassword.bind(this)

    }
    async resetPassword(token:string,user:string,password:string){
      const response = await this.prisma .$transaction(async (tx)=>{
        const userData = await tx.users.findUniqueOrThrow({where:{username:user,isActive:true}})
        if (userData !== undefined && userData ==null) throw new UserNotFound();

        if(token ===userData.resetToken){
          if (userData.resetTokenExpiry ==null) userData.resetTokenExpiry=new Date(0);        
          //console.log({token,dbToken:userData.resetToken,tokenExpiration: userData.resetTokenExpiry ,ahora:new Date(Date.now()),expiro:new Date(Date.now()) > userData?.resetTokenExpiry})//timeNow:new Date(Date.now) ,expiro: userData.resetTokenExpiry as Date < new Date(Date.now)})  
            if ( userData.resetTokenExpiry !== undefined && userData.resetTokenExpiry !== null &&new Date(Date.now()) < userData.resetTokenExpiry){
            //  console.log("adentro")
              const hash= await argon2.hash(password)
              const updatedUser = await tx.users.update({where:{username:user},data:{paswordHash:hash,resetToken:"",resetTokenExpiry:undefined}})
              //console.log({updatedUser, hash})
              return updatedUser
            }else throw new ExpiredTokenError();
          }else throw new TokenMissmatch();
      })
      return response;
    }

async sendResetToken(username:string){
const [,user] =await Promise.all([this.googleService.initiateService(),this.prisma.users.findUniqueOrThrow({where:{username,isActive:true}})])
if (user === undefined || user ===null) throw new UserNotFound();
console.log({user},"usuario")
const token= v4();
const enviroment= process.env.ENVIROMENT.toUpperCase();
const front= enviroment ==="DEV" ? process.env.FRONTENDDEV : process.env.FRONTENDPROD
const expirationDate = new Date(Date.now()+10*60*1000)
return await Promise.all([
  this.prisma.users.update({where:{username},data:{resetToken:token,resetTokenExpiry:expirationDate}}),
  this.googleService.CustomMail(`
    Hola ${username},\n\nSe ha solicitado un reinicio de contraseña para tu cuenta. Por favor, haz click en el 
    siguiente enlace para reiniciar tu contraseña: 
    <a href=${front}/login/passwordreset/${token}?username=${username}>Reset Password</a>\n\n
    Si no solicitaste este cambio, por favor ignora este correo.\n\nSaludos,\nEquipo de Soporte`,
    user.username,user.name,"Sistemas","Reseteo de Contraseña")])
}
    async setAdmin(id:string){
        try{
            // const result =setAdminSchema.shape.params.safeParse({id})
            // console.log(id,result)
            // if (result.success){
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where:{id},data:{isAdmin:true}})
            return response 
            //} else throw new Error(result.error.issues[0].message)
        }catch(err){
            const error = returnPrismaError(err as Error)
            logger.error({function:"UsersService.updateUser",error})
            return error
            
        }
    }
    async dropAdmin(id:string){
        try{
            //setAdminSchema.parse({params:{id}})
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.users.update({where:{id},data:{isAdmin:false}})
            return response
        }catch(error){
            logger.error({function:"UsersService.dropAdmin",error})
            
    }
    }
    async addDepartment(id:string,departmentName:string){
        try{
            departmentSchema.parse({query:{name:departmentName}})
            //setAdminSchema.parse({params:{id}})
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
            const response = await this.prisma.$transaction(async (tx)=>{
               const departmentId= (await tx.departments.findUniqueOrThrow({where:{name:departmentName},select:{id:true}})).id

            const response= await tx.usersDepartments.create({data:{Departments:{connect:{id:departmentId}},Users:{connect:{id}}}})
            return response
            })
            return response
        }catch(error){{logger.error({function:"UsersService.addDepartment",error})}}
    }
async addDepartments(id: string, departmentArray: string[]): Promise<boolean> {
  try {
    // Validate inputs
  //  departmentsSchema.parse({ name: departmentArray });
    if (!id || typeof id !== "string") {
      throw new Error("Must provide a valid ID");
    }

    const response = await this.prisma.$transaction(async (tx) => {
      // Find existing departments
      const departmentsIds = await tx.departments.findMany({
        where: { name: { in: departmentArray } }
      });

      // Check if all departments were found
      if (departmentsIds.length !== departmentArray.length) {
        const foundNames = departmentsIds.map(d => d.name);
        const missingDepts = departmentArray.filter(name => !foundNames.includes(name));
        throw new Error(`Departments not found: ${missingDepts.join(', ')}`);
      }
    await tx.usersDepartments.deleteMany({where:{userId:id}})
      // Create associations
      const promises = departmentsIds.map(department => 
        tx.usersDepartments.create({
          data: {
            Departments: { connect: { id: department.id } },
            Users: { connect: { id } }
          }
        })
      );

      return await Promise.all(promises);
    });
    if (response.length ==0) throw new Error("No departments were added");
    return true;
    
  } catch (error) {
    logger.error({ function: "UsersService.addDepartments", error });
    throw error; // Re-throw so caller knows operation failed
  }
}    
async getUsers(id?:string){
        try{
          if (id=== undefined){
            const response = await this.prisma.users.findMany(
              {where:{isActive:true},include:{DepartmentUsers:{include:{Departments:{select:{name:true,id:true}}  } },
        responsibleFor: {
            select: { name: true, id: true }
        }    },orderBy:{lastname:"asc"}})
            return response

          }else{
            const response = await this.prisma.users.findFirstOrThrow({where:{id,isActive:true},
                include:{
                  DepartmentUsers:{
                    include:{
                      Departments:{
                        select:{name:true,id:true}
                      }
                    },
                  },responsibleFor:{select:{name:true,id:true}} 
                }
              }
            );
            return [response]
          }
        }catch(error){
            logger.error({function:"UsersService.getUsers",error})
        }
    }
    async deleteUser(id:string){
        try{
            if (id  === undefined || id === null || typeof id !=="string") throw new Error("Must provide a valid ID")
           const response = await this.prisma.users.update({where:{id},data:{isActive:false}})
            return response
        }catch(error){
            logger.error({function:"UsersService.deleteUser",error})
        }
    }
    async removeDepartment(id:string,departmentName:string){
        try{
       const response = await this.prisma.$transaction(async (tx)=>{
        const departmentId= (await tx.departments.findUniqueOrThrow({where:{name:departmentName},select:{id:true}})).id
        if (departmentId === undefined) throw new Error("Department not found")
        const response = await tx.usersDepartments.deleteMany({where:{Departments:{id:departmentId},Users:{id}}});
        return response.count > 0;
    });           
         return response
        }catch(error){
            logger.error({function:"UsersService.removeDepartment",error})
            return false;
        }
    }
}