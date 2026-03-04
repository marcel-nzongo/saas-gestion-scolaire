import { z } from 'zod';

export const createStudentSchema = z.object({
  body: z.object({
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    date_of_birth: z.string().optional(),
    class_id: z.string().uuid('Classe invalide').optional(),
    enrollment_date: z.string().optional(),
    student_code: z.string().optional(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    date_of_birth: z.string().optional(),
    class_id: z.string().uuid().optional(),
    enrollment_status: z
      .enum(['active', 'graduated', 'dropped', 'transferred'])
      .optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID invalide'),
  }),
});

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nom de classe requis'),
    academic_year_id: z.string().uuid('Année scolaire requise'),
    teacher_id: z.string().uuid().optional(),
    level: z.string().optional(),
    section: z.string().optional(),
    max_capacity: z.number().min(1).max(100).optional(),
    room: z.string().optional(),
  }),
});

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nom de matière requis'),
    code: z.string().optional(),
    color: z.string().optional(),
    default_coefficient: z.number().min(0.5).max(10).optional(),
  }),
});

export const createAcademicYearSchema = z.object({
  body: z.object({
    name: z.string().min(4, 'Nom requis (ex: 2025-2026)'),
    start_date: z.string().min(1, 'Date de début requise'),
    end_date: z.string().min(1, 'Date de fin requise'),
    grading_system: z.enum(['20', '100', 'GPA', 'letter']).optional(),
  }),
});
