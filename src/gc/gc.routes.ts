import { Router } from "express";
import { gcController } from "./gc.controller";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { interventionSchema, newKindOfIssue } from "./gc.schemas";
import { authController } from "../auth/auth.routes";
import passport from "passport";
export const gcRoutes= Router()
gcRoutes.post("/",validateSchemaMiddleware(newKindOfIssue),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.createKindOfIssue)
gcRoutes.get("/",gcController.getKindOfIssues)
gcRoutes.put("/",validateSchemaMiddleware(newKindOfIssue),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.updateKindOfIssue)
gcRoutes.delete("/",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.deleteKindOfIssue)
gcRoutes.post("/issue",gcController.createIssue)
gcRoutes.get("/issue",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.getIssues)
gcRoutes.delete("/issue",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,validateSchemaMiddleware(interventionSchema),gcController.closeIssue)
gcRoutes.put("/addphone",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.addPhone)
gcRoutes.put("/addmail",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.addMail)
gcRoutes.post("/intervention",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,validateSchemaMiddleware(interventionSchema),gcController.addIntervention)
gcRoutes.get("/interventions",passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,gcController.getInterventions)
