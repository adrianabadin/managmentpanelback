import {z} from "zod"

export const departmentSchemaCreate=z.object({
    body:z.object({
        name:z.string().min(3,{message:"El nombre debe tener al menos 3 caracteres"}),
        description:z.string().min(3,{message:"La descripcion debe tener al menos 3 caracteres"})
    })
})

export type departmentCreateType= z.infer<typeof departmentSchemaCreate>

