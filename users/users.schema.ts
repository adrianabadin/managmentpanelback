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

/**
 * TYPES
 */

export type SetAdminType =z.infer<typeof setAdminSchema>
export type DepartmentType =z.infer<typeof departmentSchema>
export type DepartmentsType =z.infer<typeof departmentsSchema>