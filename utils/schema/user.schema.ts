import { z } from "zod";

export const RoleEnum = z.enum([
  "admin",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "delivery_staff",
  "customer",
]);

export const GenderEnum = z.enum(["male", "female", "other"]);

export const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(20, "name 20 character is allowed"),
  email: z.email("Invalid email address"),
  phone: z.string().min(7, "Invalid phone number").max(20, 'max 20 character is allowed'),
  gender: GenderEnum,
  role: RoleEnum,
  salary: z.number().min(1, "Salary is required"),
  image: z.string().nullable(),
});

export type AddUserFormValues = z.infer<typeof addUserSchema>;
