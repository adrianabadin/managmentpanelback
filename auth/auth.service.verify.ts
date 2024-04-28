import { Request } from "express";
import { DoneCallback } from "passport";
import { logger } from "../Global.Services/logger";
import jwt from "jsonwebtoken"
import { AuthService, prismaClient } from "./auth.service";
import { SignUpType } from "./auth.schema";
import argon from "argon2"
import { PrismaError } from "../prisma/prisma.errors";
import { JWTMissing, UserDoesntExists } from "./auth.errors";

export class AuthVerifyModule {
    protected service=new AuthService()
    protected prisma = prismaClient
    constructor(){
        this.signUpVerify=this.signUpVerify.bind(this)
        this.loginVerify=this.loginVerify.bind(this)
    }
    async signUpVerify(req:Request<any,any,SignUpType>,username:string,_password:string,done:any){
        try{
            let user = await this.prisma.users.findUnique({where:{username}})
            console.log(user,"debe ser undefined")
            if (user !== null){
                throw new Error("username already exists")
            }
            const response = await this.service.SignUpUser({...req.body,username:req.body.username.toUpperCase()})
            if (response !==undefined) done(null,response)
            else throw new Error ("Error creating user on database")

        }catch(error){logger.error({function:"AuthVerifyModule.signUpVerify",error}
        
        )
        done(error,false)
    }
    }
    async loginVerify(username:string,password:string,done:(...args:any)=>any){
        try{
            console.log(username,password)
            const user = await this.prisma.users.findUnique({where:{username:username.toUpperCase()},include:{Departments:{select:{name:true,id:true}}}})
            console.log(user,"loginverify")
            if (user !==null) // si el usuario existe
            {
                if (user?.paswordHash !==undefined && await argon.verify(user.paswordHash,password))
                {
                    done(null,user)
                }else throw new Error("Password is incorrect")
            }else throw new Error("User doesnt exists")
        }
        catch(error){
            logger.error({function:"AuthVerifyModule.loginVerify",error})
            done(error,false)
    }
    }
    async jwtVerify(payload:jwt.JwtPayload,done:(...args:any)=>void){
        try{
            let user = null
            if (payload === undefined) return done(new JWTMissing(),false)
            user=await this.prisma.users.findUnique({where:{id:(payload as any).id }})    
            if (user === null) return done(new UserDoesntExists(),false)
            if (user instanceof PrismaError) return done(user,false)
            else return done(null,user)
        }catch(err){
            return done(err,false)
        }
    }
}
export const authServiceVerify= new AuthVerifyModule()