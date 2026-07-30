import { z } from "zod";
import { isValidPhone } from "@/lib/validations/forms";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es requerido")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Los nombres deben tener al menos 2 caracteres")
      .max(50, "Los nombres no pueden exceder 50 caracteres"),
    lastName: z
      .string()
      .trim()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(80, "Los apellidos no pueden exceder 80 caracteres"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "El email es requerido")
      .email("Email inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña"),
    phone: z
      .string()
      .trim()
      .refine(isValidPhone, "Ingresa un teléfono válido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Los nombres deben tener al menos 2 caracteres")
    .max(50, "Los nombres no pueden exceder 50 caracteres"),
  lastName: z
    .string()
    .trim()
    .min(2, "Los apellidos deben tener al menos 2 caracteres")
    .max(80, "Los apellidos no pueden exceder 80 caracteres"),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, "Ingresa un teléfono válido"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["newPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es requerido")
    .email("Email inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
