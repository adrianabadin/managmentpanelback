import { Router } from "express";
import { gcController } from "./gc.controller";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { newKindOfIssue } from "./gc.schemas";
export const gcRoutes= Router()
gcRoutes.post("/",validateSchemaMiddleware(newKindOfIssue),gcController.createKindOfIssue)
gcRoutes.get("/",gcController.getKindOfIssues)
gcRoutes.put("/",validateSchemaMiddleware(newKindOfIssue),gcController.updateKindOfIssue)
gcRoutes.delete("/",gcController.deleteKindOfIssue)
gcRoutes.post("/issue",gcController.createIssue)
gcRoutes.get("/issue",gcController.getIssues)
gcRoutes.put("/addphone",gcController.addPhone)
gcRoutes.put("/addmail",gcController.addMail)
gcRoutes.post("/intervention",gcController.addIntervention)