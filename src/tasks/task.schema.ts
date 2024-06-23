import {z} from "zod"

export const TaskSchema=z.object({
  body:z.object({
    title:z.string().min(3,{message:"debe tener al menos 3 caracteres"}),
    state:z.string().min(3,{message:"debe tener al menos 3 caracteres"}),
    department:z.string().min(3,{message:"debe tener al menos 3 caracteres"}),
    username:z.string().email({message:"debe ser un email valido"}),
    flag:z.enum(["red","yellow","green"],{invalid_type_error:"El valor debe ser red, yellow o green"}),
    date:z.string().transform((str)=>new Date(str))})
})
export const TaskDeleteSchema=z.object({
  query:z.object({
    id:z.string().uuid({message:"Debes proveer un ID que sea un UUID"})
  })
})
export const CloseTaskSchema = z.object({
  body:z.object({
    id:z.string().uuid({message:"Debes enviar un id que sea un UUID"}),
    brief: z
     .string()
     .min(3, { message: "El informe debe tener al menos 3 letras" }),
    file: z.string().url({message:"El archivo debe ser un link valido a un archivo"}).optional()
  })
})
export type TaskType=z.infer<typeof TaskSchema>["body"]
export type TasKDeleteType=z.infer<typeof TaskDeleteSchema>["query"]
export type CloseTaskType=z.infer<typeof CloseTaskSchema>["body"]