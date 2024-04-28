import {z} from "zod"
export const newKindOfIssue=z.object({
    body:z.object({
        name: z.string({required_error:"Debes proveer una cadena para name"}).min(3, { message: "Debe tener al menos 3 caracteres" }),
        text: z.string({required_error:"Debes proveer una cadena para text"}).min(3, { message: "Debe tener al menos 3 caracteres" }),

    },{required_error:"Debes enviar un body con un campo name y uno text para este metodo"})    
      });

export type NewKindOfIssue = z.infer<typeof newKindOfIssue>["body"]
export const filesDescriptor = z.object({
    driveId: z.string({ required_error: "El campo es obligatorio" }),
    name: z
      .string({ required_error: "El campo es obligatorio" })
      .min(3, "El nombre del archivo debe tener al menos 3 letras"),
    description: z.string({ required_error: "El campo es obligatorio" }).min(3, {
      message: "La descripcion del archivo debe contener al menos 3 caracteres",
    }),
  });
export const userIssue = z
  .object({
    body:z.object({
    email: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (value === undefined || value === "") return true;
          else {
            const prueba = z.string().email();
            const response = prueba.safeParse(value);
            if (response.success) return true;
            else return false;
          }
        },
        { message: "Debes proveer un email valido o nada" }
      ),
    name: z
      .string({ required_error: "El campo es obligatorio" })
      .min(3, { message: "El nombre debe tener al menos 3 letras" }),
    lastName: z
      .string({ required_error: "El campo es obligatorio" })
      .min(3, { message: "El apellido debe tener al menos 3 letras" }),
    socialSecurityNumber: z
      .string({ required_error: "El campo es obligatorio" })
      .regex(/^[0-9]{7,8}$/, {
        message:
          "El DNI debe contar con 7 a 8 caracteres numericos sin simbolos especiales",
      }),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (value === undefined || value === "") return true;
          console.log(value);
          if (value.length < 10) return false;
          let bool: boolean = true;
          value.split("").forEach((character) => {
            console.log(
              character,
              parseInt(character),
              Number.isNaN(parseInt(character))
            );
            if (Number.isNaN(parseInt(character))) bool = false;
          });
          return bool;
        },
        { message: "Deben ser 10 digitos o ningun valor" }
      )
      .optional(),
    state: z
      .string({ required_error: "El campo es obligatorio" })
      .min(3, { message: "El partido debe contener al menos 3 caracteres" }),
    kind: z.string({ required_error: "El campo es obligatorio" }).min(3, {
      message: "El tipo de solicitud debe contener al menos 3 caracteres",
    }),
    description: z
      .string({ required_error: "El campo es obligatorio" })
      .min(3, {
        message: "La descripcion debe contener al menos 3 caracteres",
      }),
    files: z.array(filesDescriptor).optional()
}).refine(
    (values) => {
      if (
        (values.email === undefined || values.email === "") &&
        (values.phone === undefined || values.phone === "")
      )
        return false;
      else return true;
    },
    {
      path: ["body"],
      message: "Debes ingresar un telefono o un mail para contacto",
    }
  )

  })

export const interventionSchema=z.object({
  body:z.object({
    id:z.string({required_error:"Debes proveer el id de la gestion"}),
    description:z.string({required_error:"Debes proveer una descripcion"}).min(10,{message:"La descripcion de tu intervencion debe tener al menos 10 letras"}),
    files:z.array(filesDescriptor).optional()
  })
})  
export type  Intervention= z.infer<typeof interventionSchema>["body"]
export type UserIssue = z.infer<typeof userIssue>["body"]
export type FilesDescriptor = z.infer<typeof filesDescriptor>
