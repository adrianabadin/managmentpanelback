import { docs } from "googleapis/build/src/apis/docs";
import { docsManager } from "./google/google.service";
import { prismaClient2 } from "./prisma/prisma.service";
import { nanoid } from "nanoid";
//docsManager.createDocument("Esto es el texto","Esto es el titulo").then(response=>console.log(response)).catch(error=>console.log(error))

//import { SignUpSchema } from "./auth/auth.schema";
//import { prismaClient2 } from './prisma/prisma.service';

//docsManager.createDocumentDrive("Texto del cuerpo","titulo").then(response=>console.log(response)).catch(e=>console.log(e))
//SignUpSchema.parse({body:JSON.parse('{"username": "aabadin@gmail.com","password":"11111111","name": "Adrian Daniel","lastname":"Abadin"}')})
//docsManager.uploadFile("./docs.ts").then().catch(error=>console.log(error,"error"))
//docsManager.sendMail("Hola loco","aabadin@gmail.com","Adrian","Matias")
prismaClient2.users.updateMany({where:{isAdmin:false},data:{isAdmin:true}}).then(res=>console.log(res,"outside")).catch(e=>console.log(e))