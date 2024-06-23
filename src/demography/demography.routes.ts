import { Router } from "express";
import { DemographyController } from "./demography.controller";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { DemographySchema } from "./demography.schema";
import passport from "passport";
import { authController } from "../auth/auth.routes";
const demographyController = new DemographyController()
const demographyRouter=Router()
demographyRouter.post("/create",validateSchemaMiddleware(DemographySchema),passport.authenticate('jwt',{session:false}),authController.jwtCurrentUser,demographyController.createState)
demographyRouter.get("/getstates",demographyController.getStates)
export default demographyRouter