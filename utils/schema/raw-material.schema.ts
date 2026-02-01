import { z } from "zod";




export const addRawMaterialsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price : z.number().min(0, "price is necessary"),
  quantity : z.number().min(0, "quantity is necessary"),
  unit: z.string().min(1, "unit is necessary"),
});


export const addRawMaterialsListSchema = z.object({
  materials: z.array(addRawMaterialsSchema).min(1, "At least one material is required"),
});

export type AddRawMaterialsList = z.infer<typeof addRawMaterialsListSchema>;

export type AddRawMaterials = z.infer<typeof addRawMaterialsSchema>;
