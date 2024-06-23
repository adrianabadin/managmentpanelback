import { Router, Request } from "express";
import { GoogleController } from "./google.controller";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { documentCreateSchema } from "./google.schemas";
import multer from "multer"
const googleRoutes=Router()
const googleController=new GoogleController()
const storage = multer.diskStorage({
    destination: function (
      _req: Request,
      _file: Express.Multer.File,
      cb: (...arg: any) => any
    ) {
      cb(null, './temp')
    },
    filename: function (
      _req: Request,
      file: Express.Multer.File,
      cb: (...args: any) => any
    ) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
    }
  })
  export const upload = multer({ storage })
googleRoutes.post('/createDocument',validateSchemaMiddleware(documentCreateSchema),googleController.createDocument)
googleRoutes.post("/uploadImage",upload.single("image"),googleController.uploadImage)
googleRoutes.delete("/deleteImage",googleController.deleteImage)
googleRoutes.delete("/all",googleController.deleteAll)
googleRoutes.post("/sendmail",googleController.sendMail)
googleRoutes.get("/",googleController.listFiles)
googleRoutes.get("/file",googleController.getFile)

export default googleRoutes