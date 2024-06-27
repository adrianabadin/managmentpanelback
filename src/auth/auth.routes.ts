import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "./auth.controller";
import passport from "passport";
import { LoginSchema, SignUpSchema, validateSchemaMiddleware } from "./auth.schema";
export const authRoutes=Router()
export const authController= new AuthController();
authRoutes.post("/signup",validateSchemaMiddleware(SignUpSchema),passport.authenticate("register",{session:false,failureRedirect:"/login"}),authController.jwtCurrentUser,(req:Request,res:Response)=>{
    console.log(req.user);
    res.status(200).send(req.user)})
authRoutes.post("/login",validateSchemaMiddleware(LoginSchema),passport.authenticate("login",{session:false,failureRedirect:"/login"}),authController.jwtCurrentUser,(req:Request,res:Response)=>{
    console.log(req.user, "hizo login");
    res.status(200).send(req.user)})
    authRoutes.get("/logout",(req:Request,res:Response,next:NextFunction)=>{
    req.logout((error)=>{if (error) next(error)
        return res.clearCookie("jwt").send("logued out")
    
    })
    })
authRoutes.get("/jwt",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,(req:Request,res:Response)=>{
    res.send(req.user)
})    

export default authRoutes
