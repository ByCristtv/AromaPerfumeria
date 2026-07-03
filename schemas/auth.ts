/**
 * Auth form validation schemas (manual email/password flows).
 *
 * The storefront historically only offered Google OAuth. These schemas back the
 * manual registration + sign-in forms. They validate purely on the client for
 * fast UX; Supabase Auth + the `handle_new_user` trigger remain the source of
 * truth (the trigger seeds `public.profiles` with role 'customer').
 */

import { z } from "zod";

/** Shared password rule: long enough to be meaningful, capped to a sane length. */
const password = z
  .string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .max(72, { message: "La contraseña es demasiado larga" });

const email = z
  .string()
  .trim()
  .min(1, { message: "El correo es requerido" })
  .email({ message: "Correo electrónico inválido" })
  .transform((value) => value.toLowerCase());

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: "Ingresa tu nombre completo" })
      .max(100, { message: "Nombre demasiado largo" }),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export type RegisterFormValues = z.input<typeof registerSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
