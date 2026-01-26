import {z} from "zod"
/**
 * SCHEMAS
 */
export const departmentSchema=z.object({
   query:z.object({ name:z.string().min(3,"El nombre debe tener al menos 3 caracteres")})
})
export const departmentsSchema=z.object({
    body:z.object({ name:z.array( z.string().min(3,"El nombre debe tener al menos 3 caracteres"))})
})

export const setAdminSchema=z.object({
    params:z.object({id:z.string().uuid({message:"El id debe ser un UUID"})})
})
export const changePasswordSchema=z.object({
    body:z.object({
        username:z.string({invalid_type_error:"Debes enviar una cadena",description:"Debes enviar una cadena",required_error:"El nombre de usuario es obligatorio"}).email({message:"Debes enviar un mail valido"}),
        password:z.string({invalid_type_error:"Debes enviar una cadena",required_error:"La nueva clave es obligatoria"}).min(3,"La clave debe tener al menos 6 caracteres"),
        token:z.string({invalid_type_error:"Debes enviar una cadena",required_error:"El token es obligatorio"})
    })
})

/**
 * TYPES
 */
export type ChangePasswordType =z.infer<typeof changePasswordSchema>
export type SetAdminType =z.infer<typeof setAdminSchema>
export type DepartmentType =z.infer<typeof departmentSchema>
export type DepartmentsType =z.infer<typeof departmentsSchema>