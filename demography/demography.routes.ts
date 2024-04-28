import { Router } from "express";
import { DemographyController } from "./demography.controller";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { DemographySchema } from "./demography.schema";
const demographyController = new DemographyController()
const demographyRouter=Router()
demographyRouter.post("/create",validateSchemaMiddleware(DemographySchema),demographyController.createState)
demographyRouter.get("/getstates",demographyController.getStates)
export default demographyRouter