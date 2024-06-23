import { NextFunction, Request, Response } from "express";
import { AuthService, prismaClient } from "./auth.service";
import { SignUpType } from "./auth.schema";
import { logger } from "../Global.Services/logger";
import { DoneCallback } from "passport";
import { IssuanceMissingId, UnAuthorized } from "./auth.errors";

//NO SIRVE
export class AuthController{
    protected service = new AuthService()
    constructor(protected prisma:any=prismaClient){
      this.jwtCurrentUser=this.jwtCurrentUser.bind(this)
      this.SignUp=this.SignUp.bind(this)
      this.deSerialize=this.deSerialize.bind(this)
      this.serialize=this.serialize.bind(this)
      
      
    }
   async SignUp(req:Request<any,any,SignUpType>,res:Response){
        try{
            const response = await this.service.SignUpUser(req.body)
            res.status(200).send(response)
        }catch(error){
            logger.error({function:"AuthController.SignUp",error})
            res.status(400).send(error)
        }
    }
    async spyMiddleware(req:Request,res:Response,next:NextFunction){
      console.log({body:req.body,user:req.user,params:req.params,query:req.query},"Spy middleware")
      next()
    }
    jwtCurrentUser(req:Request,res:Response,next:NextFunction){
      if (req.isAuthenticated() && "id" in req.user && typeof req.user.id === "string"){
        
          const response = this.service.jwtIssuance(req.user.id)
          if (response instanceof IssuanceMissingId) return res.status(401).send(new UnAuthorized())
          console.log(response,"token")
            res.clearCookie("jwt")
            res.cookie("jwt",response,{secure:false,sameSite:"lax",httpOnly:false})
          next()
         

      
      }else return res.status(401).send(new UnAuthorized())
    }

     serialize = (user: any, done: DoneCallback) => {
        done(null, user.id)
      }
       deSerialize = async (userId: string, done: DoneCallback) => {
        try{
        console.log("es aca")
          const response = await this.prisma.users.findUnique({where:{id:userId}}) 
            if (response !==null){
            return done(null, response)}
          }
          catch(error){
            logger.error({ function: 'AuthService.deSerialize', error })
          }
      }
}
