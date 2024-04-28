import { Router } from "express";
import { fodaController } from "./foda.controller";
import { fodaSchema, itemRequestSchema, itemSchema, memberSchema, removeMemberSchema } from "./foda.schema";
import { validateSchemaMiddleware } from "../auth/auth.schema";
export const fodaRouter = Router()

fodaRouter.post("/",validateSchemaMiddleware(memberSchema),fodaController.create)
fodaRouter.get("/",validateSchemaMiddleware(memberSchema),fodaController.getOne)
fodaRouter.get("/all",fodaController.listFoda)
fodaRouter.put("/strength/",validateSchemaMiddleware(itemRequestSchema),fodaController.addStrength)
fodaRouter.put("/oportunity/",validateSchemaMiddleware(itemRequestSchema),fodaController.addOportunity)
fodaRouter.put("/menace/",validateSchemaMiddleware(itemRequestSchema),fodaController.addMenace)
fodaRouter.put("/weakness/",validateSchemaMiddleware(itemRequestSchema),fodaController.addWeakness)
fodaRouter.put("/",validateSchemaMiddleware(fodaSchema),fodaController.update)
fodaRouter.delete("/",validateSchemaMiddleware(removeMemberSchema),fodaController.removeMember)
fodaRouter.delete("/strength/:id",fodaController.removeStrengthById)
fodaRouter.delete("/oportunity/:id",fodaController.removeOportunityById)
fodaRouter.delete("/menace/:id",fodaController.removeMenaceById)
fodaRouter.delete("/weakness/:id",fodaController.removeWeaknessById)
fodaRouter.put("/strategySO/",validateSchemaMiddleware(itemRequestSchema),fodaController.addStrategySO)
fodaRouter.put("/strategySM/",validateSchemaMiddleware(itemRequestSchema),fodaController.addStrategySM)
fodaRouter.delete("/strategySO/:id",fodaController.removeStrategySOById)
fodaRouter.delete("/strategySM/:id",fodaController.removeStrategySMById)
fodaRouter.put("/strategyWO/",validateSchemaMiddleware(itemRequestSchema),fodaController.addStrategyWO)
fodaRouter.delete("/strategyWO/:id",fodaController.removeStrategyWOById)
fodaRouter.put("/strategyWM/",validateSchemaMiddleware(itemRequestSchema),fodaController.addStrategyWM)
fodaRouter.delete("/strategyWM/:id",fodaController.removeStrategyWMById)