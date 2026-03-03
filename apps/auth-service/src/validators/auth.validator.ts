import { z } from 'zod';

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email('Email invalide').optional(),
      phone: z.string().min(8, 'Numéro invalide').optional(),
      password: z.string().min(6, 'Mot de passe trop court'),
      subdomain: z.string().min(2, 'Subdomain requis'),
    })
    .refine((data) => data.email || data.phone, {
      message: 'Email ou téléphone requis',
    }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, 'Minimum 8 caractères'),
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    role: z.enum([
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'librarian',
    ]),
    gender: z.enum(['male', 'female', 'other']).optional(),
    date_of_birth: z.string().optional(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token requis'),
  }),
});
