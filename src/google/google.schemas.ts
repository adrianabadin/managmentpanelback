import {z} from 'zod'

export const documentCreateSchema= z.object({
    body:z.object({
        title:z.string().min(3,{message:"El titulo debe tener al menos 3 letras"}),
        text:z.string().min(3,{message:"El texto debe tener al menos 3 letras"}),
        user:z.string().email({message:"Debes proveer un email valido"})
    })
    
})
export const mailSchema = z.object({
   body:z.object({ to:z.string().email({message:"Debes proveer un mail de destino valido"}),
    autor:z.string({required_error:"Debes proveer un nombre de remitente"}),
    nombre:z.string({required_error:"Debes proveer un nombre de destinatario"}),
    body:z.string({required_error:"Debes proveer el cuerpo del mensaje"})
})
})
export type Mail = z.infer<typeof mailSchema>["body"]
export type DocumentCreateType=z.infer<typeof documentCreateSchema>["body"]