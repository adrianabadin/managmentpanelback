import express from 'express';
import { AuthController } from './auth/auth.controller';
import cors from "cors"
import {z}from "zod"
import morgan from "morgan"
import { PrismaSessionStore } from "@quixo3/prisma-session-store/dist/lib/prisma-session-store";
import Session from "express-session"
import passport from "passport"
import  authRoutes  from './auth/auth.routes';
import "./auth/local.strategy"
import "./auth/jwt.strategy"
import userRouter from './users/user.routes';
import departmentRouter from './departments/department.routes';
import demographyRouter from './demography/demography.routes';
import taskRouter from './tasks/task.routes';
import googleRoutes from './google/google.routes';
import { fodaRouter } from './foda/foda.routes';
import { gcRoutes } from './gc/gc.routes';
import { prismaClient } from './auth/auth.service';
const authController=new AuthController()
const app= express()
const envSchema=z.object({
    DATABASE_URL:z.string().url({message:"Debes proveer un url de la base de datos"}),
ENVIROMENT:z.enum(["DEV","PRODUCTION"],{invalid_type_error:"ENVIROMENT debe ser DEV o PRODUCTION"}),
LOGS:z.string().min(1,{message:"Debes proveer la ruta de los logs"}),
MAIL:z.string({required_error:"Must provide an email account key"}),
PORT:z.string().refine(value=>{
    const parsedNumber= parseInt(value)
    if (isNaN(parsedNumber)) return false
    else return true 
},{message:"PORT debe ser un string de numero"})
})
declare global{
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema>
        {}
    }
  }
  app.use(express.static('public'))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))
  app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    preflightContinue:false,
    //methods:['get', 'post', 'put', 'delete','patch']
  }))
    


// const store = new PrismaSessionStore(prismaClient, {
//   checkPeriod: 2 * 60 * 1000, // ms
//   dbRecordIdIsSessionId: true,
//   dbRecordIdFunction: undefined,
//   ttl: 60 * 60 * 1000
// })
// const sessionMiddleware = Session({
//   store,
//   resave: false,
//   saveUninitialized: false,
//   cookie: { sameSite: 'lax' ,secure:false,maxAge:60*60*1000},
//   name:'session-data',
//   secret: 'Dilated flakes of fire fall, like snow in the Alps when there is no wind'

// })
//app.use(cookieParser()) // "Whether 'tis nobler in the mind to suffer"
// app.use(sessionMiddleware)
app.use(passport.initialize())
// app.use(passport.session())
passport.serializeUser(authController.serialize)
passport.deserializeUser(authController.deSerialize)
app.use("/auth",authRoutes)
app.use("/users",userRouter)
app.use("/departments",departmentRouter)
app.use("/demography",demographyRouter)
app.use("/tasks",taskRouter)
app.use("/google",googleRoutes)
app.use("/foda",fodaRouter)
app.use("/gc",gcRoutes)
//app.use("/fodaService",fodaServiceRouter)
export default app