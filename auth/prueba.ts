import { z } from "zod";
import { SignUpSchema } from "./auth.schema";
const bodyShape = SignUpSchema.shape.body
     //   const parsedSchema= z.object({...bodyShape})
const response =bodyShape.safeParse({username:"aabadin@gmail.com",lastname:"fwssssefw",password:"ssssssss",name:"Adrian"})
if (!response.success) response.error.issues.forEach(issue=> console.log(issue.path[0]," ",issue.message))
else console.log(response)