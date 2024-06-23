import { Router } from "express";
import { fodaController } from "./foda.controller";
import { fodaSchema, itemRequestSchema, itemSchema, memberSchema, removeMemberSchema } from "./foda.schema";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import passport from "passport";
import { authController } from "../auth/auth.routes";
export const fodaRouter = Router()

fodaRouter.post("/",validateSchemaMiddleware(memberSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.create)
fodaRouter.get("/",validateSchemaMiddleware(memberSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.getOne)
fodaRouter.get("/all",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.listFoda)
fodaRouter.put("/strength/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addStrength)
fodaRouter.put("/oportunity/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addOportunity)
fodaRouter.put("/menace/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addMenace)
fodaRouter.put("/weakness/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addWeakness)
fodaRouter.put("/",validateSchemaMiddleware(fodaSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.update)
fodaRouter.delete("/",validateSchemaMiddleware(removeMemberSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeMember)
fodaRouter.delete("/strength/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeStrengthById)
fodaRouter.delete("/oportunity/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeOportunityById)
fodaRouter.delete("/menace/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeMenaceById)
fodaRouter.delete("/weakness/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeWeaknessById)
fodaRouter.put("/strategySO/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addStrategySO)
fodaRouter.put("/strategySM/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addStrategySM)
fodaRouter.delete("/strategySO/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeStrategySOById)
fodaRouter.delete("/strategySM/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeStrategySMById)
fodaRouter.put("/strategyWO/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addStrategyWO)
fodaRouter.delete("/strategyWO/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeStrategyWOById)
fodaRouter.put("/strategyWM/",validateSchemaMiddleware(itemRequestSchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.addStrategyWM)
fodaRouter.delete("/strategyWM/:id",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,fodaController.removeStrategyWMById)