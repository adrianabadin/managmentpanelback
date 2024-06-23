import {z} from "zod"
export const itemSchema=z.object({
title:z.string().min(3,{message:"El titulo debe tener al menos 3 caracteres"}),
description:z.string().min(3,{message:"La descripcion debe tener al menos 3 caracteres"})
})
export const itemRequestSchema= z.object({
    body:itemSchema
})
export const fodaSchema= z.object({
    body:z.object({
        strengths:z.array(itemSchema).optional(),
        oportunities:z.array(itemSchema).optional(),
        weakneses:z.array(itemSchema).optional(),
        menaces:z.array(itemSchema).optional(),
        state:z.string().min(3,{message:"State must be a string at least 3 carachters long"}).optional(),
        service:z.string().min(3,{message:"Service must be a string at least 3 carachters long"}).optional(),
        strategySO:z.array(itemSchema).optional(),
        strategySM: z.array(itemSchema).optional(),
        strategyWO:z.array(itemSchema).optional(),
        strategyWM:z.array(itemSchema).optional()
    })
})
export const memberSchema=z.object({
    query:z.object({
        state:z.string().min(3,{message:"State must have at least 3 characters"}).optional(),
        service:z.string().min(3,{message:"Service must have at least 3 characters"}).optional(),
    }).refine(({service,state})=>{
        if (service ===undefined && state ===undefined) return false
        else return true
    },{message:"One of the items must be defined"})
})
export const removeMemberSchema = z.object({
    query:z.object({
        member:z.enum(["strengths","menace","weakness","oportunity"]),
        title:z.string().min(3,{message:"Title must have at least 3 characters"}),
        state:z.string().min(3,{message:"State must have at least 3 characters"	}),
        service:z.string().min(3,{message:"State must have at least 3 characters"	})
    }).refine(({service,state})=>{
        if (service === undefined && state===undefined) return false
        else return true
    },{message:"Must provide a service or a state"})
        
    
})

export type Member = z.infer<typeof memberSchema>
export type FODA =  z.infer<typeof fodaSchema>
export type RemoveMember = z.infer<typeof removeMemberSchema>
export type Item=z.infer<typeof itemRequestSchema>