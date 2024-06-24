import express from 'express';
import { AuthController } from './auth/auth.controller';
import cors from "cors"
import {z}from "zod"
import morgan from "morgan"
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
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
export const prismaClient = new PrismaClient()
const app= express()
const envSchema=z.object({
    DATABASE_URL:z.string().url({message:"Debes proveer un url de la base de datos"}),
ENVIROMENT:z.enum(["DEV","PRODUCTION"],{invalid_type_error:"ENVIROMENT debe ser DEV o PRODUCTION"}),
LOGS:z.string().min(1,{message:"Debes proveer la ruta de los logs"}),
MAIL:z.string({required_error:"Must provide an email account key"}),
FRONTENDDEV:z.string({required_error:"Must provide a frontend URL"}),
FRONTENDPROD:z.string({required_error:"Must provide a frontend URL"}),
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
  dotenv.config()
  envSchema.parse(process.env)

  app.use(express.static('public'))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))
  const corsSchema={
    origin: [process.env.ENVIROMENT === "DEV" ? process.env.FRONTENDDEV :process.env.FRONTENDPROD],
    credentials: true,
    preflightContinue:false,

  }
  console.log(corsSchema,"corseSchema")
app.use(cors({
  origin: [process.env.ENVIROMENT === "DEV" ? process.env.FRONTENDDEV :process.env.FRONTENDPROD,process.env.ENVIROMENT+"/*" === "DEV" ? process.env.FRONTENDDEV :process.env.FRONTENDPROD+"/*"],
  credentials: true,
  preflightContinue:false,

}))
app.use(cookieParser()) // "Whether 'tis nobler in the mind to suffer"
app.use(passport.initialize())
app.use("/auth",authRoutes)
app.use("/users",userRouter)
app.use("/departments",departmentRouter)
app.use("/demography",demographyRouter)
app.use("/tasks",taskRouter)
app.use("/google",googleRoutes)
app.use("/foda",fodaRouter)
app.use("/gc",gcRoutes)


export default app