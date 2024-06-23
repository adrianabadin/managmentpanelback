/**
 * model Demography {
  id             String           @id @default(uuid())
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  state          String           @unique
  cities         Cities[]
  population     Int
  description    String           @db.LongText
  politics       String           @db.LongText
  golds          Golds[]
  Agreements     Agreements[]
  throbleshuting Throbleshuting[]
}
 */

import {z} from "zod"

export const DemographySchema=z.object({
    body: z.object({
        state:z.string().min(3,{message:"El minimo de caracteres es de 3"}),
        population:z.number({invalid_type_error:"Debe ser un numero"}),
        politics:z.string().min(1,{message:"El minimo de caracteres es de 3"}),
        description:z.string().min(3,{message:"El minimo de caracteres es de 3"}),
    })
})

export type DemographyType=z.infer<typeof DemographySchema>
